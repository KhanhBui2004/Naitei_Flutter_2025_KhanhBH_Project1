"use strict";

/**
 * S055 – Verify that REST services explicitly check the incoming Content-Type to be the expected one, such as application/xml or application/json.
 * OWASP ASVS 13.2.5
 * Rule ID: custom/s055
 * Verify that REST services explicitly check the incoming Content-Type to be the expected one, such as application/xml or application/json.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure REST request handlers validate Content-Type when using req.body",
      recommended: false,
    },
    messages: {
      missingCheck:
        "Handler uses req.body but does not validate Content-Type.",
    },
    schema: [],
  },

  create(context) {
    function walkForReqBody(node, reqName = "req") {
      const visited = new Set();
      let found = false;

      function walk(n) {
        if (!n || typeof n !== "object" || visited.has(n) || found) return;
        visited.add(n);

        if (
          n.type === "MemberExpression" &&
          n.object.type === "Identifier" &&
          n.object.name === reqName &&
          n.property.type === "Identifier" &&
          n.property.name === "body"
        ) {
          found = true;
          return;
        }

        for (const key in n) {
          if (!Object.prototype.hasOwnProperty.call(n, key)) continue;
          const child = n[key];
          if (Array.isArray(child)) child.forEach(walk);
          else if (typeof child === "object" && child !== null) walk(child);
        }
      }

      walk(node);
      return found;
    }

    function walkForContentTypeCheck(node, reqName = "req") {
      const visited = new Set();

      function walk(n) {
        if (!n || typeof n !== "object" || visited.has(n)) return false;
        visited.add(n);

        // req.is("application/json")
        if (
          n.type === "CallExpression" &&
          n.callee.type === "MemberExpression" &&
          n.callee.object.type === "Identifier" &&
          n.callee.object.name === reqName &&
          n.callee.property.name === "is" &&
          n.arguments.length > 0 &&
          n.arguments[0].type === "Literal" &&
          typeof n.arguments[0].value === "string" &&
          n.arguments[0].value.startsWith("application/")
        ) {
          return true;
        }

        // req.headers["content-type"]
        if (
          n.type === "MemberExpression" &&
          n.object?.type === "MemberExpression" &&
          n.object.object?.type === "Identifier" &&
          n.object.object.name === reqName &&
          n.object.property?.name === "headers" &&
          (
            (n.property.type === "Literal" && n.property.value === "content-type") ||
            (n.property.type === "Identifier" && n.property.name === "content-type")
          )
        ) {
          return true;
        }

        // Look through children
        for (const key in n) {
          if (!Object.prototype.hasOwnProperty.call(n, key)) continue;
          const child = n[key];
          if (Array.isArray(child)) {
            if (child.some(walk)) return true;
          } else if (typeof child === "object" && child !== null) {
            if (walk(child)) return true;
          }
        }

        return false;
      }

      return walk(node);
    }

    return {
      CallExpression(node) {
        // Match app.post("/path", handler)
        if (
          node.callee.type === "MemberExpression" &&
          ["post", "put", "patch", "delete"].includes(
            node.callee.property.name
          )
        ) {
          const handler = node.arguments.find(
            (arg) =>
              arg.type === "FunctionExpression" ||
              arg.type === "ArrowFunctionExpression"
          );

          if (!handler || !handler.body) return;

          const reqName = handler.params[0]?.name || "req";

          const usesBody = walkForReqBody(handler.body, reqName);
          const hasValidation = walkForContentTypeCheck(handler.body, reqName);

          if (usesBody && !hasValidation) {
            context.report({
              node: handler,
              messageId: "missingCheck",
            });
          }
        }
      },
    };
  },
};
