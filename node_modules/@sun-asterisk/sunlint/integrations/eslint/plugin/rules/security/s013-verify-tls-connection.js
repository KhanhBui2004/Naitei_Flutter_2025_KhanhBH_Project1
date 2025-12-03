/**
 * ESLint rule: S013 – Enforce TLS Usage
 * Rule ID: custom-tls/s013
 */
"use strict";

const HTTP_REGEX = /^http:\/\//i;

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure all client connections use TLS (HTTPS) and prevent unencrypted (HTTP) connections.",
      recommended: true,
    },
    messages: {
      insecureUrl:
        "Unencrypted connection detected (http://). Always use HTTPS (TLS).",
    },
    schema: [],
  },

  create(context) {
    /** Báo lỗi nếu node là string chứa http://  */
    function reportIfHttp(node, text) {
      if (HTTP_REGEX.test(text)) {
        context.report({ node, messageId: "insecureUrl" });
      }
    }

    return {
      // String literal
      Literal(node) {
        if (typeof node.value === "string") reportIfHttp(node, node.value);
      },

      // Template “thuần” (không có ${...})
      TemplateLiteral(node) {
        if (node.expressions.length === 0) {
          const raw = node.quasis.map(q => q.value.raw).join("");
          reportIfHttp(node, raw);
        }
      },
    };
  },
};
