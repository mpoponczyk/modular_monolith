# Strict Full System Validation Report

Generated on: 2026-02-18T16:21:36.053Z

| App ID | Functional | Isolation | Security & Arch | Overall |
|---|---|---|---|---|
| `core-admin/cockpits` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for core-admin/cockpits</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `core-admin/planning` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for core-admin/planning</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `core-admin/roles` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for core-admin/roles</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `core-admin/sessions` | ERROR | ERROR | ERROR | ❌ |
| `core-admin/settings` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for core-admin/settings</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `core-admin/users` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for core-admin/users</summary>

- **Structure**: FAIL - index.ts missing
- **Security**: FAIL - Service Role usage detected in: repository.ts

</details>

| `crm/customers` | ERROR | ERROR | ERROR | ❌ |
| `crm/partners` | ERROR | ERROR | ERROR | ❌ |
| `ferry-booking/ferries` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for ferry-booking/ferries</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `ferry-booking/invoices` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for ferry-booking/invoices</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `ferry-booking/orders` | ERROR | ERROR | ERROR | ❌ |
| `ferry-booking/reservations` | ERROR | ERROR | ERROR | ❌ |
| `ferry-booking/routes` | ERROR | ERROR | ERROR | ❌ |
| `ferry-booking/services` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for ferry-booking/services</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `ferry-booking/trips` | ERROR | ERROR | ERROR | ❌ |
| `ferry-planning/calendar` | FAIL | PASS | FAIL | ❌ |

<details><summary>Failure Details for ferry-planning/calendar</summary>

- **Structure**: FAIL - index.ts missing
- **Cross-Module Imports**: FAIL - Forbidden imports detected: actions.ts: import { FerryTrip as Trip } from '@/modules/ferry-booking/domain/types';

</details>

| `ferry-planning/gantt` | ERROR | ERROR | ERROR | ❌ |
| `ferry-planning/templates` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for ferry-planning/templates</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `ferry-pricing/profiles` | FAIL | PASS | PASS | ❌ |

<details><summary>Failure Details for ferry-pricing/profiles</summary>

- **Structure**: FAIL - index.ts missing

</details>

| `ferry-pricing/routes` | ERROR | ERROR | ERROR | ❌ |
| `ferry-reporting/manifests` | ERROR | ERROR | ERROR | ❌ |
| `ferry-reporting/sales` | ERROR | ERROR | ERROR | ❌ |

**Summary**: 0 PASS, 22 FAIL
**Verdict**: NO-GO
