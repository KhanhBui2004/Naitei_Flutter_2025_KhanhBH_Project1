/**
 * Custom ESLint rule for: C014 – Use Dependency Injection instead of direct instantiation
 * Rule ID: custom/c014
 * Purpose: Enforce dependency injection pattern by preventing direct class instantiation
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Use Dependency Injection instead of direct instantiation",
      recommended: false
    },
    schema: [],
    messages: {
      directInstantiation: "Avoid direct class instantiation. Use dependency injection instead."
    }
  },
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee &&
          node.callee.type === "Identifier" &&
          /^[A-Z]/.test(node.callee.name) // Class name starts with uppercase
        ) {
          context.report({
            node,
            messageId: "directInstantiation",
            data: {
              name: node.callee.name
            }
          });
        }
      }
    };
  }
};
