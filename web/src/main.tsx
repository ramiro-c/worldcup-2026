import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import Home from "./routes/Home"
import Groups from "./routes/Groups"
import Fixtures from "./routes/Fixtures"
import Bracket from "./routes/Bracket"
import Venues from "./routes/Venues"
import VenueDetail from "./routes/VenueDetail"
import Tv from "./routes/Tv"
import Match from "./routes/Match"
import Historical from "./routes/Historical"
import HistoricalTournament from "./routes/HistoricalTournament"
import HistoricalMatchDetail from "./routes/HistoricalMatchDetail"
import Team from "./routes/Team"
import HeadToHead from "./routes/HeadToHead"
import Stats from "./routes/Stats"
import NotFound from "./routes/NotFound"

function wrapBoundary(element: ReactNode) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: wrapBoundary(<Home />) },
      { path: "groups", element: wrapBoundary(<Groups />) },
      { path: "fixtures", element: wrapBoundary(<Fixtures />) },
      { path: "bracket", element: wrapBoundary(<Bracket />) },
      { path: "tv", element: wrapBoundary(<Tv />) },
      { path: "venues", element: wrapBoundary(<Venues />) },
      { path: "venues/:venueId", element: wrapBoundary(<VenueDetail />) },
      { path: "match/:id", element: wrapBoundary(<Match />) },
      { path: "historical", element: wrapBoundary(<Historical />) },
      { path: "historical/:year", element: wrapBoundary(<HistoricalTournament />) },
      { path: "historical/:year/:matchId", element: wrapBoundary(<HistoricalMatchDetail />) },
      { path: "team/:teamName", element: wrapBoundary(<Team />) },
      { path: "head-to-head/:team1/:team2", element: wrapBoundary(<HeadToHead />) },
      { path: "stats", element: wrapBoundary(<Stats />) },
      { path: "*", element: wrapBoundary(<NotFound />) },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)