/**
 * S033 Regex-Based Analyzer - Set SameSite attribute for Session Cookies
 * Fallback analysis using regex patterns
 */

const fs = require("fs");

class S033RegexBasedAnalyzer {
  constructor(semanticEngine = null) {
    this.semanticEngine = semanticEngine;
    this.ruleId = "S033";
    this.category = "security";

    // Session cookie indicators (enhanced with framework patterns)
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
      "next-auth",
      "sessiontoken",
      "csrftoken",
      "user_session",
      "api_session",
      "login_session",
      "auth_token",
      "csrf_token",
      "refresh_token",
      "admin_session",
      "app_auth",
      "edge_session",
      "server_session",
      "custom-session",
    ];

    // Cookie method patterns (enhanced with framework support)
    this.cookieMethodPatterns = [
      // Express.js res.cookie patterns
      /res\.cookie\s*\(\s*(['"`])(session|sessionid|sessid|auth|token|jwt|csrf|refresh|connect\.sid)[^)]*\)/gi,
      // Next.js cookies.set patterns
      /(?:response\.)?cookies\.set\s*\(\s*(['"`])(session|sessionid|sessid|auth|token|jwt|csrf|refresh)[^)]*\)/gi,
      // Nuxt.js useCookie patterns
      /useCookie\s*\(\s*(['"`])(session|sessionid|sessid|auth|token|jwt|csrf|refresh)[^)]*\)/gi,
      // Nuxt.js setCookie patterns
      /setCookie\s*\(\s*[^,]+,\s*(['"`])(session|sessionid|sessid|auth|token|jwt|csrf|refresh)[^)]*\)/gi,
      // Set-Cookie header patterns
      /res\.setHeader\s*\(\s*['"`]set-cookie['"`]\s*,\s*([^)]+)\)/gi,
      // Express session patterns
      /session\s*\(\s*\{[^}]*\}/gi,
    ];

    // SameSite validation patterns (enhanced with ternary support)
    this.sameSitePatterns = [
      /sameSite\s*:\s*['"`](strict|lax|none)['"`]/gi,
      /sameSite\s*:\s*(strict|lax|none)/gi,
      /SameSite=(Strict|Lax|None)/gi,
      /sameSite\s*:\s*.*\?\s*['"`](strict|lax|none)['"`]\s*:\s*['"`](strict|lax|none)['"`]/gi, // Ternary with quotes
      /sameSite\s*:\s*.*\?\s*(strict|lax|none)\s*:\s*(strict|lax|none)/gi, // Ternary without quotes
    ];
  }

  async analyze(filePath) {
    if (this.verbose) {
      console.log(`🔍 [${this.ruleId}] Regex-based analysis for: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return this.analyzeContent(content, filePath);
    } catch (error) {
      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: Error reading file:`,
          error.message
        );
      }
      return [];
    }
  }

  analyzeContent(content, filePath) {
    const violations = [];
    const lines = content.split("\n");

    // Remove comments to avoid false positives
    const cleanContent = this.removeComments(content);

    try {
      // Pattern 1: res.cookie() calls (Express.js)
      violations.push(
        ...this.analyzeCookieCalls(cleanContent, lines, filePath)
      );

      // Pattern 2: Set-Cookie headers
      violations.push(
        ...this.analyzeSetCookieHeaders(cleanContent, lines, filePath)
      );

      // Pattern 3: Express session middleware
      violations.push(
        ...this.analyzeSessionMiddleware(cleanContent, lines, filePath)
      );

      // Pattern 4: Next.js cookies.set() calls
      violations.push(
        ...this.analyzeNextJSCookies(cleanContent, lines, filePath)
      );

      // Pattern 5: Nuxt.js useCookie() calls
      violations.push(
        ...this.analyzeNuxtJSUseCookie(cleanContent, lines, filePath)
      );

      // Pattern 6: Nuxt.js setCookie() calls
      violations.push(
        ...this.analyzeNuxtJSSetCookie(cleanContent, lines, filePath)
      );

      // Pattern 7: NextAuth configuration
      violations.push(
        ...this.analyzeNextAuthConfig(cleanContent, lines, filePath)
      );
    } catch (error) {
      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: Error in analysis:`,
          error.message
        );
      }
    }

    return violations;
  }

  analyzeCookieCalls(content, lines, filePath) {
    const violations = [];

    // Pattern for res.cookie calls
    const cookieCallPattern =
      /res\.cookie\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*[^,]+(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;
    let match;

    while ((match = cookieCallPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        // Skip if this looks like a config reference
        if (this.isConfigReference(configObject)) {
          if (this.verbose) {
            console.log(
              `🔍 [${
                this.ruleId
              }] Regex: Skipping config reference: ${configObject.substring(
                0,
                50
              )}...`
            );
          }
          continue;
        }

        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  analyzeSetCookieHeaders(content, lines, filePath) {
    const violations = [];

    // Pattern for setHeader with Set-Cookie
    const setHeaderPattern =
      /res\.setHeader\s*\(\s*['"`]set-cookie['"`]\s*,\s*([^)]+)\)/gi;
    let match;

    while ((match = setHeaderPattern.exec(content)) !== null) {
      const cookieValue = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Checking Set-Cookie header pattern: ${match[0].substring(
            0,
            100
          )}...`
        );
      }

      // Handle array of cookies
      if (cookieValue.includes("[") && cookieValue.includes("]")) {
        const cookieStrings = this.extractCookieStrings(cookieValue);
        for (const cookieString of cookieStrings) {
          const cookieName = this.extractCookieNameFromString(cookieString);

          if (this.verbose) {
            console.log(
              `🔍 [${
                this.ruleId
              }] Regex: Checking Set-Cookie string: "${cookieString.substring(
                0,
                50
              )}..." - name: "${cookieName}"`
            );
          }

          if (
            this.isSessionCookie(cookieName) &&
            !this.hasSameSiteAttribute(cookieString)
          ) {
            const lineNumber = this.getLineNumber(content, match.index);
            violations.push({
              rule: this.ruleId,
              source: filePath,
              category: this.category,
              line: lineNumber,
              column: 1,
              message: `Insecure session cookie: Session cookie "${cookieName}" in Set-Cookie header missing SameSite attribute`,
              severity: "error",
            });
          }
        }
      } else {
        // Single cookie
        const cookieName = this.extractCookieNameFromString(cookieValue);
        if (
          this.isSessionCookie(cookieName) &&
          !this.hasSameSiteAttribute(cookieValue)
        ) {
          const lineNumber = this.getLineNumber(content, match.index);
          violations.push({
            rule: this.ruleId,
            source: filePath,
            category: this.category,
            line: lineNumber,
            column: 1,
            message: `Insecure session cookie: Session cookie "${cookieName}" in Set-Cookie header missing SameSite attribute`,
            severity: "error",
          });
        }
      }
    }

    return violations;
  }

  analyzeSessionMiddleware(content, lines, filePath) {
    const violations = [];

    // Pattern for express-session middleware
    const sessionPattern =
      /session\s*\(\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*\)/gi;
    let match;

    while ((match = sessionPattern.exec(content)) !== null) {
      const sessionConfig = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Checking session middleware: ${sessionConfig.substring(
            0,
            100
          )}...`
        );
      }

      // Check if cookie config has SameSite
      const cookieConfigMatch = sessionConfig.match(/cookie\s*:\s*\{([^}]*)\}/);
      if (cookieConfigMatch) {
        const cookieConfig = cookieConfigMatch[1];
        if (!this.hasSameSiteInText(cookieConfig)) {
          const lineNumber = this.getLineNumber(content, match.index);
          violations.push({
            rule: this.ruleId,
            source: filePath,
            category: this.category,
            line: lineNumber,
            column: 1,
            message: `Insecure session cookie: Session middleware missing SameSite attribute in cookie configuration`,
            severity: "error",
          });
        }
      } else {
        // No cookie config at all
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session middleware missing cookie configuration with SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  extractCookieStrings(cookieValue) {
    const strings = [];
    const matches = cookieValue.match(/['"`][^'"`]*['"`]/g);
    if (matches) {
      strings.push(...matches.map((s) => s.slice(1, -1))); // Remove quotes
    }
    return strings;
  }

  extractCookieNameFromString(cookieString) {
    const match = cookieString.match(/^[^=]+/);
    return match ? match[0].trim() : "unknown";
  }

  hasSameSiteInText(text) {
    return this.sameSitePatterns.some((pattern) => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(text);
    });
  }

  hasSameSiteAttribute(cookieValue) {
    const sameSitePattern = /SameSite=(Strict|Lax|None)/i;
    return sameSitePattern.test(cookieValue);
  }

  isSessionCookie(cookieName) {
    if (!cookieName || cookieName === "null" || cookieName === "undefined") {
      return false;
    }

    const name = cookieName.toLowerCase();
    return this.sessionIndicators.some((indicator) =>
      name.includes(indicator.toLowerCase())
    );
  }

  isConfigReference(configText) {
    if (!configText) return false;

    // Check for common config reference patterns
    const configRefPatterns = [
      /\.\.\./, // Spread operator
      /\w+Config/, // Variable ending with Config
      /this\.\w+/, // this.property
      /^\s*\w+\s*$/, // Simple variable reference
    ];

    return configRefPatterns.some((pattern) => pattern.test(configText));
  }

  removeComments(content) {
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, "");
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, "");
    return content;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split("\n").length;
  }

  analyzeNextJSCookies(content, lines, filePath) {
    const violations = [];

    // Pattern 1: Next.js response.cookies.set() calls
    const nextJSResponsePattern =
      /(?:response\.)?cookies\.set\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*[^,]+(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;
    let match;

    while ((match = nextJSResponsePattern.exec(content)) !== null) {
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Next.js Response Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    // Pattern 2: Next.js cookies().set() calls (from next/headers)
    const nextJSCookiesPattern =
      /cookies\(\)\.set\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*[^,]+(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;

    while ((match = nextJSCookiesPattern.exec(content)) !== null) {
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Next.js cookies() Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    // Pattern 3: cookieStore.set() calls
    const cookieStorePattern =
      /cookieStore\.set\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*[^,]+(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;

    while ((match = cookieStorePattern.exec(content)) !== null) {
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: cookieStore Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  analyzeNuxtJSUseCookie(content, lines, filePath) {
    const violations = [];

    // Pattern for Nuxt.js useCookie() calls
    const nuxtUseCookiePattern =
      /useCookie\s*\(\s*(['"`])([^'"`]+)\1(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;
    let match;

    while ((match = nuxtUseCookiePattern.exec(content)) !== null) {
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Nuxt.js useCookie Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" (Nuxt.js) missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  analyzeNuxtJSSetCookie(content, lines, filePath) {
    const violations = [];

    // Pattern for Nuxt.js setCookie(event, name, value, options) calls
    const nuxtSetCookiePattern =
      /setCookie\s*\(\s*[^,]+,\s*(['"`])([^'"`]+)\1\s*,\s*[^,]+(?:\s*,\s*(\{[^}]*\}))?\s*\)/gi;
    let match;

    while ((match = nuxtSetCookiePattern.exec(content)) !== null) {
      const cookieName = match[2];
      const configObject = match[3] || "";

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: Nuxt.js setCookie Pattern match - cookieName: "${cookieName}", config: "${configObject.substring(
            0,
            50
          )}..."`
        );
      }

      // Only check session cookies
      if (!this.isSessionCookie(cookieName)) {
        continue;
      }

      // Check if config object has SameSite
      if (!configObject || !this.hasSameSiteInText(configObject)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: Session cookie "${cookieName}" (Nuxt.js) missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  analyzeNextAuthConfig(content, lines, filePath) {
    const violations = [];

    // Simple approach: find NextAuth cookie configurations directly
    // Pattern 1: sessionToken configurations
    const sessionTokenPattern =
      /sessionToken\s*:\s*\{[^}]*options\s*:\s*\{([^}]*)\}/gi;
    let match;

    while ((match = sessionTokenPattern.exec(content)) !== null) {
      const cookieOptions = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: sessionToken Pattern match - options: "${cookieOptions.substring(
            0,
            50
          )}..."`
        );
      }

      if (!this.hasSameSiteInText(cookieOptions)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: NextAuth "sessionToken" cookie missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    // Pattern 2: csrfToken configurations
    const csrfTokenPattern =
      /csrfToken\s*:\s*\{[^}]*options\s*:\s*\{([^}]*)\}/gi;

    while ((match = csrfTokenPattern.exec(content)) !== null) {
      const cookieOptions = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${
            this.ruleId
          }] Regex: csrfToken Pattern match - options: "${cookieOptions.substring(
            0,
            50
          )}..."`
        );
      }

      if (!this.hasSameSiteInText(cookieOptions)) {
        const lineNumber = this.getLineNumber(content, match.index);
        violations.push({
          rule: this.ruleId,
          source: filePath,
          category: this.category,
          line: lineNumber,
          column: 1,
          message: `Insecure session cookie: NextAuth "csrfToken" cookie missing SameSite attribute`,
          severity: "error",
        });
      }
    }

    return violations;
  }

  // This helper method is no longer needed with the simplified approach
  extractNextAuthCookieViolations(
    configContent,
    fullContent,
    baseIndex,
    filePath
  ) {
    // Deprecated - using direct pattern matching instead
    return [];
  }
}

module.exports = S033RegexBasedAnalyzer;
