#!/bin/bash

# Update Movement Design System Script
# This script syncs the pre-built design system from the source repository

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_REPO="${PROJECT_ROOT}/../movement-design-system"
TARGET_DIR="${PROJECT_ROOT}/packages/movement-design-system"

echo "🔄 Updating Movement Design System..."

# Check if source repository exists
if [ ! -d "$SOURCE_REPO" ]; then
    echo "❌ Error: Source repository not found at $SOURCE_REPO"
    echo "   Please clone the movement-design-system repository first:"
    echo "   git clone https://github.com/movementlabsxyz/movement-design-system.git ../movement-design-system"
    exit 1
fi

# Build in source repo if dist doesn't exist or force rebuild
if [ ! -d "$SOURCE_REPO/dist" ] || [ "$1" = "--rebuild" ]; then
    echo "📦 Building design system..."
    cd "$SOURCE_REPO"
    pnpm install
    pnpm build
    cd "$PROJECT_ROOT"
fi

# Create target directory
mkdir -p "$TARGET_DIR"

# Copy dist folder
echo "📁 Copying dist folder..."
rm -rf "$TARGET_DIR/dist"
cp -r "$SOURCE_REPO/dist" "$TARGET_DIR/"

# Create simplified package.json
echo "📝 Creating package.json..."
cat > "$TARGET_DIR/package.json" << 'EOF'
{
  "name": "@movementlabsxyz/movement-design-system",
  "private": false,
  "version": "1.0.9",
  "type": "module",
  "description": "Production-ready design system built with shadcn/ui components, Radix UI, and Tailwind CSS for Movement Labs",
  "author": "Movement Network",
  "license": "MIT",
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    },
    "./component-styles": "./dist/index.css",
    "./theme": "./dist/theme.css",
    "./fonts": "./dist/fonts.css"
  },
  "sideEffects": ["**/*.css"],
  "scripts": {},
  "peerDependencies": {
    "@aptos-labs/wallet-adapter-react": "^7.0.4",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@msafe/aptos-wallet-adapter": "^1.1.8",
    "@okwallet/aptos-wallet-adapter": "^0.0.7",
    "@phosphor-icons/react": "^2.1.10",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tailwindcss/vite": "^4.1.16",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.548.0",
    "next-themes": "^0.4.6",
    "react-day-picker": "^9.11.1",
    "react-hook-form": "^7.65.0",
    "react-resizable-panels": "^3.0.6",
    "recharts": "2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "vaul": "^1.1.2",
    "zod": "^4.1.12"
  },
  "devDependencies": {}
}
EOF

# Extract version from source
VERSION=$(node -p "require('$SOURCE_REPO/package.json').version")
sed -i '' "s/\"version\": \"1.0.9\"/\"version\": \"$VERSION\"/" "$TARGET_DIR/package.json"

echo "✅ Update complete! Design System v$VERSION synced."
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm install' to update dependencies"
echo "  2. Commit the changes"
echo "  3. Deploy to Vercel"
