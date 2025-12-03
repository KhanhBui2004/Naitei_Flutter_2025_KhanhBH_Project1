"use strict";

/**
 * S047 – Verify system generated initial passwords or activation codes SHOULD be securely randomly generated
 * OWASP ASVS 2.3.1
 * Rule ID: custom/s047
 * SHOULD be at least 6 characters long, and MAY contain letters and numbers, and expire after a short period of time. These initial secrets must not be permitted to become the long term password.
 */


module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Initial passwords or activation codes must be securely generated, at least 6 characters, expire soon, and not reused long-term.",
      recommended: false,
    },
    messages: {
      weakInitialSecret:
        "Initial secret (password or activation code) must be securely randomly generated, at least 6 characters, expire soon, and not reused long-term.",
    },
    schema: [],
  },

  create(context) {
    const SECRET_NAME_REGEX = /(initial|activation|temp).*?(password|code|token|secret)/i;

    function isPotentialSecretName(name) {
      return SECRET_NAME_REGEX.test(name);
    }

    function checkInsecureGeneration(node) {
      const callee = node.callee;

      // Check for Math.random()
      if (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "Math" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "random"
      ) {
        context.report({ node, messageId: "weakInitialSecret" });
      }

      // Check for Date.now()
      if (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "Date" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "now"
      ) {
        context.report({ node, messageId: "weakInitialSecret" });
      }
    }

    return {
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          isPotentialSecretName(node.id.name) &&
          node.init
        ) {
          if (node.init.type === "Literal") {
            const val = node.init.value;
            if (typeof val === "string" && val.length < 6) {
              context.report({ node, messageId: "weakInitialSecret" });
            }
          }

          if (
            node.init.type === "CallExpression" ||
            node.init.type === "NewExpression"
          ) {
            checkInsecureGeneration(node.init);
          }
        }
      },

      AssignmentExpression(node) {
        const left = node.left;
        const right = node.right;

        if (
          left.type === "MemberExpression" &&
          left.property.type === "Identifier" &&
          isPotentialSecretName(left.property.name)
        ) {
          if (right.type === "Literal") {
            const val = right.value;
            if (typeof val === "string" && val.length < 6) {
              context.report({ node, messageId: "weakInitialSecret" });
            }
          }

          if (
            right.type === "CallExpression" ||
            right.type === "NewExpression"
          ) {
            checkInsecureGeneration(right);
          }
        }
      },
    };
  },
};
