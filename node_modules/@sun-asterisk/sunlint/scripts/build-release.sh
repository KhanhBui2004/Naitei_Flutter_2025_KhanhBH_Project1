#!/bin/bash

# SunLint Release Packaging Script v1.0.4
# Following Rule C005: Single responsibility - handle release packaging only

set -e

echo "🚀 Building SunLint v1.0.4 Release Package..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf *.tgz
rm -rf coverage/
rm -rf reports/
rm -rf *.log

# Verify package.json version
echo "📋 Verifying package version..."
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [ "$PACKAGE_VERSION" != "1.0.4" ]; then
    echo "❌ Package version mismatch. Expected 1.0.4, got $PACKAGE_VERSION"
    exit 1
fi

# Run tests before packaging (skip if not available)
echo "🧪 Running tests..."
if [ -f "test/unit/test-runner.js" ]; then
    npm test || {
        echo "❌ Tests failed. Aborting release."
        exit 1
    }
else
    echo "⚠️  Test files not found, skipping tests..."
fi

# Lint the codebase
echo "🔍 Running self-lint check..."
node cli.js --quality --typescript --input=core/ || {
    echo "❌ Self-lint check failed. Fix issues before release."
    exit 1
}

# Security self-check
echo "🔒 Running security self-check..."
node cli.js --security --typescript --input=core/ || {
    echo "⚠️  Security issues detected, but continuing with release..."
}

# Verify critical files exist
echo "📁 Verifying critical files..."
CRITICAL_FILES=(
    "cli.js"
    "package.json"
    "README.md"
    "CHANGELOG.md"
    "config/rules/rules-registry.json"
    "core/cli-program.js"
    "core/cli-action-handler.js"
    "core/typescript-engine.js"
    "core/analysis-orchestrator.js"
    "core/rule-selection-service.js"
    "core/rule-mapping-service.js"
    "integrations/eslint/configs/.eslintrc.js"
    "integrations/eslint/plugin/index.js"
    "integrations/eslint/plugin/package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Critical file missing: $file"
        exit 1
    fi
done

# Verify security rules are present
echo "🔒 Verifying security rules..."
SECURITY_RULE_COUNT=$(ls integrations/eslint/plugin/rules/security/s*.js 2>/dev/null | wc -l)
if [ "$SECURITY_RULE_COUNT" -lt 40 ]; then
    echo "❌ Expected 40+ security rules, found $SECURITY_RULE_COUNT"
    exit 1
fi

# Create npm package
echo "📦 Creating npm package..."
npm pack

# Verify package was created
PACKAGE_FILE="sun-sunlint-1.0.4.tgz"
if [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ Package file not created: $PACKAGE_FILE"
    exit 1
fi

# Get package size
PACKAGE_SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)

echo "✅ Release package created successfully!"
echo ""
echo "📦 Package Details:"
echo "   📄 File: $PACKAGE_FILE"
echo "   📊 Size: $PACKAGE_SIZE"
echo "   🔢 Version: 1.0.4"
echo "   📅 Date: $(date)"
echo ""
echo "🎯 Release Features:"
echo "   ✅ 40 Security Rules (S005-S058)"
echo "   ✅ 4 Quality Rules (C006, C019, C029, C031)"
echo "   ✅ Category-based filtering (--security, --quality)"
echo "   ✅ Dynamic rule configuration"
echo "   ✅ Enhanced ESLint integration"
echo ""
echo "🚀 Installation Commands:"
echo "   Global: npm install -g ./$PACKAGE_FILE"
echo "   Local:  npm install ./$PACKAGE_FILE"
echo "   Direct: npm install -g https://github.com/sun-asterisk/engineer-excellence/releases/download/sunlint-v1.0.4/$PACKAGE_FILE"
echo ""
echo "🎉 Ready for release!"
