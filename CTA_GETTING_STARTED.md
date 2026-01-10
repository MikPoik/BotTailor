# Getting Started with CTA Components

**Phase 2 Complete** ✅  
Last Updated: 2025-01-10

---

## Quick Start Guide

### For Users: Creating a CTA

1. **Navigate to Embed Designer**
   - Go to your chatbot's settings
   - Click "Embeds" or "Design"
   - Create a new embed design or edit existing one

2. **Click "CTA Setup" Tab**
   - You'll see two panels: Builder (left) and Preview (right)

3. **Enable CTA**
   - Check "Enable CTA View" toggle

4. **Configure Layout**
   - Choose style: Banner, Card, Modal, or Sidebar
   - Choose position: Top, Center, or Bottom
   - Choose width: Narrow, Wide, or Full

5. **Add Components**
   - Click "+ Header" to add a title/subtitle
   - Click "+ Features" to add feature list
   - Reorder or remove components as needed

6. **Customize Button**
   - Set button text (e.g., "Start Chat")
   - Set predefined message that triggers on click
   - Optional: Add secondary button

7. **Configure Settings**
   - Toggle "Allow users to dismiss CTA"
   - Toggle "Show only once per session"

8. **Preview**
   - Click "Preview CTA" button
   - View in Mobile/Tablet/Desktop sizes
   - Use full-screen mode for detailed preview

9. **Save**
   - Click "Save" or "Create Design" button
   - Configuration is stored in database

---

## For Developers: Using Components

### Display a CTA

```tsx
import { CTAView } from '@/components/embed/embed-cta/CTAView';
import { CTAConfig } from '@shared/schema';

function MyComponent() {
  const ctaConfig: CTAConfig = {
    version: '1.0',
    enabled: true,
    layout: { style: 'card', position: 'center', width: 'wide' },
    components: [
      {
        id: 'header_1',
        type: 'header',
        order: 0,
        visible: true,
        props: { title: 'Welcome!', subtitle: 'How can we help?' }
      }
    ],
    primaryButton: {
      id: 'btn_1',
      text: 'Start Chat',
      variant: 'solid',
      predefinedMessage: 'Hi! I need help.',
      actionLabel: 'Start Chat'
    }
  };

  return (
    <CTAView
      config={ctaConfig}
      chatbotName="Support Bot"
      onPrimaryButtonClick={(message) => {
        console.log('User clicked button with message:', message);
        // Transition to chat interface
      }}
      onSecondaryButtonClick={(message) => {
        console.log('Secondary button clicked');
      }}
      onClose={() => {
        console.log('CTA closed/dismissed');
      }}
    />
  );
}
```

### Create/Edit CTA Config

```tsx
import { CTABuilder } from '@/components/embed/embed-cta/CTABuilder';
import { CTAConfig } from '@shared/schema';

function CTAEditor() {
  const [ctaConfig, setCtaConfig] = useState<CTAConfig>();
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <CTABuilder
        initialConfig={ctaConfig}
        chatbotName="My Bot"
        onConfigChange={setCtaConfig}
        onPreviewToggle={setShowPreview}
      />
      
      {/* Preview Panel */}
      <div>
        {ctaConfig && (
          <CTAView
            config={ctaConfig}
            chatbotName="My Bot"
            onPrimaryButtonClick={(msg) => {}}
            onSecondaryButtonClick={(msg) => {}}
            onClose={() => {}}
          />
        )}
      </div>
    </div>
  );
}
```

### Preview CTA in Modal

```tsx
import { CTAPreview } from '@/components/embed/embed-cta/CTAPreview';

function PreviewButton() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <button onClick={() => setShowPreview(true)}>
        Preview CTA
      </button>

      <CTAPreview
        config={ctaConfig}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        chatbotName="Support"
      />
    </>
  );
}
```

### Integrate with Embed Form

The new `EmbedDesignForm-v2.tsx` component already includes CTA setup:

```tsx
import { EmbedDesignForm } from '@/components/embed/EmbedDesignForm-v2';

function EmbedEditor() {
  return (
    <EmbedDesignForm
      onSubmit={async (data) => {
        // data.ctaConfig is available here
        console.log('CTA Config:', data.ctaConfig);
        // Save to API
      }}
      chatbotName="My Bot"
    />
  );
}
```

---

## Component API Reference

### CTAView

