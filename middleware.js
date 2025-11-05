import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // Check if accessing HR dashboard routes
    if (pathname.startsWith('/hr') && !pathname.startsWith('/hr/login') && !pathname.startsWith('/api')) {
        const cookie = request.cookies.get('hr_auth');
        
        if (!cookie || cookie.value !== '1') {
            return NextResponse.redirect(new URL('/hr/login', request.url));
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/hr/:path*', '/hr'],
};

