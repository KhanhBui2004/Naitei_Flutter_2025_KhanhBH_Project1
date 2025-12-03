/**
 * Custom ESLint rule for: T003 – Avoid using @ts-ignore without justification
 * Rule ID: custom/t003  
 * Purpose: Require clear justification when using @ts-ignore comments
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid using @ts-ignore without a justification",
      recommended: false
    },
    fixable: null,
    schema: [],
    messages: {
      tsIgnoreReason: "Please provide a reason for using @ts-ignore"
    }
  },

  create(context) {
    return {
      Program() {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();

        comments.forEach((comment) => {
          if (comment.type === "Line" && comment.value.includes("@ts-ignore")) {
            // Check if there's a justification after @ts-ignore
            const hasJustification = comment.value
              .replace("@ts-ignore", "")
              .trim()
              .length > 0;

            if (!hasJustification) {
              context.report({
                node: comment,
                messageId: "tsIgnoreReason",
              });
            }
          }
        });
      },
    };
  },
};
