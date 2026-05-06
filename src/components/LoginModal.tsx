import { X, LogIn, Mail, Phone, MapPin, User as UserIcon, Package, ChevronDown, ChevronUp, Clock, Lock, UserPlus, Eye, EyeOff, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth } from '../AuthContext';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { Order, InvoiceConfig } from '../types';
import { generateInvoicePDF } from '../lib/invoiceHelper';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  
  const SAUDI_CITIES = [
    'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
    'الخبر', 'الظهران', 'القطيف', 'سيهات', 'الجبيل', 'الأحساء',
    'تبوك', 'خميس مشيط', 'حائل', 'نجران', 'حفر الباطن',
    'الخفجي', 'ينبع', 'بريدة', 'عنيزة', 'الرس', 'الباحة',
    'أبها', 'جيزان', 'سكاكا', 'عرعر', 'طريف', 'القريات'
  ].sort((a, b) => a.localeCompare(b, 'ar'));

  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    city: '',
    shortAddress: '',
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    shortAddress: '',
  });

  // Sync state when profile loads or editing starts
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        city: profile.city || '',
        address: profile.address || '',
        shortAddress: profile.shortAddress || '',
      });
    }
  }, [profile, isEditing]);

  // Fetch user orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }, (error) => console.error("Error fetching orders:", error));
      return unsub;
    }
  }, [user, activeTab]);

  // Fetch invoice config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'invoice'), (snapshot) => {
      if (snapshot.exists()) {
        setInvoiceConfig(snapshot.data() as InvoiceConfig);
      }
    });
    return unsub;
  }, []);

  const handleDownloadInvoice = async (order: Order) => {
    if (!invoiceConfig) {
      alert("جاري تحميل إعدادات الفاتورة، يرجى المحاولة بعد قليل");
      return;
    }
    setIsGeneratingInvoice(order.id);
    try {
      await generateInvoicePDF(order, invoiceConfig);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("حدث خطأ أثناء إنشاء الفاتورة");
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, authFormData.email, authFormData.password);
        await updateProfile(newUser, { displayName: authFormData.fullName });
        
        // Profile creation is handled by AuthProvider's onAuthStateChanged
        // but we can pre-populate fullName if we want
        await setDoc(doc(db, 'users', newUser.uid), {
          id: newUser.uid,
          fullName: authFormData.fullName,
          email: authFormData.email,
          phone: authFormData.phone,
          city: authFormData.city,
          shortAddress: authFormData.shortAddress,
          isAdmin: false,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, authFormData.email, authFormData.password);
      }
      onClose();
    } catch (error: any) {
      console.error("Auth error:", error);
      let msg = "حدث خطأ أثناء تسجيل الدخول";
      if (error.code === 'auth/email-already-in-use') msg = "هذا البريد الإلكتروني مستخدم بالفعل";
      if (error.code === 'auth/wrong-password') msg = "كلمة المرور خاطئة";
      if (error.code === 'auth/user-not-found') msg = "لا يوجد حساب بهذا البريد";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ في النظام. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-md h-fit max-h-[95vh] overflow-y-auto bg-white z-[310] rounded-[48px] shadow-2xl p-8 custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2">
              <h2 className="text-2xl font-extrabold tracking-tighter">
                {user ? 'ملفك الشخصي' : (authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
              </h2>
              <button onClick={onClose} className="p-3 hover:bg-muted-bg rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!user ? (
              <div className="space-y-6">
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">الاسم الكامل</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          required
                          type="text"
                          placeholder="أدخل اسمك الكامل"
                          className="w-full p-4 pl-12 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right"
                          value={authFormData.fullName}
                          onChange={e => setAuthFormData({...authFormData, fullName: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">رقم الجوال</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required
                        type="tel"
                        placeholder="05xxxxxxx"
                        className="w-full p-4 pl-12 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right"
                        value={authFormData.phone}
                        onChange={e => setAuthFormData({...authFormData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">المدينة</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                          required
                          className="w-full p-4 pl-12 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right appearance-none font-bold"
                          value={authFormData.city}
                          onChange={e => setAuthFormData({...authFormData, city: e.target.value})}
                        >
                          <option value="">اختر المدينة</option>
                          {SAUDI_CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">العنوان الوطني المختصر <span className="text-red-500">* مطلوب</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required
                        type="text"
                        placeholder="مثال: AB1234"
                        className="w-full p-4 pl-12 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right uppercase font-bold tracking-widest"
                        value={authFormData.shortAddress}
                        onChange={e => setAuthFormData({...authFormData, shortAddress: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required
                        type="email"
                        placeholder="example@mail.com"
                        className="w-full p-4 pl-12 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-left"
                        value={authFormData.email}
                        onChange={e => setAuthFormData({...authFormData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">كلمة المرور</label>
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-purple"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Lock className="absolute left-10 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        required
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full p-4 pl-16 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-left"
                        value={authFormData.password}
                        onChange={e => setAuthFormData({...authFormData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-charcoal text-white rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-charcoal/90 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                    <span>{authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</span>
                  </button>
                </form>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                    <span className="bg-white px-4 text-gray-400">أو عبر</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-border-subtle rounded-3xl font-bold hover:bg-muted-bg transition-all transform active:scale-95"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  <span>المتابعة باستخدام جوجل</span>
                </button>

                <p className="text-center text-xs font-bold text-gray-500">
                  {authMode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-brand-purple hover:underline"
                  >
                    {authMode === 'login' ? 'سجل الآن' : 'سجل دخولك'}
                  </button>
                </p>

                <div className="text-center pt-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">نظام تسجيل زبائن حياة ديزاين</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-muted-bg p-1 rounded-2xl mb-4">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-brand-purple' : 'text-gray-400'}`}
                  >
                    الملف الشخصي
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-brand-purple' : 'text-gray-400'}`}
                  >
                    طلباتي
                  </button>
                </div>

                {activeTab === 'profile' ? (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-muted-bg/50 rounded-3xl border border-border-subtle">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${profile?.fullName || user.email}&background=7E308E&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{profile?.fullName || user.displayName || 'مستخدم جديد'}</h3>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-right">
                          <div className="flex items-center justify-between gap-3 text-sm p-4 bg-white border border-border-subtle rounded-2xl">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">رقم الجوال والمدينة</span>
                            <div className="flex flex-col items-end">
                              <span>{profile?.phone || 'غير مسجل'}</span>
                              <span className="text-[10px] text-brand-purple font-bold">{profile?.city || 'المدينة غير محددة'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 p-4 bg-white border border-border-subtle rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">العنوان الكامل</span>
                              <MapPin className="w-4 h-4 text-brand-teal" />
                            </div>
                            <span className="text-sm">{profile?.address || 'غير مسجل'}</span>
                          </div>
                          <div className="flex flex-col gap-2 p-4 bg-white border border-border-subtle rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">العنوان الوطني المختصر</span>
                              <MapPin className="w-4 h-4 text-brand-purple" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">{profile?.shortAddress || 'غير مسجل'}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="flex-1 py-4 bg-charcoal text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
                          >
                            تعديل البيانات
                          </button>
                          <button 
                            onClick={() => auth.signOut()}
                            className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors"
                          >
                            خروج
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">الاسم الكامل</label>
                            <input 
                                required
                                type="text"
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right"
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">رقم الجوال</label>
                            <input 
                                type="tel"
                                placeholder="05xxxxxxx"
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">المدينة</label>
                            <select 
                                required
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right font-bold"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                            >
                                <option value="">اختر المدينة</option>
                                {SAUDI_CITIES.map(city => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">العنوان (الحي والشارع)</label>
                            <textarea 
                                placeholder="اسم الحي، الشارع، تفاصيل أخرى..."
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right h-20 resize-none"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">العنوان الوطني المختصر <span className="text-red-500">* مطلوب</span></label>
                            <input 
                                required
                                type="text"
                                placeholder="مثال: AB1234"
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right uppercase font-bold tracking-widest"
                                value={formData.shortAddress}
                                onChange={e => setFormData({...formData, shortAddress: e.target.value.toUpperCase()})}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-4 bg-brand-teal text-white rounded-2xl font-bold text-sm disabled:opacity-50"
                          >
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm"
                          >
                            إلغاء
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-bold">لا يوجد طلبات سابقة</p>
                      </div>
                    ) : (
                      orders.map(order => (
                        <div 
                          key={order.id} 
                          className="bg-muted-bg/30 rounded-[32px] border border-border-subtle overflow-hidden"
                        >
                          <div 
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className="p-4 cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                              </div>
                              <p className="text-sm font-extrabold">{order.total} ر.س</p>
                            </div>
                            <div className="text-gray-300">
                              {expandedOrderId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedOrderId === order.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border-subtle px-4 pb-4"
                              >
                                <div className="pt-4 space-y-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-border-subtle">
                                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                          <p className="font-bold">{item.name}</p>
                                          <p className="text-[9px] text-gray-400">الكمية: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <span className="font-extrabold">{item.price * item.quantity} ر.س</span>
                                    </div>
                                  ))}
                                  <div className="pt-3 border-t border-dashed border-gray-200 mt-2">
                                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                                      <MapPin className="w-3 h-3" />
                                      <span className="flex-1">{order.address}</span>
                                    </div>
                                    {order.shortAddress && (
                                      <div className="flex items-center gap-2 text-[9px] text-brand-purple mt-1 font-bold">
                                        <MapPin className="w-3 h-3" />
                                        <span>العنوان المختصر: {order.shortAddress}</span>
                                      </div>
                                    )}
                                    
                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                      <button
                                        onClick={() => handleDownloadInvoice(order)}
                                        disabled={isGeneratingInvoice === order.id}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-border-subtle hover:border-brand-purple hover:text-brand-purple rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                      >
                                        {isGeneratingInvoice === order.id ? (
                                          <Clock className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Download className="w-3 h-3" />
                                        )}
                                        <span>{invoiceConfig?.isTaxEnabled ? 'تحميل الفاتورة الضريبية (PDF)' : 'تحميل فاتورة الطلب (PDF)'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
