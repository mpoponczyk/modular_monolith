const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Sales
  copyDir('src/modules/ferry-reporting/sales/ui', 'src/modules/ferry-reporting-sales/ui');
  fs.copyFileSync('src/modules/ferry-reporting/sales/actions.ts', 'src/modules/ferry-reporting-sales/application/actions.ts');
  fs.copyFileSync('src/modules/ferry-reporting/sales/index.ts', 'src/modules/ferry-reporting-sales/index.ts');
  if (fs.existsSync('src/modules/ferry-reporting/domain')) copyDir('src/modules/ferry-reporting/domain', 'src/modules/ferry-reporting-sales/domain');
  if (fs.existsSync('src/modules/ferry-reporting/infrastructure/SupabaseSalesService.ts')) fs.copyFileSync('src/modules/ferry-reporting/infrastructure/SupabaseSalesService.ts', 'src/modules/ferry-reporting-sales/infrastructure/SupabaseSalesService.ts');

  // Manifests
  copyDir('src/modules/ferry-reporting/manifests/ui', 'src/modules/ferry-reporting-manifests/ui');
  fs.copyFileSync('src/modules/ferry-reporting/manifests/actions.ts', 'src/modules/ferry-reporting-manifests/application/actions.ts');
  fs.copyFileSync('src/modules/ferry-reporting/manifests/index.ts', 'src/modules/ferry-reporting-manifests/index.ts');
  if (fs.existsSync('src/modules/ferry-reporting/domain')) copyDir('src/modules/ferry-reporting/domain', 'src/modules/ferry-reporting-manifests/domain');
  if (fs.existsSync('src/modules/ferry-reporting/infrastructure/SupabaseReportingRepository.ts')) fs.copyFileSync('src/modules/ferry-reporting/infrastructure/SupabaseReportingRepository.ts', 'src/modules/ferry-reporting-manifests/infrastructure/SupabaseReportingRepository.ts');
  if (fs.existsSync('src/modules/ferry-reporting/infrastructure/SupabaseSalesService.ts')) fs.copyFileSync('src/modules/ferry-reporting/infrastructure/SupabaseSalesService.ts', 'src/modules/ferry-reporting-manifests/infrastructure/SupabaseSalesService.ts');

  console.log("Extraction complete.");
} catch (e) {
  console.error("Extraction failed: ", e);
}
