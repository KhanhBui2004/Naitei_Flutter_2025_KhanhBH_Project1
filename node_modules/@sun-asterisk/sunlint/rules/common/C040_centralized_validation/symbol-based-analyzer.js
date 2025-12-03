/**
 * Symbol-based analyzer for C040 - Centralized Validation Logic Analysis
 * Purpose: Use AST + Data Flow to detect scattered validation logic across layers
 */

const { SyntaxKind } = require('ts-morph');

class C040SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C040';
    this.ruleName = 'Centralized Validation Logic (Symbol-Based)';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Validation patterns to detect
    this.validationPatterns = {
      functionNames: [
        'validate', 'check', 'ensure', 'verify', 'isValid', 'hasValid',
        'validateInput', 'checkInput', 'validateData', 'sanitize'
      ],
      frameworks: ['zod', 'joi', 'yup', 'class-validator', 'ajv'],
      errorTypes: ['ValidationError', 'BadRequest', 'InvalidInput', 'TypeError']
    };
    
    // Layer detection patterns
    this.layerPatterns = {
      controller: /controller|route|handler/i,
      service: /service|business|logic/i,
      repository: /repository|dao|data/i,
      validator: /validator|validation|schema/i
    };
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 C040 Symbol-Based: Analyzer initialized`);
    }
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    if (!this.semanticEngine?.project) {
      if (this.verbose) {
        console.warn('[C040 Symbol-Based] No semantic engine available, skipping analysis');
      }
      return violations;
    }
    
    for (const filePath of files) {
      try {
        const fileViolations = await this.analyzeFile(filePath);
        violations.push(...fileViolations);
      } catch (error) {
        if (this.verbose) {
          console.warn(`[C040] Analysis failed for ${filePath}:`, error.message);
        }
      }
    }
    
    return violations;
  }

  async analyzeFile(filePath) {
    const violations = [];
    
    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) {
        if (this.verbose) {
          console.log(`[C040] Source file not found in project: ${filePath}`);
        }
        return violations;
      }

      if (this.verbose) {
        console.log(`[C040] Analyzing file: ${filePath}`);
      }

      // Detect layer from file path
      const layer = this.detectLayer(filePath);
      
      // Find validation patterns
      const validationScents = this.findValidationPatterns(sourceFile);
      
      if (validationScents.length > 0) {
        // Check if validation is in wrong layer
        if (layer === 'controller' || layer === 'service') {
          const complexValidations = validationScents.filter(v => v.isComplex);
          const businessValidations = complexValidations.filter(v => 
            v.context === 'business-validation'
          );
          
          if (businessValidations.length > 0) {
            violations.push({
              ruleId: this.ruleId,
              severity: 'warning',
              message: `Found ${businessValidations.length} complex business validation pattern(s) in ${layer} layer. Consider moving to validators.`,
              file: filePath,
              line: businessValidations[0].line,
              column: businessValidations[0].column,
              details: {
                layer,
                validationCount: businessValidations.length,
                patterns: businessValidations.map(v => v.pattern),
                suggestion: 'Move validation logic to dedicated validator classes',
                ruleName: this.ruleName
              }
            });
          }
        }
      }

    } catch (error) {
      if (this.verbose) {
        console.warn(`[C040] Error analyzing ${filePath}:`, error.message);
      }
    }

    return violations;
  }

  detectLayer(filePath) {
    const path = filePath.toLowerCase();
    
    for (const [layer, pattern] of Object.entries(this.layerPatterns)) {
      if (pattern.test(path)) {
        return layer;
      }
    }
    
    return 'unknown';
  }

  findValidationPatterns(sourceFile) {
    const patterns = [];
    
    // 1. Find business validation functions (semantic analysis)
    sourceFile.getFunctions().forEach(func => {
      const validationInfo = this.analyzeValidationFunction(func);
      if (validationInfo) {
        patterns.push(validationInfo);
      }
    });
    
    // 2. Find class methods with validation logic
    sourceFile.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        const validationInfo = this.analyzeValidationMethod(method, cls);
        if (validationInfo) {
          patterns.push(validationInfo);
        }
      });
    });
    
    // 3. Find validation decorators and frameworks usage
    sourceFile.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        const decoratorInfo = this.analyzeValidationDecorators(method);
        if (decoratorInfo) {
          patterns.push(decoratorInfo);
        }
      });
    });
    
    return patterns;
  }

  /**
   * Analyze if a function contains actual business validation logic
   */
  analyzeValidationFunction(func) {
    const name = func.getName();
    const body = func.getBodyText();
    
    // Skip if it's infrastructure/utility function
    if (this.isInfrastructureFunction(func, name, body)) {
      return null;
    }
    
    // Check for actual validation patterns in body
    const validationSignals = this.countValidationSignals(body);
    
    if (validationSignals.score > 2) { // Threshold for real validation
      return {
        type: 'function',
        pattern: name,
        line: func.getStartLineNumber(),
        column: func.getStart(),
        isComplex: validationSignals.score > 5,
        signals: validationSignals.patterns,
        context: 'business-validation'
      };
    }
    
    return null;
  }

  /**
   * Analyze if a method contains business validation logic
   */
  analyzeValidationMethod(method, parentClass) {
    const methodName = method.getName();
    const className = parentClass.getName();
    const body = method.getBodyText();
    
    // Skip infrastructure methods
    if (this.isInfrastructureMethod(method, methodName, body, className)) {
      return null;
    }
    
    // Check for validation patterns
    const validationSignals = this.countValidationSignals(body);
    
    // Balanced threshold to catch meaningful validation
    if (validationSignals.score > 3) {
      return {
        type: 'method',
        pattern: `${className}.${methodName}`,
        line: method.getStartLineNumber(),
        column: method.getStart(),
        isComplex: validationSignals.score > 6,
        signals: validationSignals.patterns,
        context: 'business-validation'
      };
    }
    
    return null;
  }

  /**
   * Check for validation framework decorators
   */
  analyzeValidationDecorators(method) {
    const decorators = method.getDecorators();
    const validationDecorators = decorators.filter(dec => {
      const name = dec.getName();
      return ['IsEmail', 'IsString', 'IsNumber', 'Min', 'Max', 'Length', 'Matches'].includes(name);
    });
    
    if (validationDecorators.length > 0) {
      return {
        type: 'decorator',
        pattern: validationDecorators.map(d => d.getName()).join(', '),
        line: method.getStartLineNumber(),
        column: method.getStart(),
        isComplex: true,
        context: 'framework-validation'
      };
    }
    
    return null;
  }

  /**
   * Check if function/method is infrastructure/utility rather than business validation
   */
  isInfrastructureFunction(func, name, body) {
    // Health check patterns
    if (name === 'check' && body.includes('health')) return true;
    if (name.includes('health') || name.includes('Health')) return true;
    
    // Crypto/hash utilities
    if (name === 'check' && (body.includes('bcrypt') || body.includes('hash') || body.includes('crypto'))) return true;
    if (name.includes('hash') && body.includes('bcrypt')) return true;
    
    // Authentication utilities (not business validation)
    if (name.includes('verify') && body.includes('jwt')) return true;
    if (name.includes('verify') && body.includes('token')) return true;
    
    // Simple getters/setters
    if (name.startsWith('get') || name.startsWith('set')) return true;
    
    return false;
  }

  /**
   * Check if method is infrastructure/utility
   */
  isInfrastructureMethod(method, methodName, body, className) {
    // Infrastructure keywords in method/class names  
    const infraKeywords = [
      'health', 'hash', 'auth', 'login', 'register', 'encrypt', 'decrypt',
      'token', 'session', 'cookie', 'cache', 'log', 'monitor', 'metric',
      's3', 'aws', 'storage', 'upload', 'download', 'file', 'config',
      'connection', 'database', 'db', 'migration', 'seed', 'error', 'exception'
    ];
    
    const lowerMethodName = methodName.toLowerCase();
    const lowerClassName = className.toLowerCase();
    
    // Check method/class names
    if (infraKeywords.some(keyword => 
      lowerMethodName.includes(keyword) || lowerClassName.includes(keyword)
    )) {
      return true;
    }
    
    // Controller methods that just delegate (not business validation)
    if (className.toLowerCase().includes('controller')) {
      // Simple delegation patterns
      const delegationPatterns = [
        /return\s+await\s+this\.\w+\.\w+\(/,
        /return\s+this\.\w+\.\w+\(/,
        /^\s*return\s+await/m
      ];
      
      if (delegationPatterns.some(pattern => pattern.test(body))) {
        return true;
      }
    }
    
    // Check method body for infrastructure patterns
    const infraPatterns = [
      /bcrypt|crypto|jwt/i,
      /\.hash\(|\.compare\(/i,
      /redis|cache/i,
      /aws|s3|bucket/i,
      /winston|logger/i,
      /fileExist|checkExist/i,
      /uploadFile|downloadFile/i,
      /HttpStatus\./i  // Pure HTTP status handling
    ];
    
    if (infraPatterns.some(pattern => pattern.test(body))) {
      return true;
    }
    
    // Call parent function check
    return this.isInfrastructureFunction(method, methodName, body);
  }

  /**
   * Count actual validation signals in code body using semantic analysis
   */
  countValidationSignals(body) {
    let score = 0;
    const patterns = [];
    
    // Business validation patterns (weighted scoring)
    const validationIndicators = [
      // High weight - clear business validation
      { pattern: /throw new.*ValidationError/gi, weight: 5, name: 'ValidationError' },
      { pattern: /throw new.*BadRequest/gi, weight: 4, name: 'BadRequestError' },
      { pattern: /throw new.*InvalidInput/gi, weight: 4, name: 'InvalidInput' },
      
      // Medium weight - input validation
      { pattern: /if\s*\(\s*!.*\)\s*{[^}]*throw/gi, weight: 3, name: 'conditional-validation' },
      { pattern: /\.length\s*[<>]=?\s*\d+.*throw/gi, weight: 3, name: 'length-validation' },
      { pattern: /typeof.*!==.*throw/gi, weight: 3, name: 'type-validation' },
      
      // Framework validation
      { pattern: /zod\.|joi\.|yup\./gi, weight: 4, name: 'validation-framework' },
      { pattern: /class-validator/gi, weight: 4, name: 'class-validator' },
      
      // Business rule validation  
      { pattern: /validate[A-Z][a-zA-Z]*\(/gi, weight: 3, name: 'validate-method' },
      { pattern: /check[A-Z][a-zA-Z]*\(/gi, weight: 2, name: 'check-method' },
      { pattern: /ensure[A-Z][a-zA-Z]*\(/gi, weight: 3, name: 'ensure-method' },
      
      // Low weight - might be utility
      { pattern: /\.test\(/gi, weight: 1, name: 'regex-test' },
      { pattern: /\.match\(/gi, weight: 1, name: 'string-match' }
    ];
    
    validationIndicators.forEach(indicator => {
      const matches = body.match(indicator.pattern);
      if (matches) {
        score += matches.length * indicator.weight;
        patterns.push(`${indicator.name} (${matches.length})`);
      }
    });
    
    // Penalty for infrastructure patterns (increased penalties)
    const infrastructurePatterns = [
      { pattern: /bcrypt|crypto|jwt/gi, penalty: -4 },
      { pattern: /health|Health/gi, penalty: -6 },
      { pattern: /\.hash\(|\.compare\(/gi, penalty: -3 },
      { pattern: /HttpStatus\.|\.status\(/gi, penalty: -2 },
      { pattern: /aws|s3|bucket/gi, penalty: -4 },
      { pattern: /fileExist|checkExist/gi, penalty: -3 },
      { pattern: /return\s+await\s+this\./gi, penalty: -2 }, // Delegation pattern
      { pattern: /BadRequest.*S3/gi, penalty: -5 }, // S3 error handling
      { pattern: /error.*message/gi, penalty: -1 } // Generic error handling
    ];
    
    infrastructurePatterns.forEach(infra => {
      const matches = body.match(infra.pattern);
      if (matches) {
        score += matches.length * infra.penalty;
        patterns.push(`infrastructure-penalty (${matches.length})`);
      }
    });
    
    return { score: Math.max(0, score), patterns };
  }

  isValidationFunction(name) {
    return this.validationPatterns.functionNames.some(pattern =>
      name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  isValidationError(text) {
    return this.validationPatterns.errorTypes.some(errorType =>
      text.includes(errorType)
    );
  }
}

module.exports = C040SymbolBasedAnalyzer;
