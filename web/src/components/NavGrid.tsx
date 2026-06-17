import { Link } from "react-router-dom";

export interface NavGridItem {
  label: string;
  to: string;
  description: string;
}

interface NavGridProps {
  items: NavGridItem[];
}

export default function NavGrid({ items }: NavGridProps) {
  if (items.length === 0) return null;

  return (
    <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">{item.label}</h3>
          <p className="text-sm text-zinc-400">{item.description}</p>
        </Link>
      ))}
    </nav>
  );
}
