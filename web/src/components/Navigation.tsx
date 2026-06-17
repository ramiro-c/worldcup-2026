import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/groups", label: "Grupos" },
  { to: "/fixtures", label: "Fixture" },
  { to: "/bracket", label: "Eliminatorias" },
  { to: "/venues", label: "Sedes" },
  { to: "/historical", label: "Historial" },
  { to: "/tv", label: "TV" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${
    isActive
      ? "bg-emerald-500/20 text-emerald-400"
      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
  }`;

export default function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative border-b border-zinc-800 px-4 md:px-6 py-4">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <NavLink
          to="/"
          onClick={() => setOpen(false)}
          className="text-xl font-bold tracking-tight hover:text-emerald-400 transition-colors"
        >
          Copa 2026
        </NavLink>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="Abrir menú"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <ul className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === "/"} className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`
              }>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-[57px] z-50 mx-4 md:hidden">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
