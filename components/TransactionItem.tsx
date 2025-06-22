
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { BN_UI_TEXT } from '../constants';
import IncomeIcon from './icons/IncomeIcon';
import ExpenseIcon from './icons/ExpenseIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import HistoryIcon from './icons/HistoryIcon'; 
import UndoIcon from './icons/UndoIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon'; // New

interface TransactionItemProps {
  transaction: Transaction;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onViewHistory: (transaction: Transaction) => void; 
  onRestoreTransaction: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onDeleteTransaction, 
  onEditTransaction, 
  onViewHistory,
  onRestoreTransaction
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  
  const amountColor = transaction.isDeleted 
    ? 'text-slate-400 line-through' 
    : (isIncome ? 'text-green-600' : 'text-red-600');
  
  const borderColor = transaction.isDeleted
    ? 'border-slate-400'
    : (isIncome ? 'border-green-500' : 'border-red-500');
  
  const Icon = isIncome ? IncomeIcon : ExpenseIcon;
  
  const descriptionClass = transaction.isDeleted 
    ? 'text-slate-500 line-through' 
    : 'text-slate-700';

  const formatDate = (dateString?: string, includeTime: boolean = false) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { // Check if date is valid
          return dateString; // Return original string if not a valid date
      }
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long', 
        year: 'numeric',
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        // options.second = '2-digit'; // Optional: if seconds are needed
        // options.hour12 = true; // Optional: for 12-hour format
        return date.toLocaleString('bn-BD', options);
      }
      return date.toLocaleDateString('bn-BD', options);
    } catch (e) {
      return dateString; // Return original string on error
    }
  };
  
  const transactionDate = formatDate(transaction.date, true);
  const lastModifiedDate = transaction.lastModified && transaction.lastModified !== transaction.date 
    ? formatDate(transaction.lastModified, true) 
    : null;
  const deletedDate = transaction.isDeleted && transaction.deletedAt ? formatDate(transaction.deletedAt, true) : null;


  return (
    <li className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor} flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-shadow duration-150 ${transaction.isDeleted ? 'opacity-70 hover:opacity-90' : ''}`}>
      <div className="flex items-center space-x-3 flex-grow">
        <Icon className={`w-8 h-8 ${transaction.isDeleted ? 'text-slate-400' : (isIncome ? 'text-green-500' : 'text-red-500')}`} />
        <div>
          <p className={`font-medium ${descriptionClass}`}>{transaction.description}</p>
          <p className="text-xs text-slate-500">
            {BN_UI_TEXT.DATE}: {transactionDate}
          </p>
          {transaction.bankAccountName && !transaction.isDeleted && (
            <p className="text-xs text-sky-600 flex items-center">
                <BuildingLibraryIcon className="w-3 h-3 mr-1"/> {BN_UI_TEXT.TRANSACTION_LINKED_TO_BANK_ACCOUNT.replace('{bankAccountName}', transaction.bankAccountName)}
            </p>
          )}
          {lastModifiedDate && !transaction.isDeleted && (
            <p className="text-xs text-slate-400 italic">
              {BN_UI_TEXT.LAST_MODIFIED_ON} {lastModifiedDate}
            </p>
          )}
          {transaction.isDeleted && deletedDate && (
            <p className="text-xs text-orange-600 font-medium">
              {BN_UI_TEXT.DELETED_ON} {deletedDate} ({BN_UI_TEXT.STATUS_ARCHIVED})
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 self-end sm:self-center mt-2 sm:mt-0">
        <span className={`font-semibold text-lg ${amountColor}`}>
          {isIncome ? '+' : '-'} {BN_UI_TEXT.BDT_SYMBOL} {(transaction.amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        
        {transaction.isDeleted ? (
          <button
            onClick={() => onRestoreTransaction(transaction.id)}
            className="text-slate-500 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition duration-150"
            aria-label={BN_UI_TEXT.RESTORE_ITEM_TOOLTIP}
            title={BN_UI_TEXT.RESTORE_ITEM_TOOLTIP}
          >
            <UndoIcon className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={() => onViewHistory(transaction)}
              className="text-slate-500 hover:text-sky-600 p-2 rounded-full hover:bg-sky-50 transition duration-150"
              aria-label={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
              title={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
            >
              <HistoryIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => onEditTransaction(transaction)}
                className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition duration-150"
                aria-label={BN_UI_TEXT.EDIT_TRANSACTION_TOOLTIP}
                title={BN_UI_TEXT.EDIT_TRANSACTION_TOOLTIP}
            >
                <EditIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => onDeleteTransaction(transaction.id)}
                className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition duration-150"
                aria-label={BN_UI_TEXT.DELETE_TRANSACTION_TOOLTIP}
                title={BN_UI_TEXT.DELETE_TRANSACTION_TOOLTIP}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default TransactionItem;