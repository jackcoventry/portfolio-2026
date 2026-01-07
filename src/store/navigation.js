import { atom } from 'nanostores';

export const navigationOpen = atom(false);

export function navigationToggle() {
  navigationOpen.set(!navigationOpen.get());
}
