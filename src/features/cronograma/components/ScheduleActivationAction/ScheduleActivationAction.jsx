import { Button } from '@/shared/components/ui/Button/index.js';
import { ScheduleActivationDialog } from '../ScheduleActivationDialog/index.js';
import { useScheduleActivation } from '../../hooks/useScheduleActivation.js';

export function ScheduleActivationAction({
  schedule,
  onActivated,
  disabled = false,
}) {
  const activation = useScheduleActivation({ schedule, onActivated });
  if (schedule.estado !== 'INACTIVO') return null;
  return (
    <>
      <Button disabled={disabled} onClick={activation.requestActivation}>
        Validar y activar cronograma
      </Button>
      <ScheduleActivationDialog
        open={activation.open}
        isSubmitting={activation.isSubmitting}
        error={activation.error}
        scheduleName={schedule.nombreCronograma}
        isBase={schedule.esBase}
        onConfirm={activation.confirmActivation}
        onCancel={activation.cancelActivation}
      />
    </>
  );
}
