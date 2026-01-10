import React from 'react';
import { ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface BadgeProps {
  icon?: string;
  title?: string;
  description?: string;
  style?: ComponentStyle;
  badgeStyle?: 'circle' | 'rounded' | 'square';
}

/**
 * Badge Component - Displays an icon with optional text
 * Used for features, icons, or status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  icon,
  title,
  description,
  style,
  badgeStyle = 'circle',
}) => {
  const baseStyle = applyComponentStyle(style);
  const shapeClass = `badge-${badgeStyle}`;

  return (
    <div
      className={`cta-badge ${shapeClass}`}
      style={{
        ...baseStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      {icon && (
        <div className="badge-icon" style={{ fontSize: '32px', lineHeight: 1 }}>
          {icon}
        </div>
      )}
      {title && (
        <div className="badge-title" style={{ fontWeight: 600, fontSize: '14px' }}>
          {title}
        </div>
      )}
      {description && (
        <div className="badge-description" style={{ fontSize: '12px', opacity: 0.8 }}>
          {description}
        </div>
      )}
    </div>
  );
};

export default Badge;
