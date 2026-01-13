# Documentation for server/openai/dynamic-content-validator.ts

Dynamic content expectation metadata
/

 Dynamic content validation result
/

 Validate dynamic content expectations against actual generated content
/
Extract expectations from first bubble's metadata
Count actual content
Validate expectations vs reality
Check for truncation indicators
Check for incomplete interactive patterns
Determine overall validity

 Extract expectations from bubble metadata
/
Look for expectation metadata in any bubble (usually first text bubble)
Try to infer expectations from content patterns

 Infer expectations from content patterns when not explicitly declared
 Uses language-agnostic structural analysis instead of hardcoded keywords
/
Look for structural patterns that suggest interactive content is coming
Pattern: Question ending with colon (suggests options coming)
Be flexible about the interactive modality: menu, quick replies, or form.
Instead of forcing a menu, require a reasonable number of interactive elements.
Pattern: Multiple question marks or choice indicators
Note: Removed aggressive expectation setting for multiple questions
Let the AI choose appropriate interaction type (menu vs quickReplies)
Pattern: Content ending with colon suggests list/menu follows
DISABLED: Too aggressive, causes false positives
Only infer expectations when AI explicitly sets metadata
if (content.trim().endsWith(':') && content.length > 20) {
return {
expectedMenuOptions: 4,
contentIntent: 'list_menu',
completionRequired: true
};
}

 Count actual interactive content in bubbles
/

 Validate expectations against actual content
/
Validate menu options
Validate quick replies
Validate overall interactive elements

 Check for signs of truncated content
/
Check for incomplete JSON patterns
Signs of truncation
Check for incomplete metadata

 Check for incomplete interactive patterns using language-agnostic structural analysis
/
Pattern: text with choice indicators but no interactive element follows
Structural patterns that suggest choices (language-agnostic)

 Check if there's an interactive element after a given index
/

 Log validation results for debugging
/