import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShoppingCart, X, Info, AlertTriangle } from 'lucide-react';

interface ToastNotificationProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'cart' | 'announcement' | 'info' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}

export default function ToastNotification({
  show,
  onClose,
  title,
  message,
  type,
  actionLabel,
  onAction
}: ToastNotificationProps) {
  const getIcon = () => {
    switch (type) {
      case 'cart': return <ShoppingCart className="w-5 h-5 text-brand-purple" />;
      case 'announcement': return <Bell className="w-5 h-5 text-gold" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-brand-teal" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'cart': return 'bg-brand-purple/5 border-brand-purple/20';
      case 'announcement': return 'bg-gold/5 border-gold/20';
      case 'warning': return 'bg-red-50 border-red-200';
      default: return 'bg-brand-teal/5 border-brand-teal/20';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%', scale: 0.95 }}
          className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
        >
          <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${getBg()} bg-white/95 flex flex-col gap-4`}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {getIcon()}
              </div>
              <div className="flex-1 text-right">
                <h4 className="text-sm font-black text-charcoal mb-1">{title}</h4>
                <p className="text-xs text-gray-500 font-bold leading-relaxed">{message}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {actionLabel && (
              <button
                onClick={() => {
                  onAction?.();
                  onClose();
                }}
                className="w-full py-3 bg-charcoal text-white rounded-2xl text-xs font-black hover:bg-charcoal/90 transition-all active:scale-95 shadow-lg shadow-charcoal/20"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
