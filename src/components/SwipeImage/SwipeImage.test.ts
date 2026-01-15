import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SwipeImage } from '@/components/SwipeImage/SwipeImage';

vi.mock('@/utils/clamp', () => ({
  clamp: (n: number, min: number, max: number) => Math.min(max, Math.max(min, n)),
}));

type IOEntry = Partial<IntersectionObserverEntry> & {
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
};

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  public callback: IntersectionObserverCallback;
  public options?: IntersectionObserverInit;
  public observed = new Set<Element>();
  public disconnect = vi.fn();

  constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = cb;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe = (el: Element) => {
    this.observed.add(el);
  };

  unobserve = (el: Element) => {
    this.observed.delete(el);
  };

  trigger(entries: IOEntry[]) {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

function makeSwipeImageEl(attrs?: { threshold?: string }) {
  const el = document.createElement('div');
  el.dataset.swipeImage = '';

  Object.defineProperty(el.dataset, 'swipeImage', {
    value: '',
    configurable: true,
  });

  if (attrs?.threshold != null) {
    el.dataset.threshold = attrs.threshold;
  }

  document.body.appendChild(el);
  return el;
}

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', {
    value: state,
    configurable: true,
  });
}

describe('SwipeImage', () => {
  const realIO = globalThis.IntersectionObserver;
  const realRAF = globalThis.requestAnimationFrame;

  beforeEach(() => {
    document.body.innerHTML = '';

    delete (globalThis as any).__SWIPE_REVEAL_INIT__;
    delete (globalThis as any).__SWIPE_REVEAL_OBS__;

    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as any;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0 as any;
    };

    setReadyState('complete');
  });

  afterEach(() => {
    globalThis.IntersectionObserver = realIO;
    globalThis.requestAnimationFrame = realRAF;
  });

  it('initializes only once (global __SWIPE_REVEAL_INIT__ guard)', () => {
    makeSwipeImageEl();
    SwipeImage();

    const firstCount = MockIntersectionObserver.instances.length;
    expect(firstCount).toBe(1);

    SwipeImage();
    expect(MockIntersectionObserver.instances.length).toBe(firstCount);
  });

  it('observes swipe-image elements and sets data-revealed when threshold is met', () => {
    const el = makeSwipeImageEl({ threshold: '0.25' });

    SwipeImage();

    expect(MockIntersectionObserver.instances.length).toBe(1);
    const io = MockIntersectionObserver.instances[0];
    expect(io.observed.has(el)).toBe(true);

    io.trigger([
      {
        target: el,
        isIntersecting: true,
        intersectionRatio: 0.1,
      },
    ]);
    expect(el.dataset.revealed).toBeNull();

    io.trigger([
      {
        target: el,
        isIntersecting: true,
        intersectionRatio: 0.3,
      },
    ]);

    expect(el.dataset.revealed).toBe('true');
    expect(io.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not reset already-initialized elements on subsequent runs (without forceReset)', () => {
    const el = makeSwipeImageEl({ threshold: '0.25' });
    SwipeImage();

    const io1 = MockIntersectionObserver.instances[0];
    io1.trigger([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    expect(el.dataset.revealed).toBe('true');
    expect(el.dataset.swipeInit).toBe('true');

    document.dispatchEvent(new Event('astro:page-load'));
    expect(el.dataset.revealed).toBe('true');
  });

  it('forces a reset on pageshow persisted=true', () => {
    const el = makeSwipeImageEl({ threshold: '0.25' });
    SwipeImage();

    const io1 = MockIntersectionObserver.instances[0];
    io1.trigger([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    expect(el.dataset.revealed).toBe('true');

    const evt = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(evt, 'persisted', { value: true });

    globalThis.dispatchEvent(evt);

    expect(el.dataset.revealed).toBeNull();
    expect(el.dataset.resetting).toBeTruthy();
  });

  it('waits for DOMContentLoaded if document.readyState is loading', () => {
    setReadyState('loading');

    makeSwipeImageEl();
    SwipeImage();

    expect(MockIntersectionObserver.instances.length).toBe(0);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(MockIntersectionObserver.instances.length).toBe(1);
  });
});
