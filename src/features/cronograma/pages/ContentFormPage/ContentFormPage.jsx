import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useAuth } from '@/app/providers/index.js';

import { PsychoeducationalContentForm } from '@/features/cronograma/components/PsychoeducationalContentForm/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { usePsychoeducationalContentForm } from './hooks/usePsychoeducationalContentForm.js';

const EMPTY_CONTENT = Object.freeze({
  name: '',
  type: '',
});

export function ContentFormPage({
  initialValues,
  mode = 'create',
  loading = false,
  onValidSubmit,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId } = useParams();
  const { role, logout } = useAuth();

  const isEditMode = mode === 'edit';

  const navigationContent =
    location.state?.content ?? null;

  const selectedContent =
    initialValues ?? navigationContent;

  const resolvedInitialValues =
    selectedContent ?? EMPTY_CONTENT;

  const hasEditContent =
    !isEditMode || Boolean(selectedContent);

  function handleValidSubmit(payload) {
    if (isEditMode) {
      onValidSubmit?.({
        id:
          selectedContent?.id ??
          contentId,
        ...payload,
      });

      return;
    }

    onValidSubmit?.(payload);
  }

  const {
    form,
    errors,
    handleChange,
    handleSubmit,
  } = usePsychoeducationalContentForm({
    initialValues: resolvedInitialValues,
    onValidSubmit: handleValidSubmit,
  });

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (
      tabId ===
      ADMINISTRATIVE_TAB.CRONOGRAMA
    ) {
      navigate(
        '/app/administrativo/cronograma',
      );
      return;
    }

    if (
      tabId ===
      ADMINISTRATIVE_TAB.DASHBOARD
    ) {
      navigate('/app/administrativo');
      return;
    }

    navigate(
      `/app/administrativo?tab=${encodeURIComponent(
        tabId,
      )}`,
    );
  }

  function handleBack() {
    navigate(
      '/app/administrativo/cronograma/contenidos',
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={
          role ?? 'ADMINISTRATIVO'
        }
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={
          ADMINISTRATIVE_TAB.CRONOGRAMA
        }
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto w-full max-w-[900px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver a contenidos
          </button>

          <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
            Administración
          </p>

          <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
            {isEditMode
              ? 'Editar contenido psicoeducativo'
              : 'Crear contenido psicoeducativo'}
          </h1>

          <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
            {isEditMode
              ? 'Actualiza la información general del contenido seleccionado.'
              : 'Registra la información general de un nuevo contenido psicoeducativo.'}
          </p>

          {hasEditContent ? (
            <div className="mt-[var(--space-6)]">
              <PsychoeducationalContentForm
                form={form}
                errors={errors}
                loading={loading}
                submitLabel={
                  isEditMode
                    ? 'Guardar cambios'
                    : 'Crear contenido'
                }
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={handleBack}
              />
            </div>
          ) : (
            <section className="mt-[var(--space-6)] rounded-[var(--radius-xl)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-6)]">
              <h2 className="m-0 text-[17px] font-extrabold text-[var(--text-primary)]">
                Contenido no disponible
              </h2>

              <p className="mt-[var(--space-2)] mb-0 text-[13px] leading-[1.6] text-[var(--text-muted)]">
                No se recibió la información del contenido seleccionado.
                {contentId
                  ? ` Identificador: ${contentId}.`
                  : ''}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}