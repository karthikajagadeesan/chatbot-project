---
trigger: always_on
---

# Supabase & Security Rules

- **Type Safety**: Always use the generated `Database` types from the Supabase CLI which is in the @/type/database-type.ts.
    - Reference table types using `Tables<'table_name'>`, `TablesInsert<'table_name'>`, and `TablesUpdate<'table_name'>`.
- **Initialization**: Use `createClient<Database>(...)` for the Supabase client to ensure full IntelliSense.
- **Auth**: Always check for a session via `supabase.auth.user()` or middleware before performing protected actions.
- **RLS**: Every new table must include a comment or logic for Row Level Security (RLS). 
- **Validation**: Ensure all inputs are validated (e.g., using Zod) before being passed to a Supabase query.