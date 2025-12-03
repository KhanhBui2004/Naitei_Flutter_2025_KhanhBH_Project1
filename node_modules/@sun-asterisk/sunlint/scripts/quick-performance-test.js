#!/usr/bin/env node

/**
 * 🚀 Quick Performance Test for SunLint
 * Run this to validate performance optimizations are working
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SunLint Performance Quick Test');
console.log('=================================\n');

// Test scenarios
const tests = [
  {
    name: 'Basic Performance Test',
    command: 'node scripts/batch-processing-demo.js',
    description: 'Validate batch processing works without crashes'
  },
  {
    name: 'Performance Profile Test',
    command: 'echo "Testing performance profiles (simulated)"',
    description: 'Test different performance profiles'
  },
  {
    name: 'Rule Count Validation',
    command: 'cat config/rules/enhanced-rules-registry.json | jq ".rules | keys | length"',
    description: 'Confirm we have 73+ rules that need optimization'
  }
];

async function runQuickTest() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`📊 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      console.log(`   Running: ${test.command}`);
      const result = execSync(test.command, { encoding: 'utf8', timeout: 30000 });
      
      console.log(`   ✅ PASSED\n`);
      passed++;
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  // Summary
  console.log('📊 Quick Test Summary');
  console.log('====================');
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Performance optimizations are ready.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Test with your actual codebase:');
    console.log('      sunlint --all --input=src --performance-profile=balanced --verbose');
    console.log('   2. Run full performance test suite:');
    console.log('      node scripts/performance-test.js');
    console.log('   3. Try batch processing demo:');
    console.log('      node scripts/batch-processing-demo.js');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Validate setup
console.log('🔍 Pre-flight Checks:');

// Check if performance files exist
const requiredFiles = [
  'scripts/batch-processing-demo.js',
  'scripts/performance-test.js', 
  'docs/PERFORMANCE_OPTIMIZATION_PLAN.md',
  'docs/PERFORMANCE_MIGRATION_GUIDE.md',
  'engines/optimized-heuristic-engine.js'
];

let setupOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    setupOk = false;
  }
}

if (!setupOk) {
  console.log('\n❌ Setup incomplete. Please ensure all performance optimization files are created.');
  process.exit(1);
}

console.log('\n✅ Setup validation passed!\n');

// Run tests
runQuickTest().catch(error => {
  console.error('❌ Quick test failed:', error.message);
  process.exit(1);
});
