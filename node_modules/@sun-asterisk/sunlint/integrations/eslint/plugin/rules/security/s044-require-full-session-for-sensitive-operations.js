/**
 * Custom ESLint rule: S044 – Require full session for sensitive operations
 * Rule ID: custom/s044 
 * Purpose: Verify the application ensures a full, valid login session or requires re-authentication 
 * or secondary verification before allowing any sensitive transactions or account modifications
 * OWASP 3.7.1: Verify the application ensures a full, valid login session or requires re-authentication 
 * or secondary verification before allowing any sensitive transactions or account modifications
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require full session validation or re-authentication before sensitive operations",
      recommended: true,
    },
    schema: [],
    messages: {
      missingSensitiveOperationProtection: "Sensitive operation '{{method}}' requires full session validation or re-authentication. Use sessionManager.validateFullSession(), requireReAuth(), or 2FA verification.",
      incompleteSessionValidation: "Method '{{method}}' should validate complete session state before allowing sensitive operations.",
      missingSecondaryVerification: "Sensitive operation '{{method}}' should require secondary verification (2FA, password confirmation) for enhanced security.",
      halfOpenSessionAccess: "Method '{{method}}' may allow access with incomplete session. Ensure full session validation before sensitive operations.",
    },
  },

  create(context) {
    // Keywords that indicate sensitive operations
    const sensitiveOperationKeywords = [
      // Account modifications
      "password", "passwd", "pwd", "changepassword", "updatepassword", "resetpassword",
      "email", "changeemail", "updateemail", "setemail",
      "profile", "updateprofile", "changeprofile", "editprofile",
      "account", "updateaccount", "changeaccount", "deleteaccount",
      "user", "updateuser", "changeuser", "deleteuser",
      
      // Financial/Transaction operations
      "payment", "pay", "transfer", "transaction", "withdraw", "deposit",
      "purchase", "buy", "order", "checkout", "billing",
      "balance", "fund", "money", "amount", "financial",
      
      // Security operations
      "permission", "role", "access", "privilege", "authorization",
      "security", "admin", "superuser", "root",
      "settings", "config", "configuration", "sensitive",
      
      // Data operations
      "delete", "remove", "destroy", "drop", "truncate",
      "export", "import", "backup", "restore", "migration"
    ];

    // Session validation methods
    const sessionValidationMethods = [
      "validateFullSession", "checkFullSession", "ensureFullSession",
      "validateSession", "checkSession", "ensureSession",
      "isFullyAuthenticated", "hasFullSession", "isSessionValid",
      "validateAuthState", "checkAuthState", "ensureAuthState",
      "verifySession", "confirmSession", "validateUser"
    ];

    // Re-authentication methods
    const reAuthMethods = [
      "requireReAuth", "forceReAuth", "requireAuthentication",
      "requestReAuth", "validateReAuth", "checkReAuth",
      "confirmPassword", "verifyPassword", "validatePassword",
      "requireLogin", "forceLogin", "redirectToLogin"
    ];

    // Secondary verification methods (2FA, etc.)
    const secondaryVerificationMethods = [
      "require2FA", "requireTwoFactor", "verifyTwoFactor",
      "requireOTP", "verifyOTP", "validateOTP",
      "requireMFA", "verifyMFA", "validateMFA",
      "requireSMS", "verifySMS", "validateSMS",
      "requireEmail", "verifyEmail", "validateEmail",
      "requireSecondaryAuth", "verifySecondaryAuth"
    ];

    // Patterns indicating half-open or incomplete sessions
    const halfOpenSessionPatterns = [
      "partial", "incomplete", "temp", "temporary", "pending",
      "halfopen", "half-open", "inprogress", "in-progress"
    ];

    function isSensitiveOperation(name) {
      if (!name) return false;
      const lowerName = name.toLowerCase();
      return sensitiveOperationKeywords.some(keyword => 
        lowerName.includes(keyword) || 
        name.toLowerCase().includes(keyword)
      );
    }

    function checkSensitiveOperationMethodBody(node, methodName) {
      let hasSessionValidation = false;
      let hasReAuthentication = false;
      let hasSecondaryVerification = false;
      let hasHalfOpenSessionCheck = false;

      function analyzeNode(n, visited = new Set()) {
        if (!n || visited.has(n)) return;
        visited.add(n);

        // Check for method calls
        if (n.type === "CallExpression") {
          const callee = n.callee;
          
          // Direct method calls
          if (callee.type === "Identifier") {
            const methodName = callee.name;
            
            if (sessionValidationMethods.includes(methodName)) {
              hasSessionValidation = true;
            }
            if (reAuthMethods.includes(methodName)) {
              hasReAuthentication = true;
            }
            if (secondaryVerificationMethods.includes(methodName)) {
              hasSecondaryVerification = true;
            }
          }
          
          // Member expressions: sessionManager.validateFullSession()
          else if (callee.type === "MemberExpression") {
            const property = callee.property.name;
            
            if (sessionValidationMethods.includes(property)) {
              hasSessionValidation = true;
            }
            if (reAuthMethods.includes(property)) {
              hasReAuthentication = true;
            }
            if (secondaryVerificationMethods.includes(property)) {
              hasSecondaryVerification = true;
            }

            // Check for session validation patterns
            if (property && (
              property.includes("validate") || property.includes("check") ||
              property.includes("verify") || property.includes("ensure")
            )) {
              const methodCall = property.toLowerCase();
              if (methodCall.includes("session") || methodCall.includes("auth")) {
                hasSessionValidation = true;
              }
            }
          }
        }

        // Check for conditional statements that might validate session
        if (n.type === "IfStatement") {
          const test = n.test;
          if (test && test.type === "CallExpression") {
            const callee = test.callee;
            
            // Check for session validation in if conditions
            if (callee.type === "MemberExpression") {
              const property = callee.property.name;
              if (property && (
                property.includes("isAuthenticated") ||
                property.includes("hasSession") ||
                property.includes("isValid")
              )) {
                hasSessionValidation = true;
              }
            }
          }
        }

        // Check for guard clauses
        if (n.type === "ThrowStatement" || n.type === "ReturnStatement") {
          // Look for early returns/throws that might be session guards
          if (n.argument && n.argument.type === "CallExpression") {
            const callee = n.argument.callee;
            if (callee.type === "Identifier" && callee.name === "Error") {
              hasSessionValidation = true; // Assume error throwing is session validation
            }
          }
        }

        // Recursively check child nodes
        for (const key in n) {
          if (key === "parent" || key === "range" || key === "loc") continue;
          const child = n[key];
          
          if (Array.isArray(child)) {
            child.forEach(item => {
              if (item && typeof item === "object") {
                analyzeNode(item, visited);
              }
            });
          } else if (child && typeof child === "object") {
            analyzeNode(child, visited);
          }
        }
      }

      // Analyze the method body
      if (node.body) {
        analyzeNode(node.body);
      }

      return {
        hasSessionValidation,
        hasReAuthentication,
        hasSecondaryVerification,
        hasHalfOpenSessionCheck
      };
    }

    function checkMethodDeclaration(node) {
      if (!node.key || !node.key.name) return;
      
      const methodName = node.key.name;
      
      if (isSensitiveOperation(methodName)) {
        const analysis = checkSensitiveOperationMethodBody(node, methodName);
        
        // Report if no session validation found
        if (!analysis.hasSessionValidation && !analysis.hasReAuthentication) {
          context.report({
            node: node.key,
            messageId: "missingSensitiveOperationProtection",
            data: { method: methodName }
          });
        }
        // Report if only partial validation found
        else if (analysis.hasSessionValidation && !analysis.hasReAuthentication && !analysis.hasSecondaryVerification) {
          context.report({
            node: node.key,
            messageId: "incompleteSessionValidation",
            data: { method: methodName }
          });
        }
      }
    }

    function checkFunctionDeclaration(node) {
      if (!node.id || !node.id.name) return;
      
      const functionName = node.id.name;
      
      if (isSensitiveOperation(functionName)) {
        const analysis = checkSensitiveOperationMethodBody(node, functionName);
        
        if (!analysis.hasSessionValidation && !analysis.hasReAuthentication) {
          context.report({
            node: node.id,
            messageId: "missingSensitiveOperationProtection",
            data: { method: functionName }
          });
        }
        else if (analysis.hasSessionValidation && !analysis.hasReAuthentication && !analysis.hasSecondaryVerification) {
          context.report({
            node: node.id,
            messageId: "incompleteSessionValidation",
            data: { method: functionName }
          });
        }
      }
    }

    function checkArrowFunction(node) {
      // Check if arrow function is assigned to a variable with sensitive name
      const parent = node.parent;
      if (parent && parent.type === "VariableDeclarator" && parent.id && parent.id.name) {
        const functionName = parent.id.name;
        
        if (isSensitiveOperation(functionName)) {
          const analysis = checkSensitiveOperationMethodBody(node, functionName);
          
          if (!analysis.hasSessionValidation && !analysis.hasReAuthentication) {
            context.report({
              node: parent.id,
              messageId: "missingSensitiveOperationProtection",
              data: { method: functionName }
            });
          }
        }
      }
    }

    return {
      MethodDefinition: checkMethodDeclaration,
      Property: checkMethodDeclaration, // For object method properties
      FunctionDeclaration: checkFunctionDeclaration,
      ArrowFunctionExpression: checkArrowFunction,
      FunctionExpression: checkArrowFunction
    };
  }
};
