/**
 * ESLint rule: S002 – IDOR Check
 * Rule ID: custom/s002
 * Description: Verify IDOR (Insecure Direct Object Reference) security in REST APIs.
 */

"use strict";

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify IDOR (Insecure Direct Object Reference) security in REST APIs',
      recommended: true,
      url: 'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control'
    },
    schema: [],
    messages: {
      restEndpointMissingAuth: 'IDOR Risk: REST endpoint with ID parameter lacks authorization check. Add proper authentication middleware or manual ownership validation.',
      repositoryMissingConstraint: 'IDOR Risk: Database query should include user/owner constraint (e.g., WHERE user_id = $userId) to prevent unauthorized data access.',
      directEntityReturn: 'IDOR Risk: Avoid returning Entity/Model directly from REST endpoints. Use DTO/ResponseModel to control data exposure.',
      sequentialIdUsage: 'IDOR Risk: Consider using UUID instead of sequential ID (number) to make resource identifiers unpredictable.',
      directRepositoryAccess: 'IDOR Risk: Direct repository/database access with ID from URL without authorization check. Verify user ownership before accessing resources.',
    },
  },

  create(context) {
    return {
      // Check REST endpoints (Express.js, NestJS, etc.)
      CallExpression(node) {
        checkRestEndpointAuthorization(node, context);
        checkDirectRepositoryAccess(node, context);
      },

      // Check method definitions
      MethodDefinition(node) {
        checkRepositorySecurityConstraint(node, context);
        checkDirectEntityReturn(node, context);
      },

      // Check function declarations
      FunctionDeclaration(node) {
        checkRepositorySecurityConstraint(node, context);
        checkDirectEntityReturn(node, context);
      },

      // Check variable declarations for ID fields
      VariableDeclarator(node) {
        checkSequentialIdUsage(node, context);
      },

      // Check property definitions (for class properties)
      PropertyDefinition(node) {
        checkSequentialIdUsage(node, context);
      },

      // Check arrow function expressions
      ArrowFunctionExpression(node) {
        checkRepositorySecurityConstraint(node, context);
        checkDirectEntityReturn(node, context);
      },

      // Check function expressions
      FunctionExpression(node) {
        checkRepositorySecurityConstraint(node, context);
        checkDirectEntityReturn(node, context);
      },
    };

    // =================== CHECK METHODS ===================

    /**
     * Check if the endpoint has security middleware
     */
    function hasSecurityMiddleware(node) {
      if (node.type !== 'CallExpression') return false;

      // Check for middleware functions like auth, authenticate, authorize
      return node.arguments.some(arg => {
        if (arg.type === 'Identifier') {
          const argName = arg.name.toLowerCase();
          return argName.includes('auth') || 
                 argName.includes('guard') || 
                 argName.includes('protect') ||
                 argName.includes('secure') ||
                 argName.includes('jwt') ||
                 argName.includes('token');
        }
        return false;
      });
    }

    /**
     * Check if the function has manual security check
     */
    function hasManualSecurityCheck(node) {
      let bodyNode;

      if (node.type === 'CallExpression') {
        // Check callback function in Express.js
        const callback = node.arguments.find(arg => 
          arg.type === 'FunctionExpression' || 
          arg.type === 'ArrowFunctionExpression'
        );
        if (callback && callback.body) {
          bodyNode = callback.body;
        }
      } else if (node.body) {
        bodyNode = node.body;
      }

      if (!bodyNode) return false;

      // If arrow function with expression body
      if (bodyNode.type !== 'BlockStatement') {
        const bodyText = context.getSourceCode().getText(bodyNode).toLowerCase();
        return containsSecurityCheck(bodyText);
      }

      // Check block statement
      return bodyNode.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return containsSecurityCheck(statementText);
      });
    }

    /**
     * Check REST endpoint with ID parameter but missing authorization
     */
    function checkRestEndpointAuthorization(node, context) {
      if (!isRestEndpoint(node)) return;

      const hasIdParameter = hasPathParameterId(node);
      const hasSecurityMiddlewareResult = hasSecurityMiddleware(node);
      const hasManualSecurityCheckResult = hasManualSecurityCheck(node);

      if (hasIdParameter && !hasSecurityMiddlewareResult && !hasManualSecurityCheckResult) {
        context.report({
          node,
          messageId: 'restEndpointMissingAuth',
        });
      }
    }

    /**
     * Check if the method has custom query
     */
    function hasCustomQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('query') ||
               statementText.includes('sql') ||
               statementText.includes('select') ||
               statementText.includes('from') ||
               statementText.includes('where') ||
               statementText.includes('findby') ||
               statementText.includes('createquerybuilder') ||
               statementText.includes('rawquery');
      });
    }

    /**
     * Check if query contains user constraint
     */
    function hasUserConstraintInQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('user_id') ||
               statementText.includes('owner_id') ||
               statementText.includes('created_by') ||
               statementText.includes('userid') ||
               statementText.includes('ownerid') ||
               statementText.includes('createdby') ||
               (statementText.includes('where') && 
                (statementText.includes('user') || statementText.includes('owner')));
      });
    }

    /**
     * Check Repository query missing user/owner constraint
     */
    function checkRepositorySecurityConstraint(node, context) {
      if (!isRepositoryMethod(node)) return;

      const hasCustomQueryResult = hasCustomQuery(node);
      const hasUserConstraint = hasUserConstraintInQuery(node);

      if (hasCustomQueryResult && !hasUserConstraint) {
        context.report({
          node,
          messageId: 'repositoryMissingConstraint',
        });
      }
    }

    /**
     * Check if method returns Entity directly instead of DTO
     */
    function checkDirectEntityReturn(node, context) {
      if (!isRestEndpoint(node)) return;

      const returnsEntity = returnsEntityDirectly(node);

      if (returnsEntity) {
        context.report({
          node,
          messageId: 'directEntityReturn',
        });
      }
    }

    /**
     * Check if ID field uses sequential number
     */
    function checkSequentialIdUsage(node, context) {
      const isEntityId = isEntityIdField(node);
      const isSequentialType = isSequentialIdType(node);

      if (isEntityId && isSequentialType) {
        context.report({
          node,
          messageId: 'sequentialIdUsage',
        });
      }
    }

    /**
     * Check direct repository access without authorization check
     */
    function checkDirectRepositoryAccess(node, context) {
      if (!isRepositoryFindMethod(node)) return;

      const enclosingFunction = getEnclosingFunction(node);
      if (!enclosingFunction) return;

      const isInRestControllerResult = isInRestController(enclosingFunction);
      const hasIdParameter = hasPathParameterId(enclosingFunction);
      const hasAuthCheck = hasAuthorizationLogicNearby(node, enclosingFunction);

      if (isInRestControllerResult && hasIdParameter && !hasAuthCheck) {
        context.report({
          node,
          messageId: 'directRepositoryAccess',
        });
      }
    }

    // =================== HELPER METHODS ===================

    /**
     * Check if the call expression is a REST endpoint
     */
    function isRestEndpoint(node) {
      // Express.js style: app.get(), router.post(), etc.
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        if (callee.type === 'MemberExpression') {
          const property = callee.property;
          if (property.type === 'Identifier') {
            const methodName = property.name;
            return ['get', 'post', 'put', 'delete', 'patch', 'use', 'all'].includes(methodName);
          }
        }
      }

      // NestJS style: @Get(), @Post(), etc.
      if (node.decorators) {
        return node.decorators.some(decorator => {
          if (decorator.expression.type === 'Identifier') {
            const decoratorName = decorator.expression.name;
            return ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(decoratorName);
          }
          if (decorator.expression.type === 'CallExpression' && 
              decorator.expression.callee.type === 'Identifier') {
            const decoratorName = decorator.expression.callee.name;
            return ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(decoratorName);
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the endpoint has a path parameter ID
     */
    function hasPathParameterId(node) {
      // Express.js style: app.get('/users/:id', ...)
      if (node.type === 'CallExpression') {
        const firstArg = node.arguments[0];
        if (firstArg?.type === 'Literal' && typeof firstArg.value === 'string') {
          return firstArg.value.includes(':id') || 
                 firstArg.value.includes(':uuid') ||
                 firstArg.value.match(/:[\w]*id/i);
        }
      }

      // NestJS style: @Get(':id')
      if (node.decorators) {
        return node.decorators.some(decorator => {
          if (decorator.expression.type === 'CallExpression') {
            const firstArg = decorator.expression.arguments[0];
            if (firstArg?.type === 'Literal' && typeof firstArg.value === 'string') {
              return firstArg.value.includes(':id') || 
                     firstArg.value.includes(':uuid') ||
                     firstArg.value.match(/:[\w]*id/i);
            }
          }
          return false;
        });
      }

      // Check function parameters
      if (node.params) {
        return node.params.some(param => {
          if (param.type === 'Identifier') {
            const paramName = param.name.toLowerCase();
            return paramName.includes('id') || paramName === 'uuid';
          }
          // Destructured parameter: { id }
          if (param.type === 'ObjectPattern') {
            return param.properties.some(prop => {
              if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                const propName = prop.key.name.toLowerCase();
                return propName.includes('id') || propName === 'uuid';
              }
              return false;
            });
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the endpoint has security middleware
     */
    function hasSecurityMiddleware(node) {
      if (node.type !== 'CallExpression') return false;

      // Check for middleware functions like auth, authenticate, authorize
      return node.arguments.some(arg => {
        if (arg.type === 'Identifier') {
          const argName = arg.name.toLowerCase();
          return argName.includes('auth') || 
                 argName.includes('guard') || 
                 argName.includes('protect') ||
                 argName.includes('secure') ||
                 argName.includes('jwt') ||
                 argName.includes('token');
        }
        return false;
      });
    }

    /**
     * Check if the method has custom query
     */
    function hasCustomQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('query') ||
               statementText.includes('sql') ||
               statementText.includes('select') ||
               statementText.includes('from') ||
               statementText.includes('where') ||
               statementText.includes('findby') ||
               statementText.includes('createquerybuilder') ||
               statementText.includes('rawquery');
      });
    }

    /**
     * Check if query contains user constraint
     */
    function hasUserConstraintInQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('user_id') ||
               statementText.includes('owner_id') ||
               statementText.includes('created_by') ||
               statementText.includes('userid') ||
               statementText.includes('ownerid') ||
               statementText.includes('createdby') ||
               (statementText.includes('where') && 
                (statementText.includes('user') || statementText.includes('owner')));
      });
    }

    /**
     * Check Repository query missing user/owner constraint
     */
    function checkRepositorySecurityConstraint(node, context) {
      if (!isRepositoryMethod(node)) return;

      const hasCustomQueryResult = hasCustomQuery(node);
      const hasUserConstraint = hasUserConstraintInQuery(node);

      if (hasCustomQueryResult && !hasUserConstraint) {
        context.report({
          node,
          messageId: 'repositoryMissingConstraint',
        });
      }
    }

    /**
     * Check if method returns Entity directly instead of DTO
     */
    function checkDirectEntityReturn(node, context) {
      if (!isRestEndpoint(node)) return;

      const returnsEntity = returnsEntityDirectly(node);

      if (returnsEntity) {
        context.report({
          node,
          messageId: 'directEntityReturn',
        });
      }
    }

    /**
     * Check if ID field uses sequential number
     */
    function checkSequentialIdUsage(node, context) {
      const isEntityId = isEntityIdField(node);
      const isSequentialType = isSequentialIdType(node);

      if (isEntityId && isSequentialType) {
        context.report({
          node,
          messageId: 'sequentialIdUsage',
        });
      }
    }

    /**
     * Check direct repository access without authorization check
     */
    function checkDirectRepositoryAccess(node, context) {
      if (!isRepositoryFindMethod(node)) return;

      const enclosingFunction = getEnclosingFunction(node);
      if (!enclosingFunction) return;

      const isInRestControllerResult = isInRestController(enclosingFunction);
      const hasIdParameter = hasPathParameterId(enclosingFunction);
      const hasAuthCheck = hasAuthorizationLogicNearby(node, enclosingFunction);

      if (isInRestControllerResult && hasIdParameter && !hasAuthCheck) {
        context.report({
          node,
          messageId: 'directRepositoryAccess',
        });
      }
    }

    // =================== HELPER METHODS ===================

    /**
     * Check if the call expression is a REST endpoint
     */
    function isRestEndpoint(node) {
      // Express.js style: app.get(), router.post(), etc.
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        if (callee.type === 'MemberExpression') {
          const property = callee.property;
          if (property.type === 'Identifier') {
            const methodName = property.name;
            return ['get', 'post', 'put', 'delete', 'patch', 'use', 'all'].includes(methodName);
          }
        }
      }

      // NestJS style: @Get(), @Post(), etc.
      if (node.decorators) {
        return node.decorators.some(decorator => {
          if (decorator.expression.type === 'Identifier') {
            const decoratorName = decorator.expression.name;
            return ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(decoratorName);
          }
          if (decorator.expression.type === 'CallExpression' && 
              decorator.expression.callee.type === 'Identifier') {
            const decoratorName = decorator.expression.callee.name;
            return ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(decoratorName);
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the endpoint has a path parameter ID
     */
    function hasPathParameterId(node) {
      // Express.js style: app.get('/users/:id', ...)
      if (node.type === 'CallExpression') {
        const firstArg = node.arguments[0];
        if (firstArg?.type === 'Literal' && typeof firstArg.value === 'string') {
          return firstArg.value.includes(':id') || 
                 firstArg.value.includes(':uuid') ||
                 firstArg.value.match(/:[\w]*id/i);
        }
      }

      // NestJS style: @Get(':id')
      if (node.decorators) {
        return node.decorators.some(decorator => {
          if (decorator.expression.type === 'CallExpression') {
            const firstArg = decorator.expression.arguments[0];
            if (firstArg?.type === 'Literal' && typeof firstArg.value === 'string') {
              return firstArg.value.includes(':id') || 
                     firstArg.value.includes(':uuid') ||
                     firstArg.value.match(/:[\w]*id/i);
            }
          }
          return false;
        });
      }

      // Check function parameters
      if (node.params) {
        return node.params.some(param => {
          if (param.type === 'Identifier') {
            const paramName = param.name.toLowerCase();
            return paramName.includes('id') || paramName === 'uuid';
          }
          // Destructured parameter: { id }
          if (param.type === 'ObjectPattern') {
            return param.properties.some(prop => {
              if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                const propName = prop.key.name.toLowerCase();
                return propName.includes('id') || propName === 'uuid';
              }
              return false;
            });
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the endpoint has security middleware
     */
    function hasSecurityMiddleware(node) {
      if (node.type !== 'CallExpression') return false;

      // Check for middleware functions like auth, authenticate, authorize
      return node.arguments.some(arg => {
        if (arg.type === 'Identifier') {
          const argName = arg.name.toLowerCase();
          return argName.includes('auth') || 
                 argName.includes('guard') || 
                 argName.includes('protect') ||
                 argName.includes('secure') ||
                 argName.includes('jwt') ||
                 argName.includes('token');
        }
        return false;
      });
    }

    /**
     * Check if the method has custom query
     */
    function hasCustomQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('query') ||
               statementText.includes('sql') ||
               statementText.includes('select') ||
               statementText.includes('from') ||
               statementText.includes('where') ||
               statementText.includes('findby') ||
               statementText.includes('createquerybuilder') ||
               statementText.includes('rawquery');
      });
    }

    /**
     * Check if query contains user constraint
     */
    function hasUserConstraintInQuery(node) {
      if (!node.body || node.body.type !== 'BlockStatement') return false;

      return node.body.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return statementText.includes('user_id') ||
               statementText.includes('owner_id') ||
               statementText.includes('created_by') ||
               statementText.includes('userid') ||
               statementText.includes('ownerid') ||
               statementText.includes('createdby') ||
               (statementText.includes('where') && 
                (statementText.includes('user') || statementText.includes('owner')));
      });
    }

    /**
     * Check Repository query missing user/owner constraint
     */
    function checkRepositorySecurityConstraint(node, context) {
      if (!isRepositoryMethod(node)) return;

      const hasCustomQueryResult = hasCustomQuery(node);
      const hasUserConstraint = hasUserConstraintInQuery(node);

      if (hasCustomQueryResult && !hasUserConstraint) {
        context.report({
          node,
          messageId: 'repositoryMissingConstraint',
        });
      }
    }

    /**
     * Check if method returns Entity directly instead of DTO
     */
    function checkDirectEntityReturn(node, context) {
      if (!isRestEndpoint(node)) return;

      const returnsEntity = returnsEntityDirectly(node);

      if (returnsEntity) {
        context.report({
          node,
          messageId: 'directEntityReturn',
        });
      }
    }

    /**
     * Check if ID field uses sequential number
     */
    function checkSequentialIdUsage(node, context) {
      const isEntityId = isEntityIdField(node);
      const isSequentialType = isSequentialIdType(node);

      if (isEntityId && isSequentialType) {
        context.report({
          node,
          messageId: 'sequentialIdUsage',
        });
      }
    }

    /**
     * Check direct repository access without authorization check
     */
    function checkDirectRepositoryAccess(node, context) {
      if (!isRepositoryFindMethod(node)) return;

      const enclosingFunction = getEnclosingFunction(node);
      if (!enclosingFunction) return;

      const isInRestControllerResult = isInRestController(enclosingFunction);
      const hasIdParameter = hasPathParameterId(enclosingFunction);
      const hasAuthCheck = hasAuthorizationLogicNearby(node, enclosingFunction);

      if (isInRestControllerResult && hasIdParameter && !hasAuthCheck) {
        context.report({
          node,
          messageId: 'directRepositoryAccess',
        });
      }
    }

    // =================== HELPER METHODS ===================

    /**
     * Check if the method is a Repository method
     */
    function isRepositoryMethod(node) {
      const className = getEnclosingClassName(node);
      if (className) {
        const lowerClassName = className.toLowerCase();
        return lowerClassName.includes('repository') || 
               lowerClassName.includes('service') ||
               lowerClassName.includes('dao') ||
               lowerClassName.includes('model');
      }

      // Check for repository-related decorators
      if (node.decorators) {
        return node.decorators.some(decorator => {
          if (decorator.expression.type === 'Identifier') {
            const decoratorName = decorator.expression.name.toLowerCase();
            return decoratorName.includes('repository') || 
                   decoratorName.includes('injectable') ||
                   decoratorName.includes('service');
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the method returns Entity directly
     */
    function returnsEntityDirectly(node) {
      // Check TypeScript return type annotation
      if (node.returnType) {
        const returnTypeText = context.getSourceCode().getText(node.returnType).toLowerCase();
        
        // Exclude safe types
        if (returnTypeText.includes('dto') || 
            returnTypeText.includes('response') || 
            returnTypeText.includes('view') ||
            returnTypeText.includes('model') ||
            returnTypeText.includes('string') ||
            returnTypeText.includes('number') ||
            returnTypeText.includes('boolean') ||
            returnTypeText.includes('void') ||
            returnTypeText.includes('promise') ||
            returnTypeText.includes('observable')) {
          return false;
        }
        
        // Check if it's likely an Entity type
        return isLikelyEntityType(returnTypeText);
      }

      // Check return statements
      if (node.body && node.body.type === 'BlockStatement') {
        return node.body.body.some(statement => {
          if (statement.type === 'ReturnStatement' && statement.argument) {
            const returnText = context.getSourceCode().getText(statement.argument);
            return !returnText.includes('dto') && 
                   !returnText.includes('response') &&
                   !returnText.includes('view');
          }
          return false;
        });
      }

      return false;
    }

    /**
     * Check if the type is likely an Entity
     */
    function isLikelyEntityType(returnType) {
      // Entity usually starts with uppercase and is not a primitive type
      const cleanType = returnType.replace(/[<>[\]{}]/g, '');
      return /^[A-Z][a-zA-Z]*$/.test(cleanType) && 
             !['Boolean', 'Number', 'String', 'Date', 'Array', 'Object', 'Promise', 'Observable'].includes(cleanType);
    }

    /**
     * Check if the variable is an Entity ID field
     */
    function isEntityIdField(node) {
      let name;
      
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        name = node.id.name.toLowerCase();
      } else if (node.type === 'PropertyDefinition' && node.key.type === 'Identifier') {
        name = node.key.name.toLowerCase();
      } else {
        return false;
      }

      return name === 'id' || name === '_id' || name.endsWith('id');
    }

    /**
     * Check if the ID type is sequential
     */
    function isSequentialIdType(node) {
      // Check TypeScript type annotation
      if (node.typeAnnotation) {
        const typeText = context.getSourceCode().getText(node.typeAnnotation).toLowerCase();
        return typeText.includes('number') || typeText.includes('int');
      }

      // Check initializer value
      if (node.init && node.init.type === 'Literal') {
        return typeof node.init.value === 'number';
      }

      return false;
    }

    /**
     * Check if the method invocation is a repository find method
     */
    function isRepositoryFindMethod(node) {
      if (node.type !== 'CallExpression') return false;

      if (node.callee.type === 'MemberExpression') {
        const property = node.callee.property;
        if (property.type === 'Identifier') {
          const methodName = property.name.toLowerCase();
          return methodName.startsWith('findby') || 
                 methodName.startsWith('getby') ||
                 methodName.startsWith('find') ||
                 methodName.startsWith('get') ||
                 methodName.startsWith('delete') ||
                 methodName.includes('id');
        }
      }
      return false;
    }

    /**
     * Check if the method is in a RestController
     */
    function isInRestController(node) {
      const className = getEnclosingClassName(node);
      if (className) {
        const lowerClassName = className.toLowerCase();
        return lowerClassName.includes('controller') || 
               lowerClassName.includes('route') ||
               lowerClassName.includes('handler');
      }
      return false;
    }

    /**
     * Check if there is authorization logic near the repository call
     */
    function hasAuthorizationLogicNearby(repoCall, method) {
      const enclosingFunction = getEnclosingFunction(repoCall);
      if (!enclosingFunction || !enclosingFunction.body) return false;

      const bodyNode = enclosingFunction.body;
      if (bodyNode.type !== 'BlockStatement') return false;

      return bodyNode.body.some(statement => {
        const stmtText = context.getSourceCode().getText(statement).toLowerCase();
        return containsSecurityCheck(stmtText);
      });
    }

    /**
     * Check if text contains security-related keywords
     */
    function containsSecurityCheck(text) {
      return text.includes('getcurrentuser') ||
             text.includes('req.user') ||
             text.includes('request.user') ||
             text.includes('authentication') ||
             text.includes('checkowner') ||
             text.includes('haspermission') ||
             text.includes('canaccess') ||
             text.includes('isowner') ||
             text.includes('validateaccess') ||
             text.includes('authorize') ||
             text.includes('jwt') ||
             text.includes('token') ||
             text.includes('permission') ||
             text.includes('role') ||
             text.includes('guard');
    }

    /**
     * Check if the function has manual security check
     */
    function hasManualSecurityCheck(node) {
      let bodyNode;

      if (node.type === 'CallExpression') {
        // Check callback function in Express.js
        const callback = node.arguments.find(arg => 
          arg.type === 'FunctionExpression' || 
          arg.type === 'ArrowFunctionExpression'
        );
        if (callback && callback.body) {
          bodyNode = callback.body;
        }
      } else if (node.body) {
        bodyNode = node.body;
      }

      if (!bodyNode) return false;

      // If arrow function with expression body
      if (bodyNode.type !== 'BlockStatement') {
        const bodyText = context.getSourceCode().getText(bodyNode).toLowerCase();
        return containsSecurityCheck(bodyText);
      }

      // Check block statement
      return bodyNode.body.some(statement => {
        const statementText = context.getSourceCode().getText(statement).toLowerCase();
        return containsSecurityCheck(statementText);
      });
    }

    // =================== UTILITY METHODS ===================

    /**
     * Get enclosing function of a node
     */
    function getEnclosingFunction(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'FunctionDeclaration' || 
            parent.type === 'MethodDefinition' ||
            parent.type === 'FunctionExpression' ||
            parent.type === 'ArrowFunctionExpression') {
          return parent;
        }
        parent = parent.parent;
      }
      return null;
    }

    /**
     * Get enclosing class name
     */
    function getEnclosingClassName(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'ClassDeclaration' && parent.id) {
          return parent.id.name;
        }
        parent = parent.parent;
      }
      return null;
    }
  }
};
