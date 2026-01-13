# Documentation for client/src/components/embed/EmbedDesignForm-v2.tsx

Validation schema for embed design
Sync ctaConfig with initialData when it changes (will also reset form later)
Reset form when initialData changes
Watch all form values and notify parent on change
Clear previous timeout
Debounce form changes to avoid infinite loops
Only call onChange if values actually changed
If the CTA has its own theme values, keep top-level form theme fields in sync
Ensure submitted payload always includes the latest ctaConfig from state
Merge the current ctaConfig into the submitted data to avoid race conditions
Always include both top-level and ctaConfig.layout fields
Do not set top-level backgroundImage or layout, only keep in ctaConfig