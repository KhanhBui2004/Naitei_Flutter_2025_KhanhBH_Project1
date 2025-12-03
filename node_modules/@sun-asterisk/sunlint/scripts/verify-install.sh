#!/bin/bash

# SunLint v1.0.4 Quick Verification Script
# Following Rule C005: Single responsibility - verify installation only

echo "🧪 SunLint v1.0.4 Quick Verification"
echo "=================================="

# Check if sunlint is installed
if ! command -v sunlint &> /dev/null; then
    echo "❌ SunLint not found in PATH"
    echo "💡 Install with: npm install -g ./sun-sunlint-1.0.4.tgz"
    exit 1
fi

# Check version
echo "📋 Checking version..."
VERSION=$(sunlint --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
if [ "$VERSION" = "1.0.4" ]; then
    echo "✅ Version: $VERSION"
else
    echo "❌ Expected version 1.0.4, got: $VERSION"
    exit 1
fi

# Create test file
echo "📁 Creating test file..."
TEST_FILE="/tmp/sunlint-test-security.ts"
cat > "$TEST_FILE" << 'EOF'
function doAdminTask() {}
function isAuthenticated(req: any): boolean { return true; }

function doPost(request: any, response: any) {
  const origin = request.getHeader("Origin");
  if (origin === "https://admin.example.com") {
    doAdminTask();
  }
}
EOF

# Test security rules
echo "🔒 Testing security rules..."
SECURITY_OUTPUT=$(sunlint --security --typescript --input="$TEST_FILE" 2>&1)
if echo "$SECURITY_OUTPUT" | grep -q "S005"; then
    echo "✅ Security rules working (S005 detected)"
else
    echo "❌ Security rules not working"
    echo "Output: $SECURITY_OUTPUT"
    rm -f "$TEST_FILE"
    exit 1
fi

# Test quality rules  
echo "✨ Testing quality rules..."
QUALITY_OUTPUT=$(sunlint --quality --typescript --input="$TEST_FILE" 2>&1)
if echo "$QUALITY_OUTPUT" | grep -q "No violations found"; then
    echo "✅ Quality rules working"
else
    echo "⚠️  Quality rules output: $QUALITY_OUTPUT"
fi

# Test all rules
echo "🎯 Testing all rules..."
ALL_OUTPUT=$(sunlint --all --typescript --input="$TEST_FILE" 2>&1)
if echo "$ALL_OUTPUT" | grep -q "44 rules"; then
    echo "✅ All rules loaded (44 total)"
else
    echo "⚠️  All rules output: $ALL_OUTPUT"
fi

# Cleanup
rm -f "$TEST_FILE"

echo ""
echo "🎉 SunLint v1.0.4 verification completed!"
echo ""
echo "📖 Usage examples:"
echo "   sunlint --security --typescript --input=src/"
echo "   sunlint --quality --typescript --input=src/"  
echo "   sunlint --all --typescript --input=src/"
echo ""
echo "✅ Ready to secure your codebase!"
