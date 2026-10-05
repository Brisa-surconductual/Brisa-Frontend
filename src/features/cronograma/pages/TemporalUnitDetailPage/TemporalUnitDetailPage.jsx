import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/index.js';

import { AdministrativeHeader } from '@/shared/components/navigation/AdministrativeHeader/index.js';
import { AdministrativeTabBar } from '@/shared/components/navigation/AdministrativeTabBar/index.js';
import { ADMINISTRATIVE_TAB, ADMINISTRATIVE_TABS } from '@/shared/data/administrativeTabs.js';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';
import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';
import {updateUnitTemporal} from '../../api/unidadTemporal/updateUnitTemporal';
import {FormAlert} from '../../../../shared/components/ui/FromAlert/FromALert'

export function TemporalUnitDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unitId } = useParams();
  const { role, logout } = useAuth();
  const [formError, setFormError] = useState('');
  const [unit, setUnit] = useState(location.state?.unit ?? null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    nombre: unit?.nombreUnidadTemporal || '',
    fecha_inicio: unit?.fechaInicio?.split('T')[0] || '',
    fecha_fin: unit?.fechaFin?.split('T')[0] || ''
  });

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
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
    navigate(-1);
  }

  function handleAssociateContent() {
    navigate(`/app/administrativo/cronograma/${encodeURIComponent(unitId)}/contenido`);
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    if (formError) setFormError('');
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    const payload = {
      idUnidadTemporal: unit.idUnidadTemporal,
    };

   
    if (editForm.nombre) payload.nombre = editForm.nombre;
    if (editForm.fecha_inicio) payload.fecha_inicio = editForm.fecha_inicio;
    if (editForm.fecha_fin) payload.fecha_fin = editForm.fecha_fin;

    try {
      console.log('Enviando actualización al backend:', payload);
      
      await updateUnitTemporal(payload);
      
      setUnit({
        ...unit,
        nombreUnidadTemporal: editForm.nombre || unit.nombreUnidadTemporal,
        fechaInicio: editForm.fecha_inicio || unit.fechaInicio,
        fechaFin: editForm.fecha_fin || unit.fechaFin
      });
      
      setIsEditModalOpen(false);
    } catch (error) {
      const mensajeDelBack = error.response?.data?.message || 'Ocurrió un error inesperado';
      setFormError(Array.isArray(mensajeDelBack) ? mensajeDelBack[0] : mensajeDelBack);
      console.error('Detalle técnico:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteClick() {
    setIsDeleteDialogOpen(true);
  }

  function handleConfirmDelete() {
    // Aquí iría tu llamada a la API para eliminar: await eliminarUnidadTemporal(unit.idUnidadTemporal);
    console.log('Eliminando unidad:', unit.idUnidadTemporal);
    setIsDeleteDialogOpen(false);
    handleBack(); // Regresar al panel tras eliminar
  }

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--surface-bg)]">
        <p className="text-[var(--text-muted)] font-medium mb-4">Unidad no encontrada o datos perdidos.</p>
        <Button onClick={() => navigate('/app/administrativo/cronograma')}>Volver a cronogramas</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] flex flex-col">
      <AdministrativeHeader roleLabel={role ?? 'ADMINISTRATIVO'} onLogout={handleLogout} />
      
      <AdministrativeTabBar
        tabs={ADMINISTRATIVE_TABS}
        activeTabId={ADMINISTRATIVE_TAB.CRONOGRAMA}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 pb-[var(--space-8)]">
        <div className="mx-auto w-full max-w-[1000px] px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-7)] md:py-[var(--space-8)]">
          
          <button onClick={handleBack} className="mb-[var(--space-5)] text-[13px] font-bold text-[var(--brand-600)] transition-colors hover:text-[var(--brand-700)]">
            ← Volver al panel del cronograma
          </button>

          {/* CABEZOTE MINIMALISTA */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 pb-[var(--space-6)] border-b border-[var(--surface-border)]">
            <div>
              <div className="flex items-center gap-3 mb-[var(--space-2)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-100)] text-[12px] font-extrabold text-[var(--brand-700)]">
                  {unit.orden ?? '-'}
                </span>
                <p className="m-0 text-[12px] font-bold tracking-[0.04em] text-[var(--text-muted)] uppercase">
                  Unidad Temporal
                </p>
              </div>
              
              <h1 className="m-0 text-[26px] font-extrabold text-[var(--text-primary)] md:text-[30px]">
                {unit.nombreUnidadTemporal}
              </h1>
              
              <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-3 text-[13px] text-[var(--text-muted)] font-medium">
                <span className="bg-white border border-[var(--surface-border)] px-2 py-1 rounded-md">
                  Vigencia: {unit.fechaInicio?.split('T')[0]} al {unit.fechaFin?.split('T')[0]}
                </span>
                <span className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                  unit.status === 'ACTIVA' ? 'bg-[var(--brand-50)] text-[var(--brand-700)]' : 
                  unit.status === 'COMPLETADA' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 
                  'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                }`}>
                  {unit.status}
                </span>
              </div>
            </div>
            
            {/* BOTONES DE ACCIÓN (Editar y Eliminar) */}
            <div className="flex w-full sm:w-auto gap-3">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex-1 sm:flex-none">
                 Editar
              </Button>
              <Button variant="danger" onClick={handleDeleteClick} className="flex-1 sm:flex-none">
                Eliminar
              </Button>
            </div>
          </header>

          {/* SECCIÓN DE CONTENIDOS ASOCIADOS */}
          <section className="mt-[var(--space-8)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-extrabold text-[var(--text-primary)] m-0">
                Contenidos Asociados
              </h2>
              <Button variant="secondary" onClick={handleAssociateContent} className="text-[13px]">
                + Asociar contenido
              </Button>
            </div>
            
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-8)] text-center shadow-sm">
              <p className="m-0 text-[14px] text-[var(--text-muted)]">
                Aún no hay contenidos cargados para esta unidad temporal. Utiliza el botón superior para vincular recursos.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* MODAL DE EDICIÓN MINIMALISTA */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-lg w-full max-w-[500px] overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-[var(--surface-border)] flex justify-between items-center">
              <h3 className="m-0 text-[18px] font-bold text-[var(--text-primary)]">Modificar Unidad</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-black font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 flex flex-col gap-5">
              <TextField 
                label="Nombre de la unidad" 
                name="nombre" 
                value={editForm.nombre} 
                onChange={handleEditChange} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField 
                  label="Fecha inicio" 
                  name="fecha_inicio" 
                  type="date" 
                  value={editForm.fecha_inicio} 
                  onChange={handleEditChange} 
                  required 
                />
                <TextField 
                  label="Fecha fin" 
                  name="fecha_fin" 
                  type="date" 
                  value={editForm.fecha_fin} 
                  onChange={handleEditChange} 
                  required 
                />
              </div>
              
              <div className="mt-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit" loading={isSubmitting}>Guardar cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-lg w-full max-w-[500px] overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-[var(--surface-border)] flex justify-between items-center">
              <h3 className="m-0 text-[18px] font-bold text-[var(--text-primary)]">Modificar Unidad</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--text-muted)] hover:text-black font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 flex flex-col gap-4">
              
              {/* CAJITA ROJA DE ALERTA CONSUMIENDO EL ERROR DEL BACKEND */}
              <FormAlert message={formError} />

              <TextField 
                label="Nombre de la unidad" 
                name="nombre" 
                value={editForm.nombre} 
                onChange={handleEditChange} 
                required 
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField 
                  label="Fecha inicio" 
                  name="fecha_inicio" 
                  type="date" 
                  value={editForm.fecha_inicio} 
                  onChange={handleEditChange} 
                  required 
                />
                <TextField 
                  label="Fecha fin" 
                  name="fecha_fin" 
                  type="date" 
                  value={editForm.fecha_fin} 
                  onChange={handleEditChange} 
                  required 
                />
              </div>
              
              <div className="mt-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit" loading={isSubmitting}>Guardar cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Eliminar unidad temporal"
        description={`¿Estás seguro de eliminar la unidad "${unit.nombreUnidadTemporal}"? Esta acción requiere confirmación y podría afectar los contenidos asociados.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}