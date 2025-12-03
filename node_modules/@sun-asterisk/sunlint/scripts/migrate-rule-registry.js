#!/usr/bin/env node

/**
 * Rule Registry Migration Script
 * Merges all rule mappings into Unified Rule Registry
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 RULE REGISTRY MIGRATION');
console.log('='.repeat(50));

// Load existing data
const rulesRegistry = JSON.parse(fs.readFileSync('./config/rules/rules-registry.json', 'utf8'));
const eslintMapping = JSON.parse(fs.readFileSync('./config/eslint-rule-mapping.json', 'utf8'));
const engineMapping = JSON.parse(fs.readFileSync('./config/engines/eslint-rule-mapping.json', 'utf8'));
const strategies = require('./config/rule-analysis-strategies.js');

// Current unified registry
const { UnifiedRuleRegistry } = require('./core/unified-rule-registry.js');
const registry = new UnifiedRuleRegistry();

async function migrateRuleData() {
  console.log('📥 Loading current unified registry...');
  await registry.initialize({ verbose: true });
  
  console.log('🔍 Analyzing missing rules...');
  
  // Get all rule IDs from different sources
  const registryRules = Object.keys(rulesRegistry.rules || {});
  const eslintRules = Object.keys(eslintMapping.mappings || {});
  const engineRules = Object.keys(engineMapping || {});
  
  // Find missing rules in unified registry
  const missingFromEslint = eslintRules.filter(ruleId => 
    !registryRules.includes(ruleId)
  );
  
  console.log(`📊 Found ${missingFromEslint.length} rules missing from registry:`, 
    missingFromEslint.slice(0, 10).join(', '));
  
  // Extend unified registry with missing rules
  const enhancedRegistry = { ...rulesRegistry };
  
  missingFromEslint.forEach(ruleId => {
    console.log(`➕ Adding missing rule: ${ruleId}`);
    
    enhancedRegistry.rules[ruleId] = {
      id: ruleId,
      name: `Rule ${ruleId}`, // Will be improved
      description: `Auto-migrated rule ${ruleId} from ESLint mapping`,
      category: inferCategory(ruleId),
      severity: 'warning',
      languages: ['typescript', 'javascript'],
      version: '1.0.0',
      status: 'migrated',
      tags: ['migrated'],
      
      // ESLint engine mapping
      engineMappings: {
        eslint: eslintMapping.mappings[ruleId] || []
      },
      
      // Analysis strategy
      strategy: {
        preferred: inferStrategy(ruleId),
        fallbacks: ['regex'],
        accuracy: {}
      }
    };
  });
  
  // Add missing engine mappings
  console.log('🔧 Adding engine mappings...');
  Object.entries(engineMapping).forEach(([ruleId, eslintRules]) => {
    if (enhancedRegistry.rules[ruleId]) {
      enhancedRegistry.rules[ruleId].engineMappings = enhancedRegistry.rules[ruleId].engineMappings || {};
      enhancedRegistry.rules[ruleId].engineMappings.eslint = eslintRules;
    }
  });
  
  // Add analysis strategies
  console.log('📈 Adding analysis strategies...');
  Object.entries(strategies.astPreferred || {}).forEach(([ruleId, config]) => {
    if (enhancedRegistry.rules[ruleId]) {
      enhancedRegistry.rules[ruleId].strategy = {
        preferred: 'ast',
        fallbacks: config.methods || ['regex'],
        accuracy: config.accuracy || {}
      };
    }
  });
  
  Object.entries(strategies.regexOptimal || {}).forEach(([ruleId, config]) => {
    if (enhancedRegistry.rules[ruleId]) {
      enhancedRegistry.rules[ruleId].strategy = {
        preferred: 'regex', 
        fallbacks: config.methods || [],
        accuracy: config.accuracy || {}
      };
    }
  });
  
  console.log('💾 Saving enhanced registry...');
  
  // Save enhanced registry
  fs.writeFileSync(
    './config/rules/enhanced-rules-registry.json',
    JSON.stringify(enhancedRegistry, null, 2)
  );
  
  console.log(`✅ Enhanced registry saved with ${Object.keys(enhancedRegistry.rules).length} rules`);
  
  // Generate migration summary
  const summary = {
    originalRules: registryRules.length,
    migratedRules: missingFromEslint.length,
    totalRules: Object.keys(enhancedRegistry.rules).length,
    eslintMappings: Object.keys(eslintMapping.mappings).length,
    engineMappings: Object.keys(engineMapping).length
  };
  
  fs.writeFileSync(
    './migration-summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log('📄 Migration summary:', summary);
}

// Helper functions
function inferCategory(ruleId) {
  if (ruleId.startsWith('S')) return 'security';
  if (ruleId.startsWith('T')) return 'typescript';
  if (ruleId.startsWith('R')) return 'react';
  
  // Infer from common patterns
  if (ruleId.includes('naming') || ruleId.includes('name')) return 'naming';
  if (ruleId.includes('error') || ruleId.includes('exception')) return 'error-handling';
  if (ruleId.includes('log')) return 'logging';
  if (ruleId.includes('complexity')) return 'complexity';
  
  return 'general';
}

function inferStrategy(ruleId) {
  // Rules that typically need AST analysis
  const astRules = ['C010', 'C012', 'C015', 'C017'];
  if (astRules.includes(ruleId)) return 'ast';
  
  // Most rules can start with regex
  return 'regex';
}

// Run migration
migrateRuleData().catch(console.error);
