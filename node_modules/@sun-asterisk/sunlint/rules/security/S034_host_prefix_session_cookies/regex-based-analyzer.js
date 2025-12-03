/**
 * S034 Regex-based Analyzer - Use __Host- prefix for Session Cookies
 * Fallback analyzer for pattern-based detection
 */

const fs = require("fs");

class S034RegexBasedAnalyzer {
  constructor() {
    this.ruleId = "S034";
    this.ruleName = "Use __Host- prefix for Session Cookies";
    this.description =
      "Use __Host- prefix for Session Cookies to prevent subdomain sharing";
    this.category = "security";
    this.verbose = process.env.SUNLINT_DEBUG === "true";

    // Enhanced regex patterns for framework detection
    this.patterns = {
      // Traditional Express.js patterns
      cookieCall: /res\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,
      setCookieHeader:
        /res\.setHeader\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*['"`]([^'"`=]+)=/gi,
      setCookieArray:
        /res\.setHeader\s*\(\s*['"`]Set-Cookie['"`]\s*,\s*\[([^\]]+)\]/gi,
      sessionMiddleware:
        /session\s*\(\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/g,

      // NestJS patterns
      nestJSCookieSet:
        /@Res\(\)\s+\w+:\s*Response[\s\S]*?\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nestJSCookieDecorator: /@Cookies\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      nestJSResponseCookie: /response\.cookie\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // Next.js patterns
      nextJSResponseCookies:
        /response\.cookies\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nextJSCookiesFunction: /cookies\(\)\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nextJSCookieStore: /cookieStore\.set\s*\(\s*['"`]([^'"`]+)['"`]/g,

      // Nuxt.js patterns
      nuxtCookieSet: /useCookie\s*\(\s*['"`]([^'"`]+)['"`]/g,
      nuxtServerCookie: /setCookie\s*\(\s*\w+\s*,\s*['"`]([^'"`]+)['"`]/g,
      nuxtH3Cookie: /setCookie\s*\(\s*event\s*,\s*['"`]([^'"`]+)['"`]/g,

      // Session cookie names (enhanced)
      sessionCookieNames:
        /^(session|sessionid|session_id|sid|connect\.sid|auth|auth_token|authentication|jwt|token|csrf|csrf_token|xsrf|login|user|userid|user_id|api_session|admin_session|app_auth|edge_session|server_session|refresh_token|next-auth\.session-token|next-auth\.csrf-token|custom-session-token)$/i,
    };

    this.violations = [];
  }

  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;
  }

  async analyze(filePath) {
    if (this.verbose) {
      console.log(
        `🔍 [${this.ruleId}] Regex analysis starting for: ${filePath}`
      );
    }

    this.violations = [];

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // Framework detection
      const framework = this.detectFramework(content);

      if (this.verbose) {
        console.log(`🔍 [${this.ruleId}] Detected framework: ${framework}`);
      }

      // Traditional Express.js patterns
      this.checkCookieCalls(content, lines, filePath);
      this.checkSetCookieHeaders(content, lines, filePath);
      this.checkSessionMiddleware(content, lines, filePath);

      // Framework-specific patterns
      this.checkNestJSPatterns(content, lines, filePath);
      this.checkNextJSPatterns(content, lines, filePath);
      this.checkNuxtJSPatterns(content, lines, filePath);
      this.analyzeNextAuthConfig(content, lines, filePath);
    } catch (error) {
      console.warn(`⚠ [${this.ruleId}] Regex analysis error:`, error.message);
    }

    if (this.verbose) {
      console.log(
        `🔍 [${this.ruleId}] Regex analysis completed: ${this.violations.length} violations`
      );
    }

    return this.violations;
  }

  detectFramework(content) {
    if (
      content.includes("@nestjs") ||
      content.includes("@Res()") ||
      content.includes("@Cookies")
    ) {
      return "NestJS";
    }
    if (
      content.includes("next/") ||
      content.includes("NextRequest") ||
      content.includes("NextResponse")
    ) {
      return "Next.js";
    }
    if (
      content.includes("#nuxt") ||
      content.includes("useCookie") ||
      content.includes("setCookie")
    ) {
      return "Nuxt.js";
    }
    return "Express.js";
  }

  checkCookieCalls(content, lines, filePath) {
    let match;
    this.patterns.cookieCall.lastIndex = 0;

    while ((match = this.patterns.cookieCall.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Express.js) missing __Host- prefix`,
          filePath
        );
      }
    }
  }

  checkSetCookieHeaders(content, lines, filePath) {
    // Check direct Set-Cookie headers
    let match;
    this.patterns.setCookieHeader.lastIndex = 0;

    while ((match = this.patterns.setCookieHeader.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" in Set-Cookie header missing __Host- prefix`,
          filePath
        );
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

          if (
            this.isSessionCookie(cookieName) &&
            !this.hasHostPrefix(cookieName)
          ) {
            const lineNumber = this.getLineNumber(content, match.index);
            this.addViolation(
              lineNumber,
              1,
              `Insecure session cookie: Session cookie "${cookieName}" in Set-Cookie array missing __Host- prefix`,
              filePath
            );
          }
        });
      }
    }
  }

  checkSessionMiddleware(content, lines, filePath) {
    let match;
    this.patterns.sessionMiddleware.lastIndex = 0;

    while ((match = this.patterns.sessionMiddleware.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session middleware cookie name "${cookieName}" missing __Host- prefix`,
          filePath
        );
      }
    }
  }

  // Framework-specific analysis methods
  checkNestJSPatterns(content, lines, filePath) {
    // NestJS @Res() decorator with cookie setting
    let match;
    this.patterns.nestJSCookieSet.lastIndex = 0;

    while ((match = this.patterns.nestJSCookieSet.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (NestJS) missing __Host- prefix`,
          filePath
        );
      }
    }

    // NestJS response.cookie() calls
    this.patterns.nestJSResponseCookie.lastIndex = 0;

    while (
      (match = this.patterns.nestJSResponseCookie.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (NestJS) missing __Host- prefix`,
          filePath
        );
      }
    }

    // NestJS @Cookies decorator
    this.patterns.nestJSCookieDecorator.lastIndex = 0;

    while (
      (match = this.patterns.nestJSCookieDecorator.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (NestJS) missing __Host- prefix`,
          filePath
        );
      }
    }
  }

  checkNextJSPatterns(content, lines, filePath) {
    // Next.js response.cookies.set()
    let match;
    this.patterns.nextJSResponseCookies.lastIndex = 0;

    while (
      (match = this.patterns.nextJSResponseCookies.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing __Host- prefix`,
          filePath
        );
      }
    }

    // Next.js cookies().set()
    this.patterns.nextJSCookiesFunction.lastIndex = 0;

    while (
      (match = this.patterns.nextJSCookiesFunction.exec(content)) !== null
    ) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing __Host- prefix`,
          filePath
        );
      }
    }

    // Next.js cookieStore.set()
    this.patterns.nextJSCookieStore.lastIndex = 0;

    while ((match = this.patterns.nextJSCookieStore.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Next.js) missing __Host- prefix`,
          filePath
        );
      }
    }
  }

  checkNuxtJSPatterns(content, lines, filePath) {
    // Nuxt.js useCookie()
    let match;
    this.patterns.nuxtCookieSet.lastIndex = 0;

    while ((match = this.patterns.nuxtCookieSet.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Nuxt.js) missing __Host- prefix`,
          filePath
        );
      }
    }

