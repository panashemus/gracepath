import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

export interface ToastState {
  visible: boolean;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (toast.visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 2800);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [toast]);

  if (!toast.visible) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink-900 px-5 py-2.5 text-sm text-white shadow-card transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-sage-400" />
        {toast.message}
      </div>
    </div>
  );
}

export { X };
