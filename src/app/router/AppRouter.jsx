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

import { USER_ROLE } from '@/features/auth/types/authTypes.js';

import { PsychologyHomePage } from '@/features/psychology/index.js';

import { StudentHomePage } from '@/features/student/index.js';

import {
  BaselinePage,
  ConsentPage,
  CreateAccountPage,
  ReconsentPage,
  RegistrationCompletedPage,
  ReviewPage,
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
          <Route
            index
            element={<RoleHomeRedirect />}
          />

          <Route
            element={<RequireAuth allowedRoles={[USER_ROLE.ESTUDIANTE]} />}
          >
            <Route
              path="estudiante"
              element={<StudentHomePage />}
            />
          </Route>

          <Route
            element={<RequireAuth allowedRoles={[USER_ROLE.PSICOLOGIA]} />}
          >
            <Route path="psicologia" element={<PsychologyHomePage />} />
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