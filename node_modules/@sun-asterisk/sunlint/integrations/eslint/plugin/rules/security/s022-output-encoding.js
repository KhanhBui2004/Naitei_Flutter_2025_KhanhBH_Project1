"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure HTML output is properly encoded to prevent XSS.",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeOutput:
        "Output to HTML must use proper encoding (e.g., escapeHtml) to prevent XSS.",
    },
  },

  create(context) {
    const outputMethods = new Set(["write", "print", "println", "log"]);
    const outputObjects = new Set(["out", "writer", "response", "console", "System"]);
    const riskyVarNames = ["input", "user", "html", "token", "param", "data"];

    function isEscapeFunction(node) {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        (node.callee.name.includes("escape") || node.callee.name.includes("encode"))
      );
    }

    function isUnescapedArg(node) {
      if (!node) return false;

      if (node.type === "Literal") return false;
      if (isEscapeFunction(node)) return false;

      if (node.type === "BinaryExpression") {
        return isUnescapedArg(node.left) || isUnescapedArg(node.right);
      }

      if (node.type === "Identifier") {
        const varName = node.name.toLowerCase();
        return riskyVarNames.some((risky) => varName.includes(risky));
      }

      return true;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;

        if (
          callee.type === "MemberExpression" &&
          outputMethods.has(callee.property.name)
        ) {
          const object = callee.object;

          const isLikelyHtmlOutput =
            (object.type === "Identifier" && outputObjects.has(object.name)) ||
            (object.type === "MemberExpression" &&
              object.property?.name === "getWriter");

          if (!isLikelyHtmlOutput) return;

          for (const arg of node.arguments) {
            if (isUnescapedArg(arg)) {
              context.report({
                node: arg,
                messageId: "unsafeOutput",
              });
              break;
            }
          }
        }
      },
    };
  },
};
