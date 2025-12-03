/**
 * Custom ESLint rule: S038 – Prevent version disclosure in HTTP headers or response
 * Rule ID: custom/s038
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent exposing version info via HTTP headers or response bodies",
      recommended: true,
    },
    schema: [],
    messages: {
      headerLeak:
        "Do not expose version information via HTTP header '{{name}}'.",
      responseLeak: "Do not send version information in response: '{{text}}'.",
    },
  },

  create(context) {
    const riskyHeaders = ["x-powered-by", "server", "x-runtime", "x-version"];

    return {
      CallExpression(node) {
        const callee = node.callee;

        // res.setHeader("Header-Name", "value")
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "setHeader" &&
          node.arguments.length >= 2 &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string"
        ) {
          const headerName = node.arguments[0].value.toLowerCase();
          const headerValue = node.arguments[1];

          if (
            riskyHeaders.includes(headerName) &&
            headerValue.type === "Literal" &&
            typeof headerValue.value === "string" &&
            /\d+\.\d+/.test(headerValue.value) // has version pattern
          ) {
            context.report({
              node,
              messageId: "headerLeak",
              data: { name: headerName },
            });
          }
        }

        // res.send("Express 4.17.1") or res.end("NestJS 9.0")
        if (
          callee.type === "MemberExpression" &&
          ["send", "end", "json"].includes(callee.property.name) &&
          node.arguments.length &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string" &&
          /\d+\.\d+/.test(node.arguments[0].value)
        ) {
          context.report({
            node,
            messageId: "responseLeak",
            data: { text: node.arguments[0].value },
          });
        }
      },
    };
  },
};
