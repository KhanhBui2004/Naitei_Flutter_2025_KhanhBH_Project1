/**
 * ESLint rule: S005 – Do not use Origin header for authentication/access control
 * Rule ID: custom/s005
 * Description: Prevent usage of request.getHeader("Origin") for security decisions.
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not use the Origin header to make authentication or access control decisions.",
      recommended: true,
    },
    schema: [],
    messages: {
      noOriginCheck:
        "Do not use the Origin header for authentication or access control decisions. It can be easily spoofed.",
    },
  },

  create(context) {
    const trackedVariables = new Set();

    function isOriginHeaderCall(node) {
      // Match: request.getHeader("Origin")
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.property.name === "getHeader" &&
        node.arguments.length &&
        node.arguments[0].type === "Literal" &&
        node.arguments[0].value === "Origin"
      );
    }

    return {
      VariableDeclarator(node) {
        // Track: const origin = request.getHeader("Origin");
        if (node.init && isOriginHeaderCall(node.init)) {
          trackedVariables.add(node.id.name);
        }
      },

      AssignmentExpression(node) {
        // Track: origin = request.getHeader("Origin");
        if (
          node.left.type === "Identifier" &&
          isOriginHeaderCall(node.right)
        ) {
          trackedVariables.add(node.left.name);
        }
      },

      CallExpression(node) {
        // Detect: origin.equals(...) or origin.includes(...) or "xyz" === origin
        if (
          node.callee.type === "MemberExpression" &&
          ["includes", "startsWith", "endsWith", "indexOf", "equals"].includes(
            node.callee.property.name
          )
        ) {
          const arg = node.callee.object;
          if (arg.type === "Identifier" && trackedVariables.has(arg.name)) {
            context.report({ node, messageId: "noOriginCheck" });
          }
        }

        // Detect: "admin" === origin (binary expression inside if)
        if (
          node.parent &&
          node.parent.type === "IfStatement" &&
          node.arguments.some(
            (arg) =>
              arg.type === "Identifier" && trackedVariables.has(arg.name)
          )
        ) {
          context.report({ node, messageId: "noOriginCheck" });
        }
      },

      BinaryExpression(node) {
        // Detect: if (origin === "some-origin")
        const ids = [node.left, node.right].filter(
          (e) => e.type === "Identifier" && trackedVariables.has(e.name)
        );
        if (ids.length > 0) {
          context.report({ node, messageId: "noOriginCheck" });
        }
      },
    };
  },
};
