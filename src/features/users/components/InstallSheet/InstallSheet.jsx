import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Ellipsis, EllipsisVertical, Share } from 'lucide-react';

import { Button } from '../../../../shared/components/ui/Button/index.js';

import {
  INSTALL_INSTRUCTIONS,
  INSTALL_KEY,
  INSTALL_SHEET_TEXT,
  INSTALL_TABS,
} from '../../types/installInstructions.js';
import {
  FOCUSABLE_SELECTOR,
  getInitialTab,
  getIntro,
  getSheetView,
  getTrapTarget,
  isDetected,
} from './installSheetLogic.js';

const KEY_ICON = Object.freeze({
  [INSTALL_KEY.MENU_VERTICAL]: EllipsisVertical,
  [INSTALL_KEY.MENU_HORIZONTAL]: Ellipsis,
  [INSTALL_KEY.COMPARTIR]: Share,
});

function StepText({ fragments }) {
  return fragments.map((fragment, index) => {
    if (typeof fragment === 'string') {
      return <Fragment key={index}>{fragment}</Fragment>;
    }

    if (fragment.negrita) {
      return <strong key={index}>{fragment.negrita}</strong>;
    }

    const Icon = KEY_ICON[fragment.tecla];

    return (
      <span
        key={index}
        className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-hover)] px-[var(--space-1)] align-middle"
      >
        <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>
    );
  });
}

function StepList({ steps }) {
  return (
    <ol className="mb-[var(--space-4)] flex list-none flex-col gap-[var(--space-3)] p-0">
      {steps.map((fragments, index) => (
        <li
          key={index}
          className="flex gap-[var(--space-3)] text-[13px] leading-[1.5] text-[var(--text-primary)]"
        >
          <span
            aria-hidden="true"
            className="mt-px flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-500)] text-[11.5px] font-extrabold text-[var(--button-primary-text)]"
          >
            {index + 1}
          </span>

          <span>
            <StepText fragments={fragments} />
          </span>
        </li>
      ))}
    </ol>
  );
}

// Se monta al abrir y se desmonta al cerrar: así cada apertura empieza en la
// plataforma detectada. El retorno del foco al botón lo maneja la página.
export function InstallSheet({ platform, onClose }) {
  const [tab, setTab] = useState(() => getInitialTab(platform));
  const titleRef = useRef(null);
  const titleId = useId();
  const introId = useId();

  const view = getSheetView(tab);
  const content = INSTALL_INSTRUCTIONS[view];

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const target = getTrapTarget({
      focusables: [...event.currentTarget.querySelectorAll(FOCUSABLE_SELECTOR)],
      active: document.activeElement,
      shiftKey: event.shiftKey,
    });

    if (target) {
      event.preventDefault();
      target.focus();
    }
  }

  // La intro general va bajo el título; la propia de la plataforma, bajo las
  // pestañas, como en el prototipo.
  const intro = (
    <p
      id={introId}
      className="mt-0 mb-[var(--space-4)] text-[12.5px] leading-[1.5] text-[var(--text-secondary)]"
    >
      {getIntro(view)}
    </p>
  );

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--neutral-900)]/55"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={introId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[88vh] w-full max-w-[420px] overflow-y-auto rounded-t-[var(--radius-2xl)] bg-[var(--surface-card)] px-[var(--space-5)] pt-[var(--space-3)] pb-[var(--space-6)] text-[var(--text-primary)] shadow-[var(--shadow-lg)] transition-[translate,opacity] duration-[250ms] ease-out outline-none starting:translate-y-[24px] starting:opacity-0 motion-reduce:transition-none"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-[var(--space-4)] h-[4px] w-[38px] rounded-[var(--radius-full)] bg-[var(--surface-border)]"
        />

        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="mt-0 mb-[var(--space-1)] text-[18px] font-extrabold"
        >
          {INSTALL_SHEET_TEXT.title}
        </h2>

        {!content.intro && intro}

        <div
          role="group"
          aria-label={INSTALL_SHEET_TEXT.tabsLabel}
          className="mb-[var(--space-4)] flex gap-[var(--space-1)] rounded-[var(--radius-full)] bg-[var(--surface-hover)] p-[var(--space-1)]"
        >
          {INSTALL_TABS.map((item) => (
            <button
              key={item.platform}
              type="button"
              aria-pressed={tab === item.platform}
              onClick={() => setTab(item.platform)}
              className="min-h-[44px] flex-1 rounded-[var(--radius-full)] px-[var(--space-2)] text-[12px] font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] motion-reduce:transition-none aria-pressed:bg-[var(--surface-card)] aria-pressed:text-[var(--brand-600)] aria-pressed:shadow-[var(--shadow-sm)]"
            >
              {item.label}
            </button>
          ))}
        </div>

        {isDetected(tab, platform) && (
          <p className="mt-[calc(var(--space-2)*-1)] mb-[var(--space-4)] text-center text-[10.5px] text-[var(--text-muted)]">
            {INSTALL_SHEET_TEXT.detected}
          </p>
        )}

        {content.intro && intro}

        {content.steps && <StepList steps={content.steps} />}

        {content.groups?.map((group) => (
          <Fragment key={group.title}>
            <h3 className="mt-[var(--space-1)] mb-[var(--space-3)] text-[12px] font-extrabold">
              {group.title}
            </h3>

            <StepList steps={group.steps} />
          </Fragment>
        ))}

        {content.note && (
          <p className="mt-0 mb-[var(--space-4)] text-[11.5px] leading-[1.5] text-[var(--text-muted)]">
            {content.note}
          </p>
        )}

        <Button fullWidth size="large" onClick={onClose}>
          {INSTALL_SHEET_TEXT.close}
        </Button>
      </div>
    </div>
  );
}
