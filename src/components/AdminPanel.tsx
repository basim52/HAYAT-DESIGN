import { X, Plus, Trash2, Edit2, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { Product, Category } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

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
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'hero'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingHero, setEditingHero] = useState(heroImage);

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
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      const slug = newCategory.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${Date.now()}`;
      await addDoc(collection(db, 'categories'), { ...newCategory, slug });
      setIsAddingCategory(false);
      setNewCategory({ name: '', image: '' });
    } catch (err) {
      console.error(err);
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

  const handleUpdateHero = async () => {
    try {
      await setDoc(doc(db, 'config', 'general'), { heroImage: editingHero });
      alert('تم تحديث صورة الغلاف بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  // Inline edit for category
  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
    } catch (err) {
      console.error(err);
    }
  }

  return (
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
                </div>
                <button onClick={onClose} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-full border border-border-subtle transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-body-bg">
              <div className="max-w-6xl mx-auto">
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
                                <button type="submit" className="flex-1 bg-brand-teal text-white py-3 rounded-xl font-bold text-xs">
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
                  <div className="max-w-2xl mx-auto space-y-8">
                    <h3 className="text-xl font-bold">صورة الغلاف الرئيسية</h3>
                    <div className="bg-white p-8 rounded-[40px] border border-border-subtle shadow-sm flex flex-col items-center">
                      <div className="w-full aspect-[2/1] rounded-3xl overflow-hidden mb-8 border border-border-subtle">
                        <img src={editingHero} alt="Hero Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-full space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 px-2 uppercase tracking-widest">تحديث صورة الغلاف</label>
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              className="flex-1 p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-purple"
                              value={editingHero}
                              onChange={(e) => setEditingHero(e.target.value)}
                              placeholder="رابط الصورة المباشر"
                            />
                            <label className="p-4 bg-white border border-border-subtle rounded-2xl cursor-pointer hover:bg-muted-bg transition-colors flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-brand-purple" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleFileUpload(e, (img) => setEditingHero(img))}
                              />
                            </label>
                            <button 
                              onClick={handleUpdateHero}
                              className="bg-brand-purple text-white px-8 rounded-2xl font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
                            >
                              <Save className="w-4 h-4" />
                              <span>حفظ التعديل</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">يقترح استخدام صور ذات أبعاد عريضة وجودة عالية (Unsplash مثلاً)</p>
                      </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AnimatePresence>
                        {isAddingCategory && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-6 rounded-[32px] border-2 border-dashed border-brand-purple/30 shadow-xl"
                          >
                            <form onSubmit={handleAddCategory} className="space-y-4">
                              <h4 className="font-bold text-sm text-brand-purple">إضافة قسم جديد</h4>
                              <input 
                                required
                                type="text" 
                                placeholder="اسم القسم" 
                                className="w-full p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                value={newCategory.name}
                                onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                              />
                              <div className="flex gap-2">
                                <input 
                                  required
                                  type="text" 
                                  placeholder="رابط صورة القسم" 
                                  className="flex-1 p-3 bg-muted-bg rounded-xl text-xs outline-none border border-transparent focus:border-brand-purple"
                                  value={newCategory.image}
                                  onChange={e => setNewCategory({...newCategory, image: e.target.value})}
                                />
                                <label className="p-3 bg-white border border-border-subtle rounded-xl cursor-pointer hover:bg-muted-bg transition-colors">
                                  <ImageIcon className="w-4 h-4 text-brand-purple" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(e, (img) => setNewCategory({...newCategory, image: img}))}
                                  />
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-brand-purple text-white py-3 rounded-xl font-bold text-xs">إضافة</button>
                                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs">إلغاء</button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {categories.map((c, idx) => (
                        <div key={c.id} className="bg-white p-6 rounded-[40px] border border-border-subtle flex gap-6 items-center group relative overflow-hidden">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 border border-border-subtle">
                            <img src={c.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">اسم القسم</label>
                              <input 
                                type="text" 
                                className="w-full p-2.5 bg-muted-bg rounded-xl text-sm font-bold border border-transparent focus:border-brand-teal outline-none"
                                value={c.name}
                                onChange={(e) => handleUpdateCategory(c.id, { name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">رابط الصورة</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  className="flex-1 text-[10px] bg-muted-bg p-2.5 rounded-xl outline-none border border-transparent focus:border-brand-teal"
                                  value={c.image}
                                  onChange={(e) => handleUpdateCategory(c.id, { image: e.target.value })}
                                />
                                <label className="p-2 bg-white border border-border-subtle rounded-xl cursor-pointer hover:bg-muted-bg transition-colors">
                                  <ImageIcon className="w-3.5 h-3.5 text-brand-teal" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(e, (img) => handleUpdateCategory(c.id, { image: img }))}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveCategory(c.id)}
                            className="absolute top-4 left-4 p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
