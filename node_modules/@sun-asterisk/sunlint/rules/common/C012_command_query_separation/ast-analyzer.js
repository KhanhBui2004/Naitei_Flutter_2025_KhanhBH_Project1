/**
 * C012 AST Analyzer - Command Query Separation
 * 
 * Uses AST parsing to detect violations of the Command Query Separation principle:
 * - Commands (modify state) should not return values
 * - Queries (return data) should not have side effects
 * - Functions that both modify state and return meaningful values violate CQS
 */

const fs = require('fs');
const path = require('path');

class C012ASTAnalyzer {
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
        console.warn(`C012 AST analysis failed for ${filePath}:`, error.message);
      }
    }
    
    return violations;
  }

  async analyzeFile(filePath, content, language, config) {
    const violations = [];
    
    try {
      let ast;
      
      if (language === 'typescript' || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        ast = await this.parseTypeScript(content);
      } else if (language === 'javascript' || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        ast = await this.parseJavaScript(content);
      } else {
        // Fallback to regex analysis
        return [];
      }
      
      if (ast) {
        this.traverseAST(ast, (node) => {
          const violation = this.checkCQSViolation(node, content, filePath);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    } catch (error) {
      console.warn(`C012 AST parsing failed for ${filePath}:`, error.message);
    }
    
    return violations;
  }

  async parseTypeScript(content) {
    try {
      const babel = require('@babel/parser');
      return babel.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      });
    } catch (error) {
      return null;
    }
  }

  async parseJavaScript(content) {
    try {
      const babel = require('@babel/parser');
      return babel.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      });
    } catch (error) {
      return null;
    }
  }

  traverseAST(node, callback) {
    if (!node || typeof node !== 'object') return;
    
    callback(node);
    
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.traverseAST(item, callback));
      } else if (child && typeof child === 'object') {
        this.traverseAST(child, callback);
      }
    }
  }

  checkCQSViolation(node, content, filePath) {
    // Check function declarations, methods, and arrow functions
    if (!this.isFunctionNode(node)) {
      return null;
    }

    const functionName = this.getFunctionName(node);
    if (!functionName || this.isAllowedFunction(functionName)) {
      return null;
    }

    const hasStateModification = this.hasStateModification(node);
    const hasReturnValue = this.hasReturnValue(node);

    // CQS violation: function both modifies state AND returns meaningful value
    if (hasStateModification && hasReturnValue) {
      // NEW: Check if this is an acceptable pattern
      if (this.isAcceptablePattern(node, functionName)) {
        return null; // Allow acceptable patterns
      }

      const line = node.loc ? node.loc.start.line : 1;
      const column = node.loc ? node.loc.start.column + 1 : 1;

      return {
        ruleId: this.ruleId,
        file: filePath,
        line,
        column,
        message: `Function '${functionName}' violates Command Query Separation: both modifies state and returns value`,
        severity: this.severity,
        code: this.getNodeCode(node, content),
        type: 'cqs_violation',
        confidence: this.calculateConfidence(hasStateModification, hasReturnValue),
        suggestion: this.getSuggestion(functionName, hasStateModification, hasReturnValue)
      };
    }

    return null;
  }

  isFunctionNode(node) {
    return [
      'FunctionDeclaration',
      'FunctionExpression', 
      'ArrowFunctionExpression',
      'MethodDefinition',
      'ObjectMethod',
      'ClassMethod'
    ].includes(node.type);
  }

  getFunctionName(node) {
    if (node.key && node.key.name) {
      return node.key.name; // Method
    }
    if (node.id && node.id.name) {
      return node.id.name; // Function declaration
    }
    if (node.type === 'ArrowFunctionExpression' && node.parent) {
      // Arrow function assigned to variable
      if (node.parent.type === 'VariableDeclarator' && node.parent.id) {
        return node.parent.id.name;
      }
    }
    return 'anonymous';
  }

  isAllowedFunction(functionName) {
    // Allowed patterns that don't violate CQS
    const allowedPatterns = [
      // Constructor and lifecycle
      /^constructor$/,
      /^componentDidMount$/,
      /^componentWillUnmount$/,
      /^useEffect$/,
      
      // Test functions
      /^test_/,
      /^it$/,
      /^describe$/,
      /^beforeEach$/,
      /^afterEach$/,
      
      // Getters/setters (have special semantics)
      /^get\w+$/,
      /^set\w+$/,
      
      // Factory/builder patterns (expected to create and return)
      /^create\w+$/,
      /^build\w+$/,
      /^make\w+$/,
      /^new\w+$/,
      
      // Initialization (setup state and return success)
      /^init\w+$/,
      /^setup\w+$/,
      /^configure\w+$/,
      
      // Toggle operations (modify state and return new state)
      /^toggle\w+$/,
      /^switch\w+$/,
      
      // Array operations that modify and return
      /^push$/,
      /^pop$/,
      /^shift$/,
      /^unshift$/,
      /^splice$/,
      
      // Built-in operations
      /^toString$/,
      /^valueOf$/,
      /^render$/
    ];

    return allowedPatterns.some(pattern => pattern.test(functionName));
  }

  hasStateModification(node) {
    let hasModification = false;
    
    this.traverseAST(node.body, (innerNode) => {
      if (hasModification) return;
      
      // Assignment operations
      if (innerNode.type === 'AssignmentExpression') {
        // Check if assigning to object property or variable
        if (innerNode.left.type === 'MemberExpression' || 
            innerNode.left.type === 'Identifier') {
          hasModification = true;
        }
      }
      
      // Update expressions (++, --)
      if (innerNode.type === 'UpdateExpression') {
        hasModification = true;
      }
      
      // Method calls that likely modify state
      if (innerNode.type === 'CallExpression' && innerNode.callee) {
        const callName = this.getCallName(innerNode.callee);
        if (this.isStateModifyingCall(callName)) {
          hasModification = true;
        }
      }
      
      // Property mutations
      if (innerNode.type === 'MemberExpression' && 
          innerNode.parent && 
          innerNode.parent.type === 'AssignmentExpression' &&
          innerNode.parent.left === innerNode) {
        hasModification = true;
      }
    });
    
    return hasModification;
  }

  hasReturnValue(node) {
    let hasReturn = false;
    
    this.traverseAST(node.body, (innerNode) => {
      if (hasReturn) return;
      
      // Return statements with value
      if (innerNode.type === 'ReturnStatement' && innerNode.argument) {
        // Ignore simple boolean returns (success/failure indicators)
        if (!this.isSimpleBooleanReturn(innerNode.argument)) {
          hasReturn = true;
        }
      }
      
      // Arrow function with expression body
      if (node.type === 'ArrowFunctionExpression' && node.body.type !== 'BlockStatement') {
        if (!this.isSimpleBooleanReturn(node.body)) {
          hasReturn = true;
        }
      }
    });
    
    return hasReturn;
  }

  isSimpleBooleanReturn(argument) {
    // Simple boolean literals
    if (argument.type === 'BooleanLiteral' || 
        (argument.type === 'Literal' && typeof argument.value === 'boolean')) {
      return true;
    }
    
    // Simple boolean expressions
    if (argument.type === 'UnaryExpression' && argument.operator === '!') {
      return true;
    }
    
    // Comparison operations (often return success/failure)
    if (argument.type === 'BinaryExpression' && 
        ['==', '===', '!=', '!==', '<', '>', '<=', '>='].includes(argument.operator)) {
      return true;
    }
    
    return false;
  }

  getCallName(callee) {
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression' && callee.property) {
      return callee.property.name;
    }
    return '';
  }

  isStateModifyingCall(callName) {
    const modifyingCalls = [
      'push', 'pop', 'shift', 'unshift', 'splice',
      'sort', 'reverse', 'fill',
      'set', 'delete', 'clear',
      'add', 'remove', 'update',
      'save', 'store', 'persist',
      'increment', 'decrement',
      'modify', 'change', 'alter',
      'append', 'prepend', 'insert',
      'setState', 'dispatch'
    ];
    
    return modifyingCalls.includes(callName) ||
           /^set[A-Z]/.test(callName) ||
           /^update[A-Z]/.test(callName) ||
           /^modify[A-Z]/.test(callName);
  }

  calculateConfidence(hasStateModification, hasReturnValue) {
    let confidence = 0.7;
    
    // Higher confidence if both conditions are clearly present
    if (hasStateModification && hasReturnValue) {
      confidence = 0.9;
    }
    
    return confidence;
  }

  isAcceptablePattern(node, functionName) {
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
      const queryCount = this.countDatabaseOperations(node);
      if (queryCount <= 1) {
        return true; // Single query + return is acceptable
      }
    }
    
    // 2. Transaction-based Operations
    if (this.isTransactionBased(node)) {
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

  countDatabaseOperations(node) {
    let count = 0;
    
    this.traverseAST(node.body, (innerNode) => {
      if (innerNode.type === 'CallExpression' && innerNode.callee) {
        const callName = this.getCallName(innerNode.callee);
        
        // Database operation patterns
        const dbOperations = [
          'save', 'insert', 'create', 'update', 'delete', 'remove',
          'find', 'findOne', 'findBy', 'query', 'execute',
          'upsert', 'merge', 'replace'
        ];
        
        if (dbOperations.some(op => callName.toLowerCase().includes(op))) {
          count++;
        }
      }
    });
    
    return count;
  }

  isTransactionBased(node) {
    let isTransaction = false;
    
    this.traverseAST(node.body, (innerNode) => {
      if (innerNode.type === 'CallExpression' && innerNode.callee) {
        const callName = this.getCallName(innerNode.callee);
        
        // Transaction indicators
        const transactionPatterns = [
          'transaction', 'withTransaction', 'runInTransaction',
          'beginTransaction', 'commit', 'rollback',
          'manager.transaction', 'queryRunner.startTransaction'
        ];
        
        if (transactionPatterns.some(pattern => 
          callName.toLowerCase().includes(pattern.toLowerCase()))) {
          isTransaction = true;
        }
      }
    });
    
    return isTransaction;
  }

  getSuggestion(functionName, hasStateModification, hasReturnValue) {
    if (hasStateModification && hasReturnValue) {
      return `Split '${functionName}' into separate command (modify state) and query (return data) functions`;
    }
    return `Follow Command Query Separation principle for '${functionName}'`;
  }

  getNodeCode(node, content) {
    if (node.loc) {
      const lines = content.split('\n');
      const startLine = node.loc.start.line - 1;
      const endLine = Math.min(node.loc.end.line - 1, startLine + 2); // Limit to 3 lines
      return lines.slice(startLine, endLine + 1).join('\n').trim();
    }
    return 'Unknown code';
  }
}

module.exports = C012ASTAnalyzer;
