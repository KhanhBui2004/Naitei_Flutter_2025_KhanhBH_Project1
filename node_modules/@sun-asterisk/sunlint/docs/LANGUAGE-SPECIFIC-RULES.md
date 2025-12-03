# Language-Specific Rules Configuration Guide

## Overview
This guide explains how to configure language-specific rules in SunLint projects. Language-specific rules are **opt-in** and must be explicitly enabled via project configuration.

## Core vs Language-Specific Rules

### Core Rules (Always Available)
- **Files**: `common-en.md`, `security-en.md`
- **Count**: 135 rules
- **Usage**: Included in category commands (`--security`, `--quality`)
- **Scope**: Universal rules applicable to all languages

### Language-Specific Rules (Opt-In)
- **Files**: `typescript-en.md`, `reactjs-en.md`, `java-en.md`, etc.
- **Count**: 121 rules
- **Usage**: Must be enabled via project config
- **Scope**: Rules specific to particular languages/frameworks

## Configuration Methods

### 1. Project Configuration (.sunlint.json)

Create or edit `.sunlint.json` in your project root:

```json
{
  "rules": [
    "TS001",
    "TS002", 
    "REACT001"
  ],
  "presets": ["typescript", "reactjs"],
  "categories": ["security", "quality"]
}
```

### 2. Package.json Configuration

Add sunlint config to your `package.json`:

```json
{
  "sunlint": {
    "rules": ["TS001", "TS002"],
    "presets": ["typescript"],
    "categories": ["security"]
  }
}
```

### 3. CLI Rule Selection

Use CLI flags for one-time rule selection:

```bash
# Specific language rules
sunlint --rules="TS001,TS002,REACT001"

# Mix core categories with specific rules  
sunlint --security --rules="TS001,TS002"

# Use presets
sunlint --preset=typescript
```

## Available Language-Specific Rules

### TypeScript Rules (typescript-en.md)
```bash
# Example TypeScript-specific rules
TS001 - TypeScript strict mode enforcement
TS002 - Type assertion guidelines
TS003 - Interface vs type usage
# ... more TypeScript rules
```

### React Rules (reactjs-en.md)
```bash
# Example React-specific rules
REACT001 - Component prop validation
REACT002 - State mutation prevention
REACT003 - Effect dependency handling
# ... more React rules
```

### Java Rules (java-en.md)
```bash
# Example Java-specific rules
JAVA001 - Exception handling patterns
JAVA002 - Thread safety guidelines
JAVA003 - Memory management best practices
# ... more Java rules
```

## Configuration Examples

### TypeScript Project
```json
{
  "presets": ["typescript"],
  "categories": ["security", "quality"],
  "rules": [
    "TS001",
    "TS005", 
    "TS010"
  ]
}
```

### React + TypeScript Project
```json
{
  "presets": ["typescript", "reactjs"],
  "categories": ["security"],
  "rules": [
    "TS001",
    "REACT001",
    "REACT005"
  ]
}
```

### Multi-Language Project
```json
{
  "presets": ["typescript", "java"],
  "categories": ["security", "quality"],
  "rules": [
    "TS001",
    "JAVA001",
    "JAVA010"
  ]
}
```

## Rule Priority System

SunLint follows this priority order:

1. **CLI `--rule`** (highest priority)
2. **CLI `--rules`** 
3. **CLI `--category`** (core rules only)
4. **Project config file** (lowest priority)

### Example Priority Resolution
```bash
# Command: sunlint --security --rules="TS001,TS002" --rule="CUSTOM001"
# Result: Only CUSTOM001 is used (--rule overrides everything)

# Command: sunlint --security --rules="TS001,TS002"  
# Result: TS001, TS002 are used (--rules overrides --security)

# Command: sunlint --security
# Result: 60 core security rules are used
```

## Preset Configurations

Presets provide curated rule collections for specific languages:

### Creating Custom Presets
```json
// config/presets/my-typescript-preset.json
{
  "rules": [
    "TS001", "TS002", "TS005",
    "S001", "S010", "S020",
    "C001", "C005", "C010"
  ],
  "description": "Custom TypeScript preset with security focus"
}
```

### Using Presets
```bash
# CLI usage
sunlint --preset=my-typescript-preset

# Project config usage
{
  "presets": ["my-typescript-preset"]
}
```

## Best Practices

### 1. Start with Core Categories
Begin with core categories, then add language-specific rules:
```json
{
  "categories": ["security", "quality"],
  "rules": ["TS001", "TS002"]
}
```

### 2. Use Presets for Common Configurations
Create and reuse presets for consistent team configurations:
```json
{
  "presets": ["team-typescript", "security-strict"]
}
```

### 3. Gradual Rule Adoption
Add language-specific rules incrementally:
```json
{
  "categories": ["security"],
  "rules": [
    // Week 1: Start with essential rules
    "TS001",
    
    // Week 2: Add more specific rules
    "TS002", "TS005",
    
    // Week 3: Add advanced rules
    "TS010", "TS015"
  ]
}
```

### 4. Document Team Standards
Create team-specific documentation:
```json
{
  "presets": ["team-standard"],
  "description": "Our team's agreed-upon rule set",
  "rules": ["TS001", "TS002", "REACT001"]
}
```

## Troubleshooting

### Common Issues

#### 1. Language Rules Not Applied
**Problem**: Language-specific rules don't appear in results
**Solution**: Check that rules are in project config, not just CLI categories

```bash
# This only uses core rules
sunlint --security  

# This includes language-specific rules
sunlint --security --rules="TS001,TS002"
```

#### 2. Rule Conflicts
**Problem**: Different tools report different rule counts
**Solution**: Verify same configuration is used everywhere

```json
// Ensure consistent config across tools
{
  "presets": ["typescript"],
  "categories": ["security"]
}
```

#### 3. Missing Rules
**Problem**: Expected rules don't appear
**Solution**: Check rule priority and configuration merge

```bash
# Debug with verbose output
sunlint --verbose --security
```

## Migration from Legacy Configuration

### Old Approach (Deprecated)
```json
{
  "includeLanguageRules": true,
  "language": "typescript"
}
```

### New Approach (Recommended)
```json
{
  "presets": ["typescript"],
  "categories": ["security", "quality"]
}
```

## Validation

Test your configuration:

```bash
# Verify rule selection
sunlint --input=src --verbose

# Test specific configuration
sunlint --config=.sunlint.json --verbose

# Validate rule counts
node test-category-filtering.js
```

## Related Documentation

- [Standardized Category Filtering](./STANDARDIZED-CATEGORY-FILTERING.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Preset System](./PRESETS.md)
- [CLI Commands](./COMMAND-EXAMPLES.md)
