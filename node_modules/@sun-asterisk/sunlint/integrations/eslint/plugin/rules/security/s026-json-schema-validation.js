/**
 * Custom ESLint rule for: S026 – JSON schema validation required for inputs
 * Rule ID: custom/s026
 * Purpose: Ensure that all input JSON is validated against a schema
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure JSON schema validation is in place for input objects",
      recommended: false,
    },
    schema: [],
    messages: {
      missingValidation:
        "JSON input '{{input}}' should be validated using a JSON schema before use.",
    },
  },

  create(context) {
    let validatedInputs = new Set();

    return {
      CallExpression(node) {
        // Detect validation functions like schema.validate(req.body)
        if (
          node.callee &&
          node.callee.property &&
          node.arguments &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (
            arg.type === "MemberExpression" &&
            arg.object &&
            arg.property &&
            (arg.property.name === "body" || arg.property.name === "query")
          ) {
            const validatedInput = `${arg.object.name}.${arg.property.name}`;
            validatedInputs.add(validatedInput);
          }
        }
      },

      MemberExpression(node) {
        if (
          node.property &&
          (node.property.name === "body" || node.property.name === "query")
        ) {
          const fullInput = `${node.object.name}.${node.property.name}`;
          if (!validatedInputs.has(fullInput)) {
            context.report({
              node,
              messageId: "missingValidation",
              data: {
                input: fullInput,
              },
            });
          }
        }
      },
    };
  },
};
