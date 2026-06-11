import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/groups", label: "Grupos" },
  { to: "/fixtures", label: "Fixture" },
  { to: "/bracket", label: "Eliminatorias" },
  { to: "/venues", label: "Sedes" },
  { to: "/historical", label: "Historial" },
];

export default function Navigation() {
  return (
    <nav className="border-b border-zinc-800 px-6 py-4">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <NavLink
          to="/"
          className="text-xl font-bold tracking-tight hover:text-emerald-400 transition-colors"
        >
          Copa 2026
        </NavLink>

        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}