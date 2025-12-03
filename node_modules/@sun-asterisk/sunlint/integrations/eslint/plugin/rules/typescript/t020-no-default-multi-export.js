/**
 * @fileoverview Rule T020: Avoid export default for multi-responsibility modules
 * @description Improve tree-shaking and module clarity
 */

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Avoid export default for multi-responsibility modules',
            category: 'Best Practices',
            recommended: true
        },
        fixable: null,
        schema: []
    },
    
    create(context) {
        let hasDefaultExport = false;
        let namedExports = [];
        let exportedFunctions = [];
        let exportedClasses = [];
        let exportedConstants = [];

        function analyzeExport(node, exportType) {
            if (exportType === 'default') {
                hasDefaultExport = true;
            } else {
                namedExports.push(node);
            }
        }

        return {
            // Track export default statements
            ExportDefaultDeclaration(node) {
                hasDefaultExport = true;
                
                // Analyze what's being exported as default
                if (node.declaration) {
                    if (node.declaration.type === 'FunctionDeclaration') {
                        exportedFunctions.push(node.declaration);
                    } else if (node.declaration.type === 'ClassDeclaration') {
                        exportedClasses.push(node.declaration);
                    }
                }
            },

            // Track named exports
            ExportNamedDeclaration(node) {
                namedExports.push(node);
                
                if (node.declaration) {
                    if (node.declaration.type === 'FunctionDeclaration') {
                        exportedFunctions.push(node.declaration);
                    } else if (node.declaration.type === 'ClassDeclaration') {
                        exportedClasses.push(node.declaration);
                    } else if (node.declaration.type === 'VariableDeclaration') {
                        exportedConstants.push(node.declaration);
                    }
                }

                if (node.specifiers) {
                    node.specifiers.forEach(spec => {
                        if (spec.type === 'ExportSpecifier') {
                            namedExports.push(spec);
                        }
                    });
                }
            },

            // Check at the end of the program
            'Program:exit'() {
                if (!hasDefaultExport) {
                    return; // No default export, rule doesn't apply
                }

                // Count total exports
                const totalNamedExports = namedExports.length;
                const totalFunctions = exportedFunctions.length;
                const totalClasses = exportedClasses.length;
                const totalConstants = exportedConstants.length;

                // Multi-responsibility indicators:
                // 1. Multiple named exports alongside default export
                // 2. Multiple functions being exported
                // 3. Multiple classes being exported
                // 4. Mix of functions, classes, and constants

                const isMultiResponsibility = 
                    totalNamedExports > 0 || // Has both default and named exports
                    totalFunctions > 1 ||    // Multiple functions
                    totalClasses > 1 ||      // Multiple classes
                    (totalFunctions > 0 && totalClasses > 0) || // Mix of functions and classes
                    (totalConstants > 2);    // Too many constants

                if (isMultiResponsibility) {
                    // Find the default export node to report
                    const sourceCode = context.getSourceCode();
                    const defaultExportNode = sourceCode.ast.body.find(
                        node => node.type === 'ExportDefaultDeclaration'
                    );

                    if (defaultExportNode) {
                        let message = 'T020: Avoid export default for multi-responsibility modules. ';
                        
                        if (totalNamedExports > 0) {
                            message += `Found ${totalNamedExports} named exports alongside default export. `;
                        }
                        if (totalFunctions > 1) {
                            message += `Found ${totalFunctions} exported functions. `;
                        }
                        if (totalClasses > 1) {
                            message += `Found ${totalClasses} exported classes. `;
                        }
                        
                        message += 'Consider using only named exports for better tree-shaking and clarity.';

                        context.report({
                            node: defaultExportNode,
                            message
                        });
                    }
                }
            }
        };
    }
};
