# Documentation for client/src/components/embed/embed-cta/CTAView.tsx

CTAView - Main CTA display component

 Renders the complete CTA view with:
 - Components (header, description, features, etc.) with flexible layout
 - Primary and secondary buttons with style customization
 - Theme application with per-component color overrides
 - Background images & patterns
 - Responsive layouts

 Layout Features:
 - Supports vertical (default), horizontal, and grid component layouts
 - Component gaps controlled via config.layout.componentGap
 - Theme colors can be overridden per-component via component.style.textColor/backgroundColor
 - Full flexbox/grid support for complex layouts
/
Get layout CSS classes
Build background style
Get overlay opacity for rendering
Theme CSS variables applied via useEffect below
Apply theme colors
Handle primary button click
Handle secondary button click
Sort components by order
Handle button_group component specially to wire up click handlers