# 📘 Kotlin Mobile Specific Coding Rules

### 📘 Rule K001 – Use Named Arguments when functions have more than 3 parameters

- **Objective**: Improve readability, avoid errors from parameter order confusion, and make function calls clearer.
- **Details**:
  - For functions or constructors with more than 3 parameters, use named arguments to clearly express the meaning of each argument.
  - Avoid confusion when parameters have the same data type and are positioned close to each other.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`NamedArguments`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K002 – Limit function complexity (Cyclomatic Complexity)

- **Objective**: Reduce logic complexity and branching to improve readability, testability, and maintainability.
- **Details**:
  - Warn if a function has more than **15 logical branches**.
  - Includes structures like: `if`, `when`, `&&`, `||`, `for`, `catch`, `?:`, `let`, `run`, `apply`, etc.
  - Encourage breaking functions into smaller parts, following the SRP principle.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`CognitiveComplexMethod`, `CyclomaticComplexMethod`), SonarQube
- **Principles**: CODE_QUALITY, MAINTAINABILITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K003 – Avoid overly complex conditions

- **Objective**: Write clear, readable conditions that are easy to control and understand.
- **Details**:
  - Warn if conditional expressions contain **more than 4 logical operators** (`&&`, `||`, etc.).
  - Encourage using intermediate variables with descriptive names to improve readability.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ComplexCondition`), SonarQube
- **Principles**: CODE_QUALITY, MAINTAINABILITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K004 – Avoid nesting code more than 4 levels deep in functions

- **Objective**: Simplify logic to improve testability and maintainability.
- **Details**:
  - Warn if a function has nesting depth > 4 levels.
  - Makes logic difficult to follow when there are many `if`, `when`, `for`, `try-catch` statements.
  - Encourage breaking into separate functions following the SRP (Single Responsibility Principle).
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`NestedBlockDepth`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K005 – Do not use `GlobalScope`

- **Objective**: Avoid coroutines that exist beyond their intended lifecycle.
- **Details**:
  - `GlobalScope.launch` is not tied to lifecycle → easily causes resource leaks.
  - Use `CoroutineScope`, `viewModelScope`, or `lifecycleScope` appropriate to the context.
  - Reference: [Kotlin Coroutine Docs – GlobalScope](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/)
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`GlobalCoroutineUsage`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K006 – Avoid using `suspend` when not necessary

- **Objective**: Avoid creating the misconception that a function contains asynchronous logic when it actually doesn't need it.
- **Details**:
  - Only use `suspend` if the function calls other `suspend` functions.
  - Avoid adding `suspend` to functions that only have simple or synchronous logic.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`RedundantSuspendModifier`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K007 – Use `delay()` instead of `sleep()` in coroutines

- **Objective**: Optimize concurrency, avoid unnecessarily blocking threads.
- **Details**:
  - `Thread.sleep()` will block the entire current thread, affecting other coroutines running.
  - `delay()` is non-blocking and fits well with Kotlin's coroutine architecture.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`SleepInsteadOfDelay`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K008 – Do not swallow `CancellationException` in coroutines

- **Objective**: Ensure coroutine cancellation is properly propagated to avoid leaks or logic errors.
- **Details**:
  - Must not swallow `CancellationException` inside `runCatching`, `catch`, or `try-catch` without rethrowing.
  - If swallowed, the coroutine will not be cancelled, causing memory leaks or incorrect logic.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`SuspendFunSwallowedCancellation`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K009 – Do not use `suspend` for functions returning `Flow`

- **Objective**: Avoid unnecessary asynchronous declarations, keep code clean.
- **Details**:
  - `Flow` is a cold stream that already supports async, so no need to add `suspend`.
  - Helps make code clearer and more maintainable.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`SuspendFunWithFlowReturnType`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K010 – Do not check/cast exceptions in `catch` blocks

- **Objective**: Handle errors clearly, readably, and with the correct error type.
- **Details**:
  - Avoid `if (e is...)`, `e as...` in `catch` blocks.
  - Prefer writing multiple `catch` blocks for each specific exception type.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`InstanceOfCheckForException`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K011 – Use `class` instead of `object` when extending `Throwable`

- **Objective**: Avoid using global singletons for exceptions, ensure exceptions carry separate information.
- **Details**:
  - Exceptions usually contain specific information per occurrence → should not be reused.
  - Use `class` to create new instances for each separate error.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ObjectExtendsThrowable`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K012 – Do not `return` or `throw` in `finally`

