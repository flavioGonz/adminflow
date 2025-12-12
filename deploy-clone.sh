#!/bin/bash

# ============================================================================
# AdminFlow Remote Deployment Clone Script
# ============================================================================
# This script creates a clean, deployment-ready clone of AdminFlow
# from GitHub with all improvements included
# ============================================================================

set -e

REPO_URL="https://github.com/flavioGonz/adminflow.git"
BRANCH="main"
CLONE_DIR="adminflow-production"

echo "📦 AdminFlow Remote Deployment Clone Script"
echo "==========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git and try again."
    exit 1
fi

# Check if directory already exists
if [ -d "$CLONE_DIR" ]; then
    echo "⚠️  Directory '$CLONE_DIR' already exists."
    read -p "Do you want to remove it and create a fresh clone? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CLONE_DIR"
        echo "✅ Directory removed."
    else
        echo "❌ Aborted."
        exit 1
    fi
fi

echo "🔄 Cloning repository from GitHub..."
git clone --branch "$BRANCH" "$REPO_URL" "$CLONE_DIR"

cd "$CLONE_DIR"

echo ""
echo "✅ Repository cloned successfully!"
echo ""
echo "📊 Repository Information:"
git log --oneline -n 3
echo ""

echo "🔧 Installation Instructions for Remote Server:"
echo "================================================"
echo ""
echo "1. Backend Setup:"
echo "   cd $CLONE_DIR/server"
echo "   npm install"
echo "   npm run validate:install    # (Optional: Check installation integrity)"
echo "   npm start                   # Starts API on port 3001"
echo ""
echo "2. Frontend Setup (in another terminal):"
echo "   cd $CLONE_DIR/client"
echo "   npm install"
echo "   echo 'NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001' > .env.local"
echo "   npm run dev                 # Starts UI on port 3000"
echo ""
echo "3. Production Build:"
echo "   npm run build"
echo "   npm start"
echo ""

echo "📋 Included Improvements:"
echo "========================"
echo "✅ Installation integrity validation"
echo "✅ MongoDB URI parsing robustness"
echo "✅ Cache headers fix for 503 responses"
echo "✅ Database test timeout handling"
echo "✅ Safe clean-install with backups"
echo "✅ Comprehensive API documentation"
echo "✅ Complete system architecture documentation"
echo ""

echo "🚀 Ready for deployment!"
echo "Review GIT_COMPARISON_REPORT.md in the clone directory for details."
