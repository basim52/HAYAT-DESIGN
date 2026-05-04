import { Category, Product } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'أعمال خشبية',
    slug: 'wood-work',
    image: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-2',
    name: 'منتجات أكريليك',
    slug: 'acrylic-products',
    image: 'https://images.unsplash.com/photo-1579546671170-735c0997184b?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-3',
    name: 'تصاميم ورقية بالكاميو',
    slug: 'cameo-designs',
    image: 'https://images.unsplash.com/photo-1517260911058-0fcfd733702f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'cat-4',
    name: 'تصاميم حسب الطلب',
    slug: 'custom-designs',
    image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800&auto=format&fit=crop',
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'لوحة خشبية محفورة بالليزر',
    category: 'أعمال خشبية',
    description: 'لوحة فنية مميزة محفورة بدقة عالية على خشب السنديان الطبيعي.',
    price: 150,
    image: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'p2',
    name: 'منظم مكتب أكريليك شفاف',
    category: 'منتجات أكريليك',
    description: 'منظم مكتب عصري وأنيق مصنوع من الأكريليك الفاخر المقاوم للخدش.',
    price: 85,
    image: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'p3',
    name: 'كرت دعوة ورقي مفرغ بالكاميو',
    category: 'تصاميم ورقية بالكاميو',
    description: 'كرت دعوة فاخر بتفاصيل دقيقة ومفرغة باستخدام تقنية الكاميو على ورق مقوى.',
    price: 35,
    image: 'https://images.unsplash.com/photo-1517260911058-0fcfd733702f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'p4',
    name: 'ساعة حائط أكريليك مذهبة',
    category: 'منتجات أكريليك',
    description: 'ساعة حائط فريدة تجمع بين الأكريليك واللون الذهبي الفاخر.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'p5',
    name: 'درع تذكاري حسب الطلب',
    category: 'تصاميم حسب الطلب',
    description: 'نصمم لك درعاً تذكارياً يعبر عن مشاعرك بكل دقة وإبداع.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1579546671170-735c0997184b?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'p6',
    name: 'صندوق هدايا خشبي مزخرف',
    category: 'أعمال خشبية',
    description: 'صندوق خشبي فاخر مزين بزخارف إسلامية محفورة بالليزر.',
    price: 120,
    image: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=800&auto=format&fit=crop',
  },
];

export const BANK_DETAILS = {
  bankName: 'بنك الراجحي',
  accountName: 'مؤسسة حياة ديزاين للإنتاج الفني',
  iban: 'SA03 8000 0000 1234 5678 9012',
  whatsappNumber: '966530593770',
  phoneNumber: '+966 53 059 3770',
};
