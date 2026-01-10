# CTA Feature - Phase 1 Database Setup

## Quick Start

### Step 1: Apply the Database Migration

```bash
# Option 1: Using drizzle-kit
npm run db:push

# Option 2: Using drizzle-kit CLI directly
npx drizzle-kit push

# Option 3: Manual SQL execution
psql $DATABASE_URL -f migrations/0001_add_cta_config.sql
```

### Step 2: Verify the Column was Created

```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'embed_designs' 
AND column_name = 'cta_config';

-- Should output:
-- column_name | data_type
-- cta_config  | jsonb
```

### Step 3: Verify the Index was Created

```sql
-- List all indexes on embed_designs table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'embed_designs' 
AND indexname = 'idx_embed_designs_cta_config';

-- Should output:
-- indexname                          | indexdef
-- idx_embed_designs_cta_config       | CREATE INDEX idx_embed_designs_cta_config ON public.embed_designs USING gin(cta_config)
```

---

## Migration Details

### What Changed

**Table**: `embed_designs`

**New Column**:
```sql
cta_config jsonb NULL
```

**New Index**:
```sql
CREATE INDEX idx_embed_designs_cta_config ON embed_designs USING GIN(cta_config)
```

### Why These Changes

1. **JSONB Column**: Flexible storage for CTA configuration that can evolve
2. **GIN Index**: Optimizes queries filtering by CTA settings
3. **NULL Default**: Backward compatible - existing embeds unaffected

---

## Rollback (If Needed)

If you need to revert the migration:

```sql
-- Drop the index
DROP INDEX IF EXISTS idx_embed_designs_cta_config;

-- Drop the column
ALTER TABLE embed_designs DROP COLUMN cta_config;
```

---

## Testing the Migration

### Insert Test Data

```sql
-- Insert embed design with CTA config
INSERT INTO embed_designs (
  chatbot_config_id,
  user_id,
  embed_id,
  name,
  description,
  design_type,
  primary_color,
  background_color,
  text_color,
  cta_config,
  is_active,
  created_at,
  updated_at
) VALUES (
  1,
  'user-123',
  'embed-uuid-123',
  'Test CTA Embed',
  'Testing CTA configuration',
  'compact',
  '#2563eb',
  '#ffffff',
  '#1f2937',
  '{
    "enabled": true,
    "layout": {"style": "card", "position": "center", "width": "wide"},
    "components": [],
    "primaryButton": {
      "id": "btn1",
      "text": "Start Chat",
      "variant": "solid",
      "predefinedMessage": "Hello, I need help",
      "actionLabel": "Ask Now"
    }
  }',
  true,
  NOW(),
  NOW()
);
```

### Query the Data

```sql
-- Fetch embeds with CTA enabled
SELECT id, name, cta_config->'enabled' as cta_enabled
FROM embed_designs
WHERE cta_config IS NOT NULL;

-- Extract specific CTA field
SELECT id, name, 
  cta_config->'primaryButton'->>'text' as button_text,
  cta_config->'primaryButton'->>'predefinedMessage' as message
FROM embed_designs
WHERE cta_config->>'enabled' = 'true';
```

---

## Performance Considerations

### Index Usage

The GIN index on `cta_config` helps with queries like:

```sql
-- Index used efficiently
WHERE cta_config->>'enabled' = 'true'
WHERE cta_config @> '{"enabled": true}'
WHERE cta_config ? 'primaryButton'
```

### Query Optimization Tips

```sql
-- Good: Uses index
SELECT * FROM embed_designs 
WHERE cta_config->>'enabled' = 'true'
ORDER BY created_at DESC;

-- Good: Uses index
SELECT * FROM embed_designs 
WHERE cta_config @> '{"settings": {"dismissible": true}}'
LIMIT 10;

-- Consider adding partial index for enabled CTAs
CREATE INDEX idx_cta_enabled 
ON embed_designs (created_at DESC) 
WHERE cta_config->>'enabled' = 'true';
```

---

## TypeScript Integration

Once migration is applied, the application can use CTA:

```typescript
import { CTAConfig } from "@shared/schema";

// Create embed with CTA
const design = await createEmbedDesign({
  chatbotConfigId: 1,
  userId: "user-123",
  name: "My Widget",
  ctaConfig: {
    enabled: true,
    layout: { style: "card", position: "center", width: "wide" },
    components: [],
    primaryButton: {
      id: "btn1",
      text: "Start",
      variant: "solid",
      predefinedMessage: "Hi there!",
    },
  } as CTAConfig,
});
```

---

## Troubleshooting

### Issue: Column Already Exists
```
ERROR: column "cta_config" of relation "embed_designs" already exists
```
**Solution**: Migration already applied, nothing to do.

### Issue: Index Creation Failed
```
ERROR: index "idx_embed_designs_cta_config" already exists
```
**Solution**: Index already created, nothing to do.

### Issue: Permission Denied
```
ERROR: permission denied for schema public
```
**Solution**: Ensure database user has ALTER TABLE permissions:
```sql
GRANT ALL PRIVILEGES ON TABLE embed_designs TO your_user;
```

---

## Migration Status Tracking

### Check Drizzle Migrations Table

Drizzle-kit tracks migrations in `__drizzle_migrations__` table:

```sql
SELECT name, success, execution_time_ms, installed_at 
FROM __drizzle_migrations__ 
ORDER BY installed_at DESC;
```

---

## Deployment Checklist

- [ ] Database backup created
- [ ] Migration file reviewed: [migrations/0001_add_cta_config.sql](../migrations/0001_add_cta_config.sql)
- [ ] Migration applied successfully
- [ ] Column verified to exist
- [ ] Index verified to exist
- [ ] Test data inserted and queried
- [ ] Code deployed with Phase 1 changes
- [ ] Application tests pass

---

## Environment Setup

The following environment variable must be set:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

To test migration without applying to production:

```bash
# Create test database
createdb embed_test

# Test migration
DATABASE_URL=postgresql://user@localhost/embed_test npx drizzle-kit push
```

---

**Next**: [Phase 1 Implementation Complete](./PHASE1_CTA_IMPLEMENTATION.md)
