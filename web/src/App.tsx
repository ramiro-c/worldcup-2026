import { Route, Routes } from "react-router-dom";
import Navigation from "./components/Navigation";
import Breadcrumbs from "./components/Breadcrumbs";
import PageTitle from "./components/PageTitle";
import PageTransition from "./components/PageTransition";
import Home from "./routes/Home";
import Groups from "./routes/Groups";
import Fixtures from "./routes/Fixtures";
import Bracket from "./routes/Bracket";
import Venues from "./routes/Venues";
import Match from "./routes/Match";
import NotFound from "./routes/NotFound";

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PageTitle />
      <Navigation />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Breadcrumbs />
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/match/:id" element={<Match />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
}