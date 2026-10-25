import React from 'react';
import {
  Wifi,
  Zap,
  Monitor,
  Shield,
  Home,
  Droplet,
  GraduationCap,
  Building2,
  Receipt,
} from 'lucide-react';
import { BillIconType } from '../data/initialData';

interface BillIconProps {
  type: BillIconType;
  className?: string;
  size?: number;
}

export const BillIcon: React.FC<BillIconProps> = ({ type, className = '', size = 19 }) => {
  switch (type) {
    case 'wifi':
      return <Wifi size={size} strokeWidth={1.8} className={className} />;
    case 'bolt':
      return <Zap size={size} strokeWidth={1.8} className={className} />;
    case 'monitor':
      return <Monitor size={size} strokeWidth={1.8} className={className} />;
    case 'shield':
      return <Shield size={size} strokeWidth={1.8} className={className} />;
    case 'house':
      return <Home size={size} strokeWidth={1.8} className={className} />;
    case 'drop':
      return <Droplet size={size} strokeWidth={1.8} className={className} />;
    case 'grad':
      return <GraduationCap size={size} strokeWidth={1.8} className={className} />;
    case 'building':
      return <Building2 size={size} strokeWidth={1.8} className={className} />;
    case 'receipt':
      return <Receipt size={size} strokeWidth={1.8} className={className} />;
    default:
      return <Home size={size} strokeWidth={1.8} className={className} />;
  }
};

export const BillzaLogo: React.FC<{ collapsed?: boolean; variant?: 'light' | 'dark' }> = ({
  collapsed = false,
  variant = 'dark',
}) => {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center w-[42px] h-[28px] bg-[#4164D9] rounded-[3px] select-none">
        <span className="font-archivo font-extrabold text-[22px] leading-[22px] tracking-[-0.48px] text-white">
          za
        </span>
      </div>
    );
  }

  const billTextColor = variant === 'light' ? 'text-[#0B1530]' : 'text-white';

  return (
    <div className="inline-flex items-baseline gap-[2.5px] h-[28px] select-none">
      <span className={`font-archivo font-extrabold text-[26px] leading-[26px] tracking-[-0.52px] ${billTextColor}`}>
        bill
      </span>
      <span className="relative inline-flex items-center justify-center bg-[#4164D9] rounded-r-[2.75px] px-[5px] pt-[0.5px] pb-[1.5px] h-[28px]">
        <span className="font-archivo font-extrabold text-[26px] leading-[26px] tracking-[-0.52px] text-white">
          za
        </span>
      </span>
    </div>
  );
};
