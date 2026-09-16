import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export type OverlayReturnFocus =
  | string
  | HTMLElement
  | (() => HTMLElement | null)
  | null;

export type UseOverlayOptions = {
  isOpen: boolean;
  onClose: () => void;
  returnFocus?: OverlayReturnFocus;
};

export type UseOverlayResult = {
  overlayRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

function resolveReturnFocus(
  returnFocus: OverlayReturnFocus | undefined,
): HTMLElement | null {
  if (!returnFocus) return null;
  if (typeof returnFocus === "string") {
    return document.querySelector<HTMLElement>(returnFocus);
  }
  if (typeof returnFocus === "function") return returnFocus();
  return returnFocus;
}

/**
 * Accessible overlay behavior shared by the ceremony detail view and,
 * later, the search palette: Esc, click-outside, focus trap, scroll lock,
 * and restoring focus to the opener.
 */
export function useOverlay({
  isOpen,
  onClose,
  returnFocus,
}: UseOverlayOptions): UseOverlayResult {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const returnFocusRef = useRef(returnFocus);
  const fallbackFocusRef = useRef<HTMLElement | null>(null);

  onCloseRef.current = onClose;
  returnFocusRef.current = returnFocus;

  useEffect(() => {
    if (!isOpen) return;

    const active = document.activeElement;
    fallbackFocusRef.current =
      active instanceof HTMLElement ? active : null;

    const overlay = overlayRef.current;
    overlay?.focus();

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const root = overlayRef.current;
      if (!root) return;
      const focusable = getFocusableElements(root);
      if (focusable.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || activeElement === root) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onMouseDown(event: MouseEvent) {
      const content = contentRef.current;
      if (!content) return;
      if (event.target instanceof Node && !content.contains(event.target)) {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;

      const target =
        resolveReturnFocus(returnFocusRef.current) ?? fallbackFocusRef.current;
      if (target && document.contains(target)) {
        target.focus();
      }
    };
  }, [isOpen]);

  return { overlayRef, contentRef };
}
