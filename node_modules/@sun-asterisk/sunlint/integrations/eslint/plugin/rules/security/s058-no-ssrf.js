/**
 * Custom ESLint rule: S058 – Detect possible SSRF via unvalidated user-controlled URLs
 * Rule ID: custom/s058
 */

"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Detect SSRF vulnerabilities via unvalidated user-controlled URLs",
      recommended: true,
    },
    schema: [],
    messages: {
      ssrfRisk:
        "Possible SSRF: URL '{{url}}' comes from untrusted source. Validate or sanitize input.",
    },
  },

  create(context) {
    const riskySources = [
      "req.body",
      "req.query",
      "req.params",
      "input",
      "form",
    ];
    const riskyFunctions = [
      "fetch",
      "axios.get",
      "axios.post",
      "axios.request",
      "http.request",
      "https.request",
    ];

    function isUserInput(nodeText) {
      return riskySources.some((src) => nodeText.includes(src));
    }

    function isHttpFunction(callee) {
      if (callee.type === "Identifier")
        return riskyFunctions.includes(callee.name);
      if (callee.type === "MemberExpression") {
        const fullName = `${callee.object.name}.${callee.property.name}`;
        return riskyFunctions.includes(fullName);
      }
      return false;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!isHttpFunction(callee)) return;

        const firstArg = node.arguments[0];
        if (!firstArg) return;

        const argText = context.getSourceCode().getText(firstArg);
        if (isUserInput(argText)) {
          context.report({
            node: firstArg,
            messageId: "ssrfRisk",
            data: { url: argText },
          });
        }
      },
    };
  },
};
