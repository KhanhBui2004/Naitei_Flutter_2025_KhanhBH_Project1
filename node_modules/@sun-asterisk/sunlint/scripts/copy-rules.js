#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Copy all rules files for packaging
 * This script copies all .md rules from ../sunlint/rules/ to ./origin-rules/ for production builds
 */

const sourceRulesDir = path.join(__dirname, '..', '..', '..', 'rules');
const targetRulesDir = path.join(__dirname, '..', 'origin-rules');

console.log('📋 Copying all rules for packaging...');
console.log(`Source: ${sourceRulesDir}`);
console.log(`Target: ${targetRulesDir}`);

try {
  // Check if source directory exists
  if (!fs.existsSync(sourceRulesDir)) {
    console.error('❌ Source rules directory not found:', sourceRulesDir);
    console.log('⚠️  Skipping rules copy - will use existing local rules if available');
    process.exit(0); // Don't fail build, just warn
  }

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetRulesDir)) {
    fs.mkdirSync(targetRulesDir, { recursive: true });
  }

  // Copy only English rule files (*-en.md) - skip empty base files and catalogs
  const allFiles = fs.readdirSync(sourceRulesDir);
  
  const ruleFiles = allFiles.filter(file => {
    // Only include English versions of rule files
    return file.endsWith('-en.md');
  });

  let copiedCount = 0;

  console.log(`📁 Found ${ruleFiles.length} English rule files to copy (ignoring empty base files and catalogs)...`);

  ruleFiles.forEach(fileName => {
    const sourcePath = path.join(sourceRulesDir, fileName);
    const targetPath = path.join(targetRulesDir, fileName);

    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${fileName}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${fileName}:`, error.message);
    }
  });

  // Also copy any CSV or other rule-related files (if they have content)
  const csvFiles = allFiles.filter(file => file.endsWith('.csv'));
  csvFiles.forEach(fileName => {
    const sourcePath = path.join(sourceRulesDir, fileName);
    const targetPath = path.join(targetRulesDir, fileName);
    
    try {
      // Check if file has content
      const stats = fs.statSync(sourcePath);
      if (stats.size > 0) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied CSV: ${fileName}`);
        copiedCount++;
      } else {
        console.log(`⚠️ Skipped empty CSV: ${fileName}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not copy ${fileName}: ${error.message}`);
    }
  });

  if (copiedCount > 0) {
    console.log(`✅ Successfully copied ${copiedCount} rule files to ${targetRulesDir}`);
  } else {
    console.log('⚠️ No files were copied');
  }

} catch (error) {
  console.error('❌ Error during rules copy:', error.message);
  process.exit(1);
}
