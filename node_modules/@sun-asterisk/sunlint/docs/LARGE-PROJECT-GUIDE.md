# 🏗️ Large Project Analysis Guide

> **For projects with 1000+ files**: Complete strategies to optimize SunLint performance while maintaining comprehensive analysis coverage.

## 📊 Overview

SunLint uses **semantic analysis** for advanced rules like `C047` (retry pattern detection). For large projects, you can control the scope of semantic analysis to balance accuracy vs performance.

### 🎯 Key Benefits

- **Configurable file limits**: Control memory usage and analysis time
- **Smart defaults**: Automatic optimization for different project sizes  
- **Multiple strategies**: Choose the best approach for your workflow
- **Full coverage options**: Ensure no violations are missed

## ⚙️ Configuration Options

### CLI Option: `--max-semantic-files`

Controls how many files are loaded for semantic analysis:

```bash
# Default behavior (auto-detect)
node cli.js --all --input=.

# Conservative analysis (500 files)
node cli.js --all --input=. --max-semantic-files=500

# Balanced analysis (1000 files - default)  
node cli.js --all --input=. --max-semantic-files=1000

# Comprehensive analysis (2000 files)
node cli.js --all --input=. --max-semantic-files=2000

# Unlimited analysis (all files)
node cli.js --all --input=. --max-semantic-files=-1

# Disable semantic analysis (heuristic only)
node cli.js --all --input=. --max-semantic-files=0
```

### 📋 Recommended Limits by Project Size

| Project Size | Files Count | Recommended Limit | Memory Usage | Analysis Time |
|-------------|-------------|-------------------|--------------|---------------|
| **Small** | < 100 files | `0` (all files) | Low | Fast |
| **Medium** | 100-500 files | `500` | Medium | Medium |
| **Large** | 500-2000 files | `1000` ⭐ | Medium-High | Medium |
| **Enterprise** | 2000-5000 files | `1500` | High | Slow |
| **Massive** | 5000+ files | `500-1000` | Controlled | Reasonable |

⭐ **Default recommended setting**

## 🚀 Analysis Strategies

### Strategy 1: Incremental Development

Perfect for daily development work:

```bash
# Focus on changed files only (fastest)
node cli.js --all --changed-files --max-semantic-files=300 --format=summary

# Target specific modules  
node cli.js --all --input=src/auth --max-semantic-files=1000 --format=summary
node cli.js --all --input=src/api --max-semantic-files=1000 --format=summary

# Use file patterns to focus on critical code
node cli.js --all --include="src/**/*.ts" --exclude="**/*.test.*" --max-semantic-files=1500
```

### Strategy 2: CI/CD Pipeline Optimization

Optimize for different CI stages:

```bash
# PR checks: Fast semantic analysis
node cli.js --all --changed-files --max-semantic-files=300 --format=github --no-ai

# Nightly builds: Medium coverage  
node cli.js --all --input=. --max-semantic-files=1000 --format=json --output=nightly.json

# Weekly reports: Comprehensive analysis
node cli.js --all --input=. --max-semantic-files=-1 --format=detailed --output=weekly.json

# Release validation: Full coverage with baseline
node cli.js --all --input=. --max-semantic-files=2000 --baseline=last-release.json
```

### Strategy 3: Rule-Based Prioritization

Different limits for different rule types:

```bash
# Phase 1: Critical security (fast heuristic rules)
node cli.js --security --input=. --max-semantic-files=0 --format=summary

# Phase 2: Code quality basics
node cli.js --rules=C006,C019,C029 --input=. --max-semantic-files=500 --format=summary

# Phase 3: Advanced semantic rules (targeted)
node cli.js --rules=C047 --input=src --max-semantic-files=1000 --format=summary

# Phase 4: Full comprehensive scan
node cli.js --all --input=. --max-semantic-files=-1 --format=detailed
```

### Strategy 4: Monorepo Management

For large monorepos with multiple packages:

```bash
# Analyze each package separately
for package in packages/*/; do
  node cli.js --all --input="$package" --max-semantic-files=1000 \
    --format=json --output="${package//\//-}-report.json"
done

# Focus on core packages first
node cli.js --all --input=packages/core --max-semantic-files=2000 --format=summary
node cli.js --all --input=packages/api --max-semantic-files=1500 --format=summary
node cli.js --all --input=packages/ui --max-semantic-files=1000 --format=summary

# Changed files across the entire monorepo
node cli.js --all --changed-files --max-semantic-files=500 --format=summary
```

## 📈 Performance Monitoring

### Memory & Time Tracking

```bash
# Monitor performance with different limits
time node cli.js --all --input=. --max-semantic-files=500 --format=summary
time node cli.js --all --input=. --max-semantic-files=1000 --format=summary  
time node cli.js --all --input=. --max-semantic-files=2000 --format=summary

# Memory-conscious analysis for CI
node cli.js --all --input=. --max-semantic-files=300 --max-concurrent=2 --format=summary

# Debug file loading behavior
node cli.js --all --input=. --max-semantic-files=1000 --verbose --debug
```

