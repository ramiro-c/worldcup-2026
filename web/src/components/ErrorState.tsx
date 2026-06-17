import { Link } from "react-router-dom";

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  backTo?: { to: string; label: string };
}

export default function ErrorState({
  message,
  title = "Algo salió mal",
  onRetry,
  backTo,
}: ErrorStateProps) {
  return (
    <div className="text-center py-20 space-y-6">
      <svg
        className="mx-auto h-12 w-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-300">{title}</h2>
        <p className="text-zinc-500 max-w-md mx-auto">{message}</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-medium rounded-lg transition-colors"
          >
            Reintentar
          </button>
        )}
        {backTo && (
          <Link
            to={backTo.to}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
          >
            {backTo.label}
          </Link>
        )}
      </div>
    </div>
  );
}
