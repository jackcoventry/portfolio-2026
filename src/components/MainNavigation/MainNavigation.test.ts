import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initNavigationMenu } from '@/components/MainNavigation/MainNavigation';

type NavOpenStore = {
  get: () => boolean;
  set: (v: boolean) => void;
  subscribe: (cb: (v: boolean) => void) => () => void;
};

const subscribers = new Set<(v: boolean) => void>();
let storeValue = false;

const navigationOpenMock: NavOpenStore = {
  get: () => storeValue,
  set: (v) => {
    storeValue = v;
    subscribers.forEach((cb) => cb(v));
  },
  subscribe: (cb) => {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  },
};

const navigationToggleMock = vi.fn(() => {
  navigationOpenMock.set(!navigationOpenMock.get());
});

const releaseTrapMock = vi.fn();
const createFocusTrapMock = vi.fn(() => releaseTrapMock);

vi.mock('@/store/navigation.js', () => ({
  navigationOpen: navigationOpenMock,
  navigationToggle: navigationToggleMock,
}));

vi.mock('@/utils/focusTrap', () => ({
  createFocusTrap: createFocusTrapMock,
}));

type MqListener = (e: MediaQueryListEvent) => void;

function createMatchMediaController(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<MqListener>();

  const mql: MediaQueryList = {
    media: '(min-width: 64rem)',
    get matches() {
      return matches;
    },
    onchange: null,
    addEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
      if (type !== 'change') return;
      listeners.add(cb as unknown as MqListener);
    },
    removeEventListener: (type: string, cb: EventListenerOrEventListenerObject) => {
      if (type !== 'change') return;
      listeners.delete(cb as unknown as MqListener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: (_evt: Event) => true,
  };

  const dispatch = (nextMatches: boolean) => {
    matches = nextMatches;
    const evt = { matches: nextMatches } as MediaQueryListEvent;
    listeners.forEach((cb) => cb(evt));
  };

  return { mql, dispatch };
}

function setupDom() {
  document.body.innerHTML = `
    <header id="header">
      <button id="navigationToggle" aria-controls="navigation" aria-expanded="false">Menu</button>
      <nav id="navigation" class="hidden">
        <ul id="navigationItems"></ul>
      </nav>
    </header>
  `;
}

describe('initNavigationMenu', () => {
  let mm: ReturnType<typeof createMatchMediaController>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    subscribers.clear();
    storeValue = false;

    setupDom();

    (window as any).__lenis = {
      stop: vi.fn(),
      start: vi.fn(),
    };

    mm = createMatchMediaController(false);
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mm.mql);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete (window as any).__lenis;
  });

  it('returns cleanup and no-ops if required elements are missing', () => {
    document.body.innerHTML = `<div></div>`;
    const cleanup = initNavigationMenu();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('initially syncs UI from navigationOpen.get()', () => {
    storeValue = true;

    initNavigationMenu();

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;
    const nav = document.getElementById('navigation') as HTMLElement;

    expect(toggle.textContent).toBe('Close');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    expect(nav.classList.contains('hidden')).toBe(false);
    expect(nav.classList.contains('flex')).toBe(true);
    expect(document.body.classList.contains('max-lg:overflow-hidden')).toBe(true);

    expect((window as any).__lenis.stop).toHaveBeenCalledTimes(1);
  });

  it('opening (small viewport) applies classes, stops lenis, and creates a focus trap', () => {
    initNavigationMenu();

    navigationOpenMock.set(true);

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;
    const nav = document.getElementById('navigation') as HTMLElement;
    const items = document.getElementById('navigationItems') as HTMLElement;

    expect(toggle.textContent).toBe('Close');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    expect(document.body.classList.contains('max-lg:overflow-hidden')).toBe(true);
    expect(nav.classList.contains('hidden')).toBe(false);
    expect(nav.classList.contains('navigation-offset')).toBe(true);

    expect(createFocusTrapMock).toHaveBeenCalledTimes(1);
    expect(releaseTrapMock).not.toHaveBeenCalled();

    expect(items.classList.contains('motion-safe:animate-shift-up')).toBe(false);
    vi.advanceTimersByTime(250);
    expect(items.classList.contains('motion-safe:animate-shift-up')).toBe(true);

    expect((window as any).__lenis.stop).toHaveBeenCalledTimes(1);
    expect((window as any).__lenis.start).toHaveBeenCalledTimes(0);
  });

  it('closing removes classes, starts lenis, and releases focus trap', () => {
    initNavigationMenu();

    navigationOpenMock.set(true);
    expect(createFocusTrapMock).toHaveBeenCalledTimes(1);

    navigationOpenMock.set(false);

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;
    const nav = document.getElementById('navigation') as HTMLElement;
    const items = document.getElementById('navigationItems') as HTMLElement;

    expect(toggle.textContent).toBe('Menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    expect(document.body.classList.contains('max-lg:overflow-hidden')).toBe(false);
    expect(nav.classList.contains('hidden')).toBe(true);
    expect(items.classList.contains('motion-safe:animate-shift-up')).toBe(false);

    expect(releaseTrapMock).toHaveBeenCalledTimes(1);
    expect((window as any).__lenis.start).toHaveBeenCalledTimes(1);
  });

  it('toggle button click toggles only when NOT large', () => {
    initNavigationMenu();

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;

    toggle.click();
    expect(navigationToggleMock).toHaveBeenCalledTimes(1);

    mm.dispatch(true);

    toggle.click();
    expect(navigationToggleMock).toHaveBeenCalledTimes(1);
  });

  it('in large viewport, subscription forces nav closed and does not open', () => {
    mm = createMatchMediaController(true);
    (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mm.mql);

    initNavigationMenu();

    navigationOpenMock.set(true);

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;
    const nav = document.getElementById('navigation') as HTMLElement;

    expect(navigationOpenMock.get()).toBe(false);
    expect(toggle.textContent).toBe('Menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(nav.classList.contains('hidden')).toBe(true);

    expect(createFocusTrapMock).toHaveBeenCalledTimes(0);
  });

  it('breakpoint change from small -> large closes nav, sets store false, and starts lenis', () => {
    initNavigationMenu();

    navigationOpenMock.set(true);
    expect(navigationOpenMock.get()).toBe(true);

    mm.dispatch(true);

    expect(navigationOpenMock.get()).toBe(false);
    expect((window as any).__lenis.start).toHaveBeenCalled();
  });

  it('cleanup runs on astro:before-swap and unsubscribes / removes listeners', () => {
    const cleanup = initNavigationMenu();

    navigationOpenMock.set(true);

    document.dispatchEvent(new Event('astro:before-swap'));

    const nav = document.getElementById('navigation') as HTMLElement;
    expect(nav.classList.contains('hidden')).toBe(true);

    const toggle = document.getElementById('navigationToggle') as HTMLButtonElement;
    const beforeText = toggle.textContent;

    navigationOpenMock.set(true);
    expect(toggle.textContent).toBe(beforeText);

    cleanup();
    cleanup();
  });
});
