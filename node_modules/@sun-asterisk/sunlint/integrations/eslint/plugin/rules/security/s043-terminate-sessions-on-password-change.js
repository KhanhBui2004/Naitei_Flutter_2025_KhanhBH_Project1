/**
 * Custom ESLint rule: S043 – Terminate all sessions on password change
 * Rule ID: custom/s043 
 * Purpose: Ensure password change methods terminate all other active sessions
 * OWASP 3.3.3: Verify that the application gives the option to terminate all other active sessions 
 * after a successful password change (including change via password reset/recovery)
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure password change methods terminate all other active sessions and require re-authentication",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSessionTermination: "Password change method '{{method}}' must terminate all other active sessions. Use sessionManager.terminateAllSessions(), tokenService.revokeAllTokens(), or equivalent session cleanup.",
      missingReAuthRequirement: "Password change method '{{method}}' should require re-authentication after successful password change.",
      incompleteImplementation: "Password change method '{{method}}' should both terminate existing sessions and require user re-authentication for security compliance.",
    },
  },

  create(context) {
    // Keywords that indicate password change functionality
    const passwordChangeKeywords = [
      "password", "passwd", "pwd", "changepassword", "change-password",
      "updatepassword", "update-password", "resetpassword", "reset-password",
      "newpassword", "new-password", "setpassword", "set-password"
    ];

    // Session termination methods
    const sessionTerminationMethods = [
      "terminateAllSessions", "revokeAllTokens", "invalidateAllSessions",
      "destroyAllSessions", "clearAllSessions", "terminateOtherSessions",
      "revokeOtherTokens", "logoutAllDevices", "signOutAllDevices",
      "terminateAll", "revokeAll", "invalidateAll", "destroyAll"
    ];

    // Re-authentication requirement methods
    const reAuthMethods = [
      "requireReAuth", "forceReAuth", "requireLogin", "forceLogin",
      "redirectToLogin", "requireAuthentication", "invalidateCurrentSession",
      "logout", "signOut", "clearCurrentSession"
    ];

    function isPasswordChangeMethod(name) {
      if (!name) return false;
      const lowerName = name.toLowerCase();
      return passwordChangeKeywords.some(keyword => lowerName.includes(keyword));
    }

    function checkPasswordChangeMethodBody(node, methodName) {
      let hasSessionTermination = false;
      let hasReAuthRequirement = false;

      function checkNode(n, visited = new Set()) {
        if (!n || visited.has(n)) return;
        visited.add(n);

        // Check for session termination calls
        if (n.type === "CallExpression") {
          const callee = n.callee;
          
          // Direct method calls: terminateAllSessions(), revokeAllTokens()
          if (callee.type === "Identifier") {
            if (sessionTerminationMethods.includes(callee.name)) {
              hasSessionTermination = true;
            }
            if (reAuthMethods.includes(callee.name)) {
              hasReAuthRequirement = true;
            }
          }
          
          // Member expressions: sessionManager.terminateAllSessions(), tokenService.revokeAllTokens()
          else if (callee.type === "MemberExpression") {
            const property = callee.property.name;
            
            if (sessionTerminationMethods.includes(property)) {
              hasSessionTermination = true;
            }
            if (reAuthMethods.includes(property)) {
              hasReAuthRequirement = true;
            }

            // Check for patterns like: sessionManager.terminateAll(), authService.revokeAll()
            if (property && (
              property.includes("terminate") || property.includes("revoke") ||
              property.includes("invalidate") || property.includes("destroy") ||
              property.includes("clear")
            )) {
              const methodCall = property.toLowerCase();
              if (methodCall.includes("all") || methodCall.includes("other")) {
                hasSessionTermination = true;
              }
            }
          }

          // Check function arguments and nested calls
          if (n.arguments) {
            n.arguments.forEach(arg => checkNode(arg, visited));
          }
        }

        // Check await expressions
        if (n.type === "AwaitExpression") {
          checkNode(n.argument, visited);
        }

        // Recursively check nested structures
        for (const key in n) {
          if (n[key] && typeof n[key] === "object") {
            if (Array.isArray(n[key])) {
              n[key].forEach(child => checkNode(child, visited));
            } else if (n[key].type) {
              checkNode(n[key], visited);
            }
          }
        }
      }

      // Analyze method body
      if (node.body) {
        if (node.body.type === "BlockStatement") {
          node.body.body.forEach(stmt => checkNode(stmt));
        } else {
          checkNode(node.body);
        }
      }

      return { hasSessionTermination, hasReAuthRequirement };
    }

    return {
      // Check method definitions
      MethodDefinition(node) {
        const methodName = node.key.name;
        if (isPasswordChangeMethod(methodName)) {
          const analysis = checkPasswordChangeMethodBody(node.value, methodName);
          
          if (!analysis.hasSessionTermination && !analysis.hasReAuthRequirement) {
            context.report({
              node: node.key,
              messageId: "incompleteImplementation",
              data: { method: methodName }
            });
          } else if (!analysis.hasSessionTermination) {
            context.report({
              node: node.key,
              messageId: "missingSessionTermination", 
              data: { method: methodName }
            });
          } else if (!analysis.hasReAuthRequirement) {
            context.report({
              node: node.key,
              messageId: "missingReAuthRequirement",
              data: { method: methodName }
            });
          }
        }
      },

      // Check function declarations
      FunctionDeclaration(node) {
        const functionName = node.id ? node.id.name : null;
        if (isPasswordChangeMethod(functionName)) {
          const analysis = checkPasswordChangeMethodBody(node, functionName);
          
          if (!analysis.hasSessionTermination && !analysis.hasReAuthRequirement) {
            context.report({
              node: node.id,
              messageId: "incompleteImplementation",
              data: { method: functionName }
            });
          } else if (!analysis.hasSessionTermination) {
            context.report({
              node: node.id,
              messageId: "missingSessionTermination",
              data: { method: functionName }
            });
          } else if (!analysis.hasReAuthRequirement) {
            context.report({
              node: node.id,
              messageId: "missingReAuthRequirement", 
              data: { method: functionName }
            });
          }
        }
      },

      // Check function expressions and arrow functions assigned to variables
      VariableDeclarator(node) {
        if (node.init && (node.init.type === "FunctionExpression" || node.init.type === "ArrowFunctionExpression")) {
          const varName = node.id.name;
          if (isPasswordChangeMethod(varName)) {
            const analysis = checkPasswordChangeMethodBody(node.init, varName);
            
            if (!analysis.hasSessionTermination && !analysis.hasReAuthRequirement) {
              context.report({
                node: node.id,
                messageId: "incompleteImplementation",
                data: { method: varName }
              });
            } else if (!analysis.hasSessionTermination) {
              context.report({
                node: node.id,
                messageId: "missingSessionTermination",
                data: { method: varName }
              });
            } else if (!analysis.hasReAuthRequirement) {
              context.report({
                node: node.id,
                messageId: "missingReAuthRequirement",
                data: { method: varName }
              });
            }
          }
        }
      },

      // Check property assignments (for object methods)
      Property(node) {
        if (node.value && (node.value.type === "FunctionExpression" || node.value.type === "ArrowFunctionExpression")) {
          const propName = node.key.name;
          if (isPasswordChangeMethod(propName)) {
            const analysis = checkPasswordChangeMethodBody(node.value, propName);
            
            if (!analysis.hasSessionTermination && !analysis.hasReAuthRequirement) {
              context.report({
                node: node.key,
                messageId: "incompleteImplementation",
                data: { method: propName }
              });
            } else if (!analysis.hasSessionTermination) {
              context.report({
                node: node.key,
                messageId: "missingSessionTermination",
                data: { method: propName }
              });
            } else if (!analysis.hasReAuthRequirement) {
              context.report({
                node: node.key,
                messageId: "missingReAuthRequirement",
                data: { method: propName }
              });
            }
          }
        }
      },
    };
  },
};
