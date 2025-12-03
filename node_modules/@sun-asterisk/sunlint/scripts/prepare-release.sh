#!/bin/bash

# SunLint Release Preparation Script
# Prepares assets for GitHub release

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUNLINT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION=$(node -p "require('$SUNLINT_DIR/package.json').version")
RELEASE_DIR="$SUNLINT_DIR/release"

echo -e "${BLUE}☀️  SunLint Release Preparation${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}SunLint Dir: ${SUNLINT_DIR}${NC}"

# Create release directory
mkdir -p "$RELEASE_DIR"

# Clean previous assets
echo -e "${YELLOW}Cleaning previous release assets...${NC}"
rm -f "$RELEASE_DIR"/*.tgz
rm -f "$RELEASE_DIR"/*.zip
rm -f "$RELEASE_DIR"/sunlint-installer.sh

# Navigate to SunLint directory
cd "$SUNLINT_DIR"

# Run tests if available (skip if not found)
if [ -f "test/unit/test-runner.js" ]; then
    echo -e "${YELLOW}Running tests...${NC}"
    npm test || {
        echo -e "${RED}❌ Tests failed. Aborting release preparation.${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️  No tests found, skipping test phase...${NC}"
fi

# Create npm package
echo -e "${YELLOW}Creating npm package...${NC}"
npm pack

# Move tarball to release directory
mv "sun-sunlint-${VERSION}.tgz" "$RELEASE_DIR/"

# Copy installer script
echo -e "${YELLOW}Preparing installer script...${NC}"
cp "$SCRIPT_DIR/install.sh" "$RELEASE_DIR/sunlint-installer.sh"

# Create release notes template
echo -e "${YELLOW}Creating release notes template...${NC}"
cat > "$RELEASE_DIR/RELEASE_NOTES.md" << EOF
# ☀️ SunLint CLI v${VERSION}

Multi-language coding standards checker with ESLint integration.

## 🚀 Quick Install

### Option 1: Direct from GitHub Release
\`\`\`bash
npm install -g https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v${VERSION}/sun-sunlint-${VERSION}.tgz
\`\`\`

### Option 2: One-line Installer
\`\`\`bash
curl -fsSL https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v${VERSION}/sunlint-installer.sh | bash
\`\`\`

### Option 3: Clone and Install
\`\`\`bash
git clone https://github.com/sun-asterisk/engineer-excellence.git
cd engineer-excellence/coding-quality/extensions/sunlint
npm install -g .
\`\`\`

## ✨ What's New in v${VERSION}

- 🎯 Modular CLI architecture for scalability
- 🔧 ESLint integration with 25+ custom TypeScript rules
- 📊 Multiple output formats (ESLint-compatible JSON, text, summary, table)
- 🚀 CI/CD ready with quiet mode and JSON output
- 📋 45+ coding quality and security rules
- 🛠 Extensible rule engine for future language support

## 🎮 Usage Examples

\`\`\`bash
# Quick quality check
sunlint --quality --input=src

# TypeScript analysis with all rules
sunlint --typescript --all --input=src

# CI/CD integration
sunlint --all --format=json --quiet --input=src

# Specific rule analysis
sunlint --rule=C006 --input=src --format=summary
\`\`\`

## 📋 Supported Rules

### Quality Rules (Core)
- **C006**: Function naming (verb-noun pattern)
- **C019**: Log level usage (no error for non-critical)
- **C029**: Catch block logging
- **C002**: No duplicate code
- **C003**: No vague abbreviations

### TypeScript-specific Rules (ESLint Integration)
- **25+ ESLint custom rules** for TypeScript best practices
- Function naming conventions
- Interface and type definitions
- Error handling patterns
- And more...

## 🔧 Command Options

\`\`\`bash
# Rule Selection
--rule <rule>              # Single rule (e.g., C006)
--all                      # All available rules
--quality                  # Quality-focused rules
--security                 # Security-focused rules
--category <category>      # Rules by category

# TypeScript Analysis
--typescript               # Enable TypeScript analysis
--typescript-engine <type> # Engine: eslint, heuristic, hybrid

# Output Control
--format <format>          # Output: eslint, json, summary, table
--quiet                    # Suppress non-error output
--output <file>            # Save to file

# Configuration
--config <file>            # Custom config file
--dry-run                  # Preview without running
--verbose                  # Detailed logging
--debug                    # Debug information
\`\`\`

## 🐛 Known Issues

- ESLint flat config format compatibility (fallback to core rules works)
- Some TypeScript rules require specific tsconfig.json setup

## 📖 Documentation

- [Installation Guide](./docs/DISTRIBUTION_GITHUB.md)
- [Usage Examples](./docs/COMMAND-EXAMPLES.md)
- [CI/CD Integration](./docs/CI-CD-GUIDE.md)
- [Configuration](./docs/CONFIGURATION-STRATEGY.md)

## 🔗 Links

- **Repository**: https://github.com/sun-asterisk/engineer-excellence
- **SunLint Location**: coding-quality/extensions/sunlint
- **Issues**: https://github.com/sun-asterisk/engineer-excellence/issues
- **Documentation**: https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint

---

**Installation Package**: \`sun-sunlint-${VERSION}.tgz\`  
**Installer Script**: \`sunlint-installer.sh\`  
**Package Size**: $(du -h "$RELEASE_DIR/sun-sunlint-${VERSION}.tgz" | cut -f1)

EOF

# Create checksums
echo -e "${YELLOW}Creating checksums...${NC}"
cd "$RELEASE_DIR"
sha256sum "sun-sunlint-${VERSION}.tgz" > "sun-sunlint-${VERSION}.tgz.sha256"
sha256sum "sunlint-installer.sh" > "sunlint-installer.sh.sha256"

# List release assets
echo -e "${GREEN}✅ Release preparation completed!${NC}"
echo -e "${BLUE}Release assets:${NC}"
ls -la "$RELEASE_DIR"

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${YELLOW}1. Review release notes: ${RELEASE_DIR}/RELEASE_NOTES.md${NC}"
echo -e "${YELLOW}2. Create GitHub release with tag: sunlint-v${VERSION}${NC}"
echo -e "${YELLOW}3. Upload assets:${NC}"
echo -e "   - sun-sunlint-${VERSION}.tgz"
echo -e "   - sunlint-installer.sh"
echo -e "   - *.sha256 files"
echo -e "${YELLOW}4. Test installation:${NC}"
echo -e "   npm install -g https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v${VERSION}/sun-sunlint-${VERSION}.tgz"

echo ""
echo -e "${GREEN}🎉 Ready for GitHub release!${NC}"
