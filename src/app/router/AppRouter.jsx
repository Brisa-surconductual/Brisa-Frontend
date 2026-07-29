import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  LoginPage,
  RecoverRequestPage,
  RecoverResetPage,
  SplashPage,
} from '@/features/auth/index.js';

import { RegistrationLayout } from '@/app/layouts/RegistrationLayout/index.js';

import {
  BaselinePage,
  ConsentPage,
  CreateAccountPage,
  ReconsentPage,
  RegistrationCompletedPage,
  ReviewPage,
} from '@/features/users/index.js';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<SplashPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/recuperar"
          element={<RecoverRequestPage />}
        />

        <Route
          path="/recuperar/nueva"
          element={<RecoverResetPage />}
        />

        <Route
          path="/registro"
          element={<RegistrationLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="cuenta"
                replace
              />
            }
          />

          <Route
            path="cuenta"
            element={<CreateAccountPage />}
          />

          <Route
            path="consentimiento"
            element={<ConsentPage />}
          />

          <Route
            path="linea-base"
            element={<BaselinePage />}
          />

          <Route
            path="revision"
            element={<ReviewPage />}
          />

          <Route
            path="reconsentimiento"
            element={<ReconsentPage />}
          />

          <Route
            path="completado"
            element={<RegistrationCompletedPage />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/registro/cuenta"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}