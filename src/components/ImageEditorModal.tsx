
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCw, Maximize, Scissors } from 'lucide-react';
import { getCroppedImg } from '../lib/imageUtils';

interface ImageEditorModalProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

export default function ImageEditorModal({ image, isOpen, onClose, onSave }: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onSave(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء معالجة الصورة');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-20 bg-white z-[1001] rounded-[40px] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-muted-bg/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-purple/10 rounded-xl text-brand-purple">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">تعديل الصورة</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">قص وتعديل أبعاد الصورة</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative flex-1 bg-gray-900">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1} // You can change this to 16/9 or whatever is needed
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">التكبير</span>
                    <span className="text-xs font-bold text-brand-purple">{(zoom * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Maximize className="w-4 h-4 text-gray-300" />
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-brand-purple h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">التدوير</span>
                    <span className="text-xs font-bold text-brand-purple">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <RotateCw className="w-4 h-4 text-gray-300" />
                    <input
                      type="range"
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="Rotation"
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="flex-1 accent-brand-purple h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={isProcessing}
                  onClick={handleSave}
                  className="flex-1 bg-brand-purple text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-brand-purple/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  <span>تأكيد وحفظ الصورة</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
