---
description: POST-GENERATION AUDIT SEQUENCE
---

ARCHITECTURE AUDIT SEQUENCE

1. Scan for cross-module imports.
2. Scan domain layer for forbidden imports.
3. Scan application layer for infrastructure implementations.
4. Confirm moduleRegistry remains the only module reference point.
5. Simulate module removal:
   - Would deletion + registry removal break build?
6. Confirm no static admin routes were introduced.
7. Confirm no business logic exists in UI.