**Props:**
```typescript
interface CTAViewProps {
  config: CTAConfig;              // Configuration object
  chatbotName?: string;           // Display name
  onPrimaryButtonClick?: (msg: string) => void;      // Primary button handler
  onSecondaryButtonClick?: (msg: string) => void;    // Secondary button handler
  onClose?: () => void;           // Close/dismiss handler
}
```

**Features:**
- Renders complete CTA interface
- Applies theme colors from config
- Handles all component types
- Supports button clicks and dismissal

---

### CTABuilder

**Props:**
```typescript
interface CTABuilderProps {
  initialConfig?: CTAConfig;      // Starting configuration
  chatbotName?: string;           // Bot name for display
  onConfigChange?: (config: CTAConfig) => void;  // Config update callback
  onPreviewToggle?: (show: boolean) => void;     // Preview toggle callback
}
```

**Features:**
- Enable/disable toggle
- Layout configuration
- Component management
- Button customization
- Settings panel
- Live form updates

---

### CTAPreview

**Props:**
```typescript
interface CTAPreviewProps {
  config: CTAConfig;              // Configuration to preview
  isOpen: boolean;                // Modal visibility
  onClose: () => void;            // Close handler
  chatbotName?: string;           // Bot name
}
```

**Features:**
- Device preview (mobile/tablet/desktop)
- Full-screen mode
- Live updates as config changes
- Realistic device frames

---

### Component Library

**CTAHeader**
- Displays title, subtitle, optional background
- Props: title, subtitle, backgroundImageUrl

**CTADescription**
- Text content display
- Props: description text

**CTAFeatureList**
- Grid or list layout
- Props: features array with icons

**CTAButtonGroup**
- Primary and optional secondary buttons
- Props: button configs and click handlers

**CTAForm**
- Placeholder for future form functionality
- Props: basic configuration

---

## Configuration Examples

### Simple Header + Button

```typescript
const config: CTAConfig = {
  version: '1.0',
  enabled: true,
  layout: { style: 'card', position: 'center', width: 'wide' },
  components: [
    {
      id: 'header_1',
      type: 'header',
      order: 0,
      visible: true,
      props: { title: 'Chat with us!' }
    }
  ],
  primaryButton: {
    id: 'btn_1',
    text: 'Get Started',
    variant: 'solid',
    predefinedMessage: 'Hi!'
  }
};
```

### With Features

```typescript
const config: CTAConfig = {
  version: '1.0',
  enabled: true,
  layout: { style: 'card', position: 'center', width: 'wide' },
  components: [
    {
      id: 'header_1',
      type: 'header',
      order: 0,
      visible: true,
      props: { title: 'Support Bot', subtitle: 'Available 24/7' }
    },
    {
      id: 'features_1',
      type: 'feature_list',
      order: 1,
      visible: true,
      props: {
        features: [
          { icon: '⚡', title: 'Fast', description: 'Get answers instantly' },
          { icon: '🎯', title: 'Accurate', description: 'AI-powered responses' },
          { icon: '🔒', title: 'Secure', description: 'Your data is safe' }
        ],
        style: { layout: 'grid' }
      }
    }
  ],
  primaryButton: {
    id: 'btn_1',
    text: 'Start Chat',
    variant: 'solid',
    predefinedMessage: 'Hi! I need help with...'
  }
};
```

### Modal with Dismissible

```typescript
const config: CTAConfig = {
  version: '1.0',
  enabled: true,
  layout: { style: 'modal', position: 'center', width: 'wide' },
  components: [
    {
      id: 'header_1',
      type: 'header',
      order: 0,
      visible: true,
      props: { title: 'How can we help?' }
    }
  ],
  primaryButton: {
    id: 'btn_1',
    text: 'Chat Now',
    variant: 'solid',
    predefinedMessage: 'I have a question'
  },
  settings: {
    dismissible: true,
    showOncePerSession: true
  }
};
```

---

## Styling & Theming

### CSS Variables

The CTA system uses CSS variables for theming:

```css
--cta-primary    /* Primary color for buttons */
--cta-bg         /* Background color */
--cta-text       /* Text color */
--cta-accent     /* Accent color */
```

### Layout Options

**Styles:**
- `banner` - Full-width header style
- `card` - Card/box style
- `modal` - Modal dialog style
- `sidebar` - Sidebar style

**Positions:**
- `top` - Positioned at top
- `center` - Centered on page
- `bottom` - Positioned at bottom

