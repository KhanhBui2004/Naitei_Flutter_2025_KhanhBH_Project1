#!/bin/bash

# SunLint CLI Installer Script
# Install SunLint from GitHub release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/sun-asterisk/engineer-excellence"
LATEST_RELEASE_URL="https://api.github.com/repos/sun-asterisk/engineer-excellence/releases/latest"
PACKAGE_NAME="@sun/sunlint"

echo -e "${BLUE}☀️  SunLint CLI Installer${NC}"
echo -e "${BLUE}=================================${NC}"

# Check if Node.js and npm are installed
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed.${NC}"
        echo -e "${YELLOW}Please install Node.js from: https://nodejs.org/${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node --version) and npm $(npm --version) found${NC}"
}

# Get latest release version
get_latest_version() {
    echo -e "${YELLOW}Fetching latest release...${NC}"
    
    if command -v curl &> /dev/null; then
        LATEST_TAG=$(curl -s "$LATEST_RELEASE_URL" | grep '"tag_name":' | grep 'sunlint-v' | cut -d '"' -f 4 | head -1)
    elif command -v wget &> /dev/null; then
        LATEST_TAG=$(wget -qO- "$LATEST_RELEASE_URL" | grep '"tag_name":' | grep 'sunlint-v' | cut -d '"' -f 4 | head -1)
    else
        echo -e "${RED}❌ Neither curl nor wget found. Cannot fetch latest release.${NC}"
        echo -e "${YELLOW}Please install curl or wget, or use manual installation.${NC}"
        exit 1
    fi
    
    if [ -z "$LATEST_TAG" ]; then
        echo -e "${RED}❌ Could not find latest SunLint release.${NC}"
        echo -e "${YELLOW}Using default version: sunlint-v1.0.0${NC}"
        LATEST_TAG="sunlint-v1.0.0"
    fi
    
    # Extract version number (remove 'sunlint-v' prefix)
    VERSION=${LATEST_TAG#sunlint-v}
    echo -e "${GREEN}✅ Latest version: ${VERSION}${NC}"
}

# Uninstall existing version
uninstall_existing() {
    if npm list -g "$PACKAGE_NAME" &> /dev/null; then
        echo -e "${YELLOW}Removing existing SunLint installation...${NC}"
        npm uninstall -g "$PACKAGE_NAME" || true
    fi
}

# Install SunLint
install_sunlint() {
    echo -e "${YELLOW}Installing SunLint CLI v${VERSION}...${NC}"
    
    DOWNLOAD_URL="${REPO_URL}/releases/download/${LATEST_TAG}/sun-sunlint-${VERSION}.tgz"
    
    echo -e "${BLUE}Download URL: ${DOWNLOAD_URL}${NC}"
    
    # Install from GitHub release
    if npm install -g "$DOWNLOAD_URL"; then
        echo -e "${GREEN}✅ SunLint CLI v${VERSION} installed successfully!${NC}"
    else
        echo -e "${RED}❌ Installation failed.${NC}"
        echo -e "${YELLOW}Trying alternative installation method...${NC}"
        
        # Fallback: Clone and install
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"
        
        echo -e "${YELLOW}Cloning repository...${NC}"
        if git clone "$REPO_URL.git"; then
            cd engineer-excellence/coding-quality/extensions/sunlint
            echo -e "${YELLOW}Installing from source...${NC}"
            if npm install -g .; then
                echo -e "${GREEN}✅ SunLint CLI installed from source!${NC}"
            else
                echo -e "${RED}❌ Source installation also failed.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Could not clone repository.${NC}"
            exit 1
        fi
        
        # Cleanup
        cd /
        rm -rf "$TEMP_DIR"
    fi
}

# Verify installation
verify_installation() {
    echo -e "${YELLOW}Verifying installation...${NC}"
    
    if command -v sunlint &> /dev/null; then
        INSTALLED_VERSION=$(sunlint --version)
        echo -e "${GREEN}✅ SunLint CLI is working!${NC}"
        echo -e "${GREEN}   Version: ${INSTALLED_VERSION}${NC}"
        echo -e "${GREEN}   Location: $(which sunlint)${NC}"
        
        echo -e "${BLUE}🚀 Quick Test:${NC}"
        echo -e "${YELLOW}sunlint --help${NC}"
        return 0
    else
        echo -e "${RED}❌ SunLint command not found after installation.${NC}"
        echo -e "${YELLOW}Try restarting your terminal or check your PATH.${NC}"
        return 1
    fi
}

# Usage examples
show_usage() {
    echo -e "${BLUE}📋 Usage Examples:${NC}"
    echo -e "${YELLOW}# Check code quality${NC}"
    echo -e "sunlint --quality --input=src"
    echo ""
    echo -e "${YELLOW}# TypeScript analysis${NC}"
    echo -e "sunlint --typescript --input=src"
    echo ""
    echo -e "${YELLOW}# All rules with JSON output (CI/CD)${NC}"
    echo -e "sunlint --all --format=json --quiet --input=src"
    echo ""
    echo -e "${YELLOW}# Get help${NC}"
    echo -e "sunlint --help"
    echo ""
    echo -e "${BLUE}📖 Documentation:${NC}"
    echo -e "${BLUE}https://github.com/sun-asterisk/engineer-excellence/tree/main/coding-quality/extensions/sunlint${NC}"
}

# Main execution
main() {
    check_prerequisites
    get_latest_version
    uninstall_existing
    install_sunlint
    
    if verify_installation; then
        echo ""
        echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
        echo ""
        show_usage
    else
        echo -e "${RED}❌ Installation verification failed.${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "SunLint CLI Installer"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show installer version"
        echo ""
        echo "This script will:"
        echo "1. Check for Node.js and npm"
        echo "2. Fetch the latest SunLint release"
        echo "3. Install SunLint CLI globally"
        echo "4. Verify the installation"
        exit 0
        ;;
    --version|-v)
        echo "SunLint Installer v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
