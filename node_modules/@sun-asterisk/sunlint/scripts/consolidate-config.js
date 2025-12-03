#!/usr/bin/env node

/**
 * Script to consolidate all rules from rules-registry.json into enhanced-rules-registry.json
 * then remove the old file to avoid config conflicts
 */

const fs = require('fs');
const path = require('path');

const oldRegistryPath = '/Users/bach.ngoc.hoai/Docs/ee/coding-quality/extensions/sunlint/config/rules/rules-registry.json';
const enhancedRegistryPath = '/Users/bach.ngoc.hoai/Docs/ee/coding-quality/extensions/sunlint/config/rules/enhanced-rules-registry.json';

console.log('🔄 Consolidating rule configurations...');

try {
  // Read both files
  const oldRegistry = JSON.parse(fs.readFileSync(oldRegistryPath, 'utf8'));
  const enhancedRegistry = JSON.parse(fs.readFileSync(enhancedRegistryPath, 'utf8'));
  
  console.log(`📊 Old registry has ${Object.keys(oldRegistry.rules).length} rules`);
  console.log(`📊 Enhanced registry has ${Object.keys(enhancedRegistry.rules).length} rules`);
  
  // Track what was added
  let addedRules = [];
  let skippedRules = [];
  
  // Add rules from old registry that don't exist in enhanced registry
  for (const [ruleId, ruleConfig] of Object.entries(oldRegistry.rules)) {
    if (!enhancedRegistry.rules[ruleId]) {
      console.log(`➕ Adding rule ${ruleId}: ${ruleConfig.name}`);
      enhancedRegistry.rules[ruleId] = ruleConfig;
      addedRules.push(ruleId);
    } else {
      console.log(`⏭️  Skipping rule ${ruleId} (already exists in enhanced registry)`);
      skippedRules.push(ruleId);
    }
  }
  
  // Merge categories if needed
  if (oldRegistry.categories) {
    for (const [categoryId, categoryConfig] of Object.entries(oldRegistry.categories)) {
      if (!enhancedRegistry.categories) {
        enhancedRegistry.categories = {};
      }
      if (!enhancedRegistry.categories[categoryId]) {
        console.log(`➕ Adding category ${categoryId}: ${categoryConfig.name}`);
        enhancedRegistry.categories[categoryId] = categoryConfig;
      } else {
        // Merge rules from old category
        const existingRules = new Set(enhancedRegistry.categories[categoryId].rules);
        const newRules = categoryConfig.rules.filter(rule => !existingRules.has(rule));
        if (newRules.length > 0) {
          console.log(`🔄 Merging ${newRules.length} rules into category ${categoryId}`);
          enhancedRegistry.categories[categoryId].rules.push(...newRules);
        }
      }
    }
  }
  
  // Merge presets if needed
  if (oldRegistry.presets) {
    for (const [presetId, presetConfig] of Object.entries(oldRegistry.presets)) {
      if (!enhancedRegistry.presets) {
        enhancedRegistry.presets = {};
      }
      if (!enhancedRegistry.presets[presetId]) {
        console.log(`➕ Adding preset ${presetId}: ${presetConfig.name}`);
        enhancedRegistry.presets[presetId] = presetConfig;
      }
    }
  }
  
  // Merge languages if needed
  if (oldRegistry.languages) {
    for (const [langId, langConfig] of Object.entries(oldRegistry.languages)) {
      if (!enhancedRegistry.languages) {
        enhancedRegistry.languages = {};
      }
      if (!enhancedRegistry.languages[langId]) {
        console.log(`➕ Adding language ${langId}`);
        enhancedRegistry.languages[langId] = langConfig;
      }
    }
  }
  
  // Update metadata
  if (enhancedRegistry.metadata) {
    enhancedRegistry.metadata.totalRules = Object.keys(enhancedRegistry.rules).length;
    enhancedRegistry.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    enhancedRegistry.metadata.consolidatedFrom = oldRegistryPath;
  }
  
  // Write enhanced registry back
  fs.writeFileSync(enhancedRegistryPath, JSON.stringify(enhancedRegistry, null, 2));
  
  console.log('✅ Consolidation completed!');
  console.log(`📊 Total rules now: ${Object.keys(enhancedRegistry.rules).length}`);
  console.log(`➕ Added rules: ${addedRules.length} - ${addedRules.join(', ')}`);
  console.log(`⏭️  Skipped rules: ${skippedRules.length} - ${skippedRules.join(', ')}`);
  
  // Create backup of old registry before deletion
  const backupPath = oldRegistryPath + '.backup';
  fs.copyFileSync(oldRegistryPath, backupPath);
  console.log(`💾 Created backup: ${backupPath}`);
  
  // Remove old registry
  fs.unlinkSync(oldRegistryPath);
  console.log(`🗑️  Removed old registry: ${oldRegistryPath}`);
  
  console.log('🎉 Configuration consolidation complete!');
  
} catch (error) {
  console.error('❌ Error during consolidation:', error);
  process.exit(1);
}
