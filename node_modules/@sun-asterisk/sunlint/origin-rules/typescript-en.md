# 📘 TypeScript Specific Coding Rules

### 📘 Rule T002 – Interface names should start with 'I'

- **Objective**: Ensure interface names follow naming conventions with 'I' prefix.
- **Details**: Interface names must start with the letter 'I' followed by a capital letter. For example: `IUser`, `IProduct`, `IRepository`.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t002)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T003 – Avoid using @ts-ignore without a clear justification

- **Objective**: Avoid using @ts-ignore without a clear reason.
- **Details**: When using `@ts-ignore`, you must include a comment explaining the reason on the same line. For example: `// @ts-ignore: API has no types` instead of just `// @ts-ignore`.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t003)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T004 – Disallow declaring empty types like `type X = {}`

- **Objective**: Avoid declaring meaningless empty data types.
- **Details**: Do not declare empty type aliases like `type EmptyType = {}`. Instead, use `Record<string, never>` or define properties clearly.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t004)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T007 – Avoid declaring functions inside constructors or class bodies

- **Objective**: Avoid declaring functions inside constructors or class bodies.
- **Details**: Do not declare functions inside constructors or class methods. Instead, define them as private methods or extract them as utility functions.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t007)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T010 – Avoid deeply nested union or tuple types

- **Objective**: Avoid complex nested union or tuple types.
- **Details**: Avoid creating nested union types or tuple types like `A | (B | C)` or `[string, [number, boolean]]`. Break them into separate type aliases for better readability and maintainability.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t010)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T015 – Do not use `instanceof` to distinguish behavior when interfaces are available

- **Objective**: Use polymorphism instead of branching with type checks.
- **Details**: Instead of: `if (a instanceof A)`, design `a.doSomething()` through interfaces.
- **Applies to**: TypeScript/JavaScript
- **Tools**: AI review / static analyzer
- **Principles**: CODE_QUALITY
- **Version**:
- **Status**: draft

### 📘 Rule T016 – Use strict type checking

- **Objective**: Leverage TypeScript's type safety to reduce runtime errors.
- **Details**:
    - Enable strict mode in tsconfig.json
    - Avoid using `any` type
    - Use union types instead of any
    - Define interfaces for complex objects
- **Applies to**: TypeScript/JavaScript
- **Tools**: TypeScript compiler, ESLint
- **Principles**: CODE_QUALITY
- **Severity**: critical
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T017 – Use async/await instead of Promises

- **Objective**: Improve code readability and ease debugging of async operations.
- **Details**:
    - Prefer async/await for async operations
    - Proper error handling with try-catch
    - Avoid callback hell and promise chaining
    - Use Promise.all for parallel operations
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint, Prettier
- **Principles**: CODE_QUALITY
- **Severity**: major
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T018 – Use proper error handling

- **Objective**: Ensure robust error handling and good user experience.
- **Details**:
    - Define custom error types
    - Use Result pattern for error handling
    - Proper logging for production debugging
    - Graceful error recovery when possible
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint, Custom error libraries
- **Principles**: CODE_QUALITY
- **Severity**: major
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T019 – Do not assign to this arbitrarily

- **Objective**: Maintain proper context and avoid this manipulation.
- **Details**: Do not reassign `this` or use patterns like `const that = this`. Use proper binding, arrow functions, or explicit parameter passing instead. This prevents confusion about execution context and maintains clean object-oriented code.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t019)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T020 – Avoid export default for multi-responsibility modules

- **Objective**: Improve tree-shaking and module clarity.
- **Details**: Use named exports when a module has multiple functions, classes, or constants. Reserve default export for single-purpose modules only. This improves bundler optimization and makes dependencies more explicit.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t020)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated

### 📘 Rule T021 – Limit deeply nested generics

- **Objective**: Improve code readability and TypeScript performance.
- **Details**: Avoid deeply nested generics beyond 3 levels like `Promise<Array<Map<string, Record<string, T>>>>`. Break complex types into intermediate type aliases for better readability and TypeScript compiler performance.
- **Applies to**: TypeScript/JavaScript
- **Tools**: ESLint custom rule (custom/t021)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
