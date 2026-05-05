import { X, Send, Landmark, Copy, CheckCircle2, MessageCircle, Mail, Smartphone, Image as ImageIcon, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { BANK_DETAILS, PAYMENT_METHODS } from '../constants';
import { CartItem, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ImageEditorModal from './ImageEditorModal';

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
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);

  const [preferredMethod, setPreferredMethod] = useState<'whatsapp' | 'email' | null>(null);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 20 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToEdit(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOrderSubmission = async (e: FormEvent, preference: 'whatsapp' | 'email') => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save to Firestore
      const orderData = {
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
        total,
        status: 'pending',
        paymentMethod: selectedMethod.bankName,
        hasReceipt: !!receiptImage,
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
        `*طريقة الدفع:* ${selectedMethod.bankName}\n` +
        `*الإجمالي:* ${total} ر.س\n\n` +
        `${receiptImage ? '*تم إرفاق إيصال التحويل بداخل النظام*' : '*سأقوم بإرسال إيصال التحويل الآن*'}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${BANK_DETAILS.whatsappNumber}?text=${encodedMessage}`;
      
      const subject = `طلب جديد - ${formData.customerName}`;
      const emailBody = `الاسم: ${formData.customerName}\nالجوال: ${formData.phone}\nالعنوان: ${formData.address}\n\nتفاصيل الطلب:\n${cartItems.map(i => `${i.name} x${i.quantity}`).join('\n')}\n\nالإجمالي: ${total} ر.س`;
      const mailtoUrl = `mailto:hayat.desiign@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

      setOrderUrls({ whatsappUrl, mailtoUrl });
      setPreferredMethod(preference);
      
      if (preference === 'whatsapp') {
        window.open(whatsappUrl, '_blank');
      }
      
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
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
                      {preferredMethod === 'whatsapp' ? (
                        <a 
                          href={orderUrls.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                          <MessageCircle className="w-5 h-5" />
                          إرسال عبر واتساب
                        </a>
                      ) : (
                        <div className="space-y-3">
                          <a 
                            href={orderUrls.mailtoUrl}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-purple text-white rounded-2xl font-bold hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20 w-full"
                          >
                            <Mail className="w-5 h-5" />
                            فتح تطبيق البريد
                          </a>
                          <button 
                            onClick={() => {
                              const body = decodeURIComponent(orderUrls.mailtoUrl.split('body=')[1] || '');
                              handleCopyValue(body);
                              alert('تم نسخ تفاصيل الطلب! يمكنك الآن لصقها في إيميل يدوي إذا لم يفتح التطبيق تلقائياً');
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-muted-bg text-charcoal rounded-2xl font-bold text-xs hover:bg-gold-light/20 transition-colors w-full border border-border-subtle"
                          >
                            <Copy className="w-4 h-4 text-gold" />
                            نسخ تفاصيل الطلب (حل بديل)
                          </button>
                        </div>
                      )}
                    </>
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
                  <div className="space-y-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">بيانات التوصيل والطلب</h3>
                      {!userProfile && (
                        <button 
                          type="button" 
                          onClick={onClose}
                          className="text-[10px] font-bold text-brand-purple hover:underline"
                        >
                          تعديل البيانات؟
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Name */}
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

                      {/* Phone */}
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

                      {/* Address */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">عنوان التوصيل / الاستلام</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                        </div>
                        <textarea
                          required
                          placeholder="المدينة، الحي، اسم الشارع، تفاصيل أخرى"
                          rows={2}
                          className="w-full px-5 py-4 bg-muted-bg/30 border border-border-subtle rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all resize-none text-sm"
                          value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>

                      {/* Receipt Upload */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">إيصال التحويل</label>
                          <span className="text-[9px] text-red-500 font-bold">* مطلوب</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="file"
                            accept="image/*"
                            required
                            onChange={handleImageUpload}
                            className="hidden"
                            id="checkout-receipt-upload"
                          />
                          <label 
                            htmlFor="checkout-receipt-upload"
                            className={`flex items-center justify-between px-5 py-4 border border-dashed rounded-3xl cursor-pointer transition-all ${receiptImage ? 'bg-brand-teal/5 border-brand-teal' : 'bg-muted-bg/30 border-border-subtle hover:bg-gold-light/20'}`}
                          >
                            <span className={`text-xs font-bold truncate ${receiptImage ? 'text-brand-teal' : 'text-gray-500'}`}>
                              {receiptImage ? 'تم اختيار صورة الإيصال بنجاح' : 'اضغط لرفع صورة الإيصال (إلزامي)'}
                            </span>
                            <ImageIcon className={`w-4 h-4 ${receiptImage ? 'text-brand-teal' : 'text-gray-400'}`} />
                          </label>
                          {receiptImage && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={receiptImage} className="w-12 h-12 object-cover rounded-xl border border-border-subtle" alt="Preview" />
                              <button 
                                type="button"
                                onClick={() => setReceiptImage(null)}
                                className="text-[9px] font-bold text-red-500 hover:underline"
                              >
                                إزالة الصورة
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting || !formData.customerName || !formData.phone || !formData.address || !receiptImage}
                        onClick={(e) => handleOrderSubmission(e, 'whatsapp')}
                        className="py-4 bg-green-600 text-white rounded-2xl font-bold text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? 'جاري...' : (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            إرسال عبر واتساب
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || !formData.customerName || !formData.phone || !formData.address || !receiptImage}
                        onClick={(e) => handleOrderSubmission(e, 'email')}
                        className="py-4 bg-brand-purple text-white rounded-2xl font-bold text-xs hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? 'جاري...' : (
                          <>
                            <Mail className="w-4 h-4" />
                            إرسال عبر الايميل
                          </>
                        )}
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
      <ImageEditorModal 
        isOpen={!!imageToEdit}
        image={imageToEdit || ''}
        onClose={() => setImageToEdit(null)}
        onSave={(cropped) => {
          setReceiptImage(cropped);
          setImageToEdit(null);
        }}
      />
    </>
  );
}
