/**
 * C035 Symbol-based Analyzer - Advanced Error Logging Context Analysis
 * Purpose: Use AST + Symbol Resolution to analyze log content quality in catch blocks
 */

const { SyntaxKind } = require('ts-morph');

class C035SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C035';
    this.ruleName = 'Error Logging Context Analysis (Symbol-Based)';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Logger method patterns (extensible)
    this.loggerPatterns = {
      console: ['log', 'error', 'warn', 'info'],
      logger: ['log', 'error', 'warn', 'info', 'debug'],
      log: ['error', 'warn', 'info', 'debug'],
      winston: ['log', 'error', 'warn', 'info', 'debug'],
      bunyan: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      pino: ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
    };
    
    // Required context elements
    this.requiredContext = {
      errorInfo: ['message', 'stack', 'error', 'err'],
      identifier: ['id', 'requestId', 'userId', 'transactionId', 'correlationId'],
      context: ['service', 'method', 'operation', 'module', 'component']
    };
    
    // Sensitive data patterns to flag (more specific to avoid false positives)
    this.sensitivePatterns = [
      'password', 'passwd', 'pwd', 'pass',
      'token', 'jwt', 'secret', 'privatekey', 'publickey', 'apikey', 'accesskey',
      'ssn', 'social', 'creditcard', 'cardnumber', 'cvv', 'pin',
      'authorization', 'bearer'
    ];
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (process.env.SUNLINT_DEBUG) { 
      console.log(`🔧 [C035 Symbol-Based] Analyzer initialized, verbose: ${this.verbose}`);
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    // This is the main entry point called by the hybrid analyzer
    return await this.analyzeFileWithSymbols(filePath, options);
  }

  async analyzeFileWithSymbols(filePath, options = {}) {
    const violations = [];
    
    // Enable verbose mode if requested
    const verbose = options.verbose || this.verbose;
    
    if (!this.semanticEngine?.project) {
      if (verbose) {
        console.warn('[C035 Symbol-Based] No semantic engine available, skipping analysis');
      }
      return violations;
    }
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Starting analysis for ${filePath}`);
    }
    
    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) {
        return violations;
      }
      
      // Find all try-catch statements in the file
      const tryCatchStatements = sourceFile.getDescendantsOfKind(SyntaxKind.TryStatement);
      
      if (verbose) {
        console.log(`🔍 [C035 Symbol-Based] Found ${tryCatchStatements.length} try-catch statements`);
      }
      
      for (const tryStatement of tryCatchStatements) {
        const catchClause = tryStatement.getCatchClause();
        if (catchClause) {
          const catchViolations = this.analyzeCatchBlock(catchClause, sourceFile, filePath, verbose);
          violations.push(...catchViolations);
        }
      }
      
      if (verbose) {
        console.log(`🔍 [C035 Symbol-Based] Total violations found: ${violations.length}`);
      }
      
      return violations;
    } catch (error) {
      if (verbose) {
        console.warn(`[C035 Symbol-Based] Analysis failed for ${filePath}:`, error.message);
      }
      return violations;
    }
  }

  /**
   * Analyze catch block for logging context violations
   */
  analyzeCatchBlock(catchClause, sourceFile, filePath, verbose = false) {
    const violations = [];
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Analyzing catch block in ${filePath}`);
    }
    
    // Get catch parameter (e, error, err, etc.)
    const catchParameter = catchClause.getVariableDeclaration();
    const errorVarName = catchParameter?.getName() || 'e';
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Error variable name: ${errorVarName}`);
    }
    
    // Find all log calls within catch block
    const catchBlock = catchClause.getBlock();
    const logCalls = this.findLogCallsInBlock(catchBlock);
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Found ${logCalls.length} log calls in catch block`);
    }
    
    if (logCalls.length === 0) {
      // No logging found - but this is C029's concern, not C035
      // We only analyze existing logs for quality
      return violations;
    }
    
    // Analyze each log call for context quality
    for (const logCall of logCalls) {
      if (verbose) {
        console.log(`🔍 [C035 Symbol-Based] Analyzing log call: ${logCall.getText()}`);
      }
      const logViolations = this.analyzeLogCall(logCall, errorVarName, sourceFile, filePath, verbose);
      violations.push(...logViolations);
    }
    
    return violations;
  }

  /**
   * Find all logging method calls within a block
   */
  findLogCallsInBlock(block) {
    const logCalls = [];
    const callExpressions = block.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const callExpr of callExpressions) {
      if (this.isLoggerCall(callExpr)) {
        logCalls.push(callExpr);
      }
    }
    
    return logCalls;
  }

  /**
   * Check if a call expression is a logger call
   */
  isLoggerCall(callExpr) {
    const expression = callExpr.getExpression();
    
    // Handle property access (logger.error, console.log, etc.)
    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const objectName = expression.getExpression().getText().toLowerCase();
      const methodName = expression.getName().toLowerCase();
      
      // Check against known logger patterns
      for (const [loggerName, methods] of Object.entries(this.loggerPatterns)) {
        if (objectName.includes(loggerName) && methods.includes(methodName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Analyze individual log call for context quality
   */
  analyzeLogCall(logCall, errorVarName, sourceFile, filePath, verbose = false) {
    const violations = [];
    const lineNumber = logCall.getStartLineNumber();
    const columnNumber = logCall.getStart() - logCall.getStartLinePos();
    
    const args = logCall.getArguments();
    if (args.length === 0) {
      return violations; // No arguments to analyze
    }
    
    // Analyze logging structure and content
    const analysis = this.analyzeLogArguments(args, errorVarName, verbose);
    
    // Check for violations
    if (!analysis.isStructured) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'warning',
        message: 'Error logging should use structured format (object) instead of string concatenation',
        source: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        description: `[SYMBOL-BASED] Non-structured logging detected. Use object format for better parsing and monitoring.`,
        suggestion: 'Use logger.error("message", { error: e.message, context: {...} }) instead of string concatenation',
        category: 'logging'
      });
    }
    
    if (!analysis.hasRequiredContext) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'warning',
        message: 'Error logging missing required context information',
        source: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        description: `[SYMBOL-BASED] Missing context: ${analysis.missingContext.join(', ')}. Include identifiers and operation context.`,
        suggestion: 'Add requestId, userId, and operation context to log for better traceability',
        category: 'logging'
      });
    }
    
    if (analysis.hasSensitiveData) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'error',
        message: 'Error logging contains potentially sensitive data',
        source: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        description: `[SYMBOL-BASED] Sensitive patterns detected: ${analysis.sensitivePatterns.join(', ')}. Mask or exclude sensitive data.`,
        suggestion: 'Mask sensitive data: password.substring(0,2) + "***" or exclude entirely',
        category: 'security'
      });
    }
    
    return violations;
  }

  /**
   * Analyze log arguments for structure, context, and sensitive data
   */
  analyzeLogArguments(args, errorVarName, verbose = false) {
    const analysis = {
      isStructured: false,
      hasRequiredContext: false,
      hasSensitiveData: false,
      missingContext: [],
      sensitivePatterns: []
    };
    
    // Check if any argument is an object (structured logging)
    for (const arg of args) {
      if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        analysis.isStructured = true;
        
        // Analyze object properties for context and sensitive data
        const properties = arg.getProperties();
        this.analyzeObjectProperties(properties, analysis, verbose);
        break;
      }
    }
    
    // If not structured, check for string concatenation patterns
    if (!analysis.isStructured) {
      for (const arg of args) {
        const argText = arg.getText().toLowerCase();
        this.checkForSensitiveDataInText(argText, analysis);
      }
    }
    
    // Check required context
    this.validateRequiredContext(analysis);
    
    return analysis;
  }

  /**
   * Analyze object literal properties for context and sensitive data
   */
  analyzeObjectProperties(properties, analysis, verbose = false) {
    const foundContext = {
      errorInfo: false,
      identifier: false,
      context: false
    };
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Analyzing ${properties.length} object properties`);
    }
    
    for (const prop of properties) {
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const propName = prop.getName()?.toLowerCase() || '';
        
        if (verbose) {
          console.log(`🔍 [C035 Symbol-Based] Checking property: '${propName}' (kind: PropertyAssignment)`);
        }
      } else if (prop.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
        const propName = prop.getName()?.toLowerCase() || '';
        
        if (verbose) {
          console.log(`🔍 [C035 Symbol-Based] Checking shorthand property: '${propName}' (kind: ShorthandPropertyAssignment)`);
        }
        
        // Check for required context - same logic for shorthand properties
        if (this.requiredContext.errorInfo.some(ctx => propName.includes(ctx))) {
          foundContext.errorInfo = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found error info in shorthand: '${propName}'`);
          }
        }
        if (this.requiredContext.identifier.some(ctx => propName.includes(ctx))) {
          foundContext.identifier = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found identifier in shorthand: '${propName}'`);
          }
        }
        if (this.requiredContext.context.some(ctx => propName.includes(ctx))) {
          foundContext.context = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found context in shorthand: '${propName}'`);
          }
        }
        
        // Check for sensitive data in shorthand properties too
        const matchingSensitivePattern = this.sensitivePatterns.find(pattern => {
          const regex = new RegExp(`\\b${pattern}\\b`, 'i');
          return regex.test(propName);
        });
        
        if (matchingSensitivePattern) {
          analysis.hasSensitiveData = true;
          analysis.sensitivePatterns.push(propName);
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Sensitive pattern detected in shorthand: '${propName}' matches '${matchingSensitivePattern}'`);
          }
        }
      } else {
        if (verbose) {
          console.log(`🔍 [C035 Symbol-Based] Skipping property with kind: ${prop.getKindName()}`);
        }
      }
      
      // Original PropertyAssignment logic
      if (prop.getKind() === SyntaxKind.PropertyAssignment) {
        const propName = prop.getName()?.toLowerCase() || '';
        
        if (verbose) {
          console.log(`🔍 [C035 Symbol-Based] Checking property: '${propName}'`);
        }
        
        // Check for required context
        if (this.requiredContext.errorInfo.some(ctx => propName.includes(ctx))) {
          foundContext.errorInfo = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found error info: '${propName}'`);
          }
        }
        if (this.requiredContext.identifier.some(ctx => propName.includes(ctx))) {
          foundContext.identifier = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found identifier: '${propName}'`);
          }
        }
        if (this.requiredContext.context.some(ctx => propName.includes(ctx))) {
          foundContext.context = true;
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Found context: '${propName}'`);
          }
        }
        
        // Check for sensitive data (use word boundaries to avoid false positives)
        const matchingSensitivePattern = this.sensitivePatterns.find(pattern => {
          const regex = new RegExp(`\\b${pattern}\\b`, 'i');
          return regex.test(propName);
        });
        
        if (matchingSensitivePattern) {
          analysis.hasSensitiveData = true;
          analysis.sensitivePatterns.push(propName);
          if (verbose) {
            console.log(`🔍 [C035 Symbol-Based] Sensitive pattern detected: '${propName}' matches '${matchingSensitivePattern}'`);
          }
        }
      }
    }
    
    // Update analysis based on found context
    // For structured logs, be more lenient - having error info is sufficient
    // Identifier and context are nice-to-have but not required for structured logs
    analysis.hasRequiredContext = foundContext.errorInfo || 
                                  (foundContext.identifier && foundContext.context);
    
    if (verbose) {
      console.log(`🔍 [C035 Symbol-Based] Context found - errorInfo: ${foundContext.errorInfo}, identifier: ${foundContext.identifier}, context: ${foundContext.context}`);
      console.log(`🔍 [C035 Symbol-Based] hasRequiredContext: ${analysis.hasRequiredContext}`);
    }
    
    // Only flag missing context if there's no error info at all
    // For structured logs with error object, consider it sufficient
    if (!foundContext.errorInfo && !foundContext.identifier) {
      analysis.missingContext.push('error information or identifier');
    }
    // Remove the overly strict context requirement for structured logs with error info
    // Context is nice-to-have but not required when we have structured error info
  }

  /**
   * Check text for sensitive data patterns
   */
  checkForSensitiveDataInText(text, analysis) {
    for (const pattern of this.sensitivePatterns) {
      if (text.includes(pattern)) {
        analysis.hasSensitiveData = true;
        analysis.sensitivePatterns.push(pattern);
      }
    }
  }

  /**
   * Validate required context elements
   */
  validateRequiredContext(analysis) {
    // For structured logs, context validation is already handled in analyzeObjectProperties
    if (analysis.isStructured) {
      // If structured and has error info, consider it sufficient
      if (analysis.hasRequiredContext && analysis.missingContext.length === 0) {
        return; // Already validated in analyzeObjectProperties
      }
    } else {
      // For non-structured logs, we can't reliably detect context
      analysis.missingContext.push('structured format required for context validation');
      analysis.hasRequiredContext = false;
    }
  }
}

module.exports = C035SymbolBasedAnalyzer;
