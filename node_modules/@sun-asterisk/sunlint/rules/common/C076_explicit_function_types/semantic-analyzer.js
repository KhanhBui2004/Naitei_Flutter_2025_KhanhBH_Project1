/**
 * C076 Semantic Analyzer - Explicit Function Argument Types
 * Purpose: Use AST + Symbol Resolution to enforce explicit types on public functions
 * 
 * NOTE: This rule REQUIRES semantic analysis and ts-morph.
 * Unlike C033/C035/C040, C076 does NOT have regex fallback because:
 * 1. Type system analysis is too complex for regex patterns
 * 2. Public vs private function detection requires symbol resolution
 * 3. Type resolution (any, unknown, generics) needs type checker
 * 4. Regex fallback would produce 90%+ false positives/negatives
 */

const { SyntaxKind } = require('ts-morph');
const SemanticRuleBase = require('../../../core/semantic-rule-base');

class C076SemanticAnalyzer extends SemanticRuleBase {
  constructor() {
    super('C076', {
      description: 'All public functions must declare explicit types for arguments',
      category: 'type-safety',
      severity: 'error',
      requiresTypeChecker: true,
      crossFileAnalysis: false,
      semanticOnly: true  // This rule requires semantic analysis - no regex fallback
    });
  }

  /**
   * Main entry point called by the semantic engine
   */
  async analyzeFileBasic(filePath, options = {}) {
    return await this.analyzeFile(filePath, null, options);
  }

  /**
   * Analyze a file for explicit function argument type violations
   * @param {string} filePath - Path to the file
   * @param {Object} options - Analysis options
   */
  async analyzeFile(filePath, sourceFile, config = {}) {
    const verbose = this.config.verbose || false;
    
    if (verbose) {
      console.log(`[DEBUG] 🔍 C076: Analyzing file ${filePath}`);
    }
    
    // Get configuration with defaults
    const {
      disallow = ['any', 'Object', 'object', '{}', 'unknown'],
      requireGenericConstraints = false,
      checkCollections = true,
      ignorePatterns = ['**/*.spec.ts', '**/__tests__/**']
    } = config;

    // Check if file should be ignored
    if (this.shouldIgnoreFile(filePath, ignorePatterns)) {
      if (verbose) {
        console.log(`[DEBUG] ⏭️ C076: Ignoring file ${filePath} due to ignore patterns`);
      }
      return;
    }

    // Get sourceFile from semantic engine
    if (!this.semanticEngine?.project) {
      if (verbose) {
        console.warn('[DEBUG] 🔍 C076: No semantic engine available, skipping analysis');
      }
      return;
    }

    try {
      const tsSourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!tsSourceFile) {
        if (verbose) {
          console.warn(`[DEBUG] 🔍 C076: Could not find sourceFile for ${filePath}`);
        }
        return;
      }

      // Find all exported functions
      const exportedFunctions = this.findExportedFunctions(tsSourceFile);
      if (verbose) {
        console.log(`[DEBUG] 🎯 C076: Found ${exportedFunctions.length} exported functions`);
      }
      
      for (const func of exportedFunctions) {
        this.analyzeFunction(func, config, filePath, verbose);
      }
      
      // Find exported classes and analyze their public methods
      const exportedClasses = this.findExportedClasses(tsSourceFile);
      if (verbose) {
        console.log(`[DEBUG] 📦 C076: Found ${exportedClasses.length} exported classes`);
      }
      
      for (const cls of exportedClasses) {
        this.analyzeClassMethods(cls, config, filePath, verbose);
      }
      
    } catch (error) {
      console.error(`❌ C076: Error analyzing ${filePath}:`, error.message);
    }

