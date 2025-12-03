/**
 * @fileoverview Rule T019: Do not assign to this arbitrarily
 * @description Maintain proper context and avoid this manipulation
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Do not assign to this arbitrarily',
            category: 'Best Practices',
            recommended: true
        },
        fixable: null,
        schema: []
    },
    
    create(context) {
        return {
            // Detect direct assignment to 'this'
            AssignmentExpression(node) {
                if (node.left.type === 'ThisExpression') {
                    context.report({
                        node,
                        message: 'T019: Do not assign to "this" directly. Use proper binding, arrow functions, or explicit parameter passing.'
                    });
                }
            },

            // Detect patterns like "const that = this" or "var self = this"
            VariableDeclarator(node) {
                if (node.init && node.init.type === 'ThisExpression') {
                    // Common patterns: that, self, _this, me
                    const variableName = node.id.name;
                    const suspiciousNames = ['that', 'self', '_this', 'me', '_self'];
                    
                    if (suspiciousNames.includes(variableName.toLowerCase())) {
                        context.report({
                            node,
                            message: `T019: Avoid storing "this" in variable "${variableName}". Use arrow functions or proper binding instead.`
                        });
                    }
                }
            },

            // Detect method calls that bind this arbitrarily
            CallExpression(node) {
                // Detect .bind(this) patterns that might be problematic
                if (node.callee.type === 'MemberExpression' && 
                    node.callee.property.name === 'bind' &&
                    node.arguments.length > 0) {
                    
                    const bindTarget = node.arguments[0];
                    if (bindTarget.type === 'ThisExpression') {
                        // Allow legitimate .bind(this) in constructors and specific patterns
                        const sourceCode = context.sourceCode || context.getSourceCode();
                        let currentScope = sourceCode.getScope ? sourceCode.getScope(node) : null;
                        
                        if (!currentScope && context.getScope) {
                            currentScope = context.getScope();
                        }
                        
                        const parent = currentScope ? currentScope.block : null;
                        const isInConstructor = parent && 
                                              parent.type === 'FunctionExpression' && 
                                              parent.parent && 
                                              parent.parent.key && 
                                              parent.parent.key.name === 'constructor';
                        
                        if (!isInConstructor) {
                            context.report({
                                node,
                                message: 'T019: Consider using arrow functions instead of .bind(this) for cleaner context handling.'
                            });
                        }
                    }
                }
            }
        };
    }
};
