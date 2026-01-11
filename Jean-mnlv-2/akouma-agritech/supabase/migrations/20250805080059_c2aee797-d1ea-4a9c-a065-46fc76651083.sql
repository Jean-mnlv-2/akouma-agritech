-- =======================
-- MIGRATION COMPLÈTE POUR PROJET AKOUMA
-- =======================

-- 1. EXTENSION POUR UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPE POUR LES RÔLES UTILISATEUR
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 3. TABLE PROFILES (Profils utilisateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE USER_ROLES (Rôles des utilisateurs)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. TABLE COURSES (Cours e-learning)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  excerpt TEXT,
  instructor_name TEXT,
  instructor_bio TEXT,
  duration_minutes INTEGER,
  level TEXT CHECK (level IN ('Débutant', 'Intermédiaire', 'Avancé')),
  category TEXT NOT NULL,
  price_fcfa INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  video_url TEXT,
  course_materials_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE COURSE_ENROLLMENTS (Inscriptions aux cours)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  certificate_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_comment TEXT,
  UNIQUE(user_id, course_id)
);

-- 7. TABLE SEEDS (Semences et produits agricoles)
CREATE TABLE IF NOT EXISTS public.seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  variety TEXT,
  price_fcfa INTEGER NOT NULL,
  unit TEXT NOT NULL,
  image_url TEXT,
  gallery_urls TEXT[],
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  availability TEXT CHECK (availability IN ('En stock', 'Rupture', 'Pré-commande')) DEFAULT 'En stock',
  stock_quantity INTEGER DEFAULT 0,
  harvest_time TEXT,
  yield_info TEXT,
  features TEXT[],
  planting_instructions TEXT,
  care_instructions TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLE NEWS (Actualités)
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author_name TEXT,
  author_bio TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLE SHOP_PRODUCTS (Produits boutique)
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL,
  original_price_fcfa INTEGER,
  image_url TEXT,
  gallery_urls TEXT[],
  features TEXT[],
  specifications JSONB,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  weight_kg DECIMAL(5,2),
  dimensions TEXT,
  warranty_info TEXT,
  shipping_info TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLE PRODUCT_REVIEWS (Avis produits)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 11. TABLE CARTS (Paniers)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id UUID,
  session_id TEXT,
  status TEXT CHECK (status IN ('active', 'abandoned', 'converted')) DEFAULT 'active',
  total_amount_fcfa INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- 12. TABLE CART_ITEMS (Articles du panier)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE CASCADE NOT NULL,
  product_type TEXT CHECK (product_type IN ('shop_product', 'seed')) DEFAULT 'shop_product',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_fcfa INTEGER NOT NULL,
  total_price_fcfa INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id, product_type)
);

