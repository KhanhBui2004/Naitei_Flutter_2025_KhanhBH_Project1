"use strict";

/**
 * S018 – Positive Input Validation
 * OWASP ASVS 5.1.3
 * Ensure that all input is validated using positive validation (allow lists).
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure input validation uses allow lists (whitelisting), not deny lists (blacklisting) wherever possible.",
      recommended: true,
    },
    schema: [],
    messages: {
      denyList:
        "Do not use deny lists (blacklisting) for input validation. Use allow lists (whitelisting) instead.",
    },
  },

  create(context) {
    // Detect use of common denylist patterns
    function isDenyListCheck(node) {
      // Example: if (input.includes('badword')) { ... }
      return (
        node &&
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        (node.callee.property.name === "includes" ||
          node.callee.property.name === "indexOf") &&
        node.arguments.length &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string"
      );
    }

    return {
      IfStatement(node) {
        if (
          node.test &&
          ((node.test.type === "UnaryExpression" &&
            isDenyListCheck(node.test.argument)) ||
            (node.test.type === "CallExpression" && isDenyListCheck(node.test)))
        ) {
          context.report({
            node: node.test,
            messageId: "denyList",
          });
        }
      },
    };
  },
};
