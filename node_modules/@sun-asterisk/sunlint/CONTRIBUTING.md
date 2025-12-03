# Contributing to SunLint - Rule Development Guide

## 🎯 Quick Start for Rule Development

This guide focuses on developing new rules for SunLint. Based on practical experience from refactoring rules like C013, C035, we recommend a **symbol-based only** approach for maximum accuracy.

## 📋 Rule Development Steps

### Step 1: Register Rule in Registry

Add your rule to `config/rules/enhanced-rules-registry.json`:

```json
{
  "rules": {
    "C010": {
      "name": "Limit Block Nesting",
      "description": "Limit nested blocks (if/for/while/switch) to maximum 3 levels for readability",
      "category": "complexity",
      "severity": "warning",
      "languages": ["typescript", "javascript", "dart", "kotlin"],
      "analyzer": "./rules/common/C010_limit_block_nesting/analyzer.js",
      "config": "./rules/common/C010_limit_block_nesting/config.json",
      "version": "1.0.0",
      "status": "stable",
      "tags": ["complexity", "readability", "nesting", "maintainability"],
      "strategy": {
        "preferred": "ast",
        "fallbacks": ["ast"],
        "accuracy": {
          "ast": 95
        }
      },
      "engineMappings": {
        "eslint": ["complexity", "max-depth"]
      }
    }
  }
}
```

**Key Registry Fields:**
- `analyzer`: Path to main analyzer file
- `strategy.preferred`: Use "ast" for symbol-based analysis
- `strategy.fallbacks`: Recommend ["ast"] only for accuracy
- `strategy.accuracy`: Expected accuracy percentage

### Step 2: Create Rule Directory Structure

```bash
mkdir -p rules/common/C010_limit_block_nesting
cd rules/common/C010_limit_block_nesting

# Required files
touch analyzer.js           # Main orchestrator
touch symbol-based-analyzer.js  # Core analysis logic
touch config.json          # Rule configuration
```

### Step 3: Implement Main Analyzer (analyzer.js)

```javascript
// rules/common/C010_limit_block_nesting/analyzer.js
const C010SymbolBasedAnalyzer = require('./symbol-based-analyzer.js');

class C010Analyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C010';
    this.ruleName = 'Limit Block Nesting';
    this.description = 'Limit nested blocks to maximum 3 levels';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Use symbol-based only for accuracy
    this.symbolAnalyzer = new C010SymbolBasedAnalyzer(semanticEngine);
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    await this.symbolAnalyzer.initialize(semanticEngine);
  }

  async analyzeFileBasic(filePath, options = {}) {
    try {
      // Check if symbol engine is ready
      if (!this.semanticEngine?.isSymbolEngineReady?.() || !this.semanticEngine.project) {
        throw new Error('Symbol engine not available');
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C010: Using symbol-based analysis for ${filePath.split('/').pop()}`);
      }

      const violations = await this.symbolAnalyzer.analyzeFileBasic(filePath, options);
      
      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C010: Symbol-based analysis found ${violations.length} violations`);
      }

      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`[DEBUG] ❌ C010: Analysis failed: ${error.message}`);
      }
      throw new Error(`C010 analysis failed: ${error.message}`);
    }
  }

  async analyzeFiles(files, options = {}) {
    const allViolations = [];
    for (const filePath of files) {
      try {
        const violations = await this.analyzeFileBasic(filePath, options);
        allViolations.push(...violations);
      } catch (error) {
        console.warn(`C010: Skipping ${filePath}: ${error.message}`);
      }
    }
    return allViolations;
  }
}

module.exports = C010Analyzer;
```

### Step 4: Implement Symbol-Based Analyzer

