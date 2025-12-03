/**
 * ESLint to Heuristic Migration Converter
 * Automated tool for migrating ESLint rules to heuristic engine
 */

const fs = require('fs');
const path = require('path');
const mapping = require('./mapping.json');

class MigrationConverter {
    constructor() {
        this.mapping = mapping;
        this.rulesDir = path.join(__dirname, '..');
        this.eslintRulesDir = path.join(__dirname, '../../integrations/eslint/plugin/rules');
    }

    /**
     * Get migration info for a specific rule
     * @param {string} ruleId - Rule ID (e.g., 'C006', 'S001')
     * @returns {Object|null} Migration info
     */
    getMigrationInfo(ruleId) {
        return this.mapping.migrations.find(m => 
            m.heuristic_rule.startsWith(ruleId)
        );
    }

    /**
     * Create heuristic rule directory structure
     * @param {string} category - Rule category
     * @param {string} ruleId - Rule ID
     * @returns {string} Created directory path
     */
    createRuleStructure(category, ruleId) {
        const ruleDir = path.join(this.rulesDir, category, ruleId);
        
        if (!fs.existsSync(ruleDir)) {
            fs.mkdirSync(ruleDir, { recursive: true });
            console.log(`✅ Created rule directory: ${ruleDir}`);
        }

        // Create rule files if they don't exist
        const files = ['analyzer.js', 'config.json', 'test.js', 'README.md'];
        files.forEach(file => {
            const filePath = path.join(ruleDir, file);
            if (!fs.existsSync(filePath)) {
                this.createRuleFile(filePath, file, ruleId, category);
            }
        });

        return ruleDir;
    }

    /**
     * Create individual rule file with template content
     * @param {string} filePath - File path to create
     * @param {string} fileName - File name
     * @param {string} ruleId - Rule ID
     * @param {string} category - Rule category
     */
    createRuleFile(filePath, fileName, ruleId, category) {
        let content = '';

        switch (fileName) {
            case 'analyzer.js':
                content = this.generateAnalyzerTemplate(ruleId, category);
                break;
            case 'config.json':
                content = this.generateConfigTemplate(ruleId, category);
                break;
            case 'test.js':
                content = this.generateTestTemplate(ruleId, category);
                break;
            case 'README.md':
                content = this.generateReadmeTemplate(ruleId, category);
                break;
        }

        fs.writeFileSync(filePath, content);
        console.log(`✅ Created: ${filePath}`);
    }

    /**
     * Generate analyzer template
     */
    generateAnalyzerTemplate(ruleId, category) {
        return `/**
 * ${ruleId} - Heuristic Rule Analyzer
 * Category: ${category}
 * 
 * TODO: Migrate logic from ESLint rule
 * ESLint rule: integrations/eslint/plugin/rules/${category}/${ruleId.toLowerCase().replace('_', '-')}.js
 */

const { PatternMatcher } = require('../common/pattern-matchers');
const { RuleHelper } = require('../common/rule-helpers');

class ${ruleId}Analyzer {
    constructor(config = {}) {
        this.config = config;
        this.patternMatcher = new PatternMatcher();
        this.helper = new RuleHelper();
    }

    /**
     * Analyze code content for rule violations
     * @param {string} content - File content
     * @param {string} filePath - File path
     * @param {Object} context - Analysis context
     * @returns {Array} Array of violations
     */
    analyze(content, filePath, context = {}) {
        const violations = [];

        // TODO: Implement heuristic analysis logic
        // This should replicate the ESLint rule behavior using pattern matching
        
        try {
            // Example pattern-based analysis
            // const patterns = this.getViolationPatterns();
            // const matches = this.patternMatcher.findMatches(content, patterns);
            // 
            // matches.forEach(match => {
            //     violations.push(this.helper.createViolation({
            //         ruleId: '${ruleId}',
            //         message: 'Rule violation detected',
            //         line: match.line,
            //         column: match.column,
            //         severity: 'error'
            //     }));
            // });

        } catch (error) {
            console.warn(\`Error analyzing \${filePath} with ${ruleId}:\`, error.message);
        }

        return violations;
    }

    /**
     * Get violation patterns for this rule
     * @returns {Array} Array of patterns to match
     */
    getViolationPatterns() {
        // TODO: Define patterns based on ESLint rule logic
        return [];
    }
}

module.exports = ${ruleId}Analyzer;
`;
    }

    /**
     * Generate config template
     */
    generateConfigTemplate(ruleId, category) {
        const migration = this.getMigrationInfo(ruleId);
        return JSON.stringify({
            "id": ruleId,
            "name": migration ? migration.heuristic_rule : ruleId,
            "category": category,
            "description": `${ruleId} heuristic rule - migrated from ESLint`,
            "severity": "error",
            "enabled": true,
            "migration": {
                "from_eslint": migration ? migration.eslint_rule : "unknown",
                "compatibility": migration ? migration.compatibility : "pending",
                "status": migration ? migration.status : "pending"
            },
            "patterns": {
                "include": ["**/*.js", "**/*.ts"],
                "exclude": ["**/*.test.*", "**/*.spec.*"]
            }
        }, null, 2);
    }

