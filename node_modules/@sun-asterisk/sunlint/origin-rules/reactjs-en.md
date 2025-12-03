# 📘 React.js Specific Coding Rules

> _Based on the official [Rules of React](https://react.dev/reference/rules) from React documentation_

## 🎯 Objectives
- Ensure React code adheres to core principles for predictable, debuggable, and auto-optimized applications
- Prevent common mistakes when writing React code that violates core rules
- Promote declarative, understandable, and maintainable React code
- Enable React to automatically optimize performance through rule compliance

## 📋 Details

### 📘 Rule R001 – Components must be idempotent
- **Objective**: Ensure that React components always return the same output for the same inputs (props, state, context).
- **Details**: React assumes components are pure functions that consistently return the same output for the same inputs. This allows React to optimize rendering and avoid unexpected bugs.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - TypeScript strict mode
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule R002 – Side effects must run outside of render
- **Objective**: Prevent side effects from executing during render to avoid bugs and improve performance.
- **Details**: Side effects should never be run during rendering, as React may render components multiple times to deliver the best user experience.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - ESLint plugin: `eslint-plugin-react`
- **Principles**: DESIGN_PATTERNS, PERFORMANCE
- **Version**: 1.0
- **Status**: activated

### 📘 Rule R003 – Props and state are immutable
- **Objective**: Prevent direct mutation of props and state to avoid bugs and ensure proper behavior in React.
- **Details**: Props and state are immutable snapshots during each render. They should never be mutated directly.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react`
    - TypeScript strict mode
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule R004 – Return values and arguments to Hooks are immutable
- **Objective**: Ensure that values passed into Hooks are not modified to prevent subtle bugs.
- **Details**: Once values are passed into a Hook, they should not be changed. Like props in JSX, they should be treated as immutable.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - TypeScript strict mode
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule R005 – Values are immutable after being passed to JSX
- **Objective**: Prevent mutation of values after they've been passed to JSX.
- **Details**: Do not modify values after passing them into JSX. Any mutation should happen before the JSX is returned.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react`
    - TypeScript strict mode
- **Principles**: CODE_QUALITY

### 📘 Rule R006 – Never call component functions directly
- **Objective**: Let React fully control when and how components are rendered.
- **Details**: Components should only be used in JSX, not called like regular functions.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react`
    - TypeScript strict mode
- **Principles**: CODE_QUALITY, DESIGN_PATTERNS
- **Version**: 1.0
- **Status**: activated

### 📘 Rule R007 – Never pass hooks as regular values
- **Objective**: Ensure that Hooks are used only as intended within React components.
- **Details**: Hooks should only be called within components or custom hooks—never passed around as values.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - TypeScript strict mode
- **Principles**: DESIGN_PATTERNS

### 📘 Rule R008 – Only call Hooks at the top level
- **Objective**: Maintain the correct order of Hook calls so React can manage state properly.
- **Details**: Do not call Hooks inside loops, conditions, or nested functions. Always place Hooks at the top level of React function components, before any early returns.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - TypeScript strict mode
- **Principles**: DESIGN_PATTERNS

### 📘 Rule R009 – Only call Hooks from React functions
- **Objective**: Ensure Hooks are only called from valid React functions to prevent unexpected behavior.
- **Details**: Do not call Hooks from regular JavaScript functions. Hooks should only be used in function components or custom Hooks.
- **Applies to**: React.js/TypeScript
- **Tools**:
    - ESLint plugin: `eslint-plugin-react-hooks`
    - TypeScript strict mode
- **Principles**: DESIGN_PATTERNS
