# Strict UI Parity Reconstruction - 23 Legacy Apps

--------------------------------
APP NAME: ferries
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Form, Modal
Legacy Buttons: {loading ?  : }
                Add Zone, {loading ?  : }, Add Ferry, save changes
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: services
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: trips
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: {t('admin.trips.applyTemplate')}, {loading && }
                            Generate Trips, Schedule Trip, {t('admin.trips.scheduleTrip')}, {loading ?  : }...
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard, Form, Details
Current Buttons: 
Current Workflow: Multi-page operations

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: reservations
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: New Reservation, Create Reservation, Save Changes, {isPending ? "Updating..." : "Search"}, Columns
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: orders
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: Columns, handleDownloadInvoice(order.id)}
                                                    disabled={loadingPdf === order.id}
                                                    title={t('admin.ordersPage.table.actions_label.downloadInvoice')}
                                                >
                                                    {loadingPdf === order.id ? ⌛ : }, handleDownloadInvoice(order.id)} disabled={loadingPdf === order.id}>
                                                        
                                                        {loadingPdf === order.id ? t('common.loading') : t('admin.ordersPage.table.actions_label.downloadInvoice')}
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: invoices
--------------------------------
Legacy Layout: Table CRUD
Legacy Screens: List/Dashboard
Legacy Buttons: generateInvoicePDF(res)}
                                        >
                                            
                                            PDF
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: routes (booking)
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: {t('admin.routes.form.addTitle')}, {t('admin.routes.form.save')}
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: calendar
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: templates
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: New Template, Create Template
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: gantt
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: profiles
--------------------------------
Legacy Layout: Unknown
Legacy Screens: None
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: routes (pricing)
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: {t('admin.routes.form.addTitle')}, {t('admin.routes.form.save')}
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: partners
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard, Form
Legacy Buttons: {loading ? 'Saving...' : 'Save Partner'}
Legacy Workflow: Multi-page operations
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: customers
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: { resetForm(); setIsAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
                     Dodaj Użytkownika Technicznego, handleUnlock(user)}
                                                disabled={unlockingId === user.id}
                                                className="h-8 w-8 text-red-600 hover:text-emerald-600 border-red-200"
                                            >, handleLock(user)}
                                                className="h-8 w-8 text-emerald-600 hover:text-red-600 border-emerald-200"
                                            >, handleResetPassword(user)}
                                            className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                        >, startEdit(user)} className="h-8 w-8 text-slate-400 hover:text-blue-600">...
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: manifests
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: {isReturningToSchedule ? "Back to Schedule" : "Back to Calendar"}, window.print()}>
             Print Manifest, setSelectedShip(shipName)}
                                >
                                    
                                    {shipName}
                                    
                                        {selectedDayTrips.filter(t => (Array.isArray(t.ferry) ? t.ferry[0]?.name : t.ferry?.name) === shipName).length} Trips, setSelectedShip(null)} className="gap-1 pl-0 text-muted-foreground hover:text-foreground">
                                 Back to Ships, setSelectedShipId(null)}
                        className="gap-2 pl-0 hover:pl-2 transition-all"
                    >
                        
                        {t('admin.manifest.selection.back')}
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: sales
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: users
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: { resetForm(); setIsAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
                     Dodaj Użytkownika Technicznego, handleUnlock(user)}
                                                disabled={unlockingId === user.id}
                                                className="h-8 w-8 text-red-600 hover:text-emerald-600 border-red-200"
                                            >, handleLock(user)}
                                                className="h-8 w-8 text-emerald-600 hover:text-red-600 border-emerald-200"
                                            >, handleResetPassword(user)}
                                            className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                        >, startEdit(user)} className="h-8 w-8 text-slate-400 hover:text-blue-600">...
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: roles
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: { resetForm(); setIsAddOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
                     Create New Role, startEdit(role)} className="h-8 w-8 text-slate-400 hover:text-blue-600">, deleteRole(role.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">, setIsAddOpen(false)}>Cancel, {editingRole ? 'Update Role' : 'Create Role'}
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: sessions
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Table CRUD
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: settings
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: {t('admin.settingsPage.heatmap.default')}, {t('common.add')}, removeThreshold(idx)}
                                    disabled={saving}
                                >, {saving ? t('common.loading') : t('admin.settingsPage.heatmap.save')}
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: cockpits
--------------------------------
Legacy Layout: Page
Legacy Screens: List/Dashboard
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: LOW
--------------------------------

--------------------------------
APP NAME: planning
--------------------------------
Legacy Layout: Table CRUD
Legacy Screens: List/Dashboard, Modal
Legacy Buttons: {t('admin.planning.editor.publish')}, {t('admin.planning.editor.add')}, startTransition(async () => await deletePlanItem(item.id))}
                                            >, {t('admin.planning.newPlan')}, {t('admin.planning.createDialog.submit')}...
Legacy Workflow: Inline/Modal operations
Legacy Special Behavior: Standard CRUD

Current Layout: Page
Current Screens: List/Dashboard
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: PARTIAL
Structural Status: Mounted via Dynamic Router
Modular Compliance: Conforms to Modular Monolith boundaries

Parity Risk Level: MEDIUM
--------------------------------

--------------------------------
APP NAME: example-dashboard
--------------------------------
Legacy Layout: Unknown
Legacy Screens: None
Legacy Buttons: 
Legacy Workflow: Read-only or simple interactions
Legacy Special Behavior: Standard CRUD

Current Layout: Unknown
Current Screens: None
Current Buttons: 
Current Workflow: Read-only or simple interactions

Parity Status: MATCH
Structural Status: Not mounted
Modular Compliance: N/A

Parity Risk Level: LOW
--------------------------------

=====================================================
SUMMARY
=====================================================
1) Full 23-App Parity Table (See detailed sections above)
2) Apps requiring UI reconstruction: ferries, trips, reservations, routes (booking), templates, routes (pricing), partners, planning
3) Apps requiring logic rewiring: 
4) Apps safe and complete: services, orders, invoices, calendar, gantt, profiles, customers, manifests, sales, users, roles, sessions, settings, cockpits, example-dashboard
5) Estimated effort per app: Medium across 8 apps.
6) Global Parity Confidence %: 65%
