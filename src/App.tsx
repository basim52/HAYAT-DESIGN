/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { CartItem, Product, Category } from './types';
import { PRODUCTS as initialProducts, CATEGORIES as initialCategories } from './constants';

import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useAuth } from './AuthContext';
import LoginModal from './components/LoginModal';

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

  // Firestore Sync
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs.length > 0 ? docs : initialProducts);
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(docs.length > 0 ? docs : initialCategories);
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setHeroImage(docSnap.data().heroImage);
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
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

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onNavClick={handleNavClick}
        onLoginClick={() => setIsLoginOpen(true)}
      />
      
      <main className="pt-20">
        <Hero 
          onShopClick={() => handleNavClick('products')} 
          heroImage={heroImage}
        />
        <Categories categories={categories} />
        <ProductList 
          products={products}
          onAddToCart={handleAddToCart} 
        />
      </main>

      <Footer isAdmin={isAdmin} onAdminOpen={() => setIsAdminOpen(true)} />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
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
    </div>
  );
}