    /**
     * Generate test template
     */
    generateTestTemplate(ruleId, category) {
        return `/**
 * ${ruleId} - Rule Tests
 * Tests for heuristic rule analyzer
 */

const ${ruleId}Analyzer = require('./analyzer');

describe('${ruleId} Heuristic Rule', () => {
    let analyzer;

    beforeEach(() => {
        analyzer = new ${ruleId}Analyzer();
    });

    describe('Valid Code', () => {
        test('should not report violations for valid code', () => {
            const code = \`
                // TODO: Add valid code examples
            \`;

            const violations = analyzer.analyze(code, 'test.js');
            expect(violations).toHaveLength(0);
        });
    });

    describe('Invalid Code', () => {
        test('should report violations for invalid code', () => {
            const code = \`
                // TODO: Add invalid code examples
            \`;

            const violations = analyzer.analyze(code, 'test.js');
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].ruleId).toBe('${ruleId}');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty code', () => {
            const violations = analyzer.analyze('', 'test.js');
            expect(violations).toHaveLength(0);
        });

        test('should handle syntax errors gracefully', () => {
            const code = 'invalid javascript syntax {{{';
            const violations = analyzer.analyze(code, 'test.js');
            expect(Array.isArray(violations)).toBe(true);
        });
    });
});
`;
    }

    /**
     * Generate README template
     */
    generateReadmeTemplate(ruleId, category) {
        const migration = this.getMigrationInfo(ruleId);
        return `# ${ruleId} - ${category.toUpperCase()} Rule

## 📋 Overview

**Rule ID**: \`${ruleId}\`  
**Category**: ${category}  
**Severity**: Error  
**Status**: ${migration ? migration.status : 'Pending Migration'}

## 🎯 Description

TODO: Add rule description after migration from ESLint.

${migration ? `
## 🔄 Migration Info

**ESLint Rule**: \`${migration.eslint_rule}\`  
**Compatibility**: ${migration.compatibility}  
**Priority**: ${migration.priority}
` : ''}

## ✅ Valid Code Examples

\`\`\`javascript
// TODO: Add valid code examples
\`\`\`

## ❌ Invalid Code Examples

\`\`\`javascript  
// TODO: Add invalid code examples that should trigger violations
\`\`\`

## ⚙️ Configuration

\`\`\`json
{
  "rules": {
    "${ruleId}": "error"
  }
}
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run rule-specific tests
npm test -- ${ruleId.toLowerCase()}

# Test with SunLint CLI
sunlint --rules=${ruleId} --input=examples/
\`\`\`

---

**Migration Status**: ${migration ? migration.status : 'Pending'}  
**Last Updated**: ${new Date().toISOString().split('T')[0]}
`;
    }

    /**
     * Migrate a specific rule
     * @param {string} ruleId - Rule ID to migrate
     * @returns {boolean} Success status
     */
    async migrateRule(ruleId) {
        const migration = this.getMigrationInfo(ruleId);
        
        if (!migration) {
            console.error(`❌ No migration mapping found for rule: ${ruleId}`);
            return false;
        }

        if (migration.status === 'completed') {
            console.log(`✅ Rule ${ruleId} already migrated`);
            return true;
        }

        console.log(`🔄 Migrating rule: ${ruleId}`);
        console.log(`   ESLint: ${migration.eslint_rule}`);
        console.log(`   Category: ${migration.category}`);
        console.log(`   Compatibility: ${migration.compatibility}`);

        try {
            // Create heuristic rule structure
            this.createRuleStructure(migration.category, migration.heuristic_rule);

            console.log(`✅ Migration template created for ${ruleId}`);
            console.log(`📝 Next steps:`);
            console.log(`   1. Implement analyzer logic in rules/${migration.category}/${migration.heuristic_rule}/analyzer.js`);
            console.log(`   2. Add test cases in rules/${migration.category}/${migration.heuristic_rule}/test.js`);
            console.log(`   3. Update rule documentation`);
            console.log(`   4. Test against ESLint rule behavior`);

            return true;

        } catch (error) {
            console.error(`❌ Migration failed for ${ruleId}:`, error.message);
            return false;
        }
    }

    /**
     * Show migration statistics
     */
    showStats() {
        const stats = this.mapping.migration_stats;
        console.log('📊 Migration Statistics:');
        console.log(`   Total Rules: ${stats.total_rules}`);
        console.log(`   Completed: ${stats.completed}`);
        console.log(`   Pending: ${stats.pending}`);
        console.log('');
        console.log('📋 By Category:');
        Object.entries(stats.by_category).forEach(([category, data]) => {
            console.log(`   ${category}: ${data.completed}/${data.total} completed`);
        });
    }
}

// CLI usage
if (require.main === module) {
    const converter = new MigrationConverter();
    const args = process.argv.slice(2);
    
    if (args.includes('--stats')) {
        converter.showStats();
    } else if (args.includes('--rule')) {
        const ruleIndex = args.indexOf('--rule');
        const ruleId = args[ruleIndex + 1];
        if (ruleId) {
            converter.migrateRule(ruleId);
        } else {
            console.error('❌ Please specify a rule ID with --rule');
        }
    } else {
        console.log('🚀 SunLint Migration Converter');
        console.log('');
        console.log('Usage:');
        console.log('  node converter.js --stats          # Show migration statistics');
        console.log('  node converter.js --rule C006     # Migrate specific rule');
        console.log('');
        converter.showStats();
    }
}

module.exports = MigrationConverter;
