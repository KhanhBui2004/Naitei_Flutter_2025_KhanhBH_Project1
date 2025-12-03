#!/bin/bash

# SunLint v1.0.5 Release Trigger Script
# This script helps trigger and monitor the GitHub Actions release workflow

set -e

echo "🚀 =========================================="
echo "☀️  SunLint v1.0.5 Release Trigger"
echo "🚀 =========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="sun-asterisk/engineer-excellence"
WORKFLOW_FILE="release-sunlint.yml"
VERSION="1.0.5"
RELEASE_TYPE="both"  # both, github-package, global-tarball

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is required but not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "macOS: brew install gh"
    echo "Ubuntu: sudo apt install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Function to run pre-release tests
run_pre_release_tests() {
    echo -e "${BLUE}🧪 Running pre-release tests...${NC}"
    
    if [ -f "scripts/pre-release-test.sh" ]; then
        ./scripts/pre-release-test.sh
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Pre-release tests passed!${NC}"
            echo ""
            return 0
        else
            echo -e "${RED}❌ Pre-release tests failed!${NC}"
            echo ""
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Pre-release test script not found, skipping...${NC}"
        echo ""
        return 0
    fi
}

# Function to trigger GitHub Actions workflow
trigger_release_workflow() {
    echo -e "${BLUE}🚀 Triggering GitHub Actions release workflow...${NC}"
    echo ""
    echo "Parameters:"
    echo "  Repository: $REPO"
    echo "  Workflow: $WORKFLOW_FILE"
    echo "  Version: $VERSION"
    echo "  Release Type: $RELEASE_TYPE"
    echo ""
    
    # Trigger the workflow
    if gh workflow run "$WORKFLOW_FILE" \
        --repo "$REPO" \
        --field version="$VERSION" \
        --field release_type="$RELEASE_TYPE"; then
        
        echo -e "${GREEN}✅ Workflow triggered successfully!${NC}"
        echo ""
        
        # Wait a moment for the workflow to start
        echo "⏳ Waiting for workflow to start..."
        sleep 5
        
        # Get the latest workflow run
        echo -e "${BLUE}📋 Latest workflow runs:${NC}"
        gh run list --repo "$REPO" --workflow="$WORKFLOW_FILE" --limit=3
        
        echo ""
        echo -e "${BLUE}🔗 Workflow monitoring links:${NC}"
        echo "• Actions: https://github.com/$REPO/actions/workflows/release-sunlint.yml"
        echo "• Releases: https://github.com/$REPO/releases"
        echo "• Packages: https://github.com/$REPO/packages"
        
        return 0
    else
        echo -e "${RED}❌ Failed to trigger workflow!${NC}"
        return 1
    fi
}

# Function to monitor workflow progress
monitor_workflow() {
    echo ""
    echo -e "${BLUE}👀 Monitoring workflow progress...${NC}"
    
    # Get the latest run ID
    RUN_ID=$(gh run list --repo "$REPO" --workflow="$WORKFLOW_FILE" --limit=1 --json databaseId --jq '.[0].databaseId')
    
    if [ -n "$RUN_ID" ]; then
        echo "Workflow Run ID: $RUN_ID"
        echo ""
        
        # Watch the workflow
        echo "📺 Watching workflow (Ctrl+C to stop monitoring)..."
        gh run watch "$RUN_ID" --repo "$REPO" --exit-status
        
        # Check final status
        STATUS=$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')
        
        if [ "$STATUS" = "success" ]; then
            echo -e "${GREEN}🎉 Release workflow completed successfully!${NC}"
            show_release_summary
        else
            echo -e "${RED}💥 Release workflow failed with status: $STATUS${NC}"
            echo ""
            echo "🔍 Check logs: gh run view $RUN_ID --repo $REPO --log"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not find workflow run to monitor${NC}"
    fi
}

# Function to show release summary
show_release_summary() {
    echo ""
    echo "🎊 =========================================="
    echo "🎉 SunLint v$VERSION Released Successfully!"
    echo "🎊 =========================================="
    echo ""
    
    echo -e "${GREEN}📦 Installation Methods:${NC}"
    echo ""
    echo "1. GitHub Package Registry:"
    echo "   npm install -g @sun-asterisk/sunlint"
    echo ""
    echo "2. Direct GitHub Release:"
    echo "   npm install -g https://github.com/$REPO/releases/download/sunlint-v$VERSION/sunlint-$VERSION.tgz"
    echo ""
    
    echo -e "${BLUE}🔗 Release Links:${NC}"
    echo "• Release Page: https://github.com/$REPO/releases/tag/sunlint-v$VERSION"
    echo "• GitHub Package: https://github.com/$REPO/packages"
    echo "• Documentation: https://github.com/$REPO/tree/main/coding-quality/extensions/sunlint"
    echo ""
    
    echo -e "${YELLOW}🧪 Test Installation:${NC}"
    echo "npm install -g @sun-asterisk/sunlint && sunlint --version"
    echo ""
    
    echo -e "${GREEN}✨ Next Steps:${NC}"
    echo "1. Test installation from both sources"
    echo "2. Update internal documentation"
    echo "3. Announce to development teams"
    echo "4. Monitor adoption metrics"
}

# Main execution flow
main() {
    echo -e "${YELLOW}🔍 Pre-flight checks...${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "cli.js" ] || [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in SunLint directory!${NC}"
        echo "Please run this script from: coding-quality/extensions/sunlint/"
        exit 1
    fi
    
    # Check current version in package.json
    CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
    echo "Current package.json version: $CURRENT_VERSION"
    
    if [ "$CURRENT_VERSION" != "$VERSION" ]; then
        echo -e "${YELLOW}⚠️  Version mismatch! Updating package.json...${NC}"
        npm version "$VERSION" --no-git-tag-version
        echo -e "${GREEN}✅ Version updated to $VERSION${NC}"
    fi
    echo ""
    
    # Run pre-release tests
    if ! run_pre_release_tests; then
        echo -e "${RED}💥 Pre-release tests failed! Aborting release.${NC}"
        exit 1
    fi
    
    # Confirm release
    echo -e "${YELLOW}⚠️  About to trigger release workflow for SunLint v$VERSION${NC}"
    echo "This will:"
    echo "• Run tests"
    echo "• Build package"
    echo "• Publish to GitHub Package Registry"
    echo "• Create GitHub Release with tarball"
    echo ""
    
    read -p "🚀 Proceed with release? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Trigger the workflow
        if trigger_release_workflow; then
            # Ask if user wants to monitor
            echo ""
            read -p "👀 Monitor workflow progress? (Y/n): " -n 1 -r
            echo ""
            
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                monitor_workflow
            else
                echo -e "${BLUE}🔗 Monitor manually at:${NC}"
                echo "https://github.com/$REPO/actions/workflows/release-sunlint.yml"
            fi
        else
            echo -e "${RED}💥 Failed to trigger release!${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}🛑 Release cancelled by user${NC}"
        exit 0
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --type)
            RELEASE_TYPE="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --monitor-only)
            monitor_workflow
            exit 0
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --version VERSION    Release version (default: $VERSION)"
            echo "  --type TYPE          Release type: both|github-package|global-tarball (default: $RELEASE_TYPE)"
            echo "  --skip-tests         Skip pre-release tests"
            echo "  --monitor-only       Only monitor existing workflow"
            echo "  --help               Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Release v1.0.5 with all checks"
            echo "  $0 --version 1.0.6                   # Release specific version"
            echo "  $0 --type github-package              # Only GitHub Package Registry"
            echo "  $0 --monitor-only                     # Monitor existing workflow"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main
