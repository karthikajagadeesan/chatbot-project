---
description: Audit the current file or folder for data leaks.
---

# Workflow: Security Audit
Audit the current file or folder for data leaks.

## Steps
1. Check all Supabase queries for matching RLS policies.
2. Ensure no sensitive user data is being logged to the console.
3. Verify that Server Actions are checking for an active session before executing.