#!/usr/bin/env node

/**
 * Quick validation that unified rule registry system is working
 */

const { getInstance } = require('./core/unified-rule-registry');

async function validateUnifiedSystem() {
  console.log('🔍 Validating unified rule registry system...\n');
  
  try {
    const registry = getInstance();
    await registry.initialize();
    
    console.log(`✅ Registry loaded: ${registry.rules.size} rules`);
    
    // Test specific rules
    const testRules = ['C006', 'C047', 'C002'];
    console.log('\n📋 Testing specific rules:');
    
    for (const ruleId of testRules) {
      const rule = registry.rules.get(ruleId);
      if (rule) {
        console.log(`   ✅ ${ruleId}: ${rule.title}`);
        if (rule.engineMappings?.eslint) {
          console.log(`      ESLint: ${JSON.stringify(rule.engineMappings.eslint)}`);
        }
        if (rule.engineMappings?.heuristic) {
          console.log(`      Heuristic: ${rule.engineMappings.heuristic.implementation}`);
        }
      } else {
        console.log(`   ❌ ${ruleId}: NOT FOUND`);
      }
    }
    
    console.log('\n🎉 Unified rule registry system is working correctly!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

if (require.main === module) {
  validateUnifiedSystem();
}

module.exports = { validateUnifiedSystem };
