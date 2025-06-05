


import React, { useMemo } from 'react';
import { Person, Debt, PersonLedgerEntry, PersonLedgerEntryType, DebtType } from '../types';
import { BN_UI_TEXT } from '../constants';
import DebtItem from './DebtItem';
import PlusCircleIcon from './icons/PlusCircleIcon';
import TrashIcon from './icons/TrashIcon';

interface CombinedFinancialItemBase {
  id: string;
  date: string; 
  amount: number;
  description: string;
  // isDeleted?: boolean; // Removed
  // deletedAt?: string; // Removed
}

interface LedgerItemForCombinedList extends CombinedFinancialItemBase {
  itemType: 'ledger';
  ledgerEntryType: PersonLedgerEntryType;
  balanceAfterEntry: number; 
  originalEntry: PersonLedgerEntry;
}

interface DebtItemForCombinedList extends CombinedFinancialItemBase {
  itemType: 'debt';
  debtType: DebtType;
  isSettled: boolean;
  dueDate?: string;
  settledDate?: string;
  creationDate: string; 
  personId: string; 
  originalDebt: Debt; 
}

type CombinedFinancialItem = LedgerItemForCombinedList | DebtItemForCombinedList;


interface PersonFinancialOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  personDebts: Debt[]; 
  personLedgerEntries: PersonLedgerEntry[]; 
  currentNetLedgerBalance: number; 
  allPersons: Person[]; 
  onDeleteDebt: (id: string) => void;
  onToggleSettle: (id: string) => void;
  onEditDebt: (debt: Debt) => void;
  onViewDebtHistory: (debt: Debt) => void;
  onAddLedgerEntryClick: (person: Person) => void;
  onDeleteLedgerEntry: (entryId: string, personId: string) => void;
}

