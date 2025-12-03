#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { SimpleRuleParser } = require('../rules/parser/rule-parser-simple.js');

class SunLintInsightGenerator {
    constructor() {
        this.parser = new SimpleRuleParser();
        this.heuristicRulesPath = path.join(__dirname, '../rules/common');
    }

    // Get implemented rules
    getImplementedRules() {
        const implemented = new Set();
        if (fs.existsSync(this.heuristicRulesPath)) {
            const dirs = fs.readdirSync(this.heuristicRulesPath);
            dirs.forEach(dir => {
                const match = dir.match(/^([A-Z]\d+)_/);
                if (match) {
                    implemented.add(match[1]);
                }
            });
        }
        return implemented;
    }

    // Assess priority based on rule content
    assessPriority(rule) {
        const text = `${rule.title} ${rule.description} ${rule.detail || ''}`.toLowerCase();
        const principles = rule.principles || [];
        
        if (principles.includes('SECURITY')) return 'High';
        if (principles.includes('PERFORMANCE')) return 'High';
        if (principles.includes('RELIABILITY')) return 'Medium-High';
        
        const impactKeywords = {
            high: ['security', 'memory', 'performance', 'crash', 'null pointer', 'xss', 'injection', 'vulnerability', 'race condition'],
            medium: ['testability', 'maintainability', 'readability', 'coupling', 'cohesion', 'dependency'],
            low: ['naming', 'style', 'convention', 'formatting', 'comment']
        };
        
        for (const keyword of impactKeywords.high) {
            if (text.includes(keyword)) return 'High';
        }
        for (const keyword of impactKeywords.medium) {
            if (text.includes(keyword)) return 'Medium';
        }
        for (const keyword of impactKeywords.low) {
            if (text.includes(keyword)) return 'Low';
        }
        
        return 'Medium';
    }

