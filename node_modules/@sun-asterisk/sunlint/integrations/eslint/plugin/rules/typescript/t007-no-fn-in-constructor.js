/**
 * Custom ESLint rule for: T007 – Avoid declaring functions inside constructors or class bodies
 * Rule ID: custom/t007
 * Purpose: Discourage function declarations within constructors or class methods
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Avoid declaring functions inside constructors or class bodies",
      recommended: false
    },
    schema: [],
    messages: {
      noFunctionInConstructor: "Avoid declaring functions inside class constructors.",
      noFunctionInClassBody: "Avoid declaring nested functions inside class body."
    }
  },
  create(context) {
    return {
      MethodDefinition(node) {
        if (node.kind === "constructor" && node.value && node.value.body && node.value.body.body) {
          const constructorBody = node.value.body.body;
          constructorBody.forEach(element => {
            if (element.type === "FunctionDeclaration" || element.type === "FunctionExpression") {
              context.report({
                node: element,
                messageId: "noFunctionInConstructor"
              });
            }
          });
        }
      },
      ClassBody(node) {
        node.body.forEach(element => {
          if (element.type === "MethodDefinition" && element.value && element.value.body && element.value.body.body) {
            const methodBody = element.value.body.body;
            methodBody.forEach(subNode => {
              if (subNode.type === "FunctionDeclaration") {
                context.report({
                  node: subNode,
                  messageId: "noFunctionInClassBody"
                });
              }
            });
          }
        });
      }
    };
  }
};
