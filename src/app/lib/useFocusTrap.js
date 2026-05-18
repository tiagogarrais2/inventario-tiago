"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — captura o foco dentro de um modal enquanto está aberto.
 *
 * Ao abrir: move o foco para o primeiro elemento focável dentro do modal
 *           e salva o elemento que estava com foco antes para restaurar ao fechar.
 * Tab / Shift+Tab: cicla o foco apenas dentro do modal.
 * Escape: chama onClose().
 * Ao fechar / desmontar: remove o listener e devolve o foco ao elemento original.
 *
 * @param {{ isOpen: boolean, onClose: () => void }} options
 * @returns {{ modalRef: React.RefObject<HTMLElement> }}
 */
export function useFocusTrap({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  // Ref estável para onClose: evita re-execução do effect a cada render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Salva o elemento que tinha foco antes do modal abrir
    previousFocusRef.current = document.activeElement;

    // Move foco para o primeiro elemento focável do modal
    const firstFocusable = modalRef.current?.querySelector(FOCUSABLE_SELECTORS);
    if (firstFocusable) {
      firstFocusable.focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    function getFocusableElements() {
      if (!modalRef.current) return [];
      return Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS));
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: se o foco está no primeiro, vai para o último
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: se o foco está no último, volta para o primeiro
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Devolve foco ao elemento que estava ativo antes do modal abrir
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]); // onClose consumido via ref — sem dependência instável

  return { modalRef };
}
