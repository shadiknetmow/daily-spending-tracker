// components/ManageBankAccountsModal.tsx
import React, { useState, useMemo } from 'react';
import { BankAccount, BankAccountType } from '../types';
import { BN_UI_TEXT, BANK_ACCOUNT_TYPES_BN } from '../constants';
import Modal from './Modal';
import PlusCircleIcon from './icons/PlusCircleIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon'; // New Icon

interface ManageBankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  onOpenBankAccountForm: (account?: BankAccount) => void;
  onDeleteBankAccount: (accountId: string) => void;
  onSetDefaultBankAccount: (accountId: string) => void;
}

const ManageBankAccountsModal: React.FC<ManageBankAccountsModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  onOpenBankAccountForm,
  onDeleteBankAccount,
  onSetDefaultBankAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const { activeAccounts, deletedAccounts } = useMemo(() => {
    const active: BankAccount[] = [];
    const deleted: BankAccount[] = [];
    const lowerSearch = searchTerm.toLowerCase();

    bankAccounts.forEach(acc => {
      const nameMatch = acc.accountName.toLowerCase().includes(lowerSearch);
      const numberMatch = acc.accountNumber && acc.accountNumber.toLowerCase().includes(lowerSearch);
      const bankNameMatch = acc.bankName && acc.bankName.toLowerCase().includes(lowerSearch);
      
      if (nameMatch || numberMatch || bankNameMatch) {
        if (acc.isDeleted) {
          deleted.push(acc);
        } else {
          active.push(acc);
        }
      }
    });
    active.sort((a, b) => a.accountName.localeCompare(b.accountName, 'bn-BD'));
    deleted.sort((a, b) => new Date(b.deletedAt || b.lastModified).getTime() - new Date(a.deletedAt || a.lastModified).getTime());
    return { activeAccounts: active, deletedAccounts: deleted };
  }, [bankAccounts, searchTerm]);
  
  const accountsToDisplay = showDeleted ? [...activeAccounts, ...deletedAccounts] : activeAccounts;
  const totalDeletedCount = deletedAccounts.length;


  const formatBalance = (balance: number, currency: string = 'BDT') => {
    return `${BN_UI_TEXT.BDT_SYMBOL} ${balance.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const getAccountTypeName = (type: BankAccountType) => BANK_ACCOUNT_TYPES_BN[type] || type;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.MANAGE_BANK_ACCOUNTS_MODAL_TITLE} size="xl">
      <div className="flex flex-col h-full">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <input
            type="text"
            placeholder="অ্যাকাউন্টের নাম, নম্বর বা ব্যাংক দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto flex-grow px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {totalDeletedCount > 0 && (
              <button
                  onClick={() => setShowDeleted(!showDeleted)}
                  className="text-xs text-teal-600 hover:text-teal-700 underline focus:outline-none py-2 px-2 whitespace-nowrap"
              >
                  {showDeleted ? BN_UI_TEXT.HIDE_DELETED_ITEMS_BTN : `${BN_UI_TEXT.SHOW_DELETED_ITEMS_BTN} (${totalDeletedCount}টি)`}
              </button>
            )}
            <button
              onClick={() => onOpenBankAccountForm()}
              className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 w-full sm:w-auto"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>{BN_UI_TEXT.ADD_NEW_BANK_ACCOUNT_BTN}</span>
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          {accountsToDisplay.length === 0 ? (
            <p className="text-slate-500 text-center py-10">
              {searchTerm ? `"${searchTerm}" নামে কোনো অ্যাকাউন্ট পাওয়া যায়নি।` : (showDeleted && totalDeletedCount === 0) ? "কোনো মোছা অ্যাকাউন্ট নেই।" : BN_UI_TEXT.NO_BANK_ACCOUNTS_FOUND}
            </p>
          ) : (
            <ul className="space-y-3">
              {accountsToDisplay.map(acc => (
                <li key={acc.id} className={`p-3 bg-white rounded-md border border-slate-200 group hover:shadow-sm transition-shadow ${acc.isDeleted ? 'opacity-70' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div className="flex-grow mb-2 sm:mb-0">
                      <h3 className={`text-md font-semibold flex items-center ${acc.isDeleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                        {acc.accountName}
                        {acc.isDefault && !acc.isDeleted && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            ডিফল্ট
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {getAccountTypeName(acc.accountType)}
                        {acc.bankName && ` - ${acc.bankName}`}
                        {acc.accountNumber && ` (***${acc.accountNumber.slice(-4)})`}
                      </p>
                      <p className={`text-sm font-medium ${acc.initialBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        প্রাথমিক ব্যালেন্স: {formatBalance(acc.initialBalance, acc.currency)}
                      </p>
                       {acc.isDeleted && acc.deletedAt && (
                        <p className="text-xs text-orange-500 mt-1">সরানো হয়েছে: {new Date(acc.deletedAt).toLocaleDateString('bn-BD')}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 self-start sm:self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {!acc.isDefault && !acc.isDeleted && (
                        <button
                          onClick={() => onSetDefaultBankAccount(acc.id)}
                          className="p-1.5 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 text-xs flex items-center"
                          title="ডিফল্ট হিসেবে সেট করুন"
                        >
                          <ArrowUpRightIcon className="w-3.5 h-3.5 mr-0.5"/> সেট ডিফল্ট
                        </button>
                      )}
                       {!acc.isDeleted && (
                        <button
                            onClick={() => onOpenBankAccountForm(acc)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
                            title={BN_UI_TEXT.EDIT_BANK_ACCOUNT_BTN}
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                       )}
                      <button
                        onClick={() => onDeleteBankAccount(acc.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                        title={acc.isDeleted ? "স্থায়ীভাবে মুছুন (শীঘ্রই আসছে)" : BN_UI_TEXT.DELETE_BANK_ACCOUNT_BTN}
                        disabled={acc.isDeleted} // Permanent delete not yet implemented
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageBankAccountsModal;