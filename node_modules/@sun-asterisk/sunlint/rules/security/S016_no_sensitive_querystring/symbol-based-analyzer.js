/**
 * S016 Symbol-based Analyzer - Sensitive Data in URL Query Parameters Detection
 * Purpose: Use AST + Symbol Resolution to detect sensitive data passed via query strings
 */

const { SyntaxKind } = require("ts-morph");

class S016SymbolBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.ruleId = "S016";
    this.ruleName = "Sensitive Data in URL Query Parameters (Symbol-Based)";
    this.semanticEngine = semanticEngine;
    this.verbose = false;

    // URL construction patterns
    this.urlPatterns = {
      // Direct URL construction
      urlConstructor: ["URL", "new URL"],
      urlSearchParams: ["URLSearchParams", "new URLSearchParams"],

      // HTTP client libraries
      fetch: ["fetch"],
      axios: [
        "axios.get",
        "axios.post",
        "axios.put",
        "axios.delete",
        "axios.patch",
        "axios.request",
      ],
      request: ["request", "request.get", "request.post"],

      // Node.js modules
      http: ["http.get", "http.request", "https.get", "https.request"],
      querystring: ["querystring.stringify", "qs.stringify"],

      // Framework specific
      express: ["res.redirect", "req.query"],
      nextjs: ["router.push", "router.replace", "Link"],
      react: ["window.location.href", "location.href"],
    };

    // Sensitive data patterns (more comprehensive)
    this.sensitivePatterns = [
      // Authentication & Authorization
      "password",
      "passwd",
      "pwd",
      "pass",
      "token",
      "jwt",
      "accesstoken",
      "refreshtoken",
      "bearertoken",
      "secret",
      "secretkey",
      "clientsecret",
      "serversecret",
      "apikey",
      "api_key",
      "key",
      "privatekey",
      "publickey",
      "auth",
      "authorization",
      "authenticate",
      "sessionid",
      "session_id",
      "jsessionid",
      "csrf",
      "csrftoken",
      "xsrf",

      // Financial & Personal
      "ssn",
      "social",
      "socialsecurity",
      "creditcard",
      "cardnumber",
      "cardnum",
      "ccnumber",
      "cvv",
      "cvc",
      "cvd",
      "cid",
      "pin",
      "pincode",
      "bankaccount",
      "routing",
      "iban",

      // Personal Identifiable Information
      "email",
      "emailaddress",
      "mail",
      "phone",
      "phonenumber",
      "mobile",
      "tel",
      "address",
      "homeaddress",
      "zipcode",
      "postal",
      "birthdate",
      "birthday",
      "dob",
      "license",
      "passport",
      "identity",

      // Business sensitive
      "salary",
      "income",
      "wage",
      "medical",
      "health",
      "diagnosis",
    ];

    // Query parameter indicators
    this.queryIndicators = [
      "query",
      "params",
      "search",
      "searchparams",
      "urlparams",
      "querystring",
      "qs",
    ];
  }

  async initialize(semanticEngine = null) {
    if (semanticEngine) {
      this.semanticEngine = semanticEngine;
    }
    this.verbose = semanticEngine?.verbose || false;

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S016 Symbol-Based] Analyzer initialized, verbose: ${this.verbose}`
      );
    }
  }

  async analyzeFileBasic(filePath, options = {}) {
    return await this.analyzeFileWithSymbols(filePath, options);
  }

  async analyzeFileWithSymbols(filePath, options = {}) {
    const violations = [];

    const verbose = options.verbose || this.verbose;

    if (!this.semanticEngine?.project) {
      if (verbose) {
        console.warn(
          "[S016 Symbol-Based] No semantic engine available, skipping analysis"
        );
      }
      return violations;
    }

    if (verbose) {
      console.log(`🔍 [S016 Symbol-Based] Starting analysis for ${filePath}`);
    }

    try {
      const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
      if (!sourceFile) {
        return violations;
      }

      // Find various URL/query construction patterns
      const urlConstructions = this.findUrlConstructions(sourceFile, verbose);
      const queryStringUsages = this.findQueryStringUsages(sourceFile, verbose);
      const httpClientCalls = this.findHttpClientCalls(sourceFile, verbose);

      if (verbose) {
        console.log(
          `🔍 [S016 Symbol-Based] Found ${urlConstructions.length} URL constructions, ${queryStringUsages.length} query usages, ${httpClientCalls.length} HTTP calls`
        );
      }

      // Analyze each pattern
      const allPatterns = [
        ...urlConstructions,
        ...queryStringUsages,
        ...httpClientCalls,
      ];

      for (const pattern of allPatterns) {
        const patternViolations = this.analyzeUrlPattern(
          pattern,
          sourceFile,
          filePath,
          verbose
        );
        violations.push(...patternViolations);
      }

      if (verbose) {
        console.log(
          `🔍 [S016 Symbol-Based] Total violations found: ${violations.length}`
        );
      }

      return violations;
    } catch (error) {
      if (verbose) {
        console.warn(
          `[S016 Symbol-Based] Analysis failed for ${filePath}:`,
          error.message
        );
      }
      return violations;
    }
  }

  /**
   * Find URL construction patterns (new URL, URLSearchParams, etc.)
   */
  findUrlConstructions(sourceFile, verbose = false) {
    const patterns = [];

    // Find 'new URL()' constructions
    const newExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.NewExpression
    );
    for (const newExpr of newExpressions) {
      const identifier = newExpr.getExpression();
      if (
        identifier.getText() === "URL" ||
        identifier.getText() === "URLSearchParams"
      ) {
        patterns.push({
          type: "constructor",
          node: newExpr,
          method: identifier.getText(),
        });
      }
    }

    if (verbose) {
      console.log(
        `🔍 [S016 Symbol-Based] Found ${patterns.length} URL constructor patterns`
      );
    }

    return patterns;
  }

  /**
   * Find query string manipulation patterns
   */
  findQueryStringUsages(sourceFile, verbose = false) {
    const patterns = [];

    // Find property access expressions that might involve query strings
    const propertyAccess = sourceFile.getDescendantsOfKind(
      SyntaxKind.PropertyAccessExpression
    );

    for (const propAccess of propertyAccess) {
      const fullText = propAccess.getText().toLowerCase();

      // Check for query-related property access
      if (
        this.queryIndicators.some((indicator) => fullText.includes(indicator))
      ) {
        patterns.push({
          type: "property_access",
          node: propAccess,
          method: propAccess.getText(),
        });
      }

      // Check for location.search, window.location.search, etc.
      if (fullText.includes("search") || fullText.includes("query")) {
        patterns.push({
          type: "location_search",
          node: propAccess,
          method: propAccess.getText(),
        });
      }
    }

    if (verbose) {
      console.log(
        `🔍 [S016 Symbol-Based] Found ${patterns.length} query string usage patterns`
      );
    }

    return patterns;
  }

  /**
   * Find HTTP client calls that might include query parameters
   */
  findHttpClientCalls(sourceFile, verbose = false) {
    const patterns = [];

    const callExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression
    );

    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression();
      const callText = expression.getText().toLowerCase();

      // Check against known HTTP client patterns
      for (const [client, methods] of Object.entries(this.urlPatterns)) {
        for (const method of methods) {
          if (callText.includes(method.toLowerCase())) {
            patterns.push({
              type: "http_client",
              node: callExpr,
              method: method,
              client: client,
            });
            break;
          }
        }
      }
    }

    if (verbose) {
      console.log(
        `🔍 [S016 Symbol-Based] Found ${patterns.length} HTTP client call patterns`
      );
    }

    return patterns;
  }

  /**
   * Analyze URL pattern for sensitive data in query parameters
   */
  analyzeUrlPattern(pattern, sourceFile, filePath, verbose = false) {
    const violations = [];
    const lineNumber = pattern.node.getStartLineNumber();
    const columnNumber =
      pattern.node.getStart() - pattern.node.getStartLinePos();

    if (verbose) {
      console.log(
        `🔍 [S016 Symbol-Based] Analyzing ${pattern.type} pattern: ${pattern.method}`
      );
    }

    // Only check for sensitive keys in actual query string
    let queryString = "";
    let sensitiveParams = [];

    if (pattern.type === "constructor" || pattern.type === "http_client") {
      const args = pattern.node.getArguments?.() || [];
      // Only check first argument (URL)
      if (args.length > 0) {
        const urlText = args[0].getText();
        const match = urlText.match(/\?(.*)/);
        if (match && match[1]) {
          queryString = match[1];
          // Split query string into keys
          const keys = queryString
            .split("&")
            .map((pair) => pair.split("=")[0].toLowerCase());
          sensitiveParams = keys.filter((key) =>
            this.sensitivePatterns.includes(key)
          );
        }
      }
    } else if (
      pattern.type === "property_access" ||
      pattern.type === "location_search"
    ) {
      // Only check if .searchParams.set or .query is used with sensitive key
      const methodText = pattern.method.toLowerCase();
      for (const sensitiveKey of this.sensitivePatterns) {
        // Only match if set as key in searchParams or query
        const regex = new RegExp(`\.set\(['"]${sensitiveKey}['"]`, "i");
        if (regex.test(methodText)) {
          sensitiveParams.push(sensitiveKey);
        }
      }
    }

    if (sensitiveParams.length > 0) {
      violations.push({
        ruleId: this.ruleId,
        severity: "error",
        message: "Sensitive data detected in URL query parameters",
        source: this.ruleId,
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        description: `[SYMBOL-BASED] Sensitive parameters detected: ${sensitiveParams.join(
          ", "
        )}. This can expose data in logs, browser history, and network traces.`,
        suggestion:
          "Move sensitive data to request body (POST/PUT) or use secure headers. For authentication, use proper header-based tokens.",
        category: "security",
        patternType: pattern.type,
        method: pattern.method,
      });
    }

    // Additional checks for specific patterns
    if (
      pattern.type === "constructor" &&
      pattern.method === "URLSearchParams"
    ) {
      // Special handling for URLSearchParams constructor
      const constructorViolations = this.analyzeURLSearchParamsConstructor(
        pattern.node,
        filePath,
        verbose
      );
      violations.push(...constructorViolations);
    }

    return violations;
  }

  /**
   * Analyze URLSearchParams constructor specifically
   */
  analyzeURLSearchParamsConstructor(node, filePath, verbose = false) {
    const violations = [];
    const args = node.getArguments();

    if (args.length === 0) return violations;

    const firstArg = args[0];

    // If first argument is an object literal, check its properties
    if (firstArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      const properties = firstArg.getProperties();

      for (const prop of properties) {
        if (prop.getKind() === SyntaxKind.PropertyAssignment) {
          const propName = prop.getName()?.toLowerCase() || "";

          const matchingSensitivePattern = this.sensitivePatterns.find(
            (pattern) => {
              const regex = new RegExp(`\\b${pattern}\\b`, "i");
              return regex.test(propName);
            }
          );

          if (matchingSensitivePattern) {
            violations.push({
              ruleId: this.ruleId,
              severity: "error",
              message: `Sensitive parameter '${propName}' in URLSearchParams constructor`,
              source: this.ruleId,
              file: filePath,
              line: prop.getStartLineNumber(),
              column: prop.getStart() - prop.getStartLinePos(),
              description: `[SYMBOL-BASED] Parameter '${propName}' contains sensitive data pattern '${matchingSensitivePattern}'. URLSearchParams will be visible in URLs.`,
              suggestion:
                "Move sensitive parameters to request body or secure headers",
              category: "security",
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Find sensitive parameters in content
   */
  findSensitiveParameters(content, verbose = false) {
    const sensitiveParams = [];
    const lowerContent = content.toLowerCase();

    for (const pattern of this.sensitivePatterns) {
      // Use word boundaries to avoid false positives
      const regex = new RegExp(`\\b${pattern}\\b`, "i");
      if (regex.test(lowerContent)) {
        sensitiveParams.push(pattern);
        if (verbose) {
          console.log(
            `🔍 [S016 Symbol-Based] Sensitive pattern detected: '${pattern}'`
          );
        }
      }
    }

    return [...new Set(sensitiveParams)]; // Remove duplicates
  }
}

module.exports = S016SymbolBasedAnalyzer;
