import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      bg: 'bg-[#FFF8F7]',
      border: 'border-[#F5C2BC]',
      icon: <AlertTriangle size={24} className="text-[#B42318]" />,
      btn: 'bg-[#B42318] hover:bg-[#912018] text-white',
    },
    warning: {
      bg: 'bg-[#FDF1DD]',
      border: 'border-[#F5D8A0]',
      icon: <AlertCircle size={24} className="text-[#94560A]" />,
      btn: 'bg-[#94560A] hover:bg-[#784508] text-white',
    },
    info: {
      bg: 'bg-[#EEF2FD]',
      border: 'border-[#CBD7F6]',
      icon: <Info size={24} className="text-[#4164D9]" />,
      btn: 'bg-[#4164D9] hover:bg-[#2F4FBF] text-white',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1530]/60 backdrop-blur-xs font-onest animate-fade-in">
      <div className="w-full max-w-[440px] bg-white border border-[#DDE2EC] rounded-[16px] shadow-2xl overflow-hidden p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-[44px] h-[44px] rounded-[12px] ${iconConfig.bg} border ${iconConfig.border} flex items-center justify-center shrink-0`}
            >
              {iconConfig.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="font-extrabold text-[18px] text-[#0B1530] leading-[24px]">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[#77839F] hover:text-[#0B1530] hover:bg-[#F3F5F9] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-[14px] leading-[22px] text-[#4A5675]">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-[42px] px-4 rounded-[10px] bg-white border border-[#DDE2EC] hover:bg-[#F3F5F9] text-[#0B1530] font-bold text-[14px] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-[42px] px-5 rounded-[10px] ${iconConfig.btn} font-bold text-[14px] transition-colors cursor-pointer shadow-sm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
