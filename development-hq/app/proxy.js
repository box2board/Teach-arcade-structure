import { auth } from './lib/neon';
export default auth.middleware({ loginUrl: '/auth/sign-in' });
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
