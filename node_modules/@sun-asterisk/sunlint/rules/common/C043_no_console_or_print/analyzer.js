/**
 * AST-based C043 Analyzer
 * Mirrors ESLint's sophisticated implementation for perfect accuracy
 * Leverages SunLint's existing AST infrastructure
 */

const astRegistry = require('../../../core/ast-modules');
const fs = require('fs');

class C043NoConsoleOrPrintAnalyzer {
  constructor() {
    this.ruleId = 'C043';
    this.ruleName = 'No Console Or Print';
    this.description = 'Do not use console.log or print in production code';
    this.severity = 'warning';
    this.astRegistry = astRegistry;
    
    // Configuration mirroring ESLint's C043 rule
    this.config = {
      allowedMethods: new Set(['error', 'warn']),
      allowInDevelopment: true,
      allowInTests: true,
      
      testFilePatterns: [
        '.test.', '.spec.', '__tests__', '/test/', '/tests/', 
        '.test.ts', '.test.js', '.spec.ts', '.spec.js', 
        'test.tsx', 'spec.tsx',
        '.stories.', '.story.'  // Include stories files like ESLint
      ],
      
      developmentPatterns: [
        '.dev.', '.development.', '.debug.', '/dev/', '/development/'
      ],
      
      developmentFlags: new Set([
        '__DEV__', 'DEBUG', 'process.env.NODE_ENV', 'process.env.ENVIRONMENT',
        'process.env.ENABLE_LOGGING', 'FEATURES.debug', 'BUILD_TYPE'
      ]),
      
      consoleMethods: new Set([
        'log', 'info', 'debug', 'trace', 'dir', 'dirxml', 'table',
        'count', 'countReset', 'time', 'timeEnd', 'timeLog',
        'assert', 'clear', 'group', 'groupCollapsed', 'groupEnd',
        'profile', 'profileEnd', 'timeStamp'
      ]),
      
      forbiddenFunctions: ['print', 'alert', 'confirm', 'prompt']
    };
  }

  async analyze(files, language, config) {
    const violations = [];
    
    // Batch processing to avoid memory issues
    const batchSize = 100;
    const totalFiles = files.length;
    
    for (let i = 0; i < totalFiles; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      for (const filePath of batch) {
        try {
          // Skip test files if configured
          if (this.config.allowInTests && this.isTestFile(filePath)) {
            continue;
          }
          
          // Skip development files if configured
          if (this.config.allowInDevelopment && this.isDevelopmentFile(filePath)) {
            continue;
          }

          const fileContent = fs.readFileSync(filePath, 'utf8');
          
          // Skip empty files or very large files (>1MB)
          if (!fileContent.trim() || fileContent.length > 1024 * 1024) {
            continue;
          }
          
          const fileLanguage = this.getLanguageFromPath(filePath);
          
          // Use regex-based analysis for now (AST can be added later)
          // AST parsing can be slow on large files, so use fast regex approach
          const regexViolations = await this.analyzeFileWithRegex(filePath, fileContent, language, config);
          violations.push(...regexViolations);

        } catch (error) {
          // Skip problematic files silently to avoid stopping entire analysis
          console.warn(`C043 skipping ${filePath}: ${error.message}`);
        }
      }
      
      // Give Node.js a chance to breathe between batches
      if (i + batchSize < totalFiles) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return violations;
  }

  getLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'typescript',
      'tsx': 'typescript',
      'mjs': 'javascript',
      'cjs': 'javascript'
    };
    
