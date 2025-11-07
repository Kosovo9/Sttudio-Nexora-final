'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('redirect_url') || searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push(callbackUrl);
    }
  }, [isLoaded, isSignedIn, router, callbackUrl]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center">
        <SignIn 
          routing="path"
          path="/auth/signin"
          signUpUrl="/auth/signup"
          afterSignInUrl={callbackUrl}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/10 backdrop-blur-sm shadow-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}
