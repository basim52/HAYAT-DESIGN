import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Policies() {
  const orderPolicies = [
    "ارسال تفاصيل الطلب واضحة مع ارفاق صور ان امكن",
    "ارسال تفاصيل الطلب كتابة وليس برسالة صوتية",
    "مرات التعديل مرتين فقط والباقي بزيادة المبلغ",
    "لا يعتمد الطلب الا بتحويل المبلغ كاملًا",
    "تصميم ملف Pdf جديد للثيمات عليه مبلغ مالي",
    "يرجى طلب حركة البروز ثري دي في الثيمات قبل الاعتماد والدفع"
  ];

  const designPolicies = [
    "التصميم الجديد | المرسل من قبل العميلة ٢٠ ريال",
    "التصميم الجاهز من الحساب ١٠ ريال",
    "تصميم ملف Pdf جديد للثيمات عليه مبلغ مالي",
    "مرات التعديل مرتين فقط والباقي بزيادة المبلغ",
    "لا يمكن طلب حركة البروز الثري دي بعد الانتهاء من التصميم"
  ];

  return (
    <section id="policies" className="py-24 bg-muted-bg/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-light/20 rounded-full text-gold text-[10px] font-extrabold uppercase tracking-widest mb-6"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>سياسات المتجر</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl tracking-tighter mb-4 text-charcoal font-bold">اتفاقية التعامل</h2>
          <div className="w-20 h-1 bg-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Order Policy Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[40px] border border-border-subtle shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all group"
          >
            <div className="flex items-center justify-end gap-3 mb-8">
              <h3 className="text-xl font-bold text-charcoal">سياسة الطلب</h3>
              <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center group-hover:bg-brand-purple group-hover:text-white transition-colors">
                <FileText className="w-6 h-6 text-brand-purple group-hover:text-white" />
              </div>
            </div>
            
            <ul className="space-y-4 text-right">
              {orderPolicies.map((policy, index) => (
                <li key={index} className="flex items-start justify-end gap-3 group/item">
                  <span className="text-sm font-bold text-gray-500 leading-relaxed group-hover/item:text-charcoal transition-colors">{policy}</span>
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Design Policy Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[40px] border border-border-subtle shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all group"
          >
            <div className="flex items-center justify-end gap-3 mb-8">
              <h3 className="text-xl font-bold text-charcoal">سياسة التصميم</h3>
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center group-hover:bg-brand-teal group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6 text-brand-teal group-hover:text-white" />
              </div>
            </div>
            
            <ul className="space-y-4 text-right">
              {designPolicies.map((policy, index) => (
                <li key={index} className="flex items-start justify-end gap-3 group/item">
                  <span className="text-sm font-bold text-gray-500 leading-relaxed group-hover/item:text-charcoal transition-colors">{policy}</span>
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
