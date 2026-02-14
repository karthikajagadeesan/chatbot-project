---
description: Use this to generate a new route with consistent folder structure.
---

# Workflow: Create New Page with Role Gateway
Use this to generate a new route folder with role-specific views located in the same directory.

## Steps
1. **Input**: Ask the user for the route name (e.g., "settings").
2. **Setup**: Create the folder in `app/[route-name]/`.
3. **Generate Role Views**:
   - Create `superadmin.tsx`: A basic Server Component for Super Admin view.
   - Create `admin.tsx`: A basic Server Component for Admin view.
   - Create `user.tsx`: A basic Server Component for User view.
4. **Generate Page**: 
   - Create `page.tsx` as an `async` Server Component.
   - Import `RoleGateway` from `@/helper/role-gateway`.
   - Import the three views created in Step 3 from the local directory (e.g., `./admin`).
5. **Implementation**:
   - In `page.tsx`, return the `<RoleGateway />` component.
   - Map the imported components to the `superadmin`, `admin`, and `user` props.
6. **Loading State**: Wrap the `RoleGateway` in a `Suspense` boundary using your `LoadingState` component.