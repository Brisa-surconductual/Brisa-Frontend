import { Outlet } from 'react-router-dom';

import { RegistrationProvider } from '../../../features/users/context/RegistrationProvider.jsx';

import styles from './RegistrationLayout.module.css';

export function RegistrationLayout() {
  return (
    <RegistrationProvider>
      <main className={styles.page}>
        <section className={styles.container}>
          <Outlet />
        </section>
      </main>
    </RegistrationProvider>
  );
}