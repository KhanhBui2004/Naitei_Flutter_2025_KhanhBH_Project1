# SunLint Heuristic Rules System

Enhanced heuristic rules engine with organized rule categories and migration support.

## 📁 Structure

```
rules/
├── # SunLint Heuristic Rules Structure

## 📁 Clean Rule Organization

```
rules/
├── 📚 docs/                    # Rule documentation
│   ├── C002_no_duplicate_code.md
│   └── C031_validation_separation.md
├── 🧪 tests/                   # Rule unit tests  
│   └── C002_no_duplicate_code.test.js
├── 🛠️ utils/                   # Shared utilities
│   ├── ast-utils.js           # AST parsing helpers
│   ├── pattern-matchers.js    # Pattern matching utilities
│   └── rule-helpers.js        # Rule helper functions
├── 🔹 common/                  # C-series rules (Common standards)
│   ├── C002_no_duplicate_code/
│   │   ├── analyzer.js        # 🔍 Core analysis logic
│   │   └── config.json        # ⚙️ Rule configuration
│   ├── C006_function_naming/
│   ├── C019_log_level_usage/
│   ├── C029_catch_block_logging/
│   └── C031_validation_separation/
├── 🔒 security/               # S-series rules (Security standards)
└── 📘 typescript/             # T-series rules (TypeScript specific)
```

## ✅ Key Improvements

### **1. Clean Rule Folders**
- **Before**: `README.md`, `test.js`, `analyzer.js`, `config.json` mixed together
- **After**: Only **core files** in rule folders (`analyzer.js`, `config.json`)

### **2. Centralized Documentation**
- **Before**: README scattered in each rule folder
- **After**: All docs in `rules/docs/[RuleId].md`

### **3. Centralized Testing**  
- **Before**: `test.js` in each rule folder
- **After**: All tests in `rules/tests/[RuleId].test.js`

### **4. Correct Categorization**
- **Before**: ❌ `rules/coding/` (incorrect - C ≠ Coding)
- **After**: ✅ `rules/common/` (correct - C = Common)

## 🔍 Rule Analyzer Structure

Each rule analyzer follows a clean structure:

```javascript
// rules/common/C019_log_level_usage/analyzer.js
class C019Analyzer {
  constructor() {
    this.ruleId = 'C019';
    this.ruleName = 'Log Level Usage';
    // ...
  }

  async analyze(files, language, config) {
    // Core analysis logic only
  }
}
```

```json
// rules/common/C019_log_level_usage/config.json
{
  "ruleId": "C019",
  "name": "Log Level Usage",
  "description": "Don't use error level for non-critical issues",
  "severity": "warning",
  "languages": ["typescript", "javascript", "dart"]
}
```

## 🚀 Benefits

1. **Clean Separation**: Core logic separated from docs/tests
2. **Easy Maintenance**: Find docs/tests in centralized locations
3. **Correct Semantics**: C = Common (not Coding)
4. **Scalable**: Easy to add new rules/categories
5. **Engine Compatible**: Heuristic engine auto-discovers all rules

## 📊 Migration Summary

| **Aspect** | **Before** | **After** |
|------------|------------|-----------|
| **Rule Folders** | Mixed content | Core only (`analyzer.js`, `config.json`) |
| **Documentation** | Scattered | Centralized in `docs/` |
| **Tests** | Scattered | Centralized in `tests/` |
| **Categories** | ❌ `coding/` | ✅ `common/` |
| **Structure** | Flat | Nested by category |
| **Discoverable Rules** | 0 (broken) | 5 (working) |

---
*Rules structure cleaned and optimized for maintainability! 🎉*
├── index.js                     # Rule registry and loader
├── common/                      # 🛠️ Shared utilities
│   ├── ast-utils.js            # AST parsing utilities
│   ├── pattern-matchers.js     # Common pattern matching
│   └── rule-helpers.js         # Rule development helpers
├── coding/                      # 🔹 C-series: Coding standards (4 → expanding)
│   ├── C006_function_naming/   # Function naming conventions
│   ├── C019_log_level_usage/   # Log level usage patterns
│   ├── C029_catch_block_logging/ # Exception logging standards
│   └── C031_validation_separation/ # Input validation separation
├── security/                    # 🔒 S-series: Security rules (0 → 49 planned)
│   └── (ready for migration from ESLint)
├── typescript/                  # 📘 T-series: TypeScript rules (0 → 10 planned)
│   └── (ready for migration from ESLint)
└── migration/                   # 🔄 ESLint → Heuristic migration
    ├── mapping.json            # Rule mapping configuration
    ├── converter.js            # Auto-migration tool
    └── compatibility.js        # Compatibility layer
```