    if (verbose) {
      console.log(`[DEBUG] ✅ C076: Analysis complete. Found ${this.violations.length} violations in ${filePath}`);
    }
  }

  shouldIgnoreFile(filePath, ignorePatterns) {
    return ignorePatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.');
      return new RegExp(regexPattern).test(filePath);
    });
  }

  findExportedFunctions(sourceFile) {
    const functions = [];
    
    // Find all function declarations
    const functionDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
    for (const func of functionDecls) {
      if (this.isExported(func)) {
        functions.push({
          type: 'function',
          node: func,
          name: func.getName() || 'anonymous'
        });
      }
    }
    
    // Find variable declarations that are arrow functions
    const variableStmts = sourceFile.getDescendantsOfKind(SyntaxKind.VariableStatement);
    for (const stmt of variableStmts) {
      if (this.isExported(stmt)) {
        const declarations = stmt.getDeclarationList().getDeclarations();
        for (const decl of declarations) {
          const initializer = decl.getInitializer();
          if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
            functions.push({
              type: 'arrow',
              node: initializer,
              name: decl.getName(),
              declaration: decl
            });
          }
        }
      }
    }
    
    return functions;
  }

  findExportedClasses(sourceFile) {
    const classes = [];
    
    const classDecls = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
    for (const cls of classDecls) {
      if (this.isExported(cls)) {
        classes.push({
          node: cls,
          name: cls.getName() || 'anonymous'
        });
      }
    }
    
    return classes;
  }

  isExported(node) {
    const modifiers = node.getModifiers();
    return modifiers.some(mod => mod.getKind() === SyntaxKind.ExportKeyword);
  }

  analyzeFunction(funcInfo, config, filePath, verbose = false) {
    const { node, name, type } = funcInfo;
    if (verbose) {
      console.log(`[DEBUG] 🔎 C076: Analyzing function '${name}' (${type})`);
    }
    
    const parameters = node.getParameters();
    
    parameters.forEach((param, index) => {
      this.analyzeParameter(param, index, name, config, filePath, verbose);
    });
  }

  analyzeClassMethods(classInfo, config, filePath, verbose = false) {
    const { node, name } = classInfo;
    if (verbose) {
      console.log(`[DEBUG] 🔎 C076: Analyzing class '${name}'`);
    }
    
    const methods = node.getMethods();
    
    methods.forEach(method => {
      // Only check public methods
      if (this.isPublicMethod(method)) {
        const methodName = method.getName();
        if (verbose) {
          console.log(`[DEBUG] 🔎 C076: Analyzing method '${methodName}'`);
        }
        
        const parameters = method.getParameters();
        parameters.forEach((param, index) => {
          this.analyzeParameter(param, index, `${name}.${methodName}`, config, filePath, verbose);
        });
      }
    });
  }

  isPublicMethod(method) {
    // Method is public if no private/protected modifier
    const modifiers = method.getModifiers();
    return !modifiers.some(mod => 
      mod.getKind() === SyntaxKind.PrivateKeyword || 
      mod.getKind() === SyntaxKind.ProtectedKeyword
    );
  }

  analyzeParameter(param, index, functionName, config, filePath, verbose = false) {
    const { 
      disallow = ['any', 'Object', 'object', '{}', 'unknown'], 
      requireGenericConstraints = false, 
      checkCollections = true 
    } = config;
    const paramName = param.getName();
    
    if (verbose) {
      console.log(`[DEBUG] 🔍 C076: Checking parameter '${paramName}' in '${functionName}'`);
    }
    
    // Check for missing type annotation
    const typeNode = param.getTypeNode();
    if (!typeNode) {
      this.violations.push(this.createViolation(
        param,
        `Parameter '${paramName}' at position ${index} in function '${functionName}' is missing type annotation`,
        'missing-type',
        filePath
      ));
      return;
    }

    // Get type text for analysis
    const typeText = typeNode.getText();
    if (verbose) {
      console.log(`[DEBUG] 🔍 C076: Parameter '${paramName}' has type: ${typeText}`);
    }
    
    // Check for disallowed types
    if (Array.isArray(disallow) && disallow.includes(typeText)) {
      this.violations.push(this.createViolation(
        param,
        `Parameter '${paramName}' in function '${functionName}' uses disallowed type '${typeText}'`,
        'disallowed-type',
        filePath
      ));
      return;
    }

    // Check for generic collections without proper typing
    if (checkCollections && this.isUnparameterizedCollection(typeText)) {
      this.violations.push(this.createViolation(
        param,
        `Parameter '${paramName}' in function '${functionName}' uses unparameterized collection type '${typeText}'`,
        'unparameterized-collection',
        filePath
      ));
      return;
    }

    // Check for generic constraints if required
    if (requireGenericConstraints && this.isUnconstrainedGeneric(typeText)) {
      this.violations.push(this.createViolation(
        param,
        `Parameter '${paramName}' in function '${functionName}' uses unconstrained generic type`,
        'unconstrained-generic',
        filePath
      ));
    }
  }

  isUnparameterizedCollection(typeText) {
    const unparameterizedPatterns = [
      /^Array$/,
      /^Map$/,
      /^Set$/,
      /^WeakMap$/,
      /^WeakSet$/,
      /^Promise$/,
      /^Observable$/
    ];
    
    return unparameterizedPatterns.some(pattern => pattern.test(typeText));
  }

  isUnconstrainedGeneric(typeText) {
    // Single letter types are often unconstrained generics
    return /^[A-Z]$/.test(typeText);
  }

  createViolation(node, message, subtype, filePath) {
    const startPos = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndChar = sourceFile.getLineAndColumnAtPos(startPos);
    
    return {
      ruleId: this.ruleId,
      severity: 'error',
      message,
      source: this.ruleId,
      file: filePath,
      line: lineAndChar.line + 1,
      column: lineAndChar.column + 1,
      description: `[SEMANTIC] ${message}. Ensure all public API functions have explicit type annotations for better type safety.`,
      suggestion: this.getSuggestion(subtype),
      category: 'type-safety'
    };
  }

  getSuggestion(subtype) {
    switch (subtype) {
      case 'missing-type':
        return 'Add explicit type annotation: function(param: Type)';
      case 'disallowed-type':
        return 'Replace with specific type: string, number, UserData, etc.';
      case 'unparameterized-collection':
        return 'Add generic type: Array<Type>, Map<Key, Value>, Set<Type>';
      case 'unconstrained-generic':
        return 'Add generic constraint: <T extends BaseType>';
      default:
        return 'Use explicit, specific types for better type safety';
    }
  }
}

module.exports = C076SemanticAnalyzer;