### Coverage Analysis

Check what percentage of your project is being analyzed:

```bash
# Show file loading statistics
node cli.js --all --input=. --max-semantic-files=1000 --verbose --format=summary

# Compare different limits
node cli.js --all --input=. --max-semantic-files=500 --verbose --dry-run
node cli.js --all --input=. --max-semantic-files=1000 --verbose --dry-run
node cli.js --all --input=. --max-semantic-files=-1 --verbose --dry-run
```

## 🎛️ Configuration Files

### sunlint.config.json

Create a configuration file for consistent settings:

```json
{
  "performance": {
    "maxSemanticFiles": 1000,
    "maxConcurrentRules": 5,
    "timeoutMs": 30000
  },
  "input": ["src", "lib"],
  "exclude": [
    "**/*.test.*",
    "**/*.d.ts", 
    "**/generated/**"
  ],
  "output": {
    "format": "summary"
  },
  "engines": {
    "semantic": {
      "enabled": true,
      "fileLimit": 1000
    }
  }
}
```

### Environment-Specific Configs

Different configs for different environments:

```bash
# Development (fast feedback)
cp config/sunlint.dev.json sunlint.config.json
node cli.js --all --input=.

# CI (balanced coverage)  
cp config/sunlint.ci.json sunlint.config.json
node cli.js --all --changed-files

# Release (comprehensive)
cp config/sunlint.release.json sunlint.config.json  
node cli.js --all --input=.
```

## 💡 Best Practices

### 1. Start Conservative, Scale Up

```bash
# Begin with conservative limits
node cli.js --all --input=. --max-semantic-files=500 --format=summary

# Gradually increase if performance allows
node cli.js --all --input=. --max-semantic-files=1000 --format=summary
node cli.js --all --input=. --max-semantic-files=1500 --format=summary
```

### 2. Use Different Limits for Different Contexts

```bash
# Daily development: Focus on changed files
alias sunlint-dev="node cli.js --all --changed-files --max-semantic-files=300"

# Code review: Medium coverage
alias sunlint-review="node cli.js --all --changed-files --max-semantic-files=500"

# Release preparation: Full coverage
alias sunlint-release="node cli.js --all --input=. --max-semantic-files=-1"
```

### 3. Monitor and Adjust

Track your analysis performance over time:

```bash
# Create performance baseline
echo "Project size: $(find . -name '*.ts' -o -name '*.js' | wc -l) files"
time node cli.js --all --input=. --max-semantic-files=1000 --format=summary

# Adjust based on CI constraints
if [[ $CI_MEMORY_LIMIT -lt 4096 ]]; then
  SEMANTIC_LIMIT=500
else
  SEMANTIC_LIMIT=1000
fi

node cli.js --all --input=. --max-semantic-files=$SEMANTIC_LIMIT --format=summary
```

### 4. Combine with File Targeting

Use semantic limits together with file patterns:

```bash
# Focus semantic analysis on source files only
node cli.js --all --include="src/**/*.ts" --exclude="**/*.test.*" --max-semantic-files=1500

# Analyze tests separately with lower limits
node cli.js --all --include="**/*.test.*" --max-semantic-files=500

# Target critical modules with higher limits
node cli.js --all --input=src/security --max-semantic-files=2000
node cli.js --all --input=src/api --max-semantic-files=1500
```

## 🔍 Troubleshooting

### Memory Issues

If you encounter out-of-memory errors:

```bash
# Reduce semantic file limit
node cli.js --all --input=. --max-semantic-files=500

# Disable semantic analysis completely
node cli.js --all --input=. --max-semantic-files=0

# Reduce concurrent rules
node cli.js --all --input=. --max-semantic-files=1000 --max-concurrent=2
```

### Slow Analysis

If analysis takes too long:

```bash
# Use incremental analysis
node cli.js --all --changed-files --max-semantic-files=300

# Focus on specific directories
node cli.js --all --input=src/critical --max-semantic-files=1000

# Use timeout limits
node cli.js --all --input=. --max-semantic-files=1000 --timeout=60000
```

### Missed Violations

If you suspect violations are being missed:

```bash
# Run comprehensive analysis periodically
node cli.js --all --input=. --max-semantic-files=-1 --format=detailed

# Compare different limits
node cli.js --all --input=. --max-semantic-files=1000 --output=report-1k.json
node cli.js --all --input=. --max-semantic-files=-1 --output=report-full.json
diff report-1k.json report-full.json
```

## 📚 Related Documentation

- [Command Examples](./COMMAND-EXAMPLES.md) - Complete CLI usage examples
- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [CI/CD Guide](./CI-CD-GUIDE.md) - Integration with CI/CD pipelines
- [Architecture](./ARCHITECTURE.md) - Technical implementation details

---

**💡 Pro Tip**: For projects with 2000+ files, consider breaking analysis into modules and running them in parallel, rather than analyzing everything at once.
