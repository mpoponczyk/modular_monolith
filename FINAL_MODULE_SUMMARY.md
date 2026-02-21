# Final Modular Monolith Architecture Summary
## Extracted Applications Matrix

| ID | Core / Domain Area | Description | Status |
|---|---|---|---|
| `core-admin-users` | Security & Admin | User identity management portal. | Isolated ✅ |
| `core-admin-roles` | Security & Admin | RBAC execution and role definitions. | Isolated ✅ |
| `core-admin-settings` | Security & Admin | Global system settings framework. | Isolated ✅ |
| `core-admin-cockpits` | Security & Admin | Core administration dashboards. | Isolated ✅ |
| `core-admin-planning` | Security & Admin | System planning parameters. | Isolated ✅ |
| `core-admin-sessions` | Security & Admin | Active token and session audits. | Isolated ✅ |
| `crm-customers` | Customer Relations | Dedicated customer CRM module. | Isolated ✅ |
| `crm-partners` | Customer Relations | Isolated partner/B2B data CRM module. | Isolated ✅ |
| `ferry-booking-routes` | Trip Booking | Ferry route network declarations. | Isolated ✅ |
| `ferry-booking-trips` | Trip Booking | Core trip instances and timelines. | Isolated ✅ |
| `ferry-booking-reservations` | Trip Booking | Customer boarding reservations. | Isolated ✅ |
| `ferry-booking-ferries` | Trip Booking | Ferry capacity and specs repository. | Isolated ✅ |
| `ferry-booking-invoices` | Trip Booking | Ledger and invoice issuance boundary. | Isolated ✅ |
| `ferry-booking-orders` | Trip Booking | Customer checkout workflows. | Isolated ✅ |
| `ferry-booking-services` | Trip Booking | Supplemental service configurations. | Isolated ✅ |
| `ferry-planning-calendar` | Logistics Planning | Trip temporal mapping. | Isolated ✅ |
| `ferry-planning-gantt` | Logistics Planning | Fleet interactive allocation Gantt. | Isolated ✅ |
| `ferry-planning-templates` | Logistics Planning | Master itinerary templates. | Isolated ✅ |
| `ferry-pricing-profiles` | Pricing Engine | Base profile and currency mappings. | Isolated ✅ |
| `ferry-pricing-routes` | Pricing Engine | Segment-specific pricing overrides. | Isolated ✅ |
| `ferry-reporting-sales` | Reporting & Analytics | Analytical net performance views. | Isolated ✅ |
| `ferry-reporting-manifests` | Reporting & Analytics | Official passenger manifest documents. | Isolated ✅ |
| `example-dashboard` | Sandbox | Sandbox component instance. | Isolated ✅ |

**Grouped module packages have been completely purged from the repository tree.** Strict `1:1` UI feature parity retained, cross-links resolved, and architecture validations are universally passing.
