/**
 * ESLint Rule: S050 - Session Token Weak Entropy or Algorithm
 * Rule ID: custom/s050
 * Description: Ensure session tokens use secure algorithms and have at least 64-bit entropy.
 */

"use strict";

const WEAK_HASH_ALGOS = new Set(["md5", "sha1"]);

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Avoid using weak hash algorithms or low entropy sources for session tokens. Use crypto.randomBytes(16), HMAC, or SHA-256.",
      recommended: false,
    },
    messages: {
      weakHash:
        "Avoid using weak hash algorithm '{{algo}}' for session tokens. Use SHA-256, HMAC, or AES instead.",
      lowEntropy:
        "Session token should be generated with at least 64-bit entropy. Avoid using '{{func}}'.",
      smallRandomBytes:
        "Session token generated with crypto.randomBytes({{bytes}}) has insufficient entropy. Use at least 8 bytes (64-bit).",
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;

        // Case 1: crypto.createHash("md5") or ("sha1")
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "crypto" &&
          callee.property.name === "createHash"
        ) {
          const [arg] = node.arguments;
          if (
            arg &&
            arg.type === "Literal" &&
            typeof arg.value === "string"
          ) {
            const algo = arg.value.toLowerCase();
            if (WEAK_HASH_ALGOS.has(algo)) {
              context.report({
                node: arg,
                messageId: "weakHash",
                data: { algo },
              });
            }
          }
        }

        // Case 2: crypto.randomBytes(n), n < 8
        if (
          callee.type === "MemberExpression" &&
          callee.object.name === "crypto" &&
          callee.property.name === "randomBytes"
        ) {
          const [arg] = node.arguments;
          if (
            arg &&
            arg.type === "Literal" &&
            typeof arg.value === "number" &&
            arg.value < 8
          ) {
            context.report({
              node: arg,
              messageId: "smallRandomBytes",
              data: { bytes: arg.value },
            });
          }
        }

        // Case 3: Math.random() or Date.now() used
        if (
          callee.type === "MemberExpression" &&
          ((callee.object.name === "Math" && callee.property.name === "random") ||
            (callee.object.name === "Date" && callee.property.name === "now"))
        ) {
          context.report({
            node: callee,
            messageId: "lowEntropy",
            data: { func: `${callee.object.name}.${callee.property.name}` },
          });
        }
      },
    };
  },
};
