import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Lemon Squeezy Webhook Handler
 * Handles subscription events from Lemon Squeezy
 */
export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing LEMONSQUEEZY_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = hmac.update(body).digest('hex');

    if (signature !== digest) {
      console.error('Invalid Lemon Squeezy webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const { meta, data } = event;

    console.log('Lemon Squeezy webhook received:', event.meta?.event_name);

    // Handle different event types
    switch (meta?.event_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data);
        break;

      case 'subscription_resumed':
        await handleSubscriptionResumed(data);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(data);
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(data);
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(data);
        break;

      default:
        console.log(`Unhandled Lemon Squeezy event: ${meta?.event_name}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Lemon Squeezy webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(data: any) {
  const { attributes } = data;
  const customerEmail = attributes.user_email;
  const subscriptionId = data.id;
  const variantId = attributes.variant_id.toString();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error(`User not found for email: ${customerEmail}`);
    return;
  }

  // Determine plan based on variant ID
  const plan = variantId === process.env.LEMONSQUEEZY_PRODUCT_ID_PRO 
    ? 'pro' 
    : variantId === process.env.LEMONSQUEEZY_PRODUCT_ID_VIP 
    ? 'vip' 
    : 'basic';

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      status: 'active',
      plan,
      lemonSqueezySubscriptionId: subscriptionId,
      currentPeriodStart: new Date(attributes.created_at),
      currentPeriodEnd: new Date(attributes.renews_at),
    },
    create: {
      userId: user.id,
      status: 'active',
      plan,
      lemonSqueezySubscriptionId: subscriptionId,
      currentPeriodStart: new Date(attributes.created_at),
      currentPeriodEnd: new Date(attributes.renews_at),
    },
  });

  console.log(`Subscription created for user ${user.id}: ${plan}`);
}

async function handleSubscriptionUpdated(data: any) {
  const { attributes } = data;
  const subscriptionId = data.id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: attributes.status === 'active' ? 'active' : 'cancelled',
      currentPeriodEnd: new Date(attributes.renews_at),
    },
  });

  console.log(`Subscription updated: ${subscriptionId}`);
}

async function handleSubscriptionCancelled(data: any) {
  const subscriptionId = data.id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
      },
    });

    console.log(`Subscription cancelled: ${subscriptionId}`);
  }
}

async function handleSubscriptionResumed(data: any) {
  const subscriptionId = data.id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
      },
    });

    console.log(`Subscription resumed: ${subscriptionId}`);
  }
}

async function handleSubscriptionExpired(data: any) {
  const subscriptionId = data.id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'expired',
      },
    });

    console.log(`Subscription expired: ${subscriptionId}`);
  }
}

async function handlePaymentSuccess(data: any) {
  const subscriptionId = data.attributes.subscription_id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId.toString() },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        currentPeriodEnd: new Date(data.attributes.renews_at),
      },
    });

    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
  }
}

async function handlePaymentFailed(data: any) {
  const subscriptionId = data.attributes.subscription_id;

  const subscription = await prisma.subscription.findUnique({
    where: { lemonSqueezySubscriptionId: subscriptionId.toString() },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'past_due',
      },
    });

    console.log(`Payment failed for subscription: ${subscriptionId}`);
  }
}

