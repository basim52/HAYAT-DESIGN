import { X, Plus, Trash2, Edit2, Save, Image as ImageIcon, Package, Clock, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Calendar, User, MapPin, Phone, MessageCircle, TrendingUp, BarChart2, Wallet, DollarSign, Scissors, Palette, Layout, MessageSquare, Star, Bell, ShoppingCart, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Product, Category, Order, Testimonial, Coupon, Announcement } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../AuthContext';
import ImageEditorModal from './ImageEditorModal';
import { useTheme } from '../ThemeContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  heroImage: string;
}

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  categories,
  heroImage,
}: AdminPanelProps) {
  const { isAdmin } = useAuth();
  const { configs: themeConfigs, previewConfig, setPreview, saveConfig, setAdminForcePlatform } = useTheme();
  const [platformTab, setPlatformTab] = useState<'web' | 'mobile'>('web');
  const [heroPlatformTab, setHeroPlatformTab] = useState<'web' | 'mobile'>('web');
  const [catPlatformTab, setCatPlatformTab] = useState<'web' | 'mobile'>('web');
  const currentThemeConfig = (previewConfig?.platform === platformTab) ? previewConfig.config : themeConfigs[platformTab];
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'hero' | 'orders' | 'theme' | 'testimonials' | 'notifications' | 'coupons'>('orders');

  useEffect(() => {
    if (activeTab === 'theme' && isOpen) {
      setAdminForcePlatform(platformTab);
    } else {
      setAdminForcePlatform(null);
    }
  }, [activeTab, platformTab, isOpen]);
  const [heroImageWeb, setHeroImageWeb] = useState('');
  const [heroImageMobile, setHeroImageMobile] = useState('');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    customerName: '',
    content: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0]
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [banners, setBanners] = useState<{ id: string; image: string; title?: string; subtitle?: string; active: boolean }[]>([]);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifSettings, setNotifSettings] = useState<any>({
    cartReminderEnabled: false,
    reminders: [
      { id: '1', delayMinutes: 15, title: 'سلة المشتريات تنتظرك!', message: 'لديك منتجات رائعة في سلتك، لا تفوت فرصة اقتنائها الآن.' },
      { id: '2', delayMinutes: 300, title: 'ما زلنا ننتظرك!', message: 'منتجاتك المفضلة لا تزال بانتظارك، أكمل طلبك الآن.' },
      { id: '3', delayMinutes: 1440, title: 'الفرصة الأخيرة!', message: 'أكمل طلبك قبل نفاذ الكمية، نحن متحمسون لخدمتك.' }
    ]
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'web' | 'mobile'>('all');
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    type: 'popup',
    size: 'md',
    platform: 'both',
    position: 'bottom',
    active: true,
    maxViews: 0,
    autoHideSeconds: 0,
    startDate: '',
    endDate: ''
  });

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: categories[0]?.name || '',
    description: '',
    price: 0,
    image: '',
  });

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    image: '',
    slug: '',
    platform: 'web' as any
  });

  const [newBanner, setNewBanner] = useState({
    image: '',
    title: '',
    subtitle: '',
    active: true,
    platform: 'web' as 'web' | 'mobile' | 'both'
  });

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    type: 'percentage',
    value: 0,
    minOrder: 0,
    active: true,
    usageLimit: 0,
    usageCount: 0,
    expiryDate: ''
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Image Editor State
  const [imageToEdit, setImageToEdit] = useState<{ src: string, callback: (cropped: string) => void, aspect?: number } | null>(null);

  // Fetch orders and banners
  useEffect(() => {
    if (isOpen && isAdmin) {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(docs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

      const qBanners = query(collection(db, 'banners'));
      const unsubBanners = onSnapshot(qBanners, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setBanners(docs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'banners'));

      const qTestimonials = query(collection(db, 'testimonials'), orderBy('date', 'desc'));
      const unsubTestimonials = onSnapshot(qTestimonials, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
        setTestimonials(docs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'testimonials'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const webImg = data.heroImageWeb || data.heroImage || '';
        const mobImg = data.heroImageMobile || data.heroImage || '';
        setHeroImageWeb(webImg);
        setHeroImageMobile(mobImg);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/general'));

      const unsubNotifSettings = onSnapshot(doc(db, 'config', 'notifications'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Migration: if reminders missing, add default ones
          if (!data.reminders) {
            data.reminders = [
              { id: '1', delayMinutes: 15, title: 'سلة المشتريات تنتظرك!', message: 'لديك منتجات رائعة في سلتك، لا تفوت فرصة اقتنائها الآن.' },
              { id: '2', delayMinutes: 300, title: 'ما زلنا ننتظرك!', message: 'منتجاتك المفضلة لا تزال بانتظارك، أكمل طلبك الآن.' },
              { id: '3', delayMinutes: 1440, title: 'الفرصة الأخيرة!', message: 'أكمل طلبك قبل نفاذ الكمية، نحن متحمسون لخدمتك.' }
            ];
          }
          setNotifSettings(data);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'config/notifications'));

      const qAnnouncements = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const unsubAnnouncements = onSnapshot(qAnnouncements, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAnnouncements(docs);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'announcements'));

      const qCoupons = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const unsubCoupons = onSnapshot(qCoupons, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        setCoupons(docs);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'coupons'));

      return () => {
        unsubOrders();
        unsubBanners();
        unsubTestimonials();
        unsubNotifSettings();
        unsubAnnouncements();
        unsubCoupons();
        unsubConfig();
      };
    }
  }, [isOpen, isAdmin]);

  if (!isAdmin && isOpen) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-white z-[500] flex items-center justify-center p-8">
           <div className="text-center space-y-4">
             <h2 className="text-2xl font-bold">غير مصرح لك بالدخول</h2>
             <p className="text-gray-500">هذه المنطقة مخصصة لإدارة المتجر فقط</p>
             <button onClick={onClose} className="px-8 py-3 bg-brand-purple text-white rounded-2xl font-bold">العودة للمتجر</button>
           </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, aspect?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 20 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToEdit({
          src: reader.result as string,
          callback,
          aspect
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlImageEdit = (url: string, callback: (cropped: string) => void, aspect?: number) => {
    if (!url) {
      alert('يرجى إدخال رابط الصورة أولاً');
      return;
    }
    setImageToEdit({
      src: url,
      callback,
      aspect
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingProductId) {
        const productRef = doc(db, 'products', editingProductId);
        await updateDoc(productRef, newProduct);
        setEditingProductId(null);
      } else {
        await addDoc(collection(db, 'products'), newProduct);
      }
      setIsAddingProduct(false);
      setNewProduct({ name: '', category: categories[0]?.name || '', description: '', price: 0, image: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
      alert('خطأ أثناء الحفظ في قاعدة البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setNewProduct(product);
    setEditingProductId(product.id);
    setIsAddingProduct(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const slug = newCategory.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${Date.now()}`;
      
      if (editingCategoryId) {
        await updateDoc(doc(db, 'categories', editingCategoryId), { ...newCategory, slug });
        setEditingCategoryId(null);
      } else {
        await addDoc(collection(db, 'categories'), { ...newCategory, slug });
      }
      
      setIsAddingCategory(false);
      setNewCategory({ name: '', image: '', slug: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
      alert('خطأ أثناء حفظ القسم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setNewCategory(category);
    setEditingCategoryId(category.id);
    setIsAddingCategory(true);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingBannerId) {
        await updateDoc(doc(db, 'banners', editingBannerId), newBanner);
        setEditingBannerId(null);
      } else {
        await addDoc(collection(db, 'banners'), newBanner);
      }
      setIsAddingBanner(false);
      setNewBanner({ image: '', title: '', subtitle: '', active: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'banners');
      alert('خطأ أثناء حفظ الغلاف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBanner = (banner: any) => {
    setNewBanner(banner);
    setEditingBannerId(banner.id);
    setIsAddingBanner(true);
  };

  const handleRemoveBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
      alert('خطأ أثناء الحذف');
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (confirm('حذف القسم سيؤدي لإزالته من القائمة، هل أنت متأكد؟')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingTestimonialId) {
        await updateDoc(doc(db, 'testimonials', editingTestimonialId), newTestimonial);
        setEditingTestimonialId(null);
      } else {
        await addDoc(collection(db, 'testimonials'), newTestimonial);
      }
      setIsAddingTestimonial(false);
      setNewTestimonial({
        customerName: '',
        content: '',
        rating: 5,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'testimonials');
      alert('خطأ أثناء حفظ الرأي');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setNewTestimonial(testimonial);
    setEditingTestimonialId(testimonial.id);
    setIsAddingTestimonial(true);
  };

  const handleRemoveTestimonial = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الرأي؟')) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
      }
    }
  };

  const handleSaveNotifSettings = async () => {
    try {
      setIsSubmitting(true);
      await setDoc(doc(db, 'config', 'notifications'), notifSettings);
      alert('تم حفظ إعدادات الإشعارات بنجاح');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/notifications');
      alert('خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const data = { ...newAnnouncement, createdAt: new Date().toISOString() };
      if (editingAnnouncementId) {
        await updateDoc(doc(db, 'announcements', editingAnnouncementId), data);
        setEditingAnnouncementId(null);
      } else {
        await addDoc(collection(db, 'announcements'), data);
      }
      setIsAddingAnnouncement(false);
      setNewAnnouncement({ 
        title: '', 
        message: '', 
        type: 'popup', 
        size: 'md',
        platform: 'both',
        position: 'bottom',
        active: true,
        maxViews: 0,
        autoHideSeconds: 0,
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'announcements');
      alert('خطأ أثناء حفظ الإعلان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
      }
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const data = { 
        ...newCoupon, 
        code: newCoupon.code?.toUpperCase(),
        createdAt: new Date().toISOString() 
      };
      if (editingCouponId) {
        await updateDoc(doc(db, 'coupons', editingCouponId), data);
        setEditingCouponId(null);
      } else {
        await addDoc(collection(db, 'coupons'), data);
      }
      setIsAddingCoupon(false);
      setNewCoupon({
        code: '',
        type: 'percentage',
        value: 0,
        minOrder: 0,
        active: true,
        usageLimit: 0,
        usageCount: 0,
        expiryDate: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'coupons');
      alert('خطأ أثناء حفظ كود الخصم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setNewCoupon(coupon);
    setEditingCouponId(coupon.id);
    setIsAddingCoupon(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الكود؟')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${id}`);
      }
    }
  };

  // Inline edit for category
  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      alert('خطأ أثناء تحديث حالة الطلب');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
        alert('خطأ أثناء حذف الطلب');
      }
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-600 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'جاري التنفيذ';
      case 'completed': return 'تم التسليم';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-10 bg-white z-[210] rounded-t-[48px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-muted-bg/50">
              <div className="flex flex-col">
                <h2 className="text-2xl font-extrabold tracking-tighter">إدارة المتجر</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">لوحة التحكم في المحتوى</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-white rounded-full p-1 border border-border-subtle">
                  <button 
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    منتجات
                  </button>
                  <button 
                    onClick={() => setActiveTab('categories')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    أقسام
                  </button>
                  <button 
                    onClick={() => setActiveTab('hero')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'hero' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    الغلاف
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    الطلبات
                    {orders.filter(o => o.status === 'pending').length > 0 && (
                      <span className="mr-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white">
                        {orders.filter(o => o.status === 'pending').length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('theme')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'theme' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    الثيمات والألوان
                  </button>
                  <button 
                    onClick={() => setActiveTab('testimonials')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'testimonials' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    آراء العملاء
                  </button>
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'notifications' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      إشعارات
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('coupons')}
                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'coupons' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-charcoal'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      أكواد الخصم
                    </div>
                  </button>
                </div>
                <button onClick={onClose} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full border border-border-subtle transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-body-bg">
              <div className="max-w-6xl mx-auto">
                {activeTab === 'theme' && isAdmin && (
                  <div className="max-w-4xl mx-auto space-y-12 pb-20">
                    {/* Save/Cancel Preview Bar */}
                    <AnimatePresence>
                      {previewConfig && previewConfig.platform === platformTab && (
                        <motion.div 
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 50 }}
                          className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-charcoal text-white p-6 rounded-[30px] border border-white/10 shadow-2xl flex items-center gap-8 z-[100] backdrop-blur-xl"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest">نمط المعاينة نشط ({platformTab})</span>
                            <span className="text-xs font-bold text-gray-300">أنت تشاهد الثيم الآن، هل ترغب في اعتماده؟</span>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                saveConfig(platformTab);
                              }}
                              className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>حفظ واعتماد</span>
                            </button>
                            <button 
                              onClick={() => setPreview(platformTab, null)}
                              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all"
                            >
                              إلغاء والرجوع للسابق
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-black text-brand-purple">تخصيص مظهر المتجر</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">اختر الثيم المناسب وتحكم في الألوان الأساسية</p>
                      </div>

                      <div className="flex bg-muted-bg p-1 rounded-2xl border border-border-subtle">
                        <button 
                          onClick={() => setPlatformTab('web')}
                          className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${platformTab === 'web' ? 'bg-white text-brand-purple shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-charcoal'}`}
                        >
                          <Layout className="w-4 h-4" />
                          <span>نسخة الويب</span>
                        </button>
                        <button 
                          onClick={() => setPlatformTab('mobile')}
                          className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${platformTab === 'mobile' ? 'bg-white text-brand-teal shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-charcoal'}`}
                        >
                          <Phone className="w-4 h-4" />
                          <span>نسخة الجوال</span>
                        </button>
                      </div>
                    </div>

                    {/* Theme Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(['original', 'classic', 'modern', 'creative'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setPreview(platformTab, { activeTheme: t })}
                          className={`p-6 rounded-[40px] border-2 transition-all text-right relative overflow-hidden group ${
                            currentThemeConfig.activeTheme === t 
                              ? 'border-brand-purple bg-white shadow-xl shadow-brand-purple/10' 
                              : 'border-border-subtle bg-white/50 hover:border-brand-purple/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${currentThemeConfig.activeTheme === t ? 'bg-brand-purple text-white' : 'bg-muted-bg text-gray-400'}`}>
                              <Palette className="w-5 h-5" />
                            </div>
                            {currentThemeConfig.activeTheme === t && (
                              <div className="bg-brand-teal text-white p-1 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-black text-sm capitalize">
                            {t === 'original' ? 'التصميم الأصلي' : t === 'classic' ? 'الملكي' : t === 'modern' ? 'العصري' : 'الإبداعي'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed">
                            {t === 'original' ? 'التصميم المعتمد والأساسي للمتجر.' : t === 'classic' ? 'لمسات فخمة وخطوط راقية.' : t === 'modern' ? 'تصميم عصري بخطوط حادة وواضحة.' : 'تصميم ملهم بأشكال دائرية.'}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Color Management */}
                    <div className="bg-white p-10 rounded-[50px] border border-border-subtle shadow-sm space-y-8">
                      <div className="flex items-center gap-3 border-b border-border-subtle pb-6">
                        <Palette className="w-6 h-6 text-brand-purple" />
                        <h4 className="font-black text-xl">لوحة ألوان {platformTab === 'web' ? 'الويب' : 'الجوال'}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">اللون الأساسي</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={currentThemeConfig.primaryColor}
                              onChange={(e) => setPreview(platformTab, { primaryColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={currentThemeConfig.primaryColor}
                              onChange={(e) => setPreview(platformTab, { primaryColor: e.target.value })}
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-[10px] font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">اللون الثانوي</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={currentThemeConfig.secondaryColor}
                              onChange={(e) => setPreview(platformTab, { secondaryColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={currentThemeConfig.secondaryColor}
                              onChange={(e) => setPreview(platformTab, { secondaryColor: e.target.value })}
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-[10px] font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">لون التمييز</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={currentThemeConfig.accentColor}
                              onChange={(e) => setPreview(platformTab, { accentColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={currentThemeConfig.accentColor}
                              onChange={(e) => setPreview(platformTab, { accentColor: e.target.value })}
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-[10px] font-mono outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border-subtle flex justify-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">التغييرات تظهر لحظياً لجميع الزوار بمجرد الحفظ</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">إدارة المنتجات</h3>
                      <button 
                        onClick={() => {
                          setEditingProductId(null);
                          setNewProduct({ name: '', category: categories[0]?.name || '', description: '', price: 0, image: '' });
                          setIsAddingProduct(true);
                        }}
                        className="flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج جديد</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {isAddingProduct && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-6 rounded-3xl border-2 border-dashed border-brand-teal/30 shadow-xl z-20"
                          >
                            <form onSubmit={handleAddProduct} className="space-y-4">
                              <h4 className="font-bold text-sm text-brand-teal mb-2">
                                {editingProductId ? 'تعديل المنتج' : 'إضافة منتج'}
                              </h4>
                              <input 
                                required
                                type="text" 
                                placeholder="اسم المنتج" 
                                className="w-full p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-teal"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                              />
                              <select 
                                className="w-full p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-teal"
                                value={newProduct.category}
                                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                              >
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <input 
                                required
                                type="number" 
                                placeholder="السعر" 
                                className="w-full p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-teal"
                                value={newProduct.price || ''}
                                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                              />
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 px-1">صورة المنتج</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="رابط الصورة" 
                                    className="flex-1 p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-teal"
                                    value={newProduct.image}
                                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                                  />
                                  <label className="p-3 bg-white border border-border-subtle rounded-xl cursor-pointer hover:bg-muted-bg transition-colors">
                                    <ImageIcon className="w-4 h-4 text-brand-teal" />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={(e) => handleFileUpload(e, (img) => setNewProduct({...newProduct, image: img}), 1)}
                                    />
                                  </label>
                                </div>
                                {newProduct.image && (
                                  <div className="flex items-center gap-2">
                                    <img src={newProduct.image} className="w-12 h-12 rounded-lg object-cover border border-border-subtle" />
                                    <button 
                                      type="button"
                                      onClick={() => handleUrlImageEdit(newProduct.image!, (img) => setNewProduct({...newProduct, image: img}), 1)}
                                      className="text-[10px] font-bold text-brand-teal hover:underline"
                                    >
                                      تعديل الموضع
                                    </button>
                                  </div>
                                )}
                              </div>
                              <textarea 
                                required
                                placeholder="الوصف" 
                                className="w-full p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-teal h-20 resize-none"
                                value={newProduct.description}
                                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                              />
                               <div className="flex gap-2">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-teal text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                  {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : null}
                                  {editingProductId ? 'تحديث' : 'حفظ'}
                                </button>
                                <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs">إلغاء</button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {products.map((p) => (
                        <div key={p.id} className="bg-white p-4 rounded-3xl border border-border-subtle flex gap-4 items-center group">
                          <img src={p.image} className="w-16 h-16 rounded-xl object-cover border border-border-subtle" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[13px] leading-tight truncate">{p.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.category}</p>
                            <p className="text-[11px] text-brand-teal font-extrabold mt-1">{p.price} ر.س</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => handleEditProduct(p)}
                              className="p-2 text-gray-300 hover:text-brand-purple transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleRemoveProduct(p.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'hero' && (
                  <div className="space-y-8 pb-20">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold">إدارة واجهة المتجر</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">التحكم في الغلاف الرئيسي والأغلفة المتحركة</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingBannerId(null);
                          setNewBanner({ image: '', title: '', subtitle: '', active: true, platform: heroPlatformTab });
                          setIsAddingBanner(true);
                        }}
                        className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة غلاف بنر جديد</span>
                      </button>
                    </div>

                    {/* Platform Selector for Hero */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-muted-bg p-1.5 rounded-2xl flex gap-1">
                        <button 
                          onClick={() => setHeroPlatformTab('web')}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${heroPlatformTab === 'web' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <BarChart2 className="w-4 h-4" />
                          <span>إدارة نسخة الويب</span>
                        </button>
                        <button 
                          onClick={() => setHeroPlatformTab('mobile')}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${heroPlatformTab === 'mobile' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <Phone className="w-4 h-4" />
                          <span>إدارة نسخة الجوال</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Hero Section */}
                    <div className="bg-white p-8 rounded-[40px] border border-border-subtle shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base">الغلاف الأساسي ({heroPlatformTab === 'web' ? 'الويب' : 'الجوال'})</h4>
                            <p className="text-[10px] text-gray-400 font-bold">يظهر هذا الغلاف في حال عدم وجود أغلفة متحركة (Banners) لهذه المنصة</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className={`relative ${heroPlatformTab === 'mobile' ? 'aspect-[2/3] max-w-[300px] mx-auto' : 'aspect-video'} rounded-3xl overflow-hidden border border-border-subtle group`}>
                          <img src={heroPlatformTab === 'web' ? heroImageWeb : heroImageMobile} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => handleUrlImageEdit(heroPlatformTab === 'web' ? heroImageWeb : heroImageMobile, async (img) => {
                              try {
                                const field = heroPlatformTab === 'web' ? 'heroImageWeb' : 'heroImageMobile';
                                await setDoc(doc(db, 'config', 'general'), { [field]: img }, { merge: true });
                              } catch (err) {
                                console.error(err);
                                alert('خطأ في تحديث الغلاف');
                              }
                            }, heroPlatformTab === 'web' ? 16/9 : 2/3)}
                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold"
                          >
                            <Scissors className="w-4 h-4" />
                            تعديل الموضع
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">تغيير صورة الغلاف ({heroPlatformTab === 'web' ? 'ويب' : 'جوال'})</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="رابط الصورة" 
                                className="flex-1 p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                value={heroPlatformTab === 'web' ? heroImageWeb : heroImageMobile}
                                onChange={async (e) => {
                                  try {
                                    const field = heroPlatformTab === 'web' ? 'heroImageWeb' : 'heroImageMobile';
                                    await setDoc(doc(db, 'config', 'general'), { [field]: e.target.value }, { merge: true });
                                  } catch (err) {
                                      console.error(err);
                                  }
                                }}
                              />
                              <label className="p-4 bg-white border border-border-subtle rounded-2xl cursor-pointer hover:bg-muted-bg transition-colors">
                                <ImageIcon className="w-5 h-5 text-brand-purple" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => handleFileUpload(e, async (img) => {
                                    try {
                                      const field = heroPlatformTab === 'web' ? 'heroImageWeb' : 'heroImageMobile';
                                      await setDoc(doc(db, 'config', 'general'), { [field]: img }, { merge: true });
                                    } catch (err) {
                                        console.error(err);
                                    }
                                  }, heroPlatformTab === 'web' ? 16/9 : 2/3)}
                                />
                              </label>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                            نصيحة: استخدم صوراً بمقاسات مناسبة ({heroPlatformTab === 'web' ? '16:9' : 'طولية 2:3'}) للحصول على أفضل النتائج.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-4">
                      <div className="flex-1 h-px bg-border-subtle" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] whitespace-nowrap">الأغلفة المتحركة (Banners)</span>
                      <div className="flex-1 h-px bg-border-subtle" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AnimatePresence>
                        {isAddingBanner && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-8 rounded-[40px] border-2 border-dashed border-brand-purple/30 shadow-xl"
                          >
                            <form onSubmit={handleAddBanner} className="space-y-6">
                              <h4 className="font-bold text-sm text-brand-purple">
                                {editingBannerId ? 'تعديل الغلاف' : 'إضافة غلاف جديد'}
                              </h4>
                              
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">صورة الغلاف</label>
                                <div className="flex gap-2">
                                  <input 
                                    required
                                    type="text" 
                                    placeholder="رابط الصورة المباشر" 
                                    className="flex-1 p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                    value={newBanner.image}
                                    onChange={e => setNewBanner({...newBanner, image: e.target.value})}
                                  />
                                  <label className="p-4 bg-white border border-border-subtle rounded-2xl cursor-pointer hover:bg-muted-bg transition-colors">
                                    <ImageIcon className="w-5 h-5 text-brand-purple" />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={(e) => handleFileUpload(e, (img) => setNewBanner({...newBanner, image: img}), 1)}
                                    />
                                  </label>
                                </div>
                                {newBanner.image && (
                                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border-subtle group">
                                    <img src={newBanner.image} className="w-full h-full object-cover" />
                                    <button 
                                      type="button"
                                      onClick={() => handleUrlImageEdit(newBanner.image, (img) => setNewBanner({...newBanner, image: img}), 1)}
                                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold"
                                    >
                                      <Scissors className="w-4 h-4" />
                                      تعديل موضع الغلاف
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">العنوان الرئيسي</label>
                                  <input 
                                    type="text" 
                                    placeholder="مثال: تشكيلة الصيف" 
                                    className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                    value={newBanner.title}
                                    onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">العنوان الفرعي</label>
                                  <input 
                                    type="text" 
                                    placeholder="مثال: خصم 20%" 
                                    className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                    value={newBanner.subtitle}
                                    onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-muted-bg rounded-2xl">
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="checkbox"
                                    id="active-banner"
                                    checked={newBanner.active}
                                    onChange={e => setNewBanner({...newBanner, active: e.target.checked})}
                                    className="w-4 h-4 accent-brand-purple"
                                  />
                                  <label htmlFor="active-banner" className="text-xs font-bold text-gray-600 cursor-pointer">تفعيل الغلاف ليظهر للمستخدمين</label>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-brand-purple/20">
                                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                                  {editingBannerId ? 'حفظ التعديلات' : 'نشر الغلاف'}
                                </button>
                                <button type="button" onClick={() => setIsAddingBanner(false)} className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs">
                                  إلغاء
                                </button>
                              </div>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {banners.filter((b: any) => b.platform === heroPlatformTab || b.platform === 'both' || !b.platform).map((b) => (
                          <div key={b.id} className="bg-white rounded-[40px] border border-border-subtle overflow-hidden flex flex-col group relative">
                            <div className={`${b.platform === 'mobile' ? 'aspect-[2/3]' : 'aspect-video'} relative overflow-hidden`}>
                              <img src={b.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      handleUrlImageEdit(b.image, async (cropped) => {
                                        try {
                                          await updateDoc(doc(db, 'banners', b.id), { image: cropped });
                                        } catch (err) {
                                          console.error(err);
                                          alert('خطأ أثناء تحديث صورة الغلاف');
                                        }
                                      }, b.platform === 'mobile' ? 2/3 : 16/9);
                                    }}
                                    className="p-4 bg-white/20 hover:bg-white/40 rounded-2xl backdrop-blur-md border border-white/20 transition-all flex flex-col items-center gap-1 min-w-[80px]"
                                  >
                                    <Scissors className="w-5 h-5" />
                                    <span className="text-[10px] font-bold">الموضع</span>
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveBanner(b.id)}
                                    className="p-4 bg-red-500/20 hover:bg-red-500/40 rounded-2xl backdrop-blur-md border border-red-500/30 transition-all flex flex-col items-center gap-1 min-w-[80px] text-red-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="text-[10px] font-bold">حذف</span>
                                  </button>
                                  <button 
                                    onClick={() => handleEditBanner(b)}
                                    className="p-4 bg-white/20 hover:bg-white/40 rounded-2xl backdrop-blur-md border border-white/20 transition-all flex flex-col items-center gap-1 min-w-[80px]"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                    <span className="text-[10px] font-bold">تعديل</span>
                                  </button>
                                </div>
                              </div>
                              <div className="absolute top-4 right-4 flex gap-2">
                                {!b.active && (
                                  <span className="px-3 py-1.5 bg-black/40 text-white rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">معطل</span>
                                )}
                                <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 ${
                                  b.platform === 'mobile' ? 'bg-brand-teal/10 text-brand-teal' : 
                                  b.platform === 'web' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {b.platform === 'mobile' ? 'جوال' : b.platform === 'web' ? 'ويب' : 'الكل'}
                                </span>
                              </div>
                            </div>
                            <div className="p-6 flex justify-between items-center bg-white border-t border-border-subtle">
                              <div className="min-w-0">
                                 <h4 className="font-bold text-sm truncate">{b.title || 'بدون عنوان'}</h4>
                                 <p className="text-[10px] text-gray-400 font-bold truncate">{b.subtitle || 'لا يوجد وصف فرعي'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {activeTab === 'categories' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">إدارة الأقسام</h3>
                      <button 
                        onClick={() => setIsAddingCategory(true)}
                        className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة قسم جديد</span>
                      </button>
                    </div>

                    {/* Platform Selector for Categories */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-muted-bg p-1.5 rounded-2xl flex gap-1">
                        <button 
                          onClick={() => setCatPlatformTab('web')}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${catPlatformTab === 'web' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <BarChart2 className="w-4 h-4" />
                          <span>أقسام الويب</span>
                        </button>
                        <button 
                          onClick={() => setCatPlatformTab('mobile')}
                          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${catPlatformTab === 'mobile' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <Phone className="w-4 h-4" />
                          <span>أقسام الجوال</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                      <AnimatePresence>
                        {isAddingCategory && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-8 rounded-[40px] border-2 border-dashed border-brand-purple/30 shadow-xl z-10 col-span-full mb-4"
                          >
                            <form onSubmit={handleAddCategory} className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm text-brand-purple">
                                  {editingCategoryId ? 'تعديل القسم' : 'إضافة قسم جديد'}
                                </h4>
                                <div className="flex bg-muted-bg p-1 rounded-xl gap-1">
                                  {(['web', 'mobile', 'both'] as const).map(p => (
                                    <button 
                                      key={p}
                                      type="button"
                                      onClick={() => setNewCategory({...newCategory, platform: p})}
                                      className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${newCategory.platform === p ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-400'}`}
                                    >
                                      {p === 'web' ? 'ويب' : p === 'mobile' ? 'جوال' : 'الكل'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <input 
                                    required
                                    type="text" 
                                    placeholder="اسم القسم" 
                                    className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                                  />
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 px-1">صورة القسم</label>
                                    <div className="flex gap-2">
                                      <input 
                                        required
                                        type="text" 
                                        placeholder="رابط صورة القسم" 
                                        className="flex-1 p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                        value={newCategory.image}
                                        onChange={e => setNewCategory({...newCategory, image: e.target.value})}
                                      />
                                      <label className="p-4 bg-white border border-border-subtle rounded-2xl cursor-pointer hover:bg-muted-bg transition-colors">
                                        <ImageIcon className="w-5 h-5 text-brand-purple" />
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*" 
                                          onChange={(e) => handleFileUpload(e, (img) => setNewCategory({...newCategory, image: img}), 1)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {newCategory.image && (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-border-subtle group">
                                      <img src={newCategory.image} className="w-full h-full object-cover" />
                                      <button 
                                        type="button"
                                        onClick={() => handleUrlImageEdit(newCategory.image!, (img) => setNewCategory({...newCategory, image: img}), 1)}
                                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold"
                                      >
                                        <Scissors className="w-4 h-4" />
                                        تعديل موضع الصورة
                                      </button>
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20">
                                      {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                      {editingCategoryId ? 'تحديث القسم' : 'حفظ القسم الجديد'}
                                    </button>
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-xs">إلغاء</button>
                                  </div>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {categories.filter((c: any) => c.platform === catPlatformTab || c.platform === 'both' || !c.platform).map((c) => (
                        <div key={c.id} className="bg-white p-6 rounded-[40px] border border-border-subtle flex gap-6 items-center group relative overflow-hidden">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 border border-border-subtle">
                            <img src={c.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-base truncate">{c.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                (c as any).platform === 'mobile' ? 'bg-brand-teal/10 text-brand-teal' : 
                                (c as any).platform === 'web' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {(c as any).platform || 'الكل'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">slug: {c.slug}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleEditCategory(c)}
                              className="p-3 bg-muted-bg text-gray-300 hover:text-brand-purple rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemoveCategory(c.id)}
                              className="p-3 bg-red-50 text-red-200 hover:text-red-500 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold">إدارة الطلبات والنظام المحاسبي</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">متابعة الأداء المالي والمبيعات</p>
                      </div>
                    </div>

                    {/* Accounting Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-6 rounded-[32px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">إجمالي المبيعات</span>
                        </div>
                        <p className="text-2xl font-extrabold text-charcoal">
                          {orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">ر.س</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">من {orders.length} طلب</p>
                      </div>

                      <div className="bg-white p-6 rounded-[32px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">المبالغ المحصلة</span>
                        </div>
                        <p className="text-2xl font-extrabold text-charcoal">
                          {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">ر.س</span>
                        </p>
                        <p className="text-[10px] text-brand-teal mt-2 font-bold uppercase">للطلبات المكتملة فقط</p>
                      </div>

                      <div className="bg-white p-6 rounded-[32px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600">
                            <Clock className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">مبالغ قيد الانتظار</span>
                        </div>
                        <p className="text-2xl font-extrabold text-charcoal">
                          {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">ر.س</span>
                        </p>
                        <p className="text-[10px] text-yellow-600 mt-2 font-bold uppercase">الطلبات الجارية</p>
                      </div>

                      <div className="bg-white p-6 rounded-[32px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple">
                            <BarChart2 className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">متوسط الطلب</span>
                        </div>
                        <p className="text-2xl font-extrabold text-charcoal">
                          {orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toLocaleString() : 0} <span className="text-xs font-medium text-gray-400">ر.س</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">قيمة السلة المتوسطة</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className="bg-white p-20 rounded-[40px] text-center border border-border-subtle">
                          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold">لا يوجد طلبات حالياً</p>
                        </div>
                      ) : (
                        orders.map((order) => (
                          <motion.div 
                            key={order.id}
                            layout
                            className={`bg-white rounded-[32px] border transition-all overflow-hidden ${expandedOrderId === order.id ? 'border-brand-purple shadow-xl' : 'border-border-subtle hover:border-brand-purple/30'}`}
                          >
                            {/* Summary View */}
                            <div 
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="p-6 cursor-pointer flex flex-wrap items-center gap-6"
                            >
                              <div className="w-12 h-12 bg-muted-bg rounded-2xl flex items-center justify-center text-brand-purple">
                                <Package className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm">{order.customerName}</h4>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                    <span>{order.items.length} منتجات</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">المبلغ الإجمالي</span>
                                <span className="text-lg font-extrabold text-charcoal">{order.total} <span className="text-[10px] font-medium text-gray-300">ر.س</span></span>
                              </div>
                              <div className="p-2 bg-muted-bg rounded-lg text-gray-300">
                                {expandedOrderId === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(order.id);
                                }}
                                className="p-2 bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors"
                                title="حذف الطلب"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Detailed View */}
                            <AnimatePresence>
                              {expandedOrderId === order.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-border-subtle bg-muted-bg/30"
                                >
                                  <div className="p-8 grid md:grid-cols-2 gap-8">
                                    {/* Left: Customer & Management */}
                                    <div className="space-y-6">
                                      <div className="space-y-3">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                          <User className="w-3 h-3" />
                                          بيانات العميل
                                        </h5>
                                        <div className="bg-white p-5 rounded-2xl border border-border-subtle space-y-3">
                                          <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">الاسم:</span>
                                            <span className="font-bold">{order.customerName}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-xs font-mono">
                                            <span className="text-gray-400 font-sans">الجوال:</span>
                                            <a href={`tel:${order.phone}`} className="font-bold flex items-center gap-1 text-brand-purple hover:underline">
                                              {order.phone}
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          </div>
                                          <div className="flex flex-col gap-1 text-xs">
                                            <span className="text-gray-400">العنوان:</span>
                                            <span className="font-bold leading-relaxed">{order.address}</span>
                                          </div>
                                          {order.paymentMethod && (
                                            <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-gray-100">
                                              <span className="text-gray-400">طريقة الدفع:</span>
                                              <span className="font-bold text-brand-teal">{order.paymentMethod}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                          <AlertCircle className="w-3 h-3" />
                                          إدارة حالة الطلب
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2">
                                          {(['pending', 'processing', 'completed', 'cancelled'] as Order['status'][]).map((s) => (
                                            <button 
                                              key={s}
                                              onClick={() => handleUpdateOrderStatus(order.id, s)}
                                              className={`py-3 px-4 rounded-xl text-[10px] font-bold transition-all border ${order.status === s ? getStatusColor(s) + ' ring-2 ring-offset-2 ring-offset-muted-bg' : 'bg-white border-border-subtle text-gray-400 hover:border-gray-300'}`}
                                            >
                                              {getStatusLabel(s)}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="bg-brand-purple/5 p-4 rounded-2xl border border-brand-purple/10 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-purple text-white rounded-xl flex items-center justify-center">
                                          <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-bold text-gray-500 mb-0.5">تواصل سريع</p>
                                          <a 
                                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs font-bold text-brand-purple hover:underline"
                                          >
                                            مراسلة العميل عبر واتساب
                                          </a>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: Items */}
                                    <div className="space-y-3">
                                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Package className="w-3 h-3" />
                                        محتويات الطلب
                                      </h5>
                                      <div className="bg-white rounded-2xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                                        {order.items.map((item, i) => (
                                          <div key={i} className="p-4 flex gap-4 items-center">
                                            <img src={item.image} className="w-12 h-12 rounded-lg object-cover bg-gold-light" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-bold truncate">{item.name}</p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase">{item.category}</p>
                                            </div>
                                            <div className="text-left">
                                              <p className="text-xs font-extrabold">{item.price} ر.س</p>
                                              <p className="text-[10px] text-gray-400 font-bold">الكمية: {item.quantity}</p>
                                            </div>
                                          </div>
                                        ))}
                                        <div className="p-4 bg-muted-bg/50 flex justify-between items-center text-sm">
                                          <span className="font-bold">المجموع:</span>
                                          <span className="font-extrabold text-brand-purple">{order.total} ر.س</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'testimonials' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold">إدارة آراء العملاء</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">عرض وتنسيق آراء العملاء في الموقع</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingTestimonialId(null);
                          setNewTestimonial({
                            customerName: '',
                            content: '',
                            rating: 5,
                            date: new Date().toISOString().split('T')[0]
                          });
                          setIsAddingTestimonial(true);
                        }}
                        className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة رأي جديد</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                      <AnimatePresence>
                        {isAddingTestimonial && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-8 rounded-[40px] border-2 border-dashed border-brand-purple/30 shadow-xl z-20 col-span-full"
                          >
                            <form onSubmit={handleAddTestimonial} className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h4 className="font-bold text-sm text-brand-purple">
                                  {editingTestimonialId ? 'تعديل الرأي' : 'إضافة رأي جديد'}
                                </h4>
                                <input 
                                  required
                                  type="text" 
                                  placeholder="اسم العميل" 
                                  className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                  value={newTestimonial.customerName}
                                  onChange={e => setNewTestimonial({...newTestimonial, customerName: e.target.value})}
                                />
                                <textarea 
                                  required
                                  placeholder="محتوى الرأي..." 
                                  className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple h-32 resize-none"
                                  value={newTestimonial.content}
                                  onChange={e => setNewTestimonial({...newTestimonial, content: e.target.value})}
                                />
                              </div>
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">التقييم</label>
                                  <div className="flex gap-2 p-2 bg-muted-bg rounded-2xl justify-center">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <button 
                                        key={s}
                                        type="button"
                                        onClick={() => setNewTestimonial({...newTestimonial, rating: s})}
                                        className={`p-2 transition-all ${newTestimonial.rating! >= s ? 'text-gold' : 'text-gray-300'}`}
                                      >
                                        <Star className={`w-8 h-8 ${newTestimonial.rating! >= s ? 'fill-gold' : ''}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">تاريخ الرأي</label>
                                  <input 
                                    required
                                    type="date" 
                                    className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                    value={newTestimonial.date}
                                    onChange={e => setNewTestimonial({...newTestimonial, date: e.target.value})}
                                  />
                                </div>
                                <div className="flex gap-2 pt-4">
                                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {editingTestimonialId ? 'تحديث' : 'حفظ الرأي'}
                                  </button>
                                  <button type="button" onClick={() => setIsAddingTestimonial(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-sm">إلغاء</button>
                                </div>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {testimonials.map((t) => (
                        <div key={t.id} className="bg-white p-6 rounded-[32px] border border-border-subtle hover:shadow-lg transition-all group flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-gold text-gold' : 'text-gray-200'}`} />
                                ))}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditTestimonial(t)}
                                  className="p-2 bg-muted-bg text-gray-400 hover:text-brand-purple rounded-xl transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRemoveTestimonial(t.id)}
                                  className="p-2 bg-red-50 text-red-200 hover:text-red-500 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-charcoal/80 italic mb-6 leading-relaxed">"{t.content}"</p>
                          </div>
                          <div className="flex items-center gap-3 pt-4 border-t border-dashed border-border-subtle">
                            <div className="w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-[10px]">
                              {t.customerName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs">{t.customerName}</h4>
                              <span className="text-[9px] text-gray-400 font-bold">{t.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'notifications' && (
                  <div className="max-w-4xl mx-auto space-y-12 pb-20 text-right">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-brand-purple">إدارة الإشعارات والرسائل</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">تحكم في تنبيهات السلة المهجورة والرسائل المنبثقة</p>
                    </div>

                    {/* Cart Reminder Settings */}
                    <div className="bg-white p-10 rounded-[50px] border border-border-subtle shadow-sm space-y-8">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-6">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="w-6 h-6 text-brand-purple" />
                          <h4 className="font-black text-xl">تنبيه السلة المهجورة</h4>
                        </div>
                        <button
                          onClick={() => setNotifSettings({ ...notifSettings, cartReminderEnabled: !notifSettings.cartReminderEnabled })}
                          className={`w-14 h-8 rounded-full transition-all relative ${notifSettings.cartReminderEnabled ? 'bg-brand-teal' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${notifSettings.cartReminderEnabled ? 'left-1' : 'left-7'}`} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">قائمة التنبيهات (المراحل الثلاث)</label>
                        </div>
                        
                        <div className="space-y-4">
                          {notifSettings.reminders?.map((reminder: any, index: number) => (
                            <div key={reminder.id} className="p-6 bg-muted-bg/30 rounded-[32px] border border-border-subtle space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest bg-brand-purple/10 px-3 py-1 rounded-full">التنبيه {index + 1}</span>
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-gray-400">يرسل بعد:</label>
                                  <input 
                                    type="number"
                                    value={reminder.delayMinutes}
                                    onChange={(e) => {
                                      const newRems = [...notifSettings.reminders];
                                      newRems[index] = { ...newRems[index], delayMinutes: parseInt(e.target.value) || 0 };
                                      setNotifSettings({ ...notifSettings, reminders: newRems });
                                    }}
                                    className="w-20 p-2 bg-white rounded-xl text-[10px] font-bold outline-none border border-border-subtle text-center"
                                  />
                                  <span className="text-[10px] font-bold text-gray-400">دقيقة</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <input 
                                  placeholder="عنوان التذكير"
                                  type="text"
                                  value={reminder.title}
                                  onChange={(e) => {
                                    const newRems = [...notifSettings.reminders];
                                    newRems[index] = { ...newRems[index], title: e.target.value };
                                    setNotifSettings({ ...notifSettings, reminders: newRems });
                                  }}
                                  className="w-full p-3 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple"
                                  dir="rtl"
                                />
                                <textarea 
                                  placeholder="نص الرسالة"
                                  value={reminder.message}
                                  onChange={(e) => {
                                    const newRems = [...notifSettings.reminders];
                                    newRems[index] = { ...newRems[index], message: e.target.value };
                                    setNotifSettings({ ...notifSettings, reminders: newRems });
                                  }}
                                  className="w-full p-3 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple h-20 resize-none"
                                  dir="rtl"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleSaveNotifSettings}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-brand-purple text-white rounded-2xl font-black text-xs hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20"
                      >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        حفظ إعدادات التذكير
                      </button>
                    </div>

                    {/* Announcements Section */}
                    <div className="bg-white p-10 rounded-[50px] border border-border-subtle shadow-sm space-y-8">
                      <div className="flex flex-col gap-6 border-b border-border-subtle pb-6 text-right">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-brand-teal" />
                            <h4 className="font-black text-xl">الإعلانات والرسائل المنبثقة</h4>
                          </div>
                          <button
                            onClick={() => {
                              setEditingAnnouncementId(null);
                              setNewAnnouncement({ 
                                title: '', 
                                message: '', 
                                type: 'popup', 
                                size: 'md',
                                platform: 'both',
                                position: 'bottom',
                                active: true 
                              });
                              setIsAddingAnnouncement(true);
                            }}
                            className="flex items-center gap-2 bg-brand-teal text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                          >
                            <Plus className="w-4 h-4" />
                            <span>إعلان جديد</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-muted-bg/50 p-1.5 rounded-2xl w-fit self-end">
                          <button 
                            onClick={() => setAnnouncementFilter('all')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${announcementFilter === 'all' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >الكل</button>
                          <button 
                            onClick={() => setAnnouncementFilter('web')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${announcementFilter === 'web' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >متصفح (Web)</button>
                          <button 
                            onClick={() => setAnnouncementFilter('mobile')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${announcementFilter === 'mobile' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                          >جوال (Mobile)</button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isAddingAnnouncement && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-muted-bg/50 p-8 rounded-[40px] border-2 border-dashed border-brand-teal/30"
                          >
                            <form onSubmit={handleAddAnnouncement} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">عنوان الإعلان</label>
                                  <input 
                                    required
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal"
                                    dir="rtl"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">نوع الإنشعار</label>
                                  <select 
                                    value={newAnnouncement.type}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal appearance-none"
                                  >
                                    <option value="popup">منبثق (Popup)</option>
                                    <option value="banner">شريط (Banner)</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">حجم المنبثق</label>
                                  <select 
                                    value={newAnnouncement.size || 'md'}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, size: e.target.value as any })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal appearance-none"
                                  >
                                    <option value="sm">صغير (Small)</option>
                                    <option value="md">متوسط (Medium)</option>
                                    <option value="lg">كبير (Large)</option>
                                    <option value="xl">كامل العرض (Full Width)</option>
                                  </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">محتوى الرسالة</label>
                                  <textarea 
                                    required
                                    value={newAnnouncement.message}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal h-24 resize-none"
                                    dir="rtl"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">موقع الظهور</label>
                                  <select 
                                    value={newAnnouncement.position || 'bottom'}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, position: e.target.value as any })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal appearance-none"
                                  >
                                    <option value="top">أعلى الصفحة</option>
                                    <option value="center">وسط الصفحة</option>
                                    <option value="bottom">أسفل الصفحة</option>
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">منصة الظهور</label>
                                  <select 
                                    value={newAnnouncement.platform || 'both'}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, platform: e.target.value as any })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal appearance-none"
                                  >
                                    <option value="both">الكل</option>
                                    <option value="web">المتصفح (Web)</option>
                                    <option value="mobile">الجوال (Mobile)</option>
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">أقصى عدد مرات ظهور (0 = لامتناهي)</label>
                                  <input 
                                    type="number"
                                    value={newAnnouncement.maxViews || 0}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, maxViews: parseInt(e.target.value) })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">إخفاء تلقائي بعد (بالثواني، 0 = تعطيل)</label>
                                  <input 
                                    type="number"
                                    value={newAnnouncement.autoHideSeconds || 0}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, autoHideSeconds: parseInt(e.target.value) })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">تاريخ البدء</label>
                                  <input 
                                    type="datetime-local"
                                    value={newAnnouncement.startDate || ''}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, startDate: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">تاريخ الانتهاء</label>
                                  <input 
                                    type="datetime-local"
                                    value={newAnnouncement.endDate || ''}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, endDate: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-teal"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-teal text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-brand-teal/20">
                                  {editingAnnouncementId ? 'تحديث الإعلان' : 'نشر الإعلان'}
                                </button>
                                <button type="button" onClick={() => setIsAddingAnnouncement(false)} className="flex-1 bg-white text-gray-400 py-4 rounded-2xl font-black text-xs border border-border-subtle hover:bg-gray-50 transition-all">
                                  إلغاء
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-4">
                        {announcements
                          .filter(ann => {
                            if (announcementFilter === 'all') return true;
                            return ann.platform === announcementFilter || ann.platform === 'both';
                          })
                          .map((ann) => (
                          <div key={ann.id} className="bg-muted-bg/30 p-6 rounded-3xl border border-border-subtle flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl ${ann.active ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Bell className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col">
                                <h5 className="font-black text-sm">{ann.title}</h5>
                                <p className="text-[10px] text-gray-400 font-bold">{ann.active ? 'نشط الآن' : 'غير نشط'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingAnnouncementId(ann.id);
                                  setNewAnnouncement({
                                    ...ann,
                                    position: ann.position || 'bottom',
                                    platform: ann.platform || 'both',
                                    size: ann.size || 'md',
                                    maxViews: ann.maxViews || 0,
                                    autoHideSeconds: ann.autoHideSeconds || 0,
                                    startDate: ann.startDate || '',
                                    endDate: ann.endDate || ''
                                  });
                                  setIsAddingAnnouncement(true);
                                }}
                                className="p-2 text-gray-400 hover:text-brand-purple transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  await updateDoc(doc(db, 'announcements', ann.id), { active: !ann.active });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${ann.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20'}`}
                              >
                                {ann.active ? 'إيقاف' : 'تفعيل'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'coupons' && (
                  <div className="max-w-4xl mx-auto space-y-12 pb-20 text-right">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-brand-purple">إدارة أكواد الخصم</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">أنشئ أكواد خصم لعملائك لزيادة المبيعات</p>
                    </div>

                    <div className="bg-white p-10 rounded-[50px] border border-border-subtle shadow-sm space-y-8">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-6">
                        <div className="flex items-center gap-3">
                          <Ticket className="w-6 h-6 text-brand-purple" />
                          <h4 className="font-black text-xl">قائمة الأكواد</h4>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCouponId(null);
                            setNewCoupon({
                              code: '',
                              type: 'percentage',
                              value: 0,
                              minOrder: 0,
                              active: true,
                              usageLimit: 0,
                              usageCount: 0,
                              expiryDate: ''
                            });
                            setIsAddingCoupon(true);
                          }}
                          className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-4 h-4" />
                          <span>كود جديد</span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {isAddingCoupon && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-muted-bg/50 p-8 rounded-[40px] border-2 border-dashed border-brand-purple/30"
                          >
                            <form onSubmit={handleAddCoupon} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">كود الخصم (مثال: SAVE20)</label>
                                  <input 
                                    required
                                    type="text"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple text-center uppercase"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">نوع الخصم</label>
                                  <select 
                                    value={newCoupon.type}
                                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple appearance-none"
                                  >
                                    <option value="percentage">نسبة مئوية (%)</option>
                                    <option value="fixed">مبلغ ثابت</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">قيمة الخصم</label>
                                  <input 
                                    required
                                    type="number"
                                    value={newCoupon.value}
                                    onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">الحد الأدنى للطلب</label>
                                  <input 
                                    type="number"
                                    value={newCoupon.minOrder}
                                    onChange={e => setNewCoupon({ ...newCoupon, minOrder: parseFloat(e.target.value) })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">حد الاستخدام (0 = لا محدود)</label>
                                  <input 
                                    type="number"
                                    value={newCoupon.usageLimit}
                                    onChange={e => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 px-1 uppercase tracking-widest">تاريخ الانتهاء (اختياري)</label>
                                  <input 
                                    type="date"
                                    value={newCoupon.expiryDate}
                                    onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                    className="w-full p-4 bg-white rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-brand-purple"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-brand-purple/20">
                                  {editingCouponId ? 'تحديث الكود' : 'إنشاء الكود'}
                                </button>
                                <button type="button" onClick={() => setIsAddingCoupon(false)} className="flex-1 bg-white text-gray-400 py-4 rounded-2xl font-black text-xs border border-border-subtle hover:bg-gray-50 transition-all">
                                  إلغاء
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coupons.map((coupon) => (
                          <div key={coupon.id} className="bg-muted-bg/30 p-6 rounded-[32px] border border-border-subtle space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
                                  <Ticket className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-black text-lg tracking-tighter">{coupon.code}</h5>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    {coupon.type === 'percentage' ? `${coupon.value}% خصم` : `${coupon.value} ر.س خصم`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEditCoupon(coupon)} className="p-2 text-gray-400 hover:text-brand-purple transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                              <div className="bg-white/50 p-2 rounded-xl border border-border-subtle flex flex-col">
                                <span className="text-gray-400 uppercase tracking-widest">الاستخدامات</span>
                                <span>{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
                              </div>
                              <div className="bg-white/50 p-2 rounded-xl border border-border-subtle flex flex-col">
                                <span className="text-gray-400 uppercase tracking-widest">الحالة</span>
                                <span className={coupon.active ? 'text-green-500' : 'text-red-500'}>
                                  {coupon.active ? 'نشط' : 'متوقف'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {coupons.length === 0 && !isAddingCoupon && (
                        <div className="py-20 text-center space-y-4">
                          <div className="w-20 h-20 bg-muted-bg rounded-full flex items-center justify-center mx-auto">
                            <Ticket className="w-10 h-10 text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-bold">لا يوجد أكواد خصم حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      <ImageEditorModal 
        isOpen={!!imageToEdit}
        image={imageToEdit?.src || ''}
        aspect={imageToEdit?.aspect}
        onClose={() => setImageToEdit(null)}
        onSave={(cropped) => {
          if (imageToEdit) {
            imageToEdit.callback(cropped);
            setImageToEdit(null);
          }
        }}
      />
    </>
  );
}
