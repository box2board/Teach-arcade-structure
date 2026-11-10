import './styles.css';
export const metadata = { title: 'Teach Arcade | Development HQ', robots: { index: false, follow: false } };
export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
