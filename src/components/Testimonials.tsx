import { Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { Testimonial } from '../types';

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden" id="testimonials">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-16">
          <span className="text-gold font-black text-[10px] uppercase tracking-[0.3em] mb-4">آراء عملاء حياة ديزاين</span>
          <h2 className="text-4xl md:text-5xl font-black text-charcoal tracking-tighter text-center">
            كلمات من القلب
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-muted-bg rounded-[40px] p-10 pt-14 border border-border-subtle hover:border-gold/30 transition-all duration-500"
            >
              <div className="absolute top-0 right-10 -translate-y-1/2 w-12 h-12 bg-gold flex items-center justify-center text-white rounded-2xl shadow-lg shadow-gold/20">
                <Quote className="w-6 h-6" />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating ? 'fill-gold text-gold' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              <p className="text-charcoal/80 text-lg leading-relaxed mb-8 font-medium italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs">
                  {testimonial.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-charcoal">{testimonial.customerName}</h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                    {testimonial.date}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
