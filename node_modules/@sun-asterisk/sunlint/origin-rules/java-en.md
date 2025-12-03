# 📘 Java Specific Coding Rules

### 📘 Rule J001 – Use Null Object or Optional instead of repetitive null checks

- **Objective**: Reduce the risk of NullPointerException (NPE) and avoid repeating `if (x != null)` throughout the code.
- **Details**:
    - Encourage using `Optional`, the Null Object Pattern, or guard clauses to handle potential null values.
- **Applies to**: Java/Kotlin
- **Tools**: Linter, PR guideline
- **Principles**: CODE_QUALITY

### 📘 Rule J002 – Do not use `null` as a default value unless absolutely necessary

- **Objective**: Prevent NullPointerException by promoting clearer use of Optional or nullable types.
- **Details**:
    - Prefer using `Optional`, explicitly nullable types, or well-defined default values.
    - Ensure `null` is checked and handled at system boundaries (e.g., during input validation).
- **Applies to**: Java/Kotlin
- **Tools**: Static Analyzer
- **Principles**: CODE_QUALITY

### 📘 Rule J003 – Every enum must provide a clear toString or description when used in UI/logs

- **Objective**: Avoid unclear log messages such as `STATUS_1`, and improve readability.
- **Details**:
    - Add methods like `getLabel()` or override `toString()` for enums used in UI or logs.
    - Avoid default enum output (e.g., raw index or unclear names).
- **Applies to**: Java/Kotlin
- **Tools**: Manual Review, Enum Linter
- **Principles**: CODE_QUALITY

### 📘 Rule J004 – Avoid creating enums/classes just to wrap fixed constants

- **Objective**: Prevent unnecessary abstractions that clutter the codebase.
- **Details**:
    - Use enums only when modeling meaningful state, not just as a container for constants.
    - Reuse existing config/shared constants instead of creating new wrapper classes.
- **Applies to**: Java/Kotlin
- **Tools**: Review or static pattern detector
- **Principles**: CODE_QUALITY

### 📘 Rule J005 – Always use `final` or `const` for variables that do not change

- **Objective**: Clearly express intent and prevent unintended modifications.
- **Details**:
    - Variables that are never reassigned should be declared as `final` (Java) or `const` (in other applicable languages).
    - This helps reviewers, compilers, and future developers understand the variable's purpose.
- **Applies to**: Java/Kotlin
- **Tools**: Linter, Static Analyzer
- **Principles**: CODE_QUALITY

### 📘 Rule J006 – Do not override methods without calling `super` when required

- **Objective**: Preserve expected behavior and side effects in inherited logic.
- **Details**:
    - If the superclass method has side effects, ensure to call `super.method()` when overriding.
    - Only omit `super` if you're completely replacing the logic intentionally.
- **Applies to**: Java/Kotlin
- **Tools**: Linter, Manual Review
- **Principles**: CODE_QUALITY
