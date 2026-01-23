#!/bin/bash

# Ensure script stops on first error
set -e

echo "🚀 Preparing distribution folder for generic web hosting..."

# Clean previous dist
if [ -d "dist" ]; then
    echo "🧹  Cleaning previous dist folder..."
    rm -rf dist
fi

# Run the web build
echo "🏗️  Running web build..."
npm run build:web

# Copy Images folder
if [ -d "public/Images" ]; then
    echo "🖼️  Copying Images folder..."
    cp -r public/Images dist/
fi

echo "✅ Distribution folder is ready at ./dist"
echo "📂 You can now upload the contents of the 'dist' folder to AWS S3, Google Cloud Storage, or any static hosting service."
echo "   Files to upload:"
ls -F dist
