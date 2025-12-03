/**
 * Custom ESLint rule for: C017 – Limit constructor logic
 * Rule ID: custom/c017
 * Purpose: Enforce minimal logic in constructors to maintain clean initialization
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit constructor logic",
      recommended: false
    },
    schema: [],
    messages: {
      constructorLogic: "Constructor contains complex logic: {{description}}. Move to initialization methods",
      tooManyStatements: "Constructor has too many statements ({{count}}). Consider simplifying or moving logic to initialization methods"
    }
  },
  create(context) {
    function isSimpleAssignment(node) {
      // Simple property assignments like this.prop = value
      if (node.type === "ExpressionStatement" && 
          node.expression.type === "AssignmentExpression" &&
          node.expression.left.type === "MemberExpression" &&
          node.expression.left.object.type === "ThisExpression") {
        
        // Check if right side is a simple value (not complex computation)
        const right = node.expression.right;
        return right.type === "Literal" ||
               right.type === "Identifier" ||
               (right.type === "MemberExpression" && right.property.name === "length") ||
               (right.type === "CallExpression" && right.callee.type === "Identifier" && 
                ['require', 'process'].includes(right.callee.name));
      }
      return false;
    }

    function isSimpleDeclaration(node) {
      // Simple variable declarations
      return node.type === "VariableDeclaration";
    }

    function isSuperCall(node) {
      // super() calls
      return node.type === "ExpressionStatement" && 
             node.expression.type === "CallExpression" &&
             node.expression.callee.type === "Super";
    }

    function isComplexLogic(node) {
      // Complex patterns that shouldn't be in constructor
      switch (node.type) {
        case "IfStatement":
        case "WhileStatement":
        case "ForStatement":
        case "SwitchStatement":
        case "TryStatement":
          return { type: "control_flow", description: "control flow statements" };
          
        case "ExpressionStatement":
          if (node.expression.type === "CallExpression") {
            const callee = node.expression.callee;
            
            // Method calls that aren't simple setters
            if (callee.type === "MemberExpression") {
              const methodName = callee.property.name;
              
              // Allow simple MobX observable setup
              if (methodName === "makeObservable" || methodName === "makeAutoObservable") {
                return null;
              }
              
              // Flag complex method calls
              if (!['push', 'set', 'add'].includes(methodName)) {
                return { type: "method_call", description: "complex method calls" };
              }
            }
            
            // Direct function calls (not method calls)
            if (callee.type === "Identifier" && 
                !['require', 'parseInt', 'parseFloat', 'Boolean', 'Number', 'String'].includes(callee.name)) {
              return { type: "function_call", description: "function calls" };
            }
          }
          
          // Complex assignments with computations
          if (node.expression.type === "AssignmentExpression") {
            const right = node.expression.right;
            if (right.type === "BinaryExpression" || 
                right.type === "ConditionalExpression" ||
                (right.type === "CallExpression" && 
                 right.callee.type === "MemberExpression" &&
                 !['map', 'filter', 'toString', 'slice'].includes(right.callee.property.name))) {
              return { type: "complex_assignment", description: "complex computations" };
            }
          }
          break;
      }
      
      return null;
    }

    return {
      MethodDefinition(node) {
        if (node.kind === "constructor" && node.value && node.value.body) {
          const statements = node.value.body.body;
          let complexLogicCount = 0;
          
          for (const stmt of statements) {
            // Skip simple assignments, declarations, and super calls
            if (isSimpleAssignment(stmt) || 
                isSimpleDeclaration(stmt) || 
                isSuperCall(stmt)) {
              continue;
            }
            
            // Check for complex logic
            const complexity = isComplexLogic(stmt);
            if (complexity) {
              context.report({
                node: stmt,
                messageId: "constructorLogic",
                data: {
                  description: complexity.description
                }
              });
              complexLogicCount++;
            }
          }
          
          // Also flag constructors with too many statements overall
          if (statements.length > 10) {
            context.report({
              node: node,
              messageId: "tooManyStatements", 
              data: {
                count: statements.length
              }
            });
          }
        }
      }
    };
  }
};
