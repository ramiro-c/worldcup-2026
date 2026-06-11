import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navigation from "./components/Navigation";
import Breadcrumbs from "./components/Breadcrumbs";
import PageTitle from "./components/PageTitle";
import LoadingBar from "./components/LoadingBar";
import Attribution from "./components/Attribution";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <LoadingBar />
      <PageTitle />
      <Navigation />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8">
        <Breadcrumbs />
        <Outlet />
      </main>
      <Attribution />
    </div>
  );
}