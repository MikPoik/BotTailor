import type { AIResponse } from "../ai-response-schema";

/**
 * Dynamic content expectation metadata
 */
export interface DynamicContentExpectation {
  expectedMenuOptions?: number;
  expectedQuickReplies?: number;
  expectedInteractiveElements?: number;
  contentIntent?: string; // What the AI intends to present
  completionRequired?: boolean; // Whether all elements must be present
}

/**
 * Dynamic content validation result
 */
export interface DynamicContentValidationResult {
  isValid: boolean;
  isComplete: boolean;
  expectations?: DynamicContentExpectation;
  actualContent: {
    menuOptions: number;
    quickReplies: number;
    interactiveElements: number;
  };
  errors: string[];
  warnings: string[];
  needsRegeneration: boolean;
  truncatedContent?: boolean;
}

/**
 * Validate dynamic content expectations against actual generated content
 */
export function validateDynamicContent(
  response: AIResponse,
  sessionContext?: any
): DynamicContentValidationResult {
  const result: DynamicContentValidationResult = {
    isValid: true,
    isComplete: true,
    actualContent: {
      menuOptions: 0,
      quickReplies: 0,
      interactiveElements: 0
    },
    errors: [],
    warnings: [],
    needsRegeneration: false
  };

  // Extract expectations from first bubble's metadata
  const expectations = extractExpectations(response.bubbles);
  if (expectations) {
    result.expectations = expectations;
  }

  // Count actual content
  const actualContent = countActualContent(response.bubbles);
  result.actualContent = actualContent;

  // Validate expectations vs reality
  if (expectations) {
    validateExpectations(expectations, actualContent, result);
  }

  // Check for truncation indicators
  checkForTruncation(response.bubbles, result);

  // Check for incomplete interactive patterns
  checkInteractivePatterns(response.bubbles, result);

  // Determine overall validity
  result.isValid = result.errors.length === 0;
  result.isComplete = result.isValid && !result.truncatedContent;
  result.needsRegeneration = !result.isComplete || result.errors.length > 0;

  logValidationResult(result);
  
  return result;
}

/**
 * Extract expectations from bubble metadata
 */
function extractExpectations(bubbles: any[]): DynamicContentExpectation | null {
  // Look for expectation metadata in any bubble (usually first text bubble)
  for (const bubble of bubbles) {
    const metadata = bubble.metadata;
    if (metadata && (
      metadata.expectedMenuOptions || 
      metadata.expectedQuickReplies || 
      metadata.expectedInteractiveElements ||
      metadata.contentIntent
    )) {
      return {
        expectedMenuOptions: metadata.expectedMenuOptions,
        expectedQuickReplies: metadata.expectedQuickReplies,
        expectedInteractiveElements: metadata.expectedInteractiveElements,
        contentIntent: metadata.contentIntent,
        completionRequired: metadata.completionRequired ?? true
      };
    }
  }

  // Try to infer expectations from content patterns
  return inferExpectationsFromContent(bubbles);
}

/**
 * Infer expectations from content patterns when not explicitly declared
 * Uses language-agnostic structural analysis instead of hardcoded keywords
 */
function inferExpectationsFromContent(bubbles: any[]): DynamicContentExpectation | null {
  // Look for structural patterns that suggest interactive content is coming
  const textBubbles = bubbles.filter(b => b.messageType === 'text');
  
  for (const bubble of textBubbles) {
    const content = (bubble.content || '');
    
    // Pattern: Question ending with colon (suggests options coming)
    if (content.includes('?') && content.trim().endsWith(':')) {
      // Be flexible about the interactive modality: menu, quick replies, or form.
      // Instead of forcing a menu, require a reasonable number of interactive elements.
      return {
        expectedInteractiveElements: 3, // Typical number for simple choices
        contentIntent: 'interactive_choice',
        completionRequired: true
      };
    }
    
    // Pattern: Multiple question marks or choice indicators
    // Note: Removed aggressive expectation setting for multiple questions
    // Let the AI choose appropriate interaction type (menu vs quickReplies)
    
    // Pattern: Content ending with colon suggests list/menu follows
    // DISABLED: Too aggressive, causes false positives
    // Only infer expectations when AI explicitly sets metadata
    // if (content.trim().endsWith(':') && content.length > 20) {
    //   return {
    //     expectedMenuOptions: 4,
    //     contentIntent: 'list_menu',
    //     completionRequired: true
    //   };
    // }
  }
  
  return null;
}

/**
 * Count actual interactive content in bubbles
 */
function countActualContent(bubbles: any[]) {
  let menuOptions = 0;
  let quickReplies = 0;
  let interactiveElements = 0;

  for (const bubble of bubbles) {
    switch (bubble.messageType) {
      case 'menu':
      case 'multiselect_menu':
        const options = bubble.metadata?.options;
        if (Array.isArray(options)) {
          menuOptions += options.length;
          interactiveElements += options.length;
        }
        break;
        
      case 'quickReplies':
        const replies = bubble.metadata?.quickReplies;
        if (Array.isArray(replies)) {
          quickReplies += replies.length;
          interactiveElements += replies.length;
        }
        break;
        
      case 'card':
        const buttons = bubble.metadata?.buttons;
        if (Array.isArray(buttons)) {
          interactiveElements += buttons.length;
        }
        break;
        
      case 'form':
        const fields = bubble.metadata?.formFields;
        if (Array.isArray(fields)) {
          interactiveElements += fields.length;
        }
        break;
    }
  }

  return { menuOptions, quickReplies, interactiveElements };
}

