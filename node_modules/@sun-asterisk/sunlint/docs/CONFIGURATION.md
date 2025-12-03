# SunLint Configuration Guide

This document provides a comprehensive guide to all SunLint configuration options.

## 🏗️ Architecture Overview

SunLint uses a **unified adapter pattern** for rule management, ensuring consistency between CLI and VSCode extension:

### Rule Access Architecture
```
CLI Tools → SunlintRuleAdapter → Rule Sources (Registry + Origin Rules)
     ↓              ↓
VSCode Extension → RuleReaderService → Rule Sources (Registry + Origin Rules)
```

### Key Benefits
- **Unified Rule Model**: Both CLI and extension use the same rule access pattern
- **No Direct Parser Access**: All rule queries go through adapter layer
- **AI Context Consistency**: OpenAI integration gets correct context from origin-rules
- **Extensible**: Easy to add new rule sources or engines

### Rule Sources Priority
1. **Primary**: `config/rules/rules-registry-generated.json` (auto-generated from origin-rules)
2. **Fallback**: `origin-rules/*.md` files (direct markdown parsing)
3. **Cache**: Memory cache for performance optimization

## 📋 Quick Start

Create `.sunlint.json` in your project root:

```json
{
  "extends": "@sun/sunlint/recommended",
  "input": ["src"],
  "exclude": ["**/*.test.*", "**/*.generated.*"],
  "rules": {
    "C019": "error",
    "C006": "warn", 
    "S005": "error"
  }
}
```

## 📖 Complete Configuration Reference

Below is the full configuration schema with all available options and their descriptions:

