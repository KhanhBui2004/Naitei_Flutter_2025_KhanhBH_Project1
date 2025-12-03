const { traverse } = require('@babel/traverse');
const t = require('@babel/types');

class C073SymbolBasedAnalyzer {
  constructor(options = {}) {
    this.options = options;
    this.configModules = options.configModules || {};
    this.envAccessors = options.envAccessors || {};
    this.schemaDetectors = options.schemaDetectors || {};
    this.failFastSignals = options.failFastSignals || {};
    this.dangerousDefaults = options.dangerousDefaults || [];
    this.policy = options.policy || {};
  }

  analyze(ast, filePath, content) {
    const analysis = {
      envAccess: [],
      schemaValidation: [],
      failFastMechanisms: [],
      dangerousDefaults: [],
      connectivityChecks: [],
      imports: [],
      configValidation: false,
      hasFailFast: false
    };

    const language = this.detectLanguageFromPath(filePath);
    
    // Analyze both config files and service files for different patterns
    const isConfigFile = this.isConfigOrStartupFile(filePath, language);

    // Traverse AST to collect information
    traverse(ast, {
      // Track imports for schema validation libraries
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        analysis.imports.push(source);
        
        // Check for schema validation libraries
        if (this.isSchemaValidationLibrary(source, language)) {
          analysis.schemaValidation.push({
            library: source,
            line: path.node.loc?.start.line || 1
          });
        }
      },

      // Track environment variable access
      MemberExpression: (path) => {
        if (this.isEnvAccess(path.node, language)) {
          const envProperty = this.getEnvProperty(path.node);
          analysis.envAccess.push({
            variable: envProperty,
            match: `process.env.${envProperty}`,
            line: path.node.loc?.start.line || 1,
            hasDefault: this.hasDefaultValue(path.parent)
          });
        }
      },

      // Track call expressions for multiple purposes
      CallExpression: (path) => {
        const node = path.node;
        
        // Check for require statements
        if (t.isIdentifier(node.callee, { name: 'require' })) {
          const source = node.arguments[0]?.value;
          if (source && this.isSchemaValidationLibrary(source, language)) {
            analysis.schemaValidation.push({
              library: source,
              line: node.loc?.start.line || 1
            });
          }
        }

        // Check for fail-fast calls (process.exit, throw, etc.)
        if (this.isFailFastCall(node, language)) {
          analysis.failFastMechanisms.push({
            type: this.getFailFastType(node),
            line: node.loc?.start.line || 1
          });
        }

        // Check for connectivity patterns (ping, connect, health check)
        if (this.isConnectivityCheck(node)) {
          analysis.connectivityChecks.push({
            method: this.getConnectivityMethod(node),
            line: node.loc?.start.line || 1
          });
        }
      },

      // Track dangerous default patterns
      LogicalExpression: (path) => {
        if (this.isDangerousDefault(path.node)) {
          analysis.dangerousDefaults.push({
            operator: path.node.operator,
            pattern: this.getDangerousDefaultPattern(path.node),
            line: path.node.loc?.start.line || 1
          });
        }
      },

      // Track conditional expressions with dangerous defaults
      ConditionalExpression: (path) => {
        if (this.isDangerousConditionalDefault(path.node)) {
          analysis.dangerousDefaults.push({
            type: 'conditional',
            pattern: this.getDangerousDefaultPattern(path.node),
            line: path.node.loc?.start.line || 1
          });
        }
      },

      // Check for validation patterns
      IfStatement: (path) => {
        if (this.isConfigValidation(path.node, analysis.envAccess)) {
          analysis.configValidation = true;
        }
      },

      // Check for throw statements with configuration errors
      ThrowStatement: (path) => {
        if (this.isConfigRelatedError(path.node)) {
          analysis.failFastMechanisms.push({
            type: 'throw',
            line: path.node.loc?.start.line || 1
          });
        }
      }
    });

