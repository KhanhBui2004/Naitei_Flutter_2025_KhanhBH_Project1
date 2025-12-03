/**
 * SunLint ESLint Plugin - Organized Rules Index
 * 🔹 22 Common Rules | 🔒 49 Security Rules | 📘 13 TypeScript Rules
 */

// 🔹 Common Rules (C-series) - General coding standards
const c002 = require("./rules/common/c002-no-duplicate-code.js");
const c003 = require("./rules/common/c003-no-vague-abbreviations.js");
const c006 = require("./rules/common/c006-function-name-verb-noun.js");
const c010 = require("./rules/common/c010-limit-block-nesting.js");
const c013 = require("./rules/common/c013-no-dead-code.js");
const c014 = require("./rules/common/c014-abstract-dependency-preferred.js");
const c017 = require("./rules/common/c017-limit-constructor-logic.js");
const c018 = require("./rules/common/c018-no-generic-throw.js");
const c023 = require("./rules/common/c023-no-duplicate-variable-name-in-scope.js");
const c041 = require("./rules/common/c041-no-config-inline.js");
const c029 = require("./rules/common/c029-catch-block-logging.js");
const c030 = require("./rules/common/c030-use-custom-error-classes.js");
const c035 = require("./rules/common/c035-no-empty-catch.js");
const c042 = require("./rules/common/c042-boolean-name-prefix.js");
const c043 = require("./rules/common/c043-no-console-or-print.js");
const c047 = require("./rules/common/c047-no-duplicate-retry-logic.js");
const c072 = require("./rules/common/c072-one-assert-per-test.js");
const c075 = require("./rules/common/c075-explicit-function-return-types.js");

// 📘 TypeScript Rules (T-series)
const t002 = require("./rules/typescript/t002-interface-prefix-i.js");
const t003 = require("./rules/typescript/t003-ts-ignore-reason.js");
const t004 = require("./rules/typescript/t004-no-empty-type.js");
const t007 = require("./rules/typescript/t007-no-fn-in-constructor.js");
const t010 = require("./rules/typescript/t010-no-nested-union-tuple.js");
const t019 = require("./rules/typescript/t019-no-this-assign.js");
const t020 = require("./rules/typescript/t020-no-default-multi-export.js");
const t021 = require("./rules/typescript/t021-limit-nested-generics.js");

// 🔒 Security Rules (S-series)  
const s001 = require("./rules/security/s001-fail-securely.js");
const s002 = require("./rules/security/s002-idor-check.js");
const s003 = require("./rules/security/s003-no-unvalidated-redirect.js");
const s005 = require("./rules/security/s005-no-origin-auth.js");
const s006 = require("./rules/security/s006-activation-recovery-secret-not-plaintext.js");
const s007 = require("./rules/security/s007-no-plaintext-otp.js");
const s008 = require("./rules/security/s008-crypto-agility.js");
const s009 = require("./rules/security/s009-no-insecure-crypto.js");
const s010 = require("./rules/security/s010-no-insecure-random-in-sensitive-context.js");
const s011 = require("./rules/security/s011-no-insecure-uuid.js");
const s012 = require("./rules/security/s012-hardcode-secret.js");
const s013 = require("./rules/security/s013-verify-tls-connection.js");
const s014 = require("./rules/security/s014-insecure-tls-version.js");
const s015 = require("./rules/security/s015-insecure-tls-certificate.js");
const s016 = require("./rules/security/s016-sensitive-query-parameter.js");
const s017 = require("./rules/security/s017-no-sql-injection.js");
const s018 = require("./rules/security/s018-positive-input-validation.js");
const s019 = require("./rules/security/s019-no-raw-user-input-in-email.js");
const s020 = require("./rules/security/s020-no-eval-dynamic-execution.js");
const s022 = require("./rules/security/s022-output-encoding.js");
const s023 = require("./rules/security/s023-no-json-injection.js");
const s025 = require("./rules/security/s025-server-side-input-validation.js");
const s026 = require("./rules/security/s026-json-schema-validation.js");
const s027 = require("./rules/security/s027-no-hardcoded-secrets.js");
const s029 = require("./rules/security/s029-require-csrf-protection.js");
const s030 = require("./rules/security/s030-no-directory-browsing.js");
const s033 = require("./rules/security/s033-require-samesite-cookie.js");
const s034 = require("./rules/security/s034-require-host-cookie-prefix.js");
const s035 = require("./rules/security/s035-cookie-specific-path.js");
const s036 = require("./rules/security/s036-no-unsafe-file-include.js");
const s037 = require("./rules/security/s037-require-anti-cache-headers.js");
const s038 = require("./rules/security/s038-no-version-disclosure.js");
const s039 = require("./rules/security/s039-no-session-token-in-url.js");
const s041 = require("./rules/security/s041-require-session-invalidate-on-logout.js");
const s042 = require("./rules/security/s042-require-periodic-reauthentication.js");
const s043 = require("./rules/security/s043-terminate-sessions-on-password-change.js");
const s044 = require("./rules/security/s044-require-full-session-for-sensitive-operations.js");
const s045 = require("./rules/security/s045-anti-automation-controls.js");
const s046 = require("./rules/security/s046-secure-notification-on-auth-change.js");
const s047 = require("./rules/security/s047-secure-random-passwords.js");
const s048 = require("./rules/security/s048-password-credential-recovery.js");
const s050 = require("./rules/security/s050-session-token-weak-hash.js");
const s052 = require("./rules/security/s052-secure-random-authentication-code.js");
const s054 = require("./rules/security/s054-verification-default-account.js");
const s055 = require("./rules/security/s055-verification-rest-check-the-incoming-content-type.js");
const s057 = require("./rules/security/s057-utc-logging.js");
const s058 = require("./rules/security/s058-no-ssrf.js");

