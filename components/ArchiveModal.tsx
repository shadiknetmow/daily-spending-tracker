
import React, { useState, useMemo } from 'react';
import { Transaction, Person } from '../types';
import { BN_UI_TEXT } from '../constants';
import TransactionList from './TransactionList';
import PersonList from './PersonList';
import Modal from './Modal'; // Reusing the generic Modal component

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions: Transaction[];
  allPersons: Person[];
  onRestoreTransaction: (id: string) => void;
  onRestorePerson: (personId: string) => void;
  onViewTransactionHistory: (transaction: Transaction) => void;
  onViewPersonHistory: (person: Person) => void;
  onEditPerson: (person: Person) => void; 
  onViewPersonDebtsHistory: (person: Person) => void;
  onViewPersonLedger: (person: Person) => void;
  getPersonNetLedgerBalance: (personId: string) => number;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onOpenChat: (person: Person) => void; 
  onOpenVideoCall: (person: Person) => void; // New prop
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  allTransactions,
  allPersons,
  onRestoreTransaction,
  onRestorePerson,
  onViewTransactionHistory,
  onViewPersonHistory,
  onEditPerson, 
  onViewPersonDebtsHistory, 
  onViewPersonLedger, 
  getPersonNetLedgerBalance, 
  onDeleteTransaction, 
  onEditTransaction,
  onOpenChat, 
  onOpenVideoCall, // Destructure new prop
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'persons'>('transactions');

  const deletedTransactions = useMemo(() => {
    return allTransactions.filter(t => t.isDeleted);
  }, [allTransactions]);

  const deletedPersons = useMemo(() => {
    return allPersons.filter(p => p.isDeleted);
  }, [allPersons]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={BN_UI_TEXT.ARCHIVE_MODAL_TITLE}
      size="3xl"
    >
      <div className="flex flex-col h-full">
        <div className="mb-4 border-b border-slate-200">
          <nav className="-mb-px flex space-x-5" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'transactions'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              aria-current={activeTab === 'transactions' ? 'page' : undefined}
            >
              {BN_UI_TEXT.DELETED_TRANSACTIONS_TAB} ({deletedTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('persons')}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'persons'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              aria-current={activeTab === 'persons' ? 'page' : undefined}
            >
              {BN_UI_TEXT.DELETED_PERSONS_TAB} ({deletedPersons.length})
            </button>
          </nav>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          {activeTab === 'transactions' && (
            <TransactionList
              transactions={deletedTransactions} 
              onDeleteTransaction={onDeleteTransaction} 
              onEditTransaction={onEditTransaction}   
              onViewHistory={onViewTransactionHistory}
              onRestoreTransaction={onRestoreTransaction}
              showTitle={false} 
              initialShowDeleted={true} 
            />
          )}
          {activeTab === 'persons' && (
            <PersonList
              persons={deletedPersons} 
              onEditPerson={onEditPerson} 
              onDeletePerson={() => {}} 
              onViewPersonHistory={onViewPersonHistory}
              onAddNewPerson={() => {}} 
              onViewPersonDebtsHistory={onViewPersonDebtsHistory} 
              onViewPersonLedger={onViewPersonLedger} 
              getPersonNetLedgerBalance={getPersonNetLedgerBalance} 
              onRestorePerson={onRestorePerson}
              onOpenChat={onOpenChat}
              onOpenVideoCall={onOpenVideoCall} // Pass handler
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ArchiveModal;
