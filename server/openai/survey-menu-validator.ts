import type { AIResponse } from "../ai-response-schema";
import { storage } from "../storage";

/**
 * Survey validation metadata for menu generation
 */
export interface SurveyMenuValidationMetadata {
  expectedMenuType: 'menu' | 'multiselect_menu';
  expectedOptionCount: number;
  expectedOptions: Array<{ id: string; text: string }>;
  questionIndex: number;
  questionType: string;
  minSelections?: number;
  maxSelections?: number;
  allowMultiple?: boolean;
}

/**
 * Enhanced survey menu validation result
 */
export interface SurveyMenuValidationResult {
  isValid: boolean;
  validationMetadata?: SurveyMenuValidationMetadata;
  errors: string[];
  needsRegeneration: boolean;
  detectedMenuBubble?: any;
}

/**
 * Enhanced validate survey menu requirements with detailed format checking
 */
export async function validateSurveyMenuRequirements(
  sessionId: string,
  validated: AIResponse
): Promise<SurveyMenuValidationResult> {
  try {
    const surveySession = await storage.getSurveySessionBySessionId(sessionId);
    if (!surveySession || surveySession.status !== 'active') {
      return { isValid: true, errors: [], needsRegeneration: false };
    }

    const survey = await storage.getSurvey(surveySession.surveyId);
    if (!survey) {
      return { isValid: true, errors: [], needsRegeneration: false };
    }

    const currentQuestionIndex = surveySession.currentQuestionIndex || 0;
    const questions = (survey.surveyConfig as any)?.questions;
    const currentQuestion = questions?.[currentQuestionIndex];
    
    // Only validate questions that have options
    if (!currentQuestion?.options?.length) {
      return { isValid: true, errors: [], needsRegeneration: false };
    }

    // Build validation metadata
    const expectedMenuType = getExpectedMenuType(currentQuestion);
    const validationMetadata: SurveyMenuValidationMetadata = {
      expectedMenuType,
      expectedOptionCount: currentQuestion.options.length,
      expectedOptions: currentQuestion.options.map((opt: any, index: number) => ({
        id: opt.id || `option${index + 1}`,
        text: opt.text
      })),
      questionIndex: currentQuestionIndex,
      questionType: currentQuestion.type,
      ...(expectedMenuType === 'multiselect_menu' && {
        allowMultiple: true,
        minSelections: currentQuestion.minSelections || 1,
        maxSelections: currentQuestion.maxSelections || currentQuestion.options.length
      })
    };

    const errors: string[] = [];

    // 1. Check if menu bubble exists
    const menuBubbles = validated.bubbles.filter(
      (bubble) => bubble.messageType === "menu" || bubble.messageType === "multiselect_menu"
    );

    if (menuBubbles.length === 0) {
      errors.push(`Missing ${expectedMenuType} bubble for question with ${currentQuestion.options.length} options`);
      console.error(`[SURVEY MENU ERROR] Survey Q${currentQuestionIndex + 1} has ${currentQuestion.options.length} options but NO choice bubble generated!`);
      return {
        isValid: false,
        validationMetadata,
        errors,
        needsRegeneration: true
      };
    }

    // 2. Validate the menu bubble format
    const menuBubble = menuBubbles[0]; // Take first menu bubble
    const menuValidation = validateMenuBubbleFormat(menuBubble, validationMetadata);
    
    if (!menuValidation.isValid) {
      errors.push(...menuValidation.errors);
      console.error(`[SURVEY MENU ERROR] Survey Q${currentQuestionIndex + 1} menu validation failed:`, menuValidation.errors);
      return {
        isValid: false,
        validationMetadata,
        errors,
        needsRegeneration: true,
        detectedMenuBubble: menuBubble
      };
    }

    console.log(`[SURVEY MENU SUCCESS] Survey Q${currentQuestionIndex + 1} correctly generated and validated ${expectedMenuType} bubble`);
    return {
      isValid: true,
      validationMetadata,
      errors: [],
      needsRegeneration: false,
      detectedMenuBubble: menuBubble
    };
    
  } catch (error) {
    console.error("[SURVEY MENU VALIDATION] Error checking survey menu:", error);
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      needsRegeneration: true
    };
  }
}

/**
 * Determine expected menu type based on question type
 */
function getExpectedMenuType(question: any): 'menu' | 'multiselect_menu' {
  switch (question.type) {
    case 'single_choice':
      return 'menu';
    case 'multiple_choice':
      return 'multiselect_menu';
    default:
      return 'menu'; // Default fallback
  }
}

/**
 * Validate individual menu bubble format against expectations
 */
function validateMenuBubbleFormat(
  menuBubble: any,
  metadata: SurveyMenuValidationMetadata
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check message type matches expectation
  if (menuBubble.messageType !== metadata.expectedMenuType) {
    errors.push(`Expected ${metadata.expectedMenuType} but got ${menuBubble.messageType}`);
  }

  // 2. Check options exist and are properly formatted
  const options = menuBubble.metadata?.options;
  if (!options || !Array.isArray(options)) {
    errors.push('Menu bubble missing options array in metadata');
    return { isValid: false, errors };
  }

  // 3. Check option count matches expectation
  if (options.length !== metadata.expectedOptionCount) {
    errors.push(`Expected ${metadata.expectedOptionCount} options but got ${options.length}`);
  }

  // 4. Validate each option has required fields
  options.forEach((option: any, index: number) => {
    if (!option.id) {
      errors.push(`Option ${index + 1} missing id field`);
    }
    if (!option.text) {
      errors.push(`Option ${index + 1} missing text field`);
    }
    if (!option.action) {
      errors.push(`Option ${index + 1} missing action field`);
    }
  });

  // 5. Check if option texts match expected texts (fuzzy match for localization)
  const expectedTexts = metadata.expectedOptions.map(opt => opt.text.toLowerCase().trim());
  const actualTexts = options.map((opt: any) => opt.text?.toLowerCase()?.trim() || '');
  
  const missingTexts = expectedTexts.filter(expected => 
    !actualTexts.some(actual => actual.includes(expected) || expected.includes(actual))
  );
  
  if (missingTexts.length > 0) {
    errors.push(`Missing or modified option texts: ${missingTexts.join(', ')}`);
  }

  // 6. For multiselect menus, validate multiselect-specific properties
  if (metadata.expectedMenuType === 'multiselect_menu') {
    const bubbleMetadata = menuBubble.metadata;
    
    if (bubbleMetadata.allowMultiple !== true) {
      errors.push('Multiselect menu missing allowMultiple: true');
    }
    
    if (typeof bubbleMetadata.minSelections !== 'number') {
      errors.push('Multiselect menu missing minSelections number');
    }
    
    if (typeof bubbleMetadata.maxSelections !== 'number') {
      errors.push('Multiselect menu missing maxSelections number');
    }
  }

  return { isValid: errors.length === 0, errors };
}