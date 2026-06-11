import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navigation from "./components/Navigation";
import Breadcrumbs from "./components/Breadcrumbs";
import PageTitle from "./components/PageTitle";
import LoadingBar from "./components/LoadingBar";
import { LoadingProvider } from "./lib/LoadingContext";

import Home from "./routes/Home";
import Groups from "./routes/Groups";
import Fixtures from "./routes/Fixtures";
import Bracket from "./routes/Bracket";
import Venues from "./routes/Venues";
import Match from "./routes/Match";
import Historical from "./routes/Historical";
import HistoricalTournament from "./routes/HistoricalTournament";
import HistoricalMatchDetail from "./routes/HistoricalMatchDetail";
import Team from "./routes/Team";
import NotFound from "./routes/NotFound";
import Attribution from "./components/Attribution";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <LoadingProvider>
        <LoadingBar />
        <PageTitle />
        <Navigation />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/match/:id" element={<Match />} />
            <Route path="/historical" element={<Historical />} />
            <Route path="/historical/:year" element={<HistoricalTournament />} />
            <Route path="/historical/:year/:matchId" element={<HistoricalMatchDetail />} />
            <Route path="/team/:teamName" element={<Team />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Attribution />
      </LoadingProvider>
    </div>
  );
}