    return analysis;
  }

  detectLanguageFromPath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return 'typescript';
    if (['java'].includes(ext)) return 'java';
    if (['go'].includes(ext)) return 'go';
    return null;
  }

  isConfigOrStartupFile(filePath, language) {
    const configPatterns = this.configModules[language] || [];
    return configPatterns.some(pattern => {
      const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      const regex = new RegExp(globPattern.replace(/\//g, '\\/'));
      return regex.test(filePath);
    });
  }

  isSchemaValidationLibrary(source, language) {
    const libraries = this.schemaDetectors[language] || [];
    return libraries.some(lib => source.includes(lib));
  }

  isEnvAccess(node, language) {
    if (language === 'typescript') {
      // process.env.VARIABLE
      return (
        t.isMemberExpression(node) &&
        t.isMemberExpression(node.object) &&
        t.isIdentifier(node.object.object, { name: 'process' }) &&
        t.isIdentifier(node.object.property, { name: 'env' })
      );
    }
    return false;
  }

  getEnvProperty(node) {
    if (t.isIdentifier(node.property)) {
      return node.property.name;
    }
    if (t.isStringLiteral(node.property)) {
      return node.property.value;
    }
    return 'unknown';
  }

  hasDefaultValue(parent) {
    return (
      t.isLogicalExpression(parent) ||
      t.isConditionalExpression(parent) ||
      (t.isAssignmentExpression(parent) && parent.right)
    );
  }

  isFailFastCall(node, language) {
    if (language === 'typescript') {
      // process.exit(1)
      if (
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object, { name: 'process' }) &&
        t.isIdentifier(node.callee.property, { name: 'exit' })
      ) {
        return true;
      }
    }
    return false;
  }

  getFailFastType(node) {
    if (t.isMemberExpression(node.callee)) {
      if (t.isIdentifier(node.callee.property, { name: 'exit' })) {
        return 'process.exit';
      }
    }
    if (t.isThrowStatement(node)) {
      return 'throw';
    }
    return 'unknown';
  }

  isConnectivityCheck(node) {
    if (!t.isCallExpression(node)) return false;
    
    // Check for common connectivity patterns
    const patterns = [
      'ping', 'connect', 'healthCheck', 'testConnection',
      'validateConnection', 'checkHealth', 'authenticate'
    ];
    
    if (t.isMemberExpression(node.callee)) {
      const methodName = node.callee.property?.name;
      return patterns.includes(methodName);
    }
    
    if (t.isIdentifier(node.callee)) {
      return patterns.includes(node.callee.name);
    }
    
    return false;
  }

  getConnectivityMethod(node) {
    if (t.isMemberExpression(node.callee)) {
      return node.callee.property?.name || 'unknown';
    }
    if (t.isIdentifier(node.callee)) {
      return node.callee.name;
    }
    return 'unknown';
  }

  isDangerousDefault(node) {
    if (!t.isLogicalExpression(node, { operator: '||' })) {
      return false;
    }
    
    const rightValue = this.getDefaultValue(node.right);
    const dangerousPatterns = [
      "''", '""', '0', 'null', 'undefined',
      "'localhost'", "'http://localhost'", "'dev'", "'development'"
    ];
    
    return dangerousPatterns.includes(rightValue);
  }

  isDangerousConditionalDefault(node) {
    if (!t.isConditionalExpression(node)) return false;
    
    const consequent = this.getDefaultValue(node.consequent);
    const alternate = this.getDefaultValue(node.alternate);
    
    const dangerousPatterns = [
      "''", '""', '0', 'null', 'undefined',
      "'localhost'", "'http://localhost'", "'dev'", "'development'"
    ];
    
    return dangerousPatterns.includes(consequent) || dangerousPatterns.includes(alternate);
  }

  getDangerousDefaultPattern(node) {
    if (t.isLogicalExpression(node)) {
      return this.getDefaultValue(node.right);
    }
    if (t.isConditionalExpression(node)) {
      const consequent = this.getDefaultValue(node.consequent);
      const alternate = this.getDefaultValue(node.alternate);
      return `${consequent} ? ${alternate}`;
    }
    return 'unknown';
  }

  getDefaultValue(node) {
    if (t.isStringLiteral(node)) {
      return `'${node.value}'`;
    }
    if (t.isNumericLiteral(node)) {
      return node.value.toString();
    }
    if (t.isNullLiteral(node)) {
      return 'null';
    }
    if (t.isIdentifier(node, { name: 'undefined' })) {
      return 'undefined';
    }
    return 'unknown';
  }

  isConfigValidation(node, envAccess) {
    // Simple heuristic: if an if statement contains a check for environment variables
    // and has a throw or process.exit in the consequent, it's likely validation
    if (t.isIfStatement(node)) {
      const test = node.test;
      const consequent = node.consequent;
      
      // Check if test involves environment variables
      const involvesEnv = this.containsEnvAccess(test);
      
      // Check if consequent has fail-fast behavior
      const hasFailFast = this.containsFailFast(consequent);
      
      return involvesEnv && hasFailFast;
    }
    
    return false;
  }

  containsEnvAccess(node) {
    // Simple traversal to check if node contains process.env access
    let hasEnvAccess = false;
    
    traverse(node, {
      MemberExpression: (path) => {
        if (this.isEnvAccess(path.node, 'typescript')) {
          hasEnvAccess = true;
          path.stop();
        }
      }
    }, null, {});
    
    return hasEnvAccess;
  }

  containsFailFast(node) {
    // Check if node contains fail-fast patterns
    let hasFailFast = false;
    
    traverse(node, {
      CallExpression: (path) => {
        if (this.isFailFastCall(path.node, 'typescript')) {
          hasFailFast = true;
          path.stop();
        }
      },
      ThrowStatement: () => {
        hasFailFast = true;
      }
    }, null, {});
    
    return hasFailFast;
  }

  isConfigRelatedError(node) {
    // Check if the error message is configuration-related
    if (t.isThrowStatement(node) && t.isNewExpression(node.argument)) {
      const args = node.argument.arguments;
      if (args.length > 0 && t.isStringLiteral(args[0])) {
        const message = args[0].value.toLowerCase();
        const configKeywords = ['config', 'environment', 'env', 'missing', 'required', 'invalid'];
        return configKeywords.some(keyword => message.includes(keyword));
      }
    }
    return false;
  }
}

module.exports = C073SymbolBasedAnalyzer;
