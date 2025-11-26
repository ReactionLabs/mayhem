import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Wallet-only middleware - no authentication required
// All routes are public, wallet connection is handled client-side
export function middleware(request: NextRequest) {
  // Allow all requests - wallet auth is client-side only
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};

