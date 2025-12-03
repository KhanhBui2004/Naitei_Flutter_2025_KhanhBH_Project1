#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { SimpleRuleParser } = require('../rules/parser/rule-parser-simple');

/**
 * Generate rules registry from origin-rules
 * This script creates config/rules/rules-registry-generated.json
 * from all *-en.md files in origin-rules/ directory
 */

console.log('📋 Generating rules registry from origin-rules...');

try {
  const parser = new SimpleRuleParser();
  const originRulesDir = path.join(__dirname, '..', 'origin-rules');
  const targetPath = path.join(__dirname, '..', 'config', 'rules', 'rules-registry-generated.json');
  
  console.log(`Source: ${originRulesDir}`);
  console.log(`Target: ${targetPath}`);
  
  // Parse all rules from origin-rules
  const allRules = parser.parseAllRules(originRulesDir);
  
  if (allRules.length === 0) {
    console.error('❌ No rules found in origin-rules directory');
    process.exit(1);
  }
  
  // Convert to registry format
  const registry = {
    rules: {}
  };
  
  allRules.forEach(rule => {
    if (rule.id) {
      registry.rules[rule.id] = {
        name: rule.title || `${rule.id} Rule`,
        description: rule.description || 'No description available',
        category: rule.category || 'quality',
        severity: rule.severity || 'major',
        languages: rule.language ? [rule.language] : ['All languages'],
        version: rule.version || '1.0.0',
        status: rule.status || 'draft',
        tags: [rule.category || 'quality', 'readability', 'code-quality'],
        tools: rule.tools || [],
        framework: rule.framework || 'All',
        principles: rule.principles || []
      };
    }
  });
  
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Write registry file
  fs.writeFileSync(targetPath, JSON.stringify(registry, null, 2), 'utf8');
  
  const rulesCount = Object.keys(registry.rules).length;
  const fileSize = (fs.statSync(targetPath).size / 1024).toFixed(1);
  
  console.log(`✅ Generated registry with ${rulesCount} rules`);
  console.log(`📁 File: ${targetPath} (${fileSize} KB)`);
  console.log('');
  console.log('📊 Rules by category:');
  
  // Stats by category
  const categories = {};
  Object.values(registry.rules).forEach(rule => {
    const cat = rule.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} rules`);
    });
    
} catch (error) {
  console.error('❌ Error generating registry:', error.message);
  console.error(error.stack);
  process.exit(1);
}
