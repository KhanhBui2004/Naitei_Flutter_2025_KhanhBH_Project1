"use strict";

/**
 * S001 – Verify that if there is an error in access control, the system fails securely
 * OWASP ASVS 4.14
 * Verify that the principle of least privilege exists - users should only be able to access functions, data files, URLs, controllers, services, and other resources, for which they possess specific authorization. This implies protection against spoofing and elevation of privilege.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Verify that if there is an error in access control, the system fails securely (Fail Securely)',
            category: 'Security',
            recommended: true,
            url: 'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control'
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    checkMethods: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        default: ['authenticate', 'authorize', 'checkPermission', 'validateAccess']
                    },
                    allowedFailureMethods: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        default: ['deny', 'reject', 'forbid', 'unauthorized', 'forbidden']
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            failInsecurely: 'Access control does not fail securely. On error, the system should deny access instead of allowing.',
            missingErrorHandling: 'Missing error handling in access control. There must be a try-catch block or error handling.',
            defaultAllowAccess: 'Should not allow access by default. The system should deny access when unsure.',
            catchAllowsAccess: 'Catch block should not allow access. Deny access on error.',
            missingFallback: 'Missing fallback case. There should be a default case to deny access.',
            unsafeDefaultReturn: 'Default return statement is not secure. Should return false or deny access.'
        }
    },

    create(context) {
        const options = context.options[0] || {};
        const checkMethods = options.checkMethods || ['authenticate', 'authorize', 'checkPermission', 'validateAccess'];
        const allowedFailureMethods = options.allowedFailureMethods || ['deny', 'reject', 'forbid', 'unauthorized', 'forbidden'];

        // Keywords related to access control
        const accessControlKeywords = [
            'authenticate', 'authorize', 'permission', 'access', 'role', 'auth',
            'login', 'verify', 'check', 'validate', 'guard', 'middleware',
            'canAccess', 'isAuthorized', 'hasPermission', 'checkAccess'
        ];

        // Keywords for allowing access
        const allowKeywords = [
            'allow', 'permit', 'grant', 'enable', 'accept', 'approve', 
            'authorized', 'authenticated', 'allowed', 'granted', 'success'
        ];

        // Keywords for denying access
        const denyKeywords = [
            'deny', 'reject', 'forbid', 'block', 'refuse', 'unauthorized', 
            'forbidden', 'denied', 'blocked', 'refused', 'error', 'failed'
        ];

        function isAccessControlFunction(node) {
            const functionName = getFunctionName(node);
            if (!functionName) return false;

            return accessControlKeywords.some(keyword => 
                functionName.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        function getFunctionName(node) {
            if (!node || !node.type) {
                return null;
            }
            
            if (node.type === 'FunctionDeclaration' && node.id) {
                return node.id.name;
            }
            if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
                const parent = node.parent;
                if (!parent || !parent.type) {
                    return null;
                }
                if (parent.type === 'VariableDeclarator' && parent.id) {
                    return parent.id.name;
                }
                if (parent.type === 'Property' && parent.key) {
                    return parent.key.name;
                }
                if (parent.type === 'MethodDefinition' && parent.key) {
                    return parent.key.name;
                }
            }
            return null;
        }

        function containsKeywords(text, keywords) {
            return keywords.some(keyword => 
                text.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        function getReturnValue(node) {
            if (!node || !node.type) {
                return null;
            }
            
            switch (node.type) {
                case 'Literal':
                    return String(node.value);
                case 'Identifier':
                    return node.name;
                case 'MemberExpression':
                    return getFullMemberExpression(node);
                case 'ObjectExpression':
                    return getObjectExpressionValue(node);
                case 'ConditionalExpression':
                    return 'conditional';
                default:
                    return null;
            }
        }

        function getFullMemberExpression(node) {
            const object = node.object.type === 'Identifier' ? node.object.name : 'unknown';
            const property = node.property.type === 'Identifier' ? node.property.name : 'unknown';
            return `${object}.${property}`;
        }

        function getObjectExpressionValue(node) {
            const properties = node.properties.map(prop => {
                if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                    return prop.key.name;
                }
                return '';
            }).filter(Boolean);
            return properties.join('.');
        }

        function isInAccessControlFunction(node) {
            let parent = node.parent;
            while (parent) {
                if (isAccessControlFunction(parent)) {
                    return true;
                }
                parent = parent.parent;
            }
            return false;
        }

        function isUnsafeReturn(returnValue) {
            if (!returnValue) return false;
            
            return returnValue === 'true' || 
                         returnValue === 'success' ||
                         containsKeywords(returnValue, allowKeywords);
        }

        function isSafeReturn(returnValue) {
            if (!returnValue) return false;
            
            return returnValue === 'false' || 
                         returnValue === 'error' ||
                         containsKeywords(returnValue, denyKeywords);
        }

        function checkTryStatement(node) {
            if (!isAccessControlFunction(getParentFunction(node))) return;

            const catchClause = node.handler;
            if (!catchClause) {
                context.report({
                    node,
                    messageId: 'missingErrorHandling'
                });
                return;
            }

            // Check catch block
            const catchBody = catchClause.body;
            if (catchBody.type === 'BlockStatement') {
                const hasUnsafeReturn = catchBody.body.some(stmt => {
                    if (stmt.type === 'ReturnStatement' && stmt.argument) {
                        const returnValue = getReturnValue(stmt.argument);
                        return isUnsafeReturn(returnValue);
                    }
                    return false;
                });

                if (hasUnsafeReturn) {
                    context.report({
                        node: catchClause,
                        messageId: 'catchAllowsAccess'
                    });
                }

                // Check for safe handling (throw or safe return)
                const hasSafeHandling = catchBody.body.some(stmt => {
                    if (stmt.type === 'ThrowStatement') return true;
                    if (stmt.type === 'ReturnStatement' && stmt.argument) {
                        const returnValue = getReturnValue(stmt.argument);
                        return isSafeReturn(returnValue);
                    }
                    return false;
                });

                if (!hasSafeHandling) {
                    context.report({
                        node: catchClause,
                        messageId: 'catchAllowsAccess'
                    });
                }
            }
        }

        function getParentFunction(node) {
            let parent = node.parent;
            while (parent) {
                if (parent.type === 'FunctionDeclaration' || 
                        parent.type === 'FunctionExpression' || 
                        parent.type === 'ArrowFunctionExpression') {
                    return parent;
                }
                parent = parent.parent;
            }
            return null;
        }

        function checkReturnStatement(node) {
            if (!node.argument || !isInAccessControlFunction(node)) return;

            const returnValue = getReturnValue(node.argument);
            if (isUnsafeReturn(returnValue)) {
                // Check if inside try block
                const tryBlock = findParentTryBlock(node);
                if (!tryBlock) {
                    // Check for guard condition
                    if (!hasProperGuardCondition(node)) {
                        context.report({
                            node,
                            messageId: 'unsafeDefaultReturn'
                        });
                    }
                }
            }
        }

        function findParentTryBlock(node) {
            let parent = node.parent;
            while (parent) {
                if (parent.type === 'TryStatement') {
                    return parent;
                }
                parent = parent.parent;
            }
            return null;
        }

        function hasProperGuardCondition(node) {
            // Look for if/else conditions before the return statement
            let parent = node.parent;
            while (parent && parent.type === 'BlockStatement') {
                const block = parent;
                const returnIndex = block.body.indexOf(node);
                
                if (returnIndex > 0) {
                    // Check statements before return
                    for (let i = returnIndex - 1; i >= 0; i--) {
                        const stmt = block.body[i];
                        if (stmt.type === 'IfStatement') {
                            const stmtText = context.getSourceCode().getText(stmt);
                            if (containsKeywords(stmtText, ['check', 'verify', 'validate', 'auth', 'permission'])) {
                                return true;
                            }
                        }
                    }
                }
                
                // Check parent if statement
                if (parent.parent && parent.parent.type === 'IfStatement') {
                    const ifStmt = parent.parent;
                    const ifText = context.getSourceCode().getText(ifStmt.test);
                    if (containsKeywords(ifText, ['check', 'verify', 'validate', 'auth', 'permission'])) {
                        return true;
                    }
                }
                
                parent = parent.parent;
            }
            return false;
        }

        function checkFunction(node) {
            if (!isAccessControlFunction(node)) return;

            // Check if function has try-catch
            const functionBody = node.body;
            if (functionBody && functionBody.type === 'BlockStatement') {
                const hasTryCatch = functionBody.body.some(stmt => stmt.type === 'TryStatement');
                
                if (!hasTryCatch) {
                    // Check for throw or error handling
                    const hasErrorHandling = functionBody.body.some(stmt => {
                        if (stmt.type === 'ThrowStatement') return true;
                        if (stmt.type === 'IfStatement') {
                            const stmtText = context.getSourceCode().getText(stmt);
                            return containsKeywords(stmtText, ['error', 'throw', 'reject']);
                        }
                        return false;
                    });

                    if (!hasErrorHandling) {
                        context.report({
                            node,
                            messageId: 'missingErrorHandling'
                        });
                    }
                }

                // Check last return statement
                const lastStatement = functionBody.body[functionBody.body.length - 1];
                if (lastStatement && lastStatement.type === 'ReturnStatement' && lastStatement.argument) {
                    const returnValue = getReturnValue(lastStatement.argument);
                    if (isUnsafeReturn(returnValue)) {
                        context.report({
                            node: lastStatement,
                            messageId: 'defaultAllowAccess'
                        });
                    }
                }
            }
        }

        function checkIfStatement(node) {
            if (!isInAccessControlFunction(node)) return;

            // Check if there is no else clause
            if (!node.alternate) {
                const consequent = node.consequent;
                if (consequent.type === 'BlockStatement') {
                    const hasUnsafeReturn = consequent.body.some(stmt => {
                        if (stmt.type === 'ReturnStatement' && stmt.argument) {
                            const returnValue = getReturnValue(stmt.argument);
                            return isUnsafeReturn(returnValue);
                        }
                        return false;
                    });

                    if (hasUnsafeReturn) {
                        context.report({
                            node,
                            messageId: 'missingFallback'
                        });
                    }
                }
            }
        }

        return {
            'FunctionDeclaration': checkFunction,
            'FunctionExpression': checkFunction,
            'ArrowFunctionExpression': checkFunction,
            'TryStatement': checkTryStatement,
            'ReturnStatement': checkReturnStatement,
            'IfStatement': checkIfStatement
        };
    }
};
