/**
 * Custom ESLint rule for: C047 – Logic retry không được viết lặp lại nhiều nơi
 * Rule ID: custom/c047
 * Purpose: Detect duplicate retry logic patterns and enforce centralized retry utilities
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Logic retry không được viết lặp lại nhiều nơi - use centralized retry utility instead",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          maxRetryPatterns: {
            type: "number",
            minimum: 1,
            default: 2,
            description: "Maximum number of retry patterns allowed before suggesting centralization"
          },
          allowedRetryUtils: {
            type: "array",
            items: { type: "string" },
            default: ["RetryUtil", "retryWithBackoff", "withRetry"],
            description: "Names of allowed centralized retry utilities"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      duplicateRetryLogic: "Duplicate retry logic detected ({{count}} occurrences). Consider using a centralized retry utility like RetryUtil.withRetry()",
      inlineRetryLogic: "Inline retry logic found. Consider using a centralized retry utility for consistency and maintainability.",
      suggestRetryUtil: "Use centralized retry utility instead of custom retry logic."
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const maxRetryPatterns = options.maxRetryPatterns || 2;
    const allowedRetryUtils = options.allowedRetryUtils || ["RetryUtil", "retryWithBackoff", "withRetry"];
    
    const retryPatterns = [];
    const sourceCode = context.getSourceCode();

    /**
     * Check if a node represents a retry pattern
     */
    function isRetryPattern(node) {
      // Pattern 1: for/while loop with try-catch for retry
      if ((node.type === "ForStatement" || node.type === "WhileStatement") && 
          node.body && node.body.type === "BlockStatement") {
        const hasRetryLogic = node.body.body.some(stmt => 
          stmt.type === "TryStatement" || 
          (stmt.type === "IfStatement" && hasRetryCondition(stmt))
        );
        return hasRetryLogic;
      }

      // Pattern 2: do-while with try-catch
      if (node.type === "DoWhileStatement" && 
          node.body && node.body.type === "BlockStatement") {
        return node.body.body.some(stmt => stmt.type === "TryStatement");
      }

      // Pattern 3: recursive function with retry logic
      if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
        return hasRecursiveRetryPattern(node);
      }

      return false;
    }

    /**
     * Check if statement has retry-related conditions
     */
    function hasRetryCondition(ifStmt) {
      if (!ifStmt.test) return false;
      
      const testText = sourceCode.getText(ifStmt.test).toLowerCase();
      return testText.includes('retry') || 
             testText.includes('attempt') || 
             testText.includes('tries') ||
             testText.includes('maxretries') ||
             testText.includes('maxattempts');
    }

    /**
     * Check if function has recursive retry pattern
     */
    function hasRecursiveRetryPattern(funcNode) {
      if (!funcNode.body || !funcNode.body.body) return false;
      
      const funcName = funcNode.id ? funcNode.id.name : null;
      if (!funcName) return false;

      // Look for recursive calls with retry logic
      const hasRecursiveCall = funcNode.body.body.some(stmt => {
        if (stmt.type === "TryStatement" && stmt.handler) {
          // Check if catch block has recursive call
          return containsRecursiveCall(stmt.handler.body, funcName);
        }
        return false;
      });

      return hasRecursiveCall;
    }

    /**
     * Check if block contains recursive call to the function
     */
    function containsRecursiveCall(block, funcName) {
      if (!block || !block.body) return false;
      
      return block.body.some(stmt => {
        if (stmt.type === "ReturnStatement" && stmt.argument) {
          return containsCallExpression(stmt.argument, funcName);
        }
        if (stmt.type === "ExpressionStatement") {
          return containsCallExpression(stmt.expression, funcName);
        }
        return false;
      });
    }

    /**
     * Check if expression contains call to specific function
     */
    function containsCallExpression(expr, funcName) {
      if (expr.type === "CallExpression" && 
          expr.callee && expr.callee.name === funcName) {
        return true;
      }
      
      if (expr.type === "AwaitExpression" && expr.argument) {
        return containsCallExpression(expr.argument, funcName);
      }
      
      return false;
    }

    /**
     * Check if node uses allowed retry utilities
     */
    function usesAllowedRetryUtil(node) {
      const nodeText = sourceCode.getText(node);
      return allowedRetryUtils.some(utilName => nodeText.includes(utilName));
    }

    /**
     * Get hash for retry pattern to detect duplicates
     */
    function getRetryPatternHash(node) {
      let text = sourceCode.getText(node);
      // Normalize text for comparison (remove variable names, whitespace)
      text = text
        .replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g, 'VAR') // Replace identifiers
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\/\*.*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, ''); // Remove line comments
      return text;
    }

    return {
      // Check for retry patterns in various constructs
      "ForStatement, WhileStatement, DoWhileStatement"(node) {
        if (isRetryPattern(node) && !usesAllowedRetryUtil(node)) {
          const hash = getRetryPatternHash(node);
          const existing = retryPatterns.find(p => p.hash === hash);
          
          if (existing) {
            existing.count++;
            existing.nodes.push(node);
          } else {
            retryPatterns.push({
              hash,
              count: 1,
              nodes: [node],
              type: node.type
            });
          }
        }
      },

      "FunctionDeclaration, FunctionExpression"(node) {
        if (isRetryPattern(node) && !usesAllowedRetryUtil(node)) {
          context.report({
            node,
            messageId: "inlineRetryLogic"
          });
        }
      },

      // Check for inline setTimeout/setInterval retry patterns
      "CallExpression"(node) {
        if (node.callee && 
            (node.callee.name === "setTimeout" || node.callee.name === "setInterval")) {
          const parent = node.parent;
          // Check if this setTimeout is part of retry logic
          if (parent && parent.type === "ExpressionStatement") {
            let current = parent.parent;
            while (current) {
              if (current.type === "TryStatement" || 
                  (current.type === "IfStatement" && hasRetryCondition(current))) {
                if (!usesAllowedRetryUtil(current)) {
                  context.report({
                    node: current,
                    messageId: "inlineRetryLogic"
                  });
                }
                break;
              }
              current = current.parent;
            }
          }
        }
      },

      // Report duplicates at end of program
      "Program:exit"() {
        retryPatterns.forEach(pattern => {
          if (pattern.count >= maxRetryPatterns) {
            pattern.nodes.forEach(node => {
              context.report({
                node,
                messageId: "duplicateRetryLogic",
                data: {
                  count: pattern.count
                }
              });
            });
          }
        });
      }
    };
  }
};
