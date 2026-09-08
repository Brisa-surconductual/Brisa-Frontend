import { useNavigate, useParams } from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import {
  ADMINISTRATIVE_TAB,
  ADMINISTRATIVE_TABS,
} from '@/shared/data/administrativeTabs.js';

import { AssociateContentForm } from '@/features/cronograma/components/AssociateContentForm/index.js';
import { ContentRow } from '@/features/cronograma/components/ContentRow/index.js';
import { EmptyScheduleState } from '@/features/cronograma/components/EmptyScheduleState/index.js';

import { CONTENT_CATALOG } from '@/features/cronograma/data/contentCatalogMock.js';
import {
  SCHEDULED_CONTENT,
  TEMPORAL_UNITS,
} from '@/features/cronograma/data/scheduleMock.js';

import {
  CONTENT_TYPE_LABEL,
  SCHEDULED_CONTENT_STATUS,
} from '@/features/cronograma/types/contentTypes.js';

import { useAssociateContentForm } from './hooks/useAssociateContentForm.js';

const CONTENT_LIST_HEADING_ID = 'associate-content-list-heading';

export function AssociateContentPage() {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const { role, logout } = useAuth();

  // Sin persistencia: el listado vive en memoria y se pierde al salir de la
  // pantalla. Es lo esperado mientras no haya backend (FE-M04-10).
  const [scheduledContent, setScheduledContent] = useState(SCHEDULED_CONTENT);

  const [successMessage, setSuccessMessage] = useState('');

  const unit = TEMPORAL_UNITS.find((temporalUnit) => temporalUnit.id === unitId);

  function handleValidSubmit({ contentId, temporalUnitId }) {
    const content = CONTENT_CATALOG.find((item) => item.id === contentId);

    const targetUnit = TEMPORAL_UNITS.find(
      (temporalUnit) => temporalUnit.id === temporalUnitId,
    );

    if (!content || !targetUnit) {
      return;
    }

    setScheduledContent((currentContent) => {
      const unitOrders = currentContent
        .filter((item) => item.temporalUnitId === temporalUnitId)
        .map((item) => item.order);

      return [
        ...currentContent,
        {
          id: `sc-${temporalUnitId}-${contentId}`,
          temporalUnitId,
          contentId,
          // El orden se deriva: el campo manual es de RF-12 (FE-M04-12).
          // El 0 inicial evita -Infinity cuando la unidad no tiene contenido.
          order: Math.max(0, ...unitOrders) + 1,
          // La ventana de disponibilidad hereda el rango de la unidad hasta
          // que RF-11 (FE-M04-11) agregue sus propios campos de fecha.
          availableFrom: targetUnit.startDate,
          availableUntil: targetUnit.endDate,
          status: SCHEDULED_CONTENT_STATUS.PROGRAMADO,
        },
      ];
    });

    setSuccessMessage(`"${content.title}" asociada a ${targetUnit.name}.`);

    clearSelectedContent();
  }

  const { form, errors, handleChange, handleSubmit, clearSelectedContent } =
    useAssociateContentForm({
      initialTemporalUnitId: unit ? unit.id : '',
      onValidSubmit: handleValidSubmit,
    });

  const selectedUnit = TEMPORAL_UNITS.find(
    (temporalUnit) => temporalUnit.id === form.temporalUnitId,
  );

  // filter() ya devuelve un array nuevo, así que sort() no muta el estado.
  const unitContent = scheduledContent
    .filter((item) => item.temporalUnitId === form.temporalUnitId)
    .sort((first, second) => first.order - second.order);

  const takenContentIds = new Set(
    scheduledContent.map((item) => item.contentId),
  );

  // Solo las actividades libres. FE-M04-11 traerá el caso contrario (mostrar
  // las ya asociadas para provocar el HTTP 409), y le bastará con cambiar
  // este filtro.
  const availableContent = CONTENT_CATALOG.filter(
    (item) => item.assignedTemporalUnitId === null && !takenContentIds.has(item.id),
  );

  const contentOptions = availableContent.map((item) => ({
    value: item.id,
    label: item.title,
  }));

  const temporalUnitOptions = TEMPORAL_UNITS.map((temporalUnit) => ({
    value: temporalUnit.id,
    label: `${temporalUnit.name} · ${temporalUnit.theme}`,
  }));

  const selectedContent = CONTENT_CATALOG.find(
    (item) => item.id === form.contentId,
  );

  let contentHint = '';

  if (selectedContent) {
    contentHint = `Tipo: ${CONTENT_TYPE_LABEL[selectedContent.type] ?? 'Por definir'}`;
  } else if (contentOptions.length === 0) {
    contentHint = 'No hay actividades disponibles en el catálogo.';
  }

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  function handleTabChange(tabId) {
    if (tabId === ADMINISTRATIVE_TAB.CRONOGRAMA) {
      navigate('/app/administrativo/cronograma');
      return;
    }

    if (tabId === ADMINISTRATIVE_TAB.DASHBOARD) {
      navigate('/app/administrativo');
      return;
    }

    navigate(`/app/administrativo?tab=${encodeURIComponent(tabId)}`);
  }

  function handleBack() {
    navigate('/app/administrativo/cronograma');
  }

  function handleCancel() {
    navigate('/app/administrativo/cronograma');
  }

  function handleUnitChange(event) {
    // El mensaje de éxito nombra una unidad concreta: deja de ser cierto en
    // cuanto se cambia el destino.
    setSuccessMessage('');

    handleChange(event);
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      <AdministrativeHeader
        roleLabel={role ?? 'ADMINISTRATIVO'}
        onLogout={handleLogout}
      />

      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main>
        <div className="mx-auto w-full max-w-[1200px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          <button
            type="button"
            className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)]"
            onClick={handleBack}
          >
            ← Volver al cronograma
          </button>

          <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--brand-600)] uppercase">
            Administración
          </p>

          <h1 className="mt-[var(--space-1)] mb-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
            Asociar contenido a esta unidad
          </h1>

          {unit ? (
            <>
              <p className="mt-[var(--space-2)] mb-0 max-w-[680px] text-[13px] leading-[1.6] text-[var(--text-muted)]">
                Selecciona una actividad del catálogo y la unidad temporal en la
                que quedará programada.
              </p>

              <div className="mt-[var(--space-6)]">
                <AssociateContentForm
                  form={form}
                  errors={errors}
                  contentOptions={contentOptions}
                  contentHint={contentHint}
                  temporalUnitOptions={temporalUnitOptions}
                  successMessage={successMessage}
                  onChange={handleUnitChange}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </div>

              <section
                className="mt-[var(--space-6)]"
                aria-labelledby={CONTENT_LIST_HEADING_ID}
              >
                <h2
                  className="m-0 text-[16px] font-bold text-[var(--text-primary)]"
                  id={CONTENT_LIST_HEADING_ID}
                >
                  Actividades por día
                </h2>

                <p className="mt-[var(--space-1)] mb-0 text-[13px] text-[var(--text-muted)]">
                  {selectedUnit
                    ? `Contenido programado en ${selectedUnit.name}.`
                    : 'Selecciona una unidad temporal para ver su contenido.'}
                </p>

                <div className="mt-[var(--space-4)]">
                  {unitContent.length > 0 ? (
                    <ul className="m-0 grid list-none gap-[var(--space-2)] p-0">
                      {unitContent.map((item) => {
                        const content = CONTENT_CATALOG.find(
                          (catalogItem) => catalogItem.id === item.contentId,
                        );

                        return (
                          <li key={item.id}>
                            <ContentRow
                              order={item.order}
                              title={content?.title ?? item.contentId}
                              contentType={content?.type}
                              status={item.status}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyScheduleState
                      title="Sin actividades asociadas"
                      description="Esta unidad temporal todavía no tiene contenido programado."
                    />
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="mt-[var(--space-6)]">
              <EmptyScheduleState
                title="Unidad temporal no encontrada"
                description={`No existe una unidad temporal con el identificador "${unitId}".`}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
