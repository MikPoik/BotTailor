import React from "react";

interface EmbedHeaderProps {
  title?: string;
  subtitle?: string;
  primaryColor: string;
  onClose?: () => void;
}

export function EmbedHeader({ title, subtitle, primaryColor, onClose }: EmbedHeaderProps) {
  return (
    <div 
      className="embed-header"
      style={{ borderBottomColor: `${primaryColor}20` }}
    >
      <div className="embed-header-content">
        <div className="embed-header-text">
          {title && <h2 className="embed-header-title">{title}</h2>}
          {subtitle && <p className="embed-header-subtitle">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="embed-header-close"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
