/**
 * S035 Symbol-Based Analyzer - Set Path attribute for Session Cookies
 * Uses TypeScript compiler API for semantic analysis
 */

const { SyntaxKind } = require("typescript");

class S035SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.semanticEngine = semanticEngine;
    this.ruleId = "S035";
    this.ruleName = "Set Path attribute for Session Cookies";
    this.category = "security";
    this.violations = [];

    // Session cookie indicators
    this.sessionIndicators = [
      "session",
      "sessionid",
      "sessid",
      "jsessionid",
      "phpsessid",
      "asp.net_sessionid",
      "connect.sid",
      "auth",
      "token",
      "jwt",
      "csrf",
      "refresh",
      "user",
      "login",
      "authentication",
      "session_id",
      "sid",
      "auth_token",
      "userid",
      "user_id",
    ];

    // Cookie methods that need security checking
    this.cookieMethods = [
      "setCookie",
      "cookie",
      "set",
      "append",
      "session",
      "setHeader",
      "writeHead",
    ];

    // Acceptable Path values - should be specific paths, not just "/"
    this.acceptableValues = [
      "/app",
      "/admin",
      "/api",
      "/auth",
      "/user",
      "/secure",
      "/dashboard",
      "/login",
    ];

    // Root path "/" is acceptable but not recommended for security
    this.rootPath = "/";
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S035] Symbol analyzer initialized`);
    }
  }

  /**
   * Main analysis method for source file
   */
  async analyze(sourceFile, filePath) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S035] Symbol analysis starting for: ${filePath}`);
    }

    this.violations = [];
    this.currentFile = sourceFile;
    this.currentFilePath = filePath;

    this.visitNode(sourceFile);

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔍 [S035] Symbol analysis completed: ${this.violations.length} violations`
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

  isSessionMiddleware(node) {
    if (node.getKind() !== SyntaxKind.CallExpression) {
      return false;
    }

    const expression = node.getExpression();
    const text = expression.getText();

    return text === "session" || text.includes("session(");
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

          if (cookieName && this.isSessionCookie(cookieName)) {
            this.checkCookieOptions(node, args, cookieName);
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
            }
          }
        }
      }
    }
  }

  checkSessionMiddleware(node) {
    const args = node.getArguments();
    if (
      args.length >= 1 &&
      args[0].getKind() === SyntaxKind.ObjectLiteralExpression
    ) {
      const config = args[0];
      const nameProperty = this.findProperty(config, "name");
      const cookieProperty = this.findProperty(config, "cookie");

      if (nameProperty) {
        const nameValue = this.extractStringValue(
          nameProperty.getInitializer()
        );
        if (nameValue && this.isSessionCookie(nameValue)) {
          // Check if cookie configuration has path
          if (
            cookieProperty &&
            cookieProperty.getInitializer().getKind() ===
              SyntaxKind.ObjectLiteralExpression
          ) {
            const cookieConfig = cookieProperty.getInitializer();
            this.checkCookieConfigForPath(node, cookieConfig, nameValue);
          } else {
            this.addViolation(
              node,
              `Session middleware cookie "${nameValue}" should specify Path attribute to limit access scope`
            );
          }
        }
      }
    }
  }

  checkCookieOptions(node, args, cookieName) {
    if (
      args.length >= 3 &&
      args[2].getKind() === SyntaxKind.ObjectLiteralExpression
    ) {
      const options = args[2];
      this.checkCookieConfigForPath(node, options, cookieName);
    } else {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" should specify Path attribute to limit access scope`
      );
    }
  }

  checkCookieConfigForPath(node, config, cookieName) {
    const pathProperty = this.findProperty(config, "path");

    if (!pathProperty) {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" should specify Path attribute to limit access scope`
      );
      return;
    }

    const pathValue = this.extractStringValue(pathProperty.getInitializer());
    if (!pathValue) {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" should have a valid Path attribute value`
      );
      return;
    }

    // Check if path is too broad (root path "/")
    if (pathValue === this.rootPath) {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" uses root path "/", consider using a more specific path to limit access scope`
      );
    }
  }

  checkSetCookieHeader(node, headerValue) {
    // Extract cookie name from Set-Cookie header
    const cookieMatch = headerValue.match(/^([^=]+)=/);
    if (!cookieMatch) return;

    const cookieName = cookieMatch[1].trim();
    if (!this.isSessionCookie(cookieName)) return;

    // Check if Path attribute is present
    const pathMatch = headerValue.match(/Path=([^;\\s]*)/i);
    if (!pathMatch) {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" in Set-Cookie header should specify Path attribute`
      );
      return;
    }

    const pathValue = pathMatch[1];
    if (pathValue === this.rootPath) {
      this.addViolation(
        node,
        `Session cookie "${cookieName}" uses root path "/", consider using a more specific path`
      );
    }
  }

  isSessionCookie(cookieName) {
    const lowerName = cookieName.toLowerCase();
    return this.sessionIndicators.some((indicator) =>
      lowerName.includes(indicator.toLowerCase())
    );
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
        `🔍 [S035] Violation at node kind: ${node.getKindName()}, text: "${node
          .getText()
          .substring(0, 50)}..."`
      );
      console.log(
        `🔍 [S035] Position: line ${lineAndColumn.line + 1}, column ${
          lineAndColumn.column + 1
        }`
      );
    }

    // Fix line number calculation - ts-morph may have offset issues
    // Use actual line calculation based on source file text
    const sourceText = sourceFile.getFullText();
    const actualLine = this.calculateActualLine(sourceText, start);

    this.violations.push({
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity: "warning",
      message: message,
      line: actualLine,
      column: lineAndColumn.column + 1,
      source: "symbol-based",
    });

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S035] Added violation: ${message}`);
    }
  }

  calculateActualLine(sourceText, position) {
    // Count newlines up to the position to get accurate line number
    let lineCount = 1;
    for (let i = 0; i < position; i++) {
      if (sourceText[i] === "\n") {
        lineCount++;
      }
    }
    return lineCount;
  }

  cleanup() {
    this.violations = [];
  }
}

module.exports = S035SymbolBasedAnalyzer;