    // Generate actionable insights
    generateInsights() {
        console.log('🔍 Analyzing SunLint rules...');
        const allRules = this.parser.parseAllRules();
        const activatedRules = this.parser.filterRules(allRules, { status: 'activated' });
        const implementedRules = this.getImplementedRules();
        
        console.log('\n📊 === SUNLINT HEURISTIC ENGINE ANALYSIS ===\n');
        
        // Overall statistics
        const totalImplemented = activatedRules.filter(rule => implementedRules.has(rule.id)).length;
        const implementationRate = ((totalImplemented / activatedRules.length) * 100).toFixed(1);
        
        console.log(`🎯 **Current Implementation Status:**`);
        console.log(`   • Total Activated Rules: ${activatedRules.length}`);
        console.log(`   • Implemented in Heuristic: ${totalImplemented} (${implementationRate}%)`);
        console.log(`   • Remaining to Implement: ${activatedRules.length - totalImplemented}\n`);

        // Priority analysis
        const priorities = { 'High': 0, 'Medium-High': 0, 'Medium': 0, 'Low': 0 };
        const notImplementedByPriority = { 'High': [], 'Medium-High': [], 'Medium': [], 'Low': [] };
        
        activatedRules.forEach(rule => {
            const priority = this.assessPriority(rule);
            priorities[priority]++;
            
            if (!implementedRules.has(rule.id)) {
                notImplementedByPriority[priority].push(rule);
            }
        });

        console.log(`🔥 **Priority Breakdown:**`);
        Object.entries(priorities).forEach(([priority, count]) => {
            const missing = notImplementedByPriority[priority].length;
            const implemented = count - missing;
            const rate = count > 0 ? ((implemented / count) * 100).toFixed(1) : '0.0';
            console.log(`   • ${priority}: ${implemented}/${count} implemented (${rate}%) - ${missing} missing`);
        });

        // Category analysis
        console.log(`\n📂 **Implementation by Category:**`);
        const categories = {
            'C': 'Common Code Quality',
            'T': 'TypeScript',
            'R': 'ReactJS',
            'S': 'Security',
            'J': 'Java',
            'K': 'Kotlin Mobile',
            'D': 'Dart/Flutter',
            'SW': 'Swift'
        };

        Object.entries(categories).forEach(([prefix, name]) => {
            const categoryRules = activatedRules.filter(rule => rule.id.startsWith(prefix));
            const categoryImplemented = categoryRules.filter(rule => implementedRules.has(rule.id)).length;
            const rate = categoryRules.length > 0 ? ((categoryImplemented / categoryRules.length) * 100).toFixed(1) : '0.0';
            console.log(`   • ${name}: ${categoryImplemented}/${categoryRules.length} (${rate}%)`);
        });

        // Top missing high-priority rules
        console.log(`\n🚨 **Top 10 Missing High-Priority Rules:**`);
        notImplementedByPriority['High'].slice(0, 10).forEach((rule, i) => {
            console.log(`   ${i+1}. ${rule.id}: ${rule.title}`);
            console.log(`      → ${rule.description?.substring(0, 80)}...`);
        });

        // Quick wins (easy to implement)
        console.log(`\n⚡ **Quick Wins (Low Complexity, High Impact):**`);
        const quickWins = notImplementedByPriority['High'].filter(rule => {
            const text = rule.title.toLowerCase();
            return text.includes('console.log') || text.includes('print') || 
                   text.includes('hardcode') || text.includes('sensitive');
        });
        
        quickWins.slice(0, 5).forEach((rule, i) => {
            console.log(`   ${i+1}. ${rule.id}: ${rule.title} - Text/Regex patterns`);
        });

        // Performance impact rules
        console.log(`\n⚡ **Performance-Critical Missing Rules:**`);
        const perfRules = notImplementedByPriority['High'].filter(rule => 
            rule.principles?.includes('PERFORMANCE') || 
            rule.description?.toLowerCase().includes('performance')
        );
        
        perfRules.slice(0, 5).forEach((rule, i) => {
            console.log(`   ${i+1}. ${rule.id}: ${rule.title}`);
        });

        // Security rules
        console.log(`\n🔒 **Security-Critical Missing Rules:**`);
        const securityRules = notImplementedByPriority['High'].filter(rule => 
            rule.principles?.includes('SECURITY') ||
            rule.description?.toLowerCase().includes('security')
        );
        
        securityRules.slice(0, 5).forEach((rule, i) => {
            console.log(`   ${i+1}. ${rule.id}: ${rule.title}`);
        });

        // Recommendations
        console.log(`\n💡 **Actionable Recommendations:**`);
        console.log(`   1. Focus on High Priority rules first: ${notImplementedByPriority['High'].length} rules remaining`);
        console.log(`   2. Implement Common (C) rules first - highest coverage impact`);
        console.log(`   3. Start with Low complexity rules using text/regex patterns`);
        console.log(`   4. Performance rules should be prioritized for production impact`);
        console.log(`   5. Security rules are critical for safe code practices`);
        console.log(`   6. Consider AST analysis for complex rules (Medium-High complexity)`);
        
        console.log(`\n📈 **ROI Analysis:**`);
        const commonMissing = notImplementedByPriority['High'].filter(rule => rule.id.startsWith('C')).length;
        console.log(`   • Common rules impact: All languages (${commonMissing} High-priority missing)`);
        console.log(`   • Language-specific rules: Limited scope but deep impact`);
        console.log(`   • Implementation effort: Low complexity rules = 1-2 days, High = 1-2 weeks`);
        
        return {
            total: activatedRules.length,
            implemented: totalImplemented,
            missing: activatedRules.length - totalImplemented,
            highPriorityMissing: notImplementedByPriority['High'].length,
            quickWins: quickWins.length,
            recommendations: notImplementedByPriority
        };
    }
}

// Run analysis
if (require.main === module) {
    const analyzer = new SunLintInsightGenerator();
    analyzer.generateInsights();
}

module.exports = SunLintInsightGenerator;
