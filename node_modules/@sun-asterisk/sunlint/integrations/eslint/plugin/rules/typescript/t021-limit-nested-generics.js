/**
 * @fileoverview Rule T021: Limit deeply nested generics
 * @description Improve code readability and TypeScript performance
 */

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Limit deeply nested generics',
            category: 'Best Practices',
            recommended: true
        },
        fixable: null,
        schema: [
            {
                type: 'object',
                properties: {
                    maxDepth: {
                        type: 'integer',
                        minimum: 1,
                        default: 3
                    }
                },
                additionalProperties: false
            }
        ]
    },
    
    create(context) {
        const options = context.options[0] || {};
        const maxDepth = options.maxDepth || 3;

        function getGenericDepth(typeNode) {
            if (!typeNode) return 0;

            switch (typeNode.type) {
                case 'TSTypeReference':
                    // Generic types like Array<T>, Promise<U>, etc.
                    // ESLint uses 'typeArguments' instead of 'typeParameters'
                    if (typeNode.typeArguments && typeNode.typeArguments.params) {
                        let maxChildDepth = 0;
                        for (const param of typeNode.typeArguments.params) {
                            const childDepth = getGenericDepth(param);
                            maxChildDepth = Math.max(maxChildDepth, childDepth);
                        }
                        return 1 + maxChildDepth;
                    }
                    return 0;

                case 'TSArrayType':
                    // Array types like T[]
                    return 1 + getGenericDepth(typeNode.elementType);

                case 'TSUnionType':
                case 'TSIntersectionType':
                    // Union types like A | B or intersection types A & B
                    let maxDepth = 0;
                    for (const typeItem of typeNode.types) {
                        maxDepth = Math.max(maxDepth, getGenericDepth(typeItem));
                    }
                    return maxDepth;

                case 'TSTupleType':
                    // Tuple types like [A, B, C]
                    let maxTupleDepth = 0;
                    for (const elementType of typeNode.elementTypes) {
                        maxTupleDepth = Math.max(maxTupleDepth, getGenericDepth(elementType));
                    }
                    return 1 + maxTupleDepth;

                case 'TSMappedType':
                    // Mapped types like { [K in keyof T]: U }
                    return 1 + getGenericDepth(typeNode.typeAnnotation);

                case 'TSConditionalType':
                    // Conditional types like T extends U ? A : B
                    return 1 + Math.max(
                        getGenericDepth(typeNode.trueType),
                        getGenericDepth(typeNode.falseType)
                    );

                default:
                    return 0;
            }
        }

        function checkTypeDepth(node, typeName) {
            const depth = getGenericDepth(node);
            if (depth > maxDepth) {
                context.report({
                    node,
                    message: `T021: Generic nesting depth of ${depth} exceeds maximum of ${maxDepth}. Consider breaking down complex types into intermediate type aliases for better readability and TypeScript compiler performance.`
                });
            }
        }

        return {
            // Check type aliases - this is the main entry point
            TSTypeAliasDeclaration(node) {
                checkTypeDepth(node.typeAnnotation, node.id.name);
            },

            // Check interface properties
            TSPropertySignature(node) {
                if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
                    checkTypeDepth(node.typeAnnotation.typeAnnotation, 'property');
                }
            },

            // Check function parameters
            TSParameterProperty(node) {
                if (node.parameter && node.parameter.typeAnnotation) {
                    checkTypeDepth(node.parameter.typeAnnotation.typeAnnotation, 'parameter');
                }
            },

            // Check function return types
            TSFunctionType(node) {
                if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
                    checkTypeDepth(node.typeAnnotation.typeAnnotation, 'return type');
                }
            },

            // Check variable declarations
            VariableDeclarator(node) {
                if (node.id && node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
                    checkTypeDepth(node.id.typeAnnotation.typeAnnotation, 'variable');
                }
            },

            // Check generic constraints
            TSTypeParameter(node) {
                if (node.constraint) {
                    checkTypeDepth(node.constraint, 'generic constraint');
                }
                if (node.default) {
                    checkTypeDepth(node.default, 'generic default');
                }
            },

            // Check method signatures
            TSMethodSignature(node) {
                if (node.typeAnnotation && node.typeAnnotation.typeAnnotation) {
                    checkTypeDepth(node.typeAnnotation.typeAnnotation, 'method return type');
                }
            }
        };
    }
};
