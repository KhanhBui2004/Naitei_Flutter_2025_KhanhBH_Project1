/**
 * Custom ESLint rule: S034 – Enforce '__Host-' prefix on secure cookies
 * Rule ID: custom/s034
 * Purpose: Ensure cookies use the '__Host-' prefix for added security
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Ensure cookies use the '__Host-' prefix for secure session cookies",
      recommended: true,
    },
    schema: [],
    messages: {
      missingHostPrefix:
        "Cookie name '{{name}}' should use the '__Host-' prefix for stronger security.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Match res.cookie("name", ...)
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "cookie" &&
          node.arguments.length >= 1
        ) {
          const cookieNameArg = node.arguments[0];

          if (
            cookieNameArg.type === "Literal" &&
            typeof cookieNameArg.value === "string"
          ) {
            const name = cookieNameArg.value;

            // If cookie name does not start with '__Host-' → warn
            if (!name.startsWith("__Host-")) {
              context.report({
                node: cookieNameArg,
                messageId: "missingHostPrefix",
                data: { name },
              });
            }
          }
        }

        // Optional: check res.setHeader('Set-Cookie', 'session=value; ...')
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "setHeader" &&
          node.arguments.length >= 2 &&
          node.arguments[0].type === "Literal" &&
          node.arguments[0].value === "Set-Cookie" &&
          node.arguments[1].type === "Literal" &&
          typeof node.arguments[1].value === "string"
        ) {
          const cookieString = node.arguments[1].value;
          const cookieName = cookieString.split("=")[0].trim();
          if (!cookieName.startsWith("__Host-")) {
            context.report({
              node: node.arguments[1],
              messageId: "missingHostPrefix",
              data: { name: cookieName },
            });
          }
        }
      },
    };
  },
};
