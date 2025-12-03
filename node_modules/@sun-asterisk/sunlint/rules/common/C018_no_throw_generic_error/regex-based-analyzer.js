/**
 * C018 Regex-based Analyzer - Do not throw generic errors
 * Purpose: Fallback pattern matching when symbol analysis fails
 */

class C018RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C018';
    this.ruleName = 'Do not throw generic errors (Regex-Based)';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Patterns for identifying catch blocks (supports TypeScript type annotations)
    this.catchPattern = /catch\s*\(\s*(\w+)(?:\s*:\s*\w+(?:\s*\|\s*\w+)*)?\s*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;

    // throw error patterns
    this.exceptionPatterns = [
      /throw\s+\w+/g,
    ];

    // Sensitive data patterns
    this.sensitivePatterns = [
      /password|passwd|pwd/gi,
      /token|jwt|auth|secret|key/gi,
      /ssn|social|credit|card|cvv/gi
    ];

    // String concatenation patterns (non-structured)
    this.stringConcatPatterns = [
      /\+\s*["'`]/g,  // string concatenation
      /["'`]\s*\+/g,  // string concatenation
      /\$\{.*\}/g     // template literals (basic)
    ];

    this.structuredPatterns = [
      /\{\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^}]+\}/g, // structured object format
    ]

    // Ensure error messages should explain what happened, why, and in what context
    this.explanationPatterns = [
      /\b(because|due to|failed to|cannot|invalid|missing|not found)\b/i,
    ];
    this.guidancePatterns = [
      /\b(please|ensure|make sure|check|try|use)\b/i,
    ];
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`🔧 [C018 Regex-Based] Analyzer initialized`);
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    const fs = require('fs');
    const path = require('path');
    const violations = [];

    if (this.verbose) {
      console.log(`🔧 [C018 Regex] Starting analysis for: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (this.verbose) {
        console.log(`🔧 [C018 Regex] File content length: ${content.length}`);
      }
      
      const lines = content.split('\n');
      const catchBlocks = this.findCatchBlocks(content);
      
      if (this.verbose) {
        console.log(`🔧 [C018 Regex] Found ${catchBlocks.length} catch blocks`);
      }

      for (const block of catchBlocks) {
        const blockViolations = this.analyzeCatchBlockContent(block, lines, filePath);
        if (this.verbose && blockViolations.length > 0) {
          console.log(`🔧 [C018 Regex] Block violations: ${blockViolations.length}`);
        }
        violations.push(...blockViolations);
      }

      if (this.verbose) {
        console.log(`🔧 [C018 Regex] Total violations found: ${violations.length}`);
      }
      
      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`🔧 [C018 Regex] Error analyzing ${filePath}:`, error);
      }
      return [];
    }
  }  /**
   * Find catch blocks in content using regex
   */
  findCatchBlocks(content) {
    const catchBlocks = [];
    let match;
    
    // Reset regex
    this.catchPattern.lastIndex = 0;
    
    while ((match = this.catchPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const errorVar = match[1];
      const blockContent = match[2];
      
      // Calculate line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      catchBlocks.push({
        fullMatch,
        errorVar,
        blockContent,
        lineNumber,
        startIndex: match.index
      });
    }
    
    return catchBlocks;
  }

  /**
   * Analyze catch block content for logging violations
   */
  analyzeCatchBlockContent(catchBlock, lines, filePath) {
    const violations = [];
    const { blockContent, lineNumber, errorVar } = catchBlock;
    
    // Find log calls in catch block
    const ErrorCalls = this.findExceptionCallsInContent(blockContent);
    
    if (ErrorCalls.length === 0) {
      // No logging - C018's concern, not ours
      return violations;
    }
    
    // Analyze each log call
    for (const errCall of ErrorCalls) {
      const logLineNumber = lineNumber + errCall.relativeLineNumber;
      // Check for generic error throws without context
      if (errCall.content.includes('new Error(')) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Throwing generic Error without context',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[REGEX-FALLBACK] Generic error thrown without context. Use structured error objects.`,
          suggestion: 'Use specific error types or structured error objects with context',
          category: 'error-handling'
        });
      }
      // Check for generic error direct ex: throw error
      if (errCall.content.includes(`throw ${errorVar}`)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Throwing caught error directly without context',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[REGEX-FALLBACK] Caught error thrown directly without additional context. Use structured error objects.`,
          suggestion: 'Use structured error objects with context instead of throwing caught errors directly',
          category: 'error-handling'
        });
      }


      // Check for non-structured logging (string concatenation)
      if (this.hasStringConcatenation(errCall.content)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Error logging should use structured format instead of string concatenation',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[REGEX-FALLBACK] String concatenation detected in error logging. Use structured object format.`,
          suggestion: 'Use logger.error("message", { error: e.message, context: {...} }) instead of string concatenation',
          category: 'error-handling'
        });
      }

      // Check for sensitive data
      const sensitiveData = this.findSensitiveData(errCall.content);
      if (sensitiveData.length > 0) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Error logging contains potentially sensitive data',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[REGEX-FALLBACK] Sensitive patterns detected: ${sensitiveData.join(', ')}. Mask or exclude sensitive data.`,
          suggestion: 'Mask sensitive data or exclude entirely from logs',
          category: 'security'
        });
      }

      // Check messages should explain what happened
      const explaintionData = this.findExplanationData(errCall.content);
      if (!explaintionData.length) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Error logging should explain what happened',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[SYMBOL-BASED] Error message should explain what happened, why, and in what context.`,
          suggestion: 'Use structured error objects with context: { message: "Error occurred", context: "Request failed because todo something." } }',
          category: 'error-handling'
        });
      }

      // Check messages should provide guidance
      const guidanceData = this.findGuidanceData(errCall.content);
      if (!guidanceData.length) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Error logging should provide guidance on next steps',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: errCall.column,
          description: `[SYMBOL-BASED] Error message should provide guidance on next steps.`,
          suggestion: 'Use structured error objects with guidance: { message: "Error occurred", guidance: "Please check the input and try again." } }',
          category: 'error-handling'
        });
      }
    }
    
    return violations;
  }

  /**
   * Find log calls within catch block content
   */
  findExceptionCallsInContent(content) {
    const ErrorCalls = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of this.exceptionPatterns) {
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(line);
        
        if (match) {
          ErrorCalls.push({
            content: line.trim(),
            relativeLineNumber: i,
            column: match.index + 1,
            method: match[1] || 'unknown'
          });
        }
      }
    }
    
    return ErrorCalls;
  }

  /**
   * Check if log call uses string concatenation
   */
  hasStringConcatenation(content) {
    return this.stringConcatPatterns.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(content);
    });
  }

  /**
   * Find sensitive data patterns in content
   */
  findSensitiveData(content) {
    const found = [];
    
    for (const pattern of this.sensitivePatterns) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) {
        found.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    return [...new Set(found)]; // Remove duplicates
  }

  // Validate structure patterns
  validateStructuredPatterns(content) {
    for (const pattern of this.structuredPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        return true; // Structured format found
      }
    }
    return false; // No structured format found
  }

  /**
   * Find explanation data patterns in content
   */
  findExplanationData(content) {
    const found = [];

    for (const pattern of this.explanationPatterns) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) {
        found.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(found)]; // Remove duplicates
  }

  /**
   * Find guidance data patterns in content
   */
  findGuidanceData(content) {
    const found = [];

    for (const pattern of this.guidancePatterns) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) {
        found.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(found)]; // Remove duplicates
  }

  async analyze(files, language, options = {}) {
    if (this.verbose) {
      console.log(`🔧 [C018 Regex] analyze() called with ${files.length} files, language: ${language}`);
    }
    
    const violations = [];
    
    for (const filePath of files) {
      try {
        if (this.verbose) {
          console.log(`🔧 [C018 Regex] Processing file: ${filePath}`);
        }
        
        const fileViolations = await this.analyzeFileBasic(filePath, options);
        violations.push(...fileViolations);
        
        if (this.verbose) {
          console.log(`🔧 [C018 Regex] File ${filePath}: Found ${fileViolations.length} violations`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`❌ [C018 Regex] Analysis failed for ${filePath}:`, error.message);
        }
      }
    }
    
    if (this.verbose) {
      console.log(`🔧 [C018 Regex] Total violations found: ${violations.length}`);
    }
    
    return violations;
  }
}

module.exports = C018RegexBasedAnalyzer;
