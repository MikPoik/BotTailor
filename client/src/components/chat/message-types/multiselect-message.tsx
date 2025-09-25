import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Send } from "lucide-react";
import { MultiselectMenuMetadata } from "@/types/message-metadata";

interface MultiselectMessageProps {
  metadata: MultiselectMenuMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
}

// Helper function to detect if an option is the "Other" option
const isOtherOption = (option: any): boolean => {
  if (!option) return false;
  
  // Check for the constant "q_other" ID (or legacy "other" for backward compatibility)
  return option.id === "q_other" || option.id === "other";
};

export const MultiselectMessage = memo(function MultiselectMessage({ 
  metadata, 
  onOptionSelect 
}: MultiselectMessageProps) {
  // Normalize options defensively
  const rawOptions: any = (metadata && (metadata as any).options) || [];
  const options = Array.isArray(rawOptions)
    ? rawOptions
    : (rawOptions && typeof rawOptions === 'object')
      ? Object.values(rawOptions)
      : [];
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>(metadata.selectedOptions || []);
  const [otherText, setOtherText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const minSelections = metadata.minSelections || 1;
  const maxSelections = metadata.maxSelections || options.length || 999;

  const handleOptionToggle = (optionId: string, optionText: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else if (prev.length < maxSelections) {
        return [...prev, optionId];
      }
      return prev;
    });
  };

  // Check if "other" option is selected and has text
  const hasOtherSelected = selectedOptions.some(optionId => {
    const option = options.find((opt: any) => opt.id === optionId);
    return isOtherOption(option);
  });
  const isOtherTextRequired = hasOtherSelected && !otherText.trim();

  const handleMultiselectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOptions.length === 0 || isSubmitting || isSubmitted) return;
    
    // If "other" is selected but no text provided, prevent submission
    if (isOtherTextRequired) return;

    setIsSubmitting(true);

    try {
      // Get the text descriptions for selected options
      const selectedOptionsWithText = selectedOptions.map(optionId => {
        const option = options.find((opt: any) => opt.id === optionId);
        // If this is the "other" option and we have custom text, use that instead
        if (isOtherOption(option) && otherText.trim()) {
          return {
            id: optionId,
            text: otherText.trim()
          };
        }
        return {
          id: optionId,
          text: option?.text || `Option ${optionId}`
        };
      });

      const payload = {
        selected_options: selectedOptions, // Keep original format for compatibility
        selected_options_with_text: selectedOptionsWithText, // Add text descriptions
        selection_count: selectedOptions.length,
        other_text: hasOtherSelected ? otherText.trim() : undefined // Include other text if provided
      };

      // Create display text from selected option texts
      const selectedTexts = selectedOptionsWithText.map(option => option.text);
      
      await onOptionSelect(
        'multiselect_submit',
        payload,
        selectedTexts.join(', ')
      );

      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting multiselect:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((option: any, index: number) => {
          const isSelected = selectedOptions.includes(option.id);
          const isCurrentOptionOther = isOtherOption(option);

          return (
            <div key={`${option.id}-${index}`}>
              <button
                onClick={() => handleOptionToggle(option.id, option.text)}
                className={`w-full text-left py-2 px-3 border rounded-lg transition-colors flex items-center space-x-2 ${
                  isSelected 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
                data-testid={`option-${option.id}`}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                  isSelected ? 'bg-primary border-primary' : 'border-neutral-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                {option.icon && (
                  <i className={`${option.icon} ${isSelected ? 'text-primary' : ''}`}></i>
                )}
                <span className="rich-message-text" title={option.text || 'No text'}>
                  {option.text || `[EMPTY OPTION ${index}]`}
                </span>
              </button>
              
              {isCurrentOptionOther && isSelected && (
                <div className="mt-2 ml-6">
                  <Input
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify..."
                    className="w-full"
                    autoFocus
                    data-testid="input-multiselect-other-text"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>{selectedOptions.length} / {maxSelections} </span>
        <Button
          type="submit"
          onClick={handleMultiselectSubmit}
          disabled={selectedOptions.length === 0 || isSubmitting || isSubmitted || isOtherTextRequired}
          className="w-40 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          data-testid="button-submit-multiselect"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            </div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
});
