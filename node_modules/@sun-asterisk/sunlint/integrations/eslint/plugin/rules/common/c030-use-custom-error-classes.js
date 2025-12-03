/**
 * Custom ESLint rule for: C030 – Dùng custom error class thay vì dùng lỗi hệ thống trực tiếp
 * Rule ID: custom/c030
 * Purpose: Enforce using custom error classes instead of generic Error class for better error handling and categorization
 */

const c030Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Use custom error classes instead of generic Error class",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          allowGenericInTests: {
            type: "boolean",
            description: "Whether to allow generic Error in test files (default: true)"
          },
          allowedBuiltinErrors: {
            type: "array",
            items: { type: "string" },
            description: "Built-in error types that are allowed (e.g., TypeError, RangeError)"
          },
          customErrorClasses: {
            type: "array",
            items: { type: "string" },
            description: "Custom error class names that are recommended"
          },
          allowRethrow: {
            type: "boolean",
            description: "Whether to allow rethrowing caught errors (default: true)"
          },
          strictMode: {
            type: "boolean",
            description: "Enable strict mode - only custom errors allowed (default: false)"
          },
          requireErrorCode: {
            type: "boolean",
            description: "Require custom errors to have error codes (default: true)"
          },
          requireStatusCode: {
            type: "boolean",
            description: "Require custom errors for HTTP to have status codes (default: false)"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      useCustomError: "Use custom error class instead of generic 'Error'. Consider using specific error types like ValidationError, NotFoundError, BusinessRuleError, etc. Vietnamese: 'Dùng custom error class thay vì Error generic'",
      useSpecificBuiltin: "Consider using a more specific built-in error type like TypeError, RangeError, or a custom error class. Vietnamese: 'Cân nhắc dùng built-in error cụ thể hơn hoặc custom error class'",
      throwStringLiteral: "Use custom error classes instead of throwing string literals",
      throwTemplateLiteral: "Use custom error classes instead of throwing template literals", 
      throwNumber: "Use custom error classes instead of throwing numbers",
      throwVariable: "Use custom error classes instead of throwing variables",
      missingErrorCode: "Custom error class should include an error code property. Vietnamese: 'Custom error class nên có thuộc tính error code'",
      missingStatusCode: "HTTP-related error class should include a status code property. Vietnamese: 'Error class liên quan HTTP nên có thuộc tính status code'",
      preferCustomError: "Prefer custom error classes for better error categorization and handling. Vietnamese: 'Ưu tiên custom error classes để phân loại và xử lý lỗi tốt hơn'"
    },
    fixable: null
  },

  create(context) {
    const options = context.options[0] || {};

    // Default configuration
    const allowGenericInTests = options.allowGenericInTests !== false;
    const allowedBuiltinErrors = new Set(options.allowedBuiltinErrors || [
      'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'EvalError'
    ]);
    const customErrorClasses = new Set(options.customErrorClasses || [
      'ValidationError', 'NotFoundError', 'BusinessRuleError', 'BusinessError',
      'ExternalServiceError', 'AuthenticationError', 'AuthorizationError',
      'NetworkError', 'DatabaseError', 'ConfigurationError', 'TimeoutError'
    ]);
    const allowRethrow = options.allowRethrow !== false;
    const strictMode = options.strictMode || false;
    const requireErrorCode = options.requireErrorCode !== false;
    const requireStatusCode = options.requireStatusCode || false;

    const sourceCode = context.getSourceCode();
    const filename = context.getFilename();

    function isTestFile() {
      if (!allowGenericInTests) return false;

      const testPatterns = ['.test.', '.spec.', '__tests__', '/test/', '/tests/', '.e2e.', '.stories.'];
      return testPatterns.some(pattern => filename.includes(pattern));
    }

    function isRethrowStatement(node) {
      if (!allowRethrow) return false;

      // Check if throwing a caught error parameter
      if (node.argument && node.argument.type === 'Identifier') {
        // Look for catch clauses in parent scopes
        let parent = node.parent;
        while (parent) {
          if (parent.type === 'CatchClause' && 
              parent.param && 
              parent.param.name === node.argument.name) {
            return true;
          }
          parent = parent.parent;
        }
      }

      return false;
    }

    function getErrorClassName(node) {
      if (!node.argument) return null;

      if (node.argument.type === 'NewExpression' && node.argument.callee) {
        if (node.argument.callee.type === 'Identifier') {
          return node.argument.callee.name;
        }
        if (node.argument.callee.type === 'MemberExpression' && 
            node.argument.callee.property && 
            node.argument.callee.property.type === 'Identifier') {
          return node.argument.callee.property.name;
        }
      }

      return null;
    }

    function isCustomErrorClass(className) {
      if (!className) return false;

      // Check if it's a known custom error class
      if (customErrorClasses.has(className)) return true;

      // Check if it follows custom error naming patterns
      const customErrorPatterns = [
        /Error$/,           // Ends with 'Error'
        /Exception$/,       // Ends with 'Exception'
        /Failure$/,         // Ends with 'Failure'
        /Fault$/           // Ends with 'Fault'
      ];

      return customErrorPatterns.some(pattern => 
        pattern.test(className) && 
        !allowedBuiltinErrors.has(className) && 
        className !== 'Error'
      );
    }

    function checkErrorClassDefinition(node) {
      // Check if custom error class has required properties
      if (node.type === 'ClassDeclaration' && 
          node.id && 
          isCustomErrorClass(node.id.name)) {

        const className = node.id.name;
        const classBody = node.body.body;

        if (requireErrorCode) {
          const hasErrorCode = classBody.some(member => {
            if (member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
              return member.key && member.key.name === 'code';
            }
            if (member.type === 'MethodDefinition' && member.kind === 'constructor') {
              // Check if constructor sets error code
              const constructorBody = member.value.body.body;
              return constructorBody.some(stmt => {
                if (stmt.type === 'ExpressionStatement' && 
                    stmt.expression.type === 'AssignmentExpression' &&
                    stmt.expression.left.type === 'MemberExpression' &&
                    stmt.expression.left.property.name === 'code') {
                  return true;
                }
                return false;
              });
            }
            return false;
          });

          if (!hasErrorCode) {
            context.report({
              node: node.id,
              messageId: "missingErrorCode"
            });
          }
        }

        if (requireStatusCode && /http|api|web|service/i.test(className.toLowerCase())) {
          const hasStatusCode = classBody.some(member => {
            if (member.type === 'PropertyDefinition' || member.type === 'ClassProperty') {
              return member.key && (member.key.name === 'statusCode' || member.key.name === 'status');
            }
            if (member.type === 'MethodDefinition' && member.kind === 'constructor') {
              // Check if constructor sets status code
              const constructorBody = member.value.body.body;
              return constructorBody.some(stmt => {
                if (stmt.type === 'ExpressionStatement' && 
                    stmt.expression.type === 'AssignmentExpression' &&
                    stmt.expression.left.type === 'MemberExpression' &&
                    (stmt.expression.left.property.name === 'statusCode' || 
                     stmt.expression.left.property.name === 'status')) {
                  return true;
                }
                return false;
              });
            }
            return false;
          });

          if (!hasStatusCode) {
            context.report({
              node: node.id,
              messageId: "missingStatusCode"
            });
          }
        }
      }
    }

    return {
      ThrowStatement(node) {
        // Skip test files if allowed
        if (isTestFile()) return;

        // Skip rethrow statements if allowed
        if (isRethrowStatement(node)) return;

        // Handle different throw argument types
        if (node.argument) {
          // Check for new Error(...) constructors
          if (node.argument.type === 'NewExpression' && 
              node.argument.callee && 
              node.argument.callee.name === 'Error') {
            context.report({
              node: node.argument,
              messageId: "useCustomError"
            });
            return;
          }

          // Check for other built-in error constructors
          if (node.argument.type === 'NewExpression' && 
              node.argument.callee && 
              allowedBuiltinErrors.has(node.argument.callee.name)) {
            if (['TypeError', 'RangeError'].includes(node.argument.callee.name)) {
              context.report({
                node: node.argument,
                messageId: "useSpecificBuiltin"
              });
            }
            return;
          }

          // Check for throwing string literals
          if (node.argument.type === 'Literal' && typeof node.argument.value === 'string') {
            context.report({
              node: node.argument,
              messageId: "throwStringLiteral"
            });
            return;
          }

          // Check for throwing template literals
          if (node.argument.type === 'TemplateLiteral') {
            context.report({
              node: node.argument,
              messageId: "throwTemplateLiteral"
            });
            return;
          }

          // Check for throwing numbers
          if (node.argument.type === 'Literal' && typeof node.argument.value === 'number') {
            context.report({
              node: node.argument,
              messageId: "throwNumber"
            });
            return;
          }

          // Check for throwing variables (identifiers)
          if (node.argument.type === 'Identifier') {
            context.report({
              node: node.argument,
              messageId: "throwVariable"
            });
            return;
          }
        }
      },

      ClassDeclaration(node) {
        checkErrorClassDefinition(node);
      },

      // Check for Promise.reject with generic Error
      'CallExpression[callee.type="MemberExpression"][callee.object.name="Promise"][callee.property.name="reject"]'(node) {
        if (isTestFile()) return;

        const arg = node.arguments[0];
        if (arg && arg.type === 'NewExpression' && 
            arg.callee && arg.callee.name === 'Error') {
          context.report({
            node: arg,
            messageId: "useCustomError"
          });
        }
      },

      // Check for async function error throwing
      'AwaitExpression > CallExpression[callee.type="MemberExpression"][callee.property.name="reject"]'(node) {
        if (isTestFile()) return;

        const arg = node.arguments[0];
        if (arg && arg.type === 'NewExpression' && 
            arg.callee && arg.callee.name === 'Error') {
          context.report({
            node: arg,
            messageId: "useCustomError"
          });
        }
      }
    };
  }
};

module.exports = c030Rule;