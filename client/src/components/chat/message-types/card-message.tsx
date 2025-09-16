import { memo } from "react";
import { Button } from "@/components/ui/button";
import { CardMetadata } from "@/types/message-metadata";

interface CardMessageProps {
  content: string;
  metadata: CardMetadata;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
}

export const CardMessage = memo(function CardMessage({ 
  content, 
  metadata, 
  onOptionSelect 
}: CardMessageProps) {
  return (
    <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
      {metadata.imageUrl && (
        <img 
          src={metadata.imageUrl} 
          alt={metadata.title || "Card image"} 
          className="w-full h-32 object-cover"
        />
      )}

      <div className="p-3">
        {metadata.title && (
          <h4 className="font-semibold text-neutral-800 mb-2">{metadata.title}</h4>
        )}

        {metadata.description && (
          <p className="text-sm text-neutral-600 mb-3">{metadata.description}</p>
        )}

        {content && content !== metadata.title && (
          <p className="text-neutral-800 mb-3">{content}</p>
        )}

        {metadata.buttons && (
          <div className="space-y-2">
            {metadata.buttons.map((button, index) => (
              <Button
                key={`${button.id}-${index}`}
                variant="outline"
                size="sm"
                onClick={() => onOptionSelect(button.id, button.payload, button.text)}
                className="w-full justify-start text-left"
              >
                {button.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});