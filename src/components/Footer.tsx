import { Instagram, Twitter, Mail, Phone, Settings, MessageCircle } from 'lucide-react';
import { BANK_DETAILS } from '../constants';

interface FooterProps {
  onAdminOpen?: () => void;
}

export default function Footer({ onAdminOpen }: FooterProps) {
  return (
    <footer id="contact" className="bg-white border-t border-border-subtle py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-border-subtle pb-16 text-right">
          <div className="md:col-span-1">
            <div className="flex items-center justify-end gap-3 mb-6">
              <span className="text-2xl font-bold tracking-tighter text-gold">حياة ديزاين</span>
            </div>
            <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6 uppercase tracking-widest">
              نحن مؤسسة سعودية متخصصة في الإنتاج الفني المبتكر. نسعى لإثراء مساحاتكم عبر تصاميم فريدة تعكس شخصيتكم.
            </p>
            <div className="flex items-center justify-end gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-muted-bg transition-colors">
                <Instagram className="w-4 h-4 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-muted-bg transition-colors">
                <Twitter className="w-4 h-4 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center hover:bg-muted-bg transition-colors">
                <Mail className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] mb-8 text-gold">روابط سريعة</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <li><a href="#home" className="hover:text-gold transition-colors">الرئيسية</a></li>
              <li><a href="#categories" className="hover:text-gold transition-colors">أقسامنا</a></li>
              <li><a href="#products" className="hover:text-gold transition-colors">منتجاتنا</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] mb-8 text-gold">منتجاتنا</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <li><a href="#" className="hover:text-gold transition-colors">الأعمال الخشبية</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">منتجات الأكريليك</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">حوامل الجوال</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.3em] mb-8 text-gold">تواصل معنا</h4>
            <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <li className="flex items-center justify-end gap-3 group">
                <a 
                  href={`https://wa.me/${BANK_DETAILS.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-green-500 transition-colors"
                >
                  <span>{BANK_DETAILS.phoneNumber}</span>
                  <MessageCircle className="w-4 h-4 text-green-500" />
                </a>
                <Phone className="w-4 h-4 text-gold group-hover:text-gold" />
              </li>
              <li className="flex items-center justify-end gap-3">
                <span>hayat.desiign@gmail.com</span>
                <Mail className="w-4 h-4 text-gold" />
              </li>
              {onAdminOpen && (
                <li className="pt-4 mt-4 border-t border-border-subtle">
                  <button 
                    onClick={onAdminOpen}
                    className="flex items-center justify-end gap-2 text-brand-purple hover:text-brand-teal transition-colors w-full"
                  >
                    <span>إدارة المتجر</span>
                    <Settings className="w-4 h-4" />
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-300 font-bold uppercase tracking-[0.4em] text-center">
          <p>© 2026 حياة ديزاين. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <span>صُنع بشغف لبيت المبدعين</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
