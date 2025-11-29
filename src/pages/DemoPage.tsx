import { Navigate } from 'react-router-dom';
// Legacy demo page removed, redirecting to home.
export function DemoPage() {
  return <Navigate to="/" />;
}