#!/bin/bash
# ============================================
# STUDIO-NEXORA DEPLOYMENT SCRIPT
# ============================================
# Automated deployment to Vercel with all configurations

set -e

echo "🚀 Starting Studio-Nexora deployment to Vercel..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local not found. Make sure to set environment variables in Vercel dashboard.${NC}"
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Run type check
echo -e "${GREEN}🔍 Running type check...${NC}"
npm run type-check || echo -e "${YELLOW}Type check warnings (continuing...)${NC}"

# Run lint
echo -e "${GREEN}🔍 Running linter...${NC}"
npm run lint || echo -e "${YELLOW}Lint warnings (continuing...)${NC}"

# Build project
echo -e "${GREEN}🏗️  Building project...${NC}"
npm run build

# Deploy to Vercel
echo -e "${GREEN}🚀 Deploying to Vercel...${NC}"
if [ "$1" == "--prod" ]; then
    vercel --prod --yes
else
    vercel --yes
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set up webhooks:"
echo "   - Clerk: https://studio-nexora.com/api/webhooks/clerk"
echo "   - Stripe: https://studio-nexora.com/api/webhooks/stripe"
echo "   - Lemon Squeezy: https://studio-nexora.com/api/webhooks/lemonsqueezy"
echo "3. Configure DNS in Cloudflare to point to Vercel"
echo "4. Test the deployment"

