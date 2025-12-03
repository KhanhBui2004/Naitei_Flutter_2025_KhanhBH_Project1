/**
 * Custom ESLint rule for: C075 – Functions must have explicit return type declarations
 * Rule ID: sunlint/c075
 * Purpose: Enforce explicit return type annotations for all functions to improve type safety
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Functions must have explicit return type declarations",
      recommended: true,
      category: "TypeScript"
    },
    schema: [
      {
        type: "object",
        properties: {
          allowExpressions: {
            type: "boolean",
            default: false
          },
          allowTypedFunctionExpressions: {
            type: "boolean", 
            default: true
          },
          allowHigherOrderFunctions: {
            type: "boolean",
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingReturnType: "Function '{{name}}' is missing explicit return type annotation. Consider adding ': ReturnType'",
      missingReturnTypeArrow: "Arrow function is missing explicit return type annotation. Consider adding ': ReturnType'",
      missingReturnTypeMethod: "Method '{{name}}' is missing explicit return type annotation. Consider adding ': ReturnType'"
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const allowExpressions = options.allowExpressions || false;
    const allowTypedFunctionExpressions = options.allowTypedFunctionExpressions || true;
    const allowHigherOrderFunctions = options.allowHigherOrderFunctions || true;

    function isTypedFunctionExpression(node) {
      const parent = node.parent;
      if (!parent) return false;

      // Variable declaration with type annotation
      if (parent.type === "VariableDeclarator" && parent.id && parent.id.typeAnnotation) {
        return true;
      }

      // Property with type annotation  
      if (parent.type === "Property" && parent.typeAnnotation) {
        return true;
      }

      // Assignment to typed variable
      if (parent.type === "AssignmentExpression" && parent.left && parent.left.typeAnnotation) {
        return true;
      }

      return false;
    }

    function isHigherOrderFunction(node) {
      // Check if function returns another function
      if (node.body && node.body.type === "BlockStatement") {
        // Simple heuristic: look for return statements that return functions
        return node.body.body.some(stmt => {
          if (stmt.type === "ReturnStatement" && stmt.argument) {
            return stmt.argument.type === "FunctionExpression" || 
                   stmt.argument.type === "ArrowFunctionExpression";
          }
          return false;
        });
      }
      
      // Arrow function directly returning function
      if (node.body && 
          (node.body.type === "FunctionExpression" || node.body.type === "ArrowFunctionExpression")) {
        return true;
      }

      return false;
    }

    function hasReturnTypeAnnotation(node) {
      return node.returnType !== null && node.returnType !== undefined;
    }

    function checkFunction(node) {
      // Skip if return type is already present
      if (hasReturnTypeAnnotation(node)) {
        return;
      }

      // Skip if this is a typed function expression and allowed
      if (allowTypedFunctionExpressions && isTypedFunctionExpression(node)) {
        return;
      }

      // Skip if this is a higher-order function and allowed
      if (allowHigherOrderFunctions && isHigherOrderFunction(node)) {
        return;
      }

      // Skip constructors
      if (node.parent && node.parent.type === "MethodDefinition" && node.parent.kind === "constructor") {
        return;
      }

      // Skip getters/setters (they have implicit return types)
      if (node.parent && node.parent.type === "MethodDefinition" && 
          (node.parent.kind === "get" || node.parent.kind === "set")) {
        return;
      }

      // Get function name for better error messages
      let functionName = "anonymous";
      if (node.id && node.id.name) {
        functionName = node.id.name;
      } else if (node.parent && node.parent.type === "VariableDeclarator" && node.parent.id) {
        functionName = node.parent.id.name;
      } else if (node.parent && node.parent.type === "Property" && node.parent.key) {
        functionName = node.parent.key.name || node.parent.key.value;
      } else if (node.parent && node.parent.type === "MethodDefinition" && node.parent.key) {
        functionName = node.parent.key.name;
      }

      // Report the violation
      const messageId = node.type === "ArrowFunctionExpression" ? "missingReturnTypeArrow" :
                       node.parent && node.parent.type === "MethodDefinition" ? "missingReturnTypeMethod" :
                       "missingReturnType";

      context.report({
        node,
        messageId,
        data: { name: functionName }
      });
    }

    return {
      FunctionDeclaration(node) {
        checkFunction(node);
      },
      FunctionExpression(node) {
        // Skip if expressions are allowed and this is a simple expression
        if (allowExpressions && node.parent && 
            (node.parent.type === "CallExpression" || node.parent.type === "ArrayExpression")) {
          return;
        }
        checkFunction(node);
      },
      ArrowFunctionExpression(node) {
        // Skip if expressions are allowed and this is a simple expression
        if (allowExpressions && node.parent && 
            (node.parent.type === "CallExpression" || node.parent.type === "ArrayExpression")) {
          return;
        }
        checkFunction(node);
      }
    };
  }
};
