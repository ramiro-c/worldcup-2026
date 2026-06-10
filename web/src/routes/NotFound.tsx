import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-20 space-y-6">
      <h1 className="text-6xl font-bold text-zinc-700">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-300">
        Página no encontrada
      </h2>
      <p className="text-zinc-500 max-w-md mx-auto">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}