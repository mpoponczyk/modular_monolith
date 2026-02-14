---
description: ARCHITECTURE_COMPLIANCE_MODE
---

ARCHITECTURE COMPLIANCE MODE: PARANOID

Before generating or modifying any code:

1. Confirm reading:
   - ARCHITECTURE_RULES.md
   - module-contract.md
   - ARCHITECTURE_VALIDATION_RULES.md
   - migration-plan.md

2. Explicitly confirm:
   - No cross-module imports will be introduced.
   - No static routing will be introduced.
   - Removal rule remains valid.
   - Layered architecture will not be violated.
   - Domain remains framework-independent.
   - Application will not depend on infrastructure implementations.

3. If any uncertainty exists:
   - Stop.
   - Identify rule number.
   - Explain potential violation.
   - Propose compliant alternative.

4. After generating code:
   - Perform rule-by-rule validation.
   - List each rule and confirm compliance.
   - Explicitly state if removal rule is still satisfied.

No silent architectural changes are allowed.
No partial compliance is acceptable.
