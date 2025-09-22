import type { AIResponse } from "../ai-response-schema";
import { storage } from "../storage";

/**
 * Survey validation metadata for all question types
 */
export interface SurveyValidationMetadata {
  expectedMessageType: 'menu' | 'multiselect_menu' | 'rating';
  questionIndex: number;
  questionType: string;
  // Menu-specific metadata
  expectedOptionCount?: number;
  expectedOptions?: Array<{ id: string; text: string }>;
  minSelections?: number;
  maxSelections?: number;
  allowMultiple?: boolean;
  // Rating-specific metadata
  expectedMinValue?: number;
  expectedMaxValue?: number;
  expectedStep?: number;
  expectedRatingType?: 'stars' | 'numbers' | 'scale';
}

/**
 * Enhanced survey validation result
 */
export interface SurveyValidationResult {
  isValid: boolean;
  validationMetadata?: SurveyValidationMetadata;
  errors: string[];
  needsRegeneration: boolean;
  detectedBubble?: any;
}

/**
 * Enhanced validate survey requirements with detailed format checking for all question types
 */
export async function validateSurveyMenuRequirements(
  sessionId: string,
  validated: AIResponse
): Promise<SurveyValidationResult> {
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
    
    // Only validate questions that require specific bubble types (menu, multiselect_menu, rating)
    if (!requiresValidation(currentQuestion)) {
      return { isValid: true, errors: [], needsRegeneration: false };
    }

    // Build validation metadata based on question type
    const validationMetadata = buildValidationMetadata(currentQuestion, currentQuestionIndex);

    const errors: string[] = [];

    // 1. Check if required bubble exists
    const expectedBubbles = validated.bubbles.filter(
      (bubble) => bubble.messageType === validationMetadata.expectedMessageType
    );

    if (expectedBubbles.length === 0) {
      const description = getQuestionDescription(currentQuestion);
      errors.push(`Missing ${validationMetadata.expectedMessageType} bubble for ${description}`);
      console.error(`[SURVEY VALIDATION ERROR] Survey Q${currentQuestionIndex + 1} ${description} but NO ${validationMetadata.expectedMessageType} bubble generated!`);
      return {
        isValid: false,
        validationMetadata,
        errors,
        needsRegeneration: true
      };
    }

    // 2. Validate the bubble format
    const targetBubble = expectedBubbles[0]; // Take first matching bubble
    const bubbleValidation = validateBubbleFormat(targetBubble, validationMetadata);
    
    if (!bubbleValidation.isValid) {
      errors.push(...bubbleValidation.errors);
      console.error(`[SURVEY VALIDATION ERROR] Survey Q${currentQuestionIndex + 1} ${validationMetadata.expectedMessageType} validation failed:`, bubbleValidation.errors);
      return {
        isValid: false,
        validationMetadata,
        errors,
        needsRegeneration: true,
        detectedBubble: targetBubble
      };
    }

    console.log(`[SURVEY VALIDATION SUCCESS] Survey Q${currentQuestionIndex + 1} correctly generated and validated ${validationMetadata.expectedMessageType} bubble`);
    return {
      isValid: true,
      validationMetadata,
      errors: [],
      needsRegeneration: false,
      detectedBubble: targetBubble
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
  if (menuBubble.messageType !== metadata.expectedMessageType) {
    errors.push(`Expected ${metadata.expectedMessageType} but got ${menuBubble.messageType}`);
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
  const expectedTexts = metadata.expectedOptions?.map(opt => opt.text.toLowerCase().trim()) || [];
  const actualTexts = options.map((opt: any) => opt.text?.toLowerCase()?.trim() || '');
  
  const missingTexts = expectedTexts.filter(expected => 
    !actualTexts.some(actual => actual.includes(expected) || expected.includes(actual))
  );
  
  if (missingTexts.length > 0) {
    errors.push(`Missing or modified option texts: ${missingTexts.join(', ')}`);
  }

  // 6. For multiselect menus, validate multiselect-specific properties
  if (metadata.expectedMessageType === 'multiselect_menu') {
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
/**
 * Check if question requires validation
 */
function requiresValidation(question: any): boolean {
  return question && (
    (question.options && question.options.length > 0) || // Menu questions
    question.type === 'rating' // Rating questions
  );
}

/**
 * Build validation metadata for any question type
 */
function buildValidationMetadata(question: any, questionIndex: number): SurveyValidationMetadata {
  const baseMetadata = {
    questionIndex,
    questionType: question.type
  };

  switch (question.type) {
    case 'single_choice':
      return {
        ...baseMetadata,
        expectedMessageType: 'menu' as const,
        expectedOptionCount: question.options.length,
        expectedOptions: question.options.map((opt: any, index: number) => ({
          id: opt.id || `option${index + 1}`,
          text: opt.text
        }))
      };
      
    case 'multiple_choice':
      return {
        ...baseMetadata,
        expectedMessageType: 'multiselect_menu' as const,
        expectedOptionCount: question.options.length,
        expectedOptions: question.options.map((opt: any, index: number) => ({
          id: opt.id || `option${index + 1}`,
          text: opt.text
        })),
        allowMultiple: true,
        minSelections: question.minSelections || 1,
        maxSelections: question.maxSelections || question.options.length
      };
      
    case 'rating':
      return {
        ...baseMetadata,
        expectedMessageType: 'rating' as const,
        expectedMinValue: question.minValue || 1,
        expectedMaxValue: question.maxValue || 5,
        expectedStep: question.step || 1,
        expectedRatingType: question.ratingType || 'stars'
      };
      
    default:
      throw new Error(`Unsupported question type for validation: ${question.type}`);
  }
}

/**
 * Get description of question for error messages
 */
function getQuestionDescription(question: any): string {
  switch (question.type) {
    case 'single_choice':
      return `has ${question.options.length} single-choice options`;
    case 'multiple_choice':
      return `has ${question.options.length} multiple-choice options`;
    case 'rating':
      return `is a rating question (${question.minValue || 1}-${question.maxValue || 5} ${question.ratingType || 'stars'})`;
    default:
      return `is a ${question.type} question`;
  }
}

/**
 * Validate bubble format against expectations (menu, multiselect_menu, or rating)
 */
function validateBubbleFormat(
  bubble: any,
  metadata: SurveyValidationMetadata
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check message type matches expectation
  if (bubble.messageType !== metadata.expectedMessageType) {
    errors.push(`Expected ${metadata.expectedMessageType} but got ${bubble.messageType}`);
  }

  // 2. Type-specific validation
  switch (metadata.expectedMessageType) {
    case 'menu':
    case 'multiselect_menu':
      validateMenuBubble(bubble, metadata, errors);
      break;
    case 'rating':
      validateRatingBubble(bubble, metadata, errors);
      break;
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate menu and multiselect_menu bubbles
 */
function validateMenuBubble(
  bubble: any,
  metadata: SurveyValidationMetadata,
  errors: string[]
): void {
  // Check options exist and are properly formatted
  const options = bubble.metadata?.options;
  if (!options || !Array.isArray(options)) {
    errors.push('Menu bubble missing options array in metadata');
    return;
  }

  // Check option count matches expectation
  if (metadata.expectedOptionCount && options.length !== metadata.expectedOptionCount) {
    errors.push(`Expected ${metadata.expectedOptionCount} options but got ${options.length}`);
  }

  // Validate each option has required fields
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

  // Check if option texts match expected texts (fuzzy match for localization)
  if (metadata.expectedOptions) {
    const expectedTexts = metadata.expectedOptions.map(opt => opt.text.toLowerCase().trim());
    const actualTexts = options.map((opt: any) => opt.text?.toLowerCase()?.trim() || '');
    
    const missingTexts = expectedTexts.filter(expected => 
      !actualTexts.some(actual => actual.includes(expected) || expected.includes(actual))
    );
    
    if (missingTexts.length > 0) {
      errors.push(`Missing or modified option texts: ${missingTexts.join(', ')}`);
    }
  }

  // For multiselect menus, validate multiselect-specific properties
  if (metadata.expectedMessageType === 'multiselect_menu') {
    const bubbleMetadata = bubble.metadata;
    
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
}

/**
 * Validate rating bubbles
 */
function validateRatingBubble(
  bubble: any,
  metadata: SurveyValidationMetadata,
  errors: string[]
): void {
  const bubbleMetadata = bubble.metadata;
  
  if (!bubbleMetadata) {
    errors.push('Rating bubble missing metadata');
    return;
  }

  // Validate minValue
  if (typeof bubbleMetadata.minValue !== 'number') {
    errors.push('Rating bubble missing minValue number');
  } else if (metadata.expectedMinValue && bubbleMetadata.minValue !== metadata.expectedMinValue) {
    errors.push(`Expected minValue ${metadata.expectedMinValue} but got ${bubbleMetadata.minValue}`);
  }

  // Validate maxValue  
  if (typeof bubbleMetadata.maxValue !== 'number') {
    errors.push('Rating bubble missing maxValue number');
  } else if (metadata.expectedMaxValue && bubbleMetadata.maxValue !== metadata.expectedMaxValue) {
    errors.push(`Expected maxValue ${metadata.expectedMaxValue} but got ${bubbleMetadata.maxValue}`);
  }

  // Validate ratingType
  const validRatingTypes = ['stars', 'numbers', 'scale'];
  if (!bubbleMetadata.ratingType) {
    errors.push('Rating bubble missing ratingType');
  } else if (!validRatingTypes.includes(bubbleMetadata.ratingType)) {
    errors.push(`Invalid ratingType '${bubbleMetadata.ratingType}'. Expected: ${validRatingTypes.join(', ')}`);
  } else if (metadata.expectedRatingType && bubbleMetadata.ratingType !== metadata.expectedRatingType) {
    errors.push(`Expected ratingType '${metadata.expectedRatingType}' but got '${bubbleMetadata.ratingType}'`);
  }

  // Validate step (optional but should be number if present)
  if (bubbleMetadata.step !== undefined) {
    if (typeof bubbleMetadata.step !== 'number') {
      errors.push('Rating bubble step must be a number');
    } else if (metadata.expectedStep && bubbleMetadata.step !== metadata.expectedStep) {
      errors.push(`Expected step ${metadata.expectedStep} but got ${bubbleMetadata.step}`);
    }
  }

  // Validate value range makes sense
  if (typeof bubbleMetadata.minValue === 'number' && typeof bubbleMetadata.maxValue === 'number') {
    if (bubbleMetadata.minValue >= bubbleMetadata.maxValue) {
      errors.push(`Invalid rating range: minValue (${bubbleMetadata.minValue}) must be less than maxValue (${bubbleMetadata.maxValue})`);
    }
  }
}

// Legacy type exports for backward compatibility  
export type SurveyMenuValidationResult = SurveyValidationResult;
export type SurveyMenuValidationMetadata = SurveyValidationMetadata;
