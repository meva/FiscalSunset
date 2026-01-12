# Local Desktop App Installation & Build Guide

This branch (`local-install`) contains the necessary configuration to build the RetireSmart application as a native desktop app for macOS (`.dmg`) and Windows (`.exe`) using **Electron**.

## Prerequisites
- Node.js (v18 or later recommended)
- NPM

## Installation

1. Clone the repo and switch to this branch:
   ```bash
   git checkout local-install
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode (with Hot Module Replacement):

```bash
npm run electron
```
This will launch the Vite dev server and open the Electron window.

## Building for Production

### macOS (.dmg)
To build the `.dmg` installer for macOS (Arm64/Intel depending on your machine):

```bash
npm run electron:build
```
The output file will be in the `release/` directory (e.g., `release/mac-arm64/RetireSmart-0.0.0.dmg`).

### Windows (.exe)
To build the `.exe` installer for Windows:

**Option 1: Build on a Windows machine**
```bash
npm run electron:build
```

**Option 2: Build from macOS (requires Wine)**
You can attempt to cross-compile from macOS:
```bash
npx electron-builder --win
```
*Note: This may require installing `wine` via Homebrew (`brew install wine-stable`) if the pre-packaged binaries fail.*

## Troubleshooting

### macOS Build Error: "Resource fork, Finder information, or similar detritus not allowed"
If the build fails during the signing step with a "resource fork" error, it means some files have extended attributes that code signing rejects. Run this command in the project root to clean them:

```bash
xattr -cr .
```
Then try building again.
