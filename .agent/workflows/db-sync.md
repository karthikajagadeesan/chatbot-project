---
description: Use this when the database schema has changed to update TypeScript definitions and fix breaking changes.
---

# Workflow: Sync Database Types
Use this when the database schema has changed to update TypeScript definitions and fix breaking changes.

## Steps
1. **Generate Types**: Run the local script command: `npm run supabase-types`.
2. **Verify Generation**: Check if `types/supabase.ts` was updated successfully.
3. **Scan for Errors**: 
   - Perform a project-wide TypeScript check (or scan currently open files).
   - Specifically look for errors in components using `Tables<'table_name'>` or `Database['public']['Tables']`.
4. **Report Changes**:
   - Provide the user with a summary of which tables or columns changed.
   - List any files that now have TypeScript errors due to the schema update.
5. **Auto-Fix (Optional)**: If errors are minor (e.g., a renamed column), offer to fix the imports or property names in the affected files.