import { ICONS } from '../../utils/icons.js';

/**
 * Ícono de lucide por nombre (los textos guardan solo el nombre).
 * Decorativo: el texto vecino da el nombre accesible.
 */
export function LandingIcon({ name, size = 20, strokeWidth = 1.7, ...rest }) {
  const Icon = ICONS[name];

  if (!Icon) return null;

  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
}
