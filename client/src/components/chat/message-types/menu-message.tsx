import { memo } from "react";
import { MenuMetadata } from "@/types/message-metadata";
import { Send } from "lucide-react";

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

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option: any, index: number) => {
        const label = option.text || option.label || option.id;
        return (
          <button
            type="button"
            key={`menu-option-${option.id}-${index}`}
            onClick={(e) => {
              console.log('[MenuMessage CLICK]', { optionId: option.id, label, timestamp: Date.now() });
              e.preventDefault();
              e.stopPropagation();
              // Fire immediately - no state, no delays, matches quick reply pattern
              onOptionSelect(option.id, option.payload, label);
              console.log('[MenuMessage CLICK] After onOptionSelect', { timestamp: Date.now() });
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

export default MenuMessage;
