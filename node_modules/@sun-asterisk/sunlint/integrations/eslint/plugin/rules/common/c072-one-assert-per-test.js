/**
 * Custom ESLint rule for: C072 – Each test should assert only one behavior (Single Assert Rule)
 * Rule ID: custom/c072
 * Purpose: A test case should only have one main behavior to test (one expect statement)
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Each test should assert only one behavior (Single Assert Rule)",
      recommended: false
    },
    schema: [],
    messages: {
      tooMany: "Test contains too many expect statements ({{count}}). Each test should have only one main behavior to verify."
    }
  },
  create(context) {
    function isTestFunction(node) {
      // Safety check for node structure
      if (!node || !node.callee) {
        return false;
      }

      // Check for test/it calls
      if (node.type === "CallExpression") {
        // Handle direct test/it calls
        if (node.callee.type === "Identifier") {
          return ["test", "it"].includes(node.callee.name);
        }
        
        // Handle imported test/it calls
        if (node.callee.type === "MemberExpression" &&
            node.callee.object.type === "Identifier" &&
            ["test", "it"].includes(node.callee.property.name)) {
          return true;
        }
      }

      return false;
    }

    function isDescribeBlock(node) {
      if (!node || !node.callee) {
        return false;
      }

      if (node.type === "CallExpression") {
        // Handle direct describe calls
        if (node.callee.type === "Identifier") {
          return node.callee.name === "describe";
        }
        
        // Handle imported describe calls
        if (node.callee.type === "MemberExpression" &&
            node.callee.object.type === "Identifier" &&
            node.callee.property.name === "describe") {
          return true;
        }
      }

      return false;
    }

    function isSetupOrTeardown(node) {
      if (!node || !node.callee) {
        return false;
      }

      if (node.type === "CallExpression") {
        const name = node.callee.type === "Identifier" 
          ? node.callee.name 
          : node.callee.type === "MemberExpression" 
            ? node.callee.property.name 
            : null;

        return ["beforeEach", "afterEach", "beforeAll", "afterAll"].includes(name);
      }

      return false;
    }

    function countExpectCalls(body) {
      let count = 0;

      function traverse(node) {
        // Safety check to ensure node exists and has type property
        if (!node || typeof node !== 'object' || !node.type) {
          return;
        }

        // Check if this node is an expect call
        if (
          node.type === "CallExpression" &&
          node.callee &&
          node.callee.type === "Identifier" &&
          node.callee.name === "expect"
        ) {
          count++;
        }

        // Safely traverse child nodes, but don't go into nested test functions
        for (const key in node) {
          if (key === 'parent' || key === 'range' || key === 'loc') {
            continue; // Skip circular references and metadata
          }
          
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(item => {
              if (item && typeof item === 'object' && item.type) {
                // Don't traverse into nested test functions
                if (!(item.type === "CallExpression" && isTestFunction(item))) {
                  traverse(item);
                }
              }
            });
          } else if (child && typeof child === 'object' && child.type) {
            // Don't traverse into nested test functions
            if (!(child.type === "CallExpression" && isTestFunction(child))) {
              traverse(child);
            }
          }
        }
      }

      traverse(body);
      return count;
    }

    return {
      CallExpression(node) {
        // Only check test/it function calls
        if (!isTestFunction(node)) {
          return;
        }

        // Ensure we have the required arguments (name and callback)
        if (!node.arguments || node.arguments.length < 2) {
          return;
        }

        const testCallback = node.arguments[1];
        
        // Check if the second argument is a function (test body)
        if (
          !testCallback ||
          (testCallback.type !== "FunctionExpression" && 
           testCallback.type !== "ArrowFunctionExpression")
        ) {
          return;
        }

        // Get the function body
        const fnBody = testCallback.body;
        if (!fnBody) {
          return;
        }

        // Handle both block statements and expression bodies
        let bodyToCheck = fnBody;
        if (testCallback.type === "ArrowFunctionExpression" && fnBody.type !== "BlockStatement") {
          // For arrow functions with expression bodies, wrap in a virtual block
          bodyToCheck = { type: "BlockStatement", body: [{ type: "ExpressionStatement", expression: fnBody }] };
        }

        // Count expect calls in the test body
        const expectCount = countExpectCalls(bodyToCheck);
        
        // Report if more than one expect statement
        if (expectCount > 1) {
          context.report({
            node,
            messageId: "tooMany",
            data: {
              count: expectCount
            }
          });
        }
      }
    };
  }
};
