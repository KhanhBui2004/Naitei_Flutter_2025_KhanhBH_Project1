# C076: Explicit Function Argument Types

## 📋 **Rule Overview**

**Rule ID**: C076  
**Category**: Type Safety  
**Severity**: Error  
**Analysis**: **Semantic-Only** (requires ts-morph)

## 🎯 **Description**

All public functions must declare explicit types for their arguments. This rule enforces type safety at API boundaries by ensuring no `any`, `unknown`, or missing type annotations on public function parameters.

## 🚨 **Why Semantic-Only?**

Unlike rules C033, C035, C040 which have regex fallbacks, **C076 is semantic-only** because:

1. **Type System Complexity**: Detecting `any`, `unknown`, generics, union types requires type checker
2. **Public vs Private**: Determining function visibility needs symbol resolution  
3. **Type Resolution**: Following imports and type aliases requires cross-file analysis
4. **Accuracy**: Regex fallback would produce 90%+ false positives/negatives

## ⚡ **Requirements**

- ✅ **ts-morph** library installed
- ✅ **TypeScript project** with tsconfig.json
- ✅ **Semantic engine** enabled
- ❌ **No regex fallback available**

## 🔍 **What It Detects**
