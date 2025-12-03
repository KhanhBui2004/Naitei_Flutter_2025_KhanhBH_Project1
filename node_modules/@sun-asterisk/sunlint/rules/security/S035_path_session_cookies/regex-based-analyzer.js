/**
 * S035 Regex-based Analyzer - Set Path attribute for Session Cookies
 * Fallback analyzer for pattern-based detection
 */

const fs = require("fs");

class S035RegexBasedAnalyzer {
  constructor() {
    this.ruleId = "S035";
    this.ruleName = "Set Path attribute for Session Cookies";
    this.description =
      "Set Path attribute for Session Cookies to limit access scope";

    // Regex patterns for detection
    this.patterns = {
      // Express.js patterns
      cookieCall: /res\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,
      setCookieHeader:
        /res\.setHeader\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*['"]([^'"=]+)=/gi,
      setCookieTemplate:
        /res\.setHeader\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*`([^`=]+)=/gi,
      setCookieArray:
        /res\.setHeader\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*\[([^\]]+)\]/gi,
      sessionMiddleware:
        /session\s*\(\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/g,

      // NestJS patterns
      nestjsResCookie:
        /@Res\(\)\s*\w+[^}]*\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nestjsCookieDecorator: /@Cookies\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nestjsResponseCookie: /response\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // Next.js patterns
      nextjsResponseCookiesSet:
        /response\.cookies\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nextjsCookiesSet: /cookies\(\)\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nextjsSetCookie:
        /NextResponse\.next\(\)\.cookies\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // NextAuth.js patterns
      nextAuthSessionToken:
        /sessionToken\s*:\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/g,
      nextAuthCsrfToken:
        /csrfToken\s*:\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/g,
      nextAuthCookies: /cookies\s*:\s*\{[^}]*sessionToken\s*:/g,

      // Session cookie names (expanded for frameworks)
      sessionCookieNames:
        /^(session|sessionid|session_id|sid|connect\.sid|auth|auth_token|authentication|jwt|token|csrf|csrf_token|xsrf|login|user|userid|user_id|sessionToken|csrfToken|next-auth\.session-token|next-auth\.csrf-token)$/i,

