# Documentation for client/src/components/embed/embed-cta/cta-components/CTAFeatureList.tsx

CTAFeatures - Displays feature list in grid or list layout

 Props from component:
 - props.features: Array of feature objects
 - props.layout: 'grid' or 'column' layout

 Styling via component.style:
 - gridTemplateColumns: Control grid layout (e.g., "repeat(3, 1fr)")
 - gap: Control spacing between items
 - display, flexDirection, alignItems, justifyContent
 - textColor: Override text color (theme override)
 - backgroundColor: Override background
 - Any other CSS property
/
Get component-level styles (for the wrapper)
Build grid style from component.style or defaults
If not explicitly set in component.style, use defaults based on layout
Set default gap if not in component.style