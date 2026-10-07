// Class-string constants for the Playground design system, split out of
// ui.jsx so fast refresh can treat the component file as components-only.

const CANDY_TONES = {
  coral: "border-[#1d1b16] bg-[#ff6b4a] text-white shadow-[3px_4px_0_#1d1b16]",
  teal: "border-[#1d1b16] bg-[#2aa8a0] text-white shadow-[3px_4px_0_#1d1b16]",
  ink: "border-[#1d1b16] bg-[#1d1b16] text-white shadow-[3px_4px_0_rgba(29,27,22,0.35)]",
  mango:
    "border-[#1d1b16] bg-[#ffb01f] text-[#1d1b16] shadow-[3px_4px_0_#1d1b16]",
  ghost:
    "border-[#1d1b16]/20 bg-white text-[#1d1b16] shadow-[3px_4px_0_rgba(29,27,22,0.12)]",
};

const CANDY_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

// Classes for a candy button, so <Link> can dress like a button too.
export const candyClasses = (tone = "coral", size = "md") =>
  [
    "inline-flex items-center justify-center gap-1.5 rounded-full border-2 font-extrabold",
    "cursor-pointer touch-manipulation select-none transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150",
    "focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20 focus-visible:ring-offset-2",
    "hover:shadow-[3px_4px_0_rgba(29,27,22,0.45)]",
    "active:translate-x-[2px] active:translate-y-[3px] active:shadow-none",
    "disabled:cursor-default disabled:opacity-40 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
    CANDY_SIZES[size],
    CANDY_TONES[tone],
  ].join(" ");

export const labelClass =
  "block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6f6b61]";

export const inputClass =
  "w-full rounded-xl border-2 border-[#1d1b16]/15 bg-white px-3.5 py-2.5 font-semibold text-[#1d1b16] placeholder:font-medium placeholder:text-[#827e74] transition-colors focus:border-[#1d1b16] focus:outline-none focus:ring-4 focus:ring-[#ff6b4a]/15";
