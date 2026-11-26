// Tipos y reglas del dominio administrativo (M08)

export { COHORT_STATUS } from './types/cohortStatus.js';

export { validateCohortForm } from './services/cohortValidation.js';

// Páginas

export { CohortListPage } from './pages/CohortListPage/index.js';

export { CohortFormPage } from './pages/CohortFormPage/index.js';

export { CohortDetailPage } from './pages/CohortDetailPage/index.js';

export { AuditLogPage } from './pages/AuditLogPage/index.js';

export { ParticipantTrackingPage } from './pages/ParticipantTrackingPage/index.js';

export { ParticipantTrackingProfilePage } from './pages/ParticipantTrackingProfilePage/index.js';

export { CohortAggregatePage } from './pages/CohortAggregatePage/index.js';

export { CohortNarrativePage } from './pages/CohortNarrativePage/index.js';

export { CohortNotificationsPage } from './pages/CohortNotificationsPage/index.js';

export { CohortEvolutionPage } from './pages/CohortEvolutionPage/index.js';

// Trazabilidad administrativa de sesiones del chat (RF-38, M03 → M08).

export { ParticipantSessionsPage } from './pages/ParticipantSessionsPage/index.js';

export { SessionTraceabilityPage } from './pages/SessionTraceabilityPage/index.js';

// Bandeja de alertas pendientes y su atención (RF-146, RF-147).
export { PendingAlertsPage } from './pages/PendingAlertsPage/index.js';

// Panel principal de la cohorte activa (RF-140), montado en la pantalla
// de aterrizaje administrativa por app/router.

export { CohortDashboard } from './components/CohortDashboard/index.js';
