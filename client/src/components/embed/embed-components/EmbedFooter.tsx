import React from "react";

interface EmbedFooterProps {
  text?: string;
  branding?: string;
  primaryColor: string;
}

export function EmbedFooter({ text, branding, primaryColor }: EmbedFooterProps) {
  return (
    <div 
      className="embed-footer"
      style={{ borderTopColor: `${primaryColor}20` }}
    >
      <div className="embed-footer-content">
        {text && <p className="embed-footer-text">{text}</p>}
        {branding && <p className="embed-footer-branding">{branding}</p>}
      </div>
    </div>
  );
}
