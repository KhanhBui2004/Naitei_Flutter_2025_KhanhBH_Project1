/**
 * Custom ESLint rule: S035 – Require specific path in cookies
 * Rule ID: custom/s035
 * Purpose: Ensure cookies set a specific path, not the root `/`
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Ensure cookies use a specific path (not `/`) to reduce exposure to sibling apps under same domain",
      recommended: true,
    },
    schema: [],
    messages: {
      pathTooBroad:
        "Cookie uses path `'/'`, which may expose it across unrelated applications. Use a more specific path.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Match res.cookie("name", "value", { ... })
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "cookie" &&
          node.arguments.length >= 3
        ) {
          const options = node.arguments[2];

          if (options.type === "ObjectExpression") {
            const pathProp = options.properties.find(
              (prop) => prop.key.name === "path"
            );

            if (
              pathProp &&
              pathProp.value.type === "Literal" &&
              pathProp.value.value === "/"
            ) {
              context.report({
                node: pathProp,
                messageId: "pathTooBroad",
              });
            }
          }
        }

        // Optional: check res.setHeader("Set-Cookie", "...Path=/...")
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "setHeader" &&
          node.arguments.length >= 2 &&
          node.arguments[0].type === "Literal" &&
          node.arguments[0].value === "Set-Cookie" &&
          node.arguments[1].type === "Literal" &&
          typeof node.arguments[1].value === "string" &&
          /path=\/(;|\s|$)/i.test(node.arguments[1].value)
        ) {
          context.report({
            node: node.arguments[1],
            messageId: "pathTooBroad",
          });
        }
      },
    };
  },
};
