"use strict";

/**
 * S008 – Crypto Agility
 * OWASP ASVS 6.2.4
 * Ensure that cryptographic algorithms and their parameters can be reconfigured or upgraded.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure cryptographic algorithms, key lengths, and modes are not hardcoded and can be configured or upgraded easily.",
      recommended: true,
    },
    schema: [],
    messages: {
      hardcodedAlgo:
        "Do not hardcode cryptographic algorithm or parameters. Use configurable values instead.",
    },
  },

  create(context) {
    function isHardcodedCrypto(node) {
      if (node.type === "Literal" && typeof node.value === "string") {
        const lower = node.value.toLowerCase();
        const algos = [
          "aes-128-cbc",
          "aes-256-cbc",
          "aes-256-gcm",
          "sha1",
          "sha256",
          "sha512",
          "md5",
          "des",
          "rc4",
          "blowfish",
        ];
        return algos.some((algo) => lower.includes(algo));
      }
      return false;
    }

    return {
      CallExpression(node) {
        // Detect hardcoded crypto algorithm in common Node.js crypto calls
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "crypto" &&
          node.arguments.length > 0 &&
          isHardcodedCrypto(node.arguments[0])
        ) {
          context.report({
            node: node.arguments[0],
            messageId: "hardcodedAlgo",
          });
        }
      },
    };
  },
};
