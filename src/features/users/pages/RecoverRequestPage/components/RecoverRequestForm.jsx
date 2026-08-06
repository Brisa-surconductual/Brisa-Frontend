import { Mail } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';
import { TextField } from '@/shared/components/ui/TextField/index.js';

import styles from './RecoverRequestForm.module.css';

export function RecoverRequestForm({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <TextField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="email"
        value={form.email}
        error={errors.email}
        onChange={onChange}
        disabled={isSubmitting}
        startIcon={<Mail size={19} strokeWidth={1.5} aria-hidden="true" />}
        required
      />

      <Button
        type="submit"
        size="large"
        fullWidth
        loading={isSubmitting}
        loadingText="Enviando código..."
      >
        Enviar código
      </Button>
    </form>
  );
}
