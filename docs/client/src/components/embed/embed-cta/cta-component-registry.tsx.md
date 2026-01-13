# Documentation for client/src/components/embed/embed-cta/cta-component-registry.tsx

Component Registry

 Maps CTA component types to React components
 Extensible for adding new component types

 Supported types:
 - header: Title and subtitle
 - description: Body text
 - feature_list: List of features with icons
 - form: Form fields
 - badge: Icon badge with title/description
 - divider: Visual separator
 - container: Layout wrapper for flex/grid
 - richtext: Rich formatted content
 - custom_html: Sanitized HTML for special layouts
/
'button_group' and 'menu' are handled separately in CTAView

 Get registered component by type
/

 Render a CTA component with styling
/
Handle special container cases

 Get all available component types
/

 Check if component type exists
/