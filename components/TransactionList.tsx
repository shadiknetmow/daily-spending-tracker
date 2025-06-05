
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { BN_UI_TEXT } from '../constants';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void; 
  onViewHistory: (transaction: Transaction) => void;
  onRestoreTransaction: (id: string) => void;
  showTitle?: boolean; 
  initialShowDeleted?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onDeleteTransaction, 
  onEditTransaction, 
  onViewHistory,
  onRestoreTransaction,
  showTitle = true,
  initialShowDeleted = false,
}) => {
  const [showDeleted, setShowDeleted] = useState(initialShowDeleted);

  const { activeTransactions, deletedTransactions } = useMemo(() => {
    const active: Transaction[] = [];
    const deleted: Transaction[] = [];
    transactions.forEach(t => {
      if (t.isDeleted) {
        deleted.push(t);
      } else {
        active.push(t);
      }
    });
    active.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    deleted.sort((a, b) => new Date(b.deletedAt || b.date).getTime() - new Date(a.deletedAt || a.date).getTime());
    return { activeTransactions: active, deletedTransactions: deleted };
  }, [transactions]);
  
  const transactionsToDisplay = showDeleted ? [...activeTransactions, ...deletedTransactions] : activeTransactions;
   
  const displayedCount = transactionsToDisplay.length;
  const totalActiveCount = activeTransactions.length;
  const totalDeletedCount = deletedTransactions.length;

  if (totalActiveCount === 0 && !showDeleted && totalDeletedCount > 0) {
    return (
      <section aria-labelledby={showTitle ? "transaction-history-heading" : undefined} className={`${showTitle ? 'my-8 p-6 bg-white rounded-xl shadow-lg text-center' : 'text-center py-4'}`}>
        {showTitle && (
          <h2 id="transaction-history-heading" className="text-2xl font-semibold text-slate-700 mb-4">
            {BN_UI_TEXT.TRANSACTION_HISTORY}
          </h2>
        )}
        <p className="text-slate-500 mb-3">{BN_UI_TEXT.NO_TRANSACTIONS}</p>
        <button
          onClick={() => setShowDeleted(true)}
          className="text-sm text-teal-600 hover:text-teal-700 underline focus:outline-none"
        >
          {BN_UI_TEXT.SHOW_DELETED_ITEMS_BTN} ({totalDeletedCount}টি)
        </button>
      </section>
    );
  }
  
  if (totalActiveCount === 0 && totalDeletedCount === 0) {
     return (
      <section aria-labelledby={showTitle ? "transaction-history-heading" : undefined} className={`${showTitle ? 'my-8 p-6 bg-white rounded-xl shadow-lg text-center' : 'text-center py-4'}`}>
         {showTitle && (
            <h2 id="transaction-history-heading" className="text-2xl font-semibold text-slate-700 mb-6">
            {BN_UI_TEXT.TRANSACTION_HISTORY}
            </h2>
         )}
        <p className="text-slate-500">{BN_UI_TEXT.NO_TRANSACTIONS}</p>
      </section>
    );
  }


  return (
    <section aria-labelledby={showTitle ? "transaction-history-heading" : undefined} className={`${showTitle ? 'my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg' : ''}`}>
      <div className={`flex flex-col sm:flex-row justify-between items-center ${showTitle ? 'mb-6' : 'mb-4'}`}>
        {showTitle && (
          <h2 id="transaction-history-heading" className="text-2xl font-semibold text-slate-700">
            {BN_UI_TEXT.TRANSACTION_HISTORY}
          </h2>
        )}
        {totalDeletedCount > 0 && (
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="text-sm text-teal-600 hover:text-teal-700 underline focus:outline-none mt-2 sm:mt-0"
          >
            {showDeleted ? BN_UI_TEXT.HIDE_DELETED_ITEMS_BTN : `${BN_UI_TEXT.SHOW_DELETED_ITEMS_BTN} (${totalDeletedCount}টি)`}
          </button>
        )}
      </div>
      
      {displayedCount === 0 ? (
        <p className="text-slate-500 text-center py-4">
          {showDeleted ? BN_UI_TEXT.NO_DELETED_TRANSACTIONS : BN_UI_TEXT.NO_TRANSACTIONS}
        </p>
      ) : (
        <ul className="space-y-4">
          {transactionsToDisplay.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onDeleteTransaction={onDeleteTransaction}
              onEditTransaction={onEditTransaction}
              onViewHistory={onViewHistory}
              onRestoreTransaction={onRestoreTransaction}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default TransactionList;