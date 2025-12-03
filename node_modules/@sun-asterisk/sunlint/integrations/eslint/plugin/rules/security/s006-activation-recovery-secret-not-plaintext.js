"use strict";

/**
 * S006 – Activation/Recovery Secret Not Plaintext
 * OWASP ASVS 2.5.1
 * Ensure that system-generated activation or recovery secrets are not sent in plaintext to the user.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow sending activation or recovery secrets in plaintext to the user (e.g., via email/SMS). Use secure channels or one-time tokens.",
      recommended: true,
    },
    schema: [],
    messages: {
      plaintextSecret:
        "Do not send activation or recovery secrets in plaintext. Use a hashed or one-time token instead.",
    },
  },

  create(context) {
    function isActivationOrRecovery(text) {
      if (!text || typeof text !== "string") return false;
      const keywords = [
        "activation code",
        "activation token",
        "recovery code",
        "recovery token",
      ];
      return keywords.some((kw) => text.toLowerCase().includes(kw));
    }

    return {
      CallExpression(node) {
        // Check for sendMail({ text: ... }) or sendSMS(...)
        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "sendMail" || node.callee.name === "sendSMS") &&
          node.arguments.length
        ) {
          const arg = node.arguments[0];
          if (arg.type === "ObjectExpression") {
            const bodyProp = arg.properties.find(
              (prop) =>
                prop.key &&
                (prop.key.name === "text" || prop.key.name === "html") &&
                prop.value.type === "Literal"
            );
            if (bodyProp && isActivationOrRecovery(bodyProp.value.value)) {
              context.report({
                node: bodyProp.value,
                messageId: "plaintextSecret",
              });
            }
          }
          if (arg.type === "Literal" && isActivationOrRecovery(arg.value)) {
            context.report({
              node: arg,
              messageId: "plaintextSecret",
            });
          }
        }
      },
    };
  },
};
