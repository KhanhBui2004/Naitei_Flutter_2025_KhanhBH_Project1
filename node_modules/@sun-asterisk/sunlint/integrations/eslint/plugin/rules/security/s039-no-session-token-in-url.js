/**
 * Custom ESLint rule: S039 – Do not include session tokens in URL parameters
 * Rule ID: custom/s039
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure session tokens are not exposed in URL query parameters",
      recommended: true,
    },
    schema: [],
    messages: {
      tokenInUrl: "Do not expose session token '{{param}}' in URL parameters.",
    },
  },

  create(context) {
    const tokenKeywords = ["token", "session", "auth", "jwt", "sid"];

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          const url = node.value;

          // Simple match ?token=abc123 or &sid=xyz or ?session=...
          const regex = /[?&]([a-zA-Z0-9_-]+)=/g;
          let match;
          while ((match = regex.exec(url)) !== null) {
            const param = match[1].toLowerCase();
            if (tokenKeywords.some((key) => param.includes(key))) {
              context.report({
                node,
                messageId: "tokenInUrl",
                data: { param: match[1] },
              });
            }
          }
        }
      },

      TemplateLiteral(node) {
        const raw = context.getSourceCode().getText(node);
        const regex = /[?&]([a-zA-Z0-9_-]+)=/g;
        let match;
        while ((match = regex.exec(raw)) !== null) {
          const param = match[1].toLowerCase();
          if (tokenKeywords.some((key) => param.includes(key))) {
            context.report({
              node,
              messageId: "tokenInUrl",
              data: { param: match[1] },
            });
          }
        }
      },
    };
  },
};
