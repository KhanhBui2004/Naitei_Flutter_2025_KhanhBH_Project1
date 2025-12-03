/**
 * Custom ESLint rule for: S019 – Sanitize input before using in email systems
 * Rule ID: custom/s019
 * Purpose: Prevent SMTP/IMAP injection via unvalidated user input
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure user input is sanitized before use in mail functions",
      recommended: true,
    },
    schema: [],
    messages: {
      unsanitizedEmailInput:
        "Unsanitized user input '{{input}}' should not be passed directly to mail systems.",
    },
  },

  create(context) {
    const mailFunctionNames = ["sendMail", "sendEmail", "mailer.send"];
    const sanitizeFunctions = [
      "sanitize",
      "escape",
      "validateEmail",
      "cleanInput",
    ];

    // Identify common patterns of user input
    function isUserInput(name) {
      return (
        name.includes("req.body") ||
        name.includes("input") ||
        name.includes("form")
      );
    }

    // Check if a value has been sanitized
    function isSanitized(node) {
      return (
        node.type === "CallExpression" &&
        node.callee &&
        sanitizeFunctions.includes(node.callee.name)
      );
    }

    return {
      CallExpression(node) {
        const calleeName =
          (node.callee.type === "MemberExpression" &&
            node.callee.property.name) ||
          node.callee.name;

        // Only analyze known mail function calls
        if (!mailFunctionNames.includes(calleeName)) return;

        for (const arg of node.arguments) {
          // Direct use of user input in function arguments
          if (arg.type === "MemberExpression") {
            const fullName = context.getSourceCode().getText(arg);
            if (isUserInput(fullName)) {
              context.report({
                node: arg,
                messageId: "unsanitizedEmailInput",
                data: { input: fullName },
              });
            }
          }

          // If email parameters are passed in an object
          if (arg.type === "ObjectExpression") {
            for (const prop of arg.properties) {
              const value = prop.value;

              // User input used directly
              if (
                value.type === "MemberExpression" &&
                isUserInput(context.getSourceCode().getText(value))
              ) {
                context.report({
                  node: value,
                  messageId: "unsanitizedEmailInput",
                  data: { input: context.getSourceCode().getText(value) },
                });
              }

              // User input passed through function without sanitization
              if (
                value.type === "CallExpression" &&
                !isSanitized(value) &&
                value.arguments.some(
                  (a) =>
                    a.type === "MemberExpression" &&
                    isUserInput(context.getSourceCode().getText(a))
                )
              ) {
                context.report({
                  node: value,
                  messageId: "unsanitizedEmailInput",
                  data: { input: context.getSourceCode().getText(value) },
                });
              }
            }
          }
        }
      },
    };
  },
};