/**
 * Validate expectations against actual content
 */
function validateExpectations(
  expectations: DynamicContentExpectation,
  actual: { menuOptions: number; quickReplies: number; interactiveElements: number },
  result: DynamicContentValidationResult
): void {
  // Validate menu options
  if (expectations.expectedMenuOptions !== undefined) {
    if (actual.menuOptions === 0) {
      result.errors.push(`Expected ${expectations.expectedMenuOptions} menu options but found none`);
    } else if (actual.menuOptions < expectations.expectedMenuOptions) {
      result.errors.push(`Expected ${expectations.expectedMenuOptions} menu options but only found ${actual.menuOptions}`);
    } else if (actual.menuOptions > expectations.expectedMenuOptions * 1.5) {
      result.warnings.push(`Expected ${expectations.expectedMenuOptions} menu options but found ${actual.menuOptions} (more than expected)`);
    }
  }

  // Validate quick replies
  if (expectations.expectedQuickReplies !== undefined) {
    if (actual.quickReplies === 0) {
      result.errors.push(`Expected ${expectations.expectedQuickReplies} quick replies but found none`);
    } else if (actual.quickReplies < expectations.expectedQuickReplies) {
      result.errors.push(`Expected ${expectations.expectedQuickReplies} quick replies but only found ${actual.quickReplies}`);
    }
  }

  // Validate overall interactive elements
  if (expectations.expectedInteractiveElements !== undefined) {
    if (actual.interactiveElements < expectations.expectedInteractiveElements) {
      result.errors.push(`Expected ${expectations.expectedInteractiveElements} interactive elements but only found ${actual.interactiveElements}`);
    }
  }
}

/**
 * Check for signs of truncated content
 */
function checkForTruncation(bubbles: any[], result: DynamicContentValidationResult): void {
  if (bubbles.length === 0) {
    result.errors.push('No bubbles generated - possible truncation');
    result.truncatedContent = true;
    return;
  }

  const lastBubble = bubbles[bubbles.length - 1];
  
  // Check for incomplete JSON patterns
  if (lastBubble.content && typeof lastBubble.content === 'string') {
    const content = lastBubble.content.trim();
    
    // Signs of truncation
    if (content.endsWith('...') || 
        content.endsWith(',') || 
        content.includes('...') && content.length < 10) {
      result.warnings.push('Content may be truncated - ellipsis or incomplete sentence detected');
      result.truncatedContent = true;
    }
  }

  // Check for incomplete metadata
  if (lastBubble.messageType === 'menu' && (!lastBubble.metadata?.options || lastBubble.metadata.options.length === 0)) {
    result.errors.push('Menu bubble missing options - likely truncated');
    result.truncatedContent = true;
  }

  if (lastBubble.messageType === 'quickReplies' && (!lastBubble.metadata?.quickReplies || lastBubble.metadata.quickReplies.length === 0)) {
    result.errors.push('QuickReplies bubble missing replies - likely truncated');
    result.truncatedContent = true;
  }
}

/**
 * Check for incomplete interactive patterns using language-agnostic structural analysis
 */
function checkInteractivePatterns(bubbles: any[], result: DynamicContentValidationResult): void {
  // Pattern: text with choice indicators but no interactive element follows
  for (let i = 0; i < bubbles.length - 1; i++) {
    const bubble = bubbles[i];
    if (bubble.messageType === 'text' && bubble.content) {
      const content = bubble.content;
      
      // Structural patterns that suggest choices (language-agnostic)
      const hasQuestionWithColon = content.includes('?') && content.includes(':');
      const hasMultipleQuestions = (content.match(/\?/g) || []).length >= 2;
      const endsWithColon = content.trim().endsWith(':');
      
      if ((hasQuestionWithColon || hasMultipleQuestions || endsWithColon) &&
          !hasInteractiveElementAfter(bubbles, i)) {
        result.warnings.push(`Text bubble suggests interactive choices but no menu/quickreplies found after it`);
      }
    }
  }
}

/**
 * Check if there's an interactive element after a given index
 */
function hasInteractiveElementAfter(bubbles: any[], afterIndex: number): boolean {
  for (let i = afterIndex + 1; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    if (['menu', 'multiselect_menu', 'quickReplies', 'card', 'form'].includes(bubble.messageType)) {
      return true;
    }
  }
  return false;
}

/**
 * Log validation results for debugging
 */
function logValidationResult(result: DynamicContentValidationResult): void {
  if (!result.isValid) {
    console.log(`[DYNAMIC VALIDATION] Result:`, {
      isValid: result.isValid,
      isComplete: result.isComplete,
      expectations: result.expectations,
      actual: result.actualContent,
      errors: result.errors,
      warnings: result.warnings,
      truncated: result.truncatedContent
    });
  }
}