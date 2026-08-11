import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star as StarIcon } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  LogOut,
  User,
  Lock,
  Users,
  FileText,
  BookOpen,
  Sprout,
  Newspaper,
  Package,
  Truck,
  Shield,
  ShieldAlert,
  Landmark,
  Crown,
  Briefcase,
  Calendar,
  Radio,
  Receipt,
  Eye,
  History,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Bell
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { AdminPasswordDialog } from '@/components/admin/AdminPasswordDialog';
import { Badge } from '@/components/ui/badge';
import { AdminNotifications } from '@/components/admin/AdminNotifications';

// Chaque onglet n'est monté que lorsqu'il est actif (voir la zone de contenu
// des tabs plus bas) : les charger en lazy() permet à Vite de les découper
// en chunks séparés au lieu de tout empaqueter dans le seul chunk "Admin"
// (auparavant ~1.5MB, chargé même pour n'afficher que le tableau de bord).
const AdminCourses = lazy(() => import('@/components/admin/AdminCourses').then(m => ({ default: m.AdminCourses })));
const AdminCoursePreviews = lazy(() => import('@/components/admin/AdminCoursePreviews').then(m => ({ default: m.AdminCoursePreviews })));
const AdminReminderLogs = lazy(() => import('@/components/admin/AdminReminderLogs').then(m => ({ default: m.AdminReminderLogs })));
const AdminRattrapageRequests = lazy(() => import('@/components/admin/AdminRattrapageRequests').then(m => ({ default: m.AdminRattrapageRequests })));
const AdminAiSuggestions = lazy(() => import('@/components/admin/AdminAiSuggestions').then(m => ({ default: m.AdminAiSuggestions })));
const AdminNews = lazy(() => import('@/components/admin/AdminNews').then(m => ({ default: m.AdminNews })));
const AdminSeeds = lazy(() => import('@/components/admin/AdminSeeds').then(m => ({ default: m.AdminSeeds })));
const AdminProducts = lazy(() => import('@/components/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminLegalPages = lazy(() => import('@/components/admin/AdminLegalPages').then(m => ({ default: m.AdminLegalPages })));
const AdminSubmissions = lazy(() => import('@/components/admin/AdminSubmissions').then(m => ({ default: m.AdminSubmissions })));
const AdminCareers = lazy(() => import('@/components/admin/AdminCareers').then(m => ({ default: m.AdminCareers })));
const AdminEvents = lazy(() => import('@/components/admin/AdminEvents').then(m => ({ default: m.AdminEvents })));
const AdminPartners = lazy(() => import('@/components/admin/AdminPartners').then(m => ({ default: m.AdminPartners })));
const AdminInnovativeSolutions = lazy(() => import('@/components/admin/AdminInnovativeSolutions').then(m => ({ default: m.AdminInnovativeSolutions })));
const AdminPushNotifications = lazy(() => import('@/components/admin/AdminPushNotifications').then(m => ({ default: m.AdminPushNotifications })));
const AdminLiveStreams = lazy(() => import('@/pages/AdminLiveStreams'));
const AdminDonationsContent = lazy(() => import('@/components/admin/AdminDonationsContent').then(m => ({ default: m.AdminDonationsContent })));
const AdminContactSettings = lazy(() => import('@/components/admin/AdminContactSettings').then(m => ({ default: m.AdminContactSettings })));
const AdminUserManagement = lazy(() => import('@/components/admin/AdminUserManagement').then(m => ({ default: m.AdminUserManagement })));
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminDeliveries = lazy(() => import('@/components/admin/AdminDeliveries').then(m => ({ default: m.AdminDeliveries })));
const AdminReviews = lazy(() => import('@/components/admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminDashboardCharts = lazy(() => import('@/components/admin/AdminDashboardCharts').then(m => ({ default: m.AdminDashboardCharts })));
const AdminAffiliateLeaderboard = lazy(() => import('@/components/admin/AdminAffiliateLeaderboard').then(m => ({ default: m.AdminAffiliateLeaderboard })));
const AdminCourseModules = lazy(() => import('@/components/admin/AdminCourseModules').then(m => ({ default: m.AdminCourseModules })));
const AdminAttendance = lazy(() => import('@/components/admin/AdminAttendance').then(m => ({ default: m.AdminAttendance })));
const AdminSertifierSettings = lazy(() => import('@/components/admin/AdminSertifierSettings').then(m => ({ default: m.AdminSertifierSettings })));
const AdminCertificates = lazy(() => import('@/components/admin/AdminCertificates').then(m => ({ default: m.AdminCertificates })));
const AdminElearningEnrollments = lazy(() => import('@/pages/AdminElearningEnrollments'));
const AdminPageHeaderImages = lazy(() => import('@/components/admin/AdminPageHeaderImages').then(m => ({ default: m.AdminPageHeaderImages })));
const AdminCookieConsents = lazy(() => import('@/components/admin/AdminCookieConsents').then(m => ({ default: m.AdminCookieConsents })));
const AdminSubscriptions = lazy(() => import('@/components/admin/AdminSubscriptions').then(m => ({ default: m.AdminSubscriptions })));
const AdminDocuments = lazy(() => import('@/components/admin/AdminDocuments').then(m => ({ default: m.AdminDocuments })));
const AdminPhytosanitaryProducts = lazy(() => import('@/components/admin/AdminPhytosanitaryProducts').then(m => ({ default: m.AdminPhytosanitaryProducts })));
const AdminTrustedSources = lazy(() => import('@/components/admin/AdminTrustedSources').then(m => ({ default: m.AdminTrustedSources })));

const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalNews: number;
  totalSeeds: number;
  totalProducts: number;
  totalSubmissions: number;
  totalEnrollments?: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, color, className }) => {
  return (
    <div className={`admin-card-mobile ${className || ''}`}>
      <div className="admin-space-responsive-sm">
        <div className="flex items-center justify-between">
          <div className="admin-space-responsive-xs">
            <p className="admin-text-responsive-sm text-muted-foreground">{title}</p>
            <p className="admin-text-responsive-xl font-bold">{value}</p>
            <p className="admin-text-responsive-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`p-2 md:p-3 rounded-lg bg-muted/50 ${color}`}>
            <Icon className="admin-icon-responsive-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

const tabGroups = [
  {
    title: "📊 Dashboard & Aperçu",
    tabs: [{ value: 'dashboard', label: 'Tableau de bord', icon: Receipt }]
  },
  {
    title: "👥 Utilisateurs",
    tabs: [
      { value: 'users', label: 'Utilisateurs', icon: Shield },
      { value: 'affiliates', label: 'Classement Affiliés', icon: Crown }
    ]
  },
  {
    title: "💳 Ventes & Logistique",
    tabs: [
      { value: 'orders', label: 'Ventes & Promos', icon: Receipt },
      { value: 'deliveries', label: 'Livraisons', icon: Truck }
    ]
  },
  {
    title: "🤖 Chatbot & Abonnements",
    tabs: [
      { value: 'subscriptions', label: 'Forfaits Chatbot', icon: Crown },
      { value: 'documents', label: 'Documents RAG', icon: FileText },
      { value: 'phytosanitary-products', label: 'Produits phytosanitaires', icon: ShieldAlert },
      { value: 'trusted-sources', label: 'Sources de confiance', icon: Landmark }
    ]
  },
  {
    title: "📚 E-Learning & Certifications",
    tabs: [
      { value: 'courses', label: 'Cours', icon: BookOpen },
      { value: 'elearning-enrollments', label: 'Inscriptions', icon: Users },
      { value: 'course-previews', label: 'Aperçus', icon: Eye },
      { value: 'course-modules', label: 'Modules', icon: BookOpen },
      { value: 'attendance', label: 'Présences', icon: Calendar },
      { value: 'sertifier', label: 'Sertifier', icon: Shield },
      { value: 'push-notifications', label: 'Notifications Push', icon: Bell },
      { value: 'certificates', label: 'Certificats', icon: Crown },
      { value: 'rattrapage-requests', label: 'Rattrapages', icon: RotateCcw },
      { value: 'ai-suggestions', label: 'Suggestions DeerFlow', icon: Sparkles },
      { value: 'reminder-logs', label: 'Journal Rappels', icon: History }
    ]
  },
  {
    title: "📰 Contenu & Communication",
    tabs: [
      { value: 'news', label: 'Actualités', icon: Newspaper },
      { value: 'legal', label: 'Pages Légales', icon: FileText },
      { value: 'partners', label: 'Partenaires', icon: Users },
      { value: 'innovative-solutions', label: 'Solutions Innovantes', icon: Lightbulb },
      { value: 'careers', label: 'Emplois', icon: Briefcase },
      { value: 'events', label: 'Événements', icon: Calendar },
      { value: 'livestreams', label: 'Live Streams', icon: Radio },
      { value: 'donations-content', label: 'Dons - Contenus', icon: FileText },
      { value: 'submissions', label: 'Soumissions', icon: FileText },
      { value: 'reviews', label: 'Avis Clients', icon: StarIcon },
      { value: 'page-header-images', label: "Images d'en-tête", icon: Eye },
      { value: 'contact-settings', label: 'Contacts & Réseaux', icon: FileText },
      { value: 'cookie-consents', label: 'Consentements Cookies', icon: Shield }
    ]
  },
  {
    title: "🌱 Boutique & Produits",
    tabs: [
      { value: 'seeds', label: 'Semences', icon: Sprout },
      { value: 'products', label: 'Produits', icon: Package }
    ]
  }
];

function AdminContent() {
  const [user, setUser] = useState<{ email?: string; role?: string; allowedModules?: string[] } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalNews: 0,
    totalSeeds: 0,
    totalProducts: 0,
    totalSubmissions: 0,
    totalEnrollments: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const { data: { user } } = await api.auth.getUser();
        if (!isMounted || !user) return;

        setUser({ 
          email: user.email, 
          role: user.role,
          allowedModules: user.allowedModules || [] 
        });
        
        setIsAdmin(user.role === 'admin');
        setIsSupervisor(user.role === 'supervisor');
        
        if (user.role === 'supervisor' && user.role !== 'admin') {
          const modules = user.allowedModules || [];
          if (modules.length > 0 && !modules.includes('users')) {
            setActiveTab(modules[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();
    return () => { isMounted = false; };
  }, []);



  useEffect(() => {
    let isMounted = true;
    const fetchDashboardStats = async () => {
      try {
        const body = await api.request('GET', '/api/stats');
        if (!isMounted) return;
        const s = body?.data || {};
        setStats({
          totalUsers: Number(s.totalUsers || 0),
          totalCourses: Number(s.totalCourses || 0),
          totalNews: Number(s.totalNews || 0),
          totalSeeds: Number(s.totalSeeds || 0),
          totalProducts: Number(s.totalProducts || 0),
          totalSubmissions: Number(s.totalSubmissions || 0),
          totalEnrollments: Number(s.totalEnrollments || 0),
        });
      } catch (error) {
        if (isMounted) console.error('Error fetching dashboard stats:', error);
      }
    };

    if (isAdmin || isSupervisor) { fetchDashboardStats(); }
    return () => { isMounted = false; };
  }, [isAdmin, isSupervisor]);

  const handleLogout = async () => { await api.auth.signOut(); navigate('/'); };

  // Configuration des statistiques
  const statsConfig = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      description: "Total des comptes",
      color: "text-blue-600"
    },
    {
      title: "Cours",
      value: stats.totalCourses,
      icon: BookOpen,
      description: "Formations disponibles",
      color: "text-green-600"
    },
    {
      title: "Actualités",
      value: stats.totalNews,
      icon: Newspaper,
      description: "Articles publiés",
      color: "text-purple-600"
    },
    {
      title: "Semences",
      value: stats.totalSeeds,
      icon: Sprout,
      description: "Produits agricoles",
      color: "text-orange-600"
    },
    {
      title: "Produits",
      value: stats.totalProducts,
      icon: Package,
      description: "Boutique en ligne",
      color: "text-red-600"
    },
    {
      title: "Soumissions",
      value: stats.totalSubmissions,
      icon: FileText,
      description: "Contenus en attente",
      color: "text-indigo-600"
    },
    {
      title: "Inscriptions",
      value: stats.totalEnrollments || 0,
      icon: Users,
      description: "Inscrits aux cours",
      color: "text-pink-600"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" translate="no">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isSupervisor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" translate="no">
        <p className="text-muted-foreground">Accès non autorisé.</p>
      </div>
    );
  }

  // Filtrer les statistiques pour les superviseurs
  const visibleStats = statsConfig.filter(stat => {
    if (isAdmin) return true;
    if (isSupervisor) {
      const moduleMap: Record<string, string> = {
        "Utilisateurs": "users",
        "Cours": "courses",
        "Actualités": "news",
        "Semences": "seeds",
        "Produits": "products",
        "Soumissions": "submissions",
        "Inscriptions": "elearning-enrollments"
      };
      const moduleKey = moduleMap[stat.title];
      return user?.allowedModules?.includes(moduleKey);
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-background admin-responsive" translate="no">
      <SEO title="Administration" description="Dashboard d'administration KILIMO Agritech - Gestion du contenu et des utilisateurs" noindex={true} image="/kilimo-logo.png" />
      
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="admin-header-responsive">
            <div className="admin-header-responsive header-content">
              <div className="flex items-center space-x-2 md:space-x-4">
                <Crown className="admin-icon-responsive-lg text-primary flex-shrink-0" />
                <div>
                  <h1 className="admin-text-responsive-xl font-bold text-foreground">Dashboard {isAdmin ? 'Admin' : 'Superviseur'}</h1>
                  <p className="admin-text-responsive-sm text-muted-foreground">Gérez votre plateforme AgriTech</p>
                </div>
              </div>
            </div>
            <div className="admin-header-responsive header-actions">
              <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground bg-muted/50 px-2 md:px-3 py-1 md:py-2 rounded-lg w-full sm:w-auto">
                <User className="admin-icon-responsive-sm flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
                <Badge variant="secondary" className="ml-2 admin-text-responsive-xs capitalize">
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'supervisor' ? 'Superviseur' : 'Utilisateur'}
                </Badge>
              </div>
              <div className="admin-btn-group-mobile">
                <AdminNotifications />
                <Button variant="outline" onClick={() => setPasswordDialogOpen(true)} className="admin-btn-mobile flex items-center space-x-1 md:space-x-2"><Lock className="admin-icon-responsive-sm" /><span className="hidden sm:inline">Mot de passe</span></Button>
                <Button variant="outline" onClick={handleLogout} className="admin-btn-mobile flex items-center space-x-1 md:space-x-2"><LogOut className="admin-icon-responsive-sm" /><span className="hidden sm:inline">Déconnexion</span></Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {visibleStats.map((stat) => (<StatCard key={`stat-${stat.title}`} {...stat} className="admin-card-mobile" />))}
        </div>

        {/* Tabs */}
        <div className="admin-space-responsive-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="space-y-6">
              {tabGroups.map((group) => {
                // Filtrer les tabs du groupe selon les permissions
                const visibleGroupTabs = group.tabs.filter(tab => {
                  if (isAdmin) return true;
                  if (isSupervisor) {
                    return user?.allowedModules?.includes(tab.value);
                  }
                  return false;
                });

                // Ne pas afficher le groupe si pas de tabs visible
                if (visibleGroupTabs.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-2">
                    {/* Titre du groupe */}
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">
                      {group.title}
                    </h3>
                    
                    {/* Onglets du groupe */}
                    <TabsList className="flex flex-wrap h-auto w-full bg-muted/30 p-1 justify-start gap-1 border border-border/50">
                      {visibleGroupTabs.map((tab) => (
                        <TabsTrigger 
                          key={`trigger-${tab.value}`} 
                          value={tab.value} 
                          className="px-3 py-2 flex items-center space-x-2 text-sm font-medium transition-all hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md border border-transparent data-[state=active]:border-border"
                        >
                          <tab.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{tab.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                );
              })}
            </div>

            <Suspense fallback={<TabLoadingFallback />}>
            <div className="mt-6">
              {(activeTab === 'dashboard' && (isAdmin || isSupervisor)) && <AdminDashboardCharts />}
              {(activeTab === 'users' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('users')))) && <AdminUserManagement />}
              {(activeTab === 'orders' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('orders')))) && <AdminOrders />}
              {(activeTab === 'deliveries' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('deliveries')))) && <AdminDeliveries />}
              {(activeTab === 'subscriptions' && isAdmin) && <AdminSubscriptions />}
              {(activeTab === 'documents' && isAdmin) && <AdminDocuments />}
              {(activeTab === 'phytosanitary-products' && isAdmin) && <AdminPhytosanitaryProducts />}
              {(activeTab === 'trusted-sources' && isAdmin) && <AdminTrustedSources />}
              {(activeTab === 'courses' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('courses')))) && (
                <AdminCourses 
                  onViewInscriptions={(id) => { setSelectedCourseId(id); setActiveTab('elearning-enrollments'); }}
                  onViewModules={(id) => { setSelectedCourseId(id); setActiveTab('course-modules'); }}
                />
              )}
              {(activeTab === 'elearning-enrollments' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('elearning-enrollments')))) && (
                <AdminElearningEnrollments 
                  initialCourseId={selectedCourseId} 
                  onClearFilter={() => setSelectedCourseId(null)} 
                />
              )}
              {(activeTab === 'course-previews' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('course-previews')))) && (
                <AdminCoursePreviews 
                  initialCourseId={selectedCourseId} 
                />
              )}
              {(activeTab === 'course-modules' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('course-modules')))) && (
                <AdminCourseModules 
                  initialCourseId={selectedCourseId} 
                />
              )}
              {(activeTab === 'attendance' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('attendance')))) && <AdminAttendance />}
      {(activeTab === 'sertifier' && isAdmin) && <AdminSertifierSettings />}
      {(activeTab === 'push-notifications' && isAdmin) && <AdminPushNotifications />}
              {(activeTab === 'certificates' && isAdmin) && <AdminCertificates />}
              {(activeTab === 'rattrapage-requests' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('rattrapage-requests')))) && <AdminRattrapageRequests />}
              {(activeTab === 'ai-suggestions' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('ai-suggestions')))) && <AdminAiSuggestions />}
              {(activeTab === 'reminder-logs' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('reminder-logs')))) && <AdminReminderLogs />}
              {(activeTab === 'news' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('news')))) && <AdminNews />}
              {(activeTab === 'seeds' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('seeds')))) && <AdminSeeds />}
              {(activeTab === 'products' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('products')))) && <AdminProducts />}
              {(activeTab === 'legal' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('legal')))) && <AdminLegalPages />}
              {(activeTab === 'partners' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('partners')))) && <AdminPartners />}
              {(activeTab === 'innovative-solutions' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('innovative-solutions')))) && <AdminInnovativeSolutions />}
              {(activeTab === 'donations-content' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('donations-content')))) && <AdminDonationsContent />}
              {(activeTab === 'careers' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('careers')))) && <AdminCareers />}
              {(activeTab === 'events' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('events')))) && <AdminEvents />}
              {(activeTab === 'livestreams' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('livestreams')))) && <AdminLiveStreams />}
              {(activeTab === 'submissions' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('submissions')))) && <AdminSubmissions />}
              {(activeTab === 'reviews' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('reviews')))) && <AdminReviews />}
              {(activeTab === 'affiliates' && isAdmin) && <AdminAffiliateLeaderboard />}
      {(activeTab === 'page-header-images' && isAdmin) && <AdminPageHeaderImages />}
              {(activeTab === 'contact-settings' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('contact-settings')))) && <AdminContactSettings />}
              {(activeTab === 'cookie-consents' && isAdmin) && <AdminCookieConsents />}
            </div>
            </Suspense>
          </Tabs>
        </div>
      </div>

      {/* Password Change Dialog */}
      <AdminPasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}

export default function Admin() {
  return <AdminContent />;
}
