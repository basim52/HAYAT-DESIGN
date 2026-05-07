import { X, Send, Landmark, Copy, CheckCircle2, MessageCircle, Mail, Smartphone, Image as ImageIcon, Scissors, Ticket, Tag, Truck, Download, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { BANK_DETAILS, PAYMENT_METHODS, SAUDI_CITIES } from '../constants';
import { CartItem, UserProfile, Coupon, InvoiceConfig, Order } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, increment, onSnapshot, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import ImageEditorModal from './ImageEditorModal';
import { ShippingOption } from '../types';
import { generateInvoicePDF, shareInvoicePDF } from '../lib/invoiceHelper';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  cartItems: CartItem[];
  userProfile: UserProfile | null;
}

export default function CheckoutModal({ isOpen, onClose, onSuccess, cartItems, userProfile }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    city: '',
    address: '',
    shortAddress: '',
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch shipping
    const q = query(collection(db, 'shipping'), where('active', '==', true), orderBy('cost', 'asc'));
    const unsubShipping = onSnapshot(q, (snapshot) => {
      const options = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingOption));
      setShippingOptions(options);
      if (options.length > 0 && !selectedShippingId) {
        setSelectedShippingId(options[0].id);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'shipping'));

    // Fetch Invoice Config
    const unsubConfig = onSnapshot(doc(db, 'config', 'invoice'), (docSnap) => {
      if (docSnap.exists()) {
        setInvoiceConfig(docSnap.data() as InvoiceConfig);
      }
    });

    return () => {
      unsubShipping();
      unsubConfig();
    };
  }, [isOpen]);

  const sortedCities = [...SAUDI_CITIES].sort((a, b) => a.localeCompare(b, 'ar'));

  const availableShipping = shippingOptions.filter(opt => 
    opt.allCities || (formData.city && opt.cities?.includes(formData.city))
  );

  useEffect(() => {
    if (availableShipping.length > 0 && !availableShipping.find(opt => opt.id === selectedShippingId)) {
      setSelectedShippingId(availableShipping[0].id);
    }
  }, [availableShipping, selectedShippingId]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        customerName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        city: userProfile.city || '',
        address: userProfile.address || '',
        shortAddress: userProfile.shortAddress || '',
      });
    }
  }, [userProfile, isOpen]);

  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [useAlternativeInfo, setUseAlternativeInfo] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Shipping logic
  const selectedShipping = shippingOptions.find(opt => opt.id === selectedShippingId);
  const shippingCost = selectedShipping?.cost || 0;
  const shippingType = selectedShipping?.name || 'لم يتم الاختيار';

  const discountAmount = appliedCoupon ? (
    appliedCoupon.type === 'percentage' 
      ? (subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
  ) : 0;

  const finalTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleValidateCoupon = async () => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', couponInput.toUpperCase()),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCouponError('كود الخصم غير صحيح أو غير فعال');
        setAppliedCoupon(null);
      } else {
        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Coupon;
        
        // Validation
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          setCouponError('عذراً، انتهت صلاحية هذا الكود');
          setAppliedCoupon(null);
        } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          setCouponError('عذراً، وصل هذا الكود للحد الأقصى للاستخدام');
          setAppliedCoupon(null);
        } else if (subtotal < coupon.minOrder) {
          setCouponError(`هذا الكود يتطلب حداً أدنى للشراء بقيمة ${coupon.minOrder} ر.س`);
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          setCouponError(null);
        }
      }
    } catch (err) {
      console.error(err);
      setCouponError('خطأ أثناء التحقق من الكود');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleOrderSubmission = async (e: FormEvent) => {
    e.preventDefault();
    
    // Explicit Validation with specific messages
    if (!formData.customerName.trim()) {
      alert('يرجى إدخال الاسم الكامل الثلاثي');
      return;
    }
    if (!formData.phone.trim()) {
      alert('يرجى إدخال رقم الجوال');
      return;
    }
    const phoneRegex = /^(05|5|9665)[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      alert('يرجى إدخال رقم جوال سعودي صحيح (مثال: 05xxxxxxx)');
      return;
    }
    if (!formData.city) {
      alert('يرجى اختيار مدينة التوصيل');
      return;
    }
    if (!formData.address.trim()) {
      alert('يرجى إدخال عنوان التوصيل / الاستلام');
      return;
    }
    if (!formData.shortAddress.trim()) {
      alert('يرجى إدخال العنوان الوطني المختصر (مثال: AB1234)');
      return;
    }
    if (!selectedShippingId || availableShipping.length === 0) {
      alert('عذراً، يرجى اختيار وسيلة شحن متوفرة لمدينتك لإتمام الطلب');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Save to Firestore
      const orderData: any = {
        userId: userProfile?.id || 'guest',
        ...formData,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          image: item.image
        })),
        subtotal,
        shippingCost,
        shippingType,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        total: finalTotal,
        status: 'pending',
        paymentMethod: selectedMethod.bankName,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      orderData.id = docRef.id;
      setLastPlacedOrder(orderData as Order);

      // Increment coupon usage count if used
      if (appliedCoupon) {
        await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
          usageCount: increment(1)
        });
      }

      // Trigger Success Screen
      onSuccess?.();
      setShowSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
      alert('حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] overflow-y-auto bg-white z-[160] rounded-[48px] lux-shadow p-8 md:p-12"
          >
            {showSuccess ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold">تم تسجيل طلبك بنجاح!</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                  تم إصدار الفاتورة تلقائياً. يرجى إرسالها الآن للمتجر عبر واتساب لإتمام تأكيد طلبك.
                </p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  {lastPlacedOrder && invoiceConfig && (
                    <div className="space-y-4 w-full">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">الخطوة الأخيرة</p>
                        <button 
                          onClick={async () => {
                            setIsGeneratingInvoice(true);
                            try {
                              const shared = await shareInvoicePDF(lastPlacedOrder, invoiceConfig);
                              if (!shared) {
                                // Fallback if native sharing fails (e.g. gesture expired or desktop)
                                const waMessage = `*طلب جديد من حياة ديزاين*\n\n` +
                                  `رقم الطلب: #${lastPlacedOrder.id.slice(-6).toUpperCase()}\n` +
                                  `الاسم: ${lastPlacedOrder.customerName}\n` +
                                  `الإجمالي: ${lastPlacedOrder.total} ر.س\n\n` +
                                  `*تم تحميل الفاتورة (PDF) تلقائياً، يرجى إرفاقها هنا ومشاركة صورة الإيصال لإتمام الطلب.*`;
                                window.open(`https://wa.me/${BANK_DETAILS.whatsappNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');
                              }
                            } finally {
                              setIsGeneratingInvoice(false);
                            }
                          }}
                          disabled={isGeneratingInvoice}
                          className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all scale-[1.02] shadow-xl shadow-green-600/30 w-full group"
                        >
                          {isGeneratingInvoice ? <Clock className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                          إرسال الفاتورة للمتجر (واتساب)
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={async () => {
                            setIsGeneratingInvoice(true);
                            try {
                              const pdf = await generateInvoicePDF(lastPlacedOrder, invoiceConfig);
                              pdf.save(`invoice-${lastPlacedOrder.id.slice(-6).toUpperCase()}.pdf`);
                            } finally {
                              setIsGeneratingInvoice(false);
                            }
                          }}
                          disabled={isGeneratingInvoice}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-brand-purple/20 text-brand-purple/60 rounded-xl text-[10px] font-bold hover:bg-brand-purple/5 transition-colors w-full"
                        >
                          {isGeneratingInvoice ? <Clock className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          <span>تحميل نسخة PDF يدوياً</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-400 font-bold leading-relaxed pt-2">
                        * بعد اتمام التحويل يرجى ارسال الفاتورة وايصال التحويل عبر الواتساب لتأكيد طلبك.
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setShowSuccess(false);
                      onClose();
                    }}
                    className="mt-4 text-xs font-bold text-gray-400 hover:text-charcoal transition-colors underline-offset-4 hover:underline"
                  >
                    إغلاق النافذة والعودة للمتجر
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-display font-bold">تأكيد الطلب</h2>
                  <button 
                    onClick={onClose}
                    className="p-3 bg-gold-light hover:bg-gold/20 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  {/* Bank Details */}
                  <div className="space-y-6 text-right" dir="rtl">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">اختر وسيلة الدفع</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method)}
                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${selectedMethod.id === method.id ? 'border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple' : 'border-border-subtle bg-white hover:border-gray-300'}`}
                          >
                            {method.type === 'bank' ? <Landmark className={`w-4 h-4 ${selectedMethod.id === method.id ? 'text-brand-purple' : 'text-gray-400'}`} /> : <Smartphone className={`w-4 h-4 ${selectedMethod.id === method.id ? 'text-brand-purple' : 'text-gray-400'}`} />}
                            <span className={`text-[10px] font-bold ${selectedMethod.id === method.id ? 'text-brand-purple' : 'text-gray-500'}`}>{method.bankName}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-gold-light/40 rounded-3xl border border-gold/10 relative overflow-hidden">
                      <div className="absolute -top-4 -left-4 w-24 h-24 bg-gold/5 rounded-full" />
                      <div className="flex items-center gap-3 mb-6">
                        {selectedMethod.type === 'bank' ? <Landmark className="w-6 h-6 text-gold" /> : <Smartphone className="w-6 h-6 text-brand-teal" />}
                        <h4 className="font-bold">{selectedMethod.bankName}</h4>
                      </div>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-charcoal/40 mb-1">{selectedMethod.id === 'stc-pay' ? 'الاسم المسجل' : 'اسم الحساب'}</p>
                          <p className="font-bold">{selectedMethod.accountName}</p>
                        </div>
                        
                        {selectedMethod.accountNumber && (
                          <div>
                            <p className="text-charcoal/40 mb-1">{selectedMethod.id === 'stc-pay' ? 'رقم الجوال (STC Bank)' : 'رقم الحساب'}</p>
                            <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gold/10">
                              <code className="text-xs font-mono font-bold tracking-wider">{selectedMethod.accountNumber}</code>
                              <button 
                                type="button"
                                onClick={() => handleCopyValue(selectedMethod.accountNumber!)}
                                className="p-2 hover:bg-gold-light rounded-lg transition-colors flex-shrink-0"
                              >
                                {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gold" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedMethod.iban && (
                          <div>
                            <p className="text-charcoal/40 mb-1">رقم الآيبان (IBAN)</p>
                            <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gold/10">
                              <code className="text-xs font-mono font-bold tracking-wider">{selectedMethod.iban}</code>
                              <button 
                                type="button"
                                onClick={() => handleCopyValue(selectedMethod.iban!)}
                                className="p-2 hover:bg-gold-light rounded-lg transition-colors flex-shrink-0"
                              >
                                {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gold" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">هل لديك كود خصم؟</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text"
                            placeholder="أدخل الكود هنا"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className={`w-full p-4 bg-muted-bg/30 border rounded-2xl text-xs font-bold outline-none transition-all ${couponError ? 'border-red-500 focus:border-red-500' : appliedCoupon ? 'border-green-500 focus:border-green-500' : 'border-border-subtle focus:border-brand-purple'}`}
                            dir="ltr"
                            disabled={!!appliedCoupon}
                          />
                          <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${appliedCoupon ? 'text-green-500' : 'text-gray-300'}`} />
                        </div>
                        {appliedCoupon ? (
                          <button 
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponInput('');
                            }}
                            className="px-6 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black hover:bg-red-100 transition-all border border-red-200"
                          >
                            حذف
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={handleValidateCoupon}
                            disabled={!couponInput || isValidatingCoupon}
                            className="px-6 bg-brand-purple text-white rounded-2xl text-[10px] font-black hover:bg-brand-purple/90 transition-all shadow-lg shadow-brand-purple/20 disabled:opacity-50"
                          >
                            {isValidatingCoupon ? '...' : 'تفعيل'}
                          </button>
                        )}
                      </div>
                      {couponError && <p className="text-[9px] text-red-500 font-bold px-1">{couponError}</p>}
                      {appliedCoupon && (
                        <p className="text-[9px] text-green-600 font-bold px-1">
                          تم تطبيق كود الخصم بنجاح! ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${appliedCoupon.value} ر.س`})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-green-800 leading-relaxed">
                        يرجى تحويل مبلغ <span className="font-bold">{finalTotal} ر.س</span> عبر <span className="font-bold">{selectedMethod.bankName}</span> ثم تعبئة بياناتك لإكمال الطلب.
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="p-6 bg-muted-bg/50 rounded-3xl space-y-4 border border-border-subtle/50">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">ملخص الفاتورة</div>
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-charcoal">
                          <span className="text-gray-500">مجموع المنتجات</span>
                          <span>{subtotal} ر.س</span>
                        </div>
                        
                        {selectedShipping && (
                          <div className="flex justify-between text-xs font-bold items-center py-2 px-3 bg-brand-teal/5 rounded-xl border border-brand-teal/10">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3 h-3 text-brand-teal" />
                              <span className="text-brand-teal">الشحن: {selectedShipping.name}</span>
                            </div>
                            <span className="text-brand-teal">{shippingCost === 0 ? 'مجاني' : `${shippingCost} ر.س`}</span>
                          </div>
                        )}

                        {appliedCoupon && (
                          <div className="flex justify-between text-xs font-bold text-green-600 px-1">
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3" />
                              <span>خصم ({appliedCoupon.code})</span>
                            </div>
                            <span>-{discountAmount} ر.س</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-lg font-black border-t border-border-subtle pt-4 px-1">
                        <span className="text-charcoal">الإجمالي النهائي</span>
                        <div className="text-left">
                          <span className="text-brand-purple text-2xl">{finalTotal}</span>
                          <span className="text-[10px] text-brand-purple mr-1">ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Form */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">بيانات التوصيل والطلب</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {userProfile && !useAlternativeInfo ? (
                        <div className="p-5 bg-brand-purple/5 border border-brand-purple/10 rounded-[32px] space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest bg-brand-purple/10 w-fit px-2 py-0.5 rounded-full">بياناتي المسجلة</p>
                              <div className="space-y-0.5">
                                <p className="text-sm font-black">{userProfile.fullName}</p>
                                <p className="text-[11px] text-gray-500 font-bold">{userProfile.phone}</p>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                                  {userProfile.city && `${userProfile.city} - `}{userProfile.address || 'لا يوجد عنوان مسجل'}
                                </p>
                                {userProfile.shortAddress && (
                                  <p className="text-[10px] text-brand-teal font-black mt-2 inline-block px-2 py-1 bg-brand-teal/10 rounded-lg">العنوان المختصر: {userProfile.shortAddress}</p>
                                )}
                              </div>
                            </div>
                            <div className="bg-brand-teal text-white p-1 rounded-full shadow-lg shadow-brand-teal/20">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setUseAlternativeInfo(true)}
                            className="w-full py-3 bg-white border border-brand-purple/10 text-brand-purple text-[10px] font-black rounded-2xl hover:bg-brand-purple/5 transition-all shadow-sm"
                          >
                            هل ترغب في الشحن لعنوان آخر؟
                          </button>
                        </div>
                      ) : (
                        <>
                          {userProfile && (
                            <button 
                              type="button"
                              onClick={() => setUseAlternativeInfo(false)}
                              className="text-[10px] font-black text-brand-teal hover:underline mb-2 block mx-auto py-1 px-3 bg-brand-teal/5 rounded-full"
                            >
                              الرجوع لبياناتي المسجلة
                            </button>
                          )}
                          {/* Name */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">الاسم الكامل (الثلاثي)</label>
                              <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                            </div>
                            <input
                              required
                              type="text"
                              placeholder="أدخل اسمك الثلاثي"
                              className="w-full px-5 py-4 bg-muted-bg/30 border border-brand-purple/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm font-bold"
                              value={formData.customerName}
                              onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            />
                          </div>

                          {/* Phone */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">رقم الجوال</label>
                              <span className="text-[9px] text-red-500 font-bold">* مطلوب (05xxxxxxx)</span>
                            </div>
                            <input
                              required
                              type="tel"
                              pattern="^(05|5|9665)[0-9]{8}$"
                              placeholder="05xxxxxxx"
                              className="w-full px-5 py-4 bg-muted-bg/30 border border-brand-purple/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm text-right font-bold"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>

                          {/* City */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">المدينة</label>
                              <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                            </div>
                            <select
                              required
                              className="w-full px-5 py-4 bg-muted-bg/30 border border-brand-purple/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%237c3aed%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19%209-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat"
                              value={formData.city}
                              onChange={e => setFormData({ ...formData, city: e.target.value })}
                            >
                              <option value="">اختر المدينة</option>
                              {sortedCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>

                          {/* Address */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">عنوان التوصيل (الحي والشارع)</label>
                              <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                            </div>
                            <textarea
                              required
                              placeholder="اسم الحي، اسم الشارع، تفاصيل أخرى"
                              rows={2}
                              className="w-full px-5 py-4 bg-muted-bg/30 border border-brand-purple/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all resize-none text-sm font-bold"
                              value={formData.address}
                              onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                          </div>

                          {/* Short Address */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">العنوان الوطني المختصر</label>
                              <span className="text-[9px] text-red-500 font-bold">* مطلوب (مثال: AB1234)</span>
                            </div>
                            <input
                              required
                              type="text"
                              placeholder="AB1234"
                              className="w-full px-5 py-4 bg-muted-bg/30 border border-brand-purple/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm uppercase font-black tracking-widest"
                              value={formData.shortAddress}
                              onChange={e => setFormData({ ...formData, shortAddress: e.target.value.toUpperCase() })}
                            />
                          </div>
                        </>
                      )}

                      {/* Shipping Methods */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple">طريقة الشحن المتوفرة لمدينتك</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {availableShipping.length > 0 ? (
                            availableShipping.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedShippingId(opt.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedShippingId === opt.id ? 'bg-brand-purple/5 border-brand-purple ring-1 ring-brand-purple' : 'bg-white border-border-subtle hover:border-gray-300'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${selectedShippingId === opt.id ? 'bg-brand-purple text-white' : 'bg-muted-bg text-gray-400'}`}>
                                    <Truck className="w-4 h-4" />
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-xs font-black ${selectedShippingId === opt.id ? 'text-brand-purple' : 'text-charcoal'}`}>{opt.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{opt.estimatedDays}</p>
                                  </div>
                                </div>
                                <span className={`text-xs font-black ${selectedShippingId === opt.id ? 'text-brand-purple' : 'text-charcoal'}`}>
                                  {opt.cost === 0 ? 'مجاني' : `${opt.cost} ر.س`}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 bg-red-50 border border-dashed border-red-200 rounded-2xl text-center">
                              <p className="text-[10px] text-red-500 font-bold">
                                {formData.city ? 'عذراً، لا توجد وسيلة شحن متوفرة لهذه المدينة حالياً' : 'يرجى اختيار المدينة أولاً لإظهار خيارات الشحن'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => handleOrderSubmission(e)}
                        className="py-6 bg-green-600 text-white rounded-3xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-5 h-5" />
                            تأكيد الطلب وإصدار الفاتورة (PDF)
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-4 text-xs font-bold text-gray-400 hover:text-charcoal transition-colors underline underline-offset-4"
                      >
                        إلغاء والعودة
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  );
}
