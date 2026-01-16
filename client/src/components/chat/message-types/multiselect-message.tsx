import { memo, useState } from "react";
import { Check, Send } from "lucide-react";
import { MultiselectMenuMetadata } from "@/types/message-metadata";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MultiselectMessageProps {
  metadata: MultiselectMenuMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  themeColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    messageBubbleBg: string;
  };
}

// Helper to detect "Other" option
const isOtherOption = (option: any): boolean => {
  if (!option) return false;
  return option.id === "q_other" || option.id === "other";
};

export const MultiselectMessage = memo(function MultiselectMessage({ 
  metadata, 
  onOptionSelect,
  themeColors
}: MultiselectMessageProps) {
  // Default colors if not provided
  const defaultColors = {
    primaryColor: 'hsl(213, 93%, 54%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
    textColor: 'hsl(20, 14.3%, 4.1%)',
    messageBubbleBg: 'hsl(0, 0%, 95%)'
  };
  const colors = themeColors || defaultColors;
  
  // Normalize options defensively
  const rawOptions: any = (metadata && (metadata as any).options) || [];
  const options = Array.isArray(rawOptions)
    ? rawOptions
    : (rawOptions && typeof rawOptions === 'object')
      ? Object.values(rawOptions)
      : [];

  const minSelections = metadata.minSelections || 1;
  const maxSelections = metadata.maxSelections || options.length || 999;

  // Inline state for multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  const toggleSelection = (optionId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else if (prev.length < maxSelections) {
        return [...prev, optionId];
      }
      return prev;
    });
  };

  const hasOtherSelected = selectedIds.some((id) => {
    const opt = options.find((o: any) => o.id === id);
    return isOtherOption(opt);
  });

  const canSubmit =
    selectedIds.length >= minSelections &&
    selectedIds.length <= maxSelections &&
    (!hasOtherSelected || otherText.trim());

  // ...existing code...

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {options.map((option: any, index: number) => {
          const label = option.text || option.label || option.id;
          const isSelected = selectedIds.includes(option.id);
          const isOther = isOtherOption(option);

          return (
            <div key={`multiselect-option-${option.id}-${index}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("[MultiselectMessage] option clicked", {
                    optionId: option.id,
                    label,
                    currentlySelected: isSelected,
                  });
                  toggleSelection(option.id);
                }}
                className="w-full text-left py-3 px-4 border rounded-lg transition-colors flex items-center space-x-3"
                style={{
                  backgroundColor: isSelected
                    ? colors.primaryColor + "10"
                    : colors.messageBubbleBg,
                  color: isSelected ? colors.primaryColor : colors.textColor,
                  borderColor: isSelected
                    ? colors.primaryColor
                    : colors.textColor + "40",
                  fontSize: "0.9rem",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      colors.primaryColor + "20";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      colors.messageBubbleBg;
                  }
                }}
              >
                <div
                  className="w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected
                      ? colors.primaryColor
                      : "transparent",
                    borderColor: isSelected
                      ? colors.primaryColor
                      : colors.textColor + "40",
                  }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                {option.icon && (
                  <i
                    className={`${option.icon}`}
                    style={{ color: "inherit" }}
                  ></i>
                )}
                <span>{label}</span>
              </button>

              {isOther && isSelected && (
                <div className="mt-2 ml-8">
                  <Input
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify..."
                    className="w-full"
                    autoFocus
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: colors.textColor + "20" }}
      >
        <span
          className="text-sm"
          style={{ color: colors.textColor, opacity: 0.7 }}
        >
          {selectedIds.length} / {maxSelections} selected
        </span>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (canSubmit) {
              const selectedOptions = selectedIds.map((id) => {
                const opt = options.find((o: any) => o.id === id);
                if (isOtherOption(opt) && otherText.trim()) {
                  return { id, text: otherText.trim() };
                }
                return { id, text: opt?.text || opt?.label || id };
              });

              const payload = {
                selected_options: selectedIds,
                selected_options_with_text: selectedOptions,
                selection_count: selectedIds.length,
                other_text: hasOtherSelected ? otherText.trim() : undefined,
              };

              const displayText = selectedOptions.map((o) => o.text).join(", ");
              onOptionSelect("multiselect_submit", payload, displayText);
            }
          }}
          disabled={!canSubmit}
          size="sm"
        >
          <Send className="h-4 w-4 mr-1" />
        </Button>
      </div>
    </div>
  );
});

export default MultiselectMessage;

