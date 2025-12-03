#!/usr/bin/env node

/**
 * Validation script to ensure all rule test fixtures follow standardized structure
 */

const fs = require('fs');
const path = require('path');

const RULES_DIR = 'examples/rule-test-fixtures/rules';

function validateRuleStructure() {
    console.log('🔍 Validating Rule Test Fixtures Structure\n');
    
    const rulesPath = path.resolve(__dirname, '..', RULES_DIR);
    const ruleDirs = fs.readdirSync(rulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.') && name !== 'README.md');

    let allValid = true;
    const results = [];

    for (const ruleDir of ruleDirs) {
        const rulePath = path.join(rulesPath, ruleDir);
        const result = {
            rule: ruleDir,
            hasClean: false,
            hasViolations: false,
            cleanFiles: [],
            violationFiles: [],
            issues: []
        };

        // Check for clean directory
        const cleanPath = path.join(rulePath, 'clean');
        if (fs.existsSync(cleanPath)) {
            result.hasClean = true;
            result.cleanFiles = fs.readdirSync(cleanPath).filter(f => !f.startsWith('.'));
        } else {
            result.issues.push('Missing clean/ directory');
            allValid = false;
        }

        // Check for violations directory  
        const violationsPath = path.join(rulePath, 'violations');
        if (fs.existsSync(violationsPath)) {
            result.hasViolations = true;
            result.violationFiles = fs.readdirSync(violationsPath).filter(f => !f.startsWith('.'));
        } else {
            result.issues.push('Missing violations/ directory');
            allValid = false;
        }

        // Check for loose files (should be moved to clean/violations)
        const allFiles = fs.readdirSync(rulePath, { withFileTypes: true });
        const looseFiles = allFiles
            .filter(dirent => dirent.isFile() && !dirent.name.startsWith('.') && dirent.name !== 'README.md')
            .map(dirent => dirent.name);
        
        if (looseFiles.length > 0) {
            result.issues.push(`Loose files found: ${looseFiles.join(', ')}`);
            allValid = false;
        }

        results.push(result);
    }

    // Display results
    console.log(`📊 Validation Results for ${results.length} rules:\n`);
    
    for (const result of results) {
        const status = result.issues.length === 0 ? '✅' : '❌';
        console.log(`${status} ${result.rule}`);
        
        if (result.hasClean) {
            console.log(`   ✅ clean/ (${result.cleanFiles.length} files)`);
        } else {
            console.log(`   ❌ clean/ directory missing`);
        }
        
        if (result.hasViolations) {
            console.log(`   ✅ violations/ (${result.violationFiles.length} files)`);
        } else {
            console.log(`   ❌ violations/ directory missing`);
        }

        if (result.issues.length > 0) {
            result.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
        }
        
        console.log('');
    }

    // Summary
    const validRules = results.filter(r => r.issues.length === 0).length;
    const invalidRules = results.length - validRules;

    console.log('📈 Summary:');
    console.log(`   ✅ Valid rules: ${validRules}`);
    console.log(`   ❌ Invalid rules: ${invalidRules}`);
    console.log(`   📁 Total rules: ${results.length}`);

    if (allValid) {
        console.log('\n🎉 All rules follow standardized structure!');
    } else {
        console.log('\n⚠️  Some rules need structure fixes.');
    }

    return allValid;
}

// Create missing clean folders for empty rules
function createMissingFolders() {
    console.log('\n🛠️  Creating missing folders...\n');
    
    const rulesPath = path.resolve(__dirname, '..', RULES_DIR);
    const ruleDirs = fs.readdirSync(rulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.') && name !== 'README.md');

    for (const ruleDir of ruleDirs) {
        const rulePath = path.join(rulesPath, ruleDir);
        
        // Create clean folder if missing
        const cleanPath = path.join(rulePath, 'clean');
        if (!fs.existsSync(cleanPath)) {
            fs.mkdirSync(cleanPath, { recursive: true });
            console.log(`✅ Created: ${ruleDir}/clean/`);
        }
        
        // Create violations folder if missing
        const violationsPath = path.join(rulePath, 'violations');
        if (!fs.existsSync(violationsPath)) {
            fs.mkdirSync(violationsPath, { recursive: true });
            console.log(`✅ Created: ${ruleDir}/violations/`);
        }
    }
}

if (require.main === module) {
    createMissingFolders();
    const isValid = validateRuleStructure();
    process.exit(isValid ? 0 : 1);
}

module.exports = { validateRuleStructure, createMissingFolders };
