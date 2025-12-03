/**
 * Custom ESLint rule: S042 – Require periodic re-authentication
 * Rule ID: custom/s042 
 * Purpose: Verify that if authenticators permit users to remain logged in, 
 *          re-authentication occurs periodically both when actively used or after an idle period
 * OWASP 3.3.2: If authenticators permit users to remain logged in, verify that 
 *              re-authentication occurs periodically both when actively used or after an idle period
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure periodic re-authentication is implemented for long-lived sessions",
      recommended: true,
    },
    schema: [],
    messages: {
      missingReauthentication: "Authentication method '{{method}}' should implement periodic re-authentication for long-lived sessions.",
      missingIdleTimeout: "Session configuration should include idle timeout mechanism for automatic logout.",
      missingActiveTimeout: "Session configuration should include maximum active session duration (e.g., 12 hours).",
      missing2FAForSensitive: "Sensitive operations should require two-factor authentication (2FA) regardless of session state.",
      missingReauthForSensitive: "Sensitive operations should require re-authentication even for active sessions.",
    },
  },

  create(context) {
    // Keywords that indicate authentication/session functionality
    const authKeywords = [
      "auth", "login", "signin", "sign-in", "authenticate", "session",
      "passport", "jwt", "token", "guard", "middleware"
    ];

    // Session configuration keywords
    const sessionConfigKeywords = [
      "session", "maxage", "expires", "timeout", "idle", "duration",
      "lifetime", "ttl", "expiry"
    ];

    // Sensitive operation keywords
    const sensitiveOperationKeywords = [
      "payment", "transfer", "withdraw", "deposit", "transaction",
      "delete", "remove", "destroy", "admin", "privilege", "role",
      "password", "email", "profile", "settings", "config"
    ];

    // Two-factor authentication keywords
    const tfaKeywords = ["2fa", "mfa", "totp", "otp", "authenticator"];

    // Re-authentication keywords
    const reauthKeywords = ["reauth", "re-auth", "verify", "confirm"];

    function isAuthenticationRelated(name) {
      if (!name) return false;
      const lowerName = name.toLowerCase();
      return authKeywords.some(keyword => lowerName.includes(keyword));
    }

    function isSensitiveOperation(name) {
      if (!name) return false;
      const lowerName = name.toLowerCase();
      return sensitiveOperationKeywords.some(keyword => lowerName.includes(keyword));
    }

    function hasSessionConfiguration(node) {
      let hasIdleTimeout = false;
      let hasMaxAge = false;

      function checkConfigObject(obj) {
        if (obj.type === "ObjectExpression") {
          obj.properties.forEach(prop => {
            if (prop.key && prop.key.name) {
              const keyName = prop.key.name.toLowerCase();
              if (keyName.includes("idle") || keyName.includes("timeout")) {
                hasIdleTimeout = true;
              }
              if (keyName.includes("maxage") || keyName.includes("expires") ||
                  keyName.includes("duration") || keyName.includes("lifetime")) {
                hasMaxAge = true;
              }
            }
          });
        }
      }

      // Check for session configuration in various patterns
      if (node.type === "CallExpression") {
        node.arguments.forEach(arg => {
          checkConfigObject(arg);
        });
      }

      return { hasIdleTimeout, hasMaxAge };
    }

    function hasReauthenticationLogic(node, visited = new Set()) {
      if (!node || visited.has(node)) return { hasReauth: false, has2FA: false };
      visited.add(node);

      let hasReauth = false;
      let has2FA = false;

      function checkNode(n) {
        if (!n || visited.has(n)) return;
        visited.add(n);

        // Check for re-authentication calls
        if (n.type === "CallExpression" && n.callee && n.callee.type === "MemberExpression") {
          const methodName = n.callee.property && n.callee.property.name;
          if (methodName && reauthKeywords.some(keyword => 
              methodName.toLowerCase().includes(keyword))) {
            hasReauth = true;
          }
        }

        // Check for 2FA implementation
        if (n.type === "CallExpression") {
          const callText = context.getSourceCode().getText(n).toLowerCase();
          if (tfaKeywords.some(keyword => callText.includes(keyword))) {
            has2FA = true;
          }
        }

        // Check identifier names
        if (n.type === "Identifier") {
          const name = n.name.toLowerCase();
          if (reauthKeywords.some(keyword => name.includes(keyword))) {
            hasReauth = true;
          }
          if (tfaKeywords.some(keyword => name.includes(keyword))) {
            has2FA = true;
          }
        }

        // Only check direct children to avoid deep recursion
        if (n.type === "BlockStatement" && n.body) {
          n.body.forEach(stmt => checkNode(stmt));
        } else if (n.type === "ExpressionStatement" && n.expression) {
          checkNode(n.expression);
        }
      }

      checkNode(node);
      return { hasReauth, has2FA };
    }

    return {
      // Check class methods (NestJS controllers/guards)
      MethodDefinition(node) {
        const methodName = node.key.name;
        
        if (isAuthenticationRelated(methodName)) {
          const { hasIdleTimeout, hasMaxAge } = hasSessionConfiguration(node);
          
          if (!hasIdleTimeout) {
            context.report({
              node,
              messageId: "missingIdleTimeout",
            });
          }
          
          if (!hasMaxAge) {
            context.report({
              node,
              messageId: "missingActiveTimeout",
            });
          }
        }

        if (isSensitiveOperation(methodName)) {
          const { hasReauth, has2FA } = hasReauthenticationLogic(node.value);
          
          if (!hasReauth) {
            context.report({
              node,
              messageId: "missingReauthForSensitive",
            });
          }
          
          if (!has2FA) {
            context.report({
              node,
              messageId: "missing2FAForSensitive",
            });
          }
        }
      },

      // Check function declarations
      FunctionDeclaration(node) {
        const functionName = node.id ? node.id.name : null;
        
        if (isAuthenticationRelated(functionName)) {
          const { hasIdleTimeout, hasMaxAge } = hasSessionConfiguration(node);
          
          if (!hasIdleTimeout) {
            context.report({
              node,
              messageId: "missingIdleTimeout",
            });
          }
          
          if (!hasMaxAge) {
            context.report({
              node,
              messageId: "missingActiveTimeout",
            });
          }
        }

        if (isSensitiveOperation(functionName)) {
          const { hasReauth, has2FA } = hasReauthenticationLogic(node);
          
          if (!hasReauth) {
            context.report({
              node,
              messageId: "missingReauthForSensitive",
            });
          }
        }
      },

      // Check arrow functions assigned to variables
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.init) {
          const varName = node.id.name;
          
          if (isAuthenticationRelated(varName) && 
              (node.init.type === "ArrowFunctionExpression" || 
               node.init.type === "FunctionExpression")) {
            
            const { hasIdleTimeout, hasMaxAge } = hasSessionConfiguration(node.init);
            
            if (!hasIdleTimeout) {
              context.report({
                node,
                messageId: "missingIdleTimeout",
              });
            }
            
            if (!hasMaxAge) {
              context.report({
                node,
                messageId: "missingActiveTimeout",
              });
            }
          }

          if (isSensitiveOperation(varName) && 
              (node.init.type === "ArrowFunctionExpression" || 
               node.init.type === "FunctionExpression")) {
            
            const { hasReauth, has2FA } = hasReauthenticationLogic(node.init);
            
            if (!hasReauth) {
              context.report({
                node,
                messageId: "missingReauthForSensitive",
              });
            }
          }
        }
      },

      // Check session configuration calls
      CallExpression(node) {
        const sourceCode = context.getSourceCode().getText(node).toLowerCase();
        
        // Check for session middleware configuration
        if (sourceCode.includes("session") && 
            (sourceCode.includes("express") || sourceCode.includes("app.use"))) {
          
          const { hasIdleTimeout, hasMaxAge } = hasSessionConfiguration(node);
          
          if (!hasIdleTimeout) {
            context.report({
              node,
              messageId: "missingIdleTimeout",
            });
          }
          
          if (!hasMaxAge) {
            context.report({
              node,
              messageId: "missingActiveTimeout",
            });
          }
        }
      }
    };
  },
};