```json
{
  "//": "=== SunLint Full Configuration Example ===",
  "//": "Copy this configuration and customize as needed",
  
  "//extends": "Configuration preset to extend from",
  "extends": "@sun/sunlint/recommended",
  "//extends-options": [
    "@sun/sunlint/recommended",
    "@sun/sunlint/security", 
    "@sun/sunlint/quality",
    "@sun/sunlint/beginner",
    "@sun/sunlint/ci"
  ],

  "//engine": "Analysis engine selection (future-proof for multi-engine support)",
  "engine": "heuristic",
  "//engine-options": ["heuristic", "eslint", "ai"],

  "//input": "Default input paths when --input is not specified",
  "input": ["src", "lib"],

  "//include": "File patterns to include in analysis",
  "include": [
    "src/**/*.{js,ts,jsx,tsx}",
    "lib/**/*.{js,ts,jsx,tsx}",
    "api/**/*.{js,ts}",
    "**/*.dart"
  ],

  "//exclude": "File patterns to exclude from analysis", 
  "exclude": [
    "**/*.test.*",
    "**/*.spec.*",
    "**/*.generated.*",
    "**/*.d.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**"
  ],

  "//languages": "Language-specific configurations",
  "languages": {
    "typescript": {
      "//": "TypeScript specific patterns and rules",
      "include": ["**/*.ts", "**/*.tsx"],
      "exclude": ["**/*.d.ts", "**/*.test.ts"],
      "rules": {
        "//": "Override rules for TypeScript files",
        "C006": "error",
        "C019": "warn"
      }
    },
    "javascript": {
      "include": ["**/*.js", "**/*.jsx"],
      "exclude": ["**/*.test.js", "**/*.config.js"]
    },
    "dart": {
      "include": ["**/*.dart"],
      "exclude": ["**/*.g.dart", "**/*.freezed.dart"]
    }
  },

  "//testPatterns": "Test file specific configurations",
  "testPatterns": {
    "include": [
      "**/*.test.*",
      "**/*.spec.*", 
      "**/tests/**",
      "**/__tests__/**"
    ],
    "rules": {
      "//": "Rules often relaxed for test files",
      "C006": "off",
      "C007": "warn",
      "S012": "off"
    }
  },

  "//rules": "Rule-specific configurations",
  "rules": {
    "//": "=== Quality Rules ===",
    "C005": "error",  "//C005": "Single Responsibility Principle",
    "C006": "warn",   "//C006": "Function Naming Conventions", 
    "C007": "error",  "//C007": "Comment Quality Standards",
    "C012": "warn",   "//C012": "Command Query Separation",
    "C014": "error",  "//C014": "Dependency Injection Patterns",
    "C015": "warn",   "//C015": "Domain Language Usage",
    "C019": "error",  "//C019": "Proper Log Level Usage",
    "C031": "error",  "//C031": "Validation Separation",
    "C037": "warn",   "//C037": "API Response Format Standards",

    "//": "=== Security Rules (sample - 43+ total) ===",
    "S001": "error",  "//S001": "Fail Securely Access Control",
    "S002": "error",  "//S002": "Prevent IDOR Vulnerabilities", 
    "S005": "error",  "//S005": "No Origin Header Authentication",
    "S007": "error",  "//S007": "Secure OTP Storage",
    "S008": "error",  "//S008": "Crypto Agility Requirements",
    "S012": "error",  "//S012": "No Hardcoded Secrets",
    "S013": "error",  "//S013": "Always Use TLS",
    
    "//": "Rule severity levels: 'error', 'warn', 'off'"
  },

  "//output": "Output formatting and destination",
  "output": {
    "format": "summary", 
    "//format-options": ["summary", "detailed", "json", "junit", "sarif"],
    "file": null,
    "//file-example": "reports/sunlint-report.json",
    "colors": true,
    "//": "Enable colorized output (auto-detected in CI)"
  },

  "//git": "Git integration settings",
  "git": {
    "changedFiles": {
      "//": "Default branch for comparison",
      "baseBranch": "main",
      "includeUntracked": false,
      "includeStagedOnly": false
    },
    "commitHooks": {
      "preCommit": true,
      "//": "Enable pre-commit validation",
      "failOnViolations": true
    }
  },

  "//baseline": "Baseline comparison for CI/CD",
  "baseline": {
    "enabled": false,
    "file": ".sunlint-baseline.json",
    "//": "Store baseline violations to track new issues only",
    "updateOnPass": false
  },

  "//performance": "Performance and analysis settings",
  "performance": {
    "maxFileSize": "5MB",
    "//": "Skip files larger than this size",
    "parallel": true,
    "//": "Enable parallel analysis (auto-detected based on CPU cores)",
    "timeout": 30000,
    "//": "Timeout per file in milliseconds"
  },

  "//eslint": "ESLint integration settings",
  "eslint": {
    "enabled": false,
    "//": "Enable ESLint integration (--eslint-integration flag)",
    "configFile": null,
    "//configFile-example": ".eslintrc.js",
    "mergeReports": true,
    "//": "Merge ESLint violations with SunLint report"
  },

  "//react": "React.js specific configuration", 
  "react": {
    "version": "detect",
    "//": "React version for rule compatibility",
    "rules": {
      "R001": "error", "//R001": "Function Component Definition Style",
      "R002": "warn",  "//R002": "Avoid Side Effects in Render",  
      "R003": "error", "//R003": "No Direct State Mutation",
      "R004": "warn",  "//R004": "Prefer Readonly Props",
      "R005": "warn",  "//R005": "Avoid Function Binding in JSX",
      "R006": "error", "//R006": "Component Naming Conventions",
      "R007": "error", "//R007": "Proper Hook Usage",
      "R008": "warn",  "//R008": "Effect Dependencies",
      "R009": "error"  "//R009": "Conditional Hook Usage"
    }
  },

  "//ai": "AI analysis settings (future feature)",
  "ai": {
    "enabled": false,
    "provider": "openai",
    "//provider-options": ["openai", "anthropic", "local"],
    "model": "gpt-4",
    "confidence": 0.8,
    "//": "Minimum confidence threshold for AI suggestions"
  },

  "//debug": "Debug and development settings",
  "debug": {
    "verbose": false,
    "//": "Enable verbose logging",
    "timing": false,
    "//": "Show performance timing information", 
    "dryRun": false,
    "//": "Show what would be analyzed without running"
  },

  "//cache": "Analysis caching for performance",
  "cache": {
    "enabled": true,
    "//": "Enable analysis result caching",
    "directory": ".sunlint-cache",
    "ttl": 86400,
    "//": "Cache TTL in seconds (24 hours)"
  }
}
```

## 🚨 Migration Notes

**BREAKING CHANGE**: `ignorePatterns` has been deprecated in favor of `exclude` for better consistency.

**Migration:**
- **Old:** `"ignorePatterns": ["**/*.test.*"]`
- **New:** `"exclude": ["**/*.test.*"]`

## 📋 Configuration Presets

### Available Presets
- `@sun/sunlint/recommended` - Balanced rules for all projects
- `@sun/sunlint/security` - Security-focused rules only  
- `@sun/sunlint/quality` - Quality-focused rules only
- `@sun/sunlint/beginner` - Gentle introduction for new teams
- `@sun/sunlint/ci` - Optimized for CI/CD environments

### Engine Selection

SunLint supports multiple analysis engines with automatic rule compatibility detection:

- `heuristic` - SunLint's native pattern-based analysis engine (default)
  - **Coverage**: 244/256 rules (95.3%)
  - **Performance**: Fast, low memory usage
  - **Languages**: All supported languages
  - **Best for**: General analysis, CI/CD pipelines

- `eslint` - ESLint-based analysis with automatic rule mapping
  - **Coverage**: 17/256 rules (6.6%)
  - **Performance**: Moderate, requires ESLint dependencies
  - **Languages**: JavaScript, TypeScript, JSX, TSX
  - **Best for**: Projects already using ESLint

- `ai` - AI-powered analysis using OpenAI/LLMs
  - **Coverage**: 256/256 rules (100%)
  - **Performance**: Slower, requires API access
  - **Languages**: All supported languages
  - **Best for**: Complex context analysis, legacy code review

### Engine Architecture

```
Analysis Orchestrator
├── SunlintRuleAdapter (unified rule access)
├── Heuristic Engine (pattern matching)
├── ESLint Engine (integration layer)
└── AI Engine (LLM integration)
```

**Auto-Engine Selection**: SunLint automatically selects the best engine for each rule based on compatibility and performance.

## 🎯 Common Configuration Examples

### Frontend Project
```json
{
  "extends": "@sun/sunlint/recommended",
  "input": ["src"],
  "include": ["src/**/*.{js,ts,jsx,tsx}"],
  "exclude": ["**/*.test.*", "**/*.d.ts", "**/dist/**"],
  "languages": {
    "typescript": {
      "rules": {
        "C006": "error",
        "C019": "warn"
      }
    }
  }
}
```

### React.js Project
```json
{
  "extends": "@sun/sunlint/recommended", 
  "input": ["src"],
  "include": ["src/**/*.{js,ts,jsx,tsx}"],
  "exclude": ["**/*.test.*", "**/*.d.ts", "**/dist/**"],
  "react": {
    "version": "detect",
    "rules": {
      "R001": "error",
      "R002": "warn", 
      "R003": "error",
      "R006": "error"
    }
  },
  "eslint": {
    "enabled": true,
    "mergeReports": true
  }
}
```

### Backend API Project
```json
{
  "extends": "@sun/sunlint/security",
  "input": ["src", "api"],
  "rules": {
    "S001": "error",
    "S005": "error",
    "S012": "error",
    "C031": "error"
  },
  "git": {
    "changedFiles": {
      "baseBranch": "develop"
    }
  }
}
```

### CI/CD Optimized
```json
{
  "extends": "@sun/sunlint/ci",
  "input": ["."],
  "exclude": ["**/node_modules/**", "**/dist/**", "**/*.test.*"],
  "output": {
    "format": "json",
    "file": "reports/sunlint-report.json"
  },
  "baseline": {
    "enabled": true,
    "file": ".sunlint-baseline.json"
  }
}
```

