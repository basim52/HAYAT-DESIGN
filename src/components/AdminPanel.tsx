import { X, Plus, Trash2, Edit2, Save, Image as ImageIcon, Package, Clock, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Calendar, User, MapPin, Phone, MessageCircle, TrendingUp, BarChart2, Wallet, DollarSign, Scissors, Palette, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Product, Category, Order } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
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
  const { config: themeConfig, updateConfig: updateThemeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'hero' | 'orders' | 'theme'>('orders');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [banners, setBanners] = useState<{ id: string; image: string; title?: string; subtitle?: string; active: boolean }[]>([]);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

  const [newBanner, setNewBanner] = useState({
    image: '',
    title: '',
    subtitle: '',
    active: true
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Image Editor State
  const [imageToEdit, setImageToEdit] = useState<{ src: string, callback: (cropped: string) => void } | null>(null);

  // Fetch orders and banners
  useEffect(() => {
    if (isOpen && isAdmin) {
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(docs);
      });

      const qBanners = query(collection(db, 'banners'));
      const unsubBanners = onSnapshot(qBanners, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setBanners(docs);
      });

      return () => {
        unsubOrders();
        unsubBanners();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
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
          callback
        });
      };
      reader.readAsDataURL(file);
    }
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
      console.error(err);
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
      console.error(err);
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
      console.error(err);
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
    if (confirm('هل أنت متأكد من حذف هذا الغلاف؟')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch (err) {
        console.error(err);
      }
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
        console.error(err);
      }
    }
  };

  // Inline edit for category
  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء تحديث حالة الطلب');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (err) {
        console.error(err);
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
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-brand-purple">تخصيص مظهر المتجر</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">اختر الثيم المناسب وتحكم في الألوان الأساسية</p>
                    </div>

                    {/* Theme Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(['classic', 'modern', 'creative'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateThemeConfig({ activeTheme: t })}
                          className={`p-6 rounded-[40px] border-2 transition-all text-right relative overflow-hidden group ${
                            themeConfig.activeTheme === t 
                              ? 'border-brand-purple bg-white shadow-xl shadow-brand-purple/10' 
                              : 'border-border-subtle bg-white/50 hover:border-brand-purple/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${themeConfig.activeTheme === t ? 'bg-brand-purple text-white' : 'bg-muted-bg text-gray-400'}`}>
                              <Layout className="w-5 h-5" />
                            </div>
                            {themeConfig.activeTheme === t && (
                              <div className="bg-brand-teal text-white p-1 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-black text-lg capitalize">{t === 'classic' ? 'الملكي (Classic)' : t === 'modern' ? 'العصري (Modern)' : 'الإبداعي (Creative)'}</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed">
                            {t === 'classic' ? 'لمسات فخمة وخطوط كلاسيكية تناسب الأعمال الراقية.' : t === 'modern' ? 'تصميم بسيط بخطوط حادة وواضحة يركز على المحتوى.' : 'تصميم ملهم بأشكال دائرية وألوان نابضة بالحياة.'}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Color Management */}
                    <div className="bg-white p-10 rounded-[50px] border border-border-subtle shadow-sm space-y-8">
                      <div className="flex items-center gap-3 border-b border-border-subtle pb-6">
                        <Palette className="w-6 h-6 text-brand-purple" />
                        <h4 className="font-black text-xl">لوحة الألوان المخصصة</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">اللون الأساسي (Primary)</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={themeConfig.primaryColor}
                              onChange={(e) => updateThemeConfig({ primaryColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={themeConfig.primaryColor}
                              onChange={(e) => updateThemeConfig({ primaryColor: e.target.value })}
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-[10px] font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">اللون الثانوي (Secondary)</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={themeConfig.secondaryColor}
                              onChange={(e) => updateThemeConfig({ secondaryColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={themeConfig.secondaryColor}
                              onChange={(e) => updateThemeConfig({ secondaryColor: e.target.value })}
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-[10px] font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">لون التمييز (Accent)</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={themeConfig.accentColor}
                              onChange={(e) => updateThemeConfig({ accentColor: e.target.value })}
                              className="w-16 h-16 rounded-2xl border-none cursor-pointer outline-none overflow-hidden"
                            />
                            <input 
                              type="text"
                              value={themeConfig.accentColor}
                              onChange={(e) => updateThemeConfig({ accentColor: e.target.value })}
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
                                      onChange={(e) => handleFileUpload(e, (img) => setNewProduct({...newProduct, image: img}))}
                                    />
                                  </label>
                                </div>
                                {newProduct.image && (
                                  <img src={newProduct.image} className="w-12 h-12 rounded-lg object-cover border border-border-subtle" />
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
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-xl font-bold">إدارة أغلفة المتجر (Banners)</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">يمكنك إضافة أكثر من غلاف ليظهر في الصفحة الرئيسية</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingBannerId(null);
                          setNewBanner({ image: '', title: '', subtitle: '', active: true });
                          setIsAddingBanner(true);
                        }}
                        className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة غلاف جديد</span>
                      </button>
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
                                      onChange={(e) => handleFileUpload(e, (img) => setNewBanner({...newBanner, image: img}))}
                                    />
                                  </label>
                                </div>
                                {newBanner.image && (
                                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border-subtle">
                                    <img src={newBanner.image} className="w-full h-full object-cover" />
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

                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox"
                                  id="active-banner"
                                  checked={newBanner.active}
                                  onChange={e => setNewBanner({...newBanner, active: e.target.checked})}
                                  className="w-4 h-4 accent-brand-purple"
                                />
                                <label htmlFor="active-banner" className="text-xs font-bold text-gray-500">تفعيل الغلاف ليظهر في الموقع</label>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                  {editingBannerId ? 'تحديث' : 'حفظ الغلاف'}
                                </button>
                                <button type="button" onClick={() => setIsAddingBanner(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-sm">إلغاء</button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {banners.map((b) => (
                        <div key={b.id} className="bg-white rounded-[40px] border border-border-subtle overflow-hidden flex flex-col group relative">
                          <div className="aspect-[16/9] relative overflow-hidden">
                            <img src={b.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            {!b.active && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="px-4 py-2 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/30">معطل</span>
                              </div>
                            )}
                          </div>
                          <div className="p-6 flex justify-between items-center bg-white">
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate">{b.title || 'بدون عنوان'}</h4>
                              <p className="text-[10px] text-gray-400 font-bold truncate">{b.subtitle || 'بدون عنوان فرعي'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditBanner(b)}
                                className="p-3 bg-muted-bg text-gray-400 hover:text-brand-purple rounded-xl transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveBanner(b.id)}
                                className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                      <AnimatePresence>
                        {isAddingCategory && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-8 rounded-[40px] border-2 border-dashed border-brand-purple/30 shadow-xl z-10"
                          >
                            <form onSubmit={handleAddCategory} className="space-y-4">
                              <h4 className="font-bold text-sm text-brand-purple">
                                {editingCategoryId ? 'تعديل القسم' : 'إضافة قسم جديد'}
                              </h4>
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
                                      onChange={(e) => handleFileUpload(e, (img) => setNewCategory({...newCategory, image: img}))}
                                    />
                                  </label>
                                </div>
                                {newCategory.image && (
                                  <img src={newCategory.image} className="w-20 h-20 rounded-2xl object-cover border border-border-subtle" />
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                  {editingCategoryId ? 'تحديث' : 'حفظ القسم'}
                                </button>
                                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-xs">إلغاء</button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {categories.map((c) => (
                        <div key={c.id} className="bg-white p-6 rounded-[40px] border border-border-subtle flex gap-6 items-center group relative overflow-hidden">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 border border-border-subtle">
                            <img src={c.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base truncate">{c.name}</h4>
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
              </div>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      <ImageEditorModal 
        isOpen={!!imageToEdit}
        image={imageToEdit?.src || ''}
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
