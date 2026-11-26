import { ProgramModalityPage } from './ProgramModalityPage.jsx';
import { useProgramModalityScreen } from './hooks/useProgramModalityScreen.js';

/*
 * RF-25B · Modalidad del programa conectada al backend. La vista
 * (ProgramModalityPage) sigue recibiendo todo por props.
 */
export function ProgramModalityScreen() {
  const screen = useProgramModalityScreen();

  return (
    <ProgramModalityPage
      eligibility={screen.eligibility}
      isLoading={screen.status === 'loading'}
      error={screen.status === 'error' ? screen.loadError : null}
      onEnableModality={screen.enableModality}
    />
  );
}
