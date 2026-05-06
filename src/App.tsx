/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
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
import LoginModal from './components/LoginModal';
import { MessageCircle } from 'lucide-react';

export default function App() {
  const { user, profile, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800&auto=format&fit=crop');
  const [banners, setBanners] = useState<{ id: string; image: string; title?: string; subtitle?: string; active: boolean }[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Sync
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs.length > 0 ? docs : initialProducts);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(docs.length > 0 ? docs : initialCategories);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const activeBanners = docs.filter(b => b.active);
      setBanners(activeBanners);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'banners'));

    const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'testimonials'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setHeroImage(docSnap.data().heroImage);
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

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const filteredProductsWithSearch = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
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
          categories={categories}
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
        onContinueShopping={() => {
          setIsCartOpen(false);
          handleNavClick('products');
        }}
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
