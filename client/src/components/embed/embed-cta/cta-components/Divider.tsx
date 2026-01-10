import React from 'react';
import { ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface DividerProps {
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  margin?: number;
  width?: string;
  componentStyle?: ComponentStyle;
}

/**
 * Divider Component - Visual separator between sections
 * 
 * Styling:
 * - componentStyle allows customization including:
 *   - borderColor: Override divider color (theme override)
 *   - margin, marginTop, marginBottom for spacing
 *   - width, height for sizing
 *   - backgroundColor, opacity
 */
export const Divider: React.FC<DividerProps> = ({
  style = 'solid',
  color = '#e5e7eb',
  margin = 16,
  width = '100%',
  componentStyle,
}) => {
  const customStyles = applyComponentStyle(componentStyle);
  
  return (
    <div
      className="cta-divider"
      style={{
        width,
        height: '1px',
        backgroundColor: customStyles.borderColor || customStyles.color || color,
        borderStyle: style,
        borderColor: customStyles.borderColor || customStyles.color || color,
        borderWidth: '1px 0 0 0',
        margin: customStyles.margin ? undefined : `${margin}px 0`,
        opacity: customStyles.opacity ?? 0.5,
        ...customStyles,
      }}
    />
  );
};

export default Divider;
