import { Route, Routes } from "react-router-dom";
import Home from "../routes/Home";
import Groups from "../routes/Groups";
import Fixtures from "../routes/Fixtures";
import Bracket from "../routes/Bracket";
import Venues from "../routes/Venues";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/fixtures" element={<Fixtures />} />
      <Route path="/bracket" element={<Bracket />} />
      <Route path="/venues" element={<Venues />} />
    </Routes>
  );
}