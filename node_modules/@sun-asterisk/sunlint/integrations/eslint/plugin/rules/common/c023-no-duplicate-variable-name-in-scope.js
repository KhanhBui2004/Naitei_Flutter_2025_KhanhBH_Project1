/**
 * Custom ESLint rule for: C023 – Do not use duplicate variable names in the same scope
 * Rule ID: custom/c023
 * Purpose: Prevent variable name shadowing and maintain clear variable scoping
 */

const c023Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Do not use duplicate variable names in the same scope",
      recommended: false
    },
    schema: [],
    messages: {
      duplicateVariable: "Variable '{{name}}' is already declared in this scope"
    }
  },
  create(context) {
    const scopeStack = [];
    const variableMap = new Map();

    function enterScope() {
      scopeStack.push(new Map());
    }

    function exitScope() {
      const scope = scopeStack.pop();
      // Clean up variables from the exited scope
      for (const [name, info] of scope) {
        const globalInfo = variableMap.get(name);
        if (globalInfo) {
          globalInfo.scopes.delete(scope);
          if (globalInfo.scopes.size === 0) {
            variableMap.delete(name);
          }
        }
      }
    }

    function checkVariable(node, name) {
      if (scopeStack.length === 0) return;

      const currentScope = scopeStack[scopeStack.length - 1];
      
      // Check if variable is already declared in current scope
      if (currentScope.has(name)) {
        context.report({
          node,
          messageId: "duplicateVariable",
          data: { name }
        });
        return;
      }

      // Add variable to current scope
      currentScope.set(name, {
        node,
        scopes: new Set([currentScope])
      });

      // Update global variable map
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          scopes: new Set([currentScope])
        });
      } else {
        variableMap.get(name).scopes.add(currentScope);
      }
    }

    return {
      Program() {
        enterScope();
      },
      "Program:exit"() {
        exitScope();
      },
      FunctionDeclaration() {
        enterScope();
      },
      "FunctionDeclaration:exit"() {
        exitScope();
      },
      FunctionExpression() {
        enterScope();
      },
      "FunctionExpression:exit"() {
        exitScope();
      },
      ArrowFunctionExpression() {
        enterScope();
      },
      "ArrowFunctionExpression:exit"() {
        exitScope();
      },
      BlockStatement() {
        enterScope();
      },
      "BlockStatement:exit"() {
        exitScope();
      },
      CatchClause() {
        enterScope();
      },
      "CatchClause:exit"() {
        exitScope();
      },
      ForStatement() {
        enterScope();
      },
      "ForStatement:exit"() {
        exitScope();
      },
      ForInStatement() {
        enterScope();
      },
      "ForInStatement:exit"() {
        exitScope();
      },
      ForOfStatement() {
        enterScope();
      },
      "ForOfStatement:exit"() {
        exitScope();
      },
      SwitchStatement() {
        enterScope();
      },
      "SwitchStatement:exit"() {
        exitScope();
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          checkVariable(node, node.id.name);
        }
      }
    };
  }
};

module.exports = c023Rule;
