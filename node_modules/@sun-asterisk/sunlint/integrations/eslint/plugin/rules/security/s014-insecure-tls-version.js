"use strict";

/**
 * S014 – Insecure TLS Version
 * OWASP ASVS 9.1.3
 * Ensure that only secure versions of TLS (1.2 and 1.3) are enabled.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure that only secure versions of TLS are enabled. Do not use SSLv3, TLS 1.0, or TLS 1.1.",
      recommended: true,
    },
    schema: [],
    messages: {
      insecureTLS:
        "Insecure TLS/SSL version detected. Only TLS 1.2 or TLS 1.3 should be used.",
    },
  },

  create(context) {
    return {
      Property(node) {
        // Detect insecure minVersion in HTTPS server options
        if (
          node.key &&
          node.key.name === "minVersion" &&
          node.value.type === "Literal" &&
          typeof node.value.value === "string"
        ) {
          const version = node.value.value.toLowerCase();
          if (
            version === "tlsv1" ||
            version === "tlsv1.0" ||
            version === "tlsv1.1" ||
            version === "sslv3"
          ) {
            context.report({
              node: node.value,
              messageId: "insecureTLS",
            });
          }
        }
      },
    };
  },
};
