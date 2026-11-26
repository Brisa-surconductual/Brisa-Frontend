import { CheckCircle2, Plus } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import { ChatAdminNotice } from '../../../../components/ChatAdminNotice/index.js';
import { NOMBRE_FLUJO_MAX } from '../../../../types/estadoFlujo.js';

/*
 * Crea un flujo grupal en borrador (RF-25). Solo pide el nombre: la
 * modalidad GRUPAL la fija el frontend y el backend asigna versión 1.
 */
export function CreateGroupFlowForm({
  nombre,
  nombreError,
  creation,
  onChangeNombre,
  onSubmit,
}) {
  const saving = creation.status === 'saving';

  return (
    <section
      aria-labelledby="crear-flujo-titulo"
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-5)]"
    >
      <h2
        id="crear-flujo-titulo"
        className="m-0 text-[length:var(--font-size-lg)] font-extrabold text-[var(--text-primary)]"
      >
        Nuevo flujo grupal
      </h2>

      <form
        noValidate
        className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <TextField
          id="flujo-nombre"
          label="Nombre del flujo"
          className="md:flex-1"
          value={nombre}
          maxLength={NOMBRE_FLUJO_MAX}
          required
          disabled={saving}
          error={nombreError}
          hint="Se crea como borrador."
          onChange={(event) => onChangeNombre(event.target.value)}
        />

        <Button
          type="submit"
          size="large"
          loading={saving}
          loadingText="Creando..."
          className="md:mt-[26px]"
        >
          <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
          Crear flujo
        </Button>
      </form>

      {creation.status === 'success' && (
        <ChatAdminNotice tone="success" icon={CheckCircle2} role="status">
          {creation.message}
        </ChatAdminNotice>
      )}

      {creation.status === 'error' && (
        <ChatAdminNotice
          tone="danger"
          role="alert"
          title="No se pudo crear el flujo"
        >
          {creation.message}
        </ChatAdminNotice>
      )}
    </section>
  );
}
