import { navigationOpen, navigationToggle } from '@/store/navigation.js';
import { createFocusTrap } from '@/utils/focusTrap';

type Cleanup = () => void;

type NavMenuOptions = {
  toggleId?: string;
  navId?: string;
  navItemsId?: string;
  headerId?: string;
  lgMediaQuery?: string;
  initialFocusSelector?: string;
  itemsAnimateDelayMs?: number;
};

export function initNavigationMenu(options: NavMenuOptions = {}): Cleanup {
  const {
    toggleId = 'navigationToggle',
    navId = 'navigation',
    navItemsId = 'navigationItems',
    headerId = 'header',
    lgMediaQuery = '(min-width: 64rem)',
    initialFocusSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    itemsAnimateDelayMs = 250,
  } = options;

  const toggle = document.getElementById(toggleId) as HTMLButtonElement | null;
  const navEl = document.getElementById(navId);
  const navItemsEl = document.getElementById(navItemsId);
  const header = document.getElementById(headerId);

  if (!toggle || !navEl) return () => {};

  let releaseTrap: Cleanup | null = null;
  let previousBodyOverflow = '';

  const lgMq = window.matchMedia(lgMediaQuery);
  let isLg = lgMq.matches;

  const stopLenis = () => window.__lenis?.stop();
  const startLenis = () => window.__lenis?.start();

  const setUI = (open: boolean) => {
    if (open) {
      previousBodyOverflow = document.body.style.overflow;

      document.body.classList.add('max-lg:overflow-hidden', 'max-lg:h-dvh');
      navEl.classList.add('navigation-offset', 'flex', 'motion-safe:animate-fade-in');
      navEl.classList.remove('hidden');

      window.setTimeout(() => {
        navItemsEl?.classList.add('motion-safe:animate-shift-up');
      }, itemsAnimateDelayMs);

      stopLenis();
    } else {
      document.body.style.overflow = previousBodyOverflow || '';
      document.body.classList.remove('max-lg:overflow-hidden', 'max-lg:h-dvh');
      navEl.classList.remove('navigation-offset', 'flex', 'motion-safe:animate-fade-in');
      navItemsEl?.classList.remove('motion-safe:animate-shift-up');

      navEl.classList.add('hidden');
      startLenis();
    }

    toggle.textContent = open ? 'Close' : 'Menu';
    toggle.setAttribute('aria-expanded', String(open));
  };

  const openNav = () => {
    if (!header) return;

    setUI(true);

    releaseTrap?.();
    releaseTrap = createFocusTrap(header, {
      initialFocus: initialFocusSelector,
      onEscape: () => navigationOpen.set(false),
    });
  };

  const closeNav = () => {
    setUI(false);
    releaseTrap?.();
    releaseTrap = null;
  };

  const handleBreakpointChange = (e: MediaQueryListEvent) => {
    const nextIsLg = e.matches;

    if (nextIsLg && !isLg) {
      navigationOpen.set(false);
      closeNav();
      startLenis();
    }

    if (!nextIsLg && isLg) {
      if (navigationOpen.get?.() === true) stopLenis();
    }

    isLg = nextIsLg;
  };

  setUI(navigationOpen.get());

  const unsubscribe = navigationOpen.subscribe((open) => {
    if (lgMq.matches) {
      if (open) navigationOpen.set(false);
      return;
    }

    if (open) openNav();
    else closeNav();
  });

  const onToggleClick = () => {
    if (!lgMq.matches) navigationToggle();
  };

  toggle.addEventListener('click', onToggleClick);
  lgMq.addEventListener('change', handleBreakpointChange);

  let cleanedUp = false;

  const cleanup: Cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    closeNav();
    unsubscribe?.();

    lgMq.removeEventListener('change', handleBreakpointChange);
    toggle.removeEventListener('click', onToggleClick);

    document.removeEventListener('astro:before-swap', cleanup);
    window.removeEventListener('pagehide', cleanup);
  };

  document.addEventListener('astro:before-swap', cleanup);
  window.addEventListener('pagehide', cleanup);

  return cleanup;
}
