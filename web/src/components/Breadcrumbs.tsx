import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export default function Breadcrumbs() {
  const location = useLocation();

  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link
            to="/"
            className="text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            Inicio
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.to || crumb.label} className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {index === breadcrumbs.length - 1 ? (
              <span className="text-zinc-100 font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to!}
                className="text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";
  for (const segment of paths) {
    currentPath += `/${segment}`;
    const label = getSegmentLabel(segment);
    breadcrumbs.push({
      label,
      to: currentPath,
    });
  }

  return breadcrumbs;
}

function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    groups: "Grupos",
    fixtures: "Fixture",
    bracket: "Bracket",
    venues: "Sedes",
    historical: "Historial",
  };

  if (labels[segment]) {
    return labels[segment];
  }

  if (segment === "match") {
    return "Partido";
  }

  if (/^\d{4}$/.test(segment)) {
    return `Mundial ${segment}`;
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}