```javascript
// rules/common/C010_limit_block_nesting/symbol-based-analyzer.js
const { SyntaxKind } = require('ts-morph');

class C010SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.semanticEngine = semanticEngine;
    this.maxNestingLevel = 3;
    this.verbose = false;
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
  }

  async analyzeFileBasic(filePath, options = {}) {
    const violations = [];
    
    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) {
        throw new Error(`Source file not found: ${filePath}`);
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C010: Analyzing nesting in ${filePath.split('/').pop()}`);
      }

      // Find nested blocks
      const nestedBlocks = this.findNestedBlocks(sourceFile);
      
      for (const block of nestedBlocks) {
        if (block.nestingLevel > this.maxNestingLevel) {
          violations.push({
            ruleId: 'C010',
            message: `Nested block exceeds maximum depth of ${this.maxNestingLevel} (current: ${block.nestingLevel}). Consider extracting to separate functions.`,
            filePath: filePath,
            line: block.line,
            column: block.column,
            severity: 'warning',
            category: 'complexity'
          });
        }
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C010: Found ${violations.length} nesting violations`);
      }

      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`[DEBUG] ❌ C010: Symbol analysis error: ${error.message}`);
      }
      throw error;
    }
  }

  findNestedBlocks(sourceFile) {
    const blocks = [];
    
    function traverse(node, currentDepth = 0) {
      // Check for block statements that increase nesting
      if (this.isNestingNode(node)) {
        currentDepth++;
        
        const position = sourceFile.getLineAndColumnAtPos(node.getStart());
        blocks.push({
          node: node,
          nestingLevel: currentDepth,
          line: position.line,
          column: position.column
        });
      }

      // Traverse children
      node.forEachChild(child => traverse.call(this, child, currentDepth));
    }

    traverse.call(this, sourceFile, 0);
    return blocks;
  }

  isNestingNode(node) {
    return [
      SyntaxKind.IfStatement,
      SyntaxKind.ForStatement,
      SyntaxKind.ForInStatement,
      SyntaxKind.ForOfStatement,
      SyntaxKind.WhileStatement,
      SyntaxKind.DoStatement,
      SyntaxKind.SwitchStatement,
      SyntaxKind.TryStatement,
      SyntaxKind.CatchClause
    ].includes(node.getKind());
  }
}

module.exports = C010SymbolBasedAnalyzer;
```

### Step 5: Create Rule Configuration

```json
// rules/common/C010_limit_block_nesting/config.json
{
  "maxNestingLevel": 3,
  "excludePatterns": [
    "**/*.test.js",
    "**/*.spec.js"
  ],
  "includePatterns": [
    "**/*.js",
    "**/*.ts",
    "**/*.jsx",
    "**/*.tsx"
  ]
}
```

## 🚨 Common Pitfalls & Solutions

### 1. Symbol Engine Not Ready
```javascript
// ❌ Wrong - Will fail if symbol engine not ready
const violations = await this.symbolAnalyzer.analyzeFileBasic(filePath);

// ✅ Correct - Check engine availability
if (!this.semanticEngine?.isSymbolEngineReady?.() || !this.semanticEngine.project) {
  throw new Error('Symbol engine not available');
}
```

### 2. Missing Source File Check
```javascript
// ❌ Wrong - Will crash if file not found
const sourceFile = this.semanticEngine.project.getSourceFile(filePath);

// ✅ Correct - Always check source file existence
const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
if (!sourceFile) {
  throw new Error(`Source file not found: ${filePath}`);
}
```

### 3. Improper Error Handling
```javascript
// ❌ Wrong - Silent failures
try {
  const violations = await this.analyzeFile(filePath);
} catch (error) {
  return [];
}

// ✅ Correct - Proper error propagation
try {
  const violations = await this.analyzeFile(filePath);
  return violations;
} catch (error) {
  if (this.verbose) {
    console.error(`Analysis failed: ${error.message}`);
  }
  throw error;
}
```

## 🧪 Testing Your Rule

```bash
# Test single file
node cli.js --input=test-file.js --rule=C010 --engine=heuristic --verbose

# Test project
node cli.js --input=src/ --rule=C010 --engine=heuristic --max-semantic-files=-1

# Performance test
time node cli.js --input=large-project/ --rule=C010 --engine=heuristic
```

## 📝 Best Practices

1. **Use Symbol-Based Only**: More accurate than regex patterns
2. **Always Check Engine State**: Verify semantic engine is ready
3. **Handle Errors Gracefully**: Don't silently ignore failures  
4. **Add Debug Logging**: Use `this.verbose` for troubleshooting
5. **Test on Real Projects**: Validate with large codebases
6. **Document Accuracy**: Update strategy.accuracy in registry

## 🔧 Development Environment

```bash
# Setup
npm install
npm test

# Development workflow
node cli.js --input=examples/ --rule=YOUR_RULE --engine=heuristic --verbose
```

## 📚 Advanced Topics

- **AST Navigation**: Use ts-morph documentation for node traversal
- **Performance**: Symbol-based analysis is ~15s for 2000+ files
- **Multi-language**: Extend analyzers for Dart, Kotlin support
- **Custom Patterns**: Leverage SyntaxKind for specific constructs

---

This guide is based on real experience refactoring C013 and other rules. Focus on accuracy over speed - symbol-based analysis provides much better results than regex patterns.