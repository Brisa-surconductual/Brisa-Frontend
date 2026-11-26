import { useEffect, useRef, useState } from 'react';

import { DASHBOARD_SOURCE } from '../data/cohortDashboardSource.js';
import { findActiveCohort } from '../services/activeCohort.js';
import {
  assembleDashboard,
  loadDashboardSection,
  loadDashboardSections,
  rememberValidSections,
  withTimeout,
} from '../services/cohortDashboard.js';
import {
  dashboardStatusFromError,
  interpretDashboardResponse,
  replaceDashboardSection,
} from '../services/cohortDashboardResponse.js';
import { dashboardCache } from '../services/dashboardCache.js';
import {
  ACTIVE_COHORT_RESULT,
  DASHBOARD_QUERY_TIMEOUT_MS,
  DASHBOARD_STATUS,
  SECTION_OUTCOME,
} from '../types/cohortDashboard.js';

const EMPTY_SECTIONS = Object.freeze([]);
const EMPTY = Object.freeze({
  cohort: null,
  activeCohorts: EMPTY_SECTIONS,
  results: null,
  loadedAt: null,
  dashboard: null,
});

const STATUS_BY_RESULT = Object.freeze({
  [ACTIVE_COHORT_RESULT.NONE]: DASHBOARD_STATUS.NO_ACTIVE_COHORT,
  [ACTIVE_COHORT_RESULT.MULTIPLE]: DASHBOARD_STATUS.MULTIPLE_ACTIVE_COHORTS,
});

async function loadServerDashboard(source, timeoutMs) {
  try {
    const response = await withTimeout(
      Promise.resolve().then(() => source.getDashboard()),
      timeoutMs,
    );
    return { ...EMPTY, ...interpretDashboardResponse(response) };
  } catch (error) {
    return { ...EMPTY, status: dashboardStatusFromError(error) };
  }
}

export function useCohortDashboard({
  source = DASHBOARD_SOURCE,
  cache = dashboardCache,
  timeoutMs = DASHBOARD_QUERY_TIMEOUT_MS,
} = {}) {
  const [isDemo] = useState(() => source.isDemo());
  const [state, setState] = useState(() => ({
    status: DASHBOARD_STATUS.LOADING,
    ...EMPTY,
  }));
  const [retrying, setRetrying] = useState(EMPTY_SECTIONS);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const cohortId = state.cohort?.id;

  useEffect(() => {
    let active = true;
    async function load() {
      setState({ status: DASHBOARD_STATUS.LOADING, ...EMPTY });
      setRetrying(EMPTY_SECTIONS);

      if (!isDemo) {
        const result = await loadServerDashboard(source, timeoutMs);
        if (active) setState(result);
        return;
      }

      let cohorts;
      try {
        cohorts = await withTimeout(
          Promise.resolve().then(() => source.listCohorts()),
          timeoutMs,
        );
      } catch {
        if (active)
          setState({ status: DASHBOARD_STATUS.COHORTS_ERROR, ...EMPTY });
        return;
      }
      if (!active) return;

      const { result, cohort, activeCohorts } = findActiveCohort(cohorts);
      if (result !== ACTIVE_COHORT_RESULT.FOUND) {
        setState({ status: STATUS_BY_RESULT[result], ...EMPTY, activeCohorts });
        return;
      }

      const loadedAt = new Date().toISOString();
      setState({ status: DASHBOARD_STATUS.LOADING, ...EMPTY, cohort });
      const results = await loadDashboardSections(
        cohort.id,
        source.queries,
        timeoutMs,
      );
      if (!active) return;
      rememberValidSections(cache, cohort.id, results, loadedAt);
      setState({
        status: DASHBOARD_STATUS.READY,
        cohort,
        activeCohorts,
        results,
        loadedAt,
      });
    }

    void load();
    return () => {
      active = false;
      generation.current += 1;
    };
  }, [attempt, cache, isDemo, source, timeoutMs]);

  useEffect(() => {
    if (isDemo || !cohortId) return undefined;
    let active = true;
    void withTimeout(
      Promise.resolve().then(() => source.getCohort(cohortId)),
      timeoutMs,
    ).then(
      (cohort) => {
        if (active && cohort?.id === cohortId) {
          setState((current) =>
            current.cohort?.id === cohortId ? { ...current, cohort } : current,
          );
        }
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [cohortId, isDemo, source, timeoutMs]);

  async function retrySection(section) {
    if (
      state.status !== DASHBOARD_STATUS.READY ||
      !cohortId ||
      retrying.includes(section)
    )
      return;
    const requestGeneration = generation.current;
    setRetrying((current) => Object.freeze([...current, section]));

    if (isDemo) {
      const result = await loadDashboardSection(
        section,
        cohortId,
        source.queries,
        timeoutMs,
      );
      if (generation.current !== requestGeneration) return;
      if (result.outcome === SECTION_OUTCOME.RESPONDED) {
        cache.remember(
          cohortId,
          section,
          result.view,
          new Date().toISOString(),
        );
      }
      setState((current) =>
        current.cohort?.id === cohortId && current.results
          ? { ...current, results: { ...current.results, [section]: result } }
          : current,
      );
    } else {
      const update = await loadServerDashboard(source, timeoutMs);
      if (generation.current !== requestGeneration) return;
      // Un cambio de cohorte o permisos invalida todo el panel visible.
      if (
        update.status !== DASHBOARD_STATUS.PANEL_ERROR &&
        update.cohort?.id !== cohortId
      ) {
        generation.current += 1;
        setState(update);
        setRetrying(EMPTY_SECTIONS);
        return;
      }
      setState((current) =>
        current.cohort?.id === cohortId && current.dashboard
          ? {
              ...current,
              dashboard: replaceDashboardSection(
                current.dashboard,
                section,
                update.dashboard,
              ),
            }
          : current,
      );
    }
    setRetrying((current) =>
      Object.freeze(current.filter((item) => item !== section)),
    );
  }

  const dashboard = state.results
    ? assembleDashboard({
        cohortId,
        results: state.results,
        loadedAt: state.loadedAt,
        cache,
      })
    : state.dashboard;

  return {
    status: state.status,
    cohort: state.cohort,
    activeCohorts: state.activeCohorts,
    dashboard,
    retryingSections: retrying,
    isDemo,
    reload: () => {
      generation.current += 1;
      setAttempt((value) => value + 1);
    },
    retrySection,
  };
}
