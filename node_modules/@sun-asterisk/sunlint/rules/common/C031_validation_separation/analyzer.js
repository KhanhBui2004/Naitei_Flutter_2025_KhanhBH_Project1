const fs = require('fs');
const path = require('path');

/**
 * Rule C031 - Validation Logic Separation
 * Kiểm tra logic validation có bị trộn lẫn với business logic không
 */
class ValidationSeparationAnalyzer {
    constructor() {
        this.ruleId = 'C031';
        this.ruleName = 'Validation Logic Separation';
        this.category = 'architecture';
        this.severity = 'warning';
        this.description = 'Logic kiểm tra dữ liệu (validate) phải nằm riêng biệt';
    }

    analyzeFile(filePath, options = {}) {
        const violations = [];
        
        try {
            if (!fs.existsSync(filePath)) {
                return violations;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Detect functions with mixed validation and business logic
            const functions = this.extractFunctions(content);
            
            for (const func of functions) {
                const validationCount = this.countValidationStatements(func.body);
                const businessLogicCount = this.countBusinessLogicStatements(func.body);
                
                // If both validation and business logic exist in same function
                if (validationCount > 0 && businessLogicCount > 0) {
                    const maxValidationAllowed = options.maxValidationStatementsInFunction || 3;
                    
                    if (validationCount > maxValidationAllowed) {
                        violations.push({
                            line: func.startLine,
                            column: 1,
                            message: `Function '${func.name}' has ${validationCount} validation statements mixed with business logic. Consider separating validation logic.`,
                            ruleId: this.ruleId,
                            severity: this.severity,
                            source: lines[func.startLine - 1]?.trim() || ''
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error analyzing ${filePath}:`, error.message);
        }
        
        return violations;
    }

    extractFunctions(content) {
        const functions = [];
        const lines = content.split('\n');
        
        // Simple function detection patterns
        const functionPatterns = [
            /function\s+(\w+)\s*\(/g,
            /const\s+(\w+)\s*=\s*\(/g,
            /(\w+)\s*\(\s*[^)]*\s*\)\s*=>/g,
            /(\w+)\s*:\s*function\s*\(/g
        ];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const pattern of functionPatterns) {
                const matches = line.matchAll(pattern);
                for (const match of matches) {
                    const functionName = match[1];
                    const startLine = i + 1;
                    
                    // Extract function body (simple approach)
                    const body = this.extractFunctionBody(lines, i);
                    
                    functions.push({
                        name: functionName,
                        startLine,
                        body
                    });
                }
            }
        }
        
        return functions;
    }

    extractFunctionBody(lines, startIndex) {
        let body = '';
        let braceCount = 0;
        let inFunction = false;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('{')) {
                braceCount += (line.match(/\{/g) || []).length;
                inFunction = true;
            }
            
            if (inFunction) {
                body += line + '\n';
            }
            
            if (line.includes('}')) {
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount <= 0 && inFunction) {
                    break;
                }
            }
        }
        
        return body;
    }

    countValidationStatements(code) {
        const validationPatterns = [
            /if\s*\(\s*!.*\)\s*\{?\s*throw/g,
            /if\s*\(.*\.\s*length\s*[<>=]\s*\d+\)/g,
            /if\s*\(.*\s*==\s*null\s*\||\s*.*\s*==\s*undefined\)/g,
            /if\s*\(.*\s*!\s*=\s*null\s*&&\s*.*\s*!\s*=\s*undefined\)/g,
            /throw\s+new\s+Error\s*\(/g,
            /assert\s*\(/g,
            /validate\w*\s*\(/g,
            /check\w*\s*\(/g
        ];
        
        let count = 0;
        for (const pattern of validationPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                count += matches.length;
            }
        }
        
        return count;
    }

    countBusinessLogicStatements(code) {
        const businessLogicPatterns = [
            /calculate\w*\s*\(/g,
            /process\w*\s*\(/g,
            /save\w*\s*\(/g,
            /update\w*\s*\(/g,
            /delete\w*\s*\(/g,
            /send\w*\s*\(/g,
            /return\s+\w+\s*\(/g,
            /await\s+\w+\s*\(/g
        ];
        
        let count = 0;
        for (const pattern of businessLogicPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                count += matches.length;
            }
        }
        
        return count;
    }

    // Main analyze method expected by CLI
    async analyze(files, language, config) {
        const violations = [];
        
        for (const filePath of files) {
            try {
                const fileViolations = this.analyzeFile(filePath, config);
                violations.push(...fileViolations);
            } catch (error) {
                console.error(`Error analyzing file ${filePath}:`, error.message);
            }
        }
        
        return violations;
    }
}

module.exports = new ValidationSeparationAnalyzer();
