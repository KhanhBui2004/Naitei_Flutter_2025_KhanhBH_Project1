const { SyntaxKind } = require('ts-morph');

/**
 * C019 System Log Analyzer - Simplified Version
 * 
 * Focus Areas:
 * 1. Đúng chỗ, đúng level (không bàn chuyện message/cause/fields)
 * 2. Thiếu hay thừa log (ở những điểm bắt buộc phải có / nên không có)
 */
class C019SystemLogAnalyzer {
  constructor(semanticEngine = null) {
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Configuration for system-level logging rules
    this.config = {
      layerClassifier: {
        controller: ['controller', 'route', 'handler', 'api', 'endpoint'],
        job: ['job', 'worker', 'cron', 'task', 'queue', 'processor'],
        service: ['service', 'business', 'domain', 'logic', 'usecase'],
        infra: ['client', 'adapter', 'gateway', 'repository', 'dao', 'external']
      },
      requiredLogEvents: {
        'http_5xx_boundary': {
          level: 'error',
          confidence: 0.9,
          message: 'HTTP 5xx responses must have error log at boundary',
          suggestion: 'Add error log before returning 5xx status'
        },
        'retry_exhausted': {
          level: 'error', 
          confidence: 0.8,
          message: 'Retry exhaustion must be logged as error',
          suggestion: 'Add error log when all retry attempts fail'
        }
      },
      overusedLogPatterns: {
        'hot_path_over_logging': {
          threshold: 8, // Max logs per function (increased for business logic)
          confidence: 0.5, // Lower confidence for less strict enforcement
          message: 'Too many log statements in hot path function',
          suggestion: 'Reduce logging frequency or use conditional logging'
        },
        'loop_over_logging': {
          threshold: 2, // Max logs per loop
          confidence: 0.8,
          message: 'Logging inside loops can impact performance',
          suggestion: 'Move logs outside loop or use sampling'
        }
      },
      missingLogPatterns: {
        'auth_failure_silent': {
          confidence: 0.9,
          message: 'Authentication failures should be logged for security',
          suggestion: 'Add warn/error log for failed authentication attempts'
        },
        'payment_transaction_silent': {
          confidence: 0.9,
          message: 'Payment transactions should be logged for audit',
          suggestion: 'Add info log for payment processing events'
        }
      },
      redundancyPatterns: {
        'duplicate_log_events': {
          maxDistance: 10, // Lines between similar logs
          confidence: 0.7,
          message: 'Duplicate log events detected',
          suggestion: 'Consolidate similar log statements'
        }
      },
      distributedPatterns: {
        'external_call_silent': {
          confidence: 0.7, // Reduced confidence for better precision
          message: 'External service calls should be logged for monitoring',
          suggestion: 'Add logs for external API/service interactions or use centralized logging'
        }
      },
      wrongLevelPatterns: {
        'missing_data_error': {
          expectedLevel: 'warn',
          confidence: 0.6,
          message: 'Missing/invalid data should use warn level',
          suggestion: 'Use warn for expected validation failures'
        },
        'retry_attempt_error': {
          expectedLevel: 'warn',
          confidence: 0.8, 
          message: 'Individual retry attempts should use warn level',
          suggestion: 'Use warn for retry attempts, error only when exhausted'
        }
      }
    };
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
  }