      // Path attribute patterns
      pathAttribute: /path\s*:\s*['"`]([^'"`]*)['"`]/gi,
      pathInSetCookie: /Path=([^;\\s]*)/gi,
    };

    this.violations = [];
  }

  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;
  }

  async analyze(filePath) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S035] Regex analysis starting for: ${filePath}`);
    }

    this.violations = [];

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // Analyze patterns
      this.checkCookieCalls(content, lines);
      this.checkSetCookieHeaders(content, lines);
      this.checkSessionMiddleware(content, lines);
      this.checkNestJSPatterns(content, lines);
      this.checkNextJSPatterns(content, lines);
      this.analyzeNextAuthConfig(content, lines);
    } catch (error) {
      console.warn(`⚠ [S035] Regex analysis error:`, error.message);
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔍 [S035] Regex analysis completed: ${this.violations.length} violations`
      );
    }

    return this.violations;
  }

  checkCookieCalls(content, lines) {
    let match;
    this.patterns.cookieCall.lastIndex = 0;

    while ((match = this.patterns.cookieCall.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        // Check if this cookie call has path attribute
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (Express.js) missing Path attribute`
            );
          } else {
            // Check if path is too broad (root path)
            const pathMatch = cookieConfig.match(this.patterns.pathAttribute);
            if (pathMatch && pathMatch[1] === "/") {
              const lineInfo = this.findLineNumber(content, match.index, lines);

              this.addViolation(
                lineInfo.line,
                lineInfo.column,
                `Insecure session cookie: Session cookie "${cookieName}" (Express.js) uses root path "/", consider using a more specific path`
              );
            }
          }
        }
      }
    }
  }

  checkSetCookieHeaders(content, lines) {
    // Check direct Set-Cookie headers
    let match;
    this.patterns.setCookieHeader.lastIndex = 0;

    while ((match = this.patterns.setCookieHeader.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        // Get the full Set-Cookie value
        const headerStart = content.indexOf('"', match.index);
        const headerEnd = content.indexOf('"', headerStart + 1);

        if (headerEnd > headerStart) {
          const headerValue = content.substring(headerStart + 1, headerEnd);

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔍 [S035] Debug - Cookie: ${cookieName}, Header: ${headerValue}`
            );
            console.log(
              `🔍 [S035] Debug - hasPath: ${this.hasPathInSetCookie(
                headerValue
              )}`
            );
          }

          if (!this.hasPathInSetCookie(headerValue)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (Express.js) in Set-Cookie header missing Path attribute`
            );
          } else {
            // Check if path is root
            const pathMatch = headerValue.match(this.patterns.pathInSetCookie);
            if (pathMatch && pathMatch[1] === "/") {
              const lineInfo = this.findLineNumber(content, match.index, lines);

              this.addViolation(
                lineInfo.line,
                lineInfo.column,
                `Insecure session cookie: Session cookie "${cookieName}" (Express.js) uses root path "/", consider using a more specific path`
              );
            }
          }
        }
      }
    }

    // Check Set-Cookie headers with template literals
    this.patterns.setCookieTemplate.lastIndex = 0;

    while ((match = this.patterns.setCookieTemplate.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        // Get the full template literal value
        const templateStart = content.indexOf("`", match.index);
        const templateEnd = content.indexOf("`", templateStart + 1);

        if (templateEnd > templateStart) {
          const templateValue = content.substring(
            templateStart + 1,
            templateEnd
          );

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔍 [S035] Debug Template - Cookie: ${cookieName}, Template: ${templateValue}`
            );
            console.log(
              `🔍 [S035] Debug Template - hasPath: ${this.hasPathInSetCookie(
                templateValue
              )}`
            );
          }

          if (!this.hasPathInSetCookie(templateValue)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Session cookie "${cookieName}" in Set-Cookie header should specify Path attribute`
            );
          } else {
            // Check for root path usage
            const pathMatch = templateValue.match(/Path=([^;\\s]*)/gi);
            if (pathMatch) {
              const pathValue = pathMatch[0].replace(/Path=/gi, "");
              if (
                pathValue === "/" ||
                pathValue === '""' ||
                pathValue === "''"
              ) {
                const lineInfo = this.findLineNumber(
                  content,
                  match.index,
                  lines
                );

                this.addViolation(
                  lineInfo.line,
                  lineInfo.column,
                  `Session cookie "${cookieName}" uses root path "/", consider using a more specific path`
                );
              }
            }
          }
        }
      }
    }

    // Check Set-Cookie arrays
    this.patterns.setCookieArray.lastIndex = 0;

    while ((match = this.patterns.setCookieArray.exec(content)) !== null) {
      const arrayContent = match[1];
      const cookieMatches = arrayContent.match(/['"`]([^'"`=]+)=/g);

      if (cookieMatches) {
        cookieMatches.forEach((cookieMatch) => {
          const cookieName = cookieMatch.replace(/['"`]/g, "").replace("=", "");

          if (this.isSessionCookie(cookieName)) {
            if (process.env.SUNLINT_DEBUG) {
              console.log(
                `🔍 [S035] Debug Array - Cookie: ${cookieName}, ArrayContent: ${arrayContent}`
              );
              console.log(
                `🔍 [S035] Debug Array - hasPath: ${this.hasPathInSetCookie(
                  arrayContent
                )}`
              );
              console.log(
                `🔍 [S035] Debug Array - !hasPath: ${!this.hasPathInSetCookie(
                  arrayContent
                )}`
              );
            }

            if (!this.hasPathInSetCookie(arrayContent)) {
              const lineInfo = this.findLineNumber(content, match.index, lines);

              this.addViolation(
                lineInfo.line,
                lineInfo.column,
                `Session cookie "${cookieName}" in Set-Cookie array should specify Path attribute`
              );
            }
          }
        });
      }
    }
  }

  checkSessionMiddleware(content, lines) {
    let match;
    this.patterns.sessionMiddleware.lastIndex = 0;

    while ((match = this.patterns.sessionMiddleware.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        // Check if session middleware has cookie.path configuration
        const sessionStart = match.index;
        const sessionEnd = this.findMatchingBrace(content, sessionStart);

        if (sessionEnd > sessionStart) {
          const sessionConfig = content.substring(sessionStart, sessionEnd);

          if (!this.hasPathInCookieConfig(sessionConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session middleware cookie "${cookieName}" (Express.js) missing Path attribute`
            );
          }
        }
      }
    }
  }

  /**
   * Check NestJS specific patterns
   */
  checkNestJSPatterns(content, lines) {
    // Check @Res() decorator response.cookie calls
    let match;
    this.patterns.nestjsResCookie.lastIndex = 0;

    while ((match = this.patterns.nestjsResCookie.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (NestJS @Res) missing Path attribute`
            );
          }
        }
      }
    }

    // Check response.cookie calls in NestJS
    this.patterns.nestjsResponseCookie.lastIndex = 0;

    while (
      (match = this.patterns.nestjsResponseCookie.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (NestJS) missing Path attribute`
            );
          }
        }
      }
    }

    // Check @Cookies decorator usage
    this.patterns.nestjsCookieDecorator.lastIndex = 0;

    while (
      (match = this.patterns.nestjsCookieDecorator.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const lineInfo = this.findLineNumber(content, match.index, lines);

        this.addViolation(
          lineInfo.line,
          lineInfo.column,
          `Insecure session cookie: Session cookie "${cookieName}" (NestJS @Cookies) should specify Path attribute`
        );
      }
    }
  }

  /**
   * Check Next.js specific patterns
   */
  checkNextJSPatterns(content, lines) {
    // Check response.cookies.set() calls
    let match;
    this.patterns.nextjsResponseCookiesSet.lastIndex = 0;

    while (
      (match = this.patterns.nextjsResponseCookiesSet.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing Path attribute`
            );
          }
        }
      }
    }

    // Check cookies().set() from next/headers
    this.patterns.nextjsCookiesSet.lastIndex = 0;

    while ((match = this.patterns.nextjsCookiesSet.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (Next.js headers) missing Path attribute`
            );
          }
        }
      }
    }

    // Check NextResponse.next().cookies.set() calls
    this.patterns.nextjsSetCookie.lastIndex = 0;

    while ((match = this.patterns.nextjsSetCookie.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const cookieCallStart = match.index;
        const cookieCallEnd = this.findMatchingBrace(content, cookieCallStart);

        if (cookieCallEnd > cookieCallStart) {
          const cookieConfig = content.substring(
            cookieCallStart,
            cookieCallEnd
          );

          if (!this.hasPathAttribute(cookieConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: Session cookie "${cookieName}" (Next.js Response) missing Path attribute`
            );
          }
        }
      }
    }
  }

  /**
   * Analyze NextAuth.js configuration for session and CSRF tokens
   */
  analyzeNextAuthConfig(content, lines) {
    // Check sessionToken configuration
    let match;
    this.patterns.nextAuthSessionToken.lastIndex = 0;

    while (
      (match = this.patterns.nextAuthSessionToken.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const tokenConfigStart = match.index;
        const tokenConfigEnd = this.findMatchingBrace(
          content,
          tokenConfigStart
        );

        if (tokenConfigEnd > tokenConfigStart) {
          const tokenConfig = content.substring(
            tokenConfigStart,
            tokenConfigEnd
          );

          if (!this.hasPathInOptionsConfig(tokenConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: NextAuth sessionToken "${cookieName}" missing Path attribute in options`
            );
          }
        }
      }
    }

    // Check csrfToken configuration
    this.patterns.nextAuthCsrfToken.lastIndex = 0;

    while ((match = this.patterns.nextAuthCsrfToken.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName)) {
        const tokenConfigStart = match.index;
        const tokenConfigEnd = this.findMatchingBrace(
          content,
          tokenConfigStart
        );

        if (tokenConfigEnd > tokenConfigStart) {
          const tokenConfig = content.substring(
            tokenConfigStart,
            tokenConfigEnd
          );

          if (!this.hasPathInOptionsConfig(tokenConfig)) {
            const lineInfo = this.findLineNumber(content, match.index, lines);

            this.addViolation(
              lineInfo.line,
              lineInfo.column,
              `Insecure session cookie: NextAuth csrfToken "${cookieName}" missing Path attribute in options`
            );
          }
        }
      }
    }

    // Check general NextAuth cookies configuration
    this.patterns.nextAuthCookies.lastIndex = 0;

    while ((match = this.patterns.nextAuthCookies.exec(content)) !== null) {
      const cookiesConfigStart = match.index;
      const cookiesConfigEnd = this.findMatchingBrace(
        content,
        cookiesConfigStart
      );

      if (cookiesConfigEnd > cookiesConfigStart) {
        const cookiesConfig = content.substring(
          cookiesConfigStart,
          cookiesConfigEnd
        );

        // Check if sessionToken is configured without path
        if (
          cookiesConfig.includes("sessionToken") &&
          !this.hasPathInNextAuthConfig(cookiesConfig)
        ) {
          const lineInfo = this.findLineNumber(content, match.index, lines);

          this.addViolation(
            lineInfo.line,
            lineInfo.column,
            `Insecure session cookie: NextAuth cookies configuration missing Path attribute for session tokens`
          );
        }
      }
    }
  }

  hasPathAttribute(config) {
    return this.patterns.pathAttribute.test(config);
  }

  hasPathInSetCookie(headerValue) {
    this.patterns.pathInSetCookie.lastIndex = 0; // Reset global regex
    return this.patterns.pathInSetCookie.test(headerValue);
  }

  hasPathInCookieConfig(config) {
    // Check for cookie: { path: ... } pattern
    return /cookie\s*:\s*\{[^}]*path\s*:/i.test(config);
  }

  /**
   * Check if NextAuth options configuration has path attribute
   */
  hasPathInOptionsConfig(config) {
    // Check for options: { path: ... } pattern in NextAuth
    return /options\s*:\s*\{[^}]*path\s*:/i.test(config);
  }

  /**
   * Check if NextAuth cookies configuration has path attribute
   */
  hasPathInNextAuthConfig(config) {
    // Check for path attribute in NextAuth cookies configuration
    return (
      /path\s*:\s*['"`][^'"`]*['"`]/i.test(config) ||
      /options\s*:\s*\{[^}]*path\s*:/i.test(config)
    );
  }

  findMatchingBrace(content, startIndex) {
    let braceCount = 0;
    let inString = false;
    let stringChar = "";

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (!inString) {
        if (char === '"' || char === "'" || char === "`") {
          inString = true;
          stringChar = char;
        } else if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            return i + 1;
          }
        }
      } else {
        if (char === stringChar && content[i - 1] !== "\\") {
          inString = false;
          stringChar = "";
        }
      }
    }

    return startIndex + 1000; // Fallback
  }

  isSessionCookie(cookieName) {
    return this.patterns.sessionCookieNames.test(cookieName);
  }

  findLineNumber(content, position, lines) {
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline

      if (currentPos + lineLength > position) {
        return {
          line: i + 1,
          column: position - currentPos + 1,
        };
      }

      currentPos += lineLength;
    }

    return { line: lines.length, column: 1 };
  }

  addViolation(line, column, message) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔍 [S035] Regex violation at line ${line}, column ${column}: ${message.substring(
          0,
          50
        )}...`
      );
    }

    this.violations.push({
      ruleId: this.ruleId,
      ruleName: this.ruleName,
      severity: "warning",
      message: message,
      line: line,
      column: column,
      source: "regex-based",
    });
  }

  cleanup() {
    this.violations = [];
  }
}

module.exports = S035RegexBasedAnalyzer;
