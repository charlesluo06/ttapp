import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth.ts";

const FILL_MS = 1000; // how long the logo takes to fill with color
const FADE_MS = 300; // how long the screen takes to fade away afterwards

// The opening screen: the logo starts gray and fills with its colors from bottom to top, then
// the screen fades out. It never leaves before the app knows who is signed in, so there is no
// blank flash. People who asked their device to reduce motion don't see it.
export default function IntroScreen() {
  const auth = useAuth();
  const [skip] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [filled, setFilled] = useState(false);
  const [gone, setGone] = useState(skip);
  const leaving = filled && auth.status !== "loading";

  useEffect(() => {
    const timer = setTimeout(() => setFilled(true), FILL_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setGone(true), FADE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 grid place-items-center bg-maroon-700 transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative w-56 max-w-[60vw]">
        {/* The gray logo is always there. The colored one is drawn over it and revealed. */}
        <img
          src="/logo.png"
          alt=""
          className="block w-full opacity-60 grayscale"
        />
        <img
          src="/logo.png"
          alt=""
          className="animate-intro-fill absolute inset-0 block w-full"
        />
      </div>
    </div>
  );
}
