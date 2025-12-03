/**
 * Custom ESLint rule for: S025 – Server-side input validation required
 * Rule ID: custom/s025
 * Purpose: Verify that input validation is enforced on a trusted service layer
 * Target: NestJS applications - ensure all client input is validated server-side before processing
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure all client input is validated on server-side before processing in NestJS applications",
      recommended: true,
    },
    schema: [],
    messages: {
      missingValidationDecorator:
        "Controller method parameter '{{param}}' should use validation decorators (@Body, @Query, @Param with DTO class).",
      missingValidationPipe:
        "Controller method '{{method}}' should use ValidationPipe to validate input data.",
      missingDtoValidation:
        "DTO class '{{dto}}' should have validation decorators (@IsString, @IsNumber, etc.) for its properties.",
      directInputAccess:
        "Direct access to request object '{{access}}' without validation. Use validated DTOs instead.",
    },
  },

  create(context) {
    const validatedParams = new Set();
    const controllerMethods = new Set();
    const dtoClasses = new Map();
    const validationDecorators = new Set([
      'IsString', 'IsNumber', 'IsBoolean', 'IsArray', 'IsObject', 'IsEmail',
      'IsUrl', 'IsUUID', 'IsOptional', 'IsNotEmpty', 'Length', 'Min', 'Max',
      'IsPositive', 'IsNegative', 'IsDate', 'IsEnum', 'ValidateNested',
      'IsInt', 'IsDecimal', 'IsJSON', 'Matches', 'Contains', 'IsAlpha',
      'IsAlphanumeric', 'IsPhoneNumber', 'IsISO8601', 'IsBase64'
    ]);

    function hasValidationDecorator(decorators) {
      if (!decorators) return false;
      return decorators.some(decorator => {
        if (decorator.expression && decorator.expression.callee) {
          const name = decorator.expression.callee.name;
          return validationDecorators.has(name);
        }
        return false;
      });
    }

    function isNestJSController(node) {
      if (!node.decorators) return false;
      return node.decorators.some(decorator => {
        if (decorator.expression && decorator.expression.callee) {
          return decorator.expression.callee.name === 'Controller';
        }
        return false;
      });
    }

    function isControllerMethod(node) {
      if (!node.decorators) return false;
      const httpDecorators = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Head', 'Options'];
      return node.decorators.some(decorator => {
        if (decorator.expression && decorator.expression.callee) {
          return httpDecorators.includes(decorator.expression.callee.name);
        }
        return false;
      });
    }

    function hasNestJSValidationDecorator(param) {
      if (!param.decorators) return false;
      const nestValidationDecorators = ['Body', 'Query', 'Param', 'Headers'];
      return param.decorators.some(decorator => {
        if (decorator.expression && decorator.expression.callee) {
          return nestValidationDecorators.includes(decorator.expression.callee.name);
        }
        return false;
      });
    }

    function hasValidationPipe(node) {
      if (!node.decorators) return false;
      return node.decorators.some(decorator => {
        if (decorator.expression && decorator.expression.callee) {
          if (decorator.expression.callee.name === 'UsePipes') {
            return decorator.expression.arguments.some(arg => {
              return arg.type === 'NewExpression' && 
                     arg.callee && 
                     arg.callee.name === 'ValidationPipe';
            });
          }
        }
        return false;
      });
    }

    return {
      // Check DTO classes for validation decorators
      ClassDeclaration(node) {
        if (node.id && node.id.name.endsWith('Dto')) {
          const className = node.id.name;
          const properties = [];
          
          node.body.body.forEach(member => {
            if (member.type === 'PropertyDefinition' && member.key) {
              const hasValidation = hasValidationDecorator(member.decorators);
              properties.push({
                name: member.key.name,
                hasValidation
              });
            }
          });
          
          dtoClasses.set(className, properties);
          
          // Check if DTO has at least one validation decorator
          const hasAnyValidation = properties.some(prop => prop.hasValidation);
          if (properties.length > 0 && !hasAnyValidation) {
            context.report({
              node,
              messageId: "missingDtoValidation",
              data: {
                dto: className,
              },
            });
          }
        }
      },

      // Check controller methods
      MethodDefinition(node) {
        const parentClass = node.parent.parent;
        if (isNestJSController(parentClass) && isControllerMethod(node)) {
          const methodName = node.key.name;
          controllerMethods.add(methodName);

          // Check if method has ValidationPipe
          const hasValidationPipeDecorator = hasValidationPipe(node);
          
          // Check parameters for validation decorators
          if (node.value.params) {
            node.value.params.forEach(param => {
              if (param.type === 'Identifier') {
                const hasNestValidation = hasNestJSValidationDecorator(param);
                
                if (hasNestValidation) {
                  validatedParams.add(param.name);
                } else {
                  // If no ValidationPipe and no parameter validation decorator
                  if (!hasValidationPipeDecorator) {
                    context.report({
                      node: param,
                      messageId: "missingValidationDecorator",
                      data: {
                        param: param.name,
                      },
                    });
                  }
                }
              }
            });
          }

          // Check if method uses ValidationPipe when dealing with request bodies
          const hasBodyParam = node.value.params.some(param => 
            param.decorators && param.decorators.some(decorator => 
              decorator.expression && 
              decorator.expression.callee && 
              decorator.expression.callee.name === 'Body'
            )
          );

          if (hasBodyParam && !hasValidationPipeDecorator) {
            context.report({
              node,
              messageId: "missingValidationPipe",
              data: {
                method: methodName,
              },
            });
          }
        }
      },

      // Check for direct access to request object without validation
      MemberExpression(node) {
        if (node.object && node.property) {
          const objectName = node.object.name;
          const propertyName = node.property.name;
          
          // Check for direct access to req.body, req.query, req.params without validation
          if (objectName === 'req' || objectName === 'request') {
            if (['body', 'query', 'params', 'headers'].includes(propertyName)) {
              const accessPath = `${objectName}.${propertyName}`;
              
              // Check if this access is in a validated context
              if (!validatedParams.has(objectName)) {
                context.report({
                  node,
                  messageId: "directInputAccess",
                  data: {
                    access: accessPath,
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};
