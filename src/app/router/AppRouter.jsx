import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/app/layouts/AdminLayout/index.js';
import { ProtectedLayout } from '@/app/layouts/ProtectedLayout/index.js';
import { StudentLayout } from '@/app/layouts/StudentLayout/index.js';
import { RegistrationLayout } from '@/app/layouts/RegistrationLayout/index.js';
import {
  ChatConversationPage,
  ChatEntryPage,
  ChatOfflineDemoPage,
  ChatOfflinePage,
  GroupTreeDetailPage,
  GroupTreesPage,
  TaxonomyVariablesPage,
  ProgramModalityScreen,
  PersonalizedTreesScreen,
  SosInterventionPage,
} from '@/features/chat/index.js';
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

import {
  AdministrativePauseHistoryPage,
  AssociateContentPage,
  ContentFormPage,
  ContentManagementPage,
  ContentResourcesPage,
  CreateAdministrativePausePage,
  CreateSchedulePage,
  CreateTemporalUnitPage,
  ParticipantProgressPage,
  ScheduleManagementPage,
  TemporalUnitDetailPage,
  CurrentContentPage,
  TemporalInformationPage,
  SchedulePanelPage,
  AssignSchedulePage,
} from '@/features/cronograma/index.js';
import {
  AuditLogPage,
  CohortDetailPage,
  CohortFormPage,
  CohortListPage,
  ParticipantTrackingPage,
  ParticipantTrackingProfilePage,
  CohortAggregatePage,
  CohortNarrativePage,
  CohortNotificationsPage,
  CohortDashboard,
  CohortEvolutionPage,
  ParticipantSessionsPage,
  SessionTraceabilityPage,
} from '@/features/administracion/index.js';

import { LandingRoute } from './LandingRoute.jsx';
import { RequireAuth } from './RequireAuth.jsx';
import { RoleHomeRedirect } from './RoleHomeRedirect.jsx';


export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing pública (con sesión activa ofrece «Ir a mi espacio»). */}
        <Route
          path="/"
          element={<LandingRoute />}
        />

        {/* Pantalla de bienvenida de la PWA, antes en «/». */}
        <Route
          path="/splash"
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
              <Route element={<StudentLayout />}>
                <Route
                  path="estudiante"
                  element={<StudentHomePage />}
                />

                <Route
                  path="estudiante/cronograma/contenido-vigente"
                  element={<CurrentContentPage />}
                />

                <Route
                  path="estudiante/chat"
                  element={<ChatEntryPage />}
                />

                <Route
                  path="estudiante/chat/sesion/:idSesion"
                  element={<ChatConversationPage />}
                />

                {/* RF-34: conversación con el paquete guardado en el dispositivo. */}
                <Route
                  path="estudiante/chat/sin-conexion/:idSesion"
                  element={<ChatOfflinePage />}
                />

                {/* Demostración sin conexión: solo opera en desarrollo. */}
                <Route
                  path="estudiante/chat/demo-sin-conexion"
                  element={<ChatOfflineDemoPage />}
                />

                {/* RF-43: intervención SOS «Tengo ganas de vapear». */}
                <Route
                  path="estudiante/sos"
                  element={<SosInterventionPage />}
                />
              </Route>
            </Route>

            <Route
              element={
                <RequireAuth
                  allowedRoles={[
                    USER_ROLE.ADMINISTRATIVO,
                  ]}
                />
              }
            >
              <Route element={<AdminLayout />}>
              <Route
                path="administrativo"
                element={
                  <PsychologyHomePage cohortDashboard={<CohortDashboard />} />
                }
              />

              <Route
                path="administrativo/cronograma"
                element={<ScheduleManagementPage />}
              />

              <Route
                path="administrativo/cronograma/crear"
                element={<CreateSchedulePage />}
              />

              <Route
                path="administrativo/cronograma/assignar"
                element={<AssignSchedulePage />}
              />

              <Route
                path="administrativo/cronograma/nueva"
                element={<CreateTemporalUnitPage />}
              />

              <Route
                path="administrativo/cronograma/pausas"
                element={<AdministrativePauseHistoryPage />}
              />

              <Route
                path="administrativo/cronograma/pausas/nueva"
                element={
                  <CreateAdministrativePausePage />
                }
              />

              <Route
                path="administrativo/cronograma/progreso"
                element={<ParticipantProgressPage />}
              />

              <Route
                path="administrativo/cronograma/progreso/:participantId/informacion-temporal"
                element={<TemporalInformationPage />}
              />

              <Route
                path="administrativo/cronograma/contenidos"
                element={<ContentManagementPage />}
              />

              <Route
                path="administrativo/cronograma/contenidos/nuevo"
                element={<ContentFormPage />}
              />

              <Route
                path="administrativo/cronograma/contenidos/:contentId/editar"
                element={
                  <ContentFormPage mode="edit" />
                }
              />

              <Route
                path="administrativo/cronograma/contenidos/:contentId/recursos"
                element={<ContentResourcesPage />}
              />

              <Route
                path="administrativo/cronograma/:scheduleId/unidades/:unitId/contenido"
                element={<AssociateContentPage />}
              />

              <Route
                path="administrativo/cronograma/:scheduleId/unidades/:unitId"
                element={<TemporalUnitDetailPage />}
              />

              <Route
                path="administrativo/cronograma/:idSchedule/panel"
                element={<SchedulePanelPage />}
              />

              <Route
                path="administrativo/cronograma/:idSchedule/crear-unidad"
                element={<CreateTemporalUnitPage />}
              />

              <Route
                path="administrativo/cohortes"
                element={<CohortListPage />}
              />

              <Route
                path="administrativo/cohortes/nueva"
                element={<CohortFormPage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte"
                element={<CohortDetailPage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/seguimiento"
                element={<ParticipantTrackingPage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/seguimiento/:referencia"
                element={<ParticipantTrackingProfilePage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/vista-agregada"
                element={<CohortAggregatePage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/vista-narrativa"
                element={<CohortNarrativePage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/vista-notificaciones"
                element={<CohortNotificationsPage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/evolucion"
                element={<CohortEvolutionPage />}
              />

              <Route
                path="administrativo/cohortes/:idCohorte/editar"
                element={<CohortFormPage mode="edit" />}
              />

              <Route
                path="administrativo/auditoria"
                element={<AuditLogPage />}
              />

              <Route
                path="administrativo/chat/modalidad"
                element={<ProgramModalityScreen />}
              />

              <Route
                path="administrativo/chat/grupal"
                element={<GroupTreesPage />}
              />

              <Route
                path="administrativo/chat/grupal/:flowId"
                element={<GroupTreeDetailPage />}
              />

              <Route
                path="administrativo/chat/arboles"
                element={<PersonalizedTreesScreen />}
              />

              <Route
                path="administrativo/chat/variables"
                element={<TaxonomyVariablesPage />}
              />

              {/* RF-38: trazabilidad de sesiones por seudónimo A7 (solo lectura). */}
              <Route
                path="administrativo/chat/participantes/:codigoParticipante/sesiones"
                element={<ParticipantSessionsPage />}
              />

              <Route
                path="administrativo/chat/participantes/:codigoParticipante/sesiones/:idSesion/trazabilidad"
                element={<SessionTraceabilityPage />}
              />
              </Route>
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