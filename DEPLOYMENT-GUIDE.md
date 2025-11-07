# ============================================
# STUDIO-NEXORA DEPLOYMENT GUIDE
# ============================================

## 🚀 DEPLOYMENT STEPS

### 1. PRE-DEPLOYMENT CHECKLIST

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Clerk application configured
- [ ] Stripe account set up
- [ ] Lemon Squeezy account set up
- [ ] Domain DNS configured in Cloudflare

### 2. ENVIRONMENT VARIABLES IN VERCEL

Set these in Vercel Dashboard → Project Settings → Environment Variables:

#### Required Variables:
```
NEXT_PUBLIC_SITE_URL=https://studio-nexora.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

### 3. WEBHOOK CONFIGURATION

#### Clerk Webhook:
- URL: `https://studio-nexora.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

#### Stripe Webhook:
- URL: `https://studio-nexora.com/api/webhooks/stripe`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

#### Lemon Squeezy Webhook:
- URL: `https://studio-nexora.com/api/webhooks/lemonsqueezy`
- Events:
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_payment_success`
  - `subscription_payment_failed`

### 4. DNS CONFIGURATION IN CLOUDFLARE

1. Add A record:
   - Type: `A`
   - Name: `@`
   - Content: Vercel IP (get from Vercel dashboard)
   - Proxy: Enabled

2. Add CNAME record:
   - Type: `CNAME`
   - Name: `www`
   - Content: `cname.vercel-dns.com`
   - Proxy: Enabled

3. SSL/TLS Settings:
   - Encryption mode: `Full (strict)`
   - Always Use HTTPS: `On`

### 5. DEPLOYMENT COMMANDS

#### Using Vercel CLI:
```bash
# Production deployment
npm run deploy:prod

# Or manually:
vercel --prod --yes
```

#### Using Git:
```bash
git push origin main
# Vercel will auto-deploy
```

### 6. POST-DEPLOYMENT VERIFICATION

- [ ] Homepage loads correctly
- [ ] Authentication works (sign in/sign up)
- [ ] Webhooks are receiving events
- [ ] Stripe checkout works
- [ ] Lemon Squeezy checkout works
- [ ] Admin dashboard accessible
- [ ] API endpoints responding
- [ ] Images loading correctly
- [ ] SSL certificate active

### 7. MONITORING

- Check Vercel dashboard for build logs
- Monitor webhook events in respective dashboards
- Check error logs in Vercel Functions
- Monitor database connections
- Track API response times

### 8. TROUBLESHOOTING

#### Build fails:
- Check environment variables
- Verify Node.js version (>=20.x)
- Check for TypeScript errors

#### Webhooks not working:
- Verify webhook URLs are correct
- Check webhook secrets match
- Verify SSL certificate is valid
- Check Vercel function logs

#### Database connection issues:
- Verify DATABASE_URL is correct
- Check database firewall settings
- Verify connection pool limits

### 9. ROLLBACK PROCEDURE

If deployment fails:
1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous successful deployment
4. Click "Promote to Production"

### 10. PERFORMANCE OPTIMIZATION

- Enable Vercel Analytics
- Configure caching headers
- Optimize images
- Enable compression
- Use CDN for static assets

