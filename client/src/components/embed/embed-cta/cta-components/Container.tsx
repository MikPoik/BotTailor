import React from 'react';
import { ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface ContainerProps {
  children?: React.ReactNode;
  layout?: 'column' | 'row' | 'grid';
  columns?: number;
  style?: ComponentStyle;
}

/**
 * Container Component - Layout wrapper for other components
 * Supports flexbox (column/row) and grid layouts
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  layout = 'column',
  columns = 3,
  style,
}) => {
  const baseStyle = applyComponentStyle(style);

  const layoutStyle: React.CSSProperties =
    layout === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: style?.gap ? `${style.gap}px` : '16px',
        }
      : {
          display: 'flex',
          flexDirection: layout === 'row' ? 'row' : 'column',
          gap: style?.gap ? `${style.gap}px` : '16px',
        };

  return (
    <div
      className={`cta-container cta-container-${layout}`}
      style={{
        ...baseStyle,
        ...layoutStyle,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default Container;
