# Documentation for client/src/components/ui-designer/component-registry.tsx

Icon mapping for dynamic rendering
Header Component
Use resolved colors
Check if we should use transparent background (when background image exists and transparent is enabled)
Header colors
Category Tabs Component
Use resolved colors
Topic Grid Component
Use resolved colors
Check if there's a background image
Determine style variant and font sizes
Helper function to determine if a color is light or dark
Remove # if present and convert to RGB
Generate theme-aware colors for background image overlay
When there's a background image, use theme colors with transparency
Quick Actions Component
Use resolved colors with fallback to component style
Get the itemStyle from component style (same as topic grid)
Check if there's a background image
Helper function to determine if a color is light or dark
Generate colors with opacity like topic grid
When there's a background image, use same logic as topic grid
Check if action has its own itemStyle override
Footer Component
Use resolved colors with fallback to component style
Main component registry