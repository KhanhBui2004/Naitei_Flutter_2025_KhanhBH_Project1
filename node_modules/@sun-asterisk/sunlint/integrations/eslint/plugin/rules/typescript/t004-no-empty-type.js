/**
 * Custom ESLint rule for: T019 – Disallow empty type definitions
 * Rule ID: custom/t019
 * Purpose: Prevent empty type definitions and suggest more specific types
 */

"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow empty type definitions",
      category: "TypeScript",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      emptyType: "Empty type definition is not allowed. Add at least one property or use a more specific type.",
    },
  },

  create(context) {
    // Helper function to get a more specific type suggestion based on the name
    function getSuggestedType(name) {
      const lowerName = name.toLowerCase();
      
      // Suggest more specific types based on common naming patterns
      if (lowerName.includes("config") || lowerName.includes("options")) {
        return "Record<string, unknown>";
      }
      if (lowerName.includes("props")) {
        return "Record<string, React.ReactNode>";
      }
      if (lowerName.includes("state")) {
        return "Record<string, unknown>";
      }
      if (lowerName.includes("params")) {
        return "Record<string, string | number | boolean>";
      }
      if (lowerName.includes("result") || lowerName.includes("response")) {
        return "Record<string, unknown>";
      }
      if (lowerName.includes("event") || lowerName.includes("handler")) {
        return "(...args: unknown[]) => void";
      }
      if (lowerName.includes("callback") || lowerName.includes("fn")) {
        return "(...args: unknown[]) => unknown";
      }
      if (lowerName.includes("data") || lowerName.includes("item")) {
        return "Record<string, unknown>";
      }
      
      // Default suggestion
      return "Record<string, unknown>";
    }

    return {
      TSInterfaceDeclaration(node) {
        if (node.body.body.length === 0) {
          const suggestedType = getSuggestedType(node.id.name);
          context.report({
            node: node.body,
            messageId: "emptyType",
            fix(fixer) {
              return fixer.replaceText(
                node,
                `type ${node.id.name} = ${suggestedType};`
              );
            },
          });
        }
      },
      TSTypeAliasDeclaration(node) {
        if (
          node.typeAnnotation.type === "TSTypeLiteral" &&
          node.typeAnnotation.members.length === 0
        ) {
          const suggestedType = getSuggestedType(node.id.name);
          context.report({
            node: node.typeAnnotation,
            messageId: "emptyType",
            fix(fixer) {
              return fixer.replaceText(
                node.typeAnnotation,
                suggestedType
              );
            },
          });
        }
      },
    };
  },
};
