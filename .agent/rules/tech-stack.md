---
trigger: always_on
---

# Tech Stack & State Management Rules

- **Framework**: Use Next.js 16+ with App Router.
- **Data Fetching**: Use TanStack Query (React Query) for all client-side data fetching and caching. 
    - Query keys must be arrays (e.g., `['clients']`).
    - Use `useQuery` for reads and `useMutation` for writes.
- **Server Logic**: Use Server Actions (`action.ts`) for database mutations.
- **Client State**: Use Zustand only for global UI state (e.g., sidebar, theme). Do not use it for data that should be in the database.
- **Components**: Default to Server Components. Use `'use client'` only when React hooks or browser APIs are required.