- **Objective**: Do not lose main logic when handling errors, avoid overriding original exceptions.
- **Details**:
  - `return` or `throw` in `finally` will override or swallow the real exception from `try`.
  - Makes tracing and debugging difficult when errors occur.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ReturnFromFinally`, `ThrowingExceptionFromFinally`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K013 – Do not wrap and rethrow the same exception type

- **Objective**: Preserve the original error cause and stack trace.
- **Details**:
  - Avoid wrapping an exception and rethrowing the same type.
  - Instead, wrap into a custom or meaningful different exception.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ThrowingNewInstanceOfSameException`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K014 – Use `ArrayPrimitive` instead of `Array<Primitive>`

- **Objective**: Improve performance, avoid unnecessary boxing/unboxing.
- **Details**:
  - Use `IntArray`, `FloatArray`, etc. instead of `Array<Int>`, `Array<Float>`, etc.
  - Avoid redundant memory allocation and reduce overhead.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ArrayPrimitive`)
- **Principles**: PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K015 – Use `for` instead of `forEach` on ranges

- **Objective**: Avoid creating unnecessary lambdas, improve runtime performance.
- **Details**:
  - `forEach` on ranges is slower than regular `for` loops.
  - `for` loops are clearer and lighter for range iteration.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ForEachOnRange`)
- **Principles**: PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K016 – Do not use `else` in `when` with `enum` or `sealed` classes

- **Objective**: Ensure all cases are handled explicitly and are easy to control.
- **Details**:
  - With `enum` or `sealed class`, all cases should be listed exhaustively.
  - Avoid falling back to `else`, which may lead to missing logic when extending.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ElseCaseInsteadOfExhaustiveWhen`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K017 – Do not directly call Garbage Collector (GC)

- **Objective**: Avoid poor performance or unpredictable behavior.
- **Details**:
  - Do not manually call `System.gc()`, `Runtime.getRuntime().gc()`, or `System.runFinalization()`.
  - JVM already manages GC efficiently; manual intervention can easily cause system overload.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ExplicitGarbageCollectionCall`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K018 – Do not ignore function return values

- **Objective**: Avoid losing useful information, handle function results properly.
- **Details**:
  - Should not call functions that return values and ignore the result.
  - If the result is not needed, the function should return `Unit`.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`IgnoredReturnValue`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K019 – Avoid using not-null assertion (!!) to get values from Map

- **Objective**: Avoid `NullPointerException` when accessing Map.
- **Details**:
  - Should not use `!!` when getting values from `Map`.
  - Instead, use safe methods like: `getOrElse`, `getOrDefault`, `getValue`.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`MapGetWithNotNullAssertionOperator`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K020 – Do not call `toString()` on nullable objects

- **Objective**: Avoid displaying unwanted `"null"` strings.
- **Details**:
  - Use `?.toString()` or `?:` for safe fallback.
  - Avoid calling `toString()` directly on objects that may be null.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`NullableToStringCall`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K021 – Avoid unreachable catch blocks

- **Objective**: Remove redundant logic and unreachable code.
- **Details**:
  - Avoid placing `Exception` catch before specific exceptions like `IOException`.
  - Subsequent `catch` blocks will never be executed.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`UnreachableCatchBlock`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K022 – Avoid unsafe casting

- **Objective**: Avoid `ClassCastException` and unnecessary runtime errors.
- **Details**:
  - Avoid using `as` if not certain about the data type.
  - Prefer `as?` and check for null.
  - Avoid down-casting from immutable collections to mutable ones.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`UnsafeCast`, `DontDowncastCollectionTypes`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K023 – Do not use properties before declaration

