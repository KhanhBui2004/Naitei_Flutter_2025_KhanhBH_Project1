"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent JSON injection attacks and unsafe JSON handling",
      recommended: true,
    },
    schema: [],
    messages: {
      noEvalJson: "Never use eval() to process JSON data - use JSON.parse() instead",
      unsafeJsonParse: "Unsafe JSON parsing - validate input before parsing",
      jsonStringifyInHtml: "JSON.stringify output should be escaped when used in HTML context",
      unsafeTemplateString: "Unsafe template string with user input",
      unsafeDocumentWrite: "JSON.stringify output should be escaped when used in HTML context",
      unsafeStorageParse: "Unsafe JSON parsing - validate input before parsing",
      unsafeUrlParse: "Unsafe JSON parsing - validate input before parsing",
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    
    // Rule C005 - Each function should do one thing
    const validationDetector = createValidationDetector(context);
    const userInputDetector = createUserInputDetector();
    const htmlContextDetector = createHtmlContextDetector(context);
    const jsonParseChecker = createJsonParseChecker(context, userInputDetector, validationDetector);
    const jsonStringifyChecker = createJsonStringifyChecker(context, htmlContextDetector);
    const evalChecker = createEvalChecker(context);
    const templateChecker = createTemplateChecker(context, userInputDetector, htmlContextDetector);

    return {
      CallExpression(node) {
        jsonParseChecker.checkNode(node);
        jsonStringifyChecker.checkNode(node);
        evalChecker.checkNode(node);
      },
      TemplateLiteral(node) {
        templateChecker.checkNode(node);
      }
    };
  }
};

// Rule C006 - Function names should be verb/verb-noun
// Rule C031 - Validation logic must be separate
function createValidationDetector(context) {
  const sourceCode = context.getSourceCode();
  
  return {
    hasValidationContext(node) {
      return detectTryCatchContext(node) || detectValidationStatements(node, sourceCode);
    }
  };
}

