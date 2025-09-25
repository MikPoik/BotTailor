import { memo, useState } from "react";
import { MenuMetadata } from "@/types/message-metadata";
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MenuMessageProps {
  metadata: MenuMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
}

// Helper function to detect if an option is the "Other" option
const isOtherOption = (option: any): boolean => {
  if (!option) return false;
  
  // Check for the constant "q_other" ID (or legacy "other" for backward compatibility)
  return option.id === "q_other" || option.id === "other";
};

export const MenuMessage = memo(function MenuMessage({ 
  metadata, 
  onOptionSelect 
}: MenuMessageProps) {
  // Normalize options to an array defensively (handles object-shaped payloads)
  const rawOptions: any = (metadata && (metadata as any).options) || [];
  const options = Array.isArray(rawOptions)
    ? rawOptions
    : (rawOptions && typeof rawOptions === 'object')
      ? Object.values(rawOptions)
      : [];

  const [selectedOtherOption, setSelectedOtherOption] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if any option is an "Other" option (indicating allowFreeChoice is enabled)
  const hasOtherOption = options.some((option: any) => isOtherOption(option));

  const handleOtherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherText.trim() || !selectedOtherOption || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Send the actual free text instead of "Other"
      await onOptionSelect(selectedOtherOption, { freeText: otherText.trim() }, otherText.trim());
    } catch (error) {
      console.error('Error submitting other option:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionClick = (option: any) => {
    if (isOtherOption(option)) {
      setSelectedOtherOption(option.id);
      // Don't submit immediately, wait for user to enter text
    } else {
      // Normal option selection
      onOptionSelect(option.id, option.payload, option.text);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {options.map((option: any, index: number) => {
          const isCurrentOptionOther = isOtherOption(option);
          const isOtherSelected = selectedOtherOption === option.id;
          
          return (
            <div key={`${option.id}-${index}`}>
              <button
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left py-2 px-3 border rounded-lg transition-colors flex items-center space-x-2 menu-option-button hover:bg-neutral-50 ${
                  isOtherSelected ? 'border-primary bg-primary/5' : 'border-neutral-200'
                }`}
                disabled={isOtherSelected}
              >
                {option.icon && (
                  <i className={`${option.icon} text-primary`}></i>
                )}
                <span className="rich-message-text">{option.text}</span>
              </button>
              
              {isCurrentOptionOther && isOtherSelected && (
                <form onSubmit={handleOtherSubmit} className="mt-2 flex gap-2 px-2 sm:px-0">
                  <Input
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify..."
                    className="w-full"
                    autoFocus
                    disabled={isSubmitting}
                    data-testid="input-other-text"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!otherText.trim() || isSubmitting}
                    data-testid="button-submit-other"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
