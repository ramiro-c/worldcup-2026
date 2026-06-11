import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from "./App"
import Home from "./routes/Home"
import Groups from "./routes/Groups"
import Fixtures from "./routes/Fixtures"
import Bracket from "./routes/Bracket"
import Venues from "./routes/Venues"
import Match from "./routes/Match"
import Historical from "./routes/Historical"
import HistoricalTournament from "./routes/HistoricalTournament"
import HistoricalMatchDetail from "./routes/HistoricalMatchDetail"
import Team from "./routes/Team"
import NotFound from "./routes/NotFound"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "groups", element: <Groups /> },
      { path: "fixtures", element: <Fixtures /> },
      { path: "bracket", element: <Bracket /> },
      { path: "venues", element: <Venues /> },
      { path: "match/:id", element: <Match /> },
      { path: "historical", element: <Historical /> },
      { path: "historical/:year", element: <HistoricalTournament /> },
      { path: "historical/:year/:matchId", element: <HistoricalMatchDetail /> },
      { path: "team/:teamName", element: <Team /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)