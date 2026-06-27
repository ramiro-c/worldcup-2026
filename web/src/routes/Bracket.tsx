import { useEffect } from "react";
import { useAsync } from "../lib/useAsync";
import { getBracket } from "../lib/api";
import { trackPageView } from "../lib/analytics";
import BracketRoundView from "../components/BracketRoundView";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";

export default function Bracket() {
  useEffect(() => {
    trackPageView("/bracket");
  }, []);

  const { data: rounds, loading, error, refetch } = useAsync(getBracket, []);

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Eliminatorias</h2>
        <SkeletonCard className="p-8">
          <div className="flex justify-around mb-6">
            {["16avos", "Octavos", "Cuartos", "Semifinal", "Final"].map((label) => (
              <Skeleton key={label} className="h-4 w-10" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 justify-center">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-36 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Eliminatorias</h2>
        <ErrorState
          message="No se pudo cargar el cuadro eliminatorio"
          onRetry={refetch}
        />
      </div>
    );
  }

  // ── Empty / pre-knockout state ───────────────────────
  if (!rounds || rounds.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Eliminatorias</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400 text-lg">
            El cuadro se activará cuando comience la fase eliminatoria
          </p>
          <p className="text-zinc-500 mt-2 text-sm">
            Dieciseisavos de final &bull; 27-30 de junio, 2026
          </p>
        </div>
      </div>
    );
  }

  // ── Bracket tree ─────────────────────────────────────
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Eliminatorias</h2>
      <BracketRoundView rounds={rounds} />
      {rounds.some((r) => r.provisional) && (
        <p className="text-xs text-amber-400/80 mt-2">
          * Los cruces de 16avos son provisorios. Se confirmarán al finalizar la fase de grupos.
        </p>
      )}
    </div>
  );
}
