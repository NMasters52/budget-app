import { useEffect, useRef, useState } from "react";
import { IoCloseCircle, IoMenu } from "react-icons/io5";
import { NavLink } from "react-router-dom";

//components
import { candyClasses } from "./components/uiClasses";

const Nav = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    closeButtonRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  // Chip styles: the active page gets the filled ink chip.
  const activeLink =
    "border-[#1d1b16] bg-[#1d1b16] text-white shadow-[2px_3px_0_rgba(29,27,22,0.35)]";
  const inactiveLink =
    "border-transparent text-[#1d1b16]/70 hover:border-[#1d1b16]/15 hover:bg-[#1d1b16]/5 hover:text-[#1d1b16]";
  const chip = (isActive) =>
    `rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition-colors focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20 ${
      isActive ? activeLink : inactiveLink
    }`;

  const links = [
    { to: "/", label: "Bills", end: true },
    { to: "/debts", label: "Debts", end: false },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b-2 border-[#1d1b16] bg-[#faf7ef]">
      <div className="mx-auto flex max-w-6xl flex-row items-center justify-between px-4 py-3">
        {/* Logo pill — gives a little wobble when poked */}
        <NavLink
          to="/"
          className="ml-1 flex items-center rounded-full border-2 border-[#1d1b16] bg-white py-1.5 pr-4 pl-2 shadow-[3px_4px_0_#1d1b16] transition-transform duration-200 hover:rotate-2 focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20"
        >
          <img
            src="/bill.png"
            alt="Bill Buddy mascot"
            width="40"
            height="40"
            className="mr-2 h-10 w-auto"
          />
          <span className="font-display text-lg font-bold tracking-tight text-[#1d1b16]">
            Bill Buddy
          </span>
        </NavLink>

        {/* Desktop chips */}
        <div className="mr-2 hidden items-center gap-1.5 md:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => chip(isActive)}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
          aria-controls="mobile-navigation"
          className={`${candyClasses("coral", "md")} md:hidden`}
        >
          <IoMenu aria-hidden="true" size="1.4em" />
        </button>
      </div>

      {/* Mobile sheet */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[#1d1b16]/40"
            onClick={() => {
              setSidebarOpen(false);
              menuButtonRef.current?.focus();
            }}
          />
          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute top-0 left-0 h-full w-72 overscroll-contain rounded-r-[28px] border-r-2 border-b-2 border-[#1d1b16] bg-[#faf7ef] p-6 shadow-[8px_0_0_rgba(29,27,22,0.15)]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                menuButtonRef.current?.focus();
              }}
              aria-label="Close menu"
              className={candyClasses("ghost", "sm")}
            >
              <IoCloseCircle aria-hidden="true" size="1.3em" />
            </button>

            <div className="mt-8 flex flex-col gap-2.5">
              {links.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => chip(isActive)}
                  onClick={() => setSidebarOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
