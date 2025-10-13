/**
 * VERIFICATION SCRIPT: 3D Buildings iOS Fix + Universal Identification
 *
 * This script verifies that all changes are correctly implemented.
 * Run with: node test-3d-ios-fix.js
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('\n🔍 Verifying 3D Buildings iOS Fix + Universal Identification\n');

const checks = [
  {
    name: 'Device Detection Module',
    path: 'src/mapbox/device-detection.ts',
    required: [
      'isIOS',
      'isSafari',
      'getDeviceMemory',
      'supportsWebGL',
      'isLowEndDevice',
      'getBuildingHeightMultiplier',
      'getBuildingOpacity',
      'getDeviceLogPrefix'
    ]
  },
  {
    name: 'map3d.ts - Dynamic Height Multiplier',
    path: 'src/mapbox/map3d.ts',
    required: [
      'options?: { minzoom?: number; heightMultiplier?: number }',
      'const heightMultiplier = options?.heightMultiplier || 0.7',
      'const isIOSDevice',
      "'fill-extrusion-opacity': isIOSDevice ? 0.7 : 0.8"
    ]
  },
  {
    name: 'Buildings3D.tsx - iOS Optimizations',
    path: 'src/features/mapa/komponenty/Buildings3D.tsx',
    required: [
      "isIOS",
      "getBuildingHeightMultiplier",
      "getDeviceLogPrefix",
      "const iosDevice = isIOS()",
      "const heightMultiplier = getBuildingHeightMultiplier()",
      "webglcontextlost",
      "webglcontextrestored"
    ]
  },
  {
    name: 'IdentifyTool.tsx - Universal Building Detection',
    path: 'src/features/mapa/komponenty/IdentifyTool.tsx',
    required: [
      "const has3DBuildings = map.getLayer('3d-buildings') !== undefined",
      "const buildingSource = map.getSource('composite') ? 'composite' : 'mapbox-3d-buildings'"
    ],
    shouldNotContain: [
      "mapStyleKey === 'buildings3d' || mapStyleKey === 'full3d'"
    ]
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  console.log(`\n📄 Checking: ${check.name}`);
  console.log(`   Path: ${check.path}`);

  const filePath = path.join(__dirname, check.path);

  if (!fs.existsSync(filePath)) {
    console.log(`   ${RED}✖ File not found${RESET}`);
    failed++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  let allPassed = true;

  // Check required strings
  check.required.forEach(requiredStr => {
    if (content.includes(requiredStr)) {
      console.log(`   ${GREEN}✓${RESET} Contains: ${requiredStr.substring(0, 50)}...`);
    } else {
      console.log(`   ${RED}✖${RESET} Missing: ${requiredStr}`);
      allPassed = false;
    }
  });

  // Check strings that should NOT be present
  if (check.shouldNotContain) {
    check.shouldNotContain.forEach(forbiddenStr => {
      if (!content.includes(forbiddenStr)) {
        console.log(`   ${GREEN}✓${RESET} Correctly removed: ${forbiddenStr.substring(0, 50)}...`);
      } else {
        console.log(`   ${RED}✖${RESET} Should not contain: ${forbiddenStr}`);
        allPassed = false;
      }
    });
  }

  if (allPassed) {
    console.log(`   ${GREEN}✓ All checks passed${RESET}`);
    passed++;
  } else {
    console.log(`   ${RED}✖ Some checks failed${RESET}`);
    failed++;
  }
});

// Check documentation
console.log('\n📚 Checking Documentation');
const docsPath = path.join(__dirname, 'docs', '3D_BUILDINGS_IOS_FIX.md');
if (fs.existsSync(docsPath)) {
  console.log(`   ${GREEN}✓${RESET} docs/3D_BUILDINGS_IOS_FIX.md exists`);
  passed++;
} else {
  console.log(`   ${RED}✖${RESET} docs/3D_BUILDINGS_IOS_FIX.md not found`);
  failed++;
}

const summaryPath = path.join(__dirname, 'docs', '3D_BUILDINGS_IMPLEMENTATION_SUMMARY.md');
if (fs.existsSync(summaryPath)) {
  console.log(`   ${GREEN}✓${RESET} docs/3D_BUILDINGS_IMPLEMENTATION_SUMMARY.md exists`);
  passed++;
} else {
  console.log(`   ${RED}✖${RESET} docs/3D_BUILDINGS_IMPLEMENTATION_SUMMARY.md not found`);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 SUMMARY:`);
console.log(`   ${GREEN}✓ Passed: ${passed}${RESET}`);
console.log(`   ${RED}✖ Failed: ${failed}${RESET}`);

if (failed === 0) {
  console.log(`\n   ${GREEN}✅ ALL CHECKS PASSED!${RESET}`);
  console.log(`\n   Next steps:`);
  console.log(`   1. Test on physical iPhone (Safari)`);
  console.log(`   2. Verify FPS > 20 on iPhone SE/12/13`);
  console.log(`   3. Test building click on ALL map styles`);
  console.log(`   4. Deploy to production`);
  process.exit(0);
} else {
  console.log(`\n   ${RED}❌ SOME CHECKS FAILED!${RESET}`);
  console.log(`\n   Please review the failed checks above.`);
  process.exit(1);
}
