/**
 * C035 Regex-based Analyzer - Basic Error Logging Context Detection
 * Purpose: Fallback pattern matching when symbol analysis fails
 */

class C035RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = 'C035';
    this.ruleName = 'Error Logging Context Analysis (Regex-Based)';
    this.semanticEngine = semanticEngine;
    this.verbose = false;
    
    // Patterns for identifying catch blocks (supports TypeScript type annotations)
    this.catchPattern = /catch\s*\(\s*(\w+)(?:\s*:\s*\w+(?:\s*\|\s*\w+)*)?\s*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
    this.logPatterns = [
      /console\.(log|error|warn|info)\s*\(/g,
      /logger\.(log|error|warn|info|debug)\s*\(/g,
      /log\.(error|warn|info|debug)\s*\(/g
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
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;
    
    if (this.verbose) {
      console.log(`🔧 [C035 Regex-Based] Analyzer initialized`);
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    const fs = require('fs');
    const path = require('path');
    const violations = [];

    if (this.verbose) {
      console.log(`🔧 [C035 Regex] Starting analysis for: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (this.verbose) {
        console.log(`🔧 [C035 Regex] File content length: ${content.length}`);
      }
      
      const lines = content.split('\n');
      const catchBlocks = this.findCatchBlocks(content);
      
      if (this.verbose) {
        console.log(`🔧 [C035 Regex] Found ${catchBlocks.length} catch blocks`);
      }

      for (const block of catchBlocks) {
        const blockViolations = this.analyzeCatchBlockContent(block, lines, filePath);
        if (this.verbose && blockViolations.length > 0) {
          console.log(`🔧 [C035 Regex] Block violations: ${blockViolations.length}`);
        }
        violations.push(...blockViolations);
      }

      if (this.verbose) {
        console.log(`🔧 [C035 Regex] Total violations found: ${violations.length}`);
      }
      
      return violations;
    } catch (error) {
      if (this.verbose) {
        console.error(`🔧 [C035 Regex] Error analyzing ${filePath}:`, error);
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
    const logCalls = this.findLogCallsInContent(blockContent);
    
    if (logCalls.length === 0) {
      // No logging - C029's concern, not ours
      return violations;
    }
    
    // Analyze each log call
    for (const logCall of logCalls) {
      const logLineNumber = lineNumber + logCall.relativeLineNumber;
      
      // Check for non-structured logging (string concatenation)
      if (this.hasStringConcatenation(logCall.content)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Error logging should use structured format instead of string concatenation',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: logCall.column,
          description: `[REGEX-FALLBACK] String concatenation detected in error logging. Use structured object format.`,
          suggestion: 'Use logger.error("message", { error: e.message, context: {...} }) instead of string concatenation',
          category: 'logging'
        });
      }
      
      // Check for sensitive data
      const sensitiveData = this.findSensitiveData(logCall.content);
      if (sensitiveData.length > 0) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Error logging contains potentially sensitive data',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: logCall.column,
          description: `[REGEX-FALLBACK] Sensitive patterns detected: ${sensitiveData.join(', ')}. Mask or exclude sensitive data.`,
          suggestion: 'Mask sensitive data or exclude entirely from logs',
          category: 'security'
        });
      }
      
      // Basic context check (limited in regex mode)
      if (!this.hasBasicContext(logCall.content, errorVar)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: 'Error logging appears to miss important context information',
          source: this.ruleId,
          file: filePath,
          line: logLineNumber,
          column: logCall.column,
          description: `[REGEX-FALLBACK] Basic context validation suggests missing error details or identifiers.`,
          suggestion: 'Include error message, identifiers (requestId, userId), and operation context',
          category: 'logging'
        });
      }
    }
    
    return violations;
  }

  /**
   * Find log calls within catch block content
   */
  findLogCallsInContent(content) {
    const logCalls = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of this.logPatterns) {
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(line);
        
        if (match) {
          logCalls.push({
            content: line.trim(),
            relativeLineNumber: i,
            column: match.index + 1,
            method: match[1] || 'unknown'
          });
        }
      }
    }
    
    return logCalls;
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

  /**
   * Basic context validation (limited in regex mode)
   */
  hasBasicContext(content, errorVar) {
    const lowerContent = content.toLowerCase();
    
    // Check if error variable is used
    const hasError = lowerContent.includes(errorVar.toLowerCase());
    
    // Check for basic context indicators
    const contextIndicators = ['id', 'request', 'user', 'operation', 'method'];
    const hasContext = contextIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
    
    return hasError && hasContext;
  }

  async analyze(files, language, options = {}) {
    if (this.verbose) {
      console.log(`🔧 [C035 Regex] analyze() called with ${files.length} files, language: ${language}`);
    }
    
    const violations = [];
    
    for (const filePath of files) {
      try {
        if (this.verbose) {
          console.log(`🔧 [C035 Regex] Processing file: ${filePath}`);
        }
        
        const fileViolations = await this.analyzeFileBasic(filePath, options);
        violations.push(...fileViolations);
        
        if (this.verbose) {
          console.log(`🔧 [C035 Regex] File ${filePath}: Found ${fileViolations.length} violations`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`❌ [C035 Regex] Analysis failed for ${filePath}:`, error.message);
        }
      }
    }
    
    if (this.verbose) {
      console.log(`🔧 [C035 Regex] Total violations found: ${violations.length}`);
    }
    
    return violations;
  }
}

module.exports = C035RegexBasedAnalyzer;
