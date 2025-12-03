# 🐛 Debugging Sunlint

## Quick Start

### Debug Configurations Available

1. **Debug Sunlint CLI** - Debug the main CLI with quality rules
2. **Debug Sunlint - Single Rule** - Debug a specific rule (C006)
3. **Debug Sunlint - Multiple Rules** - Debug multiple rules with JSON output
4. **Debug Sunlint - Custom Input** - Debug with custom input path and format
5. **Debug Rule Analyzer - C006** - Debug the function naming analyzer
6. **Debug Rule Analyzer - C019** - Debug the log level analyzer
7. **Debug Rule Analyzer - C029** - Debug the catch block analyzer

### How to Debug

1. **Open VS Code** in the sunlint folder
2. **Press F5** or go to `Run and Debug` panel
3. **Select a configuration** from the dropdown
4. **Click Start Debugging** (green play button)

### Tasks Available

- **Sunlint: Run Quality Check** - Run quality analysis (Ctrl+Shift+P → Tasks: Run Task)
- **Sunlint: Run Single Rule** - Run a specific rule 
- **Sunlint: Run All Rules** - Run all rules with JSON output
- **Sunlint: Demo Script** - Run the demo script
- **Sunlint: Install Dependencies** - Install npm dependencies
- **Sunlint: Validate Registry** - Validate the rules registry

### Breakpoints

Set breakpoints in:
- **cli.js** - Main CLI logic
- **core/multi-rule-runner.js** - Rule execution
- **core/config-manager.js** - Configuration loading
- **core/report-generator.js** - Report generation
- **rules/*/analyzer.js** - Individual rule analyzers

### Debug Environment

- **NODE_ENV** is set to `development`
- **Console** output goes to integrated terminal
- **Skip Files** configured to ignore Node.js internals
- **Problem Matcher** configured to parse sunlint output

### Configuration Files

- **launch.json** - Debug configurations
- **tasks.json** - Build and test tasks
- **settings.json** - VS Code workspace settings
- **extensions.json** - Recommended extensions
- **sunlint-schema.json** - JSON schema for .sunlint.json files

### Tips

1. **Use breakpoints** in analyzer files to debug rule logic
2. **Check Variables panel** to inspect rule results
3. **Use Debug Console** to test expressions
4. **Watch expressions** for complex debugging
5. **Step through code** to understand execution flow

### Common Debug Scenarios

#### Debug Rule Not Working
1. Set breakpoint in rule analyzer
2. Use "Debug Rule Analyzer - C006" configuration
3. Check if rule is properly detecting violations

#### Debug CLI Arguments
1. Set breakpoint in cli.js
2. Use "Debug Sunlint CLI" configuration  
3. Check if arguments are parsed correctly

#### Debug Report Generation
1. Set breakpoint in report-generator.js
2. Use any CLI debug configuration
3. Check if violations are formatted correctly

### JSON Schema Support

The workspace includes JSON schema for `.sunlint.json` files, providing:
- **IntelliSense** for configuration options
- **Validation** of configuration values
- **Hover documentation** for properties
- **Auto-completion** for rule IDs and values
