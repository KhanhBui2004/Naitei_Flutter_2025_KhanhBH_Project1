### 📘 Rule SW001 – Use Swift's observe property instead of legacy KVO

- **Objective**: Avoid using outdated KVO mechanisms.
- **Details**:
    - Prefer block-based KVO API with `keypaths` when using Swift 3.2 or later.
    - Eliminate the need to override the traditional `observeValue`, which is complex and error-prone.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`block_based_kvo`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW002 – Delegate Protocols must be class-only

- **Objective**: Allow the use of `weak` to avoid retain cycles (memory leaks).
- **Details**:
    - `weak` is only supported for class types, so delegate protocols must be declared as `class`-based (`AnyObject`).
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`class_delegate_protocol`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW003 – Do not directly instantiate system protocols

- **Objective**: Avoid misusing protocols like `ExpressibleByArrayLiteral`.
- **Details**:
    - Compiler protocols (such as `ExpressibleByArrayLiteral`) should not be directly initialized.
    - Use concise syntax for initialization.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`compiler_protocol_init`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW004 – Prefer `.contains` for certain filtering operations

- **Objective**: Improve performance and clarity.
- **Details**:
    - Instead of `.filter { ... }.count > 0` or `.first != nil`, use `.contains`.
    - `.contains` is usually shorter, clearer, and more efficient.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`contains_over_*`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW005 – Use `enum` for types with only static members

- **Objective**: Prevent unnecessary instantiation.
- **Details**:
    - If a type only contains static members, use `enum` to disallow instantiation.
    - `enum` cannot be directly instantiated, helping to avoid misuse.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`convenience_type`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW006 – Always dispose NotificationCenter observers

- **Objective**: Prevent memory leaks due to retain cycles.
- **Details**:
    - Always store the token when using `addObserver` with NotificationCenter.
    - Call `removeObserver()` when the observer is no longer needed or in `deinit`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`discarded_notification_center_observer`)
- **Principles**: PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW007 – Avoid direct instantiation of system types

- **Objective**: Prevent creating types that may cause errors or are unnecessary.
- **Details**:
    - Avoid directly instantiating types like `Bundle`, `NSError`, `UIDevice`.
    - Use factory methods or existing properties instead of direct `init`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`discouraged_direct_init`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW008 – Do not use optionals for Boolean values

- **Objective**: Avoid ambiguous logic and hard-to-control conditions.
- **Details**:
    - Do not declare `Bool?` if it can be avoided.
    - Use `Bool` with a clear default value to avoid three states (`true`, `false`, `nil`).
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`discouraged_optional_boolean`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW009 – Prefer `.isEmpty` over `.count == 0`

- **Objective**: Make code clearer and more efficient.
- **Details**:
    - Use `.isEmpty` for better readability and clarity.
    - `.count == 0` is slower and more verbose than `.isEmpty`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`empty_count`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW010 – Prefer `isEmpty` over comparing to `""`

- **Objective**: Increase clarity and avoid potential errors with empty strings.
- **Details**:
    - Use `.isEmpty` instead of comparing to an empty string.
    - Avoid mistakes or semantic errors when handling strings.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`empty_string`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW011 – Do not use `.init()` unnecessarily

- **Objective**: Increase code clarity.
- **Details**:
    - Avoid explicitly calling `.init()` unless required.
    - Prefer concise and readable object initialization.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`explicit_init`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW012 – Always provide a clear message when using `fatalError`

- **Objective**: Make it easier to trace application crashes.
- **Details**:
    - Always add a description when calling `fatalError(...)`.
    - The message helps identify the cause during debugging or logging.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`fatal_error_message`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW013 – Prefer `for-where` over `if` inside loops

- **Objective**: Make code clearer and express intent.
- **Details**:
    - If there is only one condition in a loop, use `for ... where` instead of `if` inside the loop.
    - Simplifies conditional flow and clarifies filtering intent.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`for_where`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW014 – Avoid `as!` (force cast)

- **Objective**: Prevent crashes due to incorrect type casting.
- **Details**:
    - Do not use forced casting `as!`; use `as?` with null checks instead.
    - Force-casting can cause crashes if the object is not of the expected type.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`force_cast`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW015 – Avoid `try!` (force try)

- **Objective**: Prevent crashes when errors occur.
- **Details**:
    - Avoid using `try!`; use `try?` or `do-catch` instead.
    - Force-try ignores error handling and causes crashes if an exception occurs.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`force_try`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW016 – Avoid using `!` (force unwrap)

- **Objective**: Prevent crashes caused by `nil` values.
- **Details**:
    - Do not use `value!` to force unwrap optionals.
    - Prefer optional binding (`if let`, `guard let`) for safe handling.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`force_unwrapping`)
- **Principles**: SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW017 – Limit function parameters to less than 6

- **Objective**: Improve readability and reduce complexity.
- **Details**:
    - Avoid declaring functions with too many parameters (should be < 6).
    - If more data is needed, consider grouping into a `struct` or `object`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`function_parameter_count`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW018 – Do not use tuples with too many elements

