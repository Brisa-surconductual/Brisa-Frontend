import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { RegistrationLayout } from '../layouts/RegistrationLayout/index.js';

import {
  BaselinePage,
  ConsentPage,
  CreateAccountPage,
  ReconsentPage,
  RegistrationCompletedPage,
  ReviewPage,
} from '../../features/users/index.js';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/registro/cuenta"
              replace
            />
          }
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