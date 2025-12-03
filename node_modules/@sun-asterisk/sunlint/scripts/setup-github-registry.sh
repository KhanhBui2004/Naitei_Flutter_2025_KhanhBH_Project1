#!/bin/bash

# GitHub Package Registry Setup Script for SunLint
# This script configures npm to use GitHub Package Registry for @sun-asterisk packages

set -e

echo "🔧 Setting up GitHub Package Registry for SunLint..."

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is required"
    echo "Please set your GitHub token:"
    echo "export GITHUB_TOKEN=your_github_token_here"
    exit 1
fi

# Backup existing .npmrc if it exists
if [ -f ~/.npmrc ]; then
    echo "📋 Backing up existing ~/.npmrc to ~/.npmrc.backup"
    cp ~/.npmrc ~/.npmrc.backup
fi

# Configure GitHub Package Registry
echo "📦 Configuring GitHub Package Registry..."

# Add registry configuration for @sun-asterisk scope
echo "@sun-asterisk:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Add authentication token
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

echo "✅ GitHub Package Registry configured successfully!"
echo ""
echo "🚀 You can now install SunLint:"
echo "npm install -g @sun-asterisk/sunlint"
echo ""
echo "🔍 Or install for your project:"
echo "npm install --save-dev @sun-asterisk/sunlint"
echo ""
echo "📋 Your ~/.npmrc configuration:"
cat ~/.npmrc | grep -E "(sun-asterisk|npm.pkg.github.com)"
