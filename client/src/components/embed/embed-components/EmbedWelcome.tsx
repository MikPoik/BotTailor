import React from "react";

interface EmbedWelcomeProps {
  message?: string;
  type: "text" | "form" | "buttons";
  primaryColor: string;
  onAction?: (action: string) => void;
}

export function EmbedWelcome({ message, type, primaryColor, onAction }: EmbedWelcomeProps) {
  if (!message) return null;

  return (
    <div className="embed-welcome-section">
      <div
        className="embed-welcome-message"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        {type === "text" && <p>{message}</p>}

        {type === "form" && (
          <div className="embed-welcome-form">
            <p>{message}</p>
            <input
              type="text"
              placeholder="Enter your message..."
              className="embed-welcome-input"
              style={{ borderColor: primaryColor }}
            />
          </div>
        )}

        {type === "buttons" && (
          <div className="embed-welcome-buttons">
            <p>{message}</p>
            <button
              className="embed-welcome-button"
              style={{ backgroundColor: primaryColor }}
              onClick={() => onAction?.("start")}
            >
              Start Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
