
import React from 'react';
import { Person, Debt } from '../types';
import { BN_UI_TEXT } from '../constants';
import DebtItem from './DebtItem'; // Re-use DebtItem for consistent display

interface PersonDebtsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  personDebts: Debt[];
  allPersons: Person[]; // Needed by DebtItem to resolve person name (even if it's the same person)
  onDeleteDebt: (id: string) => void; // Prop for DebtItem
  onToggleSettle: (id: string) => void; // Prop for DebtItem
  onEditDebt: (debt: Debt) => void; // Prop for DebtItem
  onViewDebtHistory: (debt: Debt) => void; // Prop for DebtItem
}

const PersonDebtsHistoryModal: React.FC<PersonDebtsHistoryModalProps> = ({
  isOpen,
  onClose,
  person,
  personDebts,
  allPersons,
  onDeleteDebt,
  onToggleSettle,
  onEditDebt,
  onViewDebtHistory,
}) => {
  if (!isOpen || !person) {
    return null;
  }

  const sortedDebts = [...personDebts].sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

  const modalTitle = BN_UI_TEXT.PERSON_DEBTS_HISTORY_MODAL_TITLE.replace("{personName}", person.name);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[98]" // Ensure high z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-debts-history-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="person-debts-history-modal-title" className="text-xl sm:text-2xl font-semibold text-slate-800 truncate pr-2">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full flex-shrink-0"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {person.mobileNumber && <p className="text-sm text-slate-600 mb-0.5">{BN_UI_TEXT.PERSON_MOBILE_NUMBER}: {person.mobileNumber}</p>}
        {person.shopName && <p className="text-sm text-slate-500 mb-0.5">{BN_UI_TEXT.PERSON_SHOP_NAME}: {person.shopName}</p>}
        {person.address && <p className="text-xs text-slate-500 mb-3 truncate" title={person.address}>{BN_UI_TEXT.PERSON_ADDRESS}: {person.address}</p>}
        
        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1 space-y-4">
          {sortedDebts.length === 0 ? (
            <p className="text-slate-500 text-center py-8">{BN_UI_TEXT.NO_DEBTS_FOR_PERSON}</p>
          ) : (
            <ul className="space-y-4">
              {sortedDebts.map((debt) => (
                <DebtItem
                  key={debt.id}
                  debt={debt}
                  persons={allPersons} 
                  onDeleteDebt={onDeleteDebt}
                  onToggleSettle={onToggleSettle}
                  onEditDebt={onEditDebt}
                  onViewHistory={onViewDebtHistory}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 pt-4 text-right border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PersonDebtsHistoryModal;
