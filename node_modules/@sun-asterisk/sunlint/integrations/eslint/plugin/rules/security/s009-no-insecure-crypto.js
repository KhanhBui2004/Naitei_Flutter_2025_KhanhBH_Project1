"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow use of insecure cryptographic algorithms, cipher modes, paddings, and hash functions",
      recommended: true,
    },
    schema: [],
    messages: {
      insecureCipher: "Do not use insecure cipher '{{algo}}'. Use AES with 128-bit block size or higher.",
      insecureMode: "Do not use insecure cipher mode '{{mode}}'. Use CBC or GCM instead.",
      insecurePadding: "Do not use insecure padding '{{padding}}'. Use OAEP or other secure paddings.",
      weakHash: "Do not use weak hash function '{{hash}}'. Use SHA-256 or stronger.",
    },
  },

  create(context) {
    const insecureCiphers = ["DES", "DESede", "Blowfish"];
    const insecureModes = ["ECB"];
    const insecurePaddings = ["PKCS1Padding"];
    const weakHashes = ["MD5", "SHA1", "SHA-1"];

    function checkAlgorithmString(node, rawValue) {
      const value = rawValue.toUpperCase();

      for (const cipher of insecureCiphers) {
        if (value.includes(cipher.toUpperCase())) {
          context.report({
            node,
            messageId: "insecureCipher",
            data: { algo: cipher },
          });
          return;
        }
      }

      for (const mode of insecureModes) {
        if (value.includes(mode.toUpperCase())) {
          context.report({
            node,
            messageId: "insecureMode",
            data: { mode },
          });
          return;
        }
      }

      for (const padding of insecurePaddings) {
        if (value.includes(padding.toUpperCase())) {
          context.report({
            node,
            messageId: "insecurePadding",
            data: { padding },
          });
          return;
        }
      }

      for (const hash of weakHashes) {
        if (value === hash.toUpperCase()) {
          context.report({
            node,
            messageId: "weakHash",
            data: { hash },
          });
          return;
        }
      }
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "crypto"
        ) {
          const method = node.callee.property.name;

          // Check hash functions
          if (
            method === "createHash" &&
            node.arguments.length &&
            node.arguments[0].type === "Literal"
          ) {
            checkAlgorithmString(node.arguments[0], node.arguments[0].value);
          }

          // Check ciphers and paddings
          if (
            (method === "createCipher" || method === "createCipheriv") &&
            node.arguments.length &&
            node.arguments[0].type === "Literal"
          ) {
            checkAlgorithmString(node.arguments[0], node.arguments[0].value);
          }
        }
      },
    };
  },
};
