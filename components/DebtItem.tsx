
import React from 'react';
import { Debt, DebtType, Person } from '../types'; 
import { BN_UI_TEXT } from '../constants';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import HistoryIcon from './icons/HistoryIcon';
import EyeIcon from './icons/EyeIcon'; 

interface DebtItemProps {
  debt: Debt;
  persons: Person[]; 
  onDeleteDebt: (id: string) => void;
  onToggleSettle: (id: string) => void;
  onEditDebt: (debt: Debt) => void;
  onViewHistory: (debt: Debt) => void;
  onViewPersonFinancialOverview?: (person: Person) => void; 
}

const DebtItem: React.FC<DebtItemProps> = ({ 
  debt, 
  persons, 
  onDeleteDebt, 
  onToggleSettle, 
  onEditDebt, 
  onViewHistory,
  onViewPersonFinancialOverview 
}) => {
  const isReceivable = debt.type === DebtType.RECEIVABLE;
  
  const amountColor = debt.isSettled
    ? 'text-slate-400 line-through' 
    : (isReceivable ? 'text-green-600' : 'text-red-600');
  
  const borderColor = debt.isSettled 
      ? 'border-slate-400' 
      : (isReceivable ? 'border-green-500' : 'border-red-500');

  const personNameBaseColor = isReceivable ? 'text-green-700' : 'text-red-700';
  const personNameHoverColor = isReceivable ? 'hover:text-green-800' : 'hover:text-red-800';
  
  let personNameFinalColor = debt.isSettled
    ? 'text-slate-500'
    : personNameBaseColor;
  if (!debt.isSettled && onViewPersonFinancialOverview) {
    personNameFinalColor = `${personNameBaseColor} ${personNameHoverColor}`;
  }

  const descriptionClass = 'text-slate-600';

  // Ensures 'person' is declared only once in this scope.
  const person = persons.find(p => p.id === debt.personId);
  const personNameDisplay = person ? person.name : BN_UI_TEXT.UNKNOWN_PERSON;

  const formatDate = (dateString?: string, includeTime: boolean = false) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return new Date(dateString).toLocaleDateString('bn-BD', options);
    } catch (e) {
      return dateString;
    }
  };
  
  const createdDate = formatDate(debt.creationDate, true);
  const dueDate = debt.dueDate ? formatDate(debt.dueDate) : 'নির্দিষ্ট নেই';
  const settledDate = debt.settledDate ? formatDate(debt.settledDate, true) : '';
  const lastModifiedDate = debt.lastModified && debt.lastModified !== debt.creationDate 
    ? formatDate(debt.lastModified, true) 
    : null;

  const handlePersonNameClick = () => {
    if (person && onViewPersonFinancialOverview) {
      onViewPersonFinancialOverview(person);
    }
  };

  const displayRemainingAmount = debt.remainingAmount.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayOriginalAmount = debt.originalAmount.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isPartiallyPaid = !debt.isSettled && debt.remainingAmount < debt.originalAmount && debt.remainingAmount > 0;

  return (
    <li className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor} flex flex-col space-y-3 hover:shadow-md transition-shadow duration-150`}>
      <div className="flex justify-between items-start">
        <div>
          {person && onViewPersonFinancialOverview ? (
            <button
              onClick={handlePersonNameClick}
              className={`font-semibold text-lg text-left hover:underline focus:outline-none focus:ring-1 focus:ring-offset-1 rounded-sm ${personNameFinalColor} focus:ring-sky-500`}
              title={BN_UI_TEXT.VIEW_PERSON_FINANCIAL_OVERVIEW_TOOLTIP.replace("{personName}", personNameDisplay)}
              disabled={!onViewPersonFinancialOverview}
            >
              {personNameDisplay}
            </button>
          ) : (
             <p className={`font-semibold text-lg ${personNameFinalColor}`}>
              {personNameDisplay}
            </p>
          )}
          <p className={`text-sm ${descriptionClass}`}>{debt.description}</p>
           {person && person.mobileNumber && (
            <p className="text-xs text-slate-500">{BN_UI_TEXT.PERSON_MOBILE_NUMBER}: {person.mobileNumber}</p>
          )}
        </div>
        <div className="text-right">
          <span className={`font-semibold text-xl ${amountColor}`}>
            {BN_UI_TEXT.BDT_SYMBOL} {displayRemainingAmount}
          </span>
          {(isPartiallyPaid || (debt.isSettled && debt.originalAmount !== debt.remainingAmount)) && (
            <span className="block text-xs text-slate-400">
              (মূল: {BN_UI_TEXT.BDT_SYMBOL} {displayOriginalAmount})
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>{BN_UI_TEXT.CREATED_ON} {createdDate}</p>
        {!debt.isSettled && debt.dueDate && <p className="text-orange-600">{BN_UI_TEXT.DUE_ON} {dueDate}</p>}
        {debt.isSettled && <p className="text-lime-600 font-medium">{BN_UI_TEXT.SETTLED_ON} {settledDate}</p>}
         {lastModifiedDate && (
          <p className="italic">{BN_UI_TEXT.LAST_MODIFIED_ON} {lastModifiedDate}</p>
        )}
         {isPartiallyPaid && (
            <p className="text-blue-600 font-medium">আংশিক পরিশোধিত</p>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2 space-x-2">
        <button
        onClick={() => onToggleSettle(debt.id)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150
            ${debt.isSettled 
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
            : (isReceivable ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200')}`}
        disabled={debt.isSettled && debt.remainingAmount > 0} 
        >
        {debt.isSettled ? BN_UI_TEXT.MARK_AS_UNSETTLED : BN_UI_TEXT.MARK_AS_SETTLED}
        </button>

        <div className="flex items-center space-x-0.5">
          {person && onViewPersonFinancialOverview && (
             <button
              onClick={handlePersonNameClick}
              className="text-slate-500 hover:text-sky-600 p-1.5 rounded-full hover:bg-sky-50 transition duration-150"
              aria-label={BN_UI_TEXT.VIEW_PERSON_FINANCIAL_OVERVIEW_TOOLTIP.replace("{personName}", personNameDisplay)}
              title={BN_UI_TEXT.VIEW_PERSON_FINANCIAL_OVERVIEW_TOOLTIP.replace("{personName}", personNameDisplay)}
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onViewHistory(debt)}
            className="text-slate-500 hover:text-sky-600 p-1.5 rounded-full hover:bg-sky-50 transition duration-150"
            aria-label={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
            title={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
          >
            <HistoryIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditDebt(debt)}
            className="text-slate-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition duration-150"
            aria-label={BN_UI_TEXT.EDIT_DEBT_TOOLTIP}
            title={BN_UI_TEXT.EDIT_DEBT_TOOLTIP}
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteDebt(debt.id)}
            className="text-slate-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition duration-150"
            aria-label={BN_UI_TEXT.DELETE_DEBT_TOOLTIP}
            title={BN_UI_TEXT.DELETE_DEBT_TOOLTIP}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default DebtItem;
