


import React from 'react';
import { Person, PersonLedgerEntry, PersonLedgerEntryType } from '../types';
import { BN_UI_TEXT } from '../constants';
import PlusCircleIcon from './icons/PlusCircleIcon';
import TrashIcon from './icons/TrashIcon';

interface PersonLedgerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  ledgerEntries: PersonLedgerEntry[]; 
  currentNetBalance: number;
  onAddEntryClick: (person: Person) => void;
  onDeleteEntry: (entryId: string, personId: string) => void;
}

const PersonLedgerHistoryModal: React.FC<PersonLedgerHistoryModalProps> = ({
  isOpen,
  onClose,
  person,
  ledgerEntries,
  currentNetBalance,
  onAddEntryClick,
  onDeleteEntry,
}) => {
  if (!isOpen || !person) return null;

  const sortedEntriesForDisplay = [...ledgerEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const formatDisplayDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleString('bn-BD', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return isoDate; }
  };

  const formatCurrency = (num: number) => 
    `${BN_UI_TEXT.BDT_SYMBOL} ${Math.abs(num).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getBalanceStatusText = (balance: number): string => {
    if (balance > 0) return BN_UI_TEXT.LEDGER_BALANCE_STATUS_DEBIT.replace("{amount}", formatCurrency(balance)); 
    if (balance < 0) return BN_UI_TEXT.LEDGER_BALANCE_STATUS_CREDIT.replace("{amount}", formatCurrency(balance)); 
    return BN_UI_TEXT.LEDGER_BALANCE_STATUS_ZERO;
  };
  
  const getBalanceColorClass = (balance: number): string => {
    if (balance > 0) return 'text-green-600'; 
    if (balance < 0) return 'text-red-600';   
    return 'text-slate-700'; 
  };


  const handleDelete = (entryId: string) => {
    if(window.confirm(BN_UI_TEXT.CONFIRM_DELETE_LEDGER_ENTRY_MSG)) {
      onDeleteEntry(entryId, person.id);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[98]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-ledger-history-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h2 id="person-ledger-history-modal-title" className="text-xl sm:text-2xl font-semibold text-slate-800 truncate pr-2">
              {BN_UI_TEXT.PERSON_LEDGER_HISTORY_MODAL_TITLE.replace("{personName}", person.name)}
            </h2>
            <p className={`text-md font-medium ${getBalanceColorClass(currentNetBalance)}`}>
              {BN_UI_TEXT.CURRENT_NET_LEDGER_BALANCE_LABEL}: {getBalanceStatusText(currentNetBalance)}
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <button
                onClick={() => onAddEntryClick(person)}
                className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-medium py-2 px-3 rounded-md transition duration-150"
            >
                <PlusCircleIcon className="w-4 h-4" />
                <span>{BN_UI_TEXT.ADD_LEDGER_ENTRY_BTN.split(" ")[0]} {BN_UI_TEXT.ADD_LEDGER_ENTRY_BTN.split(" ")[1]}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 p-1.5 rounded-full flex-shrink-0"
              aria-label={BN_UI_TEXT.CLOSE_BTN}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1">
          {sortedEntriesForDisplay.length === 0 ? (
            <p className="text-slate-500 text-center py-10">{BN_UI_TEXT.NO_LEDGER_ENTRIES_FOUND}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedEntriesForDisplay.map((entry) => {
                const entryIsDebitForPerson = entry.type === PersonLedgerEntryType.DEBIT; 
                const amountColorClass = entryIsDebitForPerson ? 'text-green-600' : 'text-red-600'; 
                const descriptionClass = 'text-slate-700';
                
                return (
                  <div key={entry.id} className={`py-3 px-1.5 hover:bg-slate-50 rounded-md group`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex-grow mb-1 sm:mb-0">
                        <p className="text-xs text-slate-500">{formatDisplayDate(entry.date)}</p>
                        <p className={`text-sm font-medium ${descriptionClass}`}>{entry.description}</p>
                      </div>
                      <div className="flex sm:flex-col items-end sm:text-right space-x-2 sm:space-x-0 sm:space-y-0.5 w-full sm:w-auto">
                         <div className="flex items-center">
                          <span 
                            className={`font-semibold text-sm ${amountColorClass}`}
                          >
                            {entryIsDebitForPerson ? `খরচ: ${formatCurrency(entry.amount)}` : `জমা: ${formatCurrency(entry.amount)}`}
                          </span>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title={BN_UI_TEXT.DELETE_DEBT_TOOLTIP} 
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                         </div>
                        <p className={`text-xs font-medium ${getBalanceColorClass(entry.balanceAfterEntry)}`}>
                        {BN_UI_TEXT.LEDGER_BALANCE_AFTER_ENTRY}: {getBalanceStatusText(entry.balanceAfterEntry)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
         <div className="mt-6 pt-4 text-right border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonLedgerHistoryModal;