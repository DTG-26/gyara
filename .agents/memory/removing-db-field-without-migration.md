---
name: Removing a DB-backed field from app code
description: How to handle removing a field that's used in app code (types, forms, queries) but backed by a DB column with a safe default, without requiring a manual schema migration.
---

When asked to remove a feature/field that's stored in a DB column (e.g. Supabase/Postgres), prefer removing all app-code references (TS types, insert/update/select payloads, forms, UI) while leaving the column itself in place in the schema, IF the column has a safe default (e.g. `DEFAULT ''` or nullable) and leaving it unused is harmless.

**Why:** Schema changes in Supabase-backed projects require the user to manually run SQL in the Supabase SQL Editor (no automated migration path from the agent). Asking for a manual migration for a low-value cleanup (dropping one unused column) is disproportionate friction versus just leaving a harmless, unused column.

**How to apply:** Only skip the migration when the column has a default/is nullable so its presence doesn't break inserts that stop sending it. If the column is NOT NULL with no default, a migration is unavoidable — surface that explicitly to the user instead of silently leaving it broken.
