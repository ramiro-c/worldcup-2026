import { useEffect, useRef } from "react";
import { useNavigation } from "react-router-dom";

export default function LoadingBar() {
  const navigation = useNavigation();
  const ref = useRef<HTMLDivElement>(null);
  const isNavigating = navigation.state !== "idle";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isNavigating) {
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
  }, [isNavigating]);

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