/**
 * Custom ESLint rule: S057 – Enforce UTC usage in time formatting/logging
 * Rule ID: custom/s057
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Avoid using local time formatting in logs; prefer UTC for consistency",
      recommended: true,
    },
    schema: [],
    messages: {
      avoidLocalTime:
        "Avoid using '{{method}}' for local time formatting. Prefer UTC methods like toISOString() or moment.utc().",
    },
  },

  create(context) {
    const forbiddenMethods = [
      "toLocaleString",
      "toLocaleDateString",
      "toLocaleTimeString",
      "format", // e.g., moment().format(...) → not utc by default
    ];

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Match: date.toLocaleString(), moment().format()
        if (callee.type === "MemberExpression") {
          const method = callee.property.name;

          if (forbiddenMethods.includes(method)) {
            const objectText = context.getSourceCode().getText(callee.object);
            // Optional enhancement: only warn for Date or moment() objects
            if (/Date|moment/.test(objectText)) {
              context.report({
                node,
                messageId: "avoidLocalTime",
                data: { method },
              });
            }
          }
        }
      },
    };
  },
};
