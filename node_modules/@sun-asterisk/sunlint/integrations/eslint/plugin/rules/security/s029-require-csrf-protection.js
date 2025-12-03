"use strict";

/**
 * Custom ESLint rule: S029 – Require CSRF protection on routes
 * Rule ID: custom/s029
 * Purpose: Ensure CSRF protection is applied to route handlers
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure CSRF protection is applied to route handlers",
      recommended: true,
    },
    schema: [],
    messages: {
      missingCsrf:
        "CSRF protection is missing on this route handler '{{route}}'. Apply csurf() or equivalent middleware.",
    },
  },

  create(context) {
    const csrfFunctions = [
      "csurf",
      "csrfProtection",
      "verifyCsrfToken",
      "checkCsrf",
    ];
    const routeMethods = ["post", "put", "delete"];

    const protectedInstances = new Set(); // e.g. app, router

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Detect app.use(csurf()) → mark 'app' as protected
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "use" &&
          node.arguments.some(
            (arg) =>
              (arg.type === "CallExpression" &&
                arg.callee.type === "Identifier" &&
                csrfFunctions.includes(arg.callee.name)) ||
              (arg.type === "Identifier" && csrfFunctions.includes(arg.name))
          )
        ) {
          const instance = callee.object.name;
          if (instance) {
            protectedInstances.add(instance);
          }
        }

        // Detect route registrations
        if (
          callee.type === "MemberExpression" &&
          routeMethods.includes(callee.property.name)
        ) {
          const instance = callee.object.name;
          const args = node.arguments;

          if (!protectedInstances.has(instance)) {
            const path =
              args[0] && args[0].type === "Literal"
                ? args[0].value
                : "<unknown>";
            context.report({
              node,
              messageId: "missingCsrf",
              data: { route: path },
            });
          }
        }
      },
    };
  },
};
