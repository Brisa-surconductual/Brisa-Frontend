import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { ProtectedLayout } from '@/app/layouts/ProtectedLayout/index.js';
import { RegistrationLayout } from '@/app/layouts/RegistrationLayout/index.js';

import {
  BaselinePage,
  ConsentPage,
  CreateAccountPage,
  LoginPage,
  PsychologyHomePage,
  RecoverRequestPage,
  RecoverResetPage,
  ReconsentPage,
  RegistrationCompletedPage,
  ReviewPage,
  SplashPage,
  StudentHomePage,
  USER_ROLE,
} from '@/features/users/index.js';

import { RequireAuth } from './RequireAuth.jsx';
import { RoleHomeRedirect } from './RoleHomeRedirect.jsx';

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
          path="/app"
          element={<RequireAuth />}
        >
          <Route element={<ProtectedLayout />}>
            <Route
              index
              element={<RoleHomeRedirect />}
            />

            <Route
              element={
                <RequireAuth
                  allowedRoles={[
                    USER_ROLE.ESTUDIANTE,
                  ]}
                />
              }
            >
              <Route
                path="estudiante"
                element={<StudentHomePage />}
              />
            </Route>

            <Route
              element={
                <RequireAuth
                  allowedRoles={[
                    USER_ROLE.PSICOLOGIA,
                  ]}
                />
              }
            >
              <Route
                path="psicologia"
                element={<PsychologyHomePage />}
              />
            </Route>
          </Route>
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