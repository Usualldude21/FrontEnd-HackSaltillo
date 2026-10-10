import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { gsap } from "gsap";

const DEMO_ACCESS_CODE = "1319";

interface LandingPageProps {
  onUnlock: () => void;
}

export function LandingPage({ onUnlock }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isEntering, setIsEntering] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduceMotion) {
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .from(".landing-brand", { opacity: 0, y: -16, duration: 0.35 })
          .from(".landing-title-line", { opacity: 0, y: 52, duration: 0.55, stagger: 0.08 }, "-=0.2")
          .from(".landing-subtitle", { opacity: 0, y: 20, duration: 0.4 }, "-=0.35")
          .from(".access-form", { opacity: 0, y: 22, duration: 0.4 }, "-=0.3");
      }

      const layers = gsap.utils.toArray<HTMLElement>("[data-parallax]");
      const xSetters = layers.map((layer) => gsap.quickTo(layer, "x", { duration: 1.1, ease: "power3.out" }));
      const ySetters = layers.map((layer) => gsap.quickTo(layer, "y", { duration: 1.1, ease: "power3.out" }));

      const handlePointerMove = (event: PointerEvent) => {
        if (reduceMotion) return;
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        layers.forEach((layer, index) => {
          const depth = Number(layer.dataset.parallax ?? 1);
          xSetters[index]?.(x * depth);
          ySetters[index]?.(y * depth);
        });
      };

      const accessButton = root.querySelector<HTMLElement>(".access-control button");
      const handleButtonPointerMove = (event: PointerEvent) => {
        if (accessButton === null || reduceMotion) return;
        const bounds = accessButton.getBoundingClientRect();
        accessButton.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
        accessButton.style.setProperty("--my", `${event.clientY - bounds.top}px`);
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      accessButton?.addEventListener("pointermove", handleButtonPointerMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        accessButton?.removeEventListener("pointermove", handleButtonPointerMove);
      };
    }, root);

    return () => context.revert();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code !== DEMO_ACCESS_CODE) {
      setError("El código no coincide. Verifica los cuatro dígitos.");
      const form = rootRef.current?.querySelector(".access-form");
      if (form !== null && form !== undefined) {
        gsap.fromTo(form, { x: -6 }, { x: 6, repeat: 3, yoyo: true, duration: 0.07, clearProps: "x" });
      }
      return;
    }

    setError("");
    setIsEntering(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || rootRef.current === null) {
      onUnlock();
      return;
    }
    gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.015,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: onUnlock,
    });
  };

  return (
    <div className="landing-page" ref={rootRef}>
      <div aria-hidden="true" className="landing-atmosphere">
        <div className="landing-orb landing-orb-far" data-parallax="-24" />
        <div className="landing-orb landing-orb-green" data-parallax="42" />
        <div className="landing-orb landing-orb-blue" data-parallax="64" />
        <div className="landing-horizon" data-parallax="18" />
        <div className="landing-grid" />
        <svg className="landing-grain" height="100%" width="100%">
          <filter id="sentinel-noise">
            <feTurbulence baseFrequency=".78" numOctaves="2" stitchTiles="stitch" type="fractalNoise" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .42 0" />
          </filter>
          <rect filter="url(#sentinel-noise)" height="100%" width="100%" />
        </svg>
      </div>

      <header className="landing-brand">
        <div>
          <strong>Sentinel</strong>
          <span>Early warning systems</span>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-copy" aria-labelledby="landing-title">
          <h1 id="landing-title">
            <span className="landing-title-line">Detecta la señal.</span>
            <span className="landing-title-line landing-title-accent">Actúa a tiempo.</span>
          </h1>
          <p className="landing-subtitle">
            Sentinel observa las señales de Kaiku, prioriza lo urgente y lleva al equipo de TI
            de la detección a una acción verificable.
          </p>

          <form className="access-form" noValidate onSubmit={submit}>
            <label htmlFor="access-code">Código de acceso</label>
            <div className="access-control">
              <span aria-hidden="true"><LockKeyhole size={18} strokeWidth={1.8} /></span>
              <input
                aria-describedby={error.length > 0 ? "access-error" : "access-hint"}
                aria-invalid={error.length > 0}
                autoComplete="one-time-code"
                autoFocus
                id="access-code"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/gu, "").slice(0, 4));
                  if (error.length > 0) setError("");
                }}
                placeholder="••••"
                type="password"
                value={code}
              />
              <button disabled={code.length !== 4 || isEntering} type="submit">
                <span>{isEntering ? "Abriendo" : "Entrar"}</span>
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
            <p
              className={error.length > 0 ? "access-feedback access-feedback-error" : "access-feedback"}
              id={error.length > 0 ? "access-error" : "access-hint"}
              role={error.length > 0 ? "alert" : undefined}
            >
              {error.length > 0 ? error : "Acceso al sistema"}
            </p>
          </form>
        </section>

      </main>
    </div>
  );
}
