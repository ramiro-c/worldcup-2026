import { Route, Routes } from "react-router-dom";
import Navigation from "./components/Navigation";
import Breadcrumbs from "./components/Breadcrumbs";
import PageTitle from "./components/PageTitle";
import LoadingBar from "./components/LoadingBar";

import Home from "./routes/Home";
import Groups from "./routes/Groups";
import Fixtures from "./routes/Fixtures";
import Bracket from "./routes/Bracket";
import Venues from "./routes/Venues";
import Match from "./routes/Match";
import Historical from "./routes/Historical";
import HistoricalTournament from "./routes/HistoricalTournament";
import NotFound from "./routes/NotFound";
import Attribution from "./components/Attribution";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <LoadingBar />
      <PageTitle />
      <Navigation />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Attribution />
    </div>
  );
}