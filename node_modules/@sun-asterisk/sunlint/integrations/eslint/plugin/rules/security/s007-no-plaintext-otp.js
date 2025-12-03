/**
 * ESLint rule: S007 – Plaintext OTP Check
 * Rule ID: custom/s007
 * Description: Verify that OTPs are not stored or transmitted in plaintext form.
 */

"use strict";

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify that OTPs are not stored or transmitted in plaintext form.',
      recommended: true,
      url: 'https://owasp.org/www-community/vulnerabilities/Insecure_Storage',
    },
    messages: {
      plaintextOtp:
        'OTP should not be stored or transmitted in plaintext. Consider hashing or encrypting it.',
    },
    schema: [],
  },

  create(context) {
    return {
      Property(node) {
        if (
          node.key &&
          node.key.type === 'Identifier' &&
          /otp/i.test(node.key.name) &&
          node.value &&
          node.value.type === 'Identifier' &&
          !/hash|encrypt|bcrypt|sha/i.test(node.value.name)
        ) {
          context.report({
            node,
            messageId: 'plaintextOtp',
          });
        }
      },

      CallExpression(node) {
        const calleeName = getCalleeName(node.callee);
        if (!calleeName) return;

        if (/(insert|update|save|query|create)/i.test(calleeName)) {
          for (const arg of node.arguments) {
            const text = context.getSourceCode().getText(arg);
            if (/otp/i.test(text) && !/hash|encrypt|bcrypt|sha/i.test(text)) {
              context.report({
                node: arg,
                messageId: 'plaintextOtp',
              });
            }
          }
        }
      },
    };
  },
};

// ===== Helper function =====

function getCalleeName(callee) {
  if (callee.type === 'Identifier') {
    return callee.name;
  } else if (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier'
  ) {
    return callee.property.name;
  }
  return null;
}
