import { LazyMotion, domAnimation } from 'motion/react';

import { A11Y } from '../../data/landing.content.js';
import { noopInstallStore } from '../../utils/noopInstallStore.js';
import { AboutSection } from './components/AboutSection/index.js';
import { FaqSection } from './components/FaqSection/index.js';
import { FinalCta } from './components/FinalCta/index.js';
import { HeroOrbital } from './components/HeroOrbital/index.js';
import { InstallSheet } from './components/InstallSheet/index.js';
import { JourneySection } from './components/JourneySection/index.js';
import { MobileDock } from './components/MobileDock/index.js';
import { FeatureGrid } from './components/FeatureGrid/index.js';
import { PhoneDemo } from './components/PhoneDemo/index.js';
import { ProcessSection } from './components/ProcessSection/index.js';
import { RemindersSection } from './components/RemindersSection/index.js';
import { SideTab } from './components/SideTab/index.js';
import { TrackingSection } from './components/TrackingSection/index.js';
import { TrustSection } from './components/TrustSection/index.js';
import { useLandingPage } from './hooks/useLandingPage.js';

import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '../../styles/landing.css';

/**
 * Landing pública de Brisa (ruta «/»). Sin llamadas a la API ni analítica.
 * La sesión, la ruta de «Ir a mi espacio» y el almacén de instalación los
 * inyecta la ruta (app/router) para que la feature no importe de otras.
 *
 * @param {{
 *   isAuthenticated?: boolean,
 *   homePath?: string,
 *   installStore?: typeof noopInstallStore,
 * }} props
 */
export function LandingPage({
  isAuthenticated = false,
  homePath = '/login',
  installStore = noopInstallStore,
}) {
  const page = useLandingPage({ isAuthenticated, homePath, installStore });

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="landing"
        data-paused={page.paused}
        data-reduced={page.reduced}
      >
        <a href="#contenido" className="lp-skip">
          {A11Y.skip}
        </a>
        <div className="lp-progress" aria-hidden="true" />
        <SideTab ctas={page.ctas} onInstall={page.requestInstall} />

        <main id="contenido">
          <HeroOrbital
            ctas={page.ctas}
            onInstall={page.requestInstall}
            paused={page.paused}
            onTogglePaused={page.togglePaused}
          />
          <AboutSection />
          <FeatureGrid />
          <PhoneDemo demoKey={page.demoKey} />
          <JourneySection />
          <TrackingSection />
          <RemindersSection onOpenDemo={page.openDemo} />
          <TrustSection />
          <ProcessSection />
          <FaqSection />
          <FinalCta ctas={page.ctas} onInstall={page.requestInstall} />
        </main>

        <MobileDock ctas={page.ctas} onInstall={page.requestInstall} />
        <InstallSheet
          open={page.helpOpen}
          installState={page.install.state}
          onClose={page.closeHelp}
        />
      </div>
    </LazyMotion>
  );
}
