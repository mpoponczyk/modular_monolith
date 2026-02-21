# Translations: `core-admin/sessions`

## Namespace Strategy
This module operates under the `sessions` namespace. It does **not** rely on the generic `common` namespace for specific domain nouns to ensure strict module independence.

## Keys In Use
- `sessions.name`: Module display name ("Active Sessions" / "Aktywne Sesje")
- `sessions.description`: Module description ("View and revoke 2FA security session tokens.")

## Extensibility Rules
- To add a new translation for the Sessions module, add the key-value pair to `src/modules/core-admin/sessions/locales/en.json` and `pl.json`.
- Do not use these keys in any other module's UI.

## Deletion
When this module is deleted, you can simply delete the `src/modules/core-admin/sessions/locales` directory. No global translation files need to be cleaned up.
