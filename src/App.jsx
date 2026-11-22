import { AuthProvider } from './app/providers/index.js';

import { UpdateAvailableNotice } from './app/pwa/UpdateAvailableNotice/index.js';
import { AppRouter } from './app/router/AppRouter.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <UpdateAvailableNotice />
    </AuthProvider>
  );
}
