# ESLint Integration

This folder contains SunLint's ESLint plugin integration, organized by rule categories.

## 📁 Structure

```
integrations/eslint/
├── package.json              # ESLint integration dependencies
├── tsconfig.json             # TypeScript configuration
├── plugin/                   # ESLint Plugin
│   ├── index.js             # Plugin entry point
│   ├── package.json         # Plugin package configuration
│   └── rules/               # Organized rules by category
│       ├── coding/          # C-series: 22 coding standard rules
│       ├── security/        # S-series: 49 security rules
│       └── typescript/      # T-series: 10 TypeScript rules
├── configs/                 # ESLint Configuration Presets
│   ├── .eslintrc.js        # Legacy ESLint config
│   ├── eslint.config.js    # Modern ESLint config
│   └── eslint.config.simple.js # Simple config variant
└── tools/                   # ESLint Integration Tools
    └── cli.js              # ESLint integration CLI
```

## 🚀 Usage

### ESLint Plugin Installation

```bash
# Install the plugin
npm install --save-dev ./integrations/eslint/plugin

# Use in your ESLint config
{
  "plugins": ["@sun-asterisk/sunlint"],
  "rules": {
    "@sun-asterisk/sunlint/c006-function-name-verb-noun": "error",
    "@sun-asterisk/sunlint/s001-fail-securely": "error"
  }
}
```

### Direct CLI Usage

```bash
# Use ESLint integration CLI
node ../../cli.js --input=src
```

## 📊 Rule Categories

### 🔹 Coding Rules (22 rules)
Quality and best practices rules with `c-` prefix:
- `c002-no-duplicate-code.js` - Detect code duplication
- `c006-function-name-verb-noun.js` - Function naming conventions
- `c010-limit-block-nesting.js` - Control nesting depth
- *...19 more coding rules*

### 🔒 Security Rules (49 rules)  
Security and vulnerability rules with `s-` prefix:
- `s001-fail-securely.js` - Secure failure handling
- `s003-no-unvalidated-redirect.js` - Prevent open redirects
- `s012-hardcode-secret.js` - Detect hardcoded secrets
- *...46 more security rules*

### 📘 TypeScript Rules (10 rules)
TypeScript-specific rules with `t-` prefix:
- `t002-interface-prefix-i.js` - Interface naming conventions
- `t003-ts-ignore-reason.js` - Require reasons for @ts-ignore
- `t004-interface-public-only.js` - Interface member visibility
- *...7 more TypeScript rules*

## 🔄 Integration with Main SunLint

This ESLint integration works alongside the main SunLint heuristic engine:

```bash
# Combined analysis: SunLint heuristic + ESLint rules
sunlint --all --eslint-integration --input=src
```

The ESLint engine is loaded automatically when `--eslint-integration` flag is used or when ESLint config is detected in the project.

## 📦 Distribution

The plugin can be packaged and distributed independently:

```bash
cd integrations/eslint/plugin
npm pack
# Creates: sun-asterisk-sunlint-eslint-plugin-x.x.x.tgz
```

---

**🏗️ Architecture**: Modular, organized by rule categories  
**🎯 Purpose**: Clean ESLint integration with 81 total rules  
**🚀 Status**: Production ready, well-organized structure