- **Objective**: Avoid logic errors from using uninitialized variables.
- **Details**:
  - Should not use variables in property `get()` if those variables are declared later.
  - Can easily cause incorrect behavior and is hard to detect.
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`PropertyUsedBeforeDeclaration`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K024 – Ensure proper modifier order

- **Objective**: Improve consistency and readability in the codebase.
- **Details**:
  - Modifiers should follow the standard order according to Kotlin Convention.
  - Suggested order: `public/protected/private/internal`, `expect/actual`, `final/open/abstract/sealed/const`, `external`, `override`, `lateinit`, `tailrec`, `vararg`, `suspend`, `inner`, `enum/annotation`, `companion`, `inline`, `infix`, `operator`, `data`, `inner`, `fun/val/var`.
  - Reference: [Kotlin Coding Convention](https://kotlinlang.org/docs/coding-conventions.html#modifiers-order)
- **Applies to**: Kotlin/Android
- **Tools**: `detekt` (`ModifierOrder`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K025 – Ensure proper parameter order in Composable functions

- **Objective**: Ensure usability, memorability, and extensibility of Composable APIs.
- **Details**:
  - According to [Compose Component Guidelines](https://android.googlesource.com/platform/frameworks/support/+/androidx-main/compose/docs/compose-component-api-guidelines.md#component-parameters), parameter order should be:
    - Required parameters
    - `modifier`
    - Optional parameters
    - Optional Slot (`@Composable`) lambda
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Manual Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K026 – Each component should serve a single purpose

- **Objective**: Ensure components are easy to maintain, understand, and test.
- **Details**:
  - Each component should perform only one function.
  - Avoid combining multiple responsibilities such as control, display, and state management.
  - Follow the Single Responsibility Principle (SRP).
- **Applies to**: Kotlin/Android
- **Tools**: Code Review, Custom Lint
- **Principles**: CODE_QUALITY, DESIGN_PATTERNS
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K027 – Composables returning Unit should use PascalCase and be nouns

- **Objective**: Follow naming conventions for Composables in Compose.
- **Details**:
  - Composable functions that create UI should be treated as UI components.
  - Name them using PascalCase in noun form.
  - Avoid using verbs or camelCase which might be confused with actions.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K028 – `@Composable` factory functions that return values should use camelCase

- **Objective**: Follow standard Kotlin function naming conventions.
- **Details**:
  - Composables that return values (e.g., `Style`, `Color`, `TextStyle`) should use `camelCase`.
  - Name them similar to factory or getter functions.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K029 – Prefer Stateless `@Composable` functions

- **Objective**: Increase reusability, reduce complexity and side effects.
- **Details**:
  - `@Composable` should receive `state` from outside rather than managing it internally.
  - Helps callers control the entire state and makes testing logic easier.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K030 – Enhance extensibility by declaring state using interfaces

- **Objective**: Improve extensibility, reduce coupling with specific implementations.
- **Details**:
  - Use the `interface + factory + private impl` pattern to better control state hoisting.
  - Limit direct dependencies on implementation classes.
- **Applies to**: Kotlin/Android
- **Tools**: Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K031 – Create different components instead of multiple style classes

- **Objective**: Increase maintainability and reusability.
- **Details**:
  - Don't group multiple styles into one class.
  - Separate components according to their purpose.
- **Applies to**: Kotlin/Android
- **Tools**: Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K032 – Don't use `null` as default for nullable parameters

- **Objective**: Avoid misleading default logic.
- **Details**:
  - Avoid using `null` as default value in `@Composable` to mean "use default".
  - Provide clear default values instead of handling fallback logic.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule K033 – Don't pass `MutableState<T>` to `@Composable`

- **Objective**: Prevent unclear state ownership sharing.
- **Details**:
  - Passing `MutableState` directly leads to difficulty controlling ownership.
  - Pass separated value with callback or use clear state wrapper instead.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY, DESIGN_PATTERNS
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule K034 – Prefer `Slot` parameters for extensibility

- **Objective**: Allow users to customize content flexibly.
- **Details**:
  - Using `Slot API` helps extend UI components without changing component definition.
  - Single slots should be named `content`.
- **Applies to**: Kotlin/Android
- **Tools**: Custom rule, Code Review
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major