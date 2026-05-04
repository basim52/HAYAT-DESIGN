import { X, Send, Landmark, Copy, CheckCircle2, MessageCircle, Mail, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useEffect } from 'react';
import { BANK_DETAILS, PAYMENT_METHODS } from '../constants';
import { CartItem, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  userProfile: UserProfile | null;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, userProfile }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        customerName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile, isOpen]);

  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderUrls, setOrderUrls] = useState<{ whatsappUrl: string; mailtoUrl: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOrderSubmission = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save to Firestore
      const orderData = {
        userId: userProfile?.id || 'guest',
        ...formData,
        items: cartItems,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'orders'), orderData);

      const itemsList = cartItems
        .map(item => `• ${item.name} (الكمية: ${item.quantity}) - السعر: ${item.price * item.quantity} ر.س`)
        .join('\n');

      const message = `*طلب جديد من حياة ديزاين*\n\n` +
        `*بيانات العميل:*\n` +
        `الاسم: ${formData.customerName}\n` +
        `رقم الجوال: ${formData.phone}\n` +
        `العنوان: ${formData.address}\n\n` +
        `*تفاصيل الطلب:*\n${itemsList}\n\n` +
        `*الإجمالي: ${total} ر.س*\n\n` +
        `سأقوم بإرسال صورة إيصال التحويل البنكي الآن.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${BANK_DETAILS.whatsappNumber}?text=${encodedMessage}`;
      
      const subject = `طلب جديد من حياة ديزاين - ${formData.customerName}`;
      const emailBody = message.replace(/\*/g, ''); 
      const mailtoUrl = `mailto:hayat.desiign@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

      setOrderUrls({ whatsappUrl, mailtoUrl });
      
      // Open WhatsApp by default
      window.open(whatsappUrl, '_blank');
      
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
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
                <h2 className="text-3xl font-bold">تم تسجيل طلبك!</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                  لقد حفظنا بيانات طلبك في النظام بجاح. يرجى إتمام الإرسال عبر إحدى الوسائل التالية لتأكيد الدفع:
                </p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  {orderUrls && (
                    <>
                      <a 
                        href={orderUrls.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        إرسال عبر واتساب
                      </a>
                      <a 
                        href={orderUrls.mailtoUrl}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-purple text-white rounded-2xl font-bold hover:bg-brand-purple/90 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        إرسال عبر البريد الإلكتروني
                      </a>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      setShowSuccess(false);
                      onClose();
                    }}
                    className="mt-4 text-xs font-bold text-gray-400 hover:text-charcoal transition-colors border-b border-transparent hover:border-gray-200 pb-1"
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
                  <div className="space-y-6">
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
                        {selectedMethod.type === 'bank' ? <Landmark className="w-6 h-6 text-gold" /> : <Smartphone className="w-6 h-6 text-gold" />}
                        <h3 className="font-bold">{selectedMethod.bankName}</h3>
                      </div>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-charcoal/40 mb-1">اسم الحساب</p>
                          <p className="font-bold">{selectedMethod.accountName}</p>
                        </div>
                        
                        {selectedMethod.accountNumber && (
                          <div>
                            <p className="text-charcoal/40 mb-1">رقم الحساب</p>
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

                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-green-800 leading-relaxed">
                        يرجى تحويل مبلغ <span className="font-bold">{total} ر.س</span> عبر <span className="font-bold">{selectedMethod.bankName}</span> ثم تعبئة بياناتك لإكمال الطلب.
                      </p>
                    </div>
                  </div>

                  {/* Customer Form */}
                  <form onSubmit={handleOrderSubmission} className="space-y-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">بيانات التوصيل</h3>
                      {!userProfile && (
                        <button 
                          type="button" 
                          onClick={onClose}
                          className="text-[10px] font-bold text-brand-purple hover:underline"
                        >
                          تسجيل دخول لحفظ بياناتك؟
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">الاسم الكامل</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                        </div>
                        <input
                          required
                          type="text"
                          placeholder="أدخل اسمك الثلاثي"
                          className="w-full px-5 py-4 bg-muted-bg/30 border border-border-subtle rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-sm"
                          value={formData.customerName}
                          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">رقم الجوال</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب (05xxxxxxx)</span>
                        </div>
                        <input
                          required
                          type="tel"
                          pattern="^(05|5|9665)[0-9]{8}$"
                          placeholder="05xxxxxxx"
                          className="w-full px-5 py-4 bg-muted-bg/30 border border-border-subtle rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-sm text-right"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">عنوان التوصيل / الاستلام</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                        </div>
                        <textarea
                          required
                          placeholder="المدينة، الحي، اسم الشارع، تفاصيل أخرى"
                          rows={3}
                          className="w-full px-5 py-4 bg-muted-bg/30 border border-border-subtle rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all resize-none text-sm"
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-green-600 text-white rounded-[24px] font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-xl shadow-green-600/10 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          <Send className="w-5 h-5 -rotate-45" />
                          <span>إرسال الطلب وإيصال التحويل</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
