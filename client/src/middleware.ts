import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
];

// Define instructor-only routes
const instructorRoutes = [
  '/instructor',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get user data from localStorage (this is a client-side check)
  // Note: In a real application, you'd want to use cookies or JWT tokens
  // for server-side authentication checks
  
  // For now, we'll let the client-side AuthGuard handle the authentication
  // This middleware serves as a basic route protection layer
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
