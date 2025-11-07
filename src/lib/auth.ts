/**
 * NEXORA SAFE-SHIP AUTHENTICATION SYSTEM
 * Clerk-based authentication with role-based access control
 * 
 * This file provides compatibility helpers for migration from NextAuth to Clerk
 * Use @/lib/clerk.ts for new code
 */

import { getCurrentUser, requireAuth as clerkRequireAuth } from './clerk';
import { prisma } from './prisma';

/**
 * Check if user is admin
 */
export const isAdmin = async (userId: string | null): Promise<boolean> => {
  if (!userId) return false;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  return user?.email === process.env.ADMIN_EMAIL || user?.role === 'admin';
};

/**
 * Require authentication middleware for API routes
 */
export const requireAuth = (handler: any) => {
  return async (req: any, res: any) => {
    try {
      const user = await clerkRequireAuth();
      return handler(req, res, { user });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
};

/**
 * Require admin access middleware for API routes
 */
export const requireAdmin = (handler: any) => {
  return async (req: any, res: any) => {
    try {
      const user = await clerkRequireAuth();
      const admin = await isAdmin(user.id);
      
      if (!admin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      return handler(req, res, { user });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
};

/**
 * Get current session (compatibility helper)
 */
export async function getSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
    },
  };
}
