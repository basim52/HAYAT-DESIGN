import { motion } from 'motion/react';
import { Category } from '../types';

interface CategoriesProps {
  categories: Category[];
}

export default function Categories({ categories }: CategoriesProps) {
  return (
    <section id="categories" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold mb-4 text-charcoal tracking-tighter"
          >
            استعرض <span className="text-gold">أقسامنا</span> الفنية
          </motion.h2>
          <div className="w-12 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative group cursor-pointer overflow-hidden rounded-[32px] aspect-[4/5] border border-border-subtle lux-shadow"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-white text-xl font-bold mb-2">{category.name}</h3>
                  <div className="w-0 group-hover:w-full h-0.5 bg-gold transition-all duration-500" />
                  <p className="text-white/60 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">اكتشف المنتجات</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
