/**
 * AST-based analyzer for S005 - No Origin Header Authentication
 * Detects usage of Origin header for authentication/access control through AST analysis
 */

const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class S005ASTAnalyzer {
  constructor() {
    this.ruleId = 'S005';
    this.ruleName = 'No Origin Header Authentication';
    this.description = 'Do not use Origin header for authentication or access control';
  }

  async analyze(files, language, options = {}) {
    const violations = [];
    
    for (const filePath of files) {
      try {
        const content = require('fs').readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(content, filePath, options);
        violations.push(...fileViolations);
      } catch (error) {
        if (options.verbose) {
          console.warn(`⚠️ S005 AST analysis failed for ${filePath}: ${error.message}`);
        }
      }
    }
    
    return violations;
  }

  async analyzeFile(content, filePath, options = {}) {
    const violations = [];
    
    try {
      // Parse with TypeScript/JavaScript support
      const ast = babel.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'typescript',
          'jsx',
          'objectRestSpread',
          'functionBind',
          'exportDefaultFrom',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators',
          'dynamicImport'
        ]
      });

      // Traverse AST to find Origin header usage in authentication contexts
      traverse(ast, {
        MemberExpression: (path) => {
          this.checkOriginHeaderAccess(path, violations, filePath);
        },
        CallExpression: (path) => {
          this.checkOriginHeaderMethods(path, violations, filePath);
        },
        IfStatement: (path) => {
          this.checkConditionalOriginAuth(path, violations, filePath);
        },
        AssignmentExpression: (path) => {
          this.checkOriginAssignment(path, violations, filePath);
        }
      });

    } catch (parseError) {
      if (options.verbose) {
        console.warn(`⚠️ S005 parse failed for ${filePath}: ${parseError.message}`);
      }
      // Fall back to regex analysis if AST parsing fails
      return this.analyzeWithRegex(content, filePath, options);
    }

    return violations;
  }

  checkOriginHeaderAccess(path, violations, filePath) {
    const node = path.node;
    
    // Check for req.headers.origin, headers.origin, req.headers['origin']
    if (this.isOriginHeaderAccess(node)) {
      // Check if this is in an authentication context
      if (this.isInAuthenticationContext(path)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Origin header should not be used for authentication. Origin can be spoofed and is not secure for access control.',
          line: node.loc ? node.loc.start.line : 1,
          column: node.loc ? node.loc.start.column + 1 : 1,
          filePath: filePath,
          type: 'origin_header_access'
        });
      }
    }
  }

  checkOriginHeaderMethods(path, violations, filePath) {
    const node = path.node;
    
    // Check for req.get('origin'), req.header('origin'), getHeader('origin')
    if (this.isOriginHeaderMethod(node)) {
      if (this.isInAuthenticationContext(path)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Origin header retrieval methods should not be used for authentication purposes.',
          line: node.loc ? node.loc.start.line : 1,
          column: node.loc ? node.loc.start.column + 1 : 1,
          filePath: filePath,
          type: 'origin_header_method'
        });
      }
    }

    // Check for CORS configuration with origin-based auth
    if (this.isCORSOriginAuth(node)) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'warning',
        message: 'CORS origin configuration should not replace proper authentication mechanisms.',
        line: node.loc ? node.loc.start.line : 1,
        column: node.loc ? node.loc.start.column + 1 : 1,
        filePath: filePath,
        type: 'cors_origin_auth'
      });
    }
  }

  checkConditionalOriginAuth(path, violations, filePath) {
    const node = path.node;
    
    // Check if condition involves origin header and authentication
    if (this.hasOriginInCondition(node.test) && this.hasAuthInBlock(node.consequent)) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'error',
        message: 'Conditional authentication based on Origin header is insecure. Use proper authentication tokens.',
        line: node.loc ? node.loc.start.line : 1,
        column: node.loc ? node.loc.start.column + 1 : 1,
        filePath: filePath,
        type: 'conditional_origin_auth'
      });
    }
  }

  checkOriginAssignment(path, violations, filePath) {
    const node = path.node;
    
    // Check for assignments involving origin header in auth context
    if (this.isOriginRelatedAssignment(node) && this.isInAuthenticationContext(path)) {
      violations.push({
        ruleId: this.ruleId,
        severity: 'warning',
        message: 'Origin header values should not be assigned for authentication purposes.',
        line: node.loc ? node.loc.start.line : 1,
        column: node.loc ? node.loc.start.column + 1 : 1,
        filePath: filePath,
        type: 'origin_assignment_auth'
      });
    }
  }

  isOriginHeaderAccess(node) {
    // req.headers.origin
    if (node.type === 'MemberExpression' &&
        node.object && node.object.type === 'MemberExpression' &&
        node.object.property && node.object.property.name === 'headers' &&
        node.property && (node.property.name === 'origin' || 
        (node.property.type === 'StringLiteral' && node.property.value === 'origin'))) {
      return true;
    }
    
    // headers.origin or headers['origin']
    if (node.type === 'MemberExpression' &&
        node.object && node.object.name === 'headers' &&
        node.property && (node.property.name === 'origin' ||
        (node.property.type === 'StringLiteral' && node.property.value === 'origin'))) {
      return true;
    }
    
    return false;
  }

  isOriginHeaderMethod(node) {
    if (node.type !== 'CallExpression' || !node.callee) return false;
    
    const callee = node.callee;
    
    // req.get('origin'), req.header('origin')
    if (callee.type === 'MemberExpression' &&
        callee.property && (callee.property.name === 'get' || callee.property.name === 'header') &&
        node.arguments && node.arguments.length > 0 &&
        node.arguments[0].type === 'StringLiteral' &&
        node.arguments[0].value.toLowerCase() === 'origin') {
      return true;
    }
    
    // getHeader('origin')
    if (callee.type === 'Identifier' && callee.name === 'getHeader' &&
        node.arguments && node.arguments.length > 0 &&
        node.arguments[0].type === 'StringLiteral' &&
        node.arguments[0].value.toLowerCase() === 'origin') {
      return true;
    }
    
    return false;
  }

  isCORSOriginAuth(node) {
    if (node.type !== 'CallExpression' || !node.callee) return false;
    
    // Check for CORS configuration calls
    const callee = node.callee;
    if (callee.type === 'Identifier' && callee.name === 'cors' ||
        (callee.type === 'MemberExpression' && callee.property && callee.property.name === 'cors')) {
      
      // Check if arguments contain auth-related configuration
      if (node.arguments && node.arguments.length > 0) {
        const config = node.arguments[0];
        if (config.type === 'ObjectExpression') {
          return config.properties.some(prop => 
            this.isPropertyWithAuthKeyword(prop) && this.hasOriginReference(prop)
          );
        }
      }
    }
    
    return false;
  }

  hasOriginInCondition(testNode) {
    if (!testNode) return false;
    
    // Recursively check for origin references in condition
    if (testNode.type === 'MemberExpression') {
      return this.isOriginHeaderAccess(testNode);
    }
    
    if (testNode.type === 'CallExpression') {
      return this.isOriginHeaderMethod(testNode);
    }
    
    if (testNode.type === 'BinaryExpression') {
      return this.hasOriginInCondition(testNode.left) || this.hasOriginInCondition(testNode.right);
    }
    
    if (testNode.type === 'LogicalExpression') {
      return this.hasOriginInCondition(testNode.left) || this.hasOriginInCondition(testNode.right);
    }
    
    return false;
  }

  hasAuthInBlock(blockNode) {
    if (!blockNode) return false;
    
    const authKeywords = ['auth', 'login', 'token', 'session', 'user', 'permission', 'access'];
    
    // Simple check for auth-related identifiers in the block
    let hasAuth = false;
    
    try {
      traverse(blockNode, {
        Identifier: (path) => {
          if (path.node && path.node.name && authKeywords.some(keyword => 
            path.node.name.toLowerCase().includes(keyword))) {
            hasAuth = true;
            path.stop();
          }
        },
        StringLiteral: (path) => {
          if (path.node && path.node.value && authKeywords.some(keyword => 
            path.node.value.toLowerCase().includes(keyword))) {
            hasAuth = true;
            path.stop();
          }
        }
      }, this);
    } catch (error) {
      // Ignore traverse errors, return false
      return false;
    }
    
    return hasAuth;
  }

  isInAuthenticationContext(path) {
    // Check parent nodes for authentication context
    let currentPath = path;
    let depth = 0;
    const maxDepth = 10;
    
    while (currentPath && depth < maxDepth) {
      const node = currentPath.node;
      
      // Check function names
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || 
          node.type === 'ArrowFunctionExpression') {
        if (this.hasAuthInName(node.id?.name)) {
          return true;
        }
      }
      
      // Check variable declarations
      if (node.type === 'VariableDeclarator' && this.hasAuthInName(node.id?.name)) {
        return true;
      }
      
      // Check object property names
      if (node.type === 'ObjectProperty' && this.hasAuthInName(node.key?.name || node.key?.value)) {
        return true;
      }
      
      currentPath = currentPath.parent;
      depth++;
    }
    
    return false;
  }

  hasAuthInName(name) {
    if (!name) return false;
    
    const authKeywords = [
      'auth', 'login', 'logout', 'authenticate', 'authorize',
      'permission', 'access', 'token', 'session', 'user',
      'verify', 'validate', 'check', 'guard', 'protect',
      'middleware', 'passport', 'jwt', 'bearer'
    ];
    
    const lowerName = name.toLowerCase();
    return authKeywords.some(keyword => lowerName.includes(keyword));
  }

  isOriginRelatedAssignment(node) {
    if (node.type !== 'AssignmentExpression') return false;
    
    // Check if right side involves origin header
    return this.hasOriginReference(node.right);
  }

  hasOriginReference(node) {
    if (!node) return false;
    
    if (node.type === 'MemberExpression') {
      return this.isOriginHeaderAccess(node);
    }
    
    if (node.type === 'CallExpression') {
      return this.isOriginHeaderMethod(node);
    }
    
    if (node.type === 'Identifier' && node.name.toLowerCase().includes('origin')) {
      return true;
    }
    
    if (node.type === 'StringLiteral' && node.value.toLowerCase().includes('origin')) {
      return true;
    }
    
    return false;
  }

  isPropertyWithAuthKeyword(prop) {
    if (!prop || prop.type !== 'ObjectProperty') return false;
    
    const key = prop.key?.name || prop.key?.value;
    if (!key) return false;
    
    return this.hasAuthInName(key);
  }

  // Fallback regex analysis
  analyzeWithRegex(content, filePath, options = {}) {
    const violations = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Basic regex check for origin header in auth context
      const originAuthPattern = /(?:req\.headers\.origin|req\.get\s*\(\s*['"`]origin['"`]\s*\)).*(?:auth|login|token|permission)/i;
      if (originAuthPattern.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Origin header should not be used for authentication (detected via regex fallback).',
          line: lineNumber,
          column: line.search(/origin/i) + 1,
          filePath: filePath,
          type: 'origin_auth_regex'
        });
      }
    });

    return violations;
  }
}

module.exports = S005ASTAnalyzer;