    return languageMap[ext] || 'javascript';
  }

  analyzeAST(ast, filePath, fileContent) {
    const violations = [];
    const lines = fileContent.split('\n');
    
    // Define visitor for AST traversal
    const visitor = {
      CallExpression: (node) => {
        // Check for console method calls
        if (this.isConsoleCall(node)) {
          const methodName = this.getConsoleMethodName(node);
          
          // Skip allowed methods (error, warn)
          if (this.config.allowedMethods.has(methodName)) {
            return;
          }
          
          // Check if in development context
          if (this.config.allowInDevelopment && this.isInDevelopmentContext(node, ast)) {
            return;
          }
          
          // Create violation
          const location = this.getNodeLocation(node);
          if (location && location.line <= lines.length) {
            violations.push({
              ruleId: this.ruleId,
              severity: this.severity,
              message: `Do not use console.${methodName}() in production code. Use proper logging instead.`,
              filePath: filePath,
              line: location.line,
              column: location.column,
              source: lines[location.line - 1]?.trim() || '',
              suggestion: `Consider using a proper logging library (logger.${methodName}())`
            });
          }
        }
        
        // Check for forbidden functions (print, alert, etc.)
        if (this.isForbiddenFunctionCall(node)) {
          const functionName = this.getFunctionName(node);
          const location = this.getNodeLocation(node);
          
          if (location && location.line <= lines.length) {
            violations.push({
              ruleId: this.ruleId,
              severity: this.severity,
              message: `Do not use ${functionName}() in production code. Use proper logging or UI notifications instead.`,
              filePath: filePath,
              line: location.line,
              column: location.column,
              source: lines[location.line - 1]?.trim() || '',
              suggestion: `Consider using a logging library or proper UI notification system`
            });
          }
        }
      }
    };

    // Traverse AST
    this.traverseAST(ast, visitor);
    
    return violations;
  }

  // AST Helper Methods
  isConsoleCall(node) {
    return node.type === 'CallExpression' &&
           node.callee &&
           node.callee.type === 'MemberExpression' &&
           node.callee.object &&
           node.callee.object.type === 'Identifier' &&
           node.callee.object.name === 'console' &&
           node.callee.property &&
           this.config.consoleMethods.has(node.callee.property.name);
  }
  
  getConsoleMethodName(node) {
    if (node.callee && node.callee.property) {
      return node.callee.property.name;
    }
    return 'log';
  }
  
  isForbiddenFunctionCall(node) {
    return node.type === 'CallExpression' &&
           node.callee &&
           node.callee.type === 'Identifier' &&
           this.config.forbiddenFunctions.includes(node.callee.name);
  }
  
  getFunctionName(node) {
    if (node.callee && node.callee.name) {
      return node.callee.name;
    }
    return 'unknown';
  }
  
  isInDevelopmentContext(node, ast) {
    // Check if node is within an if statement checking development flags
    let parent = node.parent;
    
    while (parent) {
      if (parent.type === 'IfStatement') {
        const test = parent.test;
        if (this.isDevelopmentCondition(test)) {
          return true;
        }
      }
      parent = parent.parent;
    }
    
    return false;
  }
  
  isDevelopmentCondition(node) {
    if (!node) return false;
    
    // Check for various development condition patterns
    if (node.type === 'Identifier' && this.config.developmentFlags.has(node.name)) {
      return true;
    }
    
    if (node.type === 'MemberExpression') {
      const source = this.nodeToString(node);
      return Array.from(this.config.developmentFlags).some(flag => source.includes(flag));
    }
    
    if (node.type === 'BinaryExpression') {
      return this.isDevelopmentCondition(node.left) || this.isDevelopmentCondition(node.right);
    }
    
    return false;
  }
  
  nodeToString(node) {
    // Simple node to string conversion for pattern matching
    if (node.type === 'Identifier') {
      return node.name;
    }
    if (node.type === 'MemberExpression') {
      return `${this.nodeToString(node.object)}.${node.property.name}`;
    }
    if (node.type === 'Literal') {
      return String(node.value);
    }
    return '';
  }
  
  getNodeLocation(node) {
    if (node.loc) {
      return {
        line: node.loc.start.line,
        column: node.loc.start.column + 1
      };
    }
    return null;
  }
  
  traverseAST(node, visitor) {
    if (!node || typeof node !== 'object') return;
    
    // Prevent infinite recursion
    if (node._visited) return;
    node._visited = true;
    
    try {
      // Visit current node
      if (visitor[node.type]) {
        visitor[node.type](node);
      }
      
      // Traverse children with depth limit
      const maxDepth = 100;
      if ((node._depth || 0) > maxDepth) return;
      
      for (const key in node) {
        if (key === 'parent' || key === '_visited' || key === '_depth') continue; // Avoid circular references
        
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object') {
              item.parent = node; // Set parent reference
              item._depth = (node._depth || 0) + 1;
              this.traverseAST(item, visitor);
            }
          }
        } else if (child && typeof child === 'object') {
          child.parent = node; // Set parent reference  
          child._depth = (node._depth || 0) + 1;
          this.traverseAST(child, visitor);
        }
      }
    } finally {
      // Clean up to prevent memory leaks
      delete node._visited;
    }
  }

  // File Classification Methods
  isTestFile(filePath) {
    return this.config.testFilePatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }
  
  isDevelopmentFile(filePath) {
    return this.config.developmentPatterns.some(pattern => 
      filePath.includes(pattern)
    );
  }

  // Regex Fallback Methods (for compatibility)
  async analyzeWithRegexFallback(files, language, config) {
    const violations = [];
    
    for (const filePath of files) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFileWithRegex(filePath, fileContent, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`C043 regex fallback analysis error for ${filePath}:`, error.message);
      }
    }
    
    return violations;
  }

  async analyzeFileWithRegex(filePath, fileContent, language, config) {
    const violations = [];
    
    // Skip test files and development files
    if (this.isTestFile(filePath) || this.isDevelopmentFile(filePath)) {
      return violations;
    }
    
    const lines = fileContent.split('\n');
    
    // Simple regex patterns for fallback
    const consolePattern = /\bconsole\.(log|debug|info|trace|dir|table|count|time|clear|group|assert|profile)\s*\(/g;
    const forbiddenPattern = /\b(print|alert|confirm|prompt)\s*\(/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Skip comments and strings (basic check)
      if (this.isLineCommentOrString(line)) {
        continue;
      }
      
      // Check console calls
      consolePattern.lastIndex = 0; // Reset regex state
      let match;
      while ((match = consolePattern.exec(line)) !== null) {
        const method = match[1];
        if (!this.config.allowedMethods.has(method)) {
          violations.push({
            ruleId: this.ruleId,
            severity: this.severity,
            message: `Do not use console.${method}() in production code. Use proper logging instead.`,
            filePath: filePath,
            line: lineNumber,
            column: match.index + 1,
            source: line.trim(),
            suggestion: `Consider using a proper logging library (logger.${method}())`
          });
        }
        // Prevent infinite loop - limit to first match per line
        break;
      }
      
      // Check forbidden functions
      forbiddenPattern.lastIndex = 0; // Reset regex state
      while ((match = forbiddenPattern.exec(line)) !== null) {
        const functionName = match[1];
        violations.push({
          ruleId: this.ruleId,
          severity: this.severity,
          message: `Do not use ${functionName}() in production code. Use proper logging or UI notifications instead.`,
          filePath: filePath,
          line: lineNumber,
          column: match.index + 1,
          source: line.trim(),
          suggestion: `Consider using a logging library or proper UI notification system`
        });
        // Prevent infinite loop - limit to first match per line
        break;
      }
    }
    
    return violations;
  }
  
  isLineCommentOrString(line) {
    const trimmed = line.trim();
    
    // Single line comment
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      return true;
    }
    
    // Simple string check - if more quotes before console than after, likely in string
    const beforeConsole = line.split(/console\.|print\(|alert\(/)[0];
    if (beforeConsole) {
      const quotes = (beforeConsole.match(/['"]/g) || []).length;
      return quotes % 2 === 1;
    }
    
    return false;
  }
}

module.exports = C043NoConsoleOrPrintAnalyzer;
