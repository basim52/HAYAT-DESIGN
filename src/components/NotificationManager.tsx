import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import ToastNotification from './ToastNotification';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface NotificationSettings {
  cartReminderEnabled: boolean;
  cartReminderMinutes: number;
  cartReminderTitle: string;
  cartReminderMessage: string;
  maxReminders: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'popup' | 'banner';
  active: boolean;
}

interface NotificationManagerProps {
  cartCount: number;
  onOpenCart: () => void;
}

export default function NotificationManager({ cartCount, onOpenCart }: NotificationManagerProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ title: '', message: '', type: 'info' as any, actionLabel: '', onAction: () => {} });
  
  const remindersCount = useRef<number>(0);
  const cartTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCartCount = useRef(cartCount);

  // Fetch Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'notifications'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as NotificationSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'config/notifications'));
    return unsub;
  }, []);

  // Fetch Announcements
  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(docs);
      if (docs.length > 0 && !currentAnnouncement) {
        // Show first active announcement
        setToastData({
          title: docs[0].title,
          message: docs[0].message,
          type: 'announcement',
          actionLabel: 'حسناً',
          onAction: () => {}
        });
        setShowToast(true);
        setCurrentAnnouncement(docs[0]);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'announcements'));
    return unsub;
  }, [currentAnnouncement]);

  // Cart Reminder Logic
  useEffect(() => {
    if (!settings || !settings.cartReminderEnabled) return;

    // Reset reminders if cart becomes empty
    if (cartCount === 0) {
      remindersCount.current = 0;
      if (cartTimer.current) clearTimeout(cartTimer.current);
      return;
    }

    // If items were added, reset timer
    if (cartCount > lastCartCount.current) {
      if (cartTimer.current) clearTimeout(cartTimer.current);
      
      const delay = settings.cartReminderMinutes * 60 * 1000;
      cartTimer.current = setTimeout(() => {
        if (remindersCount.current < settings.maxReminders) {
          setToastData({
            title: settings.cartReminderTitle || 'سلة المشتريات تنتظرك!',
            message: settings.cartReminderMessage || 'لديك منتجات رائعة في سلتك، لا تفوت فرصة اقتنائها الآن.',
            type: 'cart',
            actionLabel: 'عرض السلة',
            onAction: onOpenCart
          });
          setShowToast(true);
          remindersCount.current += 1;
        }
      }, delay);
    }

    lastCartCount.current = cartCount;

    return () => {
      if (cartTimer.current) clearTimeout(cartTimer.current);
    };
  }, [cartCount, settings, onOpenCart]);

  return (
    <ToastNotification
      show={showToast}
      onClose={() => setShowToast(false)}
      title={toastData.title}
      message={toastData.message}
      type={toastData.type}
      actionLabel={toastData.actionLabel}
      onAction={toastData.onAction}
    />
  );
}
