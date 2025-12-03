/**
 * S035 Main Analyzer - Set Path attribute for Session Cookies
 * Primary: Symbol-based analysis (when available)
 * Fallback: Regex-based for all other cases
 * Command: node cli.js --rule=S035 --input=examples/rule-test-fixtures/rules/S035_path_session_cookies --engine=heuristic
 */

const S035SymbolBasedAnalyzer = require("./symbol-based-analyzer.js");
const S035RegexBasedAnalyzer = require("./regex-based-analyzer.js");

class S035Analyzer {
  constructor(options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S035] Constructor called with options:`, !!options);
      console.log(
        `🔧 [S035] Options type:`,
        typeof options,
        Object.keys(options || {})
      );
    }

    this.ruleId = "S035";
    this.ruleName = "Set Path attribute for Session Cookies";
    this.description =
      "Set Path attribute for Session Cookies to limit access scope. This restricts where cookies can be sent, reducing the attack surface by limiting cookie access to specific paths.";
    this.semanticEngine = options.semanticEngine || null;
    this.verbose = options.verbose || false;

    // Configuration - Use symbol-based as primary, regex for additional coverage
    this.config = {
      useSymbolBased: true, // Primary approach
      fallbackToRegex: true, // Additional coverage
      regexBasedOnly: false, // Can be set to true for pure mode
    };

    // Initialize analyzers
    try {
      this.symbolAnalyzer = new S035SymbolBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S035] Symbol analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S035] Error creating symbol analyzer:`, error);
    }

    try {
      this.regexAnalyzer = new S035RegexBasedAnalyzer(this.semanticEngine);
      if (process.env.SUNLINT_DEBUG) {
        console.log(`🔧 [S035] Regex analyzer created successfully`);
      }
    } catch (error) {
      console.error(`🔧 [S035] Error creating regex analyzer:`, error);
    }
  }

  /**
   * Initialize analyzer with semantic engine
   */
  async initialize(semanticEngine) {
    this.semanticEngine = semanticEngine;

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S035] Main analyzer initializing...`);
    }

    // Initialize both analyzers
    if (this.symbolAnalyzer) {
      await this.symbolAnalyzer.initialize?.(semanticEngine);
    }
    if (this.regexAnalyzer) {
      await this.regexAnalyzer.initialize?.(semanticEngine);
    }

    // Clean up if needed
    if (this.regexAnalyzer) {
      this.regexAnalyzer.cleanup?.();
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S035] Main analyzer initialized successfully`);
    }
  }

  /**
   * Single file analysis method for testing
   */
  analyzeSingle(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S035] analyzeSingle() called for: ${filePath}`);
    }

    // Return result using same format as analyze method
    return this.analyze([filePath], "typescript", options);
  }

  async analyze(files, language, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S035] analyze() method called with ${files.length} files, language: ${language}`
      );
    }

    const violations = [];

    for (const filePath of files) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S035] Processing file: ${filePath}`);
        }

        const fileViolations = await this.analyzeFile(filePath, options);
        violations.push(...fileViolations);

        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S035] File ${filePath}: Found ${fileViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(
          `⚠ [S035] Analysis failed for ${filePath}:`,
          error.message
        );
      }
    }

    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔧 [S035] Total violations found: ${violations.length}`);
    }

    return violations;
  }

  async analyzeFile(filePath, options = {}) {
    if (process.env.SUNLINT_DEBUG) {
      console.log(`🔍 [S035] analyzeFile() called for: ${filePath}`);
    }

    // Create a Map to track unique violations and prevent duplicates
    const violationMap = new Map();
    const lineToViolationMap = new Map(); // Track which lines already have violations
    const cookieToViolationMap = new Map(); // Track which cookies already have violations

    // 1. Try Symbol-based analysis first (primary)
    if (
      this.config.useSymbolBased &&
      this.semanticEngine?.project &&
      this.semanticEngine?.initialized
    ) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S035] Trying symbol-based analysis...`);
        }
        const sourceFile = this.semanticEngine.project.getSourceFile(filePath);
        if (sourceFile) {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S035] Source file found, analyzing...`);
          }
          const symbolViolations = await this.symbolAnalyzer.analyze(
            sourceFile,
            filePath
          );

          // Add symbol violations first (higher priority)
          symbolViolations.forEach((violation) => {
            // Extract cookie name from message for better deduplication
            const cookieNameMatch = violation.message.match(
              /(?:Session (?:cookie|middleware cookie name)|Set-Cookie.*?|NextAuth.*?) "([^"]+)"/
            );
            const cookieName = cookieNameMatch ? cookieNameMatch[1] : "unknown";

            // Use specific key including column for exact match
            const specificKey = `${violation.line}:${
              violation.column || 1
            }:${cookieName}`;
            const lineKey = `${violation.line}:${cookieName}`;

            if (!violationMap.has(specificKey)) {
              violationMap.set(specificKey, {
                ...violation,
                source: "symbol", // Track source for debugging
              });

              // Also track by line for regex deduplication
              lineToViolationMap.set(lineKey, specificKey);

              // Track by cookie name for broader deduplication
              const cookieKey = `${cookieName}:${violation.line}`;
              cookieToViolationMap.set(cookieKey, specificKey);
            }
          });

          if (process.env.SUNLINT_DEBUG) {
            console.log(
              `🔧 [S035] Symbol analysis completed: ${symbolViolations.length} violations`
            );
          }
        } else {
          if (process.env.SUNLINT_DEBUG) {
            console.log(`🔧 [S035] Source file not found, falling back...`);
          }
        }
      } catch (error) {
        console.warn(`⚠ [S035] Symbol analysis failed:`, error.message);
      }
    }

    // 2. Try Regex-based analysis (fallback or additional)
    if (this.config.fallbackToRegex || this.config.regexBasedOnly) {
      try {
        if (process.env.SUNLINT_DEBUG) {
          console.log(`🔧 [S035] Trying regex-based analysis...`);
        }
        const regexViolations = await this.regexAnalyzer.analyze(filePath);

        // Add regex violations only if not already covered by symbol analysis
        regexViolations.forEach((violation) => {
          // Extract cookie name from message for better deduplication
          const cookieNameMatch =
            violation.message.match(
              /(?:Session (?:cookie|middleware cookie name)|Set-Cookie.*?|NextAuth.*?) "([^"]+)"/
            ) ||
            violation.message.match(
              /Insecure session cookie:.*?(?:Session cookie|NextAuth.*?) "([^"]+)"/
            );
          const cookieName = cookieNameMatch ? cookieNameMatch[1] : "unknown";

          // Check if this line+cookie (or ±1 line) already has a violation from symbol analyzer
          const currentLine = violation.line;
          const hasSymbolViolation = [
            currentLine - 1,
            currentLine,
            currentLine + 1,
          ].some((line) => {
            const lineKey = `${line}:${cookieName}`;
            return lineToViolationMap.has(lineKey);
          });

          // Also check if this cookie already has a violation nearby (±5 lines for same cookie)
          const hasCookieViolation = Array.from(
            cookieToViolationMap.keys()
          ).some((key) => {
            const [existingCookie, existingLine] = key.split(":");
            return (
              existingCookie === cookieName &&
              Math.abs(parseInt(existingLine) - currentLine) <= 5
            );
          });

          if (!hasSymbolViolation && !hasCookieViolation) {
            // No symbol violation or nearby cookie violation, add regex violation
            const specificKey = `${violation.line}:${
              violation.column || 1
            }:${cookieName}:regex`;

            if (!violationMap.has(specificKey)) {
              violationMap.set(specificKey, {
                ...violation,
                source: "regex", // Track source for debugging
              });

              // Track this regex violation for future deduplication
              const cookieKey = `${cookieName}:${violation.line}`;
              cookieToViolationMap.set(cookieKey, specificKey);
            }
          } else if (process.env.SUNLINT_DEBUG) {
            const reason = hasSymbolViolation
              ? "already covered by symbol"
              : "duplicate cookie violation nearby";
            console.log(
              `🔧 [S035] Skipping duplicate regex violation at line ${currentLine} for cookie "${cookieName}" (${reason})`
            );
          }
        });
        if (process.env.SUNLINT_DEBUG) {
          console.log(
            `🔧 [S035] Regex analysis completed: ${regexViolations.length} violations`
          );
        }
      } catch (error) {
        console.warn(`⚠ [S035] Regex analysis failed:`, error.message);
      }
    }

    // Convert Map values to array and add filePath to each violation
    const finalViolations = Array.from(violationMap.values()).map(
      (violation) => ({
        ...violation,
        filePath: filePath,
        file: filePath, // Also add 'file' for compatibility
      })
    );

    if (process.env.SUNLINT_DEBUG) {
      console.log(
        `🔧 [S035] File analysis completed: ${finalViolations.length} unique violations`
      );
    }

    return finalViolations;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.symbolAnalyzer?.cleanup) {
      this.symbolAnalyzer.cleanup();
    }
    if (this.regexAnalyzer?.cleanup) {
      this.regexAnalyzer.cleanup();
    }
  }
}

module.exports = S035Analyzer;
