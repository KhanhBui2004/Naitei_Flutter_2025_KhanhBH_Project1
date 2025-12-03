/**
 * S034 Symbol-based Analyzer - Use __Host- prefix for Session Cookies
 * Detects session cookies without __Host- prefix using TypeScript AST analysis
 */

const { SyntaxKind } = require("typescript");

class S034SymbolBasedAnalyzer {
  constructor(semanticEngine) {
    this.semanticEngine = semanticEngine;
    this.ruleId = "S034";
    this.ruleName = "Use __Host- prefix for Session Cookies";

    // Session cookie name patterns
    this.sessionCookiePatterns = [
      /^session$/i,
      /^sessionid$/i,
      /^session_id$/i,
      /^sid$/i,
      /^connect\.sid$/i,
      /^auth$/i,
      /^auth_token$/i,
      /^authentication$/i,
      /^jwt$/i,
      /^token$/i,
      /^csrf$/i,
      /^csrf_token$/i,
      /^xsrf$/i,
      /^login$/i,
      /^user$/i,
      /^userid$/i,
      /^user_id$/i,
    ];

    this.violations = [];
  }

  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;
  }

  async analyze(sourceFile, filePath) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S034] Symbol analysis starting for: ${filePath}`);
    }

    this.violations = [];

    try {
      // Visit all nodes in the source file
      this.visitNode(sourceFile);
    } catch (error) {
      console.warn(`⚠ [S034] Symbol analysis error:`, error.message);
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔍 [S034] Symbol analysis completed: ${this.violations.length} violations`
      );
    }

    return this.violations;
  }

  visitNode(node) {
    // Check for res.cookie() calls
    if (this.isCallExpression(node)) {
      this.checkCookieCall(node);
      this.checkSetHeaderCall(node);
    }

    // Check for session middleware configuration
    if (this.isSessionMiddleware(node)) {
      this.checkSessionMiddleware(node);
    }

    // Recursively visit child nodes
    node.forEachChild((child) => this.visitNode(child));
  }

  isCallExpression(node) {
    return node.getKind() === SyntaxKind.CallExpression;
  }

  checkCookieCall(node) {
    const expression = node.getExpression();

    // Check if it's res.cookie() call
    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propertyAccess = expression;
      const property = propertyAccess.getName();

      if (property === "cookie") {
        const args = node.getArguments();
        if (args.length >= 1) {
          const cookieName = this.extractStringValue(args[0]);

          if (
            cookieName &&
            this.isSessionCookie(cookieName) &&
            !this.hasHostPrefix(cookieName)
          ) {
            this.addViolation(
              node,
              `Session cookie "${cookieName}" should use __Host- prefix to prevent subdomain sharing`
            );
          }
        }
      }
    }
  }

  checkSetHeaderCall(node) {
    const expression = node.getExpression();

    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propertyAccess = expression;
      const property = propertyAccess.getName();

      if (property === "setHeader") {
        const args = node.getArguments();
        if (args.length >= 2) {
          const headerName = this.extractStringValue(args[0]);

          if (headerName && headerName.toLowerCase() === "set-cookie") {
            const headerValue = this.extractStringValue(args[1]);
            if (headerValue) {
              this.checkSetCookieHeader(node, headerValue);
            } else if (
              args[1].getKind() === SyntaxKind.ArrayLiteralExpression
            ) {
              // Handle array of Set-Cookie headers
              const arrayElements = args[1].getElements();
              arrayElements.forEach((element) => {
                const cookieString = this.extractStringValue(element);
                if (cookieString) {
                  this.checkSetCookieHeader(node, cookieString);
                }
              });
            }
          }
        }
      }
    }
  }

  checkSetCookieHeader(node, cookieString) {
    // Extract cookie name from Set-Cookie header
    const cookieMatch = cookieString.match(/^([^=]+)=/);
    if (cookieMatch) {
      const cookieName = cookieMatch[1].trim();

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        this.addViolation(
          node,
          `Session cookie "${cookieName}" in Set-Cookie header should use __Host- prefix`
        );
      }
    }
  }

  checkSessionMiddleware(node) {
    // Check for session() middleware configuration
    const args = node.getArguments();
    if (
      args.length >= 1 &&
      args[0].getKind() === SyntaxKind.ObjectLiteralExpression
    ) {
      const config = args[0];
      const nameProperty = this.findProperty(config, "name");

      if (nameProperty) {
        const cookieName = this.extractStringValue(
          nameProperty.getInitializer()
        );
        if (
          cookieName &&
          this.isSessionCookie(cookieName) &&
          !this.hasHostPrefix(cookieName)
        ) {
          this.addViolation(
            node,
            `Session middleware cookie name "${cookieName}" should use __Host- prefix`
          );
        }
      }
    }
  }

  isSessionMiddleware(node) {
    if (node.getKind() !== SyntaxKind.CallExpression) {
      return false;
    }

    const expression = node.getExpression();
    const expressionText = expression.getText();

    return expressionText === "session" || expressionText.includes("session");
  }

  isSessionCookie(cookieName) {
    return this.sessionCookiePatterns.some((pattern) =>
      pattern.test(cookieName)
    );
  }

  hasHostPrefix(cookieName) {
    return cookieName.startsWith("__Host-");
  }

  extractStringValue(node) {
    if (!node) return null;

    const kind = node.getKind();

    if (kind === SyntaxKind.StringLiteral) {
      return node.getLiteralValue();
    }

    if (kind === SyntaxKind.NoSubstitutionTemplateLiteral) {
      return node.getLiteralValue();
    }

    return null;
  }

  findProperty(objectLiteral, propertyName) {
    const properties = objectLiteral.getProperties();

    for (const property of properties) {
      if (property.getKind() === SyntaxKind.PropertyAssignment) {
        const name = property.getName();
        if (name === propertyName) {
          return property;
        }
      }
    }

    return null;
  }

  addViolation(node, message) {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);

    // Debug output to understand position issues
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔍 [S034] Violation at node kind: ${node.getKindName()}, text: "${node
          .getText()
          .substring(0, 50)}..."`
      );
      console.log(
        `🔍 [S034] Position: line ${lineAndColumn.line + 1}, column ${
          lineAndColumn.column + 1
        }`
      );
    }

    this.violations.push({
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity: "warning",
      message: message,
      line: lineAndColumn.line + 1,
      column: lineAndColumn.column + 1,
      source: "symbol-based",
    });
  }

  cleanup() {
    this.violations = [];
  }
}

module.exports = S034SymbolBasedAnalyzer;
