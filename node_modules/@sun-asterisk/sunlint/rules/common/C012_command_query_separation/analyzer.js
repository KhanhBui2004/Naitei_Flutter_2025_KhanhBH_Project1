/**
 * C012 Heuristic Analyzer - Command Query Separation
 * 
 * Uses regex and pattern matching to detect violations of CQS principle:
 * - Functions that both modify state and return meaningful values
 * - Methods that mix command and query operations
 * - Fallback for when AST parsing fails
 */

const fs = require('fs');
const path = require('path');

class C012Analyzer {
  constructor() {
    this.ruleId = 'C012';
    this.ruleName = 'Command Query Separation';
    this.description = 'Separate commands (modify state) from queries (return data)';
    this.severity = 'warning';
  }

  async analyze(files, language, config = {}) {
    const violations = [];
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(filePath, content, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`C012 analysis failed for ${filePath}:`, error.message);
      }
    }
    
    return violations;
  }

  async analyzeFile(filePath, content, language, config) {
    const violations = [];
    const lines = content.split('\n');
    
    // Skip non-supported files
    if (!this.isSupportedFile(filePath)) {
      return violations;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const violation = this.analyzeLine(line, i + 1, lines, filePath);
      if (violation) {
        violations.push(violation);
      }
    }
    
    return violations;
  }

  isSupportedFile(filePath) {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.java', '.kt', '.dart', '.cs'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  analyzeLine(line, lineNumber, allLines, filePath) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (!trimmedLine || this.isComment(trimmedLine)) {
      return null;
    }
    
    // Check for function declarations
    const functionInfo = this.extractFunctionInfo(trimmedLine, lineNumber, allLines);
    if (!functionInfo) {
      return null;
    }
    
    // Skip allowed functions
    if (this.isAllowedFunction(functionInfo.name)) {
      return null;
    }
    
    // Extract function body
    const functionBody = this.extractFunctionBody(allLines, lineNumber - 1);
    if (!functionBody) {
      return null;
    }
    
    // Check for CQS violation
    const violation = this.checkCQSViolation(functionInfo, functionBody, lineNumber, filePath);
    return violation;
  }

  isComment(line) {
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  extractFunctionInfo(line, lineNumber, allLines) {
    // Function declaration patterns
    const patterns = [
      // JavaScript/TypeScript functions
      /(?:async\s+)?function\s+(\w+)\s*\(/,
      /(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
      /(\w+)\s*\([^)]*\)\s*\{/,
      
      // Method definitions
      /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/,
      /(\w+)\s*\([^)]*\)\s*:\s*\w+\s*\{/, // TypeScript with return type
      
      // Java/Kotlin/C# methods
      /(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*\{/,
      
      // Dart methods
      /(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*(?:async\s*)?\{/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          name: match[1],
          fullLine: line,
          lineNumber
        };
      }
    }
    
    return null;
  }

  extractFunctionBody(lines, startIndex) {
    let braceCount = 0;
    let body = '';
    let inFunction = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      if (inFunction) {
        body += line + '\n';
      }
      
      // Function complete
      if (inFunction && braceCount === 0) {
        break;
      }
      
      // Safety limit
      if (i - startIndex > 100) {
        break;
      }
    }
    
    return body;
  }

  checkCQSViolation(functionInfo, functionBody, lineNumber, filePath) {
    const hasStateModification = this.hasStateModification(functionBody);
    const hasReturnValue = this.hasReturnValue(functionBody);
    
    // CQS violation: both command and query behavior
    if (hasStateModification && hasReturnValue) {
      // NEW: Check if this is an acceptable pattern
      if (this.isAcceptablePattern(functionInfo.name, functionBody)) {
        return null; // Allow acceptable patterns
      }

      return {
        ruleId: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: functionInfo.fullLine.indexOf(functionInfo.name) + 1,
        message: `Function '${functionInfo.name}' violates Command Query Separation: both modifies state and returns value`,
        severity: this.severity,
        code: functionInfo.fullLine.trim(),
        type: 'cqs_violation',
        confidence: this.calculateConfidence(hasStateModification, hasReturnValue, functionBody),
        suggestion: this.getSuggestion(functionInfo.name)
      };
    }
    
    return null;
  }

  hasStateModification(functionBody) {
    const modificationPatterns = [
      // Assignment operations
      /\w+\s*=\s*[^=]/,
      /this\.\w+\s*=/,
      /\w+\.\w+\s*=/,
      
      // Update operations
      /\+\+\w+/,
      /\w+\+\+/,
      /--\w+/,
      /\w+--/,
      /\w+\s*\+=\s*/,
      /\w+\s*-=\s*/,
      /\w+\s*\*=\s*/,
      /\w+\s*\/=\s*/,
      
      // Method calls that modify state
      /\.(?:push|pop|shift|unshift|splice|sort|reverse|fill)\s*\(/,
      /\.(?:set|delete|clear|add|remove|update)\s*\(/,
      /\.(?:save|store|persist|insert|append|prepend)\s*\(/,
      /\.(?:setState|dispatch|emit|trigger)\s*\(/,
      
      // Array/object mutations
      /\[\w+\]\s*=/,
      /\{\s*\w+\s*:\s*\w+\s*\}/,
      
      // Property modifications
      /\w+\[\w+\]\s*=/,
      /Object\.assign\s*\(/,
      
      // State modification keywords
      /\b(?:increment|decrement|modify|change|alter|mutate)\s*\(/,
      /\bset[A-Z]\w*\s*\(/,
      /\bupdate[A-Z]\w*\s*\(/
    ];
    
    return modificationPatterns.some(pattern => pattern.test(functionBody));
  }

  hasReturnValue(functionBody) {
    const returnPatterns = [
      // Return statements with values (excluding simple booleans)
      /return\s+(?!true|false|null|undefined|;|\}|$)\w+/,
      /return\s+(?!true|false)[^;\}]+[^;\s\}]/,
      /return\s+\w+\s*\([^)]*\)/,
      /return\s+\w+\.\w+/,
      /return\s+new\s+\w+/,
      /return\s+\{[^}]+\}/,
      /return\s+\[[^\]]+\]/,
      /return\s+`[^`]+`/,
      /return\s+["'][^"']+["']/,
      /return\s+\d+/,
      
      // Arrow function expressions
      /=>\s*(?!true|false|null|undefined)\w+/,
      /=>\s*\w+\s*\([^)]*\)/,
      /=>\s*\w+\.\w+/,
      /=>\s*\{[^}]+\}/,
      /=>\s*\[[^\]]+\]/,
      
      // Function expressions that return values
      /function[^}]*return\s+(?!true|false|null|undefined)\w+/
    ];
    
    // Exclude simple success/failure indicators
    const simpleReturnPatterns = [
      /return\s+true\s*;?$/,
      /return\s+false\s*;?$/,
      /return\s+null\s*;?$/,
      /return\s+undefined\s*;?$/,
      /return\s*;?$/
    ];
    
    const hasComplexReturn = returnPatterns.some(pattern => pattern.test(functionBody));
    const hasOnlySimpleReturn = simpleReturnPatterns.some(pattern => pattern.test(functionBody));
    
    return hasComplexReturn && !hasOnlySimpleReturn;
  }

  isAllowedFunction(functionName) {
    const allowedPatterns = [
      // Constructor and lifecycle
      /^constructor$/,
      /^componentDidMount$/,
      /^componentWillUnmount$/,
      /^useEffect$/,
      /^init$/,
      /^setup$/,
      
      // Test functions
      /^test/,
      /^it$/,
      /^describe$/,
      /^before/,
      /^after/,
      
      // Getters/setters
      /^get\w+$/,
      /^set\w+$/,
      
      // Factory/builder patterns (allowed to create and return)
      /^create\w+$/,
      /^build\w+$/,
      /^make\w+$/,
      /^new\w+$/,
      /Factory$/,
      /Builder$/,
      
      // Configuration and initialization
      /^configure\w+$/,
      /^initialize\w+$/,
      /^setup\w+$/,
      
      // Toggle operations (expected to modify and return new state)
      /^toggle\w+$/,
      /^switch\w+$/,
      
      // Array operations (modify and return)
      /^push$/,
      /^pop$/,
      /^shift$/,
      /^unshift$/,
      /^splice$/,
      
      // Standard methods
      /^toString$/,
      /^valueOf$/,
      /^render$/,
      /^main$/,
      
      // Event handlers
      /^on[A-Z]/,
      /^handle[A-Z]/,
      /Handler$/,
      
      // Utility and helper methods
      /Helper$/,
      /Util$/,
      /Utils$/
    ];
    
    return allowedPatterns.some(pattern => pattern.test(functionName));
  }

  calculateConfidence(hasStateModification, hasReturnValue, functionBody) {
    let confidence = 0.6;
    
    // Higher confidence for clear violations
    if (hasStateModification && hasReturnValue) {
      confidence = 0.8;
      
      // Even higher if multiple modification patterns
      const modificationCount = this.countModificationPatterns(functionBody);
      if (modificationCount > 2) {
        confidence = 0.9;
      }
      
      // Higher if complex return values
      if (this.hasComplexReturnValue(functionBody)) {
        confidence = Math.min(0.95, confidence + 0.1);
      }
    }
    
    return confidence;
  }

  countModificationPatterns(functionBody) {
    const patterns = [
      /\w+\s*=/,
      /\+\+|\--/,
      /\+=|\-=|\*=|\/=/,
      /\.(?:push|pop|set|delete|save|update)\s*\(/
    ];
    
    let count = 0;
    patterns.forEach(pattern => {
      const matches = functionBody.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }

  isAcceptablePattern(functionName, functionBody) {
    // NEW: Practical CQS - Allow acceptable patterns per strategy
    
    // 1. CRUD Operations (single operation + return)
    const crudPatterns = [
      /^(create|insert|add|save|store)\w*$/i,
      /^(update|modify|edit|change)\w*$/i,
      /^(upsert|merge)\w*$/i,
      /^(delete|remove|destroy)\w*$/i
    ];
    
    if (crudPatterns.some(pattern => pattern.test(functionName))) {
      // Check if it's a simple CRUD - single operation
      const queryCount = this.countDatabaseOperations(functionBody);
      if (queryCount <= 1) {
        return true; // Single query + return is acceptable
      }
    }
    
    // 2. Transaction-based Operations
    if (this.isTransactionBased(functionBody)) {
      return true; // Multiple operations in transaction are atomic
    }
    
    // 3. ORM Standard Patterns
    const ormPatterns = [
      /^findOrCreate\w*$/i,
      /^findAndUpdate\w*$/i,
      /^findAndModify\w*$/i,
      /^saveAndReturn\w*$/i,
      /^selectForUpdate\w*$/i
    ];
    
    if (ormPatterns.some(pattern => pattern.test(functionName))) {
      return true; // Standard ORM patterns including selectForUpdate
    }
    
    // 4. Factory patterns (create and return by design)
    const factoryPatterns = [
      /^(build|construct|generate|produce)\w*$/i,
      /^(transform|convert|map)\w*$/i
    ];
    
    if (factoryPatterns.some(pattern => pattern.test(functionName))) {
      return true; // Factory patterns expected to create and return
    }

    return false; // Not an acceptable pattern - flag as violation
  }

  countDatabaseOperations(functionBody) {
    const dbOperationPatterns = [
      /\.(save|insert|create|update|delete|remove)\s*\(/gi,
      /\.(find|findOne|findBy|query|execute)\s*\(/gi,
      /\.(upsert|merge|replace)\s*\(/gi,
      /repository\.\w+\s*\(/gi,
      /manager\.\w+\s*\(/gi
    ];
    
    let count = 0;
    dbOperationPatterns.forEach(pattern => {
      const matches = functionBody.match(pattern);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }

  isTransactionBased(functionBody) {
    const transactionPatterns = [
      /\.transaction\s*\(/gi,
      /withTransaction/gi,
      /runInTransaction/gi,
      /beginTransaction/gi,
      /startTransaction/gi,
      /manager\.transaction/gi,
      /queryRunner\.startTransaction/gi
    ];
    
    return transactionPatterns.some(pattern => pattern.test(functionBody));
  }

  hasComplexReturnValue(functionBody) {
    const complexReturnPatterns = [
      /return\s+\w+\s*\([^)]*\)/, // Function calls
      /return\s+new\s+\w+/, // Object creation
      /return\s+\{[^}]+\}/, // Object literals
      /return\s+\[[^\]]+\]/, // Array literals
      /return\s+\w+\.\w+/ // Property access
    ];
    
    return complexReturnPatterns.some(pattern => pattern.test(functionBody));
  }

  getSuggestion(functionName) {
    return `Split '${functionName}' into separate command (modify state) and query (return data) functions`;
  }
}

module.exports = C012Analyzer;
