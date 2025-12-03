# AST Modules for SunLint

This directory contains optional AST parsing modules that enhance the heuristic engine's analysis capabilities using Tree-sitter parsers.

## Purpose

The AST modules provide **enhanced analysis accuracy** for complex rules like:
- C010: Block nesting depth limits
- C012: Function complexity limits
- C015: Function parameter limits

## Modular Design

The AST modules are designed to be **optional and removable**:

1. **Development/Full Distribution**: Includes all AST parsers for maximum accuracy
2. **Language-Specific Distribution**: Can remove unnecessary language parsers
3. **Minimal Distribution**: Can remove entire AST modules folder for regex-only analysis

## Architecture

```
ast-modules/
├── index.js                 # Registry and lazy loader
├── base-parser.js          # Common AST parser interface
├── package.json            # Separate dependency management
└── parsers/
    ├── javascript-parser.js # JavaScript AST via Tree-sitter
    ├── typescript-parser.js # TypeScript AST via Tree-sitter
    ├── dart-parser.js      # Dart AST (future)
    ├── java-parser.js      # Java AST (future)
    └── ...
```

## Usage

The heuristic engine automatically detects AST module availability:

```javascript
// In heuristic engine - AST enhancement is transparent
const violations = await this.runEnhancedAnalysis(analyzer, ruleId, files, language, options);

// Results show analysis method used:
// violations[0].analysisMethod = 'ast'    // High accuracy AST analysis
// violations[1].analysisMethod = 'regex'  // Fallback regex analysis
```

**Developer Experience**:
```bash
# Same command, different results based on available modules
sunlint --rule=C010 --engine=heuristic src/

# Full distribution: AST + regex analysis
# Minimal distribution: regex-only analysis
# Both work seamlessly
```

## Dependencies

AST modules use Tree-sitter parsers as **optional dependencies**:

- `tree-sitter`: Core parser framework
- `tree-sitter-javascript`: JavaScript parsing
- `tree-sitter-typescript`: TypeScript parsing
- `tree-sitter-dart`: Dart parsing (when available)
- `tree-sitter-java`: Java parsing (when available)
- And more...

## Deployment Strategies

### Full Distribution (npm)
```bash
npm install sunlint  # Includes all AST modules
```

### TypeScript-Only Distribution
```bash
# Remove unnecessary parsers before packaging
rm -rf core/ast-modules/parsers/dart-parser.js
rm -rf core/ast-modules/parsers/java-parser.js
# ... remove others
npm publish @sunlint/typescript
```

### Minimal Distribution (regex-only)
```bash
# Remove entire AST modules
rm -rf core/ast-modules/
npm publish @sunlint/minimal
```

## Fallback Behavior

1. **AST Available**: Use Tree-sitter for accurate AST-based analysis
2. **AST Unavailable**: Gracefully fall back to regex-based heuristic analysis
3. **No Performance Impact**: Lazy loading ensures unused parsers don't affect startup time

## Benefits

- **Accuracy**: AST-based analysis provides much higher accuracy for complex rules
- **Flexibility**: Can be removed entirely without breaking core functionality
- **Performance**: Lazy loading and selective parser usage
- **Maintainability**: Clear separation between AST enhancement and core heuristic logic
