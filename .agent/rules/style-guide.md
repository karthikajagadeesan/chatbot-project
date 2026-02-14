---
trigger: always_on
---

# UI & Type Strictness Rules

- **Shadcn Methodology**: 
    - Use `FormField` from shadcn/ui for all inputs. 
    - use `Field` from shadcn/ui for the layout.
    - Avoid using the standard `Card` component for layout; use semantic HTML or shadcn's layout primitives.
- **No Static Colors**: 
    - Prohibit hex codes (e.g., `#FFFFFF`) or arbitrary Tailwind colors (e.g., `bg-blue-500`).
    - Use shadcn design tokens only: `bg-background`, `text-foreground`, `border-input`, `bg-primary`, etc.
- **Zero 'any' Type**:
    - The `any` keyword is strictly forbidden. 
    - All database interactions must use the `Database` types from `@/types/supabase`.
    - Use `Tables<'table_name'>` for row shapes and `Enums<'enum_name'>` for custom types.