## 🔧 ESLint Integration Setup

SunLint can integrate with existing ESLint configurations for seamless adoption:

### Basic Setup
1. **Enable ESLint integration:**
   ```bash
   npx sunlint --eslint-integration --input=src
   ```

2. **Configure in `.sunlint.json`:**
   ```json
   {
     "eslint": {
       "enabled": true,
       "mergeReports": true
     }
   }
   ```

### React.js Integration
For React projects, SunLint automatically maps React rules to ESLint equivalents:

```bash
# Example: Analyze React components with both SunLint and ESLint rules
npx sunlint --rules=R001,R002,R006 --eslint-integration --input=src
```

**Required dependencies:**
```bash
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-react \
  eslint-plugin-react-hooks
```

**Example `.eslintrc.js` for React:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  settings: {
    react: { version: 'detect' }
  }
};
```

### Rule Mapping
SunLint automatically maps its rules to ESLint equivalents:

| SunLint Rule | ESLint Rule(s) | Description |
|--------------|----------------|-------------|
| R001 | `react/function-component-definition` | Function component style |
| R002 | `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` | Hook usage patterns |
| R003 | `react/no-direct-mutation-state` | Prevent state mutation |
| R006 | `react/jsx-pascal-case` | Component naming |

### Multi-Engine Orchestration
SunLint intelligently selects the best engine for each rule:

```bash
# Verbose output shows engine selection
npx sunlint --rules=C010,R001,T003 --eslint-integration --verbose
```

Engine preferences:
- **R*** rules: ESLint → Heuristic → AI
- **C*** rules: Heuristic → ESLint → AI  
- **T*** rules: ESLint → Heuristic → AI

## 🚀 Performance & Architecture Benefits

### Adapter Pattern Benefits
- **Unified Rule Access**: Both CLI and VSCode extension use the same adapter layer
- **No Model Duplication**: Single rule model across all tools
- **Memory Efficiency**: Singleton pattern prevents duplicate instances
- **Fast Queries**: 0.07ms average per rule query with caching

### Rule Loading Performance
- **Registry Loading**: 256 rules in ~10ms
- **Memory Cache**: Rules cached after first load
- **Fallback Support**: Automatic fallback to origin-rules if registry unavailable

### Engine Performance Comparison
| Engine | Rules Coverage | Speed | Memory | Best Use Case |
|--------|---------------|-------|---------|--------------|
| Heuristic | 244/256 (95.3%) | Fast | Low | CI/CD, general analysis |
| ESLint | 17/256 (6.6%) | Moderate | Medium | Existing ESLint projects |
| AI | 256/256 (100%) | Slow | High | Complex analysis, legacy code |

### Architecture Validation
```bash
# Test adapter performance and coverage
npx sunlint --test-adapter

# Show engine compatibility for specific rules
npx sunlint --show-engines --rules=C010,R001,S005

# Verbose mode shows adapter and engine selection
npx sunlint --verbose --rules=C010,C020 --input=src
```

## 🔧 Development & Debugging

### Internal Architecture Access
For development and debugging, SunLint exposes internal adapter methods:

```javascript
// Access the rule adapter (for extensions or custom tools)
const SunlintRuleAdapter = require('@sun/sunlint/core/adapters/sunlint-rule-adapter');

const adapter = SunlintRuleAdapter.getInstance();
await adapter.initialize();

// Get all rules with metadata
const allRules = adapter.getAllRules();

// Generate AI context for specific rules
const aiContext = adapter.generateAIContext(['C010', 'C020']);

// Check engine compatibility
const heuristicRules = adapter.getRulesByEngine('heuristic');
```

### VSCode Extension Integration
The SunLint VSCode extension uses the same adapter pattern via `RuleReaderService`, ensuring complete consistency between CLI and editor experience.
