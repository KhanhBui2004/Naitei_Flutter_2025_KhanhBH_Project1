/**
 * ESLint Rule: S054 - Verify shared or default accounts are not present (e.g. "root", "admin", or "sa").
 * Rule ID: custom/s054
 * Description: Ensure that shared or default accounts like "root", "admin", or "sa" are not used in the codebase.
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow use of default accounts without value check",
      category: "Best Practices",
      recommended: false,
    },
    messages: {
      missingValidation: "Default account used without validation.",
    },
    schema: [],
  },

  create(context) {
    const defaultAccounts = ["root", "admin", "sa"];
    const sourceCode = context.getSourceCode();

    function isAccountRelatedFunction(node) {
      const name =
        (node.type === "FunctionDeclaration" && node.id?.name) ||
        (node.type === "MethodDefinition" && node.key?.name) ||
        "";
      return /account|user|login|access/i.test(name);
    }

    // Check if validation exists in code like: if (x === "admin")
    function hasValidation(node) {
      let validated = false;

      context.getSourceCode().getTokens(node).forEach((token, idx, tokens) => {
        const prev = tokens[idx - 1]?.value || "";
        const next = tokens[idx + 1]?.value || "";

        if (
          token.type === "String" &&
          defaultAccounts.includes(token.value.replace(/['"]/g, "")) &&
          (prev === "===" || prev === "!==" || next === "===" || next === "!==")
        ) {
          validated = true;
        }
      });

      return validated;
    }

    // Check if any default account string is used (directly or via const)
    function hasDefaultAccountUsage(node) {
      const tokens = context.getSourceCode().getTokens(node);
      return tokens.some((token) => {
        return (
          token.type === "String" &&
          defaultAccounts.includes(token.value.replace(/['"]/g, ""))
        );
      });
    }

    function hasDefaultConstantUsage(node) {
      const scope = sourceCode.scopeManager.acquire(node);
      if (!scope) return false;

      const defaultVars = scope.variables.filter((v) => {
        const def = v.defs[0];
        return (
          def &&
          def.node.init &&
          typeof def.node.init.value === "string" &&
          defaultAccounts.includes(def.node.init.value)
        );
      });

      const fnText = sourceCode.getText(node);
      return defaultVars.some((v) => fnText.includes(v.name));
    }

    function checkFunction(node) {
      const usesDefaultAccount =
        hasDefaultAccountUsage(node) || hasDefaultConstantUsage(node);

      if (usesDefaultAccount && !hasValidation(node)) {
        context.report({
          node,
          messageId: "missingValidation",
        });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (isAccountRelatedFunction(node)) {
          checkFunction(node);
        }
      },
      MethodDefinition(node) {
        if (isAccountRelatedFunction(node)) {
          checkFunction(node);
        }
      },
    };
  },
};
