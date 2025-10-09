#!/usr/bin/env node

/**
 * MUI IMPORT OPTIMIZER
 *
 * Converts barrel imports to path imports for faster dev builds
 *
 * Before:
 * import { Button, TextField, Box } from '@mui/material';
 *
 * After:
 * import Button from '@mui/material/Button';
 * import TextField from '@mui/material/TextField';
 * import Box from '@mui/material/Box';
 *
 * Usage:
 * node scripts/optimize-mui-imports.js [path-to-file-or-directory]
 * node scripts/optimize-mui-imports.js src/
 */

const fs = require('fs');
const path = require('path');

// MUI packages to optimize
const MUI_PACKAGES = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/lab',
  '@mui/x-data-grid',
  '@mui/x-tree-view',
];

// Regex to match MUI barrel imports
const BARREL_IMPORT_REGEX = /import\s+\{([^}]+)\}\s+from\s+['"](@mui\/[^'"]+)['"]/g;

let filesProcessed = 0;
let importsOptimized = 0;

/**
 * Convert barrel imports to path imports
 */
function optimizeImports(content) {
  let optimized = content;
  let hasChanges = false;

  optimized = optimized.replace(BARREL_IMPORT_REGEX, (match, imports, pkg) => {
    // Only process MUI packages
    if (!MUI_PACKAGES.includes(pkg)) {
      return match;
    }

    // Split imports and clean them
    const importList = imports
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    // Skip if only one import (already optimal)
    if (importList.length === 1) {
      return match;
    }

    // Convert to path imports
    const pathImports = importList.map(importName => {
      // Handle aliased imports: "Button as MyButton"
      const aliasMatch = importName.match(/^(\w+)\s+as\s+(\w+)$/);
      if (aliasMatch) {
        const [, original, alias] = aliasMatch;
        return `import ${alias} from '${pkg}/${original}';`;
      }

      // Regular import
      return `import ${importName} from '${pkg}/${importName}';`;
    });

    hasChanges = true;
    importsOptimized += importList.length;
    return pathImports.join('\n');
  });

  return { optimized, hasChanges };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  // Only process .ts, .tsx, .js, .jsx files
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { optimized, hasChanges } = optimizeImports(content);

    if (hasChanges) {
      fs.writeFileSync(filePath, optimized, 'utf8');
      console.log(`✅ Optimized: ${filePath}`);
      filesProcessed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Skip node_modules, .next, build directories
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'build', 'out', '.git'].includes(entry.name)) {
        continue;
      }
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src';

  console.log('🚀 MUI Import Optimizer');
  console.log(`📁 Target: ${targetPath}\n`);

  const stats = fs.statSync(targetPath);

  if (stats.isDirectory()) {
    processDirectory(targetPath);
  } else if (stats.isFile()) {
    processFile(targetPath);
  } else {
    console.error('❌ Invalid path:', targetPath);
    process.exit(1);
  }

  console.log('\n✨ Optimization complete!');
  console.log(`📄 Files processed: ${filesProcessed}`);
  console.log(`📦 Imports optimized: ${importsOptimized}`);
}

main();
