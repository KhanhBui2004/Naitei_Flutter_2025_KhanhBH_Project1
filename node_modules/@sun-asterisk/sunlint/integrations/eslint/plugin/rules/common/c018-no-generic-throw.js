/**
 * Custom ESLint rule for: C018 – Do not throw generic errors, always use specific messages
 * Rule ID: custom/c018
 * Purpose: Enforce specific error messages when throwing errors to improve debugging and error handling
 */

const c018Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Do not throw generic errors, always use specific messages",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          allowGenericInTests: {
            type: "boolean",
            description: "Whether to allow generic throws in test files (default: true)"
          },
          allowRethrow: {
            type: "boolean",
            description: "Whether to allow rethrowing caught errors (default: true)"
          },
          allowThrowVariable: {
            type: "boolean",
            description: "Whether to allow throwing variables/identifiers (default: false)"
          },
          requiredMessagePatterns: {
            type: "array",
            items: { type: "string" },
            description: "Regex patterns that error messages must match"
          },
          minimumMessageLength: {
            type: "number",
            description: "Minimum length for error messages (default: 10)"
          },
          allowedGenericMessages: {
            type: "array",
            items: { type: "string" },
            description: "List of allowed generic messages"
          },
          customErrorClasses: {
            type: "array",
            items: { type: "string" },
            description: "Custom error class names that are allowed"
          },
          strictMode: {
            type: "boolean",
            description: "Enable strict mode with additional checks (default: false)"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      genericError: "Do not throw generic errors. Provide a specific error message.",
      emptyError: "Error message cannot be empty. Provide a specific error message.",
      messageToolShort: "Error message too short (minimum {{minLength}} characters). Vietnamese: 'Message error quá ngắn (tối thiểu {{minLength}} ký tự)'",
      genericErrorMessage: "Generic error message '{{message}}' should be more specific. Vietnamese: 'Message error generic nên cụ thể hơn'",
      throwWithoutMessage: "Throw statement must include a specific error message. Vietnamese: 'Throw statement phải có message error cụ thể'",
      useSpecificErrorClass: "Use specific error class instead of generic Error. Vietnamese: 'Dùng error class cụ thể thay vì Error generic'",
      invalidMessagePattern: "Error message doesn't match required patterns. Vietnamese: 'Message error không khớp pattern yêu cầu'",
      throwBareString: "Throwing bare string is not recommended, use Error object with message. Vietnamese: 'Throw string trực tiếp không khuyến khích, dùng Error object với message'"
    },
    fixable: null
  },

  create(context) {
    const options = context.options[0] || {};
    
    // Default configuration
    const allowGenericInTests = options.allowGenericInTests !== false;
    const allowRethrow = options.allowRethrow !== false;
    const allowThrowVariable = options.allowThrowVariable || false;
    const requiredMessagePatterns = options.requiredMessagePatterns || [];
    const minimumMessageLength = options.minimumMessageLength || 10;
    const allowedGenericMessages = new Set(options.allowedGenericMessages || []);
    const customErrorClasses = new Set(options.customErrorClasses || ['ValidationError', 'BusinessError', 'NetworkError', 'AuthenticationError', 'AuthorizationError']);
    const strictMode = options.strictMode || false;

    const sourceCode = context.getSourceCode();
    const filename = context.getFilename();

    // Generic error messages to detect
    const genericMessages = new Set([
      'error',
      'Error',
      'ERROR',
      'something went wrong',
      'something failed',
      'operation failed',
      'invalid',
      'invalid input',
      'bad input',
      'error occurred',
      'an error occurred',
      'failed',
      'failure',
      'exception',
      'unexpected error',
      'internal error',
      'system error',
      'unknown error'
    ]);

    function isTestFile() {
      if (!allowGenericInTests) return false;
      
      const testPatterns = ['.test.', '.spec.', '__tests__', '/test/', '/tests/', '.e2e.'];
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

    function getErrorMessage(node) {
      if (!node.argument) return null;

      // Direct string literal
      if (node.argument.type === 'Literal') {
        return node.argument.value;
      }

      // new Error("message")
      if (node.argument.type === 'NewExpression' && 
          node.argument.callee && 
          node.argument.arguments && 
          node.argument.arguments.length > 0) {
        const firstArg = node.argument.arguments[0];
        if (firstArg.type === 'Literal') {
          return firstArg.value;
        }
      }

      return null;
    }

    function getErrorClassName(node) {
      if (node.argument && 
          node.argument.type === 'NewExpression' && 
          node.argument.callee) {
        if (node.argument.callee.type === 'Identifier') {
          return node.argument.callee.name;
        }
      }
      return null;
    }

    function isGenericErrorMessage(message) {
      if (typeof message !== 'string') return false;
      
      const normalizedMessage = message.toLowerCase().trim();
      return genericMessages.has(normalizedMessage) || 
             genericMessages.has(message.trim());
    }

    function isMessageTooShort(message) {
      if (typeof message !== 'string') return false;
      return message.trim().length < minimumMessageLength;
    }

    function matchesRequiredPatterns(message) {
      if (requiredMessagePatterns.length === 0) return true;
      if (typeof message !== 'string') return false;
      
      return requiredMessagePatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern);
          return regex.test(message);
        } catch (e) {
          return false;
        }
      });
    }

    function isAllowedGenericMessage(message) {
      if (typeof message !== 'string') return false;
      return allowedGenericMessages.has(message.trim());
    }

    function checkThrowStatement(node) {
      // Skip if in test file and allowed
      if (isTestFile()) {
        return;
      }

      // Skip if this is a rethrow
      if (isRethrowStatement(node)) {
        return;
      }

      // Check for throw without argument
      if (!node.argument) {
        context.report({
          node,
          messageId: 'throwWithoutMessage'
        });
        return;
      }

      // Check for throwing variables/identifiers
      if (node.argument.type === 'Identifier' && !allowThrowVariable) {
        context.report({
          node,
          messageId: 'genericError'
        });
        return;
      }

      // Check for throwing bare strings
      if (node.argument.type === 'Literal' && typeof node.argument.value === 'string') {
        if (strictMode) {
          context.report({
            node,
            messageId: 'throwBareString'
          });
          return;
        }
        
        const message = node.argument.value;
        validateMessage(node, message);
        return;
      }

      // Check for new Error() constructions
      if (node.argument.type === 'NewExpression') {
        const errorClassName = getErrorClassName(node);
        const errorMessage = getErrorMessage(node);

        // Check error class
        if (strictMode && errorClassName === 'Error') {
          context.report({
            node,
            messageId: 'useSpecificErrorClass'
          });
        }

        // Check error message
        if (errorMessage !== null) {
          validateMessage(node, errorMessage);
        } else if (node.argument.arguments.length === 0) {
          context.report({
            node,
            messageId: 'throwWithoutMessage'
          });
        }
        return;
      }

      // Generic throw statement
      context.report({
        node,
        messageId: 'genericError'
      });
    }

    function validateMessage(node, message) {
      if (!message || typeof message !== 'string') {
        context.report({
          node,
          messageId: 'throwWithoutMessage'
        });
        return;
      }

      // Check for empty or whitespace-only message
      if (message.trim() === '') {
        context.report({
          node,
          messageId: 'emptyError'
        });
        return;
      }

      // Check if message is allowed generic
      if (isAllowedGenericMessage(message)) {
        return;
      }

      // Check for generic messages
      if (isGenericErrorMessage(message)) {
        context.report({
          node,
          messageId: 'genericErrorMessage',
          data: { message: message.trim() }
        });
        return;
      }

      // Check message length
      if (isMessageTooShort(message)) {
        context.report({
          node,
          messageId: 'messageToolShort',
          data: { minLength: minimumMessageLength }
        });
        return;
      }

      // Check required patterns
      if (!matchesRequiredPatterns(message)) {
        context.report({
          node,
          messageId: 'invalidMessagePattern'
        });
        return;
      }
    }

    return {
      ThrowStatement: checkThrowStatement
    };
  }
};

module.exports = c018Rule;