/**
 * Custom ESLint rule for: C010 – Không nên có hơn 3 cấp lồng nhau (nested block)
 * Rule ID: custom/c010
 * Goal: Limit nested blocks (if/for/while/switch) to maximum 3 levels to improve readability and maintainability
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Không nên có hơn 3 cấp lồng nhau (nested block)",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: {
            type: "integer",
            minimum: 1
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      tooDeep: "Block nesting is too deep (level {{depth}}). Maximum allowed is {{maxDepth}} levels."
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const maxDepth = options.maxDepth || 3;
    let blockStack = [];

    function enterBlock(node) {
      blockStack.push(node);
      const depth = blockStack.length;

      if (depth > maxDepth) {
        context.report({
          node,
          messageId: "tooDeep",
          data: {
            depth,
            maxDepth
          }
        });
      }
    }

    function exitBlock() {
      blockStack.pop();
    }

    return {
      // Handle if statements
      IfStatement: enterBlock,
      'IfStatement:exit': exitBlock,
      
      // Handle for loops
      ForStatement: enterBlock,
      'ForStatement:exit': exitBlock,
      
      ForInStatement: enterBlock,
      'ForInStatement:exit': exitBlock,
      
      ForOfStatement: enterBlock,
      'ForOfStatement:exit': exitBlock,
      
      // Handle while loops
      WhileStatement: enterBlock,
      'WhileStatement:exit': exitBlock,
      
      DoWhileStatement: enterBlock,
      'DoWhileStatement:exit': exitBlock,
      
      // Handle switch statements
      SwitchStatement: enterBlock,
      'SwitchStatement:exit': exitBlock,
      
      // Handle try-catch blocks
      TryStatement: enterBlock,
      'TryStatement:exit': exitBlock,
      
      // Handle with statements (though rarely used)
      WithStatement: enterBlock,
      'WithStatement:exit': exitBlock
    };
  }
};
