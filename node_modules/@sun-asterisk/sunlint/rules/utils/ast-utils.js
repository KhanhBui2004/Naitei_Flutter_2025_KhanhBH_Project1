/**
 * AST Utilities for Heuristic Rules
 * Provides AST parsing and traversal utilities for rule analyzers
 */

class ASTUtils {
    constructor() {
        this.supportedLanguages = ['javascript', 'typescript'];
    }

    /**
     * Parse code content into AST
     * @param {string} content - Code content
     * @param {string} language - Language (javascript, typescript)
     * @returns {Object|null} Parsed AST or null if parsing fails
     */
    parse(content, language = 'javascript') {
        try {
            // TODO: Implement proper AST parsing
            // For now, return a simple representation
            return {
                type: 'Program',
                body: [],
                language,
                sourceCode: content
            };
        } catch (error) {
            console.warn('AST parsing failed:', error.message);
            return null;
        }
    }

    /**
     * Find function declarations in code
     * @param {string} content - Code content
     * @returns {Array} Array of function matches
     */
    findFunctions(content) {
        const functions = [];
        const functionRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*=\s*\([^)]*\)\s*=>)/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            const functionName = match[1] || match[2] || match[3];
            
            functions.push({
                name: functionName,
                line: line,
                column: match.index - this.getLineStart(content, match.index),
                match: match[0]
            });
        }

        return functions;
    }

    /**
     * Find variable declarations
     * @param {string} content - Code content
     * @returns {Array} Array of variable matches
     */
    findVariables(content) {
        const variables = [];
        const varRegex = /(?:var|let|const)\s+(\w+)/g;
        let match;

        while ((match = varRegex.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            
            variables.push({
                name: match[1],
                line: line,
                column: match.index - this.getLineStart(content, match.index),
                type: match[0].split(' ')[0] // var, let, const
            });
        }

        return variables;
    }

    /**
     * Find import/require statements
     * @param {string} content - Code content
     * @returns {Array} Array of import matches
     */
    findImports(content) {
        const imports = [];
        
        // ES6 imports
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            imports.push({
                type: 'import',
                module: match[1],
                line: line,
                match: match[0]
            });
        }

        // CommonJS requires
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            imports.push({
                type: 'require',
                module: match[1],
                line: line,
                match: match[0]
            });
        }

        return imports;
    }

    /**
     * Get line number for a character index
     * @param {string} content - Code content
     * @param {number} index - Character index
     * @returns {number} Line number (1-based)
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Get line start position for a character index
     * @param {string} content - Code content
     * @param {number} index - Character index
     * @returns {number} Line start index
     */
    getLineStart(content, index) {
        const beforeIndex = content.substring(0, index);
        const lastNewline = beforeIndex.lastIndexOf('\n');
        return lastNewline === -1 ? 0 : lastNewline + 1;
    }

    /**
     * Get line content for a line number
     * @param {string} content - Code content
     * @param {number} lineNumber - Line number (1-based)
     * @returns {string} Line content
     */
    getLineContent(content, lineNumber) {
        const lines = content.split('\n');
        return lines[lineNumber - 1] || '';
    }

    /**
     * Check if position is inside a comment
     * @param {string} content - Code content
     * @param {number} index - Character index
     * @returns {boolean} True if inside comment
     */
    isInComment(content, index) {
        const beforeIndex = content.substring(0, index);
        
        // Single line comment
        const lastLineStart = beforeIndex.lastIndexOf('\n');
        const lineContent = beforeIndex.substring(lastLineStart + 1);
        if (lineContent.includes('//')) {
            return true;
        }

        // Block comment
        const lastBlockStart = beforeIndex.lastIndexOf('/*');
        const lastBlockEnd = beforeIndex.lastIndexOf('*/');
        
        return lastBlockStart > lastBlockEnd;
    }

    /**
     * Extract function parameters
     * @param {string} functionDeclaration - Function declaration string
     * @returns {Array} Array of parameter names
     */
    extractParameters(functionDeclaration) {
        const paramMatch = functionDeclaration.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1]) return [];
        
        return paramMatch[1]
            .split(',')
            .map(param => param.trim().split('=')[0].trim()) // Handle default parameters
            .filter(param => param.length > 0);
    }
}

module.exports = { ASTUtils };
