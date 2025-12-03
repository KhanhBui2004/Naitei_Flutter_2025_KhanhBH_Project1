/**
 * Custom ESLint rule for: C043 – Do not use `console.log` or `print` in production code
 * Rule ID: custom/c043
 * Purpose: Prevent usage of console logging in production code to maintain clean logs and security
 */

const c045Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Do not use `console.log` or `print` in production code",
      recommended: false
    },
    schema: [],
    messages: {
      noConsole: "Do not use console.log in production code. Use proper logging instead.",
      noPrint: "Do not use print in production code. Use proper logging instead."
    },
    fixable: "code"
  },

  create(context) {
    const options = context.options[0] || {};
    
    // Default allowed console methods (typically for errors/warnings)
    const allowedMethods = new Set(options.allowedMethods || ['error', 'warn']);
    
    const allowInDevelopment = options.allowInDevelopment !== false;
    const allowInTests = options.allowInTests !== false;
    
    // Default patterns for test files
    const testFilePatterns = options.testFilePatterns || [
      '.test.', '.spec.', '__tests__', '/test/', '/tests/', '.test.ts', '.test.js',
      '.spec.ts', '.spec.js', 'test.tsx', 'spec.tsx'
    ];
    
    // Default patterns for development files  
    const developmentPatterns = options.developmentPatterns || [
      '.dev.', '.development.', '.debug.', '/dev/', '/development/'
    ];
    
    // Development environment flags
    const developmentFlags = new Set(options.developmentFlags || [
      '__DEV__', 'DEBUG', 'process.env.NODE_ENV', 'process.env.ENVIRONMENT',
      'process.env.ENABLE_LOGGING', 'FEATURES.debug', 'BUILD_TYPE'
    ]);
    
    // Other forbidden objects/functions
    const allowedObjects = options.allowedObjects || ['print', 'alert', 'confirm', 'prompt'];
    const forbiddenObjects = new Set(['console', ...allowedObjects]);

    // Common console methods to check
    const consoleMethods = new Set([
      'log', 'info', 'debug', 'trace', 'dir', 'dirxml', 'table',
      'count', 'countReset', 'time', 'timeEnd', 'timeLog',
      'assert', 'clear', 'group', 'groupCollapsed', 'groupEnd',
      'profile', 'profileEnd', 'timeStamp'
    ]);

    // Get current file information
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    function isTestFile() {
      return testFilePatterns.some(pattern => filename.includes(pattern));
    }

    function isDevelopmentFile() {
      return developmentPatterns.some(pattern => filename.includes(pattern));
    }

    // Recursively check all sub-expressions for development flags
    function containsDevelopmentFlag(node) {
      if (!node) return false;
      // Direct flag usage (__DEV__, DEBUG)
      if (node.type === 'Identifier' && developmentFlags.has(node.name)) {
        return true;
      }
      // process.env.NODE_ENV === 'development'
      if (node.type === 'BinaryExpression' && node.operator === '===' && node.right.value === 'development') {
        const left = node.left;
        if (left.type === 'MemberExpression' &&
            left.object.type === 'MemberExpression' &&
            left.object.object.name === 'process' &&
            left.object.property.name === 'env') {
          const envVar = left.property.name;
          if (envVar === 'NODE_ENV' || developmentFlags.has(`process.env.${envVar}`)) {
            return true;
          }
        }
      }
      // process.env.<VAR> === 'true'
      if (node.type === 'BinaryExpression' && node.operator === '===' && node.right.value === 'true') {
        const left = node.left;
        if (left.type === 'MemberExpression' &&
            left.object.type === 'MemberExpression' &&
            left.object.object.name === 'process' &&
            left.object.property.name === 'env') {
          const envVar = left.property.name;
          if (developmentFlags.has(`process.env.${envVar}`)) {
            return true;
          }
        }
      }
      // Feature flags (FEATURES.debug, etc.)
      if (node.type === 'MemberExpression' &&
          node.object.type === 'Identifier' &&
          node.property.type === 'Identifier') {
        const objectName = node.object.name;
        const propertyName = node.property.name;
        if (developmentFlags.has(`${objectName}.${propertyName}`)) {
          return true;
        }
      }
      // Logical expressions (||, &&)
      if (node.type === 'LogicalExpression') {
        return containsDevelopmentFlag(node.left) || containsDevelopmentFlag(node.right);
      }
      // Nested binary/logical expressions
      if (node.left && containsDevelopmentFlag(node.left)) return true;
      if (node.right && containsDevelopmentFlag(node.right)) return true;
      return false;
    }

    // Walk up the AST to see if inside any IfStatement with a dev/debug flag
    function isInDevelopmentContext(node) {
      let current = node;
      while (current && current.parent) {
        if (current.parent.type === 'IfStatement') {
          const test = current.parent.test;
          if (containsDevelopmentFlag(test)) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    function shouldAllowCall(node) {
      if (allowInTests && isTestFile()) {
        return true;
      }
      if (allowInDevelopment && (isDevelopmentFile() || isInDevelopmentContext(node))) {
        return true;
      }
      return false;
    }

    function checkConsoleCall(node) {
      if (!node.callee) return;

      // Check for console.method() calls
      if (node.callee.type === 'MemberExpression') {
        const object = node.callee.object;
        const property = node.callee.property;
        
        if (object && property && 
            object.type === 'Identifier' && 
            property.type === 'Identifier') {
          
          const objectName = object.name;
          const methodName = property.name;
          
          // Check console calls
          if (objectName === 'console') {
            // Skip if method is explicitly allowed
            if (allowedMethods.has(methodName)) {
              return;
            }
            
            // Skip if file context allows it
            if (shouldAllowCall(node)) {
              return;
            }
            
            // Report console violation
            if (consoleMethods.has(methodName) || methodName === 'log') {
              context.report({
                node,
                messageId: methodName === 'log' ? "noConsole" : "noConsole",
                data: { method: methodName },
                fix(fixer) {
                  // Offer to remove the entire statement
                  const statement = findStatementNode(node);
                  if (statement) {
                    return fixer.remove(statement);
                  }
                  return null;
                }
              });
            }
          }
          
          // Check other forbidden objects (print, alert, etc.)
          else if (forbiddenObjects.has(objectName) && objectName !== 'console') {
            if (shouldAllowCall(node)) {
              return;
            }
            
            context.report({
              node,
              messageId: objectName === 'alert' ? "noConsole" : "noPrint",
              data: { object: objectName, method: methodName }
            });
          }
        }
      }
      
      // Check for direct function calls (print(), alert(), etc.)
      else if (node.callee.type === 'Identifier') {
        const functionName = node.callee.name;
        
        // Check for standalone forbidden functions
        if (['print', 'alert', 'confirm', 'prompt'].includes(functionName)) {
          if (shouldAllowCall(node)) {
            return;
          }
          
          context.report({
            node,
            messageId: functionName === 'alert' ? "noConsole" : "noPrint",
            data: { method: functionName }
          });
        }
      }
    }

    function findStatementNode(node) {
      let current = node;
      while (current && current.parent) {
        if (current.parent.type === 'ExpressionStatement') {
          return current.parent;
        }
        if (current.parent.type === 'Program' || 
            current.parent.type === 'BlockStatement') {
          break;
        }
        current = current.parent;
      }
      return null;
    }

    function checkTemplateLiteral(node) {
      // Check for console calls in template literals (less common but possible)
      if (node.expressions) {
        node.expressions.forEach(expr => {
          if (expr.type === 'CallExpression') {
            checkConsoleCall(expr);
          }
        });
      }
    }

    function checkDebugger(node) {
      // Also flag debugger statements
      if (!shouldAllowCall(node)) {
        context.report({
          node,
          message: "Debugger statements should not be used in production code.",
          fix(fixer) {
            const statement = findStatementNode(node);
            if (statement) {
              return fixer.remove(statement);
            }
            return fixer.remove(node);
          }
        });
      }
    }

    return {
      CallExpression: checkConsoleCall,
      TemplateLiteral: checkTemplateLiteral,
      DebuggerStatement: checkDebugger,
      
      // Also check for console calls in other contexts
      MemberExpression(node) {
        // Flag console object access even without calls
        if (node.object && 
            node.object.type === 'Identifier' && 
            node.object.name === 'console' &&
            node.property &&
            node.property.type === 'Identifier') {
          
          const methodName = node.property.name;
          if (!allowedMethods.has(methodName) && !shouldAllowCall(node)) {
            context.report({
              node,
              messageId: "noConsole",
              data: { method: methodName }
            });
          }
        }
      }
    };
  }
};

module.exports = c045Rule;