function detectTryCatchContext(node) {
  let parent = node.parent;
  while (parent) {
    if (parent.type === 'TryStatement') {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function detectValidationStatements(node, sourceCode) {
  let parent = node.parent;
  let current = node;
  
  while (parent) {
    if (parent.type === 'BlockStatement') {
      const statements = parent.body;
      const currentIndex = statements.indexOf(current);
      
      for (let i = 0; i < currentIndex; i++) {
        const stmt = statements[i];
        const stmtText = sourceCode.getText(stmt);
        
        if (containsValidationPattern(stmtText)) {
          return true;
        }
      }
    }
    
    current = parent;
    parent = parent.parent;
  }
  
  return false;
}

function containsValidationPattern(text) {
  const validationPatterns = ['validate', 'typeof', 'length', 'isValid'];
  return validationPatterns.some(pattern => text.includes(pattern));
}

// Rule C015 - Use domain language in class/function names
function createUserInputDetector() {
  const userInputPatterns = [
    /req\.(body|query|params)/,
    /request\.(body|query|params)/,
    /localStorage\.getItem/,
    /sessionStorage\.getItem/,
    /window\.location/,
    /location\.(search|hash)/,
    /URLSearchParams/
  ];

  return {
    isUserInput(node, sourceCode) {
      if (!node) return false;
      const text = sourceCode.getText(node);
      return userInputPatterns.some(pattern => pattern.test(text));
    }
  };
}

function createHtmlContextDetector(context) {
  const htmlContextMethods = ['innerHTML', 'outerHTML', 'insertAdjacentHTML'];
  
  return {
    isInHtmlContext(node) {
      return detectHtmlAssignment(node, htmlContextMethods) || 
             detectDocumentWrite(node) || 
             detectHtmlTemplate(node, htmlContextMethods);
    }
  };
}

function detectHtmlAssignment(node, htmlContextMethods) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'AssignmentExpression' &&
        parent.left.type === 'MemberExpression' &&
        htmlContextMethods.includes(parent.left.property.name)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function detectDocumentWrite(node) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'CallExpression' &&
        parent.callee.type === 'MemberExpression' &&
        parent.callee.object.name === 'document' &&
        parent.callee.property.name === 'write') {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function detectHtmlTemplate(node, htmlContextMethods) {
  let parent = node.parent;
  
  while (parent) {
    if (parent.type === 'TemplateLiteral' &&
        parent.parent &&
        parent.parent.type === 'AssignmentExpression' &&
        parent.parent.left.type === 'MemberExpression' &&
        htmlContextMethods.includes(parent.parent.left.property.name)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

// Rule C012 - Separate Command and Query: Clear single responsibility and side-effects
function createJsonParseChecker(context, userInputDetector, validationDetector) {
  const sourceCode = context.getSourceCode();
  
  return {
    checkNode(node) {
      if (isJsonParseCall(node)) {
        const argument = node.arguments[0];
        if (argument && userInputDetector.isUserInput(argument, sourceCode)) {
          if (!validationDetector.hasValidationContext(node)) {
            reportUnsafeJsonParse(context, node);
          }
        }
      }
    }
  };
}

function isJsonParseCall(node) {
  return node.type === 'CallExpression' &&
         node.callee.type === 'MemberExpression' &&
         node.callee.object.name === 'JSON' &&
         node.callee.property.name === 'parse';
}

function reportUnsafeJsonParse(context, node) {
  context.report({
    node,
    messageId: "unsafeJsonParse"
  });
}

function createJsonStringifyChecker(context, htmlContextDetector) {
  return {
    checkNode(node) {
      if (isJsonStringifyCall(node)) {
        if (htmlContextDetector.isInHtmlContext(node)) {
          reportJsonStringifyInHtml(context, node);
        }
      }
    }
  };
}

function isJsonStringifyCall(node) {
  return node.type === 'CallExpression' &&
         node.callee.type === 'MemberExpression' &&
         node.callee.object.name === 'JSON' &&
         node.callee.property.name === 'stringify';
}

function reportJsonStringifyInHtml(context, node) {
  context.report({
    node,
    messageId: "jsonStringifyInHtml"
  });
}

function createEvalChecker(context) {
  const sourceCode = context.getSourceCode();
  
  return {
    checkNode(node) {
      if (isEvalCall(node)) {
        const argument = node.arguments[0];
        if (argument && containsJsonPattern(argument, sourceCode)) {
          reportEvalWithJson(context, node);
        }
      }
    }
  };
}

function isEvalCall(node) {
  return node.type === 'CallExpression' && node.callee.name === 'eval';
}

function containsJsonPattern(argument, sourceCode) {
  const text = sourceCode.getText(argument);
  const jsonPatterns = ['JSON', 'userJson', 'req.', 'request.'];
  return jsonPatterns.some(pattern => text.includes(pattern));
}

function reportEvalWithJson(context, node) {
  context.report({
    node,
    messageId: "noEvalJson"
  });
}

function createTemplateChecker(context, userInputDetector, htmlContextDetector) {
  const sourceCode = context.getSourceCode();
  
  return {
    checkNode(node) {
      if (node.type === 'TemplateLiteral') {
        const hasUserInput = node.expressions.some(expr => 
          userInputDetector.isUserInput(expr, sourceCode)
        );
        
        if (hasUserInput && isUnsafeHtmlTemplate(node, sourceCode, htmlContextDetector)) {
          reportUnsafeTemplate(context, node);
        }
      }
    }
  };
}

function isUnsafeHtmlTemplate(node, sourceCode, htmlContextDetector) {
  const text = sourceCode.getText(node);
  const htmlPatterns = ['<script>', '<div>', 'innerHTML'];
  
  return htmlPatterns.some(pattern => text.includes(pattern)) || 
         htmlContextDetector.isInHtmlContext(node);
}

function reportUnsafeTemplate(context, node) {
  context.report({
    node,
    messageId: "unsafeTemplateString"
  });
}
