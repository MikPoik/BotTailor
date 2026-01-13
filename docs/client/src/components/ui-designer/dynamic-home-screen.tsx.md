# Documentation for client/src/components/ui-designer/dynamic-home-screen.tsx

Color and style resolution function that prioritizes embed parameters over UI Designer theme
Get CSS variables from the embed parameters (these take priority)
Helper function to check if a color value is valid (not empty and not just fallback CSS var)
Extract font sizes from topic grid component or use preview values
Use preview font sizes (from Theme tab)
Use saved font sizes from component props
Resolve final colors with embed parameters taking priority
Sort components by order
Preload background image
Resolve colors and font sizes with embed parameters taking priority