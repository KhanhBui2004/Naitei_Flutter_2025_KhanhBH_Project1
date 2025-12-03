/**
 * Custom ESLint rule for: C013 – Do not leave dead code commented out
 * Rule ID: custom/c013
 * Purpose: Prevent commented-out code from being left in the codebase to maintain cleanliness
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Do not leave dead code commented out",
      recommended: false
    },
    schema: [],
    messages: {
      deadCode: "Unreachable code detected after return statement. Remove dead code or restructure logic.",
      commentedCode: "Do not leave dead code commented out. Remove it or use version control to track changes."
    }
  },
  create(context) {
    function isTerminatingStatement(stmt) {
      return stmt.type === "ReturnStatement" ||
             stmt.type === "ThrowStatement" ||
             stmt.type === "ContinueStatement" ||
             stmt.type === "BreakStatement";
    }

    function isExecutableStatement(stmt) {
      // Exclude declarations and empty statements
      return stmt.type !== "EmptyStatement" &&
             stmt.type !== "FunctionDeclaration" &&
             stmt.type !== "VariableDeclaration" &&
             !stmt.type.includes("Declaration");
    }

    function checkBlockForUnreachableCode(node) {
      let unreachable = false;
      for (let i = 0; i < node.body.length; i++) {
        const stmt = node.body[i];
        
        if (unreachable && isExecutableStatement(stmt)) {
          context.report({
            node: stmt,
            messageId: "deadCode"
          });
        }

        if (isTerminatingStatement(stmt)) {
          unreachable = true;
        }
      }
    }

    return {
      // Handle unreachable code in all block statements
      BlockStatement: checkBlockForUnreachableCode,

      // Handle switch cases
      SwitchCase(node) {
        let unreachable = false;
        for (let i = 0; i < node.consequent.length; i++) {
          const stmt = node.consequent[i];
          
          if (unreachable && isExecutableStatement(stmt)) {
            context.report({
              node: stmt,
              messageId: "deadCode"
            });
          }

          if (isTerminatingStatement(stmt)) {
            unreachable = true;
          }
        }
      }
    };
  }
};
