import { memo, useState, useEffect } from "react";
import { MenuMetadata } from "@/types/message-metadata";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MenuMessageProps {
  metadata: MenuMetadata;
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

export const MenuMessage = memo(function MenuMessage({ 
  metadata, 
  onOptionSelect,
  themeColors
}: MenuMessageProps) {
  // Default colors if not provided
  const defaultColors = {
    primaryColor: 'hsl(213, 93%, 54%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
    textColor: 'hsl(20, 14.3%, 4.1%)',
    messageBubbleBg: 'hsl(0, 0%, 95%)'
  };
  const colors = themeColors || defaultColors;
  
  // Normalize options to an array defensively (handles object-shaped payloads)
  const rawOptions: any = (metadata && (metadata as any).options) || [];
  const options = Array.isArray(rawOptions)
    ? rawOptions
    : (rawOptions && typeof rawOptions === 'object')
      ? Object.values(rawOptions)
      : [];

  // State for "Other" option with text input
  const [selectedOtherId, setSelectedOtherId] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    console.log('[MenuMessage] mounted/updated', { optionCount: options.length, timestamp: Date.now() });
    return () => {
      console.log('[MenuMessage] UNMOUNTING', { optionCount: options.length, timestamp: Date.now() });
    };
  }, [options.length]);

  if (process.env.NODE_ENV === "development") {
    console.log("[MenuMessage] render", { 
      optionCount: options.length,
      selectedOtherId 
    });
  }

  return (
    <div className="space-y-2">
      {options.map((option: any, index: number) => {
        const label = option.text || option.label || option.id;
        const isOther = isOtherOption(option);
        const isThisOtherSelected = selectedOtherId === option.id;

        return (
          <div key={`menu-option-${option.id}-${index}`}>
            <button
              type="button"
              onClick={(e) => {
                console.log('[MenuMessage] option clicked', { 
                  optionId: option.id, 
                  label,
                  isOther 
                });
                e.preventDefault();
                e.stopPropagation();
                if (isOther) {
                  // Show input field for "Other" option
                  setSelectedOtherId(option.id);
                } else {
                  // Normal option - fire immediately
                  onOptionSelect(option.id, option.payload, label);
                }
              }}
              className="w-full text-left py-1 px-4 border rounded-lg transition-colors flex items-center space-x-2"
              style={{
                backgroundColor: isThisOtherSelected
                  ? colors.primaryColor + "10"
                  : colors.messageBubbleBg,
                color: colors.textColor,
                borderColor: isThisOtherSelected
                  ? colors.primaryColor
                  : colors.textColor + "40",
                fontSize: "0.9rem",
              }}
              onMouseEnter={(e) => {
                if (!isThisOtherSelected) {
                  e.currentTarget.style.backgroundColor = colors.primaryColor;
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = colors.primaryColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isThisOtherSelected) {
                  e.currentTarget.style.backgroundColor = colors.messageBubbleBg;
                  e.currentTarget.style.color = colors.textColor;
                  e.currentTarget.style.borderColor = colors.textColor + "40";
                }
              }}
              disabled={isThisOtherSelected}
            >
              {option.icon && (
                <i
                  className={`${option.icon}`}
                  style={{ color: "inherit" }}
                ></i>
              )}
              <span>{label}</span>
            </button>

            {isOther && isThisOtherSelected && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otherText.trim()) {
                    console.log("[MenuMessage] other text submitted", { 
                      optionId: option.id,
                      text: otherText 
                    });
                    onOptionSelect(
                      option.id,
                      { freeText: otherText.trim() },
                      otherText.trim(),
                    );
                  }
                }}
                className="mt-2 flex gap-2"
              >
                <Input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder=""
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={!otherText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default MenuMessage;
