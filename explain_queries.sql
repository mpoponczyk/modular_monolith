
SELECT
    tenant_users.role_id,
    roles.id,
    roles.tenant_id,
    role_permissions.permission_key,
    permissions.key
FROM tenant_users
JOIN roles ON tenant_users.role_id = roles.id
JOIN role_permissions ON roles.id = role_permissions.role_id
JOIN permissions ON role_permissions.permission_key = permissions.key
WHERE tenant_users.user_id = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a'
AND tenant_users.tenant_id = '22a83baa-2246-4470-8b3c-f0bf1958aca4'; -- Valid Tenant ID

-- 2. Explain resolve_user_tenants
EXPLAIN ANALYZE
SELECT DISTINCT t.id, t.name, t.slug
FROM public.tenants t
JOIN public.tenant_users tu ON t.id = tu.tenant_id
WHERE tu.user_id = '9ba4ab2c-ba33-4ff3-a899-2048eb43e15a'
AND t.status = 'active';

-- 3. Explain tenant_modules query
EXPLAIN ANALYZE
SELECT module_id 
FROM tenant_modules 
WHERE tenant_id = '22a83baa-2246-4470-8b3c-f0bf1958aca4';
