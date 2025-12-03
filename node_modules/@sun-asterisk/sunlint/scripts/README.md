# SunLint Scripts Directory

## 📋 Script Categories

### 🔧 Core Generation Scripts
- **`generate-presets.js`** - Generate preset configurations from rules
- **`generate-rules-registry.js`** - Generate unified rules registry from origin-rules
- **`generate_insights.js`** - Generate insights and analysis of rule implementations

### 🔍 Analysis Scripts  
- **`analyze-core-rules.js`** - Analyze common and security rules from markdown files
- **`validate-rule-structure.js`** - Validate rule structure and consistency
- **`validate-system.js`** - System-wide validation

### 🚀 Build & Release Scripts
- **`build-release.sh`** - Build release packages
- **`prepare-release.sh`** - Prepare release artifacts  
- **`manual-release.sh`** - Manual release process
- **`trigger-release.sh`** - Trigger automated release
- **`pre-release-test.sh`** - Pre-release testing
- **`verify-install.sh`** - Verify installation

### ⚡ Performance & Testing Scripts
- **`performance-test.js`** - Performance benchmarking
- **`quick-performance-test.js`** - Quick performance check
- **`ci-report.js`** - CI reporting

### 🔄 Migration & Maintenance Scripts
- **`migrate-rule-registry.js`** - Migrate rule registry data
- **`consolidate-config.js`** - Consolidate configuration files
- **`copy-rules.js`** - Copy rules between locations
- **`category-manager.js`** - Manage rule categories

### 📦 Setup & Install Scripts
- **`install.sh`** - Installation script
- **`setup-github-registry.sh`** - Setup GitHub package registry

### 🎯 Demo & Example Scripts
- **`batch-processing-demo.js`** - Batch processing demonstration

## 🔄 Script Relationships

### Potential Consolidation Opportunities:
1. **Analysis Scripts**: `analyze-core-rules.js` and `generate_insights.js` have overlapping functionality
2. **Generation Scripts**: Multiple scripts parse rules - could be unified under common utilities

### Dependencies:
- Most scripts depend on `SimpleRuleParser` from `../rules/parser/rule-parser-simple`
- Rule source files in `../origin-rules/`
- Configuration files in `../config/`

## 🚀 Usage Guidelines

### For Preset Management:
```bash
# Generate new presets from rule sources
node scripts/generate-presets.js

# Analyze current rule status  
node scripts/analyze-core-rules.js
```

### For Rule Registry:
```bash
# Generate unified registry
node scripts/generate-rules-registry.js

# Get implementation insights
node scripts/generate_insights.js
```

### For Release:
```bash
# Full release process
./scripts/prepare-release.sh
./scripts/build-release.sh
```

## 📝 Maintenance Notes

- Scripts marked with `#!/usr/bin/node` are executable
- Path references updated for scripts/ subdirectory location
- Consider consolidating overlapping analysis functionality
