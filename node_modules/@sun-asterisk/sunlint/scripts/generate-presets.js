const { SimpleRuleParser } = require('../rules/parser/rule-parser-simple');
const fs = require('fs');

console.log('=== GENERATING ADDITIONAL PRESETS ===\n');

const parser = new SimpleRuleParser();
const commonRules = parser.parseRuleFile('../origin-rules/common-en.md');
const securityRules = parser.parseRuleFile('../origin-rules/security-en.md');
const allRules = [...commonRules, ...securityRules];
const activatedRules = allRules.filter(rule => rule.status === 'activated');

// Generate additional presets

// 1. Beginner preset (basic rules only)
const beginnerRules = {};
const beginnerRuleIds = ['C019', 'C029', 'C006']; // Basic logging, error handling, naming
activatedRules.forEach(rule => {
  if (beginnerRuleIds.includes(rule.id)) {
    beginnerRules[rule.id] = rule.id === 'C006' ? 'info' : 'warn';
  }
});

// 2. CI preset (critical rules only)
const ciRules = {};
activatedRules.forEach(rule => {
  if (rule.id === 'C019' || rule.id === 'C029' || rule.id.startsWith('S')) {
    ciRules[rule.id] = rule.severity === 'critical' ? 'error' : 'error';
  }
});
// Turn off naming for CI
ciRules['C006'] = 'off';

// 3. Strict preset (all rules as errors)
const strictRules = {};
const strictRuleIds = ['C019', 'C029', 'C006'];
activatedRules.forEach(rule => {
  if (strictRuleIds.includes(rule.id)) {
    strictRules[rule.id] = 'error';
  }
});

// 4. Maintainability preset
const maintainabilityRules = {};
activatedRules.forEach(rule => {
  if (rule.principles && rule.principles.includes('MAINTAINABILITY')) {
    maintainabilityRules[rule.id] = 'warn';
  }
});

// 5. Performance preset
const performanceRules = {};
activatedRules.forEach(rule => {
  if (rule.principles && rule.principles.includes('PERFORMANCE')) {
    performanceRules[rule.id] = 'warn';
  }
});

// 6. All preset (all activated rules)
const allActivatedRules = {};
activatedRules.forEach(rule => {
  if (rule.id) {
    if (rule.id.startsWith('S') && rule.severity === 'critical') {
      allActivatedRules[rule.id] = 'error';
    } else {
      allActivatedRules[rule.id] = 'warn';
    }
  }
});

const additionalPresets = {
  beginner: {
    name: "@sun/sunlint/beginner",
    description: "Beginner-friendly configuration with warnings only",
    rules: beginnerRules,
    categories: {
      quality: "warn",
      security: "warn",
      logging: "warn",
      naming: "info",
      validation: "warn"
    },
    languages: ["typescript"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(beginnerRules).length,
      approach: "beginner-friendly",
      source: "selected core rules",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  ci: {
    name: "@sun/sunlint/ci",
    description: "Configuration optimized for CI/CD pipelines",
    rules: ciRules,
    categories: {
      quality: "error",
      security: "error",
      logging: "error",
      naming: "off",
      validation: "error"
    },
    languages: ["typescript", "dart"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(ciRules).length,
      approach: "ci-optimized",
      source: "critical rules only",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  strict: {
    name: "@sun/sunlint/strict",
    description: "Strict configuration for production projects",
    rules: strictRules,
    categories: {
      quality: "error",
      security: "error",
      logging: "error",
      naming: "warn",
      validation: "error"
    },
    languages: ["typescript", "dart", "kotlin"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(strictRules).length,
      approach: "strict",
      source: "core rules as errors",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  maintainability: {
    name: "@sun/sunlint/maintainability",
    description: "Maintainability and clean code focused configuration",
    rules: maintainabilityRules,
    categories: {
      maintainability: "warn",
      design: "warn"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(maintainabilityRules).length,
      approach: "maintainability-focused",
      source: "maintainability principle rules",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  performance: {
    name: "@sun/sunlint/performance",
    description: "Performance-focused configuration for optimization",
    rules: performanceRules,
    categories: {
      performance: "warn"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(performanceRules).length,
      approach: "performance-focused",
      source: "performance principle rules",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  },
  all: {
    name: "@sun/sunlint/all",
    description: "Comprehensive configuration with all activated rules from core files",
    rules: allActivatedRules,
    categories: {
      quality: "warn",
      security: "error",
      performance: "warn",
      maintainability: "warn",
      testability: "warn",
      documentation: "warn"
    },
    languages: ["typescript", "javascript", "dart", "java", "kotlin", "swift"],
    exclude: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/*.generated.*", "**/*.min.*"],
    metadata: {
      totalRules: Object.keys(allActivatedRules).length,
      removedRules: 0,
      approach: "comprehensive-activated-only",
      source: "common-en.md + security-en.md (activated only)",
      lastUpdated: new Date().toISOString(),
      version: "2.0.0"
    }
  }
};

// Write additional preset files
Object.entries(additionalPresets).forEach(([name, config]) => {
  const filePath = `../config/presets/${name}.json`;
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log(`✅ Generated ${filePath} (${Object.keys(config.rules).length} rules)`);
});

console.log('\n=== ADDITIONAL PRESET GENERATION COMPLETE ===');
console.log(`🎯 Total presets: ${Object.keys(additionalPresets).length + 3} (including recommended, security, quality)`);
