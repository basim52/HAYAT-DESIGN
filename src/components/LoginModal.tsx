import { X, LogIn, Mail, Phone, MapPin, User as UserIcon, Package, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, auth, db } from '../lib/firebase';
import { useAuth } from '../AuthContext';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  // Sync state when profile loads or editing starts
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
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
      });
      return unsub;
    }
  }, [user, activeTab]);

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
            className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[310] rounded-[48px] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold tracking-tighter">
                {user ? 'ملفك الشخصي' : 'تسجيل الدخول'}
              </h2>
              <button onClick={onClose} className="p-3 hover:bg-muted-bg rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!user ? (
              <div className="space-y-6">
                <p className="text-gray-500 text-sm leading-relaxed text-center">
                  سجل دخولك لتتبع طلباتك وحفظ بياناتك لتسهيل عملية الشراء القادمة
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-4 py-5 bg-white border border-border-subtle rounded-3xl font-bold hover:bg-muted-bg transition-all transform active:scale-95"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  <span>متابعة باستخدام جوجل</span>
                </button>
                <div className="text-center">
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
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${profile?.fullName}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{profile?.fullName}</h3>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center justify-end gap-3 text-sm p-4 bg-white border border-border-subtle rounded-2xl">
                            <span>{profile?.phone || 'لا يوجد رقم هاتف'}</span>
                            <Phone className="w-4 h-4 text-brand-teal" />
                          </div>
                          <div className="flex items-center justify-end gap-3 text-sm p-4 bg-white border border-border-subtle rounded-2xl">
                            <span>{profile?.address || 'لا يوجد عنوان مسجل'}</span>
                            <MapPin className="w-4 h-4 text-brand-teal" />
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
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all"
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
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">العنوان</label>
                            <textarea 
                                placeholder="المدينة، الحي، الشارع..."
                                className="w-full p-4 bg-muted-bg rounded-2xl text-xs outline-none border border-transparent focus:border-brand-teal transition-all text-right h-24 resize-none"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
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
                                      <span>{order.address}</span>
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
