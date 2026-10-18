import { useCallback, useState } from 'react';

export type OnboardingStep = 'asset' | 'tool' | 'ai' | 'alert';
export const ONBOARDING_STEPS: OnboardingStep[] = ['asset', 'tool', 'ai', 'alert'];

interface State {
  done: Partial<Record<OnboardingStep, true>>;
  dismissed?: boolean;
}

const key = (uid: string) => `funda:onboarding:${uid}`;

function read(uid: string): State {
  try {
    const s = JSON.parse(localStorage.getItem(key(uid)) ?? 'null');
    return s && typeof s === 'object' && s.done ? s : { done: {} };
  } catch {
    return { done: {} };
  }
}

function write(uid: string, s: State) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(s));
  } catch {
    /* storage unavailable: onboarding just won't persist */
  }
}

/** Records a first-steps milestone (safe to call repeatedly). */
export function markStep(uid: string, step: OnboardingStep) {
  const s = read(uid);
  if (s.done[step]) return;
  write(uid, { ...s, done: { ...s.done, [step]: true } });
}

/** Read on mount; the Dashboard remounts on every visit, so it always sees fresh progress. */
export function useOnboarding(uid: string) {
  const [state, setState] = useState(() => read(uid));
  const dismiss = useCallback(() => {
    const next = { ...read(uid), dismissed: true };
    write(uid, next);
    setState(next);
  }, [uid]);
  return { done: state.done, dismissed: !!state.dismissed, dismiss };
}
