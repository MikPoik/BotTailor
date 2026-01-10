import React, { useRef } from "react";
import { Loader, Send } from "lucide-react";

interface EmbedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isLoading: boolean;
  placeholder: string;
  primaryColor: string;
}

export function EmbedInput({
  value,
  onChange,
  onSend,
  disabled,
  isLoading,
  placeholder,
  primaryColor,
}: EmbedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="embed-input-area">
      <div className="embed-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="embed-input"
          style={{
            borderColor: primaryColor,
          }}
        />
        <button
          onClick={onSend}
          disabled={isLoading || !value.trim() || disabled}
          className="embed-send-button"
          style={{
            backgroundColor: primaryColor,
          }}
          title="Send message (Enter)"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