**Widths:**
- `narrow` - 400px width
- `wide` - 600px width
- `full` - Full container width

### Button Variants

- `solid` - Filled button
- `outline` - Bordered button
- `ghost` - Minimal button

---

## Type Safety

All components are fully typed with TypeScript:

```typescript
// Import types from schema
import { CTAConfig, CTAComponent, CTAButton } from '@shared/schema';

// Use in components
const config: CTAConfig = { /* ... */ };
const component: CTAComponent = { /* ... */ };
const button: CTAButton = { /* ... */ };
```

---

## Testing Components

### Basic Render Test

```typescript
import { render, screen } from '@testing-library/react';
import { CTAView } from '@/components/embed/embed-cta/CTAView';

test('renders CTA with title', () => {
  const config: CTAConfig = {
    version: '1.0',
    enabled: true,
    layout: { style: 'card', position: 'center', width: 'wide' },
    components: [
      {
        id: 'h1',
        type: 'header',
        order: 0,
        visible: true,
        props: { title: 'Welcome' }
      }
    ],
    primaryButton: { id: 'b1', text: 'Click', variant: 'solid' }
  };

  render(<CTAView config={config} />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

### Builder Form Test

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { CTABuilder } from '@/components/embed/embed-cta/CTABuilder';

test('adds component when button clicked', async () => {
  render(<CTABuilder onConfigChange={jest.fn()} />);
  
  const addBtn = screen.getByText('+ Header');
  await userEvent.click(addBtn);
  
  expect(screen.getByText('header')).toBeInTheDocument();
});
```

---

## Common Patterns

### Two-Stage Embed (CTA → Chat)

```tsx
function EmbedWithCTA() {
  const [stage, setStage] = useState<'cta' | 'chat'>('cta');
  const [initialMessage, setInitialMessage] = useState('');

  if (stage === 'cta') {
    return (
      <CTAView
        config={ctaConfig}
        onPrimaryButtonClick={(msg) => {
          setInitialMessage(msg);
          setStage('chat');
        }}
      />
    );
  }

  return <ChatInterface initialMessage={initialMessage} />;
}
```

### Dynamic Theme

```tsx
function CTAWithTheme() {
  const config: CTAConfig = {
    // ... config
    theme: {
      primaryColor: '#ff6b6b',
      backgroundColor: '#ffffff',
      textColor: '#333333'
    }
  };

  return <CTAView config={config} />;
}
```

### Conditional Rendering

```tsx
function SmartCTA() {
  return (
    <>
      {ctaConfig.enabled && (
        <CTAView config={ctaConfig} />
      )}
      {!ctaConfig.enabled && (
        <ChatInterface /> // Show chat directly
      )}
    </>
  );
}
```

---

## Troubleshooting

### CTA Not Showing

1. Check `enabled` is `true` in config
2. Verify components array is not empty
3. Check console for errors
4. Verify CSS is loaded (`cta-styles.css`)

### Button Click Not Working

1. Ensure `onPrimaryButtonClick` handler is provided
2. Check predefinedMessage is set
3. Verify handler is called in parent component

### Styles Not Applied

1. Verify `cta-styles.css` is imported
2. Check CSS class names match
3. Verify no CSS conflicts
4. Check CSS variable values

### TypeScript Errors

1. Import types from `@shared/schema`
2. Verify CTAConfig structure matches schema
3. Check component prop types
4. Run `npm run type-check` for full report

---

## Performance Tips

1. **Memoize Config** - Avoid recreating config on every render
2. **Lazy Load** - Use React.lazy() for optional CTA
3. **CSS Variables** - Use for dynamic theming (no runtime recalculation)
4. **Component Reuse** - Share components across embeds

---

## Next Steps

- **Phase 3:** AI integration for auto-generation
- **Phase 4:** Two-stage rendering with transitions
- **Phase 5:** Theme presets and animation library

See [CTA_FEATURE_COMPLETE_INDEX.md](CTA_FEATURE_COMPLETE_INDEX.md) for complete documentation.

---

**Questions?** See:
- [PHASE2_COMPLETION_REPORT.md](PHASE2_COMPLETION_REPORT.md) - Detailed report
- [PHASE2_ARCHITECTURE_DIAGRAM.md](PHASE2_ARCHITECTURE_DIAGRAM.md) - Architecture
- [CTA_FEATURE_COMPLETE_INDEX.md](CTA_FEATURE_COMPLETE_INDEX.md) - Full index
