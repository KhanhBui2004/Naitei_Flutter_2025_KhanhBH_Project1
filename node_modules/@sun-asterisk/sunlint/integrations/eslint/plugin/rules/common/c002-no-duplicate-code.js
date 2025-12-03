/**
 * Custom ESLint rule for: C002 – Không để trùng lặp code > 10 dòng
 * Rule ID: custom/c002
 * Purpose: Detect duplicate code blocks longer than 10 lines to maintain DRY principle
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Detect duplicate code blocks longer than 10 lines",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          minLines: {
            type: "number",
            minimum: 1,
            default: 10
          },
          ignoreComments: {
            type: "boolean",
            default: true
          },
          ignoreWhitespace: {
            type: "boolean", 
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      duplicateCode: "Duplicate code block found ({{lines}} lines). Consider extracting into a shared function or module."
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const minLines = options.minLines || 10;
    const ignoreComments = options.ignoreComments !== false;
    const ignoreWhitespace = options.ignoreWhitespace !== false;
    
    const sourceCode = context.getSourceCode();
    const codeBlocks = new Map();
    
    function normalizeCode(text) {
      let normalized = text;
      
      if (ignoreWhitespace) {
        // Remove extra whitespace and normalize spacing
        normalized = normalized
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      if (ignoreComments) {
        // Remove single line comments
        normalized = normalized.replace(/\/\/.*$/gm, '');
        // Remove multi-line comments
        normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
      }
      
      return normalized;
    }
    
    function getCodeLines(node) {
      const startLine = node.loc.start.line;
      const endLine = node.loc.end.line;
      const lines = [];
      
      for (let i = startLine; i <= endLine; i++) {
        const line = sourceCode.lines[i - 1];
        if (line !== undefined) {
          lines.push(line);
        }
      }
      
      return lines;
    }
    
    function analyzeNode(node) {
      const lines = getCodeLines(node);
      
      if (lines.length < minLines) {
        return;
      }
      
      const codeText = lines.join('\n');
      const normalizedCode = normalizeCode(codeText);
      
      // Skip if normalized code is too short after cleaning
      if (normalizedCode.length < 20) {
        return;
      }
      
      const codeHash = normalizedCode;
      
      if (codeBlocks.has(codeHash)) {
        const existingNodes = codeBlocks.get(codeHash);
        
        // Report duplicate for current node
        context.report({
          node,
          messageId: "duplicateCode",
          data: {
            lines: lines.length
          }
        });
        
        // Also report the first occurrence if not already reported
        existingNodes.forEach(existingNode => {
          if (!existingNode.reported) {
            context.report({
              node: existingNode.node,
              messageId: "duplicateCode", 
              data: {
                lines: existingNode.lines
              }
            });
            existingNode.reported = true;
          }
        });
        
        existingNodes.push({ node, lines: lines.length, reported: true });
      } else {
        codeBlocks.set(codeHash, [{ node, lines: lines.length, reported: false }]);
      }
    }
    
    return {
      // Check function declarations
      FunctionDeclaration(node) {
        if (node.body) {
          analyzeNode(node.body);
        }
      },
      
      // Check function expressions  
      FunctionExpression(node) {
        if (node.body) {
          analyzeNode(node.body);
        }
      },
      
      // Check arrow functions
      ArrowFunctionExpression(node) {
        if (node.body && node.body.type === 'BlockStatement') {
          analyzeNode(node.body);
        }
      },
      
      // Check method definitions
      MethodDefinition(node) {
        if (node.value && node.value.body) {
          analyzeNode(node.value.body);
        }
      },
      
      // Check block statements (general code blocks)
      BlockStatement(node) {
        // Only analyze block statements that are not function bodies
        const parent = node.parent;
        if (parent && 
            parent.type !== 'FunctionDeclaration' &&
            parent.type !== 'FunctionExpression' &&
            parent.type !== 'ArrowFunctionExpression' &&
            parent.type !== 'MethodDefinition') {
          analyzeNode(node);
        }
      },
      
      // Check if/else statements
      IfStatement(node) {
        if (node.consequent && node.consequent.type === 'BlockStatement') {
          analyzeNode(node.consequent);
        }
        if (node.alternate && node.alternate.type === 'BlockStatement') {
          analyzeNode(node.alternate);
        }
      },
      
      // Check loop bodies
      ForStatement(node) {
        if (node.body && node.body.type === 'BlockStatement') {
          analyzeNode(node.body);
        }
      },
      
      WhileStatement(node) {
        if (node.body && node.body.type === 'BlockStatement') {
          analyzeNode(node.body);
        }
      },
      
      DoWhileStatement(node) {
        if (node.body && node.body.type === 'BlockStatement') {
          analyzeNode(node.body);
        }
      }
    };
  }
};