## 🎯 Current Status

### ✅ **Active Heuristic Rules (4)**
| Rule ID | Name | Type | Status |
|---------|------|------|--------|
| **C006** | Function Naming | Coding | ✅ Production |
| **C019** | Log Level Usage | Coding | ✅ Production |
| **C029** | Catch Block Logging | Coding | ✅ Production |  
| **C031** | Validation Separation | Coding | ✅ Production |

### 🚀 **Migration Pipeline (77 rules)**
| Category | ESLint Rules | Heuristic Target | Status |
|----------|--------------|------------------|--------|
| **Coding** | 22 rules | rules/coding/ | 🔄 Ready for migration |
| **Security** | 49 rules | rules/security/ | 🔄 Ready for migration |
| **TypeScript** | 10 rules | rules/typescript/ | 🔄 Ready for migration |

## 🛠️ Rule Development

### **Heuristic Rule Structure**
Each rule follows this standard structure:
```
rules/{category}/{RULE_ID}/
├── analyzer.js          # Core heuristic logic
├── config.json         # Rule configuration
├── test.js            # Rule-specific tests  
└── README.md          # Rule documentation
```

### **Rule Development Helpers**
Use shared utilities in `rules/common/`:
- `ast-utils.js` - AST traversal and analysis
- `pattern-matchers.js` - Common code pattern detection
- `rule-helpers.js` - Rule configuration and reporting

### **Example: Adding New Rule**
```bash
# Create new coding rule
mkdir rules/coding/C045_new_rule/
cd rules/coding/C045_new_rule/

# Create rule files
touch analyzer.js config.json test.js README.md
```

## 🔄 Migration Process

### **ESLint → Heuristic Migration**

1. **Mapping**: Define rule equivalencies in `migration/mapping.json`
```json
{
  "eslint": "c006-function-name-verb-noun",  
  "heuristic": "C006_function_naming",
  "compatibility": "partial",
  "migration_priority": "high"
}
```

2. **Conversion**: Use `migration/converter.js` for automated migration
```bash
node rules/migration/converter.js --rule=C006 --target=heuristic
```

3. **Testing**: Validate against existing ESLint rule behavior
```bash
node rules/migration/compatibility.js --test=C006
```

## 🚀 Future Expansion

### **Phase 2A: Security Rules Migration**
Target: Migrate 49 security rules to heuristic engine
- Priority: S001, S003, S012 (critical security)
- Timeline: After ESLint deprecation decision

### **Phase 2B: TypeScript Rules Migration**  
Target: Migrate 10 TypeScript rules to heuristic engine
- Priority: T002, T003, T004 (interface standards)
- Timeline: Post security migration

### **Phase 3: Advanced Heuristics**
- Multi-file analysis capabilities
- Cross-language rule support
- AI-assisted pattern detection

## 📊 Engine Comparison

| Feature | ESLint Engine | Heuristic Engine | Status |
|---------|---------------|------------------|--------|
| **Rules Count** | 81 rules | 4 → 81 rules | 🔄 Migration |
| **Performance** | AST heavy | Pattern optimized | 🚀 Faster |
| **Languages** | JS/TS only | Multi-language | 🌟 Flexible |
| **Customization** | Limited | Full control | ✅ Better |
| **Maintenance** | ESLint dependent | Self-contained | 🛡️ Stable |

## 🎯 Integration

### **Engine Loading**
The heuristic engine automatically loads rules from this structure:
```javascript
// core/analysis-orchestrator.js
const heuristicRules = require('../rules/index.js');
```

### **Rule Registry**
All rules are registered in `rules/index.js`:
```javascript
module.exports = {
  coding: {
    C006: require('./coding/C006_function_naming/analyzer.js'),
    C019: require('./coding/C019_log_level_usage/analyzer.js'),
    // ...
  },
  security: {
    // Ready for S-series rules
  },
  typescript: {
    // Ready for T-series rules  
  }
};
```

---

**🏗️ Architecture**: Scalable, organized, migration-ready  
**🎯 Goal**: 81 heuristic rules (ESLint independence)  
**🚀 Status**: 4 active, 77 ready for migration
