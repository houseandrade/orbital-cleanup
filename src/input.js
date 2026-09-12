/* Hold controls own one pointer each; interruptions always release that ownership. */
const GameInput = (() => {
  function hold(button, canPress, onPress, onRelease) {
    let pointer = null;
    function release() {
      const previous = pointer;
      pointer = null;
      onRelease();
      if (previous !== null) {
        try { if (button.hasPointerCapture(previous)) button.releasePointerCapture(previous); } catch (_) {}
      }
    }
    function stop(event) {
      if (event.pointerId === pointer) release();
    }
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (pointer !== null || button.disabled || !canPress() || (event.button !== undefined && event.button !== 0)) return;
      pointer = event.pointerId;
      try { button.setPointerCapture(pointer); } catch (_) {}
      onPress();
    });
    button.addEventListener('lostpointercapture', stop);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    // Also catches release outside the button if capture failed or was interrupted.
    window.addEventListener('pointerup', stop, true);
    window.addEventListener('pointercancel', stop, true);
    button.addEventListener('pointerleave', event => {
      if (event.pointerId !== pointer) return;
      try { if (button.hasPointerCapture(pointer)) return; } catch (_) {}
      release();
    });
    window.addEventListener('pointermove', event => {
      if (event.pointerId === pointer && event.pointerType === 'mouse' && event.buttons === 0) release();
    }, true);
    window.addEventListener('blur', release);
    window.addEventListener('pagehide', release);
    document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
    // WebKit can terminate a native touch gesture without a normal pointerup.
    window.addEventListener('touchcancel', release, { passive: true });
    window.addEventListener('touchend', event => { if (event.touches.length === 0) release(); }, { passive: true });
    return release;
  }
  function protect(surface) {
    // Keep native selection / double-tap / pinch gestures away from flight input.
    const prevent = event => { if (event.cancelable) event.preventDefault(); };
    for (const name of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart']) {
      surface.addEventListener(name, prevent, { passive: false });
    }
  }
  return { hold, protect };
})();
