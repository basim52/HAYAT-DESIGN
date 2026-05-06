import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import ToastNotification from './ToastNotification';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface ReminderStage {
  id: string;
  delayMinutes: number;
  title: string;
  message: string;
}

interface NotificationSettings {
  cartReminderEnabled: boolean;
  reminders: ReminderStage[];
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'popup' | 'banner';
  position?: 'top' | 'center' | 'bottom';
  platform?: 'web' | 'mobile' | 'both';
  active: boolean;
  maxViews?: number;
  autoHideSeconds?: number;
  startDate?: string;
  endDate?: string;
}

interface NotificationManagerProps {
  cartCount: number;
  onOpenCart: () => void;
}

export default function NotificationManager({ cartCount, onOpenCart }: NotificationManagerProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<'web' | 'mobile'>('web');
  const [toastData, setToastData] = useState({ 
    title: '', 
    message: '', 
    type: 'info' as any, 
    actionLabel: '', 
    onAction: () => {},
    position: 'bottom' as 'top' | 'center' | 'bottom',
    platform: 'both' as 'web' | 'mobile' | 'both'
  });
  
  const remindersTimers = useRef<NodeJS.Timeout[]>([]);
  const shownReminders = useRef<Set<string>>(new Set());
  const lastCartCount = useRef(cartCount);

  // Platform detection
  useEffect(() => {
    const checkPlatform = () => {
      setCurrentPlatform(window.innerWidth <= 768 ? 'mobile' : 'web');
    };
    checkPlatform();
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
  }, []);

  // Fetch Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'notifications'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.reminders) {
          data.reminders = [
            { id: '1', delayMinutes: 15, title: 'سلة المشتريات تنتظرك!', message: 'لديك منتجات رائعة في سلتك، لا تفوت فرصة اقتنائها الآن.' },
            { id: '2', delayMinutes: 300, title: 'ما زلنا ننتظرك!', message: 'منتجاتك المفضلة لا تزال بانتظارك، أكمل طلبك الآن.' },
            { id: '3', delayMinutes: 1440, title: 'الفرصة الأخيرة!', message: 'أكمل طلبك قبل نفاذ الكمية، نحن متحمسون لخدمتك.' }
          ];
        }
        setSettings(data as NotificationSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'config/notifications'));
    return unsub;
  }, []);

  // Fetch and show Announcements with enhanced logic
  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const allAnnouncements = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      const now = new Date();

      // Find first valid announcement
      const validAnnouncement = allAnnouncements.find(ann => {
        // 1. Check Platform targeting
        if (ann.platform && ann.platform !== 'both' && ann.platform !== currentPlatform) return false;

        // 2. Check Dates
        if (ann.startDate && new Date(ann.startDate) > now) return false;
        if (ann.endDate && new Date(ann.endDate) < now) return false;

        // 3. Check Max Views
        if (ann.maxViews) {
          const views = parseInt(localStorage.getItem(`ann_views_${ann.id}`) || '0');
          if (views >= ann.maxViews) return false;
        }

        return true;
      });

      if (validAnnouncement) {
        setToastData({
          title: validAnnouncement.title,
          message: validAnnouncement.message,
          type: validAnnouncement.type === 'popup' ? 'announcement' : 'info',
          actionLabel: 'حسناً',
          onAction: () => {},
          position: validAnnouncement.position || 'bottom',
          platform: validAnnouncement.platform || 'both'
        });
        setShowToast(true);

        // Update view count
        const currentViews = parseInt(localStorage.getItem(`ann_views_${validAnnouncement.id}`) || '0');
        localStorage.setItem(`ann_views_${validAnnouncement.id}`, (currentViews + 1).toString());

        // Auto hide if configured
        if (validAnnouncement.autoHideSeconds) {
          setTimeout(() => setShowToast(false), validAnnouncement.autoHideSeconds * 1000);
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'announcements'));
    
    return unsub;
  }, []);

  // Cart Reminder Logic (3-stage)
  useEffect(() => {
    if (!settings || !settings.cartReminderEnabled || !settings.reminders) return;

    // Reset reminders if cart becomes empty
    if (cartCount === 0) {
      shownReminders.current.clear();
      remindersTimers.current.forEach(t => clearTimeout(t));
      remindersTimers.current = [];
      return;
    }

    // If items were added, schedule all eligible reminders
    if (cartCount > lastCartCount.current) {
      // Clear existing timers
      remindersTimers.current.forEach(t => clearTimeout(t));
      remindersTimers.current = [];
      
      settings.reminders.forEach(reminder => {
        const timer = setTimeout(() => {
          // Double check if cart is still not empty
          if (shownReminders.current.has(reminder.id)) return;

          setToastData({
            title: reminder.title,
            message: reminder.message,
            type: 'cart',
            actionLabel: 'عرض السلة',
            onAction: onOpenCart,
            position: 'bottom'
          });
          setShowToast(true);
          shownReminders.current.add(reminder.id);
        }, reminder.delayMinutes * 60 * 1000);
        
        remindersTimers.current.push(timer);
      });
    }

    lastCartCount.current = cartCount;

    return () => {
      remindersTimers.current.forEach(t => clearTimeout(t));
    };
  }, [cartCount, settings, onOpenCart, currentPlatform]);

  return (
    <ToastNotification
      show={showToast}
      onClose={() => setShowToast(false)}
      title={toastData.title}
      message={toastData.message}
      type={toastData.type}
      actionLabel={toastData.actionLabel}
      onAction={toastData.onAction}
      position={toastData.position}
    />
  );
}
