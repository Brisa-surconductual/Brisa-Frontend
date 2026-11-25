import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { DEMO } from '../../../data/landing.content.js';
import { chooseOption, startDemo } from '../../../services/demoChat.js';

// Demo ilustrativa: árbol de decisiones sin texto libre. Nada se envía ni se
// guarda; todo vive en el estado local.
export function usePhoneDemo({ logRef, optionsRef }) {
  const reduce = useReducedMotion();
  const [state, setState] = useState(() => startDemo(DEMO.tree));
  const [typing, setTyping] = useState(false);
  const timerRef = useRef(0);
  const interactedRef = useRef(false);

  const node = DEMO.tree.nodes[state.nodeId];
  const finished = node.options.length === 0;

  // Mantiene visible el último mensaje dentro del teléfono (no del page).
  useEffect(() => {
    const log = logRef.current;

    log?.scrollTo({
      top: log.scrollHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [state.messages.length, typing, reduce, logRef]);

  // Tras cada respuesta el foco pasa a la primera opción nueva, para que
  // quien usa teclado no lo pierda cuando cambian los botones.
  useEffect(() => {
    if (typing || !interactedRef.current) return;

    optionsRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [typing, state.nodeId, optionsRef]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function choose(optionId) {
    if (typing) return;

    const step = chooseOption(DEMO.tree, state.nodeId, optionId);

    if (!step) return;

    interactedRef.current = true;
    setTyping(true);
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { id: `me-${current.messages.length}`, from: 'me', text: step.userText },
      ],
    }));

    timerRef.current = window.setTimeout(
      () => {
        setTyping(false);
        setState((current) => ({
          nodeId: step.nextId,
          messages: [
            ...current.messages,
            {
              id: `bot-${current.messages.length}`,
              from: 'bot',
              text: step.botText,
            },
          ],
        }));
      },
      reduce ? 0 : 650,
    );
  }

  function showHelp() {
    interactedRef.current = true;
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: `bot-${current.messages.length}`,
          from: 'bot',
          text: DEMO.helpReply,
        },
      ],
    }));
  }

  function restart() {
    clearTimeout(timerRef.current);
    setTyping(false);
    setState(startDemo(DEMO.tree));
  }

  return {
    messages: state.messages,
    options: node.options,
    typing,
    finished,
    choose,
    showHelp,
    restart,
  };
}
