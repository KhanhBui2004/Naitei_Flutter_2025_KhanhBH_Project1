const { SimpleRuleParser } = require('../rules/parser/rule-parser-simple');
const fs = require('fs');
const path = require('path');

console.log('=== ANALYZING COMMON AND SECURITY RULES ===\n');

const parser = new SimpleRuleParser();

// Parse common rules
const commonRules = parser.parseRuleFile('../origin-rules/common-en.md');
const securityRules = parser.parseRuleFile('../origin-rules/security-en.md');

console.log(`📊 COMMON RULES: ${commonRules.length} total rules`);
console.log(`🔒 SECURITY RULES: ${securityRules.length} total rules\n`);

// Filter activated rules only
const activatedCommon = commonRules.filter(rule => rule.status === 'activated');
const activatedSecurity = securityRules.filter(rule => rule.status === 'activated');

console.log(`✅ ACTIVATED COMMON RULES: ${activatedCommon.length}`);
activatedCommon.forEach(rule => {
  const principles = Array.isArray(rule.principles) ? rule.principles.join(', ') : rule.principles || 'N/A';
  console.log(`  ${rule.id}: ${rule.title} [${principles}]`);
});

console.log(`\n🔐 ACTIVATED SECURITY RULES: ${activatedSecurity.length}`);
activatedSecurity.forEach(rule => {
  const principles = Array.isArray(rule.principles) ? rule.principles.join(', ') : rule.principles || 'N/A';
  console.log(`  ${rule.id}: ${rule.title} [${principles}]`);
});

// Analyze principles distribution
console.log('\n=== PRINCIPLE DISTRIBUTION ===');
const principleCount = {};
[...activatedCommon, ...activatedSecurity].forEach(rule => {
  if (Array.isArray(rule.principles)) {
    rule.principles.forEach(principle => {
      principleCount[principle] = (principleCount[principle] || 0) + 1;
    });
  }
});

Object.entries(principleCount).sort((a,b) => b[1] - a[1]).forEach(([principle, count]) => {
  console.log(`${principle}: ${count} rules`);
});

// Generate preset configurations
console.log('\n=== GENERATING PRESET CONFIGS ===');

// Recommended preset (balanced)
const recommendedRules = {};
[...activatedCommon, ...activatedSecurity].forEach(rule => {
  if (rule.id) {
    // Use warn for most rules, error for critical security
    if (rule.id.startsWith('S') && rule.severity === 'critical') {
      recommendedRules[rule.id] = 'error';
    } else {
      recommendedRules[rule.id] = 'warn';
    }
  }
});

// Security preset (security rules only)
const securityPresetRules = {};
activatedSecurity.forEach(rule => {
  if (rule.id) {
    securityPresetRules[rule.id] = rule.severity === 'critical' ? 'error' : 'warn';
  }
});

// Quality preset (non-security common rules)
const qualityPresetRules = {};
activatedCommon.forEach(rule => {
  if (rule.id && (!rule.principles || !rule.principles.includes('SECURITY'))) {
    qualityPresetRules[rule.id] = 'warn';
  }
});

console.log(`📋 RECOMMENDED preset: ${Object.keys(recommendedRules).length} rules`);
console.log(`🔒 SECURITY preset: ${Object.keys(securityPresetRules).length} rules`);
console.log(`⭐ QUALITY preset: ${Object.keys(qualityPresetRules).length} rules`);

// Generate preset files
const presetConfigs = {
  recommended: {
    name: "@sun/sunlint/recommended",
    description: "Sun* Engineering recommended configuration - essential rules from core files (common-en.md + security-en.md)",
    rules: recommendedRules,
    categories: {
      quality: "warn",
      security: "error"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(recommendedRules).length,
      coreRules: Object.keys(recommendedRules).length,
      approach: "core-files-only",
      source: "common-en.md + security-en.md",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  security: {
    name: "@sun/sunlint/security",
    description: "Security-focused configuration with all security rules",
    rules: securityPresetRules,
    categories: {
      security: "error"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(securityPresetRules).length,
      securityRules: Object.keys(securityPresetRules).length,
      approach: "security-focused",
      source: "security-en.md",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  quality: {
    name: "@sun/sunlint/quality",
    description: "Code quality and best practices focused configuration",
    rules: qualityPresetRules,
    categories: {
      quality: "warn",
      maintainability: "warn",
      testability: "warn"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(qualityPresetRules).length,
      qualityRules: Object.keys(qualityPresetRules).length,
      approach: "quality-focused",
      source: "common-en.md (non-security rules)",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  }
};

// Write preset files
Object.entries(presetConfigs).forEach(([name, config]) => {
  const filePath = `./config/presets/${name}.json`;
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log(`✅ Generated ${filePath}`);
});

console.log('\n=== PRESET GENERATION COMPLETE ===');
