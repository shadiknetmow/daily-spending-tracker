
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { BN_UI_TEXT } from '../constants';
import TransactionItem from './TransactionItem';
import ChevronLeftIcon from './icons/ChevronLeftIcon'; // Assuming you have this
import ChevronRightIcon from './icons/ChevronRightIcon'; // Assuming you have this

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void; 
  onViewHistory: (transaction: Transaction) => void;
  onRestoreTransaction: (id: string) => void;
  showTitle?: boolean; 
  initialShowDeleted?: boolean;
}

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

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
  
  const transactionsToDisplayOverall = useMemo(() => {
    return showDeleted ? [...activeTransactions, ...deletedTransactions] : activeTransactions;
  }, [showDeleted, activeTransactions, deletedTransactions]);
   
  // Reset to page 1 when the source transactions or the showDeleted filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions, showDeleted]);

  const totalItems = transactionsToDisplayOverall.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Adjust current page if it becomes invalid after data change (e.g., item deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return transactionsToDisplayOverall.slice(startIndex, endIndex);
  }, [transactionsToDisplayOverall, currentPage]);
  
  const displayedCount = paginatedTransactions.length;
  const totalActiveCount = activeTransactions.length;
  const totalDeletedCount = deletedTransactions.length;

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

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
      
      {displayedCount === 0 && totalItems > 0 ? ( // Handles case where current page is empty but there are items on other pages
        <p className="text-slate-500 text-center py-4">
            এই পৃষ্ঠায় কোনো লেনদেন নেই।
        </p>
      ) : displayedCount === 0 && totalItems === 0 ? (
        <p className="text-slate-500 text-center py-4">
          {showDeleted ? BN_UI_TEXT.NO_DELETED_TRANSACTIONS : BN_UI_TEXT.NO_TRANSACTIONS}
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {paginatedTransactions.map((transaction) => (
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
          {totalItems > ITEMS_PER_PAGE && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600">
              <p className="mb-2 sm:mb-0">
                পৃষ্ঠা {currentPage.toLocaleString('bn-BD')} এর {totalPages.toLocaleString('bn-BD')} | মোট {totalItems.toLocaleString('bn-BD')} টি লেনদেন
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  aria-label="পূর্ববর্তী পৃষ্ঠা"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  পূর্ববর্তী
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  aria-label="পরবর্তী পৃষ্ঠা"
                >
                  পরবর্তী
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TransactionList;