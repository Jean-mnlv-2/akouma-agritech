import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Flame, Target, BookOpen } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tier: 'bronze' | 'silver' | 'gold';
  earned: boolean;
  progress?: number;
  requirement: string;
}

interface StudentBadgesProps {
  completedCourses: number;
  totalModulesCompleted: number;
  averageScore: number;
  totalHours: number;
  streak: number;
}

const tierStyles = {
  bronze: {
    bg: 'bg-gradient-to-br from-amber-700 to-amber-900',
    border: 'border-amber-600',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-amber-200 dark:shadow-amber-900/30',
    label: 'Bronze',
    dimmed: 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  silver: {
    bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
    border: 'border-gray-400',
    text: 'text-gray-600 dark:text-gray-300',
    glow: 'shadow-gray-200 dark:shadow-gray-800/30',
    label: 'Argent',
    dimmed: 'bg-gray-100/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700',
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    border: 'border-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    glow: 'shadow-yellow-200 dark:shadow-yellow-900/30',
    label: 'Or',
    dimmed: 'bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
  },
};

const StudentBadges = ({ completedCourses, totalModulesCompleted, averageScore, totalHours, streak }: StudentBadgesProps) => {
  const badges: BadgeData[] = [
    {
      id: 'first-course',
      name: 'Premier Pas',
      description: 'Terminer votre premier cours',
      icon: <BookOpen className="w-6 h-6" />,
      tier: 'bronze',
      earned: completedCourses >= 1,
      progress: Math.min(completedCourses, 1),
      requirement: '1 cours terminé',
    },
    {
      id: 'module-master',
      name: 'Maître des Modules',
      description: 'Compléter 10 modules',
      icon: <Target className="w-6 h-6" />,
      tier: 'bronze',
      earned: totalModulesCompleted >= 10,
      progress: Math.min(totalModulesCompleted / 10 * 100, 100),
      requirement: '10 modules complétés',
    },
    {
      id: 'high-achiever',
      name: 'Excellent Élève',
      description: 'Obtenir une moyenne de 80%+',
      icon: <Star className="w-6 h-6" />,
      tier: 'silver',
      earned: averageScore >= 80 && totalModulesCompleted >= 5,
      progress: Math.min(averageScore / 80 * 100, 100),
      requirement: 'Moyenne ≥ 80%',
    },
    {
      id: 'dedicated',
      name: 'Dédié',
      description: 'Cumuler 20+ heures d\'apprentissage',
      icon: <Flame className="w-6 h-6" />,
      tier: 'silver',
      earned: totalHours >= 20,
      progress: Math.min(totalHours / 20 * 100, 100),
      requirement: '20 heures d\'étude',
    },
    {
      id: 'course-champion',
      name: 'Champion',
      description: 'Terminer 5 cours avec 90%+',
      icon: <Trophy className="w-6 h-6" />,
      tier: 'gold',
      earned: completedCourses >= 5 && averageScore >= 90,
      progress: Math.min(completedCourses / 5 * 100, 100),
      requirement: '5 cours, moyenne ≥ 90%',
    },
    {
      id: 'streak-king',
      name: 'Régularité Royale',
      description: 'Maintenir 7 jours de suite',
      icon: <Award className="w-6 h-6" />,
      tier: 'gold',
      earned: streak >= 7,
      progress: Math.min(streak / 7 * 100, 100),
      requirement: '7 jours consécutifs',
    },
  ];

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Badges & Récompenses
          <Badge variant="outline" className="ml-auto text-sm">{earnedCount}/{badges.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const style = tierStyles[badge.tier];
            return (
              <div
                key={badge.id}
                className={`relative rounded-xl p-4 border-2 text-center transition-all ${
                  badge.earned
                    ? `${style.dimmed} shadow-md ${style.glow}`
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                {/* Tier label */}
                <Badge
                  variant="outline"
                  className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 ${
                    badge.earned ? style.text : 'text-muted-foreground'
                  }`}
                >
                  {style.label}
                </Badge>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  badge.earned ? `${style.bg} text-white shadow-lg` : 'bg-muted text-muted-foreground'
                }`}>
                  {badge.icon}
                </div>

                <h4 className={`font-bold text-sm mb-1 ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {badge.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>

                {/* Progress bar */}
                {!badge.earned && badge.progress !== undefined && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${style.bg}`}
                      style={{ width: `${Math.min(badge.progress, 100)}%` }}
                    />
                  </div>
                )}
                {badge.earned && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Obtenu</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentBadges;