module.exports = {
  rules: {
    "c002-no-duplicate-code": c002,
    "c003-no-vague-abbreviations": c003,
    "c006-function-name-verb-noun": c006,
    "c010-limit-block-nesting": c010,
    "c013-no-dead-code": c013,
    "c014-abstract-dependency-preferred": c014,
    "c017-limit-constructor-logic": c017,
    "c018-no-generic-throw": c018,
    "c030-use-custom-error-classes": c030,
    "c035-no-empty-catch": c035,
    "c023-no-duplicate-variable-name-in-scope": c023,
    "c029-catch-block-logging": c029,
    "c041-no-config-inline": c041,
    "c042-boolean-name-prefix": c042,
    "c043-no-console-or-print": c043,
    "c047-no-duplicate-retry-logic": c047,
    "c072-one-assert-per-test": c072,
    "c075-explicit-function-return-types": c075,
    "t002-interface-prefix-i": t002,
    "t003-ts-ignore-reason": t003,
    "t004-no-empty-type": t004,
    "t007-no-fn-in-constructor": t007,
    "t010-no-nested-union-tuple": t010,
    "t019-no-this-assign": t019,
    "t020-no-default-multi-export": t020,
    "t021-limit-nested-generics": t021,
    // Security rules
    "typescript_s001": s001,
    "typescript_s002": s002,
    "typescript_s003": s003,
    "typescript_s005": s005,
    "typescript_s006": s006,
    "typescript_s007": s007,
    "typescript_s008": s008,
    "typescript_s009": s009,
    "typescript_s010": s010,
    "typescript_s011": s011,
    "typescript_s012": s012,
    "typescript_s013": s013,
    "typescript_s014": s014,
    "typescript_s015": s015,
    "typescript_s016": s016,
    "typescript_s017": s017,
    "typescript_s018": s018,
    "typescript_s019": s019,
    "typescript_s020": s020,
    "typescript_s022": s022,
    "typescript_s023": s023,
    "typescript_s025": s025,
    "typescript_s026": s026,
    "typescript_s027": s027,
    "typescript_s029": s029,
    "typescript_s030": s030,
    "typescript_s033": s033,
    "typescript_s034": s034,
    "typescript_s035": s035,
    "typescript_s036": s036,
    "typescript_s037": s037,
    "typescript_s038": s038,
    "typescript_s039": s039,
    "typescript_s041": s041,
    "typescript_s042": s042,
    "typescript_s043": s043,
    "typescript_s044": s044,
    "typescript_s045": s045,
    "typescript_s046": s046,
    "typescript_s047": s047,
    "typescript_s048": s048,
    "typescript_s050": s050,
    "typescript_s052": s052,
    "typescript_s054": s054,
    "typescript_s055": s055,
    "typescript_s057": s057,
    "typescript_s058": s058
  }
};
