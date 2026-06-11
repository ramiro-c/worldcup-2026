export default function Attribution() {
  return (
    <footer className="border-t border-zinc-800 mt-16 py-8 px-6 text-xs text-zinc-500">
      <div className="mx-auto max-w-6xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Fixture en vivo por{" "}
            <a
              href="https://wheniskickoff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              wheniskickoff.com
            </a>
          </span>
          <span>
            Torneos históricos:{" "}
            <a
              href="https://github.com/openfootball/worldcup"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              openfootball
            </a>{" "}
            (CC0)
          </span>
          <span>
            Banderas por{" "}
            <a
              href="https://flagcdn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              Flagcdn
            </a>{" "}
            /{" "}
            <a
              href="https://flagpedia.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              Flagpedia
            </a>
          </span>
        </div>
        <a
          href="https://statsbomb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-zinc-300"
        >
          <img
            src="https://raw.githubusercontent.com/statsbomb/open-data/master/img/SB%20-%20Icon%20Lockup%20-%20Colour%20positive.png"
            alt="StatsBomb logo"
            className="h-5"
          />
          <span>Datos históricos de partidos</span>
        </a>
      </div>
    </footer>
  );
}
