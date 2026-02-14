---
description: Use this to generate complex helper functions or Server Actions with strict typing.
---

# Workflow: Create Complex Logic
Use this to generate complex helper functions or Server Actions with strict typing.

## Steps
1. **Input**: Ask the user for the function's purpose and which Supabase tables it interacts with.
2. **Type Imports**: 
   - Import `Database` from `@/types/supabase`.
   - Import `Tables` or `TablesInsert` as needed for parameters.
3. **Draft Logic**:
   - Write the function using `async/await`.
   - Use the Supabase client with the `<Database>` generic for full type-safety.
4. **Validation**: 
   - If the function takes user input, use **Zod** to schema-validate the data before the database call.
5. **Shadcn Integration**: 
   - If this logic feeds into a UI, generate a shadcn-compatible schema for `react-hook-form`.
6. **Error Handling**: Implement a standard `try-catch` block that returns a structured error object (e.g., `{ data, error }`).