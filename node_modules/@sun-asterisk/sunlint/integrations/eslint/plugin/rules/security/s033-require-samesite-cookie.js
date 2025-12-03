/**
 * Custom ESLint rule: S033 – Enforce SameSite on cookies
 * Rule ID: custom/s033
 * Purpose: Ensure SameSite attribute is set when setting cookies
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure SameSite is set when using cookies to prevent CSRF",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSameSite:
        "Cookie does not set 'SameSite' attribute. This may expose it to CSRF.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Detect res.cookie("name", "value", options)
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "cookie"
        ) {
          const options = node.arguments[2];
          if (options && options.type === "ObjectExpression") {
            const hasSameSite = options.properties.some((prop) => {
              return (
                prop.key &&
                prop.key.name === "sameSite" &&
                prop.value.type === "Literal" &&
                ["strict", "lax", "none"].includes(
                  prop.value.value.toLowerCase()
                )
              );
            });

            if (!hasSameSite) {
              context.report({
                node,
                messageId: "missingSameSite",
              });
            }
          } else {
            // No options object passed at all
            context.report({
              node,
              messageId: "missingSameSite",
            });
          }
        }

        // Detect res.setHeader('Set-Cookie', '...') → doesn't include SameSite
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "setHeader" &&
          node.arguments.length >= 2 &&
          node.arguments[0].type === "Literal" &&
          node.arguments[0].value === "Set-Cookie" &&
          node.arguments[1].type === "Literal" &&
          typeof node.arguments[1].value === "string" &&
          !node.arguments[1].value.includes("SameSite")
        ) {
          context.report({
            node,
            messageId: "missingSameSite",
          });
        }
      },
    };
  },
};
