/**
 * Custom ESLint rule for: T002 – Interface names should start with 'I'
 * Rule ID: custom/t002
 * Purpose: Enforce consistent interface naming convention by requiring the 'I' prefix
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Interface names should start with 'I'",
      recommended: false
    },
    fixable: "code",
    schema: [],
    messages: {
      interfacePrefix: "Interface name '{{name}}' should start with 'I'"
    }
  },

  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;
        if (!interfaceName.startsWith("I")) {
          context.report({
            node: node.id,
            messageId: "interfacePrefix",
            data: {
              name: interfaceName,
            },
            fix(fixer) {
              return fixer.replaceText(node.id, `I${interfaceName}`);
            },
          });
        }
      },
    };
  },
};
