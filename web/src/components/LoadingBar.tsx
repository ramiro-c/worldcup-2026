import { useEffect, useRef } from "react";
import { useLoading } from "../lib/LoadingContext";

export default function LoadingBar() {
  const { isLoading } = useLoading();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isLoading) {
      el.style.width = "0%";
      el.style.opacity = "1";
      requestAnimationFrame(() => {
        el!.style.width = "70%";
      });
    } else {
      el.style.width = "100%";
      setTimeout(() => {
        if (el) el.style.opacity = "0";
      }, 200);
    }
  }, [isLoading]);

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
