import { ConfirmationDialog } from '@/shared/components/ui/ConfirmationDialog/index.js';

import { ACCION_ARBOL } from '../../services/arbolesPersonalizados.js';

import { PersonalizedTreeActions } from './components/PersonalizedTreeActions/index.js';
import { usePersonalizedTreesPage } from './hooks/usePersonalizedTreesPage.js';
import { PersonalizedTreesPage } from './PersonalizedTreesPage.jsx';

const TEXTO_CONFIRMACION = Object.freeze({
  [ACCION_ARBOL.PUBLICAR]: {
    title: '¿Publicar este árbol?',
    description:
      'Quedará como el árbol vigente de su combinación de perfil. Revisa que esté completo antes de publicar.',
    confirmText: 'Publicar',
  },
  [ACCION_ARBOL.ARCHIVAR]: {
    title: '¿Archivar este árbol?',
    description:
      'Los árboles no se eliminan: al archivarlo deja de estar disponible para usarse.',
    confirmText: 'Archivar',
  },
});

/*
 * RF-25C · Árboles personalizados conectados al backend. La vista
 * (PersonalizedTreesPage) sigue recibiendo todo por props.
 */
export function PersonalizedTreesScreen() {
  const page = usePersonalizedTreesPage();
  const texto = page.confirm ? TEXTO_CONFIRMACION[page.confirm.action] : null;

  return (
    <PersonalizedTreesPage
      trees={page.trees}
      isLoading={page.status === 'loading'}
      error={page.status === 'error' ? page.loadError : null}
      notice={page.notice}
      actionError={page.actionError}
      renderActions={(tree, combination) => (
        <PersonalizedTreeActions
          tree={tree}
          combination={combination}
          busy={page.busy}
          onAction={page.requestAction}
        />
      )}
      dialog={
        <ConfirmationDialog
          open={Boolean(page.confirm)}
          title={texto?.title ?? ''}
          description={texto?.description ?? ''}
          confirmText={texto?.confirmText}
          loading={page.busy}
          onConfirm={page.confirmAction}
          onCancel={page.cancelConfirm}
        />
      }
    />
  );
}
