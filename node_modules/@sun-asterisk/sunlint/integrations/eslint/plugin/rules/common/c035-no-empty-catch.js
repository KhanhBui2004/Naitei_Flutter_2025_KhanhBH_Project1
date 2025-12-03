/**
 * Custom ESLint rule for: C035 – No empty catch blocks (without error handling or logging)
 * Rule ID: custom/c035
 * Purpose: Prevent silently swallowing errors in catch blocks without logging or handling them
 * Note: Primarily intended for backend code. Frontend may handle errors through UI.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "No empty catch blocks (without error handling or logging)",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          allowFrontend: {
            type: "boolean",
            default: true
          },
          allowIgnoredParams: {
            type: "boolean", 
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      emptyCatch: "Empty catch blocks are not allowed. Errors should be logged or handled explicitly.",
      emptyCatchBackend: "Backend code must log errors in catch blocks. Consider using console.error(), logger, or proper error handling."
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const allowFrontend = options.allowFrontend !== false;
    const allowIgnoredParams = options.allowIgnoredParams !== false;
    
    function isBackendFile(filename) {
      // Heuristics to determine if it's a backend file
      const backendPatterns = [
        /server/i, /backend/i, /api/i, /service/i, 
        /controller/i, /model/i, /dao/i, /repository/i,
        /middleware/i, /route/i, /endpoint/i
      ];
      
      return backendPatterns.some(pattern => pattern.test(filename));
    }
    
    function isFrontendFile(filename) {
      // Heuristics to determine if it's a frontend file  
      const frontendPatterns = [
        /component/i, /page/i, /screen/i, /view/i,
        /ui/i, /frontend/i, /client/i, /app/i,
        /hook/i, /context/i, /store/i, /reducer/i
      ];
      
      return frontendPatterns.some(pattern => pattern.test(filename));
    }
    
    function isIntentionallyIgnored(param) {
      if (!param || !param.name) return false;
      
      const ignoredPatterns = [
        'ignored', '_', '__', 'unused', 'ignore', 
        '_error', '_err', '_e', 'ignored_error'
      ];
      
      const paramName = param.name.toLowerCase();
      return ignoredPatterns.some(pattern => 
        paramName === pattern || paramName.includes('ignored')
      );
    }
    
    function hasFrontendErrorHandling(body) {
      // Check for common frontend error handling patterns
      const bodyText = context.getSourceCode().getText(body);
      const frontendPatterns = [
        /show.*error/i, /display.*error/i, /toast/i, /alert/i,
        /notification/i, /modal/i, /snackbar/i, /message/i,
        /set.*error/i, /error.*state/i, /ui.*error/i
      ];
      
      return frontendPatterns.some(pattern => pattern.test(bodyText));
    }

    return {
      CatchClause(node) {
        const filename = context.getFilename();
        const body = node.body && node.body.body;
        const param = node.param;
        
        // Allow intentionally ignored parameters
        if (allowIgnoredParams && isIntentionallyIgnored(param)) {
          return;
        }
        
        // Check if catch block is empty
        if (!Array.isArray(body) || body.length === 0) {
          const isBackend = isBackendFile(filename);
          const isFrontend = isFrontendFile(filename);
          
          // For backend files, always report
          if (isBackend) {
            context.report({
              node,
              messageId: "emptyCatchBackend"
            });
            return;
          }
          
          // For frontend files, be more lenient if option is set
          if (isFrontend && allowFrontend) {
            return; // Allow empty catch in frontend
          }
          
          // Default behavior for unclassified files
          context.report({
            node,
            messageId: "emptyCatch"
          });
          return;
        }
        
        // Check for proper error handling in non-empty blocks
        const hasLogging = body.some(statement => {
          const text = context.getSourceCode().getText(statement);
          return /console\.(error|warn|log)|logger\.|log\(|throw\s/i.test(text);
        });
        
        const isBackend = isBackendFile(filename);
        const isFrontend = isFrontendFile(filename);
        
        // Backend should have logging or re-throwing
        if (isBackend && !hasLogging) {
          // Check if there's at least some error handling
          const hasAnyHandling = body.some(statement => {
            const text = context.getSourceCode().getText(statement);
            return /error|err|exception|fail/i.test(text);
          });
          
          if (!hasAnyHandling) {
            context.report({
              node,
              messageId: "emptyCatchBackend"
            });
          }
        }
        
        // Frontend can handle through UI
        if (isFrontend && allowFrontend) {
          const hasFrontendHandling = hasFrontendErrorHandling(node.body);
          if (hasLogging || hasFrontendHandling) {
            return; // OK for frontend
          }
        }
      }
    };
  }
};
