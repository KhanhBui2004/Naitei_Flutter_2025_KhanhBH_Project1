/**
 * AST-based analyzer for S015 - Insecure TLS Certificate Detection
 * Detects usage of insecure TLS certificate configurations like rejectUnauthorized: false
 */

const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class S015ASTAnalyzer {
  constructor() {
    this.ruleId = 'S015';
    this.ruleName = 'Insecure TLS Certificate';
    this.description = 'Prevent usage of insecure TLS certificate configurations';
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
          console.warn(`⚠️ S015 AST analysis failed for ${filePath}: ${error.message}`);
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

      // Traverse AST to find insecure TLS configurations
      traverse(ast, {
        Property: (path) => {
          this.checkTLSProperty(path, violations, filePath);
        },
        ObjectExpression: (path) => {
          this.checkHTTPSOptions(path, violations, filePath);
        }
      });

    } catch (parseError) {
      if (options.verbose) {
        console.warn(`⚠️ S015 parse failed for ${filePath}: ${parseError.message}`);
      }
      // Fall back to regex analysis if AST parsing fails
      return this.analyzeWithRegex(content, filePath, options);
    }

    return violations;
  }

  checkTLSProperty(path, violations, filePath) {
    const node = path.node;
    
    // Check for rejectUnauthorized: false
    if (this.isPropertyKey(node.key, 'rejectUnauthorized')) {
      if (this.isFalseLiteral(node.value)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Untrusted/self-signed/expired certificate accepted. Only use trusted certificates in production.',
          line: node.loc ? node.loc.start.line : 1,
          column: node.loc ? node.loc.start.column + 1 : 1,
          filePath: filePath,
          type: 'insecure_tls_config'
        });
      }
    }

    // Check for other insecure TLS options
    const insecureOptions = [
      'checkServerIdentity',
      'secureProtocol',
      'ciphers',
      'secureOptions'
    ];

    if (insecureOptions.some(opt => this.isPropertyKey(node.key, opt))) {
      if (this.hasInsecureValue(node.value, node.key.name || node.key.value)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'warning',
          message: `Potentially insecure TLS option '${node.key.name || node.key.value}'. Review configuration for security.`,
          line: node.loc ? node.loc.start.line : 1,
          column: node.loc ? node.loc.start.column + 1 : 1,
          filePath: filePath,
          type: 'potentially_insecure_tls'
        });
      }
    }
  }

  checkHTTPSOptions(path, violations, filePath) {
    const node = path.node;
    
    // Look for HTTPS server configurations
    const parent = path.parent;
    if (parent && parent.type === 'CallExpression') {
      const callee = parent.callee;
      
      // Check for https.createServer(options, ...)
      if (this.isHTTPSCreateServer(callee)) {
        // Check each property in the options object
        node.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            if (this.isPropertyKey(prop.key, 'rejectUnauthorized') && 
                this.isFalseLiteral(prop.value)) {
              violations.push({
                ruleId: this.ruleId,
                severity: 'error',
                message: 'HTTPS server configured with rejectUnauthorized: false. This disables certificate validation.',
                line: prop.loc ? prop.loc.start.line : 1,
                column: prop.loc ? prop.loc.start.column + 1 : 1,
                filePath: filePath,
                type: 'https_server_insecure'
              });
            }
          }
        });
      }
    }
  }

  isPropertyKey(key, expectedName) {
    return (key.type === 'Identifier' && key.name === expectedName) ||
           (key.type === 'StringLiteral' && key.value === expectedName) ||
           (key.type === 'Literal' && key.value === expectedName);
  }

  isFalseLiteral(value) {
    return (value.type === 'BooleanLiteral' && value.value === false) ||
           (value.type === 'Literal' && value.value === false);
  }

  isHTTPSCreateServer(callee) {
    return (callee.type === 'MemberExpression' &&
            callee.object.name === 'https' &&
            callee.property.name === 'createServer') ||
           (callee.type === 'Identifier' && callee.name === 'createServer');
  }

  hasInsecureValue(value, propertyName) {
    // Check for potentially insecure values based on property type
    if (propertyName === 'checkServerIdentity' && this.isFalseLiteral(value)) {
      return true;
    }
    
    if (propertyName === 'secureProtocol' && value.type === 'StringLiteral') {
      const insecureProtocols = ['SSLv2', 'SSLv3', 'TLSv1', 'TLSv1_method'];
      return insecureProtocols.some(protocol => 
        value.value.toLowerCase().includes(protocol.toLowerCase())
      );
    }

    if (propertyName === 'ciphers' && value.type === 'StringLiteral') {
      const weakCiphers = ['NULL', 'RC4', 'DES', 'MD5'];
      return weakCiphers.some(cipher => 
        value.value.toUpperCase().includes(cipher)
      );
    }

    return false;
  }

  // Fallback regex analysis
  analyzeWithRegex(content, filePath, options = {}) {
    const violations = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for rejectUnauthorized: false
      if (/rejectUnauthorized\s*:\s*false/i.test(line)) {
        violations.push({
          ruleId: this.ruleId,
          severity: 'error',
          message: 'Untrusted/self-signed/expired certificate accepted. Only use trusted certificates in production.',
          line: lineNumber,
          column: line.indexOf('rejectUnauthorized') + 1,
          filePath: filePath,
          type: 'insecure_tls_config_regex'
        });
      }

      // Check for other insecure patterns
      const insecurePatterns = [
        { pattern: /checkServerIdentity\s*:\s*false/i, message: 'Server identity check disabled' },
        { pattern: /secureProtocol\s*:\s*['"]SSL/i, message: 'Insecure SSL protocol used' },
        { pattern: /secureProtocol\s*:\s*['"]TLSv1['"]/i, message: 'Insecure TLS v1.0 protocol used' }
      ];

      insecurePatterns.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          violations.push({
            ruleId: this.ruleId,
            severity: 'warning',
            message: `${message}. Use secure TLS configuration.`,
            line: lineNumber,
            column: line.search(pattern) + 1,
            filePath: filePath,
            type: 'insecure_tls_pattern_regex'
          });
        }
      });
    });

    return violations;
  }
}

module.exports = S015ASTAnalyzer;
