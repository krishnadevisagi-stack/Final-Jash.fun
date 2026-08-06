'use client';

import { useEffect } from 'react';

export default function SecurityGuard() {
  useEffect(() => {
    // 1. Prevent context menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Prevent Developer Shortcut Keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd) {
        // Shift + I (Inspect), Shift + J (Console), Shift + C (Element Selector)
        if (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl/Cmd + U (View Source)
        if (e.key === 'U' || e.key === 'u' || e.keyCode === 85) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl/Cmd + S (Save Page)
        if (e.key === 'S' || e.key === 's' || e.keyCode === 83) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl/Cmd + P (Print Page)
        if (e.key === 'P' || e.key === 'p' || e.keyCode === 80) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // 3. Disable image & content dragging
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. Override console methods to prevent inspection/debugging outputs
    const disableConsole = () => {
      const noop = () => {};
      try {
        window.console.log = noop;
        window.console.warn = noop;
        window.console.error = noop;
        window.console.info = noop;
        window.console.debug = noop;
        window.console.table = noop;
        window.console.trace = noop;
        window.console.dir = noop;
        window.console.clear();
      } catch (err) {
        // ignore
      }
    };

    // 5. Anti-DevTools Debugger Loop
    let debuggerInterval: NodeJS.Timeout;
    const startAntiDebugger = () => {
      debuggerInterval = setInterval(() => {
        const startTime = performance.now();
        try {
          const checkDevTools = new Function('debugger');
          checkDevTools();
        } catch {
          // ignore
        }

        const endTime = performance.now();
        // If execution paused due to open DevTools debugger
        if (endTime - startTime > 100) {
          try {
            window.console.clear();
          } catch {}
        }
      }, 500);
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('dragstart', handleDragStart, true);

    disableConsole();
    startAntiDebugger();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      if (debuggerInterval) clearInterval(debuggerInterval);
    };
  }, []);

  return null;
}
