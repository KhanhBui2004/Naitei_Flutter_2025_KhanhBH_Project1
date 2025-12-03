// Keywords for parsing markdown files
const KEYWORDS = {
    OBJECTIVE: ["**Mục tiêu**:", "**Objective**:"],
    DETAILS: ["**Chi tiết**:", "**Details**:"],
    APPLIES_TO: ["**Áp dụng**:", "**Applies to**:"],
    TOOLS: ["**Tool**:", "**Tools**:", "**Công cụ**:"],
    PRINCIPLES: ["**Principles**:", "**Nguyên tắc**:"],
    VERSION: ["**Version**:", "**Phiên bản**:"],
    STATUS: ["**Status**:", "**Trạng thái**:"],
    SEVERITY: ["**Severity**:", "**Mức độ**:"],
    GOOD_EXAMPLE: ["**Ví dụ đúng**:", "**Good example**:", "**Correct example**:"],
    BAD_EXAMPLE: ["**Ví dụ sai**:", "**Bad example**:", "**Incorrect example**:"],
    CONFIG: [
        "**Config**:",
        "**Configuration**:",
        "**Cấu hình**:",
        "**ESLint Config**:",
        "**TSConfig**:",
        "**SonarQube Config**:",
        "**Detekt Config**:",
        "**PMD Config**:",
        "**Prettier Config**:",
        "**Ktlint Config**:",
        "**Pre-commit Hook**:",
        "**CI Check Script**:",
    ],
}

module.exports = {
    KEYWORDS,
}