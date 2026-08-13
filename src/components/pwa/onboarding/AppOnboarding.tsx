import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ShoppingBag, Bot, Sprout, ArrowRight } from "lucide-react";
import kilimoLogo from "@/assets/kilimo-logo.png";
import heroAgritech from "@/assets/hero-agritech.jpg?format=webp&quality=75";
import elearningHero from "@/assets/elearning-hero.jpg?format=webp&quality=75";
import shopHero from "@/assets/shop-hero.jpg?format=webp&quality=75";

interface Slide {
  image: string;
  icon: typeof Sprout;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    image: heroAgritech,
    icon: Sprout,
    title: "Bienvenue sur KILIMO",
    description: "L'agriculture intelligente, dans ta poche. Formations, semences certifiées et agroconseil, réunis dans une seule app.",
  },
  {
    image: elearningHero,
    icon: GraduationCap,
    title: "Des formations qui te font progresser",
    description: "Apprends à ton rythme avec des formateurs experts et obtiens un certificat reconnu à la fin de chaque parcours.",
  },
  {
    image: shopHero,
    icon: ShoppingBag,
    title: "Semences & équipements certifiés",
    description: "Commande en ligne, suis ta livraison et paie en toute sécurité — tout ce qu'il faut pour ton exploitation.",
  },
  {
    image: heroAgritech,
    icon: Bot,
    title: "Un assistant agricole IA, 24/7",
    description: "Pose tes questions sur tes cultures, ta région ou ta saison et reçois des réponses adaptées, à tout moment.",
  },
];

/**
 * Onboarding plein écran affiché une seule fois à la première ouverture de
 * l'app PWA installée (voir usePwaOnboarding). Défilement par swipe natif
 * (scroll-snap horizontal) — pas de librairie de carrousel, léger et fluide.
 */
export function AppOnboarding({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: i * scroller.clientWidth, behavior: "smooth" });
    setIndex(i);
  };

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const next = Math.round(scroller.scrollLeft / Math.max(1, scroller.clientWidth));
    if (next !== index) setIndex(next);
  };

  const finish = (redirectTo?: string) => {
    onComplete();
    if (redirectTo) navigate(redirectTo);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col">
      {/* Passer — toujours accessible sauf sur la dernière slide (le CTA final couvre déjà l'action) */}
      {!isLast && (
        <button
          type="button"
          onClick={() => finish()}
          style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
          className="absolute right-4 z-10 text-sm font-medium text-white/90 bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          Passer
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center flex flex-col">
            <div className="relative h-[52%] shrink-0">
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-black/40" />
              <div
                style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
                className="absolute left-4 flex items-center gap-2"
              >
                <img src={kilimoLogo} alt="KILIMO" className="w-8 h-8 rounded-lg" />
              </div>
            </div>

            <div className="flex-1 flex flex-col px-6 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <slide.icon className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold leading-tight mb-2">{slide.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
        className="px-6 pt-4 space-y-4"
      >
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l'étape ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-primary/20"}`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => finish("/auth")}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              Créer un compte <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => finish()}
              className="w-full h-12 rounded-xl font-medium text-muted-foreground"
            >
              Continuer sans compte
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AppOnboarding;
