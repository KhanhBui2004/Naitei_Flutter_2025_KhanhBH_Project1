"use strict";

/**
 * S015 – Insecure TLS Certificate
 * OWASP ASVS 9.2.1
 * Ensure that only trusted TLS certificates are accepted.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure only trusted TLS certificates are used. Reject self-signed, expired, or untrusted certificates unless explicitly allowed for internal use.",
      recommended: true,
    },
    schema: [],
    messages: {
      untrustedCert:
        "Untrusted/self-signed/expired certificate accepted. Only use trusted certificates in production.",
    },
  },

  create(context) {
    return {
      Property(node) {
        // Check if rejectUnauthorized: false is used (should not be used in production)
        if (
          node.key &&
          (node.key.name === "rejectUnauthorized" ||
            node.key.value === "rejectUnauthorized") &&
          node.value.type === "Literal" &&
          node.value.value === false
        ) {
          context.report({
            node: node.value,
            messageId: "untrustedCert",
          });
        }
      },
    };
  },
};