-- 13. TABLE ORDERS (Commandes)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  total_amount_fcfa INTEGER NOT NULL,
  shipping_amount_fcfa INTEGER DEFAULT 0,
  tax_amount_fcfa INTEGER DEFAULT 0,
  discount_amount_fcfa INTEGER DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABLE ORDER_ITEMS (Articles des commandes)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT CHECK (product_type IN ('shop_product', 'seed', 'course')) NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_fcfa INTEGER NOT NULL,
  total_price_fcfa INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. TABLE LEGAL_PAGES (Pages légales)
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT UNIQUE NOT NULL CHECK (type IN ('terms', 'privacy', 'legal', 'cookies')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. TABLE FORM_SUBMISSIONS (Soumissions de formulaires)
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type TEXT NOT NULL CHECK (form_type IN ('contact', 'demo_request', 'content_submission', 'newsletter', 'support')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  status TEXT CHECK (status IN ('new', 'processing', 'responded', 'closed')) DEFAULT 'new',
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. TABLE LIVE_STREAMS (Diffusions en direct)
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  category TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  stream_url TEXT,
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT FALSE,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  recording_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. TABLE EVENTS (Événements)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  event_type TEXT CHECK (event_type IN ('webinar', 'workshop', 'conference', 'field_demo', 'training')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  meeting_url TEXT,
  max_participants INTEGER,
  registered_count INTEGER DEFAULT 0,
  price_fcfa INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  organizer_name TEXT,
  organizer_contact TEXT,
  requirements TEXT,
  agenda TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. TABLE EVENT_REGISTRATIONS (Inscriptions aux événements)
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  registration_data JSONB,
  status TEXT CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled')) DEFAULT 'registered',
  attended_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 20. TABLE OFFLINE_CONTENT (Contenu hors ligne)
CREATE TABLE IF NOT EXISTS public.offline_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT CHECK (content_type IN ('course', 'news', 'seed', 'product')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, content_id, content_type)
);

-- =======================
-- FONCTIONS UTILITAIRES
-- =======================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les rôles (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Fonction pour fusionner les paniers (guest vers user)
CREATE OR REPLACE FUNCTION public.merge_guest_cart_to_user(_user_id UUID, _guest_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_cart_id UUID;
  _guest_cart_id UUID;
BEGIN
  -- Trouver le panier de l'utilisateur
  SELECT id INTO _user_cart_id 
  FROM public.carts 
  WHERE user_id = _user_id AND status = 'active' 
  LIMIT 1;
  
  -- Trouver le panier invité
  SELECT id INTO _guest_cart_id 
  FROM public.carts 
  WHERE guest_id = _guest_id AND status = 'active' 
  LIMIT 1;
  
  -- Si pas de panier invité, rien à faire
  IF _guest_cart_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Créer un panier utilisateur si nécessaire
  IF _user_cart_id IS NULL THEN
    INSERT INTO public.carts (user_id, status) 
    VALUES (_user_id, 'active') 
    RETURNING id INTO _user_cart_id;
  END IF;
  
  -- Transférer les articles du panier invité vers le panier utilisateur
  INSERT INTO public.cart_items (cart_id, product_id, product_type, quantity, unit_price_fcfa, total_price_fcfa)
  SELECT _user_cart_id, product_id, product_type, quantity, unit_price_fcfa, total_price_fcfa
  FROM public.cart_items 
  WHERE cart_id = _guest_cart_id
  ON CONFLICT (cart_id, product_id, product_type) 
  DO UPDATE SET 
    quantity = cart_items.quantity + EXCLUDED.quantity,
    total_price_fcfa = (cart_items.quantity + EXCLUDED.quantity) * cart_items.unit_price_fcfa,
    updated_at = NOW();
  
  -- Supprimer le panier invité
  DELETE FROM public.carts WHERE id = _guest_cart_id;
  
  -- Recalculer le total du panier utilisateur
  UPDATE public.carts 
  SET total_amount_fcfa = (
    SELECT COALESCE(SUM(total_price_fcfa), 0) 
    FROM public.cart_items 
    WHERE cart_id = _user_cart_id
  ),
  updated_at = NOW()
  WHERE id = _user_cart_id;
END;
$$;

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      CONCAT(
        NEW.raw_user_meta_data ->> 'first_name', 
        ' ', 
        NEW.raw_user_meta_data ->> 'last_name'
      )
    )
  );
  
  -- Assigner le rôle par défaut 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- =======================
-- TRIGGERS
-- =======================

-- Trigger pour créer automatiquement un profil à la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seeds_updated_at BEFORE UPDATE ON public.seeds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON public.legal_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON public.live_streams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =======================
-- POLITIQUES RLS (Row Level Security)
-- =======================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_content ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour user_roles
CREATE POLICY "User roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage user roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour courses
CREATE POLICY "Published courses are viewable by everyone" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour course_enrollments
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour seeds
CREATE POLICY "Published seeds are viewable by everyone" ON public.seeds FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all seeds" ON public.seeds FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour news
CREATE POLICY "Published news are viewable by everyone" ON public.news FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all news" ON public.news FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour shop_products
CREATE POLICY "Published products are viewable by everyone" ON public.shop_products FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all products" ON public.shop_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour product_reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour carts
CREATE POLICY "Users can view their own carts" ON public.carts FOR SELECT USING (auth.uid() = user_id OR guest_id IS NOT NULL);
CREATE POLICY "Users can create their own carts" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Users can update their own carts" ON public.carts FOR UPDATE USING (auth.uid() = user_id OR guest_id IS NOT NULL);
CREATE POLICY "Users can delete their own carts" ON public.carts FOR DELETE USING (auth.uid() = user_id OR guest_id IS NOT NULL);

-- Politiques pour cart_items
CREATE POLICY "Users can view their own cart items" ON public.cart_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.carts 
    WHERE carts.id = cart_items.cart_id 
    AND (carts.user_id = auth.uid() OR carts.guest_id IS NOT NULL)
  )
);
CREATE POLICY "Users can manage their own cart items" ON public.cart_items 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.carts 
    WHERE carts.id = cart_items.cart_id 
    AND (carts.user_id = auth.uid() OR carts.guest_id IS NOT NULL)
  )
);

-- Politiques pour orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour order_items
CREATE POLICY "Users can view their own order items" ON public.order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create their own order items" ON public.order_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour legal_pages
CREATE POLICY "Legal pages are viewable by everyone" ON public.legal_pages FOR SELECT USING (true);
CREATE POLICY "Only admins can manage legal pages" ON public.legal_pages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour form_submissions
CREATE POLICY "Users can view their own submissions" ON public.form_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create form submissions" ON public.form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all submissions" ON public.form_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update submissions" ON public.form_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour live_streams
CREATE POLICY "Live streams are viewable by everyone" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage live streams" ON public.live_streams FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour events
CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour event_registrations
CREATE POLICY "Users can view their own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register themselves" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own registrations" ON public.event_registrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON public.event_registrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Politiques pour offline_content
CREATE POLICY "Users can manage their own offline content" ON public.offline_content FOR ALL USING (auth.uid() = user_id);

-- =======================
-- INDEX POUR PERFORMANCES
-- =======================

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_seeds_published ON public.seeds(is_published);
CREATE INDEX IF NOT EXISTS idx_seeds_category ON public.seeds(category);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_published ON public.shop_products(is_published);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON public.shop_products(category);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_guest_id ON public.carts(guest_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_type ON public.form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_dates ON public.events(start_date, end_date);

-- =======================
-- DONNÉES INITIALES
-- =======================

-- Pages légales par défaut
INSERT INTO public.legal_pages (type, title, content) VALUES
('terms', 'Conditions Générales d''Utilisation', 'Contenu des CGU...'),
('privacy', 'Politique de Confidentialité', 'Contenu de la politique de confidentialité...'),
('legal', 'Mentions Légales', 'Contenu des mentions légales...'),
('cookies', 'Politique des Cookies', 'Contenu de la politique des cookies...')
ON CONFLICT (type) DO NOTHING;