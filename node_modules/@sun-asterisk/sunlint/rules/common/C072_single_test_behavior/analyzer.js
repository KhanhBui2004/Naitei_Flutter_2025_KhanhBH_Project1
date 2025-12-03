/**
 * C072 Rule: Each test should assert only one behavior
 * Ensures test focus and maintainability by limiting assertions per test
 * Severity: warning  
 * Category: Quality
 */

const fs = require('fs');
const path = require('path');

class C072SingleTestBehaviorAnalyzer {
  constructor() {
    this.ruleId = 'C072';
    this.ruleName = 'Single Test Behavior';
    this.description = 'Each test should assert only one behavior';
    this.severity = 'warning';
    this.maxAssertions = 1;
  }

  async analyze(files, language, config) {
    const violations = [];

    for (const filePath of files) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileViolations = await this.analyzeFile(filePath, fileContent, language, config);
        violations.push(...fileViolations);
      } catch (error) {
        console.warn(`C072 analysis error for ${filePath}:`, error.message);
      }
    }

    return violations;
  }

  async analyzeFile(filePath, fileContent, language, config) {
    const violations = [];
    
    try {
      // Skip non-test files
      if (!this.isTestFile(filePath)) {
        return violations;
      }

      const lines = fileContent.split('\n');
      let inTestBlock = false;
      let testStartLine = 0;
      let testName = '';
      let braceLevel = 0;
      let expectCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for test function start
        const testMatch = line.match(/^\s*(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\(.*\)\s*=>\s*\{|^\s*(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?function/);
        if (testMatch) {
          inTestBlock = true;
          testStartLine = lineNumber;
          testName = testMatch[1] || testMatch[2] || 'unnamed test';
          braceLevel = 1;
          expectCount = 0;
          continue;
        }

        if (inTestBlock) {
          // Count braces to track test scope
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          braceLevel = braceLevel + openBraces - closeBraces;

          // Count expect/assert statements
          const expectMatches = line.match(/\b(?:expect|assert|should)\s*\(/g);
          if (expectMatches) {
            expectCount += expectMatches.length;
          }

          // Check if test block ended
          if (braceLevel <= 0) {
            inTestBlock = false;
            
            // Report violation if too many expectations
            if (expectCount > this.maxAssertions) {
              violations.push({
                ruleId: this.ruleId,
                severity: this.severity,
                message: `Test '${testName}' has ${expectCount} assertions. Each test should focus on one behavior (max ${this.maxAssertions} assertions)`,
                filePath: filePath,
                line: testStartLine,
                column: 1,
                source: lines[testStartLine - 1]?.trim() || '',
                suggestion: 'Consider splitting into separate test cases'
              });
            }
          }
        }
      }

    } catch (error) {
      console.warn(`C072 analysis error for ${filePath}:`, error.message);
    }

    return violations;
  }

  isTestFile(filePath) {
    const testPatterns = [
      /\.test\.(js|ts|jsx|tsx)$/,
      /\.spec\.(js|ts|jsx|tsx)$/,
      /\/__tests__\//,
      /\/tests?\//,
      /\.e2e\./,
      /\.integration\./
    ];
    
    return testPatterns.some(pattern => pattern.test(filePath));
  }
}

module.exports = C072SingleTestBehaviorAnalyzer;
