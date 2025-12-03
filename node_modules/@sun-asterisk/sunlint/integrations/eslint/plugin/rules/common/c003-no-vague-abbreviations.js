/**
 * Custom ESLint rule for: C003 – Clear variable names, avoid arbitrary abbreviations
 * Rule ID: custom/c003
 * Purpose: Ensure clear, understandable variable names without arbitrary abbreviations
 */

const c003Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Clear variable names, avoid arbitrary abbreviations",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedSingleChar: {
            type: "array",
            items: { type: "string" },
            description: "Single character variables that are allowed (default: i, j, k)"
          },
          allowedAbbreviations: {
            type: "array", 
            items: { type: "string" },
            description: "Common abbreviations that are allowed"
          },
          minLength: {
            type: "integer",
            minimum: 1,
            description: "Minimum variable name length (default: 2)"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      singleChar: "Variable '{{name}}' is only 1 character long. Use descriptive names (except for counters like i, j, k).",
      tooShort: "Variable '{{name}}' is too short ({{length}} characters). Use descriptive names with at least {{minLength}} characters.", 
      abbreviation: "Variable '{{name}}' appears to be an unclear abbreviation. Use full descriptive names.",
      unclear: "Variable '{{name}}' is unclear or ambiguous. Use more specific descriptive names."
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedSingleChar = new Set(options.allowedSingleChar || ['i', 'j', 'k', 'x', 'y', 'z']);
    const allowedAbbreviations = new Set(options.allowedAbbreviations || [
      'id', 'url', 'api', 'ui', 'db', 'config', 'env', 'app',
      'btn', 'img', 'src', 'dest', 'req', 'res', 'ctx',
      'min', 'max', 'len', 'num', 'str', 'json'
    ]);
    const minLength = options.minLength || 2;

    // Common abbreviation patterns that should be avoided
    const suspiciousAbbreviations = [
      /^[a-z]{1,2}[0-9]*$/, // e.g., 'u', 'usr', 'n1', 'v2'
      /^[a-z]*[aeiou]*[bcdfghjklmnpqrstvwxyz]{3,}$/, // too many consonants
      /^[bcdfghjklmnpqrstvwxyz]{3,}[aeiou]*$/, // consonants at start
      /^(tmp|temp|val|var|data|info|item|elem|el|obj|arr)([A-Z0-9].*)?$/, // generic names
      /^[a-z]+(Mgr|Ctrl|Svc|Repo|Util|Hlpr|Mngr)$/, // manager/helper patterns  
    ];

    // Generic/unclear variable names that should be avoided
    const unclearNames = new Set([
      'data', 'info', 'item', 'element', 'object', 'value', 'result', 
      'response', 'request', 'temp', 'tmp', 'var', 'variable',
      'stuff', 'thing', 'something', 'anything', 'everything',
      'flag', 'check', 'test', 'validate', 'process', 'handle',
      'obj', 'arg', 'val', 'fn'
    ]);

    function isCounterContext(node) {
      // Check if variable is used as a loop counter
      if (!node || !node.parent) return false;
      
      let parent = node.parent;
      
      // Go up the tree to find ForStatement/ForInStatement/ForOfStatement
      while (parent) {
        if (parent.type === 'ForStatement') {
          return parent.init && parent.init.declarations && 
                 parent.init.declarations.some(decl => decl && decl.id === node);
        }
        if (parent.type === 'ForInStatement' || parent.type === 'ForOfStatement') {
          return parent.left && (parent.left === node || 
                 (parent.left.type === 'VariableDeclaration' && 
                  parent.left.declarations.some(decl => decl && decl.id === node)));
        }
        parent = parent.parent;
      }
      return false;
    }

    function isMathContext(node, name) {
      // Check for math variable patterns
      const mathPatterns = [
        // Coordinate pairs: x1, y1, x2, y2
        /^[xyz][12]$/i,
        // Delta notation: dx, dy, dt, dr
        /^d[xyztr]$/i,
        // Math constants: a, b, c in equations
        /^[abc]$/i,
        // Vector components: vx, vy, vz
        /^v[xyz]$/i,
        // Position/point notation: p1, p2
        /^p\d+$/i
      ];
      
      if (mathPatterns.some(pattern => pattern.test(name))) {
        return true;
      }
      
      // Check if we're in a math function context
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') {
          const functionName = parent.id && parent.id.name;
          if (functionName && /^(distance|calculate|compute|solve|formula|algorithm|equation|math)/i.test(functionName)) {
            return true;
          }
          break; // Don't check beyond the immediate function
        }
        parent = parent.parent;
      }
      
      // Check if we're in a context with Math operations
      let currentNode = node.parent;
      while (currentNode) {
        if (currentNode.type === 'CallExpression') {
          const callee = currentNode.callee;
          if (callee && callee.object && callee.object.name === 'Math') {
            return true;
          }
          if (callee && callee.name && /^(sqrt|pow|abs|sin|cos|tan|distance|calculate)$/i.test(callee.name)) {
            return true;
          }
        }
        if (currentNode.type === 'BinaryExpression' && ['+', '-', '*', '/'].includes(currentNode.operator)) {
          return true;
        }
        currentNode = currentNode.parent;
      }
      
      return false;
    }

    function checkVariableName(node, name) {
      // Safety checks
      if (!node || !name || typeof name !== 'string') {
        return;
      }

      // Skip if it's a destructuring pattern with specific exceptions
      if (node.parent && node.parent.type === 'Property' && node.parent.shorthand) {
        return; // Allow destructuring shorthand
      }

      // Skip TypeScript type annotations and interface properties
      if (node.parent && (node.parent.type === 'TSTypeAnnotation' || 
                         node.parent.type === 'TSPropertySignature' ||
                         node.parent.type === 'TSMethodSignature')) {
        return;
      }

      // Single character check
      if (name.length === 1) {
        if (!allowedSingleChar.has(name.toLowerCase()) && !isCounterContext(node) && !isMathContext(node, name)) {
          context.report({
            node,
            messageId: "singleChar",
            data: { name }
          });
        }
        return;
      }

      // Minimum length check
      if (name.length < minLength) {
        context.report({
          node,
          messageId: "tooShort", 
          data: { name, length: name.length, minLength }
        });
        return;
      }

      // Skip allowed abbreviations
      if (allowedAbbreviations.has(name.toLowerCase())) {
        return;
      }

      // Check for math context before flagging as unclear
      if (isMathContext(node, name)) {
        return;
      }

      // Check for unclear/generic names
      if (unclearNames.has(name.toLowerCase())) {
        context.report({
          node,
          messageId: "unclear",
          data: { name }
        });
        return;
      }

      // Check for suspicious abbreviation patterns
      for (const pattern of suspiciousAbbreviations) {
        if (pattern.test(name)) {
          context.report({
            node,
            messageId: "abbreviation", 
            data: { name }
          });
          return;
        }
      }
    }

    function checkParameter(param) {
      if (!param) return;
      
      if (param.type === 'Identifier') {
        checkVariableName(param, param.name);
      } else if (param.type === 'AssignmentPattern' && param.left && param.left.type === 'Identifier') {
        // Handle default parameters
        checkVariableName(param.left, param.left.name);
      } else if (param.type === 'ObjectPattern' && param.properties) {
        // Handle object destructuring in parameters
        param.properties.forEach(prop => {
          if (prop && prop.type === 'Property' && prop.value && prop.value.type === 'Identifier') {
            checkVariableName(prop.value, prop.value.name);
          }
        });
      } else if (param.type === 'ArrayPattern' && param.elements) {
        // Handle array destructuring in parameters
        param.elements.forEach(element => {
          if (element && element.type === 'Identifier') {
            checkVariableName(element, element.name);
          }
        });
      }
    }

    return {
      VariableDeclarator(node) {
        if (!node || !node.id) return;
        
        if (node.id.type === 'Identifier') {
          checkVariableName(node.id, node.id.name);
        } else if (node.id.type === 'ObjectPattern') {
          // Handle destructuring
          if (node.id.properties) {
            node.id.properties.forEach(prop => {
              if (prop && prop.type === 'Property' && prop.value && prop.value.type === 'Identifier') {
                checkVariableName(prop.value, prop.value.name);
              }
            });
          }
        } else if (node.id.type === 'ArrayPattern') {
          // Handle array destructuring
          if (node.id.elements) {
            node.id.elements.forEach(element => {
              if (element && element.type === 'Identifier') {
                checkVariableName(element, element.name);
              }
            });
          }
        }
      },

      FunctionDeclaration(node) {
        // Check function parameters
        if (node && node.params) {
          node.params.forEach(param => checkParameter(param));
        }
      },

      ArrowFunctionExpression(node) {
        // Check arrow function parameters
        if (node && node.params) {
          node.params.forEach(param => checkParameter(param));
        }
      },

      FunctionExpression(node) {
        // Check function expression parameters
        if (node && node.params) {
          node.params.forEach(param => checkParameter(param));
        }
      },

      CatchClause(node) {
        // Check catch clause parameters
        if (node && node.param && node.param.type === 'Identifier') {
          checkVariableName(node.param, node.param.name);
        }
      }
    };
  }
};

module.exports = c003Rule;