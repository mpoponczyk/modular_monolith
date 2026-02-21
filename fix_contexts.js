const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files
const files = execSync('grep -rn "getTenantContext(user, tenant)" src | cut -d: -f1').toString().split('\n').filter(Boolean);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/getTenantContext\(user,\s*tenant\)/g, "getTenantContext(tenant.id, tenant.slug)");
    content = content.replace(/getUserContext\(user,\s*tenant.id\)/g, "getUserContext(user.id, tenant.id)");
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
});
