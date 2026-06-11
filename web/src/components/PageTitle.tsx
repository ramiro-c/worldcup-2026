import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Inicio",
  "/groups": "Grupos",
  "/fixtures": "Fixture",
  "/bracket": "Bracket",
  "/venues": "Sedes",
  "/historical": "Historial",
};

export default function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const pathMatch = Object.keys(pageTitles).find((path) =>
      location.pathname.startsWith(path)
    );

    const title = pathMatch ? pageTitles[pathMatch] : "Copa 2026";
    document.title = `${title} | Copa Mundial 2026`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `Explora ${title.toLowerCase()} de la Copa Mundial 2026`
      );
    }
  }, [location.pathname]);

  return null;
}