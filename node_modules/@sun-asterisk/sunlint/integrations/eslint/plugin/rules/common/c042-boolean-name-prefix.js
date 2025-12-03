/**
 * Custom ESLint rule for: C042 – Boolean variable names should start with `is`, `has`, or `should`
 * Rule ID: custom/c042
 * Purpose: Ensure boolean variables have clear naming conventions
 */

const c042Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Boolean variable names should start with `is`, `has`, or `should`",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedPrefixes: {
            type: "array",
            items: { type: "string" },
            description: "Additional boolean prefixes to allow (default: is, has, should, can, will, must, may)"
          },
          strictMode: {
            type: "boolean",
            description: "Whether to enforce strict boolean prefixes only (default: false)"
          },
          ignoredNames: {
            type: "array",
            items: { type: "string" },
            description: "Variable names to ignore (e.g., common patterns like 'flag', 'enabled')"
          },
          checkReturnTypes: {
            type: "boolean",
            description: "Whether to check function return types for boolean naming (default: true)"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      booleanNaming: "Boolean variable '{{name}}' should start with a descriptive prefix like 'is', 'has', or 'should'. Consider: {{suggestions}}.",
      booleanFunction: "Function '{{name}}' returns boolean but name doesn't follow boolean naming convention. Consider: {{suggestions}}.",
      improperPrefix: "Variable '{{name}}' uses prefix '{{prefix}}' but is not a boolean type.",
      strictPrefix: "Boolean variable '{{name}}' must use one of the allowed prefixes: {{allowedPrefixes}}."
    }
  },

  create(context) {
    const options = context.options[0] || {};
    
    // Default boolean prefixes
    const defaultPrefixes = ['is', 'has', 'should', 'can', 'will', 'must', 'may', 'was', 'were'];
    const allowedPrefixes = new Set([
      ...defaultPrefixes,
      ...(options.allowedPrefixes || [])
    ]);

    const strictMode = options.strictMode || false;
    const ignoredNames = new Set(options.ignoredNames || ['flag', 'enabled', 'disabled', 'active', 'valid', 'ok']);
    const checkReturnTypes = options.checkReturnTypes !== false;

    // Common boolean value patterns
    const booleanValuePatterns = [
      /^(true|false)$/,
      /^!(.*)/,  // Negation
      /^.*\s*(===|!==|==|!=|<|>|<=|>=)\s*.*/,  // Comparison
      /^.*\s*(&&|\|\|)\s*.*/,  // Logical operators
    ];

    // Function call patterns that typically return boolean
    const booleanFunctionPatterns = [
      /^(test|check|validate|verify|confirm|ensure).*$/i,
      /^.*\.(test|includes|startsWith|endsWith|match)$/i,
      /^(Array\.isArray|Number\.isNaN|Number\.isFinite)$/i
    ];

    function startsWithBooleanPrefix(name) {
      const lowerName = name.toLowerCase();
      return Array.from(allowedPrefixes).some(prefix => 
        lowerName.startsWith(prefix.toLowerCase())
      );
    }

    function generateSuggestions(name) {
      const suggestions = [
        `is${name.charAt(0).toUpperCase() + name.slice(1)}`,
        `has${name.charAt(0).toUpperCase() + name.slice(1)}`,
        `should${name.charAt(0).toUpperCase() + name.slice(1)}`
      ];
      return suggestions.join(', ');
    }

    function isBooleanLiteral(node) {
      if (!node) return false;
      
      if (node.type === 'Literal') {
        return typeof node.value === 'boolean';
      }
      
      if (node.type === 'UnaryExpression' && node.operator === '!') {
        return true;
      }
      
      if (node.type === 'BinaryExpression') {
        const comparisonOps = ['===', '!==', '==', '!=', '<', '>', '<=', '>='];
        const logicalOps = ['&&', '||'];
        return comparisonOps.includes(node.operator) || logicalOps.includes(node.operator);
      }
      
      if (node.type === 'LogicalExpression') {
        return ['&&', '||'].includes(node.operator);
      }

      if (node.type === 'CallExpression') {
        try {
          const source = context.getSourceCode();
          const callText = source.getText(node);
          return booleanFunctionPatterns.some(pattern => pattern.test(callText));
        } catch (error) {
          // If we can't get source text, assume it's not boolean
          return false;
        }
      }

      return false;
    }

    function isBooleanTypeAnnotation(node) {
      // TypeScript type annotations
      if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
        const typeNode = node.typeAnnotation.typeAnnotation;
        return typeNode.type === 'TSBooleanKeyword';
      }
      return false;
    }

    function getFunctionReturnType(node) {
      // Check TypeScript return type annotation
      if (node.returnType && node.returnType.typeAnnotation) {
        return node.returnType.typeAnnotation.type === 'TSBooleanKeyword';
      }

      // Analyze return statements with safe traversal
      const returnStatements = [];
      const visitedNodes = new WeakSet();
      
      function findReturnStatements(astNode, depth = 0) {
        // Prevent infinite recursion
        if (depth > 50 || !astNode || typeof astNode !== 'object' || visitedNodes.has(astNode)) {
          return;
        }
        
        visitedNodes.add(astNode);
        
        if (astNode.type === 'ReturnStatement') {
          returnStatements.push(astNode);
          return; // Don't traverse further into return statements
        }
        
        // Stop traversing into nested functions to avoid checking their returns
        if (astNode.type === 'FunctionDeclaration' || 
            astNode.type === 'FunctionExpression' || 
            astNode.type === 'ArrowFunctionExpression') {
          if (astNode !== node) { // Don't skip the original node
            return;
          }
        }
        
        // Safely traverse specific node properties that might contain return statements
        const propertiesToCheck = ['body', 'consequent', 'alternate', 'cases', 'statements'];
        
        for (const prop of propertiesToCheck) {
          if (astNode[prop]) {
            if (Array.isArray(astNode[prop])) {
              astNode[prop].forEach(child => {
                if (child && typeof child === 'object') {
                  findReturnStatements(child, depth + 1);
                }
              });
            } else if (typeof astNode[prop] === 'object') {
              findReturnStatements(astNode[prop], depth + 1);
            }
          }
        }
      }

      if (node.body) {
        findReturnStatements(node.body);
      }

      // Check if all return statements return boolean values
      if (returnStatements.length > 0) {
        return returnStatements.every(stmt => 
          stmt.argument && isBooleanLiteral(stmt.argument)
        );
      }

      return false;
    }

    function checkVariableName(node, name, init = null) {
      if (!name) return;
      
      // Skip ignored names
      if (ignoredNames.has(name.toLowerCase())) {
        return;
      }

      // Skip very short names (likely not descriptive anyway)
      if (name.length <= 2) {
        return;
      }

      const hasBooleanPrefix = startsWithBooleanPrefix(name);
      const isBooleanType = isBooleanTypeAnnotation(node);
      
      let isBooleanValue = false;
      try {
        isBooleanValue = init && isBooleanLiteral(init);
      } catch (error) {
        // Skip boolean value check if we can't determine it safely
        isBooleanValue = false;
      }

      // Case 1: Variable has boolean type annotation or boolean value
      if (isBooleanType || isBooleanValue) {
        if (!hasBooleanPrefix) {
          if (strictMode) {
            context.report({
              node,
              messageId: "strictPrefix",
              data: {
                name,
                allowedPrefixes: Array.from(allowedPrefixes).join(', ')
              }
            });
          } else {
            context.report({
              node,
              messageId: "booleanNaming",
              data: {
                name,
                suggestions: generateSuggestions(name)
              }
            });
          }
        }
      }

      // Case 2: Variable has boolean prefix but not boolean type/value
      else if (hasBooleanPrefix && !isBooleanType && !isBooleanValue) {
        // Only warn if we can determine it's definitely not boolean
        if (init && init.type === 'Literal' && typeof init.value !== 'boolean') {
          const prefix = Array.from(allowedPrefixes).find(p => 
            name.toLowerCase().startsWith(p.toLowerCase())
          );
          context.report({
            node,
            messageId: "improperPrefix",
            data: {
              name,
              prefix
            }
          });
        }
      }
    }

    function checkFunctionName(node, name) {
      if (!checkReturnTypes || !name) return;

      // Skip ignored names
      if (ignoredNames.has(name.toLowerCase())) {
        return;
      }

      // Skip very short names and common patterns
      if (name.length <= 3 || name === 'main' || name === 'init' || name === 'setup') {
        return;
      }

      // Skip constructor functions
      if (name[0] === name[0].toUpperCase()) {
        return;
      }

      // Skip event handlers and common callback patterns
      if (name.startsWith('handle') || name.startsWith('on') || name.includes('Handler') || name.includes('Callback')) {
        return;
      }

      const hasBooleanPrefix = startsWithBooleanPrefix(name);
      
      try {
        const returnsBooleanType = getFunctionReturnType(node);

        // Function returns boolean but doesn't have boolean name
        if (returnsBooleanType && !hasBooleanPrefix) {
          context.report({
            node: node.id || node,
            messageId: "booleanFunction",
            data: {
              name,
              suggestions: generateSuggestions(name)
            }
          });
        }
      } catch (error) {
        // Skip this check if we encounter an error to prevent crashes
        return;
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id && node.id.type === 'Identifier') {
          checkVariableName(node.id, node.id.name, node.init);
        } else if (node.id && node.id.type === 'ObjectPattern') {
          // Handle destructuring: const {isActive, hasPermission} = obj;
          node.id.properties.forEach(prop => {
            if (prop.type === 'Property' && prop.value && prop.value.type === 'Identifier') {
              checkVariableName(prop.value, prop.value.name);
            }
          });
        } else if (node.id && node.id.type === 'ArrayPattern') {
          // Handle array destructuring: const [isEnabled, hasAccess] = flags;
          node.id.elements.forEach(element => {
            if (element && element.type === 'Identifier') {
              checkVariableName(element, element.name);
            }
          });
        }
      },

      FunctionDeclaration(node) {
        if (node.id && node.id.name) {
          checkFunctionName(node, node.id.name);
        }

        // Check parameters
        if (node.params) {
          node.params.forEach(param => {
            if (param.type === 'Identifier') {
              checkVariableName(param, param.name);
            }
          });
        }
      },

      FunctionExpression(node) {
        // Check named function expressions
        if (node.id && node.id.name) {
          checkFunctionName(node, node.id.name);
        }

        // Check parameters
        if (node.params) {
          node.params.forEach(param => {
            if (param.type === 'Identifier') {
              checkVariableName(param, param.name);
            }
          });
        }
      },

      ArrowFunctionExpression(node) {
        // For arrow functions assigned to variables
        if (node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id) {
          checkFunctionName(node, node.parent.id.name);
        }

        // Check parameters
        if (node.params) {
          node.params.forEach(param => {
            if (param.type === 'Identifier') {
              checkVariableName(param, param.name);
            }
          });
        }
      },

      MethodDefinition(node) {
        // Check class methods
        if (node.key && node.key.name && node.kind === 'method') {
          checkFunctionName(node.value, node.key.name);
        }
      },

      Property(node) {
        // Check object method properties
        if (node.method && node.key && node.key.name) {
          checkFunctionName(node.value, node.key.name);
        }
        
        // Check boolean properties
        if (!node.method && node.key && node.key.name && node.value) {
          if (isBooleanLiteral(node.value)) {
            checkVariableName(node.key, node.key.name, node.value);
          }
        }
      }
    };
  }
};

module.exports = c042Rule;