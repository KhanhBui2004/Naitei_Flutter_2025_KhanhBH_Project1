/**
 * S007 Semantic Analyzer - No Plaintext OTP
 * Semantic analysis for detecting plaintext OTP storage/transmission using Symbol Table
 * 
 * Advantages over regex:
 * - Context-aware analysis (knows function scopes, variable relationships)
 * - Cross-file dependency tracking
 * - Type information and data flow analysis
 * - Reduced false positives through semantic understanding
 */

const SemanticRuleBase = require('../../../core/semantic-rule-base');

class S007SemanticAnalyzer extends SemanticRuleBase {
  constructor(ruleId = 'S007') {
    super(ruleId, {
      category: 'security',
      severity: 'error',
      description: 'Detects plaintext OTP storage and transmission using semantic analysis',
      crossFileAnalysis: true,
      requiresTypeChecker: false,
      cacheResults: true
    });
    
    // OTP-related patterns for semantic analysis
    this.otpPatterns = {
      // Variable names that suggest OTP usage
      variableNames: [
        /^(otp|totp|hotp)$/i,
        /^(one_?time|onetime)_?(password|pass|code)$/i,
        /^(auth|verification|sms|temp|security|access|login)_?code$/i,
        /^(two_?factor|2fa|mfa)_?(token|code)$/i,
        /^pin_?code$/i
      ],
      
      // Function names that handle OTP
      functionNames: [
        /^(generate|create|store|save|send|validate|verify)_?otp$/i,
        /^otp_?(generate|create|store|save|send|validate|verify)$/i,
        /^(generate|create|store|save|send|validate|verify)_?(auth|verification|sms|temp|security|access|login)_?code$/i,
        /^send_?(sms|email|auth)_?code$/i
      ],
      
      // Method calls that suggest OTP operations
      methodNames: [
        'sendOtp', 'storeOtp', 'saveOtp', 'generateOtp', 'verifyOtp',
        'sendSmsCode', 'sendAuthCode', 'storeAuthCode', 'saveAuthCode'
      ]
    };
    
    // Dangerous storage/transmission patterns
    this.dangerousOperations = {
      // Database storage methods
      storage: [
        'save', 'store', 'insert', 'update', 'create', 'persist',
        'collection.insertOne', 'collection.updateOne', 'db.save',
        'redis.set', 'redis.hset', 'cache.put', 'cache.set'
      ],
      
      // Network transmission methods
      transmission: [
        'send', 'emit', 'post', 'put', 'response.json', 'res.send',
        'email.send', 'sms.send', 'notify', 'broadcast'
      ],
      
      // Browser storage
      browserStorage: [
        'localStorage.setItem', 'sessionStorage.setItem',
        'localStorage.set', 'sessionStorage.set'
      ],
      
      // Logging (usually unsafe for OTP)
      logging: [
        'console.log', 'console.debug', 'console.info',
        'logger.info', 'logger.debug', 'log.info'
      ]
    };
    
    // Safe operations that encrypt/hash
    this.safeOperations = [
      'bcrypt.hash', 'crypto.createHash', 'crypto.createHmac',
      'hash', 'encrypt', 'cipher', 'secure', 'pbkdf2',
      'scrypt', 'argon2'
    ];
  }

  /**
   * Main file analysis using Symbol Table
   */
  async analyzeFile(filePath, options = {}) {
    try {
      if (options.verbose) {
        console.log('🧠 Analyzing file:', filePath);
      }
      const symbolTable = await this.getSymbolTable(filePath);
      if (!symbolTable) {
        if (options.verbose) {
          console.warn(`⚠️ ${this.ruleId}: No symbol table available for ${filePath}`);
        }
        return;
      }

      if (options.verbose) {
        console.log(`🧠 ${this.ruleId}: Analyzing ${filePath} with Symbol Table`);
      }

      // Analyze different aspects using semantic information with error handling
      try {
        await this.analyzeVariableUsage(symbolTable, filePath);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ ${this.ruleId}: Variable analysis failed for ${filePath}: ${error.message}`);
        }
      }
      
      try {
        await this.analyzeFunctionCalls(symbolTable, filePath);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ ${this.ruleId}: Function call analysis failed for ${filePath}: ${error.message}`);
        }
      }
      
      try {
        await this.analyzeMethodChains(symbolTable, filePath);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ ${this.ruleId}: Method chain analysis failed for ${filePath}: ${error.message}`);
        }
      }
      
      try {
        await this.analyzeDataFlow(symbolTable, filePath);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ ${this.ruleId}: Data flow analysis failed for ${filePath}: ${error.message}`);
        }
      }
      
      // Cross-file analysis if enabled
      if (this.config.crossFileAnalysis) {
        try {
          await this.analyzeCrossFileReferences(symbolTable, filePath);
        } catch (error) {
          if (options.verbose) {
            console.warn(`⚠️ ${this.ruleId}: Cross-file analysis failed for ${filePath}: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ ${this.ruleId}: Semantic analysis failed for ${filePath}: ${error.message}`);
      // Don't throw - let the wrapper handle fallback
    }
  }

  /**
   * Analyze variable declarations and assignments for OTP patterns
   */
  async analyzeVariableUsage(symbolTable, filePath) {
    // Check variable declarations with safe array handling
    const variables = symbolTable.variables || [];
    const constants = symbolTable.constants || [];
    const allVariables = [...variables, ...constants];
    
    for (const variable of allVariables) {
      if (this.isOtpVariable(variable.name)) {
        // Check if this OTP variable is used in dangerous contexts
        const dangerousUsages = await this.findDangerousVariableUsages(
          symbolTable, 
          variable.name, 
          variable.line
        );
        
        for (const usage of dangerousUsages) {
          this.addViolation({
            filePath,
            line: usage.line,
            column: usage.column || 1,
            message: `OTP variable '${variable.name}' is used in ${usage.context} without encryption`,
            type: 'semantic_otp_variable_usage',
            severity: this.determineSeverity(usage.context),
            symbolContext: {
              variableName: variable.name,
              variableType: variable.type,
              usageContext: usage.context,
              operation: usage.operation
            },
            suggestion: this.generateSecuritySuggestion(usage.context),
            codeSnippet: usage.codeSnippet
          });
        }
      }
    }
  }

  /**
   * Analyze function calls for OTP-related operations
   */
  async analyzeFunctionCalls(symbolTable, filePath) {
    const functionCalls = symbolTable.functionCalls || [];
    for (const functionCall of functionCalls) {
      // Check if function name suggests OTP handling
      if (this.isOtpFunction(functionCall.functionName)) {
        const context = await this.analyzeFunctionContext(symbolTable, functionCall);
        
        if (context.isDangerous && !context.isSecure) {
          this.addViolation({
            filePath,
            line: functionCall.line,
            column: functionCall.column || 1,
            message: `Function '${functionCall.functionName}' may handle OTP in plaintext`,
            type: 'semantic_otp_function_call',
            severity: 'warning',
            symbolContext: {
              functionName: functionCall.functionName,
              arguments: functionCall.arguments,
              returnType: functionCall.returnType,
              context: context
            },
            suggestion: 'Ensure OTP values are encrypted before processing'
          });
        }
      }
      
      // Check for dangerous operations with OTP arguments
      if (this.isDangerousOperation(functionCall.functionName)) {
        const hasOtpArguments = await this.checkOtpArguments(symbolTable, functionCall);
        
        if (hasOtpArguments.length > 0) {
          this.addViolation({
            filePath,
            line: functionCall.line,
            column: functionCall.column || 1,
            message: `Potential plaintext OTP passed to ${functionCall.functionName}`,
            type: 'semantic_plaintext_otp_argument',
            severity: 'error',
            symbolContext: {
              functionName: functionCall.functionName,
              otpArguments: hasOtpArguments,
              operation: this.categorizeDangerousOperation(functionCall.functionName)
            },
            suggestion: 'Encrypt or hash OTP values before storage/transmission'
          });
        }
      }
    }
  }

  /**
   * Analyze method chains for OTP operations
   */
  async analyzeMethodChains(symbolTable, filePath) {
    const methodCalls = symbolTable.methodCalls || [];
    for (const methodCall of methodCalls) {
      // Look for patterns like: otpCode.save() or user.storeOtp()
      if (this.isOtpRelatedMethodCall(methodCall)) {
        const chainContext = await this.analyzeMethodChain(symbolTable, methodCall);
        
        if (chainContext.isUnsafe) {
          this.addViolation({
            filePath,
            line: methodCall.line,
            column: methodCall.column || 1,
            message: `Method chain exposes OTP in plaintext: ${chainContext.chain}`,
            type: 'semantic_method_chain_otp',
            severity: 'error',
            symbolContext: {
              methodChain: chainContext.chain,
              objectName: methodCall.objectName,
              methodName: methodCall.methodName,
              dataFlow: chainContext.dataFlow
            },
            suggestion: 'Use secure methods for OTP handling in method chains'
          });
        }
      }
    }
  }

  /**
   * Analyze data flow to track OTP values through the code
   */
  async analyzeDataFlow(symbolTable, filePath) {
    // Find all OTP-related variables and track their usage
    const variables = symbolTable.variables || [];
    const otpVariables = variables.filter(v => this.isOtpVariable(v.name));
    
    for (const otpVar of otpVariables) {
      const dataFlow = await this.traceDataFlow(symbolTable, otpVar.name);
      
      // Check if OTP flows to dangerous sinks
      const dangerousSinks = dataFlow.filter(flow => 
        this.isDangerousOperation(flow.operation) && 
        !this.isSafeOperation(flow.operation)
      );
      
      for (const sink of dangerousSinks) {
        this.addViolation({
          filePath,
          line: sink.line,
          column: sink.column || 1,
          message: `OTP variable '${otpVar.name}' flows to unsafe operation '${sink.operation}'`,
          type: 'semantic_data_flow_violation',
          severity: 'error',
          symbolContext: {
            sourceVariable: otpVar.name,
            dataFlowPath: dataFlow,
            dangerousSink: sink,
            flowDistance: sink.distance
          },
          suggestion: 'Ensure OTP is encrypted before reaching this operation'
        });
      }
    }
  }

  /**
   * Cross-file analysis for OTP security
   */
  async analyzeCrossFileReferences(symbolTable, filePath) {
    // Find OTP-related exports
    const exports = symbolTable.exports || [];
    const otpExports = exports.filter(exp => 
      this.isOtpFunction(exp.name) || this.isOtpVariable(exp.name)
    );
    
    for (const otpExport of otpExports) {
      // Find where this OTP symbol is imported and used
      const crossFileUsages = await this.findCrossFileUsages(otpExport.name, [filePath]);
      
      for (const usage of crossFileUsages) {
        const usageSymbolTable = await this.getSymbolTable(usage.filePath);
        if (!usageSymbolTable) continue;
        
        // Check if the imported OTP symbol is used safely
        const dangerousUsage = await this.analyzeImportedOtpUsage(
          usageSymbolTable, 
          otpExport.name, 
          usage
        );
        
        if (dangerousUsage) {
          this.addViolation({
            filePath: usage.filePath,
            line: usage.line,
            column: usage.column || 1,
            message: `Imported OTP symbol '${otpExport.name}' used unsafely`,
            type: 'semantic_cross_file_otp_violation',
            severity: 'warning',
            symbolContext: {
              exportedFrom: filePath,
              importedSymbol: otpExport.name,
              usageContext: dangerousUsage
            },
            crossFileReferences: [{
              sourceFile: filePath,
              targetFile: usage.filePath,
              symbol: otpExport.name,
              usageType: dangerousUsage.type
            }],
            suggestion: 'Ensure consistent OTP security across file boundaries'
          });
        }
      }
    }
  }

  /**
   * Helper methods for semantic analysis
   */

  isOtpVariable(variableName) {
    return this.otpPatterns.variableNames.some(pattern => pattern.test(variableName));
  }

  isOtpFunction(functionName) {
    return this.otpPatterns.functionNames.some(pattern => pattern.test(functionName)) ||
           this.otpPatterns.methodNames.includes(functionName);
  }

  isDangerousOperation(operationName) {
    return Object.values(this.dangerousOperations).flat().some(op => 
      operationName.includes(op) || operationName === op
    );
  }

  isSafeOperation(operationName) {
    return this.safeOperations.some(op => operationName.includes(op));
  }

  async findDangerousVariableUsages(symbolTable, variableName, declarationLine) {
    const usages = [];
    
    // Check function calls that use this variable with safe array access
    const functionCalls = symbolTable.functionCalls || [];
    const relatedCalls = functionCalls.filter(call =>
      call.arguments && call.arguments.some(arg => arg && arg.includes && arg.includes(variableName))
    );
    
    for (const call of relatedCalls) {
      if (this.isDangerousOperation(call.functionName)) {
        usages.push({
          line: call.line,
          column: call.column,
          context: this.categorizeDangerousOperation(call.functionName),
          operation: call.functionName,
          codeSnippet: `${call.functionName}(${call.arguments.join(', ')})`
        });
      }
    }
    
    return usages;
  }

  categorizeDangerousOperation(operationName) {
    if (this.dangerousOperations.storage.some(op => operationName.includes(op))) {
      return 'storage';
    }
    if (this.dangerousOperations.transmission.some(op => operationName.includes(op))) {
      return 'transmission';
    }
    if (this.dangerousOperations.browserStorage.some(op => operationName.includes(op))) {
      return 'browser_storage';
    }
    if (this.dangerousOperations.logging.some(op => operationName.includes(op))) {
      return 'logging';
    }
    return 'unknown_dangerous';
  }

  determineSeverity(context) {
    const severityMap = {
      'storage': 'error',
      'transmission': 'error', 
      'browser_storage': 'warning',
      'logging': 'warning',
      'unknown_dangerous': 'info'
    };
    return severityMap[context] || 'warning';
  }

  generateSecuritySuggestion(context) {
    const suggestions = {
      'storage': 'Use bcrypt.hash() or crypto.createHash() before storing OTP',
      'transmission': 'Encrypt OTP before transmission or use secure channels',
      'browser_storage': 'Avoid storing OTP in browser storage, use secure tokens instead',
      'logging': 'Never log actual OTP values, log only metadata like generation time',
      'unknown_dangerous': 'Review this operation for OTP security best practices'
    };
    return suggestions[context] || 'Ensure OTP security best practices';
  }

  async analyzeFunctionContext(symbolTable, functionCall) {
    // Analyze the context around the function call
    const context = {
      isDangerous: false,
      isSecure: false,
      securityMeasures: []
    };
    
    // Check if function is called within a security context
    const nearbyLines = this.getNearbyLines(symbolTable, functionCall.line, 3);
    
    for (const line of nearbyLines) {
      if (this.safeOperations.some(op => line.text.includes(op))) {
        context.isSecure = true;
        context.securityMeasures.push(line.text);
      }
      
      if (this.isDangerousOperation(line.text)) {
        context.isDangerous = true;
      }
    }
    
    return context;
  }

  async checkOtpArguments(symbolTable, functionCall) {
    const otpArguments = [];
    
    if (!functionCall.arguments) return otpArguments;
    
    for (const arg of functionCall.arguments) {
      // Check if argument looks like OTP variable
      if (this.isOtpVariable(arg)) {
        otpArguments.push({
          value: arg,
          type: 'variable',
          confidence: 'high'
        });
      }
      
      // Check if argument is a string that looks like OTP
      if (this.looksLikeOtpValue(arg)) {
        otpArguments.push({
          value: arg,
          type: 'literal',
          confidence: 'medium'
        });
      }
    }
    
    return otpArguments;
  }

  looksLikeOtpValue(value) {
    // Patterns that suggest OTP values
    const otpValuePatterns = [
      /^['"`]\d{4,8}['"`]$/, // 4-8 digit codes in quotes
      /^['"`][A-Z0-9]{4,8}['"`]$/i, // 4-8 alphanumeric codes
      /\$\{.*otp.*\}/i, // Template strings with otp
      /\+.*otp/i // String concatenation with otp
    ];
    
    return otpValuePatterns.some(pattern => pattern.test(value));
  }

  isOtpRelatedMethodCall(methodCall) {
    return this.isOtpVariable(methodCall.objectName) || 
           this.isOtpFunction(methodCall.methodName) ||
           (methodCall.objectName && methodCall.objectName.toLowerCase().includes('otp'));
  }

  async analyzeMethodChain(symbolTable, methodCall) {
    const chain = `${methodCall.objectName}.${methodCall.methodName}()`;
    const isUnsafe = this.isDangerousOperation(methodCall.methodName) && 
                     !this.isSafeOperation(methodCall.methodName);
    
    return {
      chain,
      isUnsafe,
      dataFlow: await this.traceMethodChainDataFlow(symbolTable, methodCall)
    };
  }

  async traceDataFlow(symbolTable, variableName) {
    const dataFlow = [];
    
    // Find all usages of this variable in function calls
    const functionCalls = symbolTable.functionCalls || [];
    for (const call of functionCalls) {
      if (call.arguments && call.arguments.some(arg => arg && arg.includes && arg.includes(variableName))) {
        dataFlow.push({
          line: call.line,
          operation: call.functionName,
          type: 'function_call',
          distance: Math.abs(call.line - this.getVariableDeclarationLine(symbolTable, variableName))
        });
      }
    }
    
    // Find all usages in method calls
    const methodCalls = symbolTable.methodCalls || [];
    for (const call of methodCalls) {
      if (call.arguments && call.arguments.some(arg => arg && arg.includes && arg.includes(variableName))) {
        dataFlow.push({
          line: call.line,
          operation: `${call.objectName}.${call.methodName}`,
          type: 'method_call',
          distance: Math.abs(call.line - this.getVariableDeclarationLine(symbolTable, variableName))
        });
      }
    }
    
    return dataFlow.sort((a, b) => a.line - b.line);
  }

  getVariableDeclarationLine(symbolTable, variableName) {
    const variables = symbolTable.variables || [];
    const constants = symbolTable.constants || [];
    const variable = variables.find(v => v.name === variableName) ||
                    constants.find(v => v.name === variableName);
    return variable ? variable.line : 1;
  }

  async traceMethodChainDataFlow(symbolTable, methodCall) {
    // Simplified data flow analysis for method chains
    return {
      source: methodCall.objectName,
      operation: methodCall.methodName,
      line: methodCall.line
    };
  }

  async analyzeImportedOtpUsage(symbolTable, symbolName, usage) {
    // Check how the imported OTP symbol is used
    const functionCalls = symbolTable.functionCalls || [];
    const usages = functionCalls.filter(call => 
      call.functionName === symbolName || 
      (call.arguments && call.arguments.includes(symbolName))
    );
    
    for (const use of usages) {
      if (this.isDangerousOperation(use.functionName) && !this.isSafeOperation(use.functionName)) {
        return {
          type: 'dangerous_usage',
          operation: use.functionName,
          line: use.line,
          context: this.categorizeDangerousOperation(use.functionName)
        };
      }
    }
    
    return null;
  }
}

module.exports = S007SemanticAnalyzer;
