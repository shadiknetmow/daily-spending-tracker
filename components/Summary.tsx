import React from 'react';
import { BN_UI_TEXT } from '../constants'; // Updated path, points to constants.ts which imports from new i18n structure

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
  onClick?: () => void; 
  isClickable?: boolean; 
  ariaLabelDetails?: string; 
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass, onClick, isClickable, ariaLabelDetails }) => (
  <div 
    className={`p-4 sm:p-6 rounded-lg shadow-lg text-center ${colorClass} ${isClickable ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out' : ''}`}
    onClick={onClick}
    role={isClickable ? "button" : undefined}
    tabIndex={isClickable ? 0 : undefined}
    onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    aria-label={isClickable ? `${title}, ${ariaLabelDetails || `مقدار ${amount.toLocaleString('bn-BD')} টাকা, বিস্তারিত দেখতে ক্লিক করুন`}` : title}
  >
    <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-1 sm:mb-2">{title}</h3>
    <p className="text-2xl sm:text-3xl font-bold">
      {BN_UI_TEXT.BDT_SYMBOL} {amount.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

interface SummaryProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalPayable: number;
  totalReceivable: number;
  onOpenReceivablePersonsModal: () => void;
  onOpenPayablePersonsModal: () => void; 
}

const Summary: React.FC<SummaryProps> = ({ 
  totalIncome, 
  totalExpense, 
  balance, 
  totalPayable, 
  totalReceivable,
  onOpenReceivablePersonsModal,
  onOpenPayablePersonsModal 
}) => {
  return (
    <section aria-labelledby="summary-heading" className="my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 id="summary-heading" className="sr-only">Financial Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard title={BN_UI_TEXT.SUMMARY_TOTAL_INCOME} amount={totalIncome} colorClass="bg-green-100 text-green-700" />
        <SummaryCard title={BN_UI_TEXT.SUMMARY_TOTAL_EXPENSE} amount={totalExpense} colorClass="bg-red-100 text-red-700" />
        <SummaryCard 
          title={BN_UI_TEXT.SUMMARY_CURRENT_BALANCE} 
          amount={balance} 
          colorClass={balance >= 0 ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700"}
        />
        <SummaryCard 
          title={BN_UI_TEXT.TOTAL_RECEIVABLE}
          amount={totalReceivable} 
          colorClass="bg-green-100 text-green-700"
          onClick={onOpenReceivablePersonsModal} 
          isClickable={true} 
          ariaLabelDetails={`মোট পাওনা ${totalReceivable.toLocaleString('bn-BD')} টাকা, বিস্তারিত দেখতে ক্লিক করুন`}
        />
        <SummaryCard 
          title={BN_UI_TEXT.TOTAL_PAYABLE}
          amount={totalPayable} 
          colorClass="bg-red-100 text-red-700"
          onClick={onOpenPayablePersonsModal} 
          isClickable={true} 
          ariaLabelDetails={`মোট দেনা ${totalPayable.toLocaleString('bn-BD')} টাকা, বিস্তারিত দেখতে ক্লিক করুন`}
        />
      </div>
    </section>
  );
};

export default Summary;
