import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function LoadingBar() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    el.style.width = "0%";
    el.style.opacity = "1";

    requestAnimationFrame(() => {
      el!.style.width = "70%";
    });

    timerRef.current = setTimeout(() => {
      el!.style.width = "100%";
      el!.style.opacity = "0";
    }, 350);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        ref={ref}
        className="h-full bg-emerald-500"
        style={{
          width: "0%",
          opacity: "0",
          transition: "width 300ms ease-out, opacity 200ms 350ms",
        }}
      />
    </div>
  );
}
