#!/usr/bin/env node

/**
 * DEAD CODE FINDER
 *
 * Finds unused exports in the codebase
 *
 * Usage:
 * node scripts/find-dead-code.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const allExports = [];
const allImports = [];

/**
 * Extract exports from a file
 */
function extractExports(filePath, content) {
  const exports = [];

  // Named exports: export function foo(), export const bar =
  const namedExportRegex = /export\s+(function|const|let|var|class)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content))) {
    exports.push({ name: match[2], file: filePath });
  }

  // Export { foo, bar }
  const exportListRegex = /export\s+\{([^}]+)\}/g;
  while ((match = exportListRegex.exec(content))) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
    names.forEach(name => exports.push({ name, file: filePath }));
  }

  return exports;
}

/**
 * Extract imports from a file
 */
function extractImports(content) {
  const imports = [];

  // import { foo, bar } from 'module'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from/g;
  let match;
  while ((match = namedImportRegex.exec(content))) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
    imports.push(...names);
  }

  // import foo from 'module'
  const defaultImportRegex = /import\s+(\w+)\s+from/g;
  while ((match = defaultImportRegex.exec(content))) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'build'].includes(entry.name)) continue;
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative(srcDir, fullPath);

      // Collect exports
      const fileExports = extractExports(relativePath, content);
      allExports.push(...fileExports);

      // Collect imports
      const fileImports = extractImports(content);
      allImports.push(...fileImports);
    }
  }
}

/**
 * Main
 */
function main() {
  console.log('🔍 Scanning for dead code...\n');

  scanDirectory(srcDir);

  console.log(`📦 Found ${allExports.length} exports`);
  console.log(`📥 Found ${allImports.length} imports\n`);

  // Find unused exports
  const unusedExports = allExports.filter(exp => {
    // Skip if used anywhere
    return !allImports.includes(exp.name);
  });

  // Group by file
  const byFile = unusedExports.reduce((acc, exp) => {
    if (!acc[exp.file]) acc[exp.file] = [];
    acc[exp.file].push(exp.name);
    return {};
  }, {});

  console.log('❌ Potentially unused exports:\n');

  if (unusedExports.length === 0) {
    console.log('✅ No unused exports found!');
  } else {
    unusedExports.forEach(exp => {
      console.log(`  ${exp.name} in ${exp.file}`);
    });

    console.log(`\n📊 Total: ${unusedExports.length} unused exports`);
    console.log('\n⚠️  Note: This is a heuristic analysis. Some exports may be:');
    console.log('  - Used in app/ directory (Next.js pages)');
    console.log('  - Used in tests');
    console.log('  - Part of public API');
    console.log('  - Dynamically imported');
  }
}

main();
