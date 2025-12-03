#!/usr/bin/env node

/**
 * SunLint Category Management CLI
 * Utility for managing categories and principles
 * 
 * Usage:
 *   node scripts/category-manager.js list
 *   node scripts/category-manager.js add <category> <principle> <description>
 *   node scripts/category-manager.js validate
 *   node scripts/category-manager.js stats
 */

const path = require('path');
const {
  getValidCategories,
  getCategoryPrinciples,
  getCategoryDescription,
  getCategoryStats,
  isValidCategory,
  addCategoryMapping
} = require('../core/constants/categories');

const command = process.argv[2];

switch (command) {
  case 'list':
    listCategories();
    break;
    
  case 'validate':
    validateCategories();
    break;
    
  case 'stats':
    showStats();
    break;
    
  case 'add':
    addCategory(process.argv[3], process.argv[4], process.argv[5]);
    break;
    
  case 'check':
    checkCategory(process.argv[3]);
    break;
    
  default:
    showHelp();
}

function listCategories() {
  console.log('📋 SunLint Categories & Principles\n');
  
  const categories = getValidCategories();
  categories.forEach(category => {
    const principles = getCategoryPrinciples(category);
    const description = getCategoryDescription(category);
    
    console.log(`🏷️  ${category.toUpperCase()}`);
    console.log(`   Principles: ${principles.join(', ')}`);
    console.log(`   Description: ${description}`);
    console.log('');
  });
}

function validateCategories() {
  console.log('🔍 Validating Category System\n');
  
  const stats = getCategoryStats();
  console.log(`✅ Total Categories: ${stats.totalCategories}`);
  console.log(`✅ Total Principles: ${stats.totalPrinciples}`);
  
  // Check for missing principles
  const allPrinciples = Object.values(SUNLINT_PRINCIPLES);
  const mappedPrinciples = Object.values(CATEGORY_PRINCIPLE_MAP).flat();
  
  const missingPrinciples = allPrinciples.filter(p => !mappedPrinciples.includes(p));
  
  if (missingPrinciples.length > 0) {
    console.log(`⚠️  Unmapped Principles: ${missingPrinciples.join(', ')}`);
  } else {
    console.log('✅ All principles mapped to categories');
  }
  
  console.log('\n📊 Category Mapping:');
  Object.entries(CATEGORY_PRINCIPLE_MAP).forEach(([category, principles]) => {
    console.log(`   ${category} -> ${principles.join(', ')}`);
  });
}

function showStats() {
  const stats = getCategoryStats();
  console.log('📊 Category Statistics\n');
  console.log(JSON.stringify(stats, null, 2));
}

function addCategory(category, principle, description) {
  if (!category || !principle || !description) {
    console.error('❌ Usage: add <category> <principle> <description>');
    return;
  }
  
  console.log(`🔄 Adding category: ${category}`);
  console.log(`   Principle: ${principle}`);
  console.log(`   Description: ${description}`);
  console.log('\n⚠️  This would require updating category-constants.js manually');
  console.log('   Add the following to CATEGORY_PRINCIPLE_MAP:');
  console.log(`   '${category.toLowerCase()}': ['${principle.toUpperCase()}'],`);
}

function checkCategory(category) {
  if (!category) {
    console.error('❌ Usage: check <category>');
    return;
  }
  
  console.log(`🔍 Checking category: ${category}\n`);
  
  const isValid = isValidCategory(category);
  console.log(`Valid: ${isValid ? '✅' : '❌'}`);
  
  if (isValid) {
    const principles = getCategoryPrinciples(category);
    const description = getCategoryDescription(category);
    
    console.log(`Principles: ${principles.join(', ')}`);
    console.log(`Description: ${description}`);
  } else {
    console.log(`Valid categories: ${getValidCategories().join(', ')}`);
  }
}

function showHelp() {
  console.log(`
🛠️  SunLint Category Manager

Commands:
  list      Show all categories and their principles
  validate  Validate the category system consistency
  stats     Show category statistics
  check     Check if a specific category is valid
  add       Add a new category (manual step required)

Examples:
  node scripts/category-manager.js list
  node scripts/category-manager.js check security
  node scripts/category-manager.js validate
  node scripts/category-manager.js add accessibility ACCESSIBILITY "Accessibility guidelines"
`);
}
