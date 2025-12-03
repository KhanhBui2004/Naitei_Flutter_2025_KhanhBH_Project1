# Installing SunLint Dependencies

SunLint is designed to work immediately after installation with built-in JavaScript/TypeScript analysis capabilities. Additional dependencies are only needed for enhanced features.

## Core Installation

```bash
npm install @sun-asterisk/sunlint --save-dev
```

**✅ What you get immediately:**
- High-accuracy JavaScript analysis (AST-based)
- Basic TypeScript analysis (Babel parser)
- All 97+ quality and security rules
- Heuristic analysis for all supported languages

## Enhanced Features

### For ESLint Integration

If you want to combine SunLint with ESLint rules and ecosystem:

```bash
npm install eslint --save-dev
```

### For Advanced TypeScript Analysis

For enhanced TypeScript parsing and ESLint TypeScript rules:

```bash
npm install @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

### For TypeScript Projects (Complete Setup)

For full TypeScript development support:

```bash
npm install eslint typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

## Installation Examples

### Minimal Setup (JavaScript projects)
```bash
npm install @sun-asterisk/sunlint --save-dev
npx sunlint --all --input=src  # ✅ Works immediately
```

### TypeScript Projects
```bash
npm install @sun-asterisk/sunlint eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin typescript --save-dev
npx sunlint --all --input=src  # ✅ Full TypeScript support
```

### ESLint Integration
```bash
npm install @sun-asterisk/sunlint eslint --save-dev
npx sunlint --all --eslint-integration --input=src  # ✅ Combined analysis
```

## What happens without optional dependencies?

- **Without ESLint**: SunLint uses heuristic engine only (still very capable)
- **Without TypeScript parsers**: Falls back to Babel parser (good coverage)
- **Without TypeScript compiler**: Basic type checking only

**SunLint always provides analysis results** - dependencies only enhance capabilities.

## Built-in vs Optional Parsers

### ✅ Built-in (Always Available)
- **@babel/parser**: JavaScript + basic TypeScript support
- **espree**: ECMAScript parsing for compatibility

### 🔄 Optional (Install as needed)  
- **@typescript-eslint/parser**: Advanced TypeScript features
- **@typescript-eslint/eslint-plugin**: TypeScript-specific rules
- **eslint**: ESLint engine integration
- **typescript**: TypeScript compiler integration

## Dependency Check

Run any SunLint command to see recommendations for your project:

```bash
npx sunlint --help
# Automatically detects project type and suggests relevant dependencies
```
