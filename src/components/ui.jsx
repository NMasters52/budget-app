import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

//design system classes
import { candyClasses, labelClass } from "./uiClasses";

// Shared Playground design-system components: candy buttons, sticker
// pills, sticker cards, form fields, meters, page headings, and the modal
// shell. Every page composes from these so the app stays one visual voice.
// Class-string constants live in uiClasses.js.

export const CandyButton = ({
  tone = "coral",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}) => (
  <button type={type} className={`${candyClasses(tone, size)} ${className}`} {...rest}>
    {children}
  </button>
);

const STICKER_TONES = {
  teal: "border-[#2aa8a0] bg-[#2aa8a0]/10 text-[#1d7d77]",
  mango: "border-[#f59f00] bg-[#f59f00]/10 text-[#a86e00]",
  coral: "border-[#ff6b4a] bg-[#ff6b4a]/10 text-[#d64522]",
  slate: "border-[#c9c4b8] bg-[#6f6b61]/10 text-[#6f6b61]",
  ink: "border-[#1d1b16] bg-[#1d1b16] text-white",
};

// The status pill. Status chips, page kickers, little labels.
export const Sticker = ({ tone = "slate", className = "", children }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-extrabold ${STICKER_TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

const CARD_TONES = {
  default: "border-[#1d1b16]/10",
  coral: "border-[#ff6b4a]",
  mango: "border-[#f59f00]",
  teal: "border-[#2aa8a0]",
};

// The workhorse container: big radius, thick-ish outline, candy shadow.
// tone recolors the outline for status emphasis.
export const StickerCard = ({ tone = "default", className = "", children, ...rest }) => (
  <div
    className={`rounded-[28px] border-2 ${CARD_TONES[tone]} bg-white p-5 shadow-[3px_4px_0_rgba(29,27,22,0.10)] ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export const Field = ({ label, htmlFor, hint, children }) => (
  <div className="mb-4">
    <label htmlFor={htmlFor} className={`${labelClass} mb-1.5`}>
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-[13px] text-[#6f6b61]">{hint}</p>}
  </div>
);

// Progress bar with a candy track. Value is clamped against bad data.
export const Meter = ({
  value,
  tone = "teal",
  height = "h-2.5",
  className = "",
}) => {
  const width = Math.min(100, Math.max(0, value));
  const tones = {
    teal: "bg-[#2aa8a0]",
    coral: "bg-[#ff6b4a]",
    mango: "bg-[#f59f00]",
    ink: "bg-[#1d1b16]",
  };

  return (
    <div
      className={`${height} w-full rounded-full border-2 border-[#1d1b16]/10 bg-[#f1eee6] ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] ${tones[tone]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export const PageHeading = ({ kicker, title, sub }) => (
  <header>
    {kicker && (
      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ff6b4a]">
        {kicker}
      </p>
    )}
    <h1 className="mt-1 text-balance font-display text-4xl font-bold tracking-tight text-[#1d1b16]">
      {title}
    </h1>
    {sub && <p className="mt-1 text-[#6f6b61]">{sub}</p>}
  </header>
);

// Shared modal frame: dark backdrop (click to close), sticker panel, title
// row with a close chip, Escape to close. Forms render inside as children.
// Portals to document.body so callers may mount it inside cards whose
// transform (animate-rise, hover:-translate-y-*) would otherwise become the
// containing block for position:fixed and trap the modal in the card's
// stacking context (painted over by the next sibling card).
export const ModalShell = ({ title, onClose, children, wide = false }) => {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const firstFocusable = dialogRef.current?.querySelector(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
    );
    firstFocusable?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-[#1d1b16]/40"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`animate-rise max-h-[88vh] w-full overscroll-contain overflow-y-auto rounded-[28px] border-2 border-[#1d1b16] bg-white p-6 shadow-[8px_10px_0_rgba(29,27,22,0.25)] ${
            wide ? "max-w-lg" : "max-w-md"
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={titleId} className="font-display text-xl font-bold text-[#1d1b16]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={candyClasses("ghost", "sm")}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
