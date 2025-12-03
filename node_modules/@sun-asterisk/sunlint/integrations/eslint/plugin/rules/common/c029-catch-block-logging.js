/**
 * Custom ESLint rule for: C029 – Every `catch` block must log the error cause
 * Rule ID: custom/c029
 * Goal: Catching errors without logging/rethrowing can hide bugs
 * 
 * NOTE: This ESLint rule provides basic catch block validation.
 * For enhanced analysis with context validation and multi-level severity,
 * use SunLint C029 which offers superior detection capabilities.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Every `catch` block must log the error cause (C029)",
      recommended: true,
      url: "https://coding-standards.sun.com/rules/c029"
    },
    schema: [],
    messages: {
      silentCatch: "Catch block must log error or rethrow - silent error handling hides bugs (C029)",
      emptyCatch: "Empty catch block - error is silently ignored (C029)"
    }
  },
  create(context) {
    return {
      CatchClause(node) {
        const body = node.body && node.body.body;
        
        // Check for empty catch blocks
        if (!Array.isArray(body) || body.length === 0) {
          context.report({
            node,
            messageId: "emptyCatch"
          });
          return;
        }

        const hasLogOrThrow = body.some(stmt => {
          // Check for throw statements
          if (stmt.type === "ThrowStatement") {
            return true;
          }

          // Check for test assertions (Jest patterns)
          if (stmt.type === "ExpressionStatement" &&
              stmt.expression.type === "CallExpression" &&
              stmt.expression.callee &&
              stmt.expression.callee.name === "expect") {
            return true;
          }

          // Check for Redux thunk error handling patterns
          if (stmt.type === "VariableDeclaration" &&
              stmt.declarations.some(decl => 
                decl.init && 
                decl.init.type === "CallExpression" &&
                decl.init.callee &&
                decl.init.callee.name === "handleAxiosError")) {
            return true;
          }

          // Check for return rejectWithValue
          if (stmt.type === "ReturnStatement" &&
              stmt.argument &&
              stmt.argument.type === "CallExpression" &&
              stmt.argument.callee &&
              stmt.argument.callee.name === "rejectWithValue") {
            return true;
          }

          // Check for dispatch calls (Redux patterns)
          if (stmt.type === "ExpressionStatement" &&
              stmt.expression.type === "CallExpression" &&
              stmt.expression.callee &&
              stmt.expression.callee.name === "dispatch") {
            return true;
          }

          // Check for console.log, console.error, console.warn
          if (stmt.type === "ExpressionStatement" &&
              stmt.expression.type === "CallExpression" &&
              stmt.expression.callee &&
              stmt.expression.callee.type === "MemberExpression" &&
              stmt.expression.callee.object.name === "console" &&
              (stmt.expression.callee.property.name === "log" ||
               stmt.expression.callee.property.name === "error" ||
               stmt.expression.callee.property.name === "warn")) {
            return true;
          }

          // Check for custom logger calls (logger.error, log.error, etc.)
          if (stmt.type === "ExpressionStatement" &&
              stmt.expression.type === "CallExpression" &&
              stmt.expression.callee &&
              stmt.expression.callee.type === "MemberExpression" &&
              (stmt.expression.callee.property.name === "error" ||
               stmt.expression.callee.property.name === "warn" ||
               stmt.expression.callee.property.name === "log")) {
            return true;
          }

          return false;
        });

        if (!hasLogOrThrow) {
          context.report({
            node,
            messageId: "silentCatch"
          });
        }
      }
    };
  }
};
