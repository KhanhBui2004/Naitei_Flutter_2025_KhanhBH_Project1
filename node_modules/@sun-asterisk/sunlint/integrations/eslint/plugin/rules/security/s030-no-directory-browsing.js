/**
 * Custom ESLint rule: S030 – Prevent directory browsing and metadata disclosure
 * Rule ID: custom/s030
 * Purpose: Disallow unsafe static serving or exposure of internal metadata files
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent directory browsing and metadata file disclosure",
      recommended: true,
    },
    schema: [],
    messages: {
      unsafeStatic:
        "Directory browsing might be enabled via static file serving. Explicitly set `index: false` if not intended.",
      exposeMetaFile:
        "Avoid exposing internal files or folders such as '.git', '.svn', '.DS_Store', or 'Thumbs.db'.",
    },
  },

  create(context) {
    const metaFileNames = [".git", ".svn", ".DS_Store", "Thumbs.db"];

    return {
      CallExpression(node) {
        const callee = node.callee;

        // Detect express.static(...) or serveStatic(...)
        if (
          (callee.type === "MemberExpression" &&
            callee.property.name === "static") ||
          (callee.type === "Identifier" && callee.name === "serveStatic")
        ) {
          const optionsArg = node.arguments[1];

          let hasIndexFalse = false;
          if (optionsArg && optionsArg.type === "ObjectExpression") {
            hasIndexFalse = optionsArg.properties.some((prop) => {
              return (
                prop.key.name === "index" &&
                prop.value.type === "Literal" &&
                prop.value.value === false
              );
            });
          }

          if (!hasIndexFalse) {
            context.report({
              node,
              messageId: "unsafeStatic",
            });
          }
        }

        // Detect serving meta files directly
        if (
          node.arguments &&
          node.arguments.some((arg) => {
            return (
              arg.type === "Literal" &&
              typeof arg.value === "string" &&
              metaFileNames.some((name) => arg.value.includes(name))
            );
          })
        ) {
          context.report({
            node,
            messageId: "exposeMetaFile",
          });
        }
      },
    };
  },
};
