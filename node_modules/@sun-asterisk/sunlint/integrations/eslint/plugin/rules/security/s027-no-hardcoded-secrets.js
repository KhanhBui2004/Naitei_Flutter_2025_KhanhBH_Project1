/**
 * Custom ESLint rule for: S027 – No hardcoded secrets
 * Rule ID: custom/s027
 * Purpose: Prevent passwords, API keys, secrets from being hardcoded
 */

"use strict";

const sensitiveKeywords = [
  "password",
  "pass",
  "pwd",
  "secret",
  "apiKey",
  "token",
  "auth",
  "key",
  "seed",
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent hardcoded passwords, API keys, and secrets",
      recommended: true,
    },
    schema: [],
    messages: {
      hardcodedSecret:
        "Avoid hardcoding sensitive information such as '{{name}}'. Use secure storage instead.",
    },
  },

  create(context) {
    function isSensitiveName(name) {
      const lower = name.toLowerCase();
      return sensitiveKeywords.some((keyword) => lower.includes(keyword));
    }

    return {
      VariableDeclarator(node) {
        if (
          node.id &&
          node.init &&
          (node.init.type === "Literal" || node.init.type === "TemplateLiteral")
        ) {
          const name =
            node.id.name || (node.id.property && node.id.property.name);
          if (name && isSensitiveName(name)) {
            context.report({
              node,
              messageId: "hardcodedSecret",
              data: { name },
            });
          }
        }
      },

      AssignmentExpression(node) {
        if (
          node.left &&
          node.right &&
          (node.right.type === "Literal" ||
            node.right.type === "TemplateLiteral")
        ) {
          const name =
            node.left.name || (node.left.property && node.left.property.name);
          if (name && isSensitiveName(name)) {
            context.report({
              node,
              messageId: "hardcodedSecret",
              data: { name },
            });
          }
        }
      },
    };
  },
};
