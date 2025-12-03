/**
 * Custom ESLint rule for: C006 – Function names must be verbs or verb-noun phrases
 * Rule ID: custom/c006
 * Purpose: Enforce function naming convention using verbs or verb-noun phrases to clearly indicate actions
 */

const c006Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Function names must be verbs or verb-noun phrases",
      recommended: false
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedVerbs: {
            type: "array",
            items: { type: "string" },
            description: "Additional verbs to allow (beyond common ones)"
          },
          allowedPrefixes: {
            type: "array", 
            items: { type: "string" },
            description: "Allowed verb prefixes (default: get, set, is, has, can, should, etc.)"
          },
          allowConstructors: {
            type: "boolean",
            description: "Allow constructor functions (PascalCase) (default: true)"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      notVerbNoun: "Function '{{name}}' should be a verb or verb-noun phrase (e.g., 'getData', 'calculateTotal', 'validateInput').",
      useVerbForm: "Function '{{name}}' should start with a verb. Consider: '{{suggestions}}'.",
      avoidNounOnly: "Function '{{name}}' appears to be a noun only. Use verb form like 'get{{name}}', 'create{{name}}', or 'process{{name}}'."
    }
  },

  create(context) {
    const options = context.options[0] || {};
    
    // Common verb prefixes that indicate action
    const commonVerbPrefixes = new Set([
      'get', 'set', 'fetch', 'load', 'save', 'store', 'update', 'delete', 'remove',
      'create', 'make', 'build', 'generate', 'produce', 'construct',
      'add', 'insert', 'append', 'push', 'pop', 'shift', 'unshift',
      'find', 'search', 'filter', 'sort', 'map', 'reduce', 'transform',
      'validate', 'verify', 'check', 'test', 'confirm', 'ensure',
      'calculate', 'compute', 'process', 'parse', 'format', 'convert',
      'send', 'receive', 'transmit', 'broadcast', 'emit', 'dispatch',
      'open', 'close', 'start', 'stop', 'begin', 'end', 'finish',
      'show', 'hide', 'display', 'render', 'draw', 'paint',
      'connect', 'disconnect', 'link', 'unlink', 'attach', 'detach',
      'enable', 'disable', 'activate', 'deactivate', 'toggle',
      'is', 'has', 'can', 'should', 'will', 'must', 'may', 'does',
      'handle', 'manage', 'control', 'execute', 'run', 'invoke',
      'reset', 'clear', 'clean', 'refresh', 'reload', 'restore',
      
      // Based on user feedback - missing important verbs
      'count', 'reopen', 'request', 'use', 'go', 'retry', 'redirect',
      
      // Event handler prefixes
      'on',
      
      // Common patterns that should be allowed as verbs
      'process', // can be both noun and verb - when standalone should be allowed
    ]);

    const allowedPrefixes = new Set([
      ...commonVerbPrefixes,
      ...(options.allowedPrefixes || [])
    ]);

    const allowedVerbs = new Set([
      ...commonVerbPrefixes,
      ...(options.allowedVerbs || [])
    ]);
    
    // Generic/vague verbs that should be flagged even if they are technically verbs
    const genericVerbs = new Set([
      'do', 'handle', 'process', 'manage', 'execute', 'work', 'stuff', 'thing', 'data'
    ]);
    
    function isGenericVerbUsage(name) {
      // Check if the function name is exactly a generic verb or starts with generic verb + something generic
      const genericPatterns = [
        /^(do|handle|process|manage|execute)(Something|Stuff|Data|Info|Work|Thing|Items|Objects?)$/i,
        /^(do|handle|process|manage|execute)$/i,
        /^(do|handle|process|manage|execute)[A-Z].*$/i // Any pattern starting with generic verb + capital letter
      ];
      
      return genericPatterns.some(pattern => pattern.test(name));
    }

    const allowConstructors = options.allowConstructors !== false;

    // Helper function to check if a name is PascalCase (likely a constructor)
    function isPascalCase(name) {
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    }

    // Helper function to check if a name is camelCase starting with a verb
    function isVerbNounPattern(name) {
      if (!name || name.length === 0) return false;
      
      // Check if it starts with a known verb prefix
      const lowerName = name.toLowerCase();
      for (const verb of allowedPrefixes) {
        if (lowerName.startsWith(verb.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    }

    // Generate suggestions for a noun-based function name
    function generateSuggestions(name) {
      const suggestions = [
        `get${name.charAt(0).toUpperCase() + name.slice(1)}`,
        `create${name.charAt(0).toUpperCase() + name.slice(1)}`,
        `process${name.charAt(0).toUpperCase() + name.slice(1)}`
      ];
      return suggestions.join(', ');
    }

    // Check if the name appears to be just a noun
    function isLikelyNounOnly(name) {
      const nounPatterns = [
        /^(user|data|info|item|list|array|object|config|settings|options)$/i,
        /^(file|document|record|entry|element|component|widget)$/i,
        /^(message|notification|alert|error|warning|success)$/i,
        /^(report|summary|total|count|number|value|result)$/i
      ];
      
      return nounPatterns.some(pattern => pattern.test(name));
    }

    function checkFunctionName(node, name) {
      // Safety checks
      if (!node || !name || typeof name !== 'string') {
        return;
      }

      // Allow constructor functions (PascalCase)
      if (allowConstructors && isPascalCase(name)) {
        return;
      }

      // Skip very short names (likely okay: a, b, fn, etc.)
      if (name.length <= 2) {
        return;
      }

      // Check if it follows verb-noun pattern
      if (isVerbNounPattern(name)) {
        // But still check if it's using generic verbs that should be flagged
        if (isGenericVerbUsage(name)) {
          context.report({
            node,
            messageId: "notVerbNoun",
            data: { name }
          });
          return;
        }
        return; // Good! Follows the pattern and not generic
      }

      // Check if it's likely a noun-only name
      if (isLikelyNounOnly(name)) {
        context.report({
          node,
          messageId: "avoidNounOnly",
          data: { 
            name,
            suggestions: generateSuggestions(name)
          }
        });
        return;
      }

      // General violation - doesn't start with verb
      context.report({
        node,
        messageId: "notVerbNoun",
        data: { name }
      });
    }

    return {
      FunctionDeclaration(node) {
        if (node.id && node.id.name) {
          checkFunctionName(node.id, node.id.name);
        }
      },

      FunctionExpression(node) {
        // Check named function expressions
        if (node.id && node.id.name) {
          checkFunctionName(node.id, node.id.name);
        }
      },

      ArrowFunctionExpression(node) {
        // For arrow functions assigned to variables
        if (node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id) {
          checkFunctionName(node.parent.id, node.parent.id.name);
        }
      },

      MethodDefinition(node) {
        // Check class methods
        if (node.key && node.key.name && node.kind === 'method') {
          // Skip constructor methods
          if (node.key.name !== 'constructor') {
            checkFunctionName(node.key, node.key.name);
          }
        }
      },

      Property(node) {
        // Check object method properties
        if (node.method && node.key && node.key.name) {
          checkFunctionName(node.key, node.key.name);
        }
        // Check function values assigned to object properties
        if (!node.method && node.value && 
            (node.value.type === 'FunctionExpression' || node.value.type === 'ArrowFunctionExpression') &&
            node.key && node.key.name) {
          checkFunctionName(node.key, node.key.name);
        }
      }
    };
  }
};

module.exports = c006Rule;