interface RetryButtonProps {
  onRetry: () => void;
  message?: string;
}

export default function RetryButton({ onRetry, message }: RetryButtonProps) {
  return (
    <div className="text-center py-20 space-y-4">
      {message && <p className="text-red-400">{message}</p>}
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-medium rounded-lg transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}