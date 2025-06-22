
import React from 'react';
import { BN_UI_TEXT } from '../constants';
import ListChecksIcon from './icons/ListChecksIcon';

interface InvoiceHomeCardProps {
  onOpenInvoiceListModal: () => void;
  invoiceCount?: number; 
}

const InvoiceHomeCard: React.FC<InvoiceHomeCardProps> = ({ onOpenInvoiceListModal, invoiceCount }) => {
  return (
    <div
      onClick={onOpenInvoiceListModal}
      className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col items-center text-center h-full transform hover:scale-105"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenInvoiceListModal(); }}
      aria-label={`${BN_UI_TEXT.VIEW_INVOICES_NAV_BTN}, ${BN_UI_TEXT.INVOICE_HOME_CARD_SUBTITLE}`}
    >
      <ListChecksIcon className="w-10 h-10 text-indigo-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {BN_UI_TEXT.VIEW_INVOICES_NAV_BTN}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed flex-grow">
        {BN_UI_TEXT.INVOICE_HOME_CARD_SUBTITLE}
      </p>
      {typeof invoiceCount === 'number' && ( // Only display if count is provided
        <p className="text-base font-bold text-indigo-600 mt-3 pt-2 border-t border-slate-100 w-full">
          {BN_UI_TEXT.TOTAL_INVOICES_COUNT_LABEL}: {invoiceCount.toLocaleString('bn-BD')}
        </p>
      )}
    </div>
  );
};

export default InvoiceHomeCard;
