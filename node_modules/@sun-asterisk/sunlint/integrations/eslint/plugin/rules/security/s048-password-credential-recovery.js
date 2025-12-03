"use strict";

/**
 * S048 – Password Credential Recovery
 * OWASP ASVS 2.4.3
 * Ensure password credential recovery does not reveal the current password in any way.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure password recovery does not reveal the current password. Users must set a new password via a secure, one-time token.",
      recommended: true,
    },
    schema: [],
    messages: {
      revealPassword:
        "Never reveal or send the current password during recovery. Always require user to set a new password.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        // Example: sending current password in email (should not happen)
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "sendMail" &&
          node.arguments.length &&
          node.arguments[0].type === "ObjectExpression"
        ) {
          const bodyProp = node.arguments[0].properties.find(
            (prop) =>
              prop.key &&
              (prop.key.name === "text" || prop.key.name === "html") &&
              prop.value.type === "Literal" &&
              (prop.value.value
                .toLowerCase()
                .includes("your current password") ||
                prop.value.value.toLowerCase().includes("mật khẩu hiện tại"))
          );
          if (bodyProp) {
            context.report({
              node: bodyProp.value,
              messageId: "revealPassword",
            });
          }
        }
      },
    };
  },
};
