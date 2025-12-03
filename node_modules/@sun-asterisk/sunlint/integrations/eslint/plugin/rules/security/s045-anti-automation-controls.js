"use strict";

/**
 * S045 – Anti Automation Controls
 * OWASP ASVS 2.2.1
 * Ensure that anti-automation controls are in place to mitigate brute force and automated attacks.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure anti-automation controls are in place (rate limiting, CAPTCHA, account lockout, etc.).",
      recommended: true,
    },
    schema: [],
    messages: {
      noAntiAutomation:
        "Missing or ineffective anti-automation controls. Consider rate limiting, CAPTCHA, or account lockout.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        // Check for missing rate limiter middleware in Express apps (demo only)
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "app" &&
          node.parent &&
          node.parent.type === "ExpressionStatement" &&
          node.arguments.length &&
          node.arguments[0].type === "Literal" &&
          node.arguments[0].value === "/login"
        ) {
          // This is a simplified check; real implementation should be more robust
          context.report({
            node,
            messageId: "noAntiAutomation",
          });
        }
      },
    };
  },
};
