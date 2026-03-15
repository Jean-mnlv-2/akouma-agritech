import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star as StarIcon } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
  Shield,
  Crown,
  Briefcase,
  Calendar,
  Radio,
  Receipt,
  Eye,
  History
} from 'lucide-react';
import TitleManager from '@/components/TitleManager';
import { AdminCourses } from '@/components/admin/AdminCourses';
import { AdminCoursePreviews } from '@/components/admin/AdminCoursePreviews';
import { AdminReminderLogs } from '@/components/admin/AdminReminderLogs';
import { AdminNews } from '@/components/admin/AdminNews';
import { AdminSeeds } from '@/components/admin/AdminSeeds';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminLegalPages } from '@/components/admin/AdminLegalPages';
import { AdminSubmissions } from '@/components/admin/AdminSubmissions';
import { AdminCareers } from '@/components/admin/AdminCareers';
import { AdminEvents } from '@/components/admin/AdminEvents';
import { AdminPartners } from '@/components/admin/AdminPartners';
import AdminLiveStreams from '@/pages/AdminLiveStreams';
import { AdminDonationsContent } from '@/components/admin/AdminDonationsContent';
import { AdminContactSettings } from '@/components/admin/AdminContactSettings';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminProvider } from '@/contexts/AdminContext';
import { AdminPasswordDialog } from '@/components/admin/AdminPasswordDialog';
import { Badge } from '@/components/ui/badge';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalNews: number;
  totalSeeds: number;
  totalProducts: number;
  totalSubmissions: number;
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

const tabs = [
  { value: 'dashboard', label: 'Tableau de bord', icon: Receipt },
  { value: 'users', label: 'Utilisateurs', icon: Shield },
  { value: 'orders', label: 'Ventes & Promos', icon: Receipt },
  { value: 'courses', label: 'Cours', icon: BookOpen },
  { value: 'course-previews', label: 'Aperçus Cours', icon: Eye },
  { value: 'reminder-logs', label: 'Journal Rappels', icon: History },
  { value: 'news', label: 'Actualités', icon: Newspaper },
  { value: 'seeds', label: 'Semences', icon: Sprout },
  { value: 'products', label: 'Produits', icon: Package },
  { value: 'legal', label: 'Pages Légales', icon: FileText },
  { value: 'partners', label: 'Partenaires', icon: Users },
  { value: 'donations-content', label: 'Dons - Contenus', icon: FileText },
  { value: 'careers', label: 'Emplois', icon: Briefcase },
  { value: 'events', label: 'Événements', icon: Calendar },
  { value: 'livestreams', label: 'Live Streams', icon: Radio },
  { value: 'submissions', label: 'Soumissions', icon: FileText },
  { value: 'reviews', label: 'Avis Clients', icon: StarIcon },
  { value: 'contact-settings', label: 'Contacts & Réseaux', icon: FileText }
];

function AdminContent() {
  const [user, setUser] = useState<{ email?: string; role?: string; allowedModules?: string[] } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalNews: 0,
    totalSeeds: 0,
    totalProducts: 0,
    totalSubmissions: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const { data: { user } } = await api.auth.getUser();
        if (!isMounted) return;
        
        if (!user) {
          navigate('/auth');
          return;
        }

        setUser({ 
          email: user.email, 
          role: user.role,
          allowedModules: user.allowedModules || [] 
        });
        
        const isAuthorizedAdmin = user.role === 'admin';
        const isAuthorizedSupervisor = user.role === 'supervisor';
        
        if (!isAuthorizedAdmin && !isAuthorizedSupervisor) {
          toast({ title: "Accès refusé", description: "Vous n'avez pas les permissions pour accéder à cette page.", variant: "destructive" });
          navigate('/auth');
          return;
        }

        setIsAdmin(isAuthorizedAdmin);
        setIsSupervisor(isAuthorizedSupervisor);
        
        // Si c'est un superviseur, on le redirige vers son premier module autorisé s'il n'est pas sur 'users'
        if (isAuthorizedSupervisor && !isAuthorizedAdmin) {
          const modules = user.allowedModules || [];
          if (modules.length > 0 && !modules.includes('users')) {
            setActiveTab(modules[0]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error checking auth:', error);
          navigate('/auth');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => { isMounted = false; };
  }, [navigate, toast]);

  // Filtrer les onglets selon les permissions
  const visibleTabs = tabs.filter(tab => {
    if (isAdmin) return true;
    if (isSupervisor) {
      return user?.allowedModules?.includes(tab.value);
    }
    return false;
  });

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
        "Soumissions": "submissions"
      };
      const moduleKey = moduleMap[stat.title];
      return user?.allowedModules?.includes(moduleKey);
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-background admin-responsive" translate="no">
      <TitleManager title="Administration" description="Dashboard d'administration AKOUMA Agritech - Gestion du contenu et des utilisateurs" noIndex={true} image="/logo-ak.png" />
      
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
        <div className="admin-grid-responsive admin-grid-responsive-6 mb-8">
          {visibleStats.map((stat) => (<StatCard key={`stat-${stat.title}`} {...stat} className="admin-card-mobile" />))}
        </div>

        {/* Tabs */}
        <div className="admin-space-responsive-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto w-full bg-muted/30 p-1 justify-start gap-1 mb-6 border border-border/50">
              {visibleTabs.map((tab) => (
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

            <div className="mt-6">
              {(activeTab === 'users' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('users')))) && <AdminUserManagement />}
              {(activeTab === 'orders' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('orders')))) && <AdminOrders />}
              {(activeTab === 'courses' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('courses')))) && <AdminCourses />}
              {(activeTab === 'course-previews' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('course-previews')))) && <AdminCoursePreviews />}
              {(activeTab === 'reminder-logs' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('reminder-logs')))) && <AdminReminderLogs />}
              {(activeTab === 'news' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('news')))) && <AdminNews />}
              {(activeTab === 'seeds' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('seeds')))) && <AdminSeeds />}
              {(activeTab === 'products' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('products')))) && <AdminProducts />}
              {(activeTab === 'legal' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('legal')))) && <AdminLegalPages />}
              {(activeTab === 'partners' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('partners')))) && <AdminPartners />}
              {(activeTab === 'donations-content' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('donations-content')))) && <AdminDonationsContent />}
              {(activeTab === 'careers' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('careers')))) && <AdminCareers />}
              {(activeTab === 'events' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('events')))) && <AdminEvents />}
              {(activeTab === 'livestreams' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('livestreams')))) && <AdminLiveStreams />}
              {(activeTab === 'submissions' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('submissions')))) && <AdminSubmissions />}
              {(activeTab === 'reviews' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('reviews')))) && <AdminReviews />}
              {(activeTab === 'contact-settings' && (isAdmin || (isSupervisor && user?.allowedModules?.includes('contact-settings')))) && <AdminContactSettings />}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Password Change Dialog */}
      <AdminPasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}

export default function Admin() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
