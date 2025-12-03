"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Verify that data selection or database queries use parameterized queries, ORMs, entity frameworks, or are otherwise protected from database injection attacks",
      recommended: true,
    },
    schema: [],
    messages: {
      sqlInjection: "Potential SQL injection vulnerability detected. Use parameterized queries instead of string concatenation in '{{method}}'.",
      unsafeQuery: "Unsafe database query detected in '{{method}}'. Consider using ORM or parameterized queries.",
      stringConcatenation: "Avoid string concatenation in SQL queries. Use parameterized queries in '{{method}}'.",
      templateLiteralQuery: "Template literals in SQL queries can be vulnerable to injection. Use parameterized queries in '{{method}}'.",
    },
  },

  create(context) {
    // Database methods that should use parameterized queries
    const databaseMethods = [
      // MySQL
      "query", "execute", "prepare",
      // PostgreSQL
      "query", "execute", 
      // MongoDB
      "find", "findOne", "aggregate", "updateOne", "updateMany", "deleteOne", "deleteMany",
      // SQLite
      "run", "get", "all", "each", "prepare",
      // General ORM methods
      "where", "whereRaw", "raw", "knex",
      // Sequelize
      "findAll", "findOne", "create", "update", "destroy",
      // TypeORM
      "createQueryBuilder", "query", "manager",
      // Prisma
      "findMany", "findUnique", "create", "update", "delete",
    ];

    // Dangerous string methods that suggest concatenation
    const dangerousStringMethods = [
      "concat", "replace", "replaceAll", "substring", "slice"
    ];

    // SQL keywords that when used with string operations are suspicious
    const sqlKeywords = [
      "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER",
      "WHERE", "FROM", "JOIN", "UNION", "ORDER", "GROUP", "HAVING",
      "select", "insert", "update", "delete", "drop", "create", "alter",
      "where", "from", "join", "union", "order", "group", "having"
    ];

    function containsSqlKeywords(str) {
      return sqlKeywords.some(keyword => str.includes(keyword));
    }

    function checkStringConcatenation(node) {
      if (node.type === "BinaryExpression" && node.operator === "+") {
        const leftStr = getStringValue(node.left);
        const rightStr = getStringValue(node.right);
        
        if ((leftStr && containsSqlKeywords(leftStr)) || 
            (rightStr && containsSqlKeywords(rightStr))) {
          return true;
        }
      }
      return false;
    }

    function getStringValue(node) {
      if (node.type === "Literal" && typeof node.value === "string") {
        return node.value;
      }
      if (node.type === "TemplateLiteral") {
        return node.quasis.map(q => q.value.raw).join("");
      }
      return null;
    }

    function checkTemplateLiteral(node) {
      if (node.type === "TemplateLiteral") {
        const templateString = node.quasis.map(q => q.value.raw).join("");
        return containsSqlKeywords(templateString) && node.expressions.length > 0;
      }
      return false;
    }

    function isDatabaseCall(node) {
      if (node.type === "CallExpression") {
        // Check for method calls like db.query(), connection.execute()
        if (node.callee.type === "MemberExpression") {
          const methodName = node.callee.property.name;
          return databaseMethods.includes(methodName);
        }
        
        // Check for direct function calls like query()
        if (node.callee.type === "Identifier") {
          return databaseMethods.includes(node.callee.name);
        }
      }
      return false;
    }

    function getMethodName(node) {
      if (node.callee.type === "MemberExpression") {
        return node.callee.property.name;
      }
      if (node.callee.type === "Identifier") {
        return node.callee.name;
      }
      return "unknown";
    }

    function checkCallExpression(node) {
      if (!isDatabaseCall(node)) {
        return;
      }

      const methodName = getMethodName(node);

      // Check each argument
      for (const arg of node.arguments) {
        // Check for string concatenation
        if (checkStringConcatenation(arg)) {
          context.report({
            node: arg,
            messageId: "stringConcatenation",
            data: { method: methodName },
          });
          continue;
        }

        // Check for template literals with expressions
        if (checkTemplateLiteral(arg)) {
          context.report({
            node: arg,
            messageId: "templateLiteralQuery",
            data: { method: methodName },
          });
          continue;
        }

        // Check for potentially unsafe patterns
        if (arg.type === "Identifier" || arg.type === "MemberExpression") {
          // This is a variable or property access - could be unsafe
          // We'll be more lenient here and only warn if it's clearly a string concatenation
          continue;
        }
      }
    }

    return {
      CallExpression: checkCallExpression,
      
      // Also check assignment expressions that might build SQL strings
      AssignmentExpression(node) {
        if (node.operator === "=" || node.operator === "+=") {
          if (checkStringConcatenation(node.right)) {
            const leftStr = getStringValue(node.right.left);
            const rightStr = getStringValue(node.right.right);
            
            if ((leftStr && containsSqlKeywords(leftStr)) || 
                (rightStr && containsSqlKeywords(rightStr))) {
              context.report({
                node: node.right,
                messageId: "sqlInjection",
                data: { method: "string assignment" },
              });
            }
          }
        }
      },

      // Check variable declarations
      VariableDeclarator(node) {
        if (node.init && checkStringConcatenation(node.init)) {
          const leftStr = getStringValue(node.init.left);
          const rightStr = getStringValue(node.init.right);
          
          if ((leftStr && containsSqlKeywords(leftStr)) || 
              (rightStr && containsSqlKeywords(rightStr))) {
            context.report({
              node: node.init,
              messageId: "sqlInjection",
              data: { method: "variable declaration" },
            });
          }
        }
      },
    };
  },
};
