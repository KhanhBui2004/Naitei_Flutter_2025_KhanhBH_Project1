# 📘 Dart Specific Coding Rules

---

### 📘 Rule D001 – Keep parameter names consistent when overriding methods

- **Objective**: Maintain consistency between inherited classes
- **Details**: Do not change parameter names when overriding to maintain consistency in meaning and documentation of parameters if available.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_renaming_method_parameters`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D002 – Avoid using single cascade (..) operators

- **Objective**: Write clear, readable code
- **Details**: Only use cascade (`..`) when performing multiple consecutive operations on the same object. Avoid using it for single operations.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_single_cascade_in_expression_statements`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D003 – Avoid calling methods/accessing properties on dynamic types

- **Objective**: Prevent runtime errors due to lack of type checking
- **Details**: Avoid using `dynamic.foo()` or `dynamic.bar` without proper checking
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_dynamic_calls`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule D004 – Use standard `package:` imports

- **Objective**: Reduce confusion in imports
- **Details**: Avoid mixing relative and package imports which can cause circular errors or alias errors when a file is imported in two different ways.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`always_use_package_imports`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D005 – Always declare function return types

- **Objective**: Clarify logic and increase reliability in type checking
- **Details**: 
  - Avoid `dynamic` returns or unclear type inference
  - Helps analyzer perform more complete code analysis to find potential runtime errors
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`always_declare_return_types`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D006 – Do not override `==` and `hashCode` in mutable classes

- **Objective**: Prevent logic errors when using mutable objects in collections.
- **Details**: Equality should be based on immutable values
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_equals_and_hash_code_on_mutable_classes`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule D007 – Do not pass default values when calling functions

- **Objective**: Avoid redundancy and clarify intent
- **Details**: If a function has default parameters, no need to pass the same value again
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_redundant_argument_values`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D008 – Avoid slow async functions in `dart:io`

- **Objective**: Optimize I/O performance
- **Details**: Avoid the following slow async functions:
  - `Directory.exists`
  - `Directory.stat`
  - `File.lastModified`
  - `File.exists`
  - `File.stat`
  - `FileSystemEntity.isDirectory`
  - `FileSystemEntity.isFile`
  - `FileSystemEntity.isLink`
  - `FileSystemEntity.type`
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`avoid_slow_async_io`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D009 – Do not use throw or control flow in `finally`

- **Objective**: Avoid unexpected behavior
- **Details**: Do not use `return`, `break`, `throw` in `finally` blocks
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`control_flow_in_finally`, `throw_in_finally`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule D010 – Handle all cases when using `switch` with enums or enum-like classes

- **Objective**: Avoid missing cases
- **Details**: When using `switch` with `enum`, always handle all cases completely.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`exhaustive_cases`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D011 – Avoid importing `.dart` files from `lib/src` of other packages

- **Objective**: Avoid unstable dependencies that cause breaking changes.
- **Details**: Only import from public API (`lib/src`) within the same package, not from other packages.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`implementation_imports`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D012 – Avoid passing null to closure parameters

- **Objective**: Prevent runtime exceptions
- **Details**: Typically, a closure passed to a method will only be called conditionally, using `null` will lead to exceptions or unexpected logic.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`null_closures`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D013 – Use adjacent strings or interpolation to create strings

- **Objective**: Easier to read and more efficient
- **Details**: Use adjacent strings or interpolation to create strings
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`prefer_adjacent_string_concatenation`, `prefer_interpolation_to_compose_strings`)
- **Principles**: CODE_QUALITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D014 – Use conditional assignment `??=` instead of `if-null-then-assign`

- **Objective**: More concise and clear meaning
- **Details**: Use `a ??= b` instead of `if (a == null) a = b;`
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`prefer_conditional_assignment`)
- **Principles**: CODE_QUALITY, MAINTAINABILITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D015 – Use `final`, `const` for immutable variables

- **Objective**: Prevent bugs from unintended value changes
- **Details**: Use `final` or `const` for variables that don't change throughout their lifetime
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`prefer_final_fields`, `prefer_const_declarations`, `prefer_const_constructors`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D016 – Use explicit definitions for function types in parameters

- **Objective**: Increase clarity and accurate type checking
- **Details**: Use `generic function type syntax` for parameters.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`use_function_type_syntax_for_parameters`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D017 – Ensure simple and correct Regex syntax

- **Objective**: Prevent logic errors from invalid expressions
- **Details**: Use clear, simple Regex patterns. Avoid incorrect or overly complex expressions
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`valid_regexps`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D018 – Use `rethrow` instead of `throw` when re-throwing errors

- **Objective**: Preserve original error stack trace
- **Details**: In catch blocks, use `rethrow` to re-throw the same caught error
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`use_rethrow_when_possible`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D019 – Use `isEmpty` / `isNotEmpty` for String, Iterable and Map

- **Objective**: Clear meaning and better performance
- **Details**: Instead of `list.length == 0`, use `list.isEmpty`
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`prefer_is_empty`, `prefer_is_not_empty`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D020 – Ensure valid URLs in `pubspec.yaml`

- **Objective**: Avoid metadata errors and poor security
- **Details**: Do not use `http://` or placeholder URLs like `example.com`
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`secure_pubspec_urls`)
- **Principles**: SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D021 – Use `BuildContext` synchronously

- **Objective**: Prevent errors when `context` changes after `await`
- **Details**: Use `BuildContext` carefully in asynchronous functions 
- **Applies to**: Flutter/Dart
- **Tools**: `flutter_lints` (`use_build_context_synchronously`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: critical

### 📘 Rule D022 – Place `child:` at the end when constructing widgets

- **Objective**: Help readability of widget tree and UI structure
- **Details**: Parameters like `child`, `children` should be placed last in widget constructors
- **Applies to**: Flutter/Dart
- **Tools**: `flutter_lints` (`sort_child_properties_last`)
- **Principles**: CODE_QUALITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D023 – Prefer using `contains` for `List` and `String`

- **Objective**: Easier to read and more efficient
- **Details**: Use `contains` instead of `indexOf` to check for element existence in `List` or `String`.
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`prefer_contains`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D024 – Use `??` to convert `null` to `bool`

- **Objective**: Write concisely and avoid null exceptions
- **Details**: Use `flag ?? false` instead of `flag == null ? false : flag`
- **Applies to**: Flutter/Dart
- **Tools**: `dart lint` (`use_if_null_to_convert_nulls_to_bools`)
- **Principles**: CODE_QUALITY, SECURITY
- **Version**: 1.0
- **Status**: activated
- **Severity**: major

### 📘 Rule D025 – Include `Key` in Widget constructors

- **Objective**: Help Flutter identify widgets, ensure efficient rebuilds and prevent errors when reordering widgets.
- **Details**: Use `key` in all public widget constructors
- **Applies to**: Flutter/Dart
- **Tools**: `flutter_lints` (`use_key_in_widget_constructors`)
- **Principles**: CODE_QUALITY, USABILITY, PERFORMANCE
- **Version**: 1.0
- **Status**: activated
- **Severity**: major