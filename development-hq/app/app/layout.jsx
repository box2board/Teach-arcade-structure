import '@neondatabase/auth-ui/css';
import './styles.css';
import Providers from './providers';
export const metadata = { title: 'Teach Arcade | Development HQ', robots: { index: false, follow: false } };
export default function Layout({ children }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
