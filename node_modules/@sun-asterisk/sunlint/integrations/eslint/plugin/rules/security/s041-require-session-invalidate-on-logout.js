/**
 * Custom ESLint rule: S041 – Require session invalidation on logout
 * Rule ID: custom/s041 
 * Purpose: Ensure logout handlers properly invalidate session tokens and clear cookies
 * OWASP 3.3.1: Verify that logout and expiration invalidate the session token
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure logout handlers properly invalidate session tokens and prevent session reuse",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSessionInvalidation: "Logout method '{{method}}' must invalidate session token. Use session.invalidate(), req.session.destroy(), or equivalent session cleanup.",
      missingCookieClear: "Logout method '{{method}}' should clear authentication cookies to prevent session reuse.",
      missingCacheControl: "Logout method '{{method}}' should set cache-control headers to prevent back button authentication.",
    },
  },

  create(context) {
    // Keywords that indicate logout functionality
    const logoutKeywords = [
      "logout", "signout", "sign-out", "logoff", "signoff", 
      "disconnect", "terminate", "exit", "end-session"
    ];

    // Session invalidation methods
    const sessionInvalidationMethods = [
      "invalidate", "destroy", "remove", "clear", "delete",
      "expire", "revoke", "blacklist"
    ];

    // Cookie clearing methods
    const cookieClearMethods = [
      "clearCookie", "removeCookie", "deleteCookie", "expireCookie"
    ];

    // Cache control methods
    const cacheControlMethods = [
      "setHeader", "header", "set", "no-cache", "no-store"
    ];

    function isLogoutMethod(name) {
      if (!name) return false;
      const lowerName = name.toLowerCase();
      return logoutKeywords.some(keyword => lowerName.includes(keyword));
    }

    function checkLogoutMethodBody(node, methodName) {
      let hasSessionInvalidation = false;
      let hasCookieClearing = false; 
      let hasCacheControl = false;

      function checkNode(n, visited = new Set()) {
        if (!n || visited.has(n)) return;
        visited.add(n);

        // Check for session invalidation
        if (n.type === "CallExpression") {
          const callee = n.callee;
          
          // session.invalidate(), req.session.destroy(), etc.
          if (callee.type === "MemberExpression") {
            const property = callee.property.name;
            const object = callee.object;
            
            if (sessionInvalidationMethods.includes(property)) {
              // Check if it's session-related: session.invalidate(), req.session.destroy()
              if (object.type === "Identifier" && object.name === "session") {
                hasSessionInvalidation = true;
              } else if (object.type === "MemberExpression" && 
                        object.property && object.property.name === "session") {
                hasSessionInvalidation = true;
              }
            }

            // Check for cookie clearing: res.clearCookie()
            if (cookieClearMethods.includes(property)) {
              hasCookieClearing = true;
            }

            // Check for cache control headers
            if (cacheControlMethods.includes(property)) {
              const args = n.arguments;
              if (args.length > 0) {
                const firstArg = args[0];
                if (firstArg.type === "Literal") {
                  const header = firstArg.value;
                  if (typeof header === "string" && 
                      (header.toLowerCase().includes("cache-control") ||
                       header.toLowerCase().includes("pragma"))) {
                    hasCacheControl = true;
                  }
                }
              }
            }
          }
        }

        // Recursively check specific node types to avoid infinite loops
        const nodeTypesToCheck = [
          'BlockStatement', 'ExpressionStatement', 'CallExpression', 
          'MemberExpression', 'ArrowFunctionExpression', 'FunctionExpression'
        ];

        for (const key in n) {
          if (n[key] && typeof n[key] === "object" && key !== 'parent') {
            if (Array.isArray(n[key])) {
              n[key].forEach(child => {
                if (child && child.type && nodeTypesToCheck.includes(child.type)) {
                  checkNode(child, visited);
                }
              });
            } else if (n[key].type && nodeTypesToCheck.includes(n[key].type)) {
              checkNode(n[key], visited);
            }
          }
        }
      }

      // Check method body
      if (node.body) {
        checkNode(node.body);
      }

      // Report missing requirements
      if (!hasSessionInvalidation) {
        context.report({
          node,
          messageId: "missingSessionInvalidation", 
          data: { method: methodName }
        });
      }

      if (!hasCookieClearing) {
        context.report({
          node,
          messageId: "missingCookieClear",
          data: { method: methodName }
        });
      }

      if (!hasCacheControl) {
        context.report({
          node,
          messageId: "missingCacheControl",
          data: { method: methodName }
        });
      }
    }

    return {
      // Check class methods (NestJS controllers)
      MethodDefinition(node) {
        const methodName = node.key.name;
        if (isLogoutMethod(methodName)) {
          checkLogoutMethodBody(node.value, methodName);
        }
      },

      // Check function declarations
      FunctionDeclaration(node) {
        const functionName = node.id?.name;
        if (isLogoutMethod(functionName)) {
          checkLogoutMethodBody(node, functionName);
        }
      },

      // Check arrow functions and function expressions assigned to variables
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.init) {
          const varName = node.id.name;
          if (isLogoutMethod(varName)) {
            if (node.init.type === "ArrowFunctionExpression" || 
                node.init.type === "FunctionExpression") {
              checkLogoutMethodBody(node.init, varName);
            }
          }
        }
      },

      // Check route handlers with logout paths
      CallExpression(node) {
        const callee = node.callee;
        
        // Express/NestJS route: app.post('/logout', handler)
        if (callee.type === "MemberExpression" && 
            ["post", "get", "put", "delete"].includes(callee.property.name) &&
            node.arguments.length >= 2) {
          
          const pathArg = node.arguments[0];
          if (pathArg.type === "Literal" && typeof pathArg.value === "string") {
            const path = pathArg.value.toLowerCase();
            if (logoutKeywords.some(keyword => path.includes(keyword))) {
              const handler = node.arguments[node.arguments.length - 1];
              if (handler.type === "ArrowFunctionExpression" || 
                  handler.type === "FunctionExpression") {
                checkLogoutMethodBody(handler, `route handler for ${pathArg.value}`);
              }
            }
          }
        }
      }
    };
  },
};
