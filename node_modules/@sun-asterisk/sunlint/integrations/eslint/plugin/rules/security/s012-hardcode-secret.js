"use strict";

/**
 * S012 – Hardcoded Secret
 * OWASP ASVS 1.6.2
 * Ensure that secrets such as passwords, API keys, and cryptographic keys are not hardcoded in source code.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not hardcode any secrets (API keys, passwords, cryptographic keys) in the source code.",
      recommended: true,
    },
    schema: [],
    messages: {
      hardcodedSecret:
        "Do not hardcode secrets (API keys, passwords, cryptographic keys) in source code.",
    },
  },

  create(context) {
    const secretKeywords = [
      "SECRET",
      "TOKEN",
      "APIKEY",
      "PASSWORD",
      "PRIVATEKEY",
      "JWT_SECRET",
    ];
    return {
      VariableDeclarator(node) {
        if (
          node.id &&
          node.id.type === "Identifier" &&
          secretKeywords.some((kw) => node.id.name.toUpperCase().includes(kw))
        ) {
          if (
            node.init &&
            node.init.type === "Literal" &&
            typeof node.init.value === "string" &&
            node.init.value.length > 0
          ) {
            context.report({
              node: node.init,
              messageId: "hardcodedSecret",
            });
          }
        }
      },
      AssignmentExpression(node) {
        if (
          node.left.type === "Identifier" &&
          secretKeywords.some((kw) =>
            node.left.name.toUpperCase().includes(kw)
          ) &&
          node.right.type === "Literal" &&
          typeof node.right.value === "string" &&
          node.right.value.length > 0
        ) {
          context.report({
            node: node.right,
            messageId: "hardcodedSecret",
          });
        }
      },
    };
  },
};
