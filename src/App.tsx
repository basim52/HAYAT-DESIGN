/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SearchMobile from './components/SearchMobile';
import MobileCategoryBar from './components/MobileCategoryBar';
import NotificationManager from './components/NotificationManager';
import Hero from './components/Hero';
import Features from './components/Features';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Policies from './components/Policies';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import { CartItem, Product, Category, Testimonial } from './types';
import { PRODUCTS as initialProducts, CATEGORIES as initialCategories, BANK_DETAILS } from './constants';

import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import LoginModal from './components/LoginModal';
import { MessageCircle } from 'lucide-react';

export default function App() {
  const { user, profile, isAdmin } = useAuth();
  const { isMobileView } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allBanners, setAllBanners] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generalConfig, setGeneralConfig] = useState<any>(null);

  // Memoized filters to avoid flashes and redundant subscriptions
  const categories = useMemo(() => {
    const platform = isMobileView ? 'mobile' : 'web';
    const filtered = allCategories.filter((c: any) => !c.platform || c.platform === 'both' || c.platform === platform);
    return filtered.length > 0 ? filtered : initialCategories;
  }, [allCategories, isMobileView]);

  const banners = useMemo(() => {
    const platform = isMobileView ? 'mobile' : 'web';
    return allBanners.filter(b => b.active && (!b.platform || b.platform === 'both' || b.platform === platform));
  }, [allBanners, isMobileView]);

  const heroImage = useMemo(() => {
    if (!generalConfig) return 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800&auto=format&fit=crop';
    const img = isMobileView ? (generalConfig.heroImageMobile || generalConfig.heroImage) : (generalConfig.heroImageWeb || generalConfig.heroImage);
    return img || 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800&auto=format&fit=crop';
  }, [generalConfig, isMobileView]);

  // Firestore Sync - Once on mount
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prev => JSON.stringify(prev) === JSON.stringify(docs) ? prev : (docs.length > 0 ? docs : initialProducts));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setAllCategories(prev => JSON.stringify(prev) === JSON.stringify(docs) ? prev : docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAllBanners(prev => JSON.stringify(prev) === JSON.stringify(docs) ? prev : docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'banners'));

    const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(prev => JSON.stringify(prev) === JSON.stringify(docs) ? prev : docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'testimonials'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGeneralConfig(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/general'));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubTestimonials();
      unsubConfig();
    };
  }, []);

  // Cart Persistence (still local is fine for guest/temp)
  useEffect(() => {
    const savedCart = localStorage.getItem('hayat_cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('hayat_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);

  const filteredProductsWithSearch = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToCategory = useCallback((slug: string) => {
    const id = `category-section-${slug}`;
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleContinueShopping = useCallback(() => {
    setIsCartOpen(false);
    // Use a small delay for the scroll to avoid conflicting with the drawer closing animation
    setTimeout(() => {
      handleNavClick('products');
    }, 300);
  }, [handleNavClick]);

  return (
    <div className="min-h-screen bg-body-bg">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onNavClick={handleNavClick}
        onLoginClick={() => setIsLoginOpen(true)}
        categories={categories}
        onCategoryClick={scrollToCategory}
      />
      
      <main className="pt-20 pb-24 md:pb-0">
        <SearchMobile onSearch={setSearchQuery} />
        <MobileCategoryBar 
          categories={allCategories}
          onCategoryClick={scrollToCategory}
        />
        <Hero 
          onShopClick={() => handleNavClick('products')} 
          heroImage={heroImage}
          banners={banners}
        />
        <Categories 
          categories={categories} 
          onCategoryClick={scrollToCategory}
        />
        
        {/* All Products Section with Filters */}
        <div id="products">
          <ProductList 
            title={searchQuery ? `نتائج البحث عن: ${searchQuery}` : "جميع"}
            subtitle={searchQuery ? "" : "المنتجات"}
            products={filteredProductsWithSearch}
            onAddToCart={handleAddToCart} 
            showFilters={!searchQuery}
          />
        </div>

        {/* Individual Category Sections */}
        {!searchQuery && categories.map((category) => {
          const categoryProducts = filteredProductsWithSearch.filter(p => p.category === category.name);
          if (categoryProducts.length === 0) return null;
          
          return (
            <div key={category.id} id={`category-section-${category.slug}`}>
              <ProductList 
                title={category.name}
                subtitle="بلمسة إبداعية"
                products={categoryProducts}
                onAddToCart={handleAddToCart} 
                showFilters={false}
              />
            </div>
          );
        })}
        
        <Testimonials testimonials={testimonials} />
        
        <Policies />
        <Features />
      </main>

      <Footer isAdmin={isAdmin} onAdminOpen={() => setIsAdminOpen(true)} />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        onContinueShopping={handleContinueShopping}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        userProfile={profile}
      />

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        heroImage={heroImage}
      />

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${BANK_DETAILS.whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[90] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 fill-white/20" />
        <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-2xl shadow-xl text-charcoal text-xs font-black whitespace-nowrap opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          تواصل معنا عبر الواتساب
        </div>
      </a>

      <BottomNav 
        onNavClick={handleNavClick}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
      />

      <NotificationManager 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
