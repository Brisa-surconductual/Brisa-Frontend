import { AuthProvider } from './app/providers/index.js';

import { AppRouter } from './app/router/AppRouter.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
