#!/bin/bash

# SunLint v1.0.5 Manual Release Script
# Fallback for manual release if GitHub Actions fails

set -e

echo "🔧 =========================================="
echo "☀️  SunLint v1.0.5 Manual Release"
echo "🔧 =========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERSION="1.0.5"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "cli.js" ] || [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in SunLint directory!${NC}"
        exit 1
    fi
    
    # Check if npm is logged in for GitHub Package Registry
    if ! npm whoami --registry=https://npm.pkg.github.com &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged in to GitHub Package Registry${NC}"
        echo "Please run: npm login --registry=https://npm.pkg.github.com"
        echo "Username: your-github-username"
        echo "Password: your-github-token"
        echo "Email: your-email"
        return 1
    fi
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI not found, GitHub release will be skipped${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo ""
}

# Prepare packages
prepare_packages() {
    echo -e "${BLUE}📦 Preparing packages...${NC}"
    
    # 1. Update version in main package.json
    echo "Updating main package.json version..."
    npm version "$VERSION" --no-git-tag-version
    
    # 2. Update GitHub package version
    echo "Updating GitHub package version..."
    cp package-github.json package.json
    npm version "$VERSION" --no-git-tag-version
    
    echo -e "${GREEN}✅ Package versions updated${NC}"
    echo ""
}

# Run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    if npm test; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    echo ""
}

# Build package
build_package() {
    echo -e "${BLUE}🔨 Building package...${NC}"
    
    # Clean previous builds
    rm -f *.tgz
    
    # Build package
    npm pack
    
    # Rename to standard format
    mv *.tgz "sunlint-$VERSION.tgz"
    
    echo -e "${GREEN}✅ Package built: sunlint-$VERSION.tgz${NC}"
    echo ""
}

# Publish to GitHub Package Registry
publish_github_package() {
    echo -e "${BLUE}📤 Publishing to GitHub Package Registry...${NC}"
    
    if npm publish --registry=https://npm.pkg.github.com; then
        echo -e "${GREEN}✅ Published to GitHub Package Registry${NC}"
        echo "Package: @sun-asterisk/sunlint@$VERSION"
        echo "Registry: https://npm.pkg.github.com"
    else
        echo -e "${RED}❌ Failed to publish to GitHub Package Registry${NC}"
        return 1
    fi
    echo ""
}

