import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { WATER_SAFETY_DISCLAIMER_TEXT } from '../../utils/constants';

interface DisclaimerBannerProps {
  customText?: string;
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  customText,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold text-amber-950 mb-0.5">Mandatory Water Safety Disclaimer</p>
          <p className="text-amber-900/90">
            {customText || WATER_SAFETY_DISCLAIMER_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
};
