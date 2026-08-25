import { HERO_LOADER_EXIT_MS } from "./heroMotion";

const LOADING_LAYERS = [
  { top: "18%", delay: "0ms", accent: false },
  { top: "36%", delay: "-420ms", accent: true },
  { top: "54%", delay: "-840ms", accent: false },
  { top: "72%", delay: "-1260ms", accent: false },
] as const;

/**
 * A lightweight first frame for the heavy glass renderer. It deliberately
 * omits labels and connectors, so it reads as material being prepared rather
 * than as a second, lower-fidelity version of the finished pipeline.
 *
 * `exiting` is the handover to the live canvas. The study used to be unmounted
 * on the tick the canvas began fading in, so the frame cut to near-empty and
 * then slowly filled — two events where the eye expects one. Fading it out
 * under the incoming material makes it a dissolve, and a little blur on the way
 * out bridges the gap between the two so they read as one object resolving
 * rather than as a stand-in being swapped for the real thing.
 *
 * It also stops announcing itself the moment it starts leaving: at that point
 * the scene is ready, so a live region still saying "preparing" would be wrong.
 */
export function DtoLayerStackLoading({
  className,
  exiting = false,
}: {
  className?: string;
  exiting?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden transition-[opacity,filter] ease-out motion-reduce:transition-none ${className ?? ""}`}
      style={{
        opacity: exiting ? 0 : 1,
        filter: exiting ? "blur(6px)" : "blur(0px)",
        transitionDuration: `${HERO_LOADER_EXIT_MS}ms`,
      }}
      role={exiting ? undefined : "status"}
      aria-live={exiting ? undefined : "polite"}
      aria-label={exiting ? undefined : "Preparing the 3D pipeline."}
      aria-hidden={exiting ? "true" : undefined}
    >
      {exiting ? null : (
        <span className="sr-only">Preparing the 3D pipeline.</span>
      )}

      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute top-[24%] left-1/2 h-[54%] w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(111,116,242,0.13),rgba(207,210,236,0.045)_46%,transparent_72%)] blur-[28px]" />

        {LOADING_LAYERS.map((layer, index) => (
          <span
            key={layer.top}
            className="hero-glass-loader-layer absolute left-1/2 h-[14%] w-[61%]"
            style={{ top: layer.top, animationDelay: layer.delay }}
          >
            <span className="absolute inset-0 translate-y-[7px] [clip-path:polygon(22%_0,100%_28%,78%_100%,0_72%)] border border-[#dce1f0]/90 bg-[linear-gradient(155deg,rgba(211,216,236,0.92),rgba(238,241,250,0.78))] shadow-[0_22px_34px_-24px_rgba(15,25,60,0.3)]" />
            <span
              className={`absolute inset-0 overflow-hidden [clip-path:polygon(22%_0,100%_28%,78%_100%,0_72%)] border border-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_32px_-24px_rgba(35,48,92,0.2)] ${
                layer.accent
                  ? "bg-[radial-gradient(circle_at_49%_46%,rgba(173,178,255,0.82),rgba(224,226,255,0.76)_42%,rgba(249,250,253,0.7)_76%)]"
                  : "bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(226,230,243,0.8))]"
              }`}
            >
              <span
                className="hero-glass-loader-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.86),transparent)] blur-[5px]"
                style={{ animationDelay: `${index * 120 - 620}ms` }}
              />
            </span>
          </span>
        ))}

        <div className="absolute bottom-[8.5%] left-1/2 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border border-white/70 bg-white/55 px-3 py-2 shadow-[0_12px_30px_-18px_rgba(32,43,80,0.24)] backdrop-blur-md">
          <span className="hero-glass-loader-pulse size-1.5 rounded-full bg-[#6b6bf2] shadow-[0_0_12px_rgba(107,107,242,0.55)]" />
          <span className="text-[9px] leading-none font-semibold tracking-[0.14em] text-[#68708a] uppercase">
            Preparing pipeline
          </span>
        </div>
      </div>
    </div>
  );
}
