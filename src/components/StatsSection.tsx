import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Sprout, GraduationCap, Newspaper } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { usePublicStats } from '@/hooks/use-public-stats';
import { Skeleton } from '@/components/ui/skeleton';

// Chiffres réels (voir GET /api/stats/public) uniquement — pas de chiffre
// marketing inventé. Un compteur à 0 est affiché tel quel plutôt que masqué :
// mieux vaut un "0" honnête qu'un faux chiffre rond.
const STAT_TILES = [
  { key: 'totalCourses' as const, icon: BookOpen, label: 'Cours disponibles', color: 'from-blue-500 to-cyan-500' },
  { key: 'totalSeeds' as const, icon: Sprout, label: 'Semences certifiées', color: 'from-primary to-green-600' },
  { key: 'totalLearners' as const, icon: GraduationCap, label: 'Apprenants actifs', color: 'from-yellow-500 to-orange-500' },
  { key: 'totalNews' as const, icon: Newspaper, label: 'Actualités publiées', color: 'from-purple-500 to-pink-500' },
];

const StatsSection = () => {
  const { t } = useI18n();
  const sectionRef = useScrollReveal({ threshold: 0.2 });
  const { data: stats, isLoading } = usePublicStats();

  return (
    <section
      ref={sectionRef.elementRef}
      className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('home.stats.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('home.stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STAT_TILES.map((tile, index) => {
            const delay = index * 100;
            return (
              <Card
                key={tile.key}
                className={`text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-md border border-border/50 overflow-hidden ${
                  sectionRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                <CardContent className="p-6 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${tile.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  <div className={`relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${tile.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                    <tile.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>

                  {isLoading ? (
                    <Skeleton className="h-9 w-16 mx-auto mb-2" />
                  ) : (
                    <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${tile.color} bg-clip-text text-transparent mb-2`}>
                      {stats?.[tile.key] ?? 0}
                      {stats?.[tile.key] ? '+' : ''}
                    </div>
                  )}

                  <div className="text-sm md:text-base font-semibold text-foreground">
                    {tile.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
