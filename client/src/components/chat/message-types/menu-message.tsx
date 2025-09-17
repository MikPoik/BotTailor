import { memo } from "react";
import { MenuMetadata } from "@/types/message-metadata";

interface MenuMessageProps {
  metadata: MenuMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
}

export const MenuMessage = memo(function MenuMessage({ 
  metadata, 
  onOptionSelect 
}: MenuMessageProps) {
  // Debug logging to trace menu rendering
  console.log('[MENU MESSAGE FRONTEND] Rendering menu with metadata:', metadata);
  console.log('[MENU MESSAGE FRONTEND] Options count:', metadata?.options?.length || 0);
  console.log('[MENU MESSAGE FRONTEND] All options:', metadata?.options);
  console.log('[MENU MESSAGE FRONTEND] First option:', metadata?.options?.[0]);
  
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {metadata.options.map((option, index) => {
          console.log(`[MENU MESSAGE FRONTEND] Rendering option ${index}:`, option);
          return (
            <button
              key={`${option.id}-${index}`}
              onClick={() => onOptionSelect(option.id, option.payload, option.text)}
              className="w-full text-left py-2 px-3 border border-neutral-200 rounded-lg transition-colors flex items-center space-x-2 menu-option-button hover:bg-neutral-50"
            >
              {option.icon && (
                <i className={`${option.icon} text-primary`}></i>
              )}
              <span className="rich-message-text">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});