  async analyzeFileBasic(filePath, options = {}) {
    const violations = [];
    
    try {
      let sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      
      if (!sourceFile) {
        sourceFile = this.semanticEngine.project.addSourceFileAtPath(filePath);
      }
      
      if (!sourceFile) {
        sourceFile = this.semanticEngine.project.createSourceFile(filePath, '');
      }

      if (!sourceFile) {
        throw new Error(`Could not load or create source file: ${filePath}`);
      }

      if (this.verbose) {
        console.log(`[DEBUG] 🎯 C019: Using comprehensive system-level analysis for ${filePath.split('/').pop()}`);
      }

      // Skip test files - logs in tests have no production value
      if (this.isTestFile(filePath)) {
        if (this.verbose) {
          console.log(`[DEBUG] ❌ Skipping test file: ${filePath}`);
        }
        return [];
      }

      // Skip client-side files - client logs have limited operational value
      if (this.isClientSideFile(filePath, sourceFile)) {
        if (this.verbose) {
          console.log(`[DEBUG] ❌ Skipping client-side file: ${filePath}`);
        }
        return [];
      }

      // Classify file layer
      const layer = this.classifyFileLayer(filePath, sourceFile);
      
      // Find logging events and patterns
      const logCalls = this.findLogCalls(sourceFile);
      const httpReturns = this.findHttpStatusReturns(sourceFile);
      const retryPatterns = this.findRetryPatterns(sourceFile);

      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C019-System: Analyzing logging patterns in ${filePath.split('/').pop()}`);
      }

      // Phase 1: Analyze must-have logs
      violations.push(...this.analyzeRequiredLogs(filePath, sourceFile, layer, {
        logCalls, httpReturns, retryPatterns
      }));

      // Phase 1: Analyze wrong level usage
      violations.push(...this.analyzeWrongLevelUsage(filePath, sourceFile, layer, {
        logCalls, httpReturns, retryPatterns
      }));

      // Phase 2: Analyze overused logs
      violations.push(...this.analyzeOverusedLogs(filePath, sourceFile, layer, {
        logCalls
      }));

      // Phase 2: Analyze missing critical logs
      violations.push(...this.analyzeMissingCriticalLogs(filePath, sourceFile, layer, {
        logCalls, httpReturns
      }));

      // Phase 2: Analyze log redundancy
      violations.push(...this.analyzeLogRedundancy(filePath, sourceFile, layer, {
        logCalls
      }));

      // Phase 3: Only essential distributed logging
      violations.push(...this.analyzeDistributedPatterns(filePath, sourceFile, layer, {
        logCalls, httpReturns
      }));

      if (this.verbose) {
        console.log(`[DEBUG] 🔍 C019-System: Found ${violations.length} system-level violations`);
      }

      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`[DEBUG] ❌ C019-System: Analysis error: ${error.message}`);
      }
      throw error;
    }
  }

  // ===== FILE FILTERING =====

  isTestFile(filePath) {
    const testPatterns = [
      /\.test\./i, /\.spec\./i, /__tests__/i, /__test__/i,
      /test\//i, /tests\//i, /spec\//i, /specs\//i,
      /\.test$/i, /\.spec$/i, /mock/i, /fixture/i
    ];
    
    return testPatterns.some(pattern => pattern.test(filePath));
  }

  isClientSideFile(filePath, sourceFile) {
    // API routes are server-side even in frontend projects
    if (/\/api\/.*\/route\./i.test(filePath)) {
      return false;
    }

    if (this.verbose) {
      console.log(`[DEBUG] 🔍 Checking client-side for: ${filePath}`);
    }
    
    const hasUseClient = sourceFile.getFullText().includes("'use client'") || 
                        sourceFile.getFullText().includes('"use client"');
    
    const isReactComponent = /component/i.test(filePath) || 
                            /\.tsx?$/.test(filePath) && sourceFile.getFullText().includes('React');
    
    const clientSidePaths = [
      /\/components\//i, /\/pages\//i, 
      /\/hooks\//i, /\/context\//i, /\/providers\//i
    ];
    
    const serverSidePatterns = [
      /\/api\//i, /\/server\//i, /\/backend\//i,
      /\/utils\/.*(?:server|api|request)/i,
      /\/lib\/.*(?:thunk|api|server)/i, 
      /middleware\./i, /route\./i
    ];
    
    const isServerSide = serverSidePatterns.some(pattern => pattern.test(filePath));
    const isClientPath = clientSidePaths.some(pattern => pattern.test(filePath));
    
    if (this.verbose) {
      console.log(`[DEBUG] 📊 Analysis for ${filePath}:`);
      console.log(`[DEBUG]   - hasUseClient: ${hasUseClient}`);
      console.log(`[DEBUG]   - isReactComponent: ${isReactComponent}`);
      console.log(`[DEBUG]   - isServerSide: ${isServerSide}`);
      console.log(`[DEBUG]   - isClientPath: ${isClientPath}`);
    }
    
    if (isServerSide) {
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Keeping server-side file: ${filePath}`);
      }
      return false;
    }
    
    const shouldExclude = hasUseClient || (isReactComponent && isClientPath);
    
    if (this.verbose) {
      console.log(`[DEBUG] ${shouldExclude ? '❌ Excluding' : '✅ Keeping'} file: ${filePath}`);
    }
    
    return shouldExclude;
  }

  classifyFileLayer(filePath, sourceFile) {
    const lowerPath = filePath.toLowerCase();
    const fileContent = sourceFile.getFullText().toLowerCase();
    
    for (const [layer, patterns] of Object.entries(this.config.layerClassifier)) {
      if (patterns.some(pattern => 
        lowerPath.includes(pattern) || fileContent.includes(pattern)
      )) {
        return layer;
      }
    }
    
    return 'unknown';
  }

  // ===== LOG DETECTION =====

  findLogCalls(sourceFile) {
    const logCalls = [];
    
    const traverse = (node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node;
        const logInfo = this.extractLogInfo(callExpr, sourceFile);
        
        if (logInfo) {
          logCalls.push({
            node: callExpr,
            level: logInfo.level,
            message: logInfo.message,
            fullCall: logInfo.fullCall,
            position: sourceFile.getLineAndColumnAtPos(callExpr.getStart()),
            surroundingCode: this.getSurroundingCode(callExpr, sourceFile)
          });
        }
      }

      node.forEachChild(child => traverse(child));
    };

    traverse(sourceFile);
    return logCalls;
  }

  extractLogInfo(callExpr, sourceFile) {
    const callText = callExpr.getText();
    
    const logPatterns = [
      { pattern: /(?:console|logger|log|winston|bunyan|pino)\.error\(/i, level: 'error' },
      { pattern: /(?:console|logger|log|winston|bunyan|pino)\.warn\(/i, level: 'warn' },
      { pattern: /(?:console|logger|log|winston|bunyan|pino)\.info\(/i, level: 'info' },
      { pattern: /(?:console|logger|log|winston|bunyan|pino)\.debug\(/i, level: 'debug' },
      { pattern: /Log\.e\(/i, level: 'error' },
      { pattern: /Timber\.e\(/i, level: 'error' },
      { pattern: /\.logError\(/i, level: 'error' },
      { pattern: /\.logWarn\(/i, level: 'warn' },
      { pattern: /\.logInfo\(/i, level: 'info' }
    ];
    
    for (const { pattern, level } of logPatterns) {
      if (pattern.test(callText)) {
        return {
          level,
          fullCall: callText,
          message: this.extractLogMessage(callExpr)
        };
      }
    }
    
    return null;
  }

  extractLogMessage(callExpr) {
    const args = callExpr.getArguments();
    if (args.length === 0) return '';
    
    const firstArg = args[0];
    
    if (firstArg.getKind() === SyntaxKind.StringLiteral) {
      return firstArg.getLiteralText();
    }
    
    if (firstArg.getKind() === SyntaxKind.TemplateExpression) {
      return firstArg.getText();
    }
    
    return firstArg.getText();
  }

  getSurroundingCode(node, sourceFile) {
    const startPos = Math.max(0, node.getStart() - 150);
    const endPos = Math.min(sourceFile.getFullText().length, node.getEnd() + 150);
    return sourceFile.getFullText().slice(startPos, endPos);
  }

  findHttpStatusReturns(sourceFile) {
    const httpReturns = [];
    
    const traverse = (node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node;
        const callText = callExpr.getText();
        
        // Next.js patterns
        const nextJsMatch = callText.match(/NextResponse\.json\([^,]*,\s*{\s*status:\s*(\d+)/i);
        if (nextJsMatch) {
          httpReturns.push({
            node: callExpr,
            status: nextJsMatch[1],
            type: 'NextResponse',
            position: sourceFile.getLineAndColumnAtPos(callExpr.getStart()),
            surroundingCode: this.getSurroundingCode(callExpr, sourceFile)
          });
        }

        // Express patterns
        const expressMatch = callText.match(/\.status\((\d+)\)/i);
        if (expressMatch) {
          httpReturns.push({
            node: callExpr,
            status: expressMatch[1], 
            type: 'Express',
            position: sourceFile.getLineAndColumnAtPos(callExpr.getStart()),
            surroundingCode: this.getSurroundingCode(callExpr, sourceFile)
          });
        }
      }

      node.forEachChild(child => traverse(child));
    };

    traverse(sourceFile);
    return httpReturns;
  }

  findRetryPatterns(sourceFile) {
    const retryPatterns = [];
    const fileText = sourceFile.getFullText();
    
    const retryIndicators = [
      'retry', 'attempt', 'backoff', 'maxRetries', 'retryCount',
      'maxAttempts', 'attemptCount', 'retryable', 'canRetry'
    ];
    
    const hasRetryPattern = retryIndicators.some(indicator =>
      new RegExp(indicator, 'i').test(fileText)
    );
    
    if (hasRetryPattern) {
      const traverse = (node) => {
        if (node.getKind() === SyntaxKind.ForStatement || 
            node.getKind() === SyntaxKind.WhileStatement) {
          
          const loopText = node.getText();
          const isRetryLoop = retryIndicators.some(indicator =>
            new RegExp(indicator, 'i').test(loopText)
          );
          
          if (isRetryLoop) {
            retryPatterns.push({
              node: node,
              type: 'retry_loop',
              position: sourceFile.getLineAndColumnAtPos(node.getStart()),
              surroundingCode: this.getSurroundingCode(node, sourceFile)
            });
          }
        }

        node.forEachChild(child => traverse(child));
      };

      traverse(sourceFile);
    }
    
    return retryPatterns;
  }

  // ===== PHASE 1: REQUIRED LOGS & WRONG LEVELS =====

  analyzeRequiredLogs(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls, httpReturns, retryPatterns } = patterns;

    // Rule 1: HTTP 5xx at boundary must have error log
    if (layer === 'controller') {
      const http5xxReturns = httpReturns.filter(ret => 
        ret.status.startsWith('5')
      );
      
      for (const http5xx of http5xxReturns) {
        const hasNearbyErrorLog = this.hasNearbyLog(http5xx, logCalls, 'error', 5);
        
        if (!hasNearbyErrorLog) {
          violations.push({
            ruleId: 'C019',
            type: 'missing_required_log',
            message: this.config.requiredLogEvents.http_5xx_boundary.message,
            filePath: filePath,
            line: http5xx.position.line,
            column: http5xx.position.column,
            severity: 'warning',
            category: 'logging',
            confidence: this.config.requiredLogEvents.http_5xx_boundary.confidence,
            suggestion: this.config.requiredLogEvents.http_5xx_boundary.suggestion,
            context: {
              eventType: 'http_5xx_boundary',
              layer: layer,
              statusCode: http5xx.status
            }
          });
        }
      }
    }

    // Rule 2: Retry exhausted must have error log
    for (const retryPattern of retryPatterns) {
      const hasExhaustedErrorLog = this.hasRetryExhaustedLog(retryPattern, logCalls);
      
      if (!hasExhaustedErrorLog) {
        violations.push({
          ruleId: 'C019',
          type: 'missing_required_log',
          message: this.config.requiredLogEvents.retry_exhausted.message,
          filePath: filePath,
          line: retryPattern.position.line,
          column: retryPattern.position.column,
          severity: 'warning',
          category: 'logging',
          confidence: this.config.requiredLogEvents.retry_exhausted.confidence,
          suggestion: this.config.requiredLogEvents.retry_exhausted.suggestion,
          context: {
            eventType: 'retry_exhausted',
            layer: layer
          }
        });
      }
    }

    return violations;
  }

  analyzeWrongLevelUsage(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls, httpReturns } = patterns;

    for (const logCall of logCalls) {
      if (logCall.level !== 'error') continue;

      // Skip error logs in catch blocks (legitimate exceptions)
      if (this.isInCatchBlock(logCall.node)) {
        continue;
      }

      // Rule 1: 4xx validation should not be error
      const nearby4xx = this.findNearbyHttpStatus(logCall, httpReturns, '4');
      if (nearby4xx && this.isMissingDataValidation(logCall)) {
        violations.push({
          ruleId: 'C019',
          type: 'wrong_log_level',
          message: this.config.wrongLevelPatterns.missing_data_error.message,
          filePath: filePath,
          line: logCall.position.line,
          column: logCall.position.column,
          severity: 'warning',
          category: 'logging',
          confidence: this.config.wrongLevelPatterns.missing_data_error.confidence,
          suggestion: this.config.wrongLevelPatterns.missing_data_error.suggestion,
          context: {
            currentLevel: 'error',
            suggestedLevel: this.config.wrongLevelPatterns.missing_data_error.expectedLevel,
            eventType: 'missing_data_validation',
            statusCode: nearby4xx.status
          }
        });
      }

      // Rule 2: Retry attempts should not be error
      if (this.isRetryAttemptLog(logCall)) {
        violations.push({
          ruleId: 'C019',
          type: 'wrong_log_level',
          message: this.config.wrongLevelPatterns.retry_attempt_error.message,
          filePath: filePath,
          line: logCall.position.line,
          column: logCall.position.column,
          severity: 'warning',
          category: 'logging',
          confidence: this.config.wrongLevelPatterns.retry_attempt_error.confidence,
          suggestion: this.config.wrongLevelPatterns.retry_attempt_error.suggestion,
          context: {
            currentLevel: 'error',
            suggestedLevel: this.config.wrongLevelPatterns.retry_attempt_error.expectedLevel,
            eventType: 'retry_attempt'
          }
        });
      }
    }

    return violations;
  }

  // ===== PHASE 2: OVERUSED & MISSING LOGS =====

  analyzeOverusedLogs(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls } = patterns;

    // Group logs by function/method
    const functionLogs = this.groupLogsByFunction(sourceFile, logCalls);
    
    // Check for hot path over-logging
    for (const [funcNode, logs] of functionLogs) {
      if (logs.length > this.config.overusedLogPatterns.hot_path_over_logging.threshold) {
        const funcName = this.getFunctionName(funcNode);
        
        violations.push({
          ruleId: 'C019',
          type: 'overused_logs',
          message: this.config.overusedLogPatterns.hot_path_over_logging.message,
          filePath: filePath,
          line: logs[0].position.line,
          column: logs[0].position.column,
          severity: 'info',
          category: 'performance',
          confidence: this.config.overusedLogPatterns.hot_path_over_logging.confidence,
          suggestion: this.config.overusedLogPatterns.hot_path_over_logging.suggestion,
          context: {
            functionName: funcName,
            logCount: logs.length,
            threshold: this.config.overusedLogPatterns.hot_path_over_logging.threshold,
            eventType: 'hot_path_over_logging'
          }
        });
      }
    }

    // Check for loop over-logging
    const loopLogs = this.findLogsInLoops(sourceFile, logCalls);
    for (const loopLog of loopLogs) {
      violations.push({
        ruleId: 'C019',
        type: 'overused_logs',
        message: this.config.overusedLogPatterns.loop_over_logging.message,
        filePath: filePath,
        line: loopLog.position.line,
        column: loopLog.position.column,
        severity: 'warning',
        category: 'performance',
        confidence: this.config.overusedLogPatterns.loop_over_logging.confidence,
        suggestion: this.config.overusedLogPatterns.loop_over_logging.suggestion,
        context: {
          eventType: 'loop_over_logging',
          loopType: loopLog.loopType
        }
      });
    }

    return violations;
  }

  analyzeMissingCriticalLogs(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls, httpReturns } = patterns;

    // Check for authentication failures without logs
    const authFailures = this.findAuthFailures(sourceFile, httpReturns);
    for (const authFailure of authFailures) {
      const hasNearbyLog = this.hasNearbyLog(authFailure, logCalls, ['warn', 'error'], 5);
      
      if (!hasNearbyLog) {
        violations.push({
          ruleId: 'C019',
          type: 'missing_critical_log',
          message: this.config.missingLogPatterns.auth_failure_silent.message,
          filePath: filePath,
          line: authFailure.position.line,
          column: authFailure.position.column,
          severity: 'warning',
          category: 'security',
          confidence: this.config.missingLogPatterns.auth_failure_silent.confidence,
          suggestion: this.config.missingLogPatterns.auth_failure_silent.suggestion,
          context: {
            eventType: 'auth_failure_silent',
            statusCode: authFailure.status
          }
        });
      }
    }

    // Check for payment transactions without logs
    const paymentEvents = this.findPaymentEvents(sourceFile);
    for (const paymentEvent of paymentEvents) {
      const hasNearbyLog = this.hasNearbyLog(paymentEvent, logCalls, ['info', 'warn', 'error'], 10);
      
      if (!hasNearbyLog) {
        violations.push({
          ruleId: 'C019',
          type: 'missing_critical_log',
          message: this.config.missingLogPatterns.payment_transaction_silent.message,
          filePath: filePath,
          line: paymentEvent.position.line,
          column: paymentEvent.position.column,
          severity: 'warning',
          category: 'audit',
          confidence: this.config.missingLogPatterns.payment_transaction_silent.confidence,
          suggestion: this.config.missingLogPatterns.payment_transaction_silent.suggestion,
          context: {
            eventType: 'payment_transaction_silent',
            operation: paymentEvent.operation
          }
        });
      }
    }

    return violations;
  }

  analyzeLogRedundancy(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls } = patterns;

    // Find duplicate log patterns
    for (let i = 0; i < logCalls.length; i++) {
      for (let j = i + 1; j < logCalls.length; j++) {
        const log1 = logCalls[i];
        const log2 = logCalls[j];
        
        if (this.isDuplicateLogViolation(log1, log2, this.config.redundancyPatterns.duplicate_log_events.maxDistance)) {
          const distance = Math.abs(log1.position.line - log2.position.line);
          const similarity = this.calculateLogSimilarity(log1.message, log2.message);
          
          violations.push({
            ruleId: 'C019',
            type: 'redundant_logs',
            message: this.config.redundancyPatterns.duplicate_log_events.message,
            filePath: filePath,
            line: log2.position.line,
            column: log2.position.column,
            severity: 'info',
            category: 'maintainability',
            confidence: this.config.redundancyPatterns.duplicate_log_events.confidence,
            suggestion: this.config.redundancyPatterns.duplicate_log_events.suggestion,
            context: {
              eventType: 'duplicate_log_events',
              firstLogLine: log1.position.line,
              secondLogLine: log2.position.line,
              similarity: Math.round(similarity * 100),
              distance: distance
            }
          });
        }
      }
    }

    return violations;
  }

  // ===== PHASE 3: ESSENTIAL DISTRIBUTED LOGGING =====

  analyzeDistributedPatterns(filePath, sourceFile, layer, patterns) {
    const violations = [];
    const { logCalls, httpReturns } = patterns;

    // Check for centralized logging first
    const hasCentralizedLogging = this.hasProjectCentralizedLogging(sourceFile, filePath);
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 Centralized logging detected: ${hasCentralizedLogging} for ${filePath.split('/').pop()}`);
    }

    // Skip external call logging check if centralized logging is detected
    if (hasCentralizedLogging) {
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Skipping external call logging check - centralized logging detected`);
      }
      return violations;
    }

    // Check for silent external calls only if no centralized logging
    const externalCalls = this.findExternalServiceCalls(sourceFile);
    for (const extCall of externalCalls) {
      const hasNearbyLog = this.hasNearbyLog(extCall, logCalls, ['info', 'warn', 'error'], 5);
      
      if (!hasNearbyLog) {
        violations.push({
          ruleId: 'C019',
          type: 'distributed_gap',
          message: this.config.distributedPatterns.external_call_silent.message,
          filePath: filePath,
          line: extCall.position.line,
          column: extCall.position.column,
          severity: 'warning',
          category: 'monitoring',
          confidence: this.config.distributedPatterns.external_call_silent.confidence,
          suggestion: this.config.distributedPatterns.external_call_silent.suggestion,
          context: {
            eventType: 'external_call_silent',
            serviceUrl: extCall.url,
            method: extCall.method
          }
        });
      }
    }

    return violations;
  }

  // ===== HELPER METHODS =====

  groupLogsByFunction(sourceFile, logCalls) {
    const functionLogs = new Map();
    
    for (const logCall of logCalls) {
      const funcNode = this.findContainingFunction(logCall.node);
      if (funcNode) {
        if (!functionLogs.has(funcNode)) {
          functionLogs.set(funcNode, []);
        }
        functionLogs.get(funcNode).push(logCall);
      }
    }
    
    return functionLogs;
  }

  findContainingFunction(node) {
    let current = node.getParent();
    
    while (current) {
      const kind = current.getKind();
      if (kind === SyntaxKind.FunctionDeclaration ||
          kind === SyntaxKind.MethodDeclaration ||
          kind === SyntaxKind.ArrowFunction ||
          kind === SyntaxKind.FunctionExpression) {
        return current;
      }
      current = current.getParent();
    }
    
    return null;
  }

  getFunctionName(funcNode) {
    if (!funcNode) return 'anonymous';
    
    const kind = funcNode.getKind();
    
    if (kind === SyntaxKind.FunctionDeclaration || kind === SyntaxKind.MethodDeclaration) {
      const nameNode = funcNode.getNameNode();
      return nameNode ? nameNode.getText() : 'anonymous';
    }
    
    if (kind === SyntaxKind.ArrowFunction || kind === SyntaxKind.FunctionExpression) {
      const parent = funcNode.getParent();
      if (parent && parent.getKind() === SyntaxKind.VariableDeclaration) {
        const nameNode = parent.getNameNode();
        return nameNode ? nameNode.getText() : 'anonymous';
      }
      
      if (parent && parent.getKind() === SyntaxKind.PropertyAssignment) {
        const propName = parent.getNameNode();
        return propName ? propName.getText() : 'anonymous';
      }
      
      if (parent && parent.getKind() === SyntaxKind.BinaryExpression) {
        const left = parent.getLeft();
        if (left && left.getKind() === SyntaxKind.PropertyAccessExpression) {
          const prop = left.getNameNode();
          return prop ? prop.getText() : 'anonymous';
        }
      }
      
      return 'anonymous';
    }
    
    return 'anonymous';
  }

  findLogsInLoops(sourceFile, logCalls) {
    const loopLogs = [];
    
    for (const logCall of logCalls) {
      let current = logCall.node.getParent();
      
      while (current) {
        const kind = current.getKind();
        if (kind === SyntaxKind.ForStatement ||
            kind === SyntaxKind.WhileStatement ||
            kind === SyntaxKind.DoStatement ||
            kind === SyntaxKind.ForInStatement ||
            kind === SyntaxKind.ForOfStatement) {
          
          loopLogs.push({
            ...logCall,
            loopType: this.getLoopTypeName(kind)
          });
          break;
        }
        current = current.getParent();
      }
    }
    
    return loopLogs;
  }

  getLoopTypeName(kind) {
    switch (kind) {
      case SyntaxKind.ForStatement: return 'for';
      case SyntaxKind.WhileStatement: return 'while';
      case SyntaxKind.DoStatement: return 'do-while';
      case SyntaxKind.ForInStatement: return 'for-in';
      case SyntaxKind.ForOfStatement: return 'for-of';
      default: return 'unknown';
    }
  }

  findAuthFailures(sourceFile, httpReturns) {
    return httpReturns.filter(ret => 
      ret.status === '401' || ret.status === '403'
    );
  }

  findPaymentEvents(sourceFile) {
    const paymentEvents = [];
    const fileText = sourceFile.getFullText().toLowerCase();
    
    // Skip Redux slices and frontend state management
    if (fileText.includes('createslice') || fileText.includes('createappslice') || 
        fileText.includes('extrareducers') || fileText.includes('state.')) {
      if (this.verbose) {
        console.log(`[DEBUG] 💰 Skipping payment detection - Redux slice detected`);
      }
      return paymentEvents;
    }
    
    const paymentPatterns = [
      'payment', 'transaction', 'charge', 'refund', 'billing',
      'invoice', 'subscription', 'purchase', 'checkout'
    ];
    
    const hasPaymentPattern = paymentPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(fileText)
    );
    
    if (hasPaymentPattern) {
      const traverse = (node) => {
        if (node.getKind() === SyntaxKind.CallExpression) {
          const callText = node.getText().toLowerCase();
          
          // Only detect actual payment processing calls, not UI calculations
          const paymentActionPatterns = [
            /payment.*(?:process|execute|submit|create|confirm)/i,
            /transaction.*(?:process|execute|submit|create|confirm)/i,
            /charge.*(?:process|execute|submit|create)/i,
            /refund.*(?:process|execute|submit|create)/i,
            /purchase.*(?:process|execute|submit|create|complete)/i,
            /checkout.*(?:process|execute|submit|complete)/i
          ];
          
          if (paymentActionPatterns.some(pattern => pattern.test(callText))) {
            paymentEvents.push({
              node: node,
              operation: callText,
              position: sourceFile.getLineAndColumnAtPos(node.getStart())
            });
          }
        }

        node.forEachChild(child => traverse(child));
      };

      traverse(sourceFile);
    }
    
    return paymentEvents;
  }

  findExternalServiceCalls(sourceFile) {
    const externalCalls = [];
    
    const traverse = (node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callText = node.getText();
        
        // Exclude common false positives first
        const excludePatterns = [
          // Config service calls (not external)
          /configService\.get/i,
          /process\.env\./i,
          /config\.get/i,
          
          // Local library operations (not external services)
          /jwt\.(?:verify|sign|decode)/i,
          /bcrypt\.(?:hash|compare)/i,
          /crypto\.(?:createHash|randomBytes)/i,
          
          // Database ORM operations (not external service calls)
          /(?:repository|entity|model)\.(?:find|save|update|delete)/i,
          /queryBuilder\./i,
          
          // Internal service dependencies (NestJS/DI pattern)
          /this\.[\w]+Service\./i,
          /this\.[\w]+Repository\./i,
          /this\.[\w]+Manager\./i,
          /this\.[\w]+Client\.(?!http|fetch|post|get)/i,
          
          // Specific service calls that are internal
          /this\.service\./i,
          /this\.commonCustomerService\./i,
          /[\w]+Service\.get[\w]+/i,
          
          // Cache operations (not external)
          /cacheManager\./i,
          /redis\.(?:get|set|del)/i,
          
          // Local file/path operations
          /path\.(?:join|resolve)/i,
          /fs\.(?:readFile|writeFile)/i,
          /__dirname|__filename/i
        ];
        
        const isExcluded = excludePatterns.some(pattern => pattern.test(callText));
        if (isExcluded) {
          return;
        }
        
        // More specific patterns for REAL external service calls
        const realExternalPatterns = [
          // HTTP calls with URLs
          /(?:fetch|axios|http).*https?:\/\//i,
          // API service calls
          /(?:api|service|client)\.(?:get|post|put|delete|call|request)/i,
          // Third-party service integrations
          /(?:stripe|paypal|payment|billing)\.(?:charge|process|create)/i,
          /(?:twilio|sendgrid|mailgun)\.(?:send|create)/i,
          /(?:aws|gcp|azure)\.(?:upload|send|publish)/i,
          // External auth providers
          /(?:google|facebook|auth0)\.(?:verify|authenticate)/i
        ];
        
        const isRealExternal = realExternalPatterns.some(pattern => pattern.test(callText));
        
        if (isRealExternal) {
          externalCalls.push({
            node: node,
            url: this.extractUrl(callText),
            method: this.extractHttpMethod(callText),
            position: sourceFile.getLineAndColumnAtPos(node.getStart())
          });
        }
      }

      node.forEachChild(child => traverse(child));
    };

    traverse(sourceFile);
    return externalCalls;
  }

  extractUrl(callText) {
    const urlMatch = callText.match(/['"`]([^'"`]*(?:api|http)[^'"`]*)['"`]/i);
    return urlMatch ? urlMatch[1] : 'unknown';
  }

  extractHttpMethod(callText) {
    const methodPatterns = ['get', 'post', 'put', 'delete', 'patch'];
    for (const method of methodPatterns) {
      if (new RegExp(`\\.${method}\\s*\\(`, 'i').test(callText)) {
        return method.toUpperCase();
      }
    }
    return 'UNKNOWN';
  }

  hasNearbyLog(targetNode, logCalls, levels, maxDistance = 10) {
    const targetLine = targetNode.position.line;
    
    return logCalls.some(logCall => {
      const logLine = logCall.position.line;
      const distance = Math.abs(targetLine - logLine);
      const levelMatch = Array.isArray(levels) ? levels.includes(logCall.level) : logCall.level === levels;
      return levelMatch && distance <= maxDistance;
    });
  }

  hasProjectCentralizedLogging(sourceFile, filePath) {
    const text = sourceFile.getFullText();
    
    // Check for centralized logging patterns in the file
    const centralizedLoggingPatterns = [
      // Error handling with built-in logging
      /handleAxiosErrorWithModal/i,
      /handleError.*Modal/i,
      /interceptors\.response\.use/i,
      /interceptors\.request\.use/i,
      
      // Global error handlers
      /globalErrorHandler/i,
      /global.*error.*handler/i,
      /centralized.*error/i,
      /error.*interceptor/i,
      
      // API services with built-in logging
      /apiService/i,
      /service\..*error/i,
      /\.catch\(\s*handleError/i,
      
      // Redux/Thunk error handlers with logging
      /rejectWithValue/i,
      /\.unwrap\(\)/i,
      
      // Logger imports/usage indicating centralized approach
      /import.*logger.*from/i,
      /const.*logger.*=.*require/i,
      /logger\.error/i,
      /logger\.warn/i,
      
      // Try-catch with error handling that includes logging
      /catch\s*\([^)]*\)\s*\{[^}]*(?:console\.error|logger\.error|handleError)[^}]*\}/s
    ];
    
    const hasCentralizedPattern = centralizedLoggingPatterns.some(pattern => pattern.test(text));
    
    // Additional check: if it's a thunk file, check for Redux error patterns
    if (filePath.includes('thunk') || filePath.includes('Thunk')) {
      const reduxErrorPatterns = [
        /rejectWithValue/i,
        /extraReducers/i,
        /\.rejected/i,
        /handleError/i,
        /errorHandler/i
      ];
      
      const hasReduxErrorHandling = reduxErrorPatterns.some(pattern => pattern.test(text));
      if (hasReduxErrorHandling && this.verbose) {
        console.log(`[DEBUG] 🔄 Redux error handling patterns detected in thunk file`);
      }
      
      return hasCentralizedPattern || hasReduxErrorHandling;
    }
    
    return hasCentralizedPattern;
  }

  findNearbyHttpStatus(logCall, httpReturns, statusPrefix) {
    const logLine = logCall.position.line;
    
    return httpReturns.find(httpReturn => {
      const distance = Math.abs(logLine - httpReturn.position.line);
      return httpReturn.status.startsWith(statusPrefix) && distance <= 10;
    });
  }

  hasRetryExhaustedLog(retryPattern, logCalls) {
    const retryText = retryPattern.surroundingCode.toLowerCase();
    
    const exhaustedPatterns = [
      'exhausted', 'failed', 'max.*attempt', 'max.*retr',
      'give.*up', 'no.*more', 'final.*attempt'
    ];
    
    return logCalls.some(logCall => {
      if (logCall.level !== 'error') return false;
      
      const logText = logCall.surroundingCode.toLowerCase();
      return exhaustedPatterns.some(pattern =>
        new RegExp(pattern, 'i').test(logText)
      );
    });
  }

  isInCatchBlock(node) {
    let current = node.getParent();
    
    while (current) {
      if (current.getKind() === SyntaxKind.CatchClause) {
        return true;
      }
      current = current.getParent();
    }
    
    return false;
  }

  isMissingDataValidation(logCall) {
    const message = logCall.message.toLowerCase();
    const surroundingCode = logCall.surroundingCode.toLowerCase();
    
    const missingDataPatterns = [
      'missing', 'not.*found', 'empty', 'null', 'undefined',
      'required', 'invalid.*format', 'invalid.*input'
    ];
    
    return missingDataPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(message + ' ' + surroundingCode)
    );
  }

  isRetryAttemptLog(logCall) {
    const message = logCall.message.toLowerCase();
    const surroundingCode = logCall.surroundingCode.toLowerCase();
    const combinedText = message + ' ' + surroundingCode;
    
    const retryAttemptPatterns = [
      /attempt\s*\d+.*fail/i,
      /retry\s*\d+.*fail/i, 
      /try\s*\d+.*fail/i,
      /retrying.*\(\s*\d+\s*\/\s*\d+\s*\)/i,
      /attempt.*\(\s*\d+\s*\/\s*\d+\s*\)/i
    ];
    
    const hasRetryPattern = retryAttemptPatterns.some(pattern =>
      pattern.test(combinedText)
    );
    
    const isExhausted = /exhausted|final|last|max|all.*attempts|no.*more|after.*retries/i.test(combinedText);
    
    return hasRetryPattern && !isExhausted;
  }

  isDuplicateLogViolation(log1, log2, maxDistance) {
    // Skip if either log is in a utility function
    const log1Function = this.findContainingFunction(log1.node);
    const log2Function = this.findContainingFunction(log2.node);
    
    const isLog1Utility = this.isUtilityFunction(log1Function);
    const isLog2Utility = this.isUtilityFunction(log2Function);
    
    if (this.verbose) {
      console.log(`[DEBUG] 🔧 Checking duplicate logs at lines ${log1.position.line} and ${log2.position.line}`);
      console.log(`[DEBUG] 🔧 Log1 function: ${this.getFunctionName(log1Function) || 'unknown'}, utility: ${isLog1Utility}`);
      console.log(`[DEBUG] 🔧 Log2 function: ${this.getFunctionName(log2Function) || 'unknown'}, utility: ${isLog2Utility}`);
    }
    
    if (isLog1Utility || isLog2Utility) {
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Skipping duplicate log check - utility function detected`);
      }
      return false;
    }

    // Skip if logs are in different functions (legitimate error handling)
    if (log1Function !== log2Function) {
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Skipping duplicate log check - different functions`);
      }
      return false;
    }

    const distance = Math.abs(log1.position.line - log2.position.line);
    if (distance > maxDistance) {
      return false;
    }

    // Check if they are error handling logs (legitimate duplicates)
    const isErrorHandling = log1.level === 'error' || log2.level === 'error' || 
                           log1.message.toLowerCase().includes('error') ||
                           log2.message.toLowerCase().includes('error') ||
                           log1.surroundingCode.includes('catch') ||
                           log2.surroundingCode.includes('catch');
    
    if (isErrorHandling && distance > 3) {
      if (this.verbose) {
        console.log(`[DEBUG] ✅ Skipping duplicate log check - error handling context`);
      }
      return false;
    }
    
    // Check message similarity
    const similarity = this.calculateLogSimilarity(log1.message, log2.message);
    return similarity > 0.8; // 80% similar
  }

  isUtilityFunction(functionNode) {
    if (!functionNode) return false;
    
    const functionName = this.getFunctionName(functionNode);
    if (!functionName) return false;
    
    const utilityPatterns = [
      /^write/, /^log/, /^handle/, /^process/, /^format/,
      /helper/, /util/, /wrapper/, /middleware/
    ];
    
    return utilityPatterns.some(pattern => pattern.test(functionName.toLowerCase()));
  }

  calculateLogSimilarity(message1, message2) {
    if (!message1 || !message2) return 0;
    
    const clean1 = message1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const clean2 = message2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    if (clean1 === clean2) return 1;
    
    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
}

module.exports = C019SystemLogAnalyzer;
