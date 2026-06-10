import { Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Groups from "./routes/Groups";
import Fixtures from "./routes/Fixtures";
import Bracket from "./routes/Bracket";
import Venues from "./routes/Venues";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">Copa 2026</h1>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/bracket" element={<Bracket />} />
        <Route path="/venues" element={<Venues />} />
      </Routes>
    </Layout>
  );
}