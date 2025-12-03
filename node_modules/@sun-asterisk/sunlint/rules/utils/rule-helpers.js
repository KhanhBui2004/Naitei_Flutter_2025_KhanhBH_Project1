/**
 * Rule Helpers for Heuristic Rules
 * Utilities for rule configuration, violation reporting, and common operations
 */

class RuleHelper {
    constructor() {
        this.severityLevels = ['off', 'info', 'warn', 'error'];
        this.violationTypes = ['syntax', 'style', 'security', 'performance', 'maintainability'];
    }

    /**
     * Create a standard violation object
     * @param {Object} options - Violation options
     * @returns {Object} Standardized violation object
     */
    createViolation(options) {
        const {
            ruleId,
            message,
            line = 1,
            column = 0,
            severity = 'error',
            type = 'style',
            suggestion = null,
            fix = null
        } = options;

        return {
            ruleId: ruleId,
            message: message,
            line: line,
            column: column,
            severity: this.validateSeverity(severity),
            type: type,
            suggestion: suggestion,
            fix: fix,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate severity level
     * @param {string} severity - Severity level
     * @returns {string} Valid severity level
     */
    validateSeverity(severity) {
        return this.severityLevels.includes(severity) ? severity : 'error';
    }

    /**
     * Load rule configuration with defaults
     * @param {string} ruleId - Rule ID
     * @param {Object} userConfig - User configuration
     * @returns {Object} Merged configuration
     */
    loadRuleConfig(ruleId, userConfig = {}) {
        const defaultConfig = {
            enabled: true,
            severity: 'error',
            options: {},
            patterns: {
                include: ['**/*.js', '**/*.ts'],
                exclude: ['**/*.test.*', '**/*.spec.*', 'node_modules/**']
            }
        };

        return {
            ...defaultConfig,
            ...userConfig,
            ruleId: ruleId,
            patterns: {
                ...defaultConfig.patterns,
                ...(userConfig.patterns || {})
            },
            options: {
                ...defaultConfig.options,
                ...(userConfig.options || {})
            }
        };
    }

    /**
     * Check if file should be analyzed by rule
     * @param {string} filePath - File path
     * @param {Object} config - Rule configuration
     * @returns {boolean} True if file should be analyzed
     */
    shouldAnalyzeFile(filePath, config) {
        const { patterns } = config;

        // Check exclusions first
        if (patterns.exclude && patterns.exclude.length > 0) {
            for (const pattern of patterns.exclude) {
                if (this.matchPattern(filePath, pattern)) {
                    return false;
                }
            }
        }

        // Check inclusions
        if (patterns.include && patterns.include.length > 0) {
            for (const pattern of patterns.include) {
                if (this.matchPattern(filePath, pattern)) {
                    return true;
                }
            }
            return false; // No include patterns matched
        }

        return true; // No specific patterns, analyze by default
    }

    /**
     * Simple pattern matching (supports * wildcards)
     * @param {string} filePath - File path
     * @param {string} pattern - Pattern to match
     * @returns {boolean} True if pattern matches
     */
    matchPattern(filePath, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');

        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filePath);
    }

    /**
     * Format violation message with context
     * @param {Object} violation - Violation object
     * @param {string} context - Additional context
     * @returns {string} Formatted message
     */
    formatViolationMessage(violation, context = '') {
        const { ruleId, message, line, column, severity } = violation;
        const location = `${line}:${column}`;
        const prefix = `[${severity.toUpperCase()}] ${ruleId}`;
        
        let formatted = `${prefix} at ${location}: ${message}`;
        
        if (context) {
            formatted += `\n  Context: ${context}`;
        }

        if (violation.suggestion) {
            formatted += `\n  Suggestion: ${violation.suggestion}`;
        }

        return formatted;
    }

    /**
     * Group violations by type/severity
     * @param {Array} violations - Array of violations
     * @returns {Object} Grouped violations
     */
    groupViolations(violations) {
        const grouped = {
            bySeverity: {},
            byType: {},
            byRule: {}
        };

        violations.forEach(violation => {
            // Group by severity
            if (!grouped.bySeverity[violation.severity]) {
                grouped.bySeverity[violation.severity] = [];
            }
            grouped.bySeverity[violation.severity].push(violation);

            // Group by type
            if (!grouped.byType[violation.type]) {
                grouped.byType[violation.type] = [];
            }
            grouped.byType[violation.type].push(violation);

            // Group by rule
            if (!grouped.byRule[violation.ruleId]) {
                grouped.byRule[violation.ruleId] = [];
            }
            grouped.byRule[violation.ruleId].push(violation);
        });

        return grouped;
    }

    /**
     * Generate violation statistics
     * @param {Array} violations - Array of violations
     * @returns {Object} Statistics object
     */
    generateStats(violations) {
        const grouped = this.groupViolations(violations);
        
        return {
            total: violations.length,
            severity: {
                error: (grouped.bySeverity.error || []).length,
                warn: (grouped.bySeverity.warn || []).length,
                info: (grouped.bySeverity.info || []).length
            },
            types: Object.keys(grouped.byType).map(type => ({
                type,
                count: grouped.byType[type].length
            })),
            rules: Object.keys(grouped.byRule).map(ruleId => ({
                ruleId,
                count: grouped.byRule[ruleId].length
            })).sort((a, b) => b.count - a.count)
        };
    }

    /**
     * Check if rule should be skipped for file
     * @param {string} content - File content
     * @param {string} ruleId - Rule ID
     * @returns {boolean} True if rule should be skipped
     */
    shouldSkipRule(content, ruleId) {
        // Check for disable comments
        const disablePatterns = [
            `// sunlint-disable-next-line ${ruleId}`,
            `/* sunlint-disable-next-line ${ruleId} */`,
            `// sunlint-disable ${ruleId}`,
            `/* sunlint-disable ${ruleId} */`
        ];

        return disablePatterns.some(pattern => content.includes(pattern));
    }

    /**
     * Extract context around a violation
     * @param {string} content - File content
     * @param {number} line - Line number
     * @param {number} contextLines - Number of context lines
     * @returns {Object} Context information
     */
    extractContext(content, line, contextLines = 2) {
        const lines = content.split('\n');
        const startLine = Math.max(0, line - 1 - contextLines);
        const endLine = Math.min(lines.length, line + contextLines);
        
        const contextText = lines.slice(startLine, endLine)
            .map((text, index) => {
                const lineNum = startLine + index + 1;
                const marker = lineNum === line ? '>' : ' ';
                return `${marker} ${lineNum.toString().padStart(3)}: ${text}`;
            })
            .join('\n');

        return {
            startLine: startLine + 1,
            endLine: endLine,
            text: contextText,
            violationLine: lines[line - 1] || ''
        };
    }
}

/**
 * Comment Detection Utilities
 * Reusable functions for detecting and handling comments in source code
 */
class CommentDetector {
    /**
     * Check if a line is within a block comment region
     * @param {string[]} lines - Array of lines
     * @param {number} lineIndex - Current line index (0-based)
     * @returns {boolean} True if line is in block comment
     */
    static isLineInBlockComment(lines, lineIndex) {
        let inBlockComment = false;
        
        for (let i = 0; i <= lineIndex; i++) {
            const line = lines[i];
            
            // Check for block comment start
            if (line.includes('/*')) {
                inBlockComment = true;
            }
            
            // Check for block comment end on same line or later lines
            if (line.includes('*/')) {
                inBlockComment = false;
            }
        }
        
        return inBlockComment;
    }

