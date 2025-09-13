# Development Workflow Policies & Guidelines

## Cost-Efficient Workflow for Codebase Changes

**TARGET: 3-5 total tool calls for most modification requests**

### Phase 1: Error Investigation & Discovery (1-2 tool calls max)
- **Trace to source, not symptoms** - Find the actual originating file/function, not just where errors surface
- **Read error stack traces completely** - The deepest stack frame often contains the real issue
- **Search for error patterns first** before assuming location (e.g., "localStorage" across codebase)
- Use `search_codebase` ONLY if truly don't know where relevant code lives
- Otherwise, directly `read` target files in parallel (batch 3-6 files at once)
- Skip exploratory reading - be surgical about what you need

### Phase 2: Pattern-Based Planning & Execution (1-3 tool calls max)
- **Plan all related changes upfront** - Don't fix incrementally  
- **Identify change scope before starting** - localStorage issue = all localStorage calls need fixing
- **Apply patterns consistently** - If one component needs safeLocalStorage, likely others do too
- **Group by file impact** - All changes to same file in one `multi_edit`
- Use parallel `edit` calls for changes across different files
- **Fix root causes, not band-aids** - One proper fix beats multiple symptom patches

### Phase 3: Selective Validation (0-1 tool calls)
- Skip validation for simple/obvious changes (< 5 lines, defensive patterns, imports)
- Only use expensive validation tools for substantial changes
- Stop immediately when development tools confirm success

### Phase 4: Trust Development Environment (0-1 tool calls)
- Skip verification if HMR shows successful reload
- One `restart_workflow` only if runtime actually fails

## Tool Selection Matrix

### High-Value, Low-Cost (use liberally):
- `read` (batch 3-6 files), `edit`/`multi_edit`, `grep` with specific patterns

### Medium-Cost (use judiciously):
- `search_codebase` (only when truly lost), `get_latest_lsp_diagnostics` (complex changes only)

### High-Cost (use sparingly):
- `architect` (major issues only), `screenshot` (substantial changes only), `restart_workflow` (actual failures only)

## Enforced Rules and Policies

### VERIFICATION STOPPING CONDITIONS - Stop immediately when:
- HMR shows successful reload
- Console logs show expected behavior  
- LSP errors cleared for simple syntax fixes
- Development server responds correctly

### NEVER verify when:
- Change is < 5 lines of obvious code
- Only added try-catch wrappers or similar defensive patterns
- Just moved/renamed variables or functions
- Only updated imports or type annotations

### PARALLEL EXECUTION RULES:
- **Read multiple files simultaneously** when investigating related issues
- **Apply edits in parallel** when files are independent
- **Never serialize independent operations** - batch aggressively
- **Maximum 6 tools per batch** to prevent overwhelming output

### MANDATORY WORKFLOW ADHERENCE:
- **MAXIMUM 5 tool calls** for any change request
- **No exploration** - be surgical about file reading
- **No incremental changes** - make all related edits in one batch
- **No workflow restarts** unless runtime actually fails (not just for verification)

### DEFENSIVE CODING PATTERNS:
- **Apply sandbox-safe patterns by default** (safeLocalStorage, safe DOM access)
- **Wrap external API calls** in try-catch from the start
- **Use null-safe operations** for optional properties
- **Apply security patterns consistently** across similar code

### VERIFICATION ANXIETY PREVENTION:
- Stop checking once the development environment confirms success
- Resist urge to "double-check" working changes
- Trust professional development tools over manual verification
- Remember: More verification ≠ better quality, just higher cost

## Workflow Success Examples

### ✅ Successful localStorage Fix (4 tool calls):
1. **Discovery**: Read replit.md + search codebase + read target file (parallel)
2. **Execution**: Applied safeLocalStorage wrapper to all localStorage calls (multi_edit)
3. **Result**: Fixed SecurityError in sandboxed environments
4. **No over-verification**: Trusted HMR reload confirmation

### ❌ Previous Inefficient Approach (11 tool calls):
- Multiple exploratory reads
- Incremental fixes
- Excessive verification (screenshots, log checks, restarts)
- Verification anxiety leading to over-checking

## Key Principles

1. **Find the source, not the symptom**
2. **Fix the pattern, not just the instance**
3. **Batch all related changes**
4. **Trust development tools**
5. **Stop when success is confirmed**