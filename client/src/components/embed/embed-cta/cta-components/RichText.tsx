import React from 'react';
import { ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface RichTextProps {
  htmlContent?: string;
  style?: ComponentStyle;
}

/**
 * RichText Component - Renders custom HTML content
 * Allows for flexible, freeform content blocks
 */
export const RichText: React.FC<RichTextProps> = ({ htmlContent, style }) => {
  const baseStyle = applyComponentStyle(style);

  if (!htmlContent) return null;

  return (
    <div
      className="cta-richtext"
      style={{
        ...baseStyle,
        width: '100%',
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default RichText;