const PersonFinancialOverviewModal: React.FC<PersonFinancialOverviewModalProps> = ({
  isOpen,
  onClose,
  person,
  personDebts,
  personLedgerEntries,
  currentNetLedgerBalance,
  allPersons,
  onDeleteDebt,
  onToggleSettle,
  onEditDebt,
  onViewDebtHistory,
  onAddLedgerEntryClick,
  onDeleteLedgerEntry,
}) => {
  if (!isOpen) return null;

  const modalTitle = BN_UI_TEXT.PERSON_FINANCIAL_OVERVIEW_MODAL_TITLE.replace("{personName}", person.name);

  const combinedFinancialHistory = useMemo(() => {
    const ledgerItems: LedgerItemForCombinedList[] = personLedgerEntries.map(entry => ({
      id: entry.id,
      date: entry.date, 
      itemType: 'ledger',
      description: entry.description,
      amount: entry.amount,
      ledgerEntryType: entry.type,
      balanceAfterEntry: entry.balanceAfterEntry,
      originalEntry: entry,
    }));

    const debtItems: DebtItemForCombinedList[] = personDebts.map(debt => ({
      id: debt.id,
      date: debt.creationDate, 
      itemType: 'debt',
      description: debt.description,
      amount: debt.originalAmount, 
      debtType: debt.type,
      isSettled: debt.isSettled,
      dueDate: debt.dueDate,
      settledDate: debt.settledDate,
      creationDate: debt.creationDate,
      personId: debt.personId,
      originalDebt: debt, 
    }));
    
    return [...ledgerItems, ...debtItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [personLedgerEntries, personDebts]);


  const formatDisplayDateConcise = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit', month: 'long', year: 'numeric'
      };
      return new Date(isoDate).toLocaleDateString('bn-BD', options);
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

  const handleDeleteLedgerEntry = (entryId: string) => {
    if(window.confirm(BN_UI_TEXT.CONFIRM_DELETE_LEDGER_ENTRY_MSG)) {
      onDeleteLedgerEntry(entryId, person.id);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-[98]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-financial-overview-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-3xl xl:max-w-4xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 pb-3 border-b border-slate-300">
          <div className="flex-grow">
            <h2 id="person-financial-overview-modal-title" className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">
              {modalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full sm:ml-4 absolute top-3 right-3 mt-1 mr-1 sm:static sm:mt-0 sm:mr-0"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm text-slate-600">
            {BN_UI_TEXT.PERSON_NAME}: <span className="font-semibold text-slate-700">{person.name}</span>
            </p>
            {person.mobileNumber && 
                <p className="text-xs text-slate-500">
                    {BN_UI_TEXT.PERSON_MOBILE_NUMBER}: {person.mobileNumber}
                </p>
            }
            {person.shopName && 
                <p className="text-xs text-slate-500">
                    {BN_UI_TEXT.PERSON_SHOP_NAME}: {person.shopName}
                </p>
            }
            {person.address && 
                <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm md:max-w-md" title={person.address}>
                    {BN_UI_TEXT.PERSON_ADDRESS}: {person.address}
                </p>
            }
            <p className={`text-md font-semibold mt-2 pt-2 border-t border-slate-100 ${getBalanceColorClass(currentNetLedgerBalance)}`}>
            {BN_UI_TEXT.CURRENT_NET_LEDGER_BALANCE_LABEL}: {getBalanceStatusText(currentNetLedgerBalance)}
            </p>
        </div>

        <section className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-indigo-700">{BN_UI_TEXT.UNIFIED_FINANCIAL_HISTORY_TITLE}</h3>
            <button
            onClick={() => onAddLedgerEntryClick(person)}
            className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium py-1.5 px-3 rounded-md"
            title={BN_UI_TEXT.ADD_LEDGER_ENTRY_MODAL_TITLE}
            >
            <PlusCircleIcon className="w-4 h-4" />
            <span>হিসাবে নতুন এন্ট্রি</span>
            </button>
          </div>

          {combinedFinancialHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-6">{BN_UI_TEXT.NO_FINANCIAL_ACTIVITY}</p>
          ) : (
            <ul className="space-y-4">
              {combinedFinancialHistory.map((item) => {
                const itemDateFormatted = formatDisplayDateConcise(item.date);
                if (item.itemType === 'ledger') {
                  const ledgerItem = item as LedgerItemForCombinedList;
                  const isPositiveForUserView = ledgerItem.ledgerEntryType === PersonLedgerEntryType.DEBIT; 
                  
                  const borderColorClass = isPositiveForUserView ? 'border-green-500' : 'border-red-500';
                  const amountColorClass = isPositiveForUserView ? 'text-green-600' : 'text-red-600';
                  const descriptionClass = 'text-slate-700';
                  const amountPrefix = ledgerItem.ledgerEntryType === PersonLedgerEntryType.DEBIT ? BN_UI_TEXT.LEDGER_TYPE_DEBIT_PERSON.split(" ")[0] : BN_UI_TEXT.LEDGER_TYPE_CREDIT_PERSON.split(" ")[0];

                  return (
                    <li key={ledgerItem.id} className={`bg-white p-3 rounded-md shadow-sm border-l-4 ${borderColorClass} group`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex-grow mb-1.5 sm:mb-0">
                          <p className="text-xs text-slate-500">{itemDateFormatted}</p>
                          <p className={`text-sm font-medium ${descriptionClass}`}>{ledgerItem.description}</p>
                        </div>
                        <div className="flex sm:flex-col items-end sm:text-right space-x-2 sm:space-x-0 sm:space-y-0.5 w-full sm:w-auto self-end sm:self-auto">
                          <div className="flex items-center">
                            <span className={`font-semibold text-sm ${amountColorClass}`}>
                              {amountPrefix}: {formatCurrency(ledgerItem.amount)}
                            </span>
                            <button 
                                onClick={() => handleDeleteLedgerEntry(ledgerItem.id)}
                                className="ml-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5"
                                title={BN_UI_TEXT.DELETE_TRANSACTION_TOOLTIP} 
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className={`text-xs font-medium ${getBalanceColorClass(ledgerItem.balanceAfterEntry)}`}>
                              জের (খতিয়ান): {getBalanceStatusText(ledgerItem.balanceAfterEntry)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                } else if (item.itemType === 'debt') {
                  const debtItemData = item as DebtItemForCombinedList;
                  return (
                     <li key={debtItemData.id} className="relative"> 
                        <DebtItem
                            debt={debtItemData.originalDebt} 
                            persons={allPersons}
                            onDeleteDebt={onDeleteDebt}
                            onToggleSettle={onToggleSettle}
                            onEditDebt={onEditDebt}
                            onViewHistory={onViewDebtHistory}
                        />
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          )}
        </section>
        
        <div className="mt-5 pt-4 text-right border-t border-slate-300 bg-slate-50 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pb-4 sm:pb-6 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default PersonFinancialOverviewModal;