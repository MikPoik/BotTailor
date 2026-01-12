import { memo } from "react";
import { MultiselectMenuMetadata } from "@/types/message-metadata";

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

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option: any, index: number) => {
        const label = option.text || option.label || option.id;
        return (
          <button
            type="button"
            key={`multiselect-option-${option.id}-${index}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              // Fire immediately - stateless like quick reply
              onOptionSelect(option.id, option.payload, label);
            }}
            className="px-3 py-1 text-sm rounded-full transition-colors"
            style={{
              backgroundColor: colors.messageBubbleBg,
              color: colors.textColor,
              border: `1px solid ${colors.textColor}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryColor;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.messageBubbleBg;
              e.currentTarget.style.color = colors.textColor;
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});

export default MultiselectMessage;