    /**
     * Check if a specific position in a line is inside a comment
     * @param {string} line - Line content
     * @param {number} position - Character position in line
     * @returns {boolean} True if position is inside a comment
     */
    static isPositionInComment(line, position) {
        // Check if position is after // comment
        const singleLineCommentPos = line.indexOf('//');
        if (singleLineCommentPos !== -1 && position > singleLineCommentPos) {
            return true;
        }
        
        // Check if position is inside /* */ comment on same line
        let pos = 0;
        while (pos < line.length) {
            const commentStart = line.indexOf('/*', pos);
            const commentEnd = line.indexOf('*/', pos);
            
            if (commentStart !== -1 && commentEnd !== -1 && commentStart < commentEnd) {
                if (position >= commentStart && position <= commentEnd + 1) {
                    return true;
                }
                pos = commentEnd + 2;
            } else {
                break;
            }
        }
        
        return false;
    }

    /**
     * Clean line by removing comments but preserving structure for regex matching
     * @param {string} line - Original line
     * @returns {object} { cleanLine, commentRanges }
     */
    static cleanLineForMatching(line) {
        let cleanLine = line;
        const commentRanges = [];
        
        // Track /* */ comments
        let pos = 0;
        while (pos < cleanLine.length) {
            const commentStart = cleanLine.indexOf('/*', pos);
            const commentEnd = cleanLine.indexOf('*/', pos);
            
            if (commentStart !== -1 && commentEnd !== -1 && commentStart < commentEnd) {
                commentRanges.push({ start: commentStart, end: commentEnd + 2 });
                // Replace with spaces to preserve positions
                const spaces = ' '.repeat(commentEnd + 2 - commentStart);
                cleanLine = cleanLine.substring(0, commentStart) + spaces + cleanLine.substring(commentEnd + 2);
                pos = commentEnd + 2;
            } else {
                break;
            }
        }
        
        // Track // comments
        const singleCommentPos = cleanLine.indexOf('//');
        if (singleCommentPos !== -1) {
            commentRanges.push({ start: singleCommentPos, end: cleanLine.length });
            cleanLine = cleanLine.substring(0, singleCommentPos);
        }
        
        return { cleanLine, commentRanges };
    }

    /**
     * Filter out comment lines from analysis
     * @param {string[]} lines - Array of lines
     * @returns {Array} Array of {line, lineNumber, isComment} objects
     */
    static filterCommentLines(lines) {
        const result = [];
        let inBlockComment = false;
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Track block comments
            if (trimmedLine.includes('/*')) {
                inBlockComment = true;
            }
            if (trimmedLine.includes('*/')) {
                inBlockComment = false;
                result.push({ line, lineNumber: index + 1, isComment: true });
                return;
            }
            if (inBlockComment) {
                result.push({ line, lineNumber: index + 1, isComment: true });
                return;
            }
            
            // Check single line comments
            const isComment = trimmedLine.startsWith('//') || trimmedLine.startsWith('#');
            
            result.push({
                line,
                lineNumber: index + 1,
                isComment
            });
        });
        
        return result;
    }
}

module.exports = { RuleHelper, CommentDetector };
