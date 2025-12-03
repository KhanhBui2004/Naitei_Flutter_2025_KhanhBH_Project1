/**
 * Custom ESLint rule: S003 – Prevent unvalidated redirects
 * Rule ID: custom/s003
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent unvalidated redirects to user-controlled URLs",
      recommended: true,
    },
    schema: [],
    messages: {
      unvalidatedRedirect:
        "Redirect to user-controlled URL '{{target}}' without validation. Use allow list or warning page.",
    },
  },

  create(context) {
    const userInputSources = [
      "req.query",
      "req.body",
      "input",
      "form",
      "params",
    ];

    function isUserControlled(nodeText) {
      return userInputSources.some((source) => nodeText.includes(source));
    }

    function reportIfUserControlled(node, nodeText) {
      if (isUserControlled(nodeText)) {
        context.report({
          node,
          messageId: "unvalidatedRedirect",
          data: { target: nodeText },
        });
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee;

        // res.redirect(...)
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "redirect" &&
          node.arguments.length > 0
        ) {
          const argText = context.getSourceCode().getText(node.arguments[0]);
          reportIfUserControlled(node, argText);
        }
      },

      AssignmentExpression(node) {
        const left = node.left;
        const right = node.right;

        if (
          left.type === "MemberExpression" &&
          left.object.name === "window" &&
          ["location", "location.href"].includes(left.property.name || "") &&
          right
        ) {
          const text = context.getSourceCode().getText(right);
          reportIfUserControlled(node, text);
        }

        if (
          left.type === "MemberExpression" &&
          left.object.name === "location" &&
          ["href", "replace"].includes(left.property.name || "") &&
          right
        ) {
          const text = context.getSourceCode().getText(right);
          reportIfUserControlled(node, text);
        }
      },
    };
  },
};
