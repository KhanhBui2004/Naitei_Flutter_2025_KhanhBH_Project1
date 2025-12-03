"use strict";

/**
 * S046 – Secure Notification On Auth Change
 * OWASP ASVS 2.2.3
 * Ensure that users are securely notified after authentication changes.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure secure notification is sent on authentication changes (password reset, email/phone change, new device login, etc.).",
      recommended: true,
    },
    schema: [],
    messages: {
      missingNotification:
        "Missing secure notification after authentication change. Notify users via secure channel when credentials or auth details change.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        // Example: after password change, should call sendNotification/sendMail/sendPushNotification
        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "resetPassword" ||
            node.callee.name === "changeEmail") &&
          node.parent &&
          node.parent.type === "ExpressionStatement"
        ) {
          // This is a simplified check; real implementation should be more robust
          context.report({
            node,
            messageId: "missingNotification",
          });
        }
      },
    };
  },
};
