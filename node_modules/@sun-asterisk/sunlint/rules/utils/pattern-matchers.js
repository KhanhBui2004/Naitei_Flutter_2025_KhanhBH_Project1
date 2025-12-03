/**
 * Pattern Matchers for Heuristic Rules
 * Common pattern matching utilities for code analysis
 */

class PatternMatcher {
    constructor() {
        this.commonPatterns = this.loadCommonPatterns();
    }

    /**
     * Load common patterns used across rules
     * @returns {Object} Common patterns object
     */
    loadCommonPatterns() {
        return {
            // Function naming patterns
            functionName: {
                camelCase: /^[a-z][a-zA-Z0-9]*$/,
                verbNoun: /^(get|set|is|has|can|should|will|create|update|delete|find|search|validate|process|handle|execute)[A-Z]/,
                constructor: /^[A-Z][a-zA-Z0-9]*$/
            },

            // Variable naming patterns
            variableName: {
                camelCase: /^[a-z][a-zA-Z0-9]*$/,
                constant: /^[A-Z][A-Z0-9_]*$/,
                boolean: /^(is|has|can|should|will|did)[A-Z]/
            },

            // Log level patterns
            logLevel: {
                console: /console\.(log|info|warn|error|debug)/g,
                logger: /(logger|log)\.(trace|debug|info|warn|error|fatal)/g,
                customLogger: /\b(log|logger)\b.*\.(trace|debug|info|warn|error|fatal)/g
            },

            // Security patterns
            security: {
                hardcodedSecret: /(['"`])((?:password|secret|key|token|api_key|apikey)[:=]\s*[^'"`\s]+)\1/gi,
                sqlInjection: /(query|execute)\s*\(\s*['"`][^'"`]*\+.*['"`]/g,
                xss: /innerHTML\s*=\s*[^;]+/g
            },

            // TypeScript patterns
            typescript: {
                interface: /interface\s+([I]?[A-Z][a-zA-Z0-9]*)/g,
                tsIgnore: /@ts-ignore(?!\s+.*:)/g,
                emptyInterface: /interface\s+\w+\s*{\s*}/g
            }
        };
    }

    /**
     * Find matches for a pattern in content
     * @param {string} content - Code content
     * @param {RegExp} pattern - Pattern to match
     * @returns {Array} Array of matches with line/column info
     */
    findMatches(content, pattern) {
        const matches = [];
        let match;

        // Ensure pattern is global
        const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');

        while ((match = globalPattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            const column = match.index - this.getLineStart(content, match.index);

            matches.push({
                match: match[0],
                groups: match.slice(1),
                line: line,
                column: column,
                index: match.index,
                lineContent: this.getLineContent(content, line)
            });
        }

        return matches;
    }

    /**
     * Find function naming violations
     * @param {string} content - Code content
     * @returns {Array} Array of violations
     */
    findFunctionNamingViolations(content) {
        const violations = [];
        const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|async\s+function|\([^)]*\)\s*=>))/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1] || match[2];
            const line = this.getLineNumber(content, match.index);

            // Skip if it's a constructor (starts with capital letter)
            if (/^[A-Z]/.test(functionName)) {
                continue;
            }

            // Check if it follows verb-noun pattern
            if (!this.commonPatterns.functionName.verbNoun.test(functionName)) {
                violations.push({
                    type: 'function-naming',
                    message: `Function name '${functionName}' should follow verb-noun pattern (e.g., getUserData, validateInput)`,
                    line: line,
                    column: match.index - this.getLineStart(content, match.index),
                    functionName: functionName
                });
            }
        }

        return violations;
    }

    /**
     * Find log level usage violations
     * @param {string} content - Code content
     * @returns {Array} Array of violations
     */
    findLogLevelViolations(content) {
        const violations = [];
        
        // Check for console.log usage (should use appropriate log levels)
        const consoleLogMatches = this.findMatches(content, /console\.log\s*\(/g);
        consoleLogMatches.forEach(match => {
            violations.push({
                type: 'log-level',
                message: 'Use appropriate log level instead of console.log (info, warn, error)',
                line: match.line,
                column: match.column,
                suggestion: 'Replace with console.info, console.warn, or console.error'
            });
        });

        return violations;
    }

    /**
     * Find hardcoded secrets
     * @param {string} content - Code content
     * @returns {Array} Array of violations
     */
    findHardcodedSecrets(content) {
        const violations = [];
        const secretPatterns = [
            /['"`](password|secret|key|token|api_key|apikey)['"`]\s*[:=]\s*['"`][a-zA-Z0-9+/=]{8,}['"`]/gi,
            /(password|secret|key|token)\s*=\s*['"`][a-zA-Z0-9+/=]{8,}['"`]/gi
        ];

        secretPatterns.forEach(pattern => {
            const matches = this.findMatches(content, pattern);
            matches.forEach(match => {
                violations.push({
                    type: 'hardcoded-secret',
                    message: 'Hardcoded secret detected. Use environment variables or secure configuration',
                    line: match.line,
                    column: match.column,
                    severity: 'error'
                });
            });
        });

        return violations;
    }

    /**
     * Find TypeScript interface violations
     * @param {string} content - Code content
     * @returns {Array} Array of violations
     */
    findTypeScriptInterfaceViolations(content) {
        const violations = [];
        
        // Interface should start with 'I' prefix
        const interfaceMatches = this.findMatches(content, /interface\s+([A-Z][a-zA-Z0-9]*)/g);
        interfaceMatches.forEach(match => {
            const interfaceName = match.groups[0];
            if (!interfaceName.startsWith('I')) {
                violations.push({
                    type: 'interface-naming',
                    message: `Interface '${interfaceName}' should start with 'I' prefix`,
                    line: match.line,
                    column: match.column,
                    suggestion: `I${interfaceName}`
                });
            }
        });

        return violations;
    }

    /**
     * Get line number for character index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Get line start position
     */
    getLineStart(content, index) {
        const beforeIndex = content.substring(0, index);
        const lastNewline = beforeIndex.lastIndexOf('\n');
        return lastNewline === -1 ? 0 : lastNewline + 1;
    }

    /**
     * Get line content
     */
    getLineContent(content, lineNumber) {
        const lines = content.split('\n');
        return lines[lineNumber - 1] || '';
    }

    /**
     * Create a custom pattern matcher
     * @param {string} name - Pattern name
     * @param {RegExp} pattern - Regular expression
     * @param {Function} validator - Optional validator function
     * @returns {Function} Pattern matcher function
     */
    createMatcher(name, pattern, validator = null) {
        return (content) => {
            const matches = this.findMatches(content, pattern);
            
            if (validator) {
                return matches.filter(match => validator(match));
            }
            
            return matches;
        };
    }
}

module.exports = { PatternMatcher };
