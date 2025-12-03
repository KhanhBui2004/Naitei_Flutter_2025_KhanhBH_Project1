/**
 * Custom ESLint rule: S037 – Require anti-caching headers on responses
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Ensure anti-cache headers are set to prevent sensitive data caching",
      recommended: true,
    },
    schema: [],
    messages: {
      missingCacheHeader:
        "Missing anti-cache header for response '{{resName}}'. Consider setting 'Cache-Control: no-store'.",
    },
  },

  create(context) {
    // Track which response variables have Cache-Control: no-store/no-cache
    const secureResNames = new Set();

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Match res.setHeader('Cache-Control', '...')
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "setHeader" &&
          node.arguments.length >= 2 &&
          node.arguments[0].type === "Literal" &&
          node.arguments[0].value === "Cache-Control"
        ) {
          const resVar = callee.object;
          const valNode = node.arguments[1];

          if (
            resVar.type === "Identifier" &&
            valNode.type === "Literal" &&
            typeof valNode.value === "string" &&
            /no-store|no-cache/i.test(valNode.value)
          ) {
            secureResNames.add(resVar.name);
          }
        }

        // Match res.send / res.json / res.end
        if (
          callee.type === "MemberExpression" &&
          ["send", "json", "end"].includes(callee.property.name) &&
          callee.object.type === "Identifier"
        ) {
          const resName = callee.object.name;

          if (!secureResNames.has(resName)) {
            context.report({
              node,
              messageId: "missingCacheHeader",
              data: { resName },
            });
          }
        }
      },
    };
  },
};
