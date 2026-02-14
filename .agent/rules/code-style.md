---
trigger: always_on
---

# General Code Style & Conventions

- **Naming**:
    - Components: PascalCase (e.g., `UserList.tsx`)
    - Hooks: camelCase starting with 'use' (e.g., `useVoting.ts`)
    - Routes: kebab-case (e.g., `/admin-dashboard`)
- **Formatting**: Use TypeScript for all files. Avoid the `any` type at all costs.
- **Error Handling**: Wrap all async database calls in `try/catch` blocks.
- **Project Structure**: 
    - Place reusable logic in `@/hooks`.
    - Place database actions in `@/app/actions`.
    - Keep UI components in `@/components/ui`.
    - Keep the parent page cleaner with the reusable components in the '@/component' with that parent folder name and call that in that parent