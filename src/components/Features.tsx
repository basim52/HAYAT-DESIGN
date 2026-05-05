import React from 'react';
import { Truck, MessageCircle, ShieldCheck, Zap, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { BANK_DETAILS } from '../constants';

export default function Features() {
  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "توصيل سريع",
      description: "استلم طلبك في وقت قياسي",
      link: null,
      color: "bg-brand-purple"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "خدمة العملاء",
      description: "تواصل معنا في أي وقت عبر الواتساب",
      link: `https://wa.me/${BANK_DETAILS.whatsappNumber}`,
      color: "bg-[#25D366]"
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "تسوق آمن",
      description: "استمتع بتجربة آمنة وخصوصية تامة",
      link: null,
      color: "bg-brand-purple"
    }
  ];

  return (
    <section className="py-20 bg-[#F8F9FA]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {feature.link ? (
                <a 
                  href={feature.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white p-12 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 text-center group border border-gray-50"
                >
                  <FeatureContent feature={feature} />
                </a>
              ) : (
                <div className="bg-white p-12 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 text-center group border border-gray-50">
                  <FeatureContent feature={feature} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureContent({ feature }: { feature: { icon: React.ReactNode, title: string, description: string, color: string } }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
        {feature.icon}
      </div>
      <h3 className="text-lg font-black text-charcoal mb-2 tracking-tight">{feature.title}</h3>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{feature.description}</p>
    </div>
  );
}