- **Objective**: Reduce complexity, improve readability and maintainability.
- **Details**:
    - Tuples should only be used for small groups of data (≤ 2 elements).
    - If a tuple has more than 2–3 elements, replace it with a `struct`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`large_tuple`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW019 – Use Swift initializers instead of Objective-C style

- **Objective**: Keep Swift code pure, clear, and maintainable.
- **Details**:
    - Do not use old-style initializers like `CGPointMake`, `CGRectMake`, etc.
    - Use Swift initializers such as `CGPoint(x:y:)`, `CGRect(x:y:width:height:)`, etc.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`legacy_constructor`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW020 – Data types should be nested at most 1 level

- **Objective**: Avoid unreadable and hard-to-debug code due to deep nesting.
- **Details**:
    - Do not nest more than 1 level in type definitions like `class`, `struct`, `actor`.
    - Deep nesting makes maintenance difficult and violates Single Responsibility.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`nesting`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW021 – Do not use access modifiers with extensions

- **Objective**: Keep extensions clear and consistent.
- **Details**:
    - Do not declare `public`, `private`, `internal`, or `fileprivate` on the extension itself.
    - Access control should be defined at the member level inside the extension.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`no_extension_access_modifier`)
- **Principles**: CODE_QUALITY, MAINTAINABILITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW022 – Call `super` in lifecycle methods

- **Objective**: Ensure default behaviors are executed correctly.
- **Details**:
    - When overriding lifecycle methods (`viewDidLoad`, `viewWillAppear`, etc.), always call `super.methodName()`.
    - Missing `super` may cause UI or logic to malfunction.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`overridden_super_call`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW023 – Do not use `override` in extensions

- **Objective**: Avoid changing original behavior and keep extensions for extension only.
- **Details**:
    - Do not override properties/methods in extensions.
    - If overriding is needed, do it in the main class or subclass.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`override_in_extension`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW024 – Prefer `private` over `fileprivate`

- **Objective**: Restrict access scope more tightly.
- **Details**:
    - Use `private` to limit access within the same class/struct.
    - Use `fileprivate` only if sharing between multiple classes in the same file is necessary.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`private_over_fileprivate`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW025 – Do not declare Unit Test functions as `private`

- **Objective**: Ensure tests are executed from the test target.
- **Details**:
    - Do not use `private` for classes/functions in `XCTestCase`.
    - Use `internal` or `public` so the Swift test runner can call them.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`private_unit_test`)
- **Principles**: TESTABILITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW026 – Do not call `super` in specific methods

- **Objective**: Avoid errors from unnecessary `super` calls.
- **Details**:
    - Do not call `super` if the method is not defined in the parent class or Apple recommends not to (e.g., `loadView()`).
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`prohibited_super_call`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW027 – Prefer `.min()` or `.max()` over `sorted().first/last`

- **Objective**: Improve performance and clarity.
- **Details**:
    - `.sorted().first` is slower than `.min()` because it sorts the entire collection.
    - `.min()` and `.max()` only require a single pass.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`sorted_first_last`)
- **Principles**: PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW028 – Prefer shorthand syntax `[T]` over `Array<T>`

- **Objective**: Make code more idiomatic and concise.
- **Details**:
    - Swift supports sugar syntax `[Int]` instead of `Array<Int>`.
    - Shorter, clearer, and more common in modern Swift code.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`syntactic_sugar`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW029 – Warn for unused closure parameters

- **Objective**: Avoid compile warnings and improve readability.
- **Details**:
    - If a closure receives parameters that are not used, use `_`.
    - Avoid declaring unnecessary variables in closures.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`unused_closure_parameter`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW030 – Avoid using `enumerated()` when index is not needed

- **Objective**: Remove redundant code and avoid performance risks.
- **Details**:
    - Only use `.enumerated()` if both `index` and `value` are needed.
    - If only `value` is needed, iterate directly.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`unused_enumerated`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW031 – Do not use optional binding just to call a function or property

- **Objective**: Increase clarity and avoid deep nesting.
- **Details**:
    - Avoid using `if let` or `guard let` solely to call a function or access a property.
    - Use optional chaining instead for simpler code.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`unused_optional_binding`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule SW032 – Do not use `@IBInspectable` with unsupported types and constants

- **Objective**: Prevent crashes or compile-time errors.
- **Details**:
    - `@IBInspectable` should only be used with supported types (Int, CGFloat, String, etc.).
    - Do not use with `let` properties; it must be a mutable property (`var`).
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`valid_ibinspectable`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW033 – Parameters must be vertically aligned when calling functions

- **Objective**: Improve readability and maintain consistent code style.
- **Details**:
    - If breaking into multiple lines, each parameter should be on its own line and aligned.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`vertical_parameter_alignment_on_call`, `vertical_parameter_alignment`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW034 – Use `-> Void` instead of `-> ()` for function types

- **Objective**: Increase consistency and readability.
- **Details**:
    - Swift Coding Convention prefers `Void` over `()`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`void_return`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule SW035 – Delegates must be marked as `weak`

- **Objective**: Prevent retain cycles and memory leaks.
- **Details**:
    - If the delegate is a class-only protocol, always mark it as `weak`.
- **Applies to**: Swift/iOS
- **Tools**: SwiftLint (`weak_delegate`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major