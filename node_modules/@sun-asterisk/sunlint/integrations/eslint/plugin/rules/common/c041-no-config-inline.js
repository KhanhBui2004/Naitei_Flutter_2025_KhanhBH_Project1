/**
 * Custom ESLint rule for: C041 – No Hardcoded Sensitive Information
 * Rule ID: custom/c041
 * Purpose: Detect hardcoded sensitive information while avoiding false positives in UI/component contexts
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "No hardcoded sensitive information",
      recommended: false
    },
    schema: [],
    messages: {
      inlineConfig: "Potential hardcoded sensitive information detected. Move sensitive values to environment variables or secure config files."
    }
  },
  create(context) {
    function isConfigOrUIContext(line) {
      const lowerLine = line.toLowerCase();
      
      // UI/Component contexts - likely false positives
      const uiContexts = [
        'inputtype', 'type:', 'type =', 'inputtype=',
        'routes =', 'route:', 'path:', 'routes:', 
        'import {', 'export {', 'from ', 'import ',
        'interface', 'type ', 'enum ',
        'props:', 'defaultprops',
        'schema', 'validator',
        'hook', 'use', 'const use', 'import.*use',
        // React/UI specific
        'textinput', 'input ', 'field ', 'form',
        'component', 'page', 'screen', 'modal',
        // Route/navigation specific  
        'navigation', 'route', 'path', 'url:', 'route:',
        'setuppassword', 'resetpassword', 'forgotpassword',
        'changepassword', 'confirmpassword'
      ];
      
      return uiContexts.some(context => lowerLine.includes(context));
    }
    
    function isFalsePositive(value, sourceCode) {
      const lowerValue = value.toLowerCase();
      
      // Global false positive indicators
      const globalFalsePositives = [
        'test', 'mock', 'example', 'demo', 'sample', 'placeholder', 'dummy', 'fake',
        'xmlns', 'namespace', 'schema', 'w3.org', 'google.com', 'googleapis.com',
        'error', 'message', 'missing', 'invalid', 'failed', 'localhost', '127.0.0.1'
      ];
      
      // Check global false positives
      if (globalFalsePositives.some(pattern => lowerValue.includes(pattern))) {
        return true;
      }
      
      // Check if line context suggests UI/component usage
      if (isConfigOrUIContext(sourceCode)) {
        return true;
      }
      
      return false;
    }

    const sensitivePatterns = [
      { pattern: /password/i, minLength: 4 },
      { pattern: /secret/i, minLength: 6 },
      { pattern: /api[_-]?key/i, minLength: 10 },
      { pattern: /auth[_-]?token/i, minLength: 16 },
      { pattern: /access[_-]?token/i, minLength: 16 },
      { pattern: /(mongodb|mysql|postgres|redis):\/\//i, minLength: 10 }
    ];

    function reportIfSensitive(node) {
      const sourceCode = context.getSourceCode();
      const lineText = sourceCode.lines[node.loc.start.line - 1];
      
      if (typeof node.value !== "string" || node.value.length < 4) return;
      
      // Skip if it's in a UI/component context
      if (isFalsePositive(node.value, lineText)) {
        return;
      }
      
      // Check against sensitive patterns - both variable name and value
      const lowerLine = lineText.toLowerCase();
      const lowerValue = node.value.toLowerCase();
      
      for (const { pattern, minLength } of sensitivePatterns) {
        // Check if pattern matches variable name OR value
        const matchesValue = pattern.test(node.value) && node.value.length >= minLength;
        const matchesLine = pattern.test(lineText) && node.value.length >= minLength;
        
        if (matchesValue || matchesLine) {
          context.report({
            node,
            messageId: "inlineConfig"
          });
          break;
        }
      }
    }

    return {
      Literal(node) {
        reportIfSensitive(node);
      },
      TemplateLiteral(node) {
        if (node.quasis.length === 1) {
          // Create a mock node for template literal value
          const mockNode = {
            ...node,
            value: node.quasis[0].value.raw
          };
          reportIfSensitive(mockNode);
        }
      }
    };
  }
};
