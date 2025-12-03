/**
 * Custom ESLint rule for: S011 – UUID must be version 4 and use CSPRNG
 * Rule ID: custom/s011
 * Purpose: Prevent usage of UUID.randomUUID() in security-sensitive contexts.
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow use of UUID.randomUUID() for sensitive identifiers. Use SecureRandom-based UUIDs instead.",
      recommended: true,
    },
    schema: [],
    messages: {
      insecureUuid: "Do not use UUID.randomUUID() for '{{context}}'. Use a UUID v4 generator with SecureRandom instead.",
    },
  },

  create(context) {
    const sensitiveKeywords = [
      "token", "session", "reset", "password", "link", "key", "auth", "uuid", "guid",
    ];

    function containsSensitiveKeyword(name = "") {
      const lower = name.toLowerCase();
      return sensitiveKeywords.some(keyword => lower.includes(keyword));
    }

    function getEnclosingFunctionOrVariableName(node) {
      let current = node;
      while (current) {
        if (current.type === "FunctionDeclaration" || current.type === "FunctionExpression" || current.type === "ArrowFunctionExpression") {
          return current.id?.name || "<anonymous>";
        }
        if (current.type === "VariableDeclarator" && current.id?.type === "Identifier") {
          return current.id.name;
        }
        current = current.parent;
      }
      return "";
    }

    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "UUID" &&
          node.callee.property.name === "randomUUID"
        ) {
          const contextName = getEnclosingFunctionOrVariableName(node);
          if (containsSensitiveKeyword(contextName)) {
            context.report({
              node,
              messageId: "insecureUuid",
              data: { context: contextName },
            });
          }
        }
      },
    };
  },
};
