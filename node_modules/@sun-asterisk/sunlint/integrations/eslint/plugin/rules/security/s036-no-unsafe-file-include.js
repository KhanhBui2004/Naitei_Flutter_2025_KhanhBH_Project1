/**
 * Custom ESLint rule: S036 – Prevent LFI and RFI vulnerabilities
 * Rule ID: custom/s036
 * Purpose: Detect unvalidated user input passed to file system or dynamic import/require
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect possible Local/Remote File Inclusion vulnerabilities",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeFilePath:
        "Potential LFI/RFI: Do not pass user input directly to file or import functions.",
    },
  },

  create(context) {
    const fileFunctions = ["readFile", "readFileSync", "createReadStream"];
    const importFunctions = ["require", "import"];

    function isUserInput(argNode) {
      const code = context.getSourceCode().getText(argNode);
      return /req\.|input\.|params\.|query\.|body\./.test(code);
    }

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Handle fs.readFile(...), fs.createReadStream(...)
        if (
          callee.type === "MemberExpression" &&
          fileFunctions.includes(callee.property.name)
        ) {
          const [arg] = node.arguments;
          if (arg && isUserInput(arg)) {
            context.report({
              node: arg,
              messageId: "unsafeFilePath",
            });
          }
        }

        // Handle require(...) and import(...)
        if (
          (callee.type === "Identifier" &&
            importFunctions.includes(callee.name)) ||
          node.type === "ImportExpression"
        ) {
          const arg = node.arguments?.[0] || node.source;
          if (arg && isUserInput(arg)) {
            context.report({
              node: arg,
              messageId: "unsafeFilePath",
            });
          }
        }
      },
    };
  },
};
