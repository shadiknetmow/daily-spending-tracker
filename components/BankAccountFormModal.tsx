// components/BankAccountFormModal.tsx
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { BankAccount, BankAccountType } from '../types';
import { BN_UI_TEXT, BANK_ACCOUNT_TYPES_BN, BANK_ACCOUNT_CURRENCIES_BN } from '../constants';
import Modal from './Modal';
import { useNotification } from '../contexts/NotificationContext';

interface BankAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory' | 'isDeleted' | 'deletedAt'>, existingId?: string) => Promise<void>;
  initialData?: BankAccount | null;
}

const BankAccountFormModal: React.FC<BankAccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType | ''>('');
  const [initialBalance, setInitialBalance] = useState<number | string>('');
  const [balanceEffectiveDate, setBalanceEffectiveDate] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  const { addNotification } = useNotification();
  const accountNameInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAccountName(initialData.accountName);
        setAccountNumber(initialData.accountNumber || '');
        setBankName(initialData.bankName || '');
        setBranchName(initialData.branchName || '');
        setAccountType(initialData.accountType);
        setInitialBalance(initialData.initialBalance);
        setBalanceEffectiveDate(new Date(initialData.balanceEffectiveDate).toISOString().split('T')[0]);
        setCurrency(initialData.currency);
        setNotes(initialData.notes || '');
        setIsDefault(initialData.isDefault || false);
      } else {
        setAccountName('');
        setAccountNumber('');
        setBankName('');
        setBranchName('');
        setAccountType('');
        setInitialBalance('');
        setBalanceEffectiveDate(new Date().toISOString().split('T')[0]);
        setCurrency('BDT');
        setNotes('');
        setIsDefault(false);
      }
      setTimeout(() => accountNameInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      addNotification(BN_UI_TEXT.BANK_ACCOUNT_NAME_REQUIRED, 'error');
      return;
    }
    if (accountType === '') {
      addNotification(BN_UI_TEXT.SELECT_ACCOUNT_TYPE_PLACEHOLDER, 'error');
      return;
    }
    const numInitialBalance = parseFloat(String(initialBalance));
    if (isNaN(numInitialBalance)) { // Allow 0 balance
      addNotification(BN_UI_TEXT.INITIAL_BALANCE_REQUIRED, 'error');
      return;
    }
    if (!balanceEffectiveDate) {
      addNotification(BN_UI_TEXT.BALANCE_EFFECTIVE_DATE_REQUIRED, 'error');
      return;
    }

    await onSave(
      {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        branchName: branchName.trim() || undefined,
        accountType: accountType as BankAccountType, // Cast as it's validated
        initialBalance: numInitialBalance,
        balanceEffectiveDate: new Date(balanceEffectiveDate).toISOString(),
        currency,
        notes: notes.trim() || undefined,
        isDefault,
      },
      initialData?.id
    );
  };

  const inputClass = "w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white";
  const labelClass = "block text-xs font-medium text-slate-600 mb-0.5";

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditing ? BN_UI_TEXT.BANK_ACCOUNT_FORM_MODAL_TITLE_EDIT : BN_UI_TEXT.BANK_ACCOUNT_FORM_MODAL_TITLE_ADD} 
        size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label htmlFor="accountName" className={labelClass}>{BN_UI_TEXT.ACCOUNT_NAME_LABEL} <span className="text-red-500">*</span></label>
          <input ref={accountNameInputRef} type="text" id="accountName" value={accountName} onChange={e => setAccountName(e.target.value)} className={inputClass} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="accountNumber" className={labelClass}>{BN_UI_TEXT.ACCOUNT_NUMBER_LABEL}</label>
            <input type="text" id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className={inputClass} placeholder={BN_UI_TEXT.ACCOUNT_NUMBER_PLACEHOLDER} />
          </div>
          <div>
            <label htmlFor="accountType" className={labelClass}>{BN_UI_TEXT.ACCOUNT_TYPE_LABEL} <span className="text-red-500">*</span></label>
            <select id="accountType" value={accountType} onChange={e => setAccountType(e.target.value as BankAccountType | '')} className={inputClass} required>
              <option value="" disabled>{BN_UI_TEXT.SELECT_ACCOUNT_TYPE_PLACEHOLDER}</option>
              {Object.entries(BANK_ACCOUNT_TYPES_BN).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label htmlFor="bankName" className={labelClass}>{BN_UI_TEXT.BANK_NAME_LABEL}</label>
            <input type="text" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} className={inputClass} placeholder={BN_UI_TEXT.BANK_NAME_PLACEHOLDER} />
          </div>
          <div>
            <label htmlFor="branchName" className={labelClass}>{BN_UI_TEXT.BRANCH_NAME_LABEL}</label>
            <input type="text" id="branchName" value={branchName} onChange={e => setBranchName(e.target.value)} className={inputClass} placeholder={BN_UI_TEXT.BRANCH_NAME_PLACEHOLDER} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="initialBalance" className={labelClass}>{BN_UI_TEXT.INITIAL_BALANCE_LABEL} <span className="text-red-500">*</span></label>
            <input type="number" id="initialBalance" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className={inputClass} step="any" required placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="balanceEffectiveDate" className={labelClass}>{BN_UI_TEXT.BALANCE_EFFECTIVE_DATE_LABEL} <span className="text-red-500">*</span></label>
            <input type="date" id="balanceEffectiveDate" value={balanceEffectiveDate} onChange={e => setBalanceEffectiveDate(e.target.value)} className={inputClass} required />
          </div>
        </div>

        <div>
          <label htmlFor="currency" className={labelClass}>{BN_UI_TEXT.CURRENCY_LABEL}</label>
          <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
            {Object.entries(BANK_ACCOUNT_CURRENCIES_BN).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="accountNotes" className={labelClass}>{BN_UI_TEXT.ACCOUNT_NOTES_LABEL}</label>
          <textarea id="accountNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClass} placeholder={BN_UI_TEXT.ACCOUNT_NOTES_PLACEHOLDER}></textarea>
        </div>
        
        <div className="pt-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} 
                   className="form-checkbox h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
            <span className="text-sm text-slate-700">{BN_UI_TEXT.SET_AS_DEFAULT_ACCOUNT_LABEL}</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
            {BN_UI_TEXT.CANCEL}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">
            {isEditing ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.SAVE_BANK_ACCOUNT_BTN}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BankAccountFormModal;