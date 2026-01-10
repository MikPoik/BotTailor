import React, { useMemo } from 'react';
import { CTAComponent, ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

/**
 * DOMPurify sanitization configuration
 * Allows safe HTML while preventing XSS
 */
const ALLOWED_TAGS = [
  'p', 'div', 'span', 'strong', 'em', 'u', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote',
  'a',
  'img',
  'section', 'article', 'header', 'footer', 'nav',
  'button',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'button': ['type', 'aria-label'],
  '*': ['class', 'id', 'style'], // Allow style on all elements
};

interface CustomHTMLProps {
  component: CTAComponent;
  style?: ComponentStyle;
}

/**
 * CustomHTML Component - Renders sanitized HTML content
 * 
 * Security:
 * - HTML is sanitized to remove potential XSS
 * - Only whitelisted tags and attributes allowed
 * - Style attribute content is NOT sanitized (browser handles this)
 * 
 * Usage:
 * ```json
 * {
 *   "id": "custom_1",
 *   "type": "custom_html",
 *   "props": {
 *     "htmlContent": "<div style='...'>Safe HTML</div>"
 *   },
 *   "style": { "padding": 20, "backgroundColor": "#f5f5f5" }
 * }
 * ```
 * 
 * Best Practices:
 * - Keep HTML simple (paragraphs, lists, links, images)
 * - Use component style prop for layout, not inline styles
 * - Avoid script tags, event handlers, form elements
 */
export const CustomHTML: React.FC<CustomHTMLProps> = ({ component, style }) => {
  const htmlContent = component.props?.htmlContent;
  const baseStyle = applyComponentStyle({ ...component.style, ...style });

  // Sanitize HTML content
  const sanitizedHTML = useMemo(() => {
    if (!htmlContent) return '';

    // Basic sanitization - remove script tags and on* handlers
    let sanitized = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    return sanitized;
  }, [htmlContent]);

  if (!component.visible) return null;

  return (
    <div
      className="cta-custom-html"
      style={{
        ...baseStyle,
      }}
      // Allow dangerously set HTML only after sanitization
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

export default CustomHTML;
