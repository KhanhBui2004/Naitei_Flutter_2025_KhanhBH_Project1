/**
 * ESLint rule S020: Avoid eval() and dynamic code execution
 * Prevents Remote Code Execution vulnerabilities
 * OWASP ASVS 5.2.4 compliance
 */

const ZERO_INDEX = 0;

const s020Rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Avoid eval() and dynamic code execution to prevent RCE vulnerabilities",
      category: "Security",
      recommended: "error"
    },
    messages: {
      avoidEval: "Avoid eval() - use JSON.parse() or safer alternatives to prevent RCE",
      avoidFunction: "Avoid Function constructor - use regular functions to prevent code injection",
      avoidStringTimeout: "Avoid string arguments in setTimeout/setInterval - use function references",
      avoidDynamicExecution: "Avoid dynamic code execution - sanitize and validate all inputs"
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        // Check for eval() usage
        if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
          context.report({
            node,
            messageId: 'avoidEval'
          });
        }

        // Check for setTimeout/setInterval with string arguments
        if (node.callee.type === 'Identifier' && 
            (node.callee.name === 'setTimeout' || node.callee.name === 'setInterval')) {
          if (node.arguments.length > ZERO_INDEX && 
              node.arguments[ZERO_INDEX].type === 'Literal' && 
              typeof node.arguments[ZERO_INDEX].value === 'string') {
            context.report({
              node,
              messageId: 'avoidStringTimeout'
            });
          }
        }

        // Check for dynamic script execution methods
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          if (methodName === 'executeScript' || methodName === 'executeJavaScript') {
            context.report({
              node,
              messageId: 'avoidDynamicExecution'
            });
          }
        }
      },

      NewExpression(node) {
        // Check for new Function() constructor
        if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
          context.report({
            node,
            messageId: 'avoidFunction'
          });
        }
      },

      MemberExpression(node) {
        // Check for indirect eval access via window/global
        if (node.property.type === 'Identifier' && node.property.name === 'eval') {
          if (node.object.type === 'Identifier') {
            const objectName = node.object.name;
            if (objectName === 'window' || objectName === 'global' || objectName === 'globalThis') {
              context.report({
                node,
                messageId: 'avoidEval'
              });
            }
          }
        }
      }
    };
  }
};

module.exports = s020Rule;
