/**
 * ESLint Rule: S016 - Sensitive Data in Query Parameters
 * Rule ID: custom/s016
 * Description: Sensitive data should not be passed via query parameters (e.g., @Query('password')).
 */

"use strict";

const SENSITIVE_TERMS = [
  "password",
  "otp",
  "token",
  "creditCard",
  "ssn",
  "apiKey",
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Detect sensitive parameters passed via query string.",
    },
    messages: {
      sensitiveParam:
        "Avoid passing sensitive data via query parameters: '{{param}}'",
    },
    schema: [],
  },

  create(context) {
    return {
      Decorator(node) {
        if (
          node.expression &&
          node.expression.type === "CallExpression" &&
          node.expression.callee &&
          node.expression.callee.type === "Identifier" &&
          node.expression.callee.name === "Query"
        ) {
          const arg = node.expression.arguments[0];
          if (arg && arg.type === "Literal" && typeof arg.value === "string") {
            const paramName = arg.value.toLowerCase();
            for (const sensitive of SENSITIVE_TERMS) {
              if (paramName.includes(sensitive.toLowerCase())) {
                context.report({
                  node: arg,
                  messageId: "sensitiveParam",
                  data: { param: arg.value },
                });
                break;
              }
            }
          }
        }
      },
    };
  },
};
