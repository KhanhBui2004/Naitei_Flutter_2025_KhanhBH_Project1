/**
 * Custom ESLint rule for: S010 – Insecure random generator used in sensitive context
 * Rule ID: custom/s010
 * Purpose: Disallow Math.random(), UUID, or insecure Random-like usage in sensitive variables (token, password, etc.)
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow insecure random generators (Math.random, UUID, etc.) for sensitive values like tokens, passwords",
      recommended: true,
    },
    schema: [],
    messages: {
      insecureRandom:
        "Do not use insecure random generator '{{name}}' for sensitive values. Use crypto.randomBytes or a CSPRNG instead.",
    },
  },

  create(context) {
    const sensitiveKeywords = [
      "token",
      "otp",
      "session",
      "reset",
      "password",
      "link",
      "key",
      "auth",
    ];

    // Check if a string contains any sensitive keyword
    function isSensitiveName(name) {
      return sensitiveKeywords.some((kw) => name.toLowerCase().includes(kw));
    }

    function isInSensitiveContext(node) {
      const variable = findNearestVariable(node);
      const func = findNearestFunction(node);

      return (
        (variable && isSensitiveName(variable.name)) ||
        (func && isSensitiveName(func.name))
      );
    }

    function findNearestVariable(node) {
      while (node) {
        if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
          return node.id;
        }
        node = node.parent;
      }
      return null;
    }

    function findNearestFunction(node) {
      while (node) {
        if (
          (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") &&
          node.id
        ) {
          return node.id;
        }
        node = node.parent;
      }
      return null;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Math.random()
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "Math" &&
          callee.property.name === "random"
        ) {
          if (isInSensitiveContext(node)) {
            context.report({
              node,
              messageId: "insecureRandom",
              data: { name: "Math.random" },
            });
          }
        }

        // UUID.v4() or uuid()
        if (
          callee.type === "Identifier" &&
          (callee.name === "uuid" || callee.name === "uuidv4")
        ) {
          if (isInSensitiveContext(node)) {
            context.report({
              node,
              messageId: "insecureRandom",
              data: { name: callee.name },
            });
          }
        }
      },
      NewExpression(node) {
        // new Random() – simulate Java-like pattern in JS context if exists
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "Random" &&
          isInSensitiveContext(node)
        ) {
          context.report({
            node,
            messageId: "insecureRandom",
            data: { name: "Random" },
          });
        }
      },
    };
  },
};
