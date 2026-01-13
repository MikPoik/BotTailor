# Documentation for client/src/components/embed/embed-cta/cta-components/CustomHTML.tsx

DOMPurify sanitization configuration
 Allows safe HTML while preventing XSS
/

 CustomHTML Component - Renders sanitized HTML content

 Security:
 - HTML is sanitized to remove potential XSS
 - Only whitelisted tags and attributes allowed
 - Style attribute content is NOT sanitized (browser handles this)

 Usage:
 ```json
 {
   "id": "custom_1",
   "type": "custom_html",
   "props": {
     "htmlContent": "<div style='...'>Safe HTML</div>"
   },
   "style": { "padding": 20, "backgroundColor": "#f5f5f5" }
 }
 ```

 Best Practices:
 - Keep HTML simple (paragraphs, lists, links, images)
 - Use component style prop for layout, not inline styles
 - Avoid script tags, event handlers, form elements
/
Sanitize HTML content
Basic sanitization - remove script tags and on* handlers
Allow dangerously set HTML only after sanitization