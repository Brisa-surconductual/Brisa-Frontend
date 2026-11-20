import { useEffect, useRef, useState } from 'react';

import {
  assignParticipants,
  listAvailableParticipants,
} from '../../../data/participantSource.js';
import {
  splitCandidates,
  toggleSelection,
  validateAssignmentSelection,
} from '../../../services/participantAssignment.js';
import { ASSIGNMENT_ERROR } from '../../../types/participantAssignment.js';
import {
  ASSIGNMENT_ERROR_MESSAGE,
  ASSIGNMENT_STORAGE_ERROR,
  CATALOG_LOAD_ERROR,
  getAssignmentIssueMessage,
} from '../../../utils/participantAssignmentMessages.js';

// Fuente actual; estable entre renders para no repetir la consulta.
const DEFAULT_SOURCE = Object.freeze({
  listAvailable: listAvailableParticipants,
  assign: assignParticipants,
});

const NO_CODE = 'Código no disponible';

/*
 * Asignación de participantes a una cohorte (RF-125). Abre el panel,
 * consulta el catálogo, gestiona la selección y envía la solicitud.
 * El estado de cada participante y los conflictos los decide la
 * fuente: aquí solo se presentan, por código estructurado. Evita envíos
 * repetidos y no cambia nada si se cancela o la fuente rechaza la
 * solicitud. `enabled` es false sin una fuente que admita asignar.
 */
export function useParticipantAssignment({
  cohortId,
  enabled = false,
  onAssigned = () => {},
  source = DEFAULT_SOURCE,
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionError, setSelectionError] = useState('');
  const [issues, setIssues] = useState([]);
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const inFlight = useRef(false);
  const focusTarget = useRef(null);
  const headingRef = useRef(null);
  const resultRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !enabled) return undefined;

    let active = true;

    async function loadCatalog() {
      setIsLoadingCandidates(true);
      setCatalogError('');

      try {
        const data = await source.listAvailable(cohortId);
        if (!active) return;

        if (data === null) {
          setCandidates([]);
          setRequestError(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.COHORT_NOT_FOUND]);
        } else {
          setCandidates(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setCandidates([]);
          setCatalogError(CATALOG_LOAD_ERROR);
        }
      } finally {
        if (active) setIsLoadingCandidates(false);
      }
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [catalogAttempt, cohortId, enabled, isOpen, source]);

  // Foco: al abrir, el título del panel; al asignar, el resultado; al
  // cancelar, el botón que abrió el panel.
  useEffect(() => {
    const target = {
      heading: headingRef,
      result: resultRef,
      trigger: triggerRef,
    }[focusTarget.current];

    focusTarget.current = null;
    target?.current?.focus();
  }, [isOpen, result]);

  function resetRequest() {
    setSelectedIds([]);
    setSelectionError('');
    setIssues([]);
    setRequestError('');
  }

  function open() {
    if (!enabled) return;

    resetRequest();
    setResult(null);
    setCandidates([]);
    focusTarget.current = 'heading';
    setIsOpen(true);
  }

  // Cancelar no envía nada ni cambia la cohorte.
  function cancel() {
    if (inFlight.current) return;

    resetRequest();
    focusTarget.current = 'trigger';
    setIsOpen(false);
  }

  // Quitar un participante también quita su conflicto; sin conflictos
  // pendientes, el aviso de la solicitud rechazada ya no aplica.
  function clearIssue(id) {
    const remaining = issues.filter(({ participantId }) => participantId !== id);

    setIssues(remaining);
    if (issues.length > 0 && remaining.length === 0) setRequestError('');
  }

  function toggle(id) {
    setSelectedIds((current) => toggleSelection(current, id));
    setSelectionError('');
    clearIssue(id);
  }

  function remove(id) {
    setSelectedIds((current) => current.filter((selected) => selected !== id));
    clearIssue(id);
  }

  async function submit(event) {
    event?.preventDefault?.();
    if (inFlight.current || !enabled) return;

    const selectionProblem = validateAssignmentSelection(selectedIds);

    if (selectionProblem) {
      setSelectionError(ASSIGNMENT_ERROR_MESSAGE[selectionProblem]);
      return;
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setIssues([]);
    setRequestError('');

    try {
      const response = await source.assign(cohortId, selectedIds);

      if (response?.ok) {
        const assigned = Array.isArray(response.assigned) ? response.assigned : [];

        onAssigned(assigned);
        resetRequest();
        focusTarget.current = 'result';
        setResult(assigned);
        setIsOpen(false);
      } else if (response?.error === ASSIGNMENT_ERROR.EMPTY_SELECTION) {
        setSelectionError(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.EMPTY_SELECTION]);
      } else if (response?.error === ASSIGNMENT_ERROR.CONFLICT) {
        // Nada se asignó; el catálogo se vuelve a consultar.
        setIssues(Array.isArray(response.issues) ? response.issues : []);
        setRequestError(ASSIGNMENT_ERROR_MESSAGE[ASSIGNMENT_ERROR.CONFLICT]);
        setCatalogAttempt((value) => value + 1);
      } else {
        setRequestError(ASSIGNMENT_ERROR_MESSAGE[response?.error] ?? ASSIGNMENT_STORAGE_ERROR);
      }
    } catch {
      setRequestError(ASSIGNMENT_STORAGE_ERROR);
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const { available, unavailable } = splitCandidates(candidates);
  const codeOf = (id) =>
    candidates.find((candidate) => candidate.id === id)?.code ??
    issues.find(({ participantId }) => participantId === id)?.code ??
    NO_CODE;

  return {
    canAssign: enabled,
    isOpen,
    available,
    unavailable: unavailable.map((candidate) => ({
      ...candidate,
      message: getAssignmentIssueMessage(candidate.issue),
    })),
    isLoadingCandidates,
    catalogError,
    selected: selectedIds.map((id) => ({
      id,
      code: codeOf(id),
      hasIssue: issues.some(({ participantId }) => participantId === id),
    })),
    selectionError,
    conflicts: issues.map(({ participantId, code, issue }) => ({
      participantId,
      code: code ?? NO_CODE,
      message: getAssignmentIssueMessage(issue),
    })),
    requestError,
    isSubmitting,
    result,
    headingRef,
    resultRef,
    triggerRef,
    open,
    cancel,
    toggle,
    remove,
    submit,
    retryCatalog: () => setCatalogAttempt((value) => value + 1),
    dismissResult: () => setResult(null),
  };
}