# Create GitHub release
create_github_release() {
    echo -e "${BLUE}🚀 Creating GitHub Release...${NC}"
    
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI not available, skipping GitHub release${NC}"
        echo "Manual steps:"
        echo "1. Go to: https://github.com/sun-asterisk/engineer-excellence/releases/new"
        echo "2. Tag: sunlint-v$VERSION"
        echo "3. Title: SunLint v$VERSION"
        echo "4. Upload: sunlint-$VERSION.tgz"
        return 0
    fi
    
    # Create release with tarball
    if gh release create "sunlint-v$VERSION" \
        --repo sun-asterisk/engineer-excellence \
        --title "SunLint v$VERSION" \
        --notes "$(cat << EOF
# ☀️ SunLint v$VERSION Release

## 🚀 Installation Methods

### Global Installation (Recommended)
\`\`\`bash
# Install globally for CLI usage
npm install -g @sun-asterisk/sunlint
\`\`\`

### GitHub Package Registry
\`\`\`bash
# Configure GitHub Package Registry
echo "@sun-asterisk:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" >> ~/.npmrc

# Install from GitHub Packages
npm install -g @sun-asterisk/sunlint
\`\`\`

### Direct Download
\`\`\`bash
# Install from release tarball
npm install -g https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v$VERSION/sunlint-$VERSION.tgz
\`\`\`

### Project Integration
\`\`\`bash
# Add to project dependencies
npm install --save-dev @sun-asterisk/sunlint
\`\`\`

## ✨ New Features in v$VERSION

- 🔗 **ESLint Integration**: Merge existing ESLint rules with SunLint
- 🔀 **Git Integration**: \`--changed-files\`, \`--staged-files\`, \`--pr-mode\`
- 🟦 **Enhanced TypeScript Support**: Native TypeScript analysis engine
- 📦 **NPM Package Support**: \`devDependencies\` integration
- 🏗️ **Team Adoption**: Zero-disruption integration for existing workflows

## 📖 Documentation

- [📋 Main README](https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint/README.md)
- [🔗 ESLint Integration Guide](https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint/docs/ESLINT_INTEGRATION.md)
- [⚙️ Configuration Examples](https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint/examples/)

## 🧪 Verification

\`\`\`bash
# Verify installation
sunlint --version

# Test basic functionality
sunlint --rule=C006 --input=src

# Test ESLint integration
sunlint --all --eslint-integration --input=src

# Test Git integration
sunlint --all --changed-files
\`\`\`
EOF
)" \
        "sunlint-$VERSION.tgz"; then
        
        echo -e "${GREEN}✅ GitHub Release created successfully${NC}"
        echo "Release: https://github.com/sun-asterisk/engineer-excellence/releases/tag/sunlint-v$VERSION"
    else
        echo -e "${RED}❌ Failed to create GitHub Release${NC}"
        return 1
    fi
    echo ""
}

# Verify installation
verify_installation() {
    echo -e "${BLUE}🧪 Verifying installation...${NC}"
    
    # Test GitHub Package Registry installation
    echo "Testing GitHub Package Registry installation..."
    if npm view @sun-asterisk/sunlint@$VERSION --registry=https://npm.pkg.github.com &> /dev/null; then
        echo -e "${GREEN}✅ Package available on GitHub Package Registry${NC}"
    else
        echo -e "${YELLOW}⚠️  Package not yet available on GitHub Package Registry (may take a few minutes)${NC}"
    fi
    
    # Test tarball
    echo "Testing tarball installation..."
    if [ -f "sunlint-$VERSION.tgz" ]; then
        echo -e "${GREEN}✅ Tarball ready: sunlint-$VERSION.tgz${NC}"
    else
        echo -e "${RED}❌ Tarball missing${NC}"
    fi
    echo ""
}

# Show release summary
show_summary() {
    echo "🎉 =========================================="
    echo "✨ SunLint v$VERSION Manual Release Complete!"
    echo "🎉 =========================================="
    echo ""
    
    echo -e "${GREEN}📦 Installation Commands:${NC}"
    echo ""
    echo "1. GitHub Package Registry:"
    echo "   npm install -g @sun-asterisk/sunlint"
    echo ""
    echo "2. Direct Tarball:"
    echo "   npm install -g https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v$VERSION/sunlint-$VERSION.tgz"
    echo ""
    
    echo -e "${BLUE}🔗 Release Links:${NC}"
    echo "• GitHub Packages: https://github.com/sun-asterisk/engineer-excellence/packages"
    echo "• GitHub Releases: https://github.com/sun-asterisk/engineer-excellence/releases"
    echo "• Documentation: https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint"
    echo ""
    
    echo -e "${YELLOW}🧪 Test Installation:${NC}"
    echo "npm install -g @sun-asterisk/sunlint && sunlint --version"
    echo ""
    
    echo -e "${GREEN}✨ Next Steps:${NC}"
    echo "1. Test installation from both sources"
    echo "2. Update team documentation"
    echo "3. Announce to development teams"
    echo "4. Monitor adoption and feedback"
}

# Main execution
main() {
    echo "Starting manual release process for SunLint v$VERSION..."
    echo ""
    
    # Run all steps
    check_prerequisites || exit 1
    
    echo -e "${YELLOW}⚠️  About to release SunLint v$VERSION manually${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Release cancelled"
        exit 0
    fi
    
    prepare_packages
    run_tests
    build_package
    
    # Publish steps
    if publish_github_package; then
        echo -e "${GREEN}✅ GitHub Package Registry publication successful${NC}"
    else
        echo -e "${RED}❌ GitHub Package Registry publication failed${NC}"
        echo "Continue with GitHub Release? (y/N): "
        read -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    create_github_release
    verify_installation
    show_summary
    
    echo -e "${GREEN}🎊 Manual release completed successfully!${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --github-only)
            GITHUB_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --version VERSION    Release version (default: $VERSION)"
            echo "  --skip-tests         Skip running tests"
            echo "  --github-only        Only create GitHub release (skip package registry)"
            echo "  --help               Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main