    // Nuxt.js setCookie() server
    this.patterns.nuxtServerCookie.lastIndex = 0;

    while ((match = this.patterns.nuxtServerCookie.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Nuxt.js) missing __Host- prefix`,
          filePath
        );
      }
    }

    // Nuxt.js H3 setCookie()
    this.patterns.nuxtH3Cookie.lastIndex = 0;

    while ((match = this.patterns.nuxtH3Cookie.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: Session cookie "${cookieName}" (Nuxt.js) missing __Host- prefix`,
          filePath
        );
      }
    }
  }

  analyzeNextAuthConfig(content, lines, filePath) {
    const violations = [];

    // Simple approach: find NextAuth cookie configurations directly
    // Pattern 1: sessionToken configurations
    const sessionTokenPattern =
      /sessionToken\s*:\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/gi;
    let match;

    while ((match = sessionTokenPattern.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: sessionToken Pattern match - name: "${cookieName}"`
        );
      }

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: NextAuth "sessionToken" cookie "${cookieName}" missing __Host- prefix`,
          filePath
        );
      }
    }

    // Pattern 2: csrfToken configurations
    const csrfTokenPattern =
      /csrfToken\s*:\s*\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`]/gi;

    while ((match = csrfTokenPattern.exec(content)) !== null) {
      const cookieName = match[1];

      if (this.verbose) {
        console.log(
          `🔍 [${this.ruleId}] Regex: csrfToken Pattern match - name: "${cookieName}"`
        );
      }

      if (this.isSessionCookie(cookieName) && !this.hasHostPrefix(cookieName)) {
        const lineNumber = this.getLineNumber(content, match.index);
        this.addViolation(
          lineNumber,
          1,
          `Insecure session cookie: NextAuth "csrfToken" cookie "${cookieName}" missing __Host- prefix`,
          filePath
        );
      }
    }

    return violations;
  }

  isSessionCookie(cookieName) {
    return this.patterns.sessionCookieNames.test(cookieName);
  }

  hasHostPrefix(cookieName) {
    return cookieName.startsWith("__Host-");
  }

  getLineNumber(content, position) {
    const beforePosition = content.substring(0, position);
    return beforePosition.split("\n").length;
  }

  addViolation(line, column, message, filePath) {
    if (this.verbose) {
      console.log(
        `🔍 [${
          this.ruleId
        }] Regex violation at line ${line}, column ${column}: ${message.substring(
          0,
          50
        )}...`
      );
    }

    this.violations.push({
      rule: this.ruleId,
      source: filePath,
      category: this.category,
      line: line,
      column: column,
      message: message,
      severity: "warning",
    });
  }

  cleanup() {
    this.violations = [];
  }
}

module.exports = S034RegexBasedAnalyzer;
