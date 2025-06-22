
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Transaction, TransactionType, BankAccount } from '../types'; // Added BankAccount
import { BN_UI_TEXT } from '../constants';
import ManageIcon from './icons/ManageIcon'; 
import { useNotification } from '../contexts/NotificationContext';
import { convertToBanglaPhonetic } from '../utils/textUtils'; 

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransactionData: Transaction) => void; 
  allSuggestions: string[]; 
  onOpenManageSuggestions: () => void; 
  isGlobalPhoneticModeActive: boolean; 
  bankAccounts: BankAccount[]; // New
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onSave,
  allSuggestions,
  onOpenManageSuggestions,
  isGlobalPhoneticModeActive, 
  bankAccounts, // New
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [date, setDate] = useState(''); 
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>(undefined); // New

  const [currentFilteredSuggestions, setCurrentFilteredSuggestions] = useState<string[]>(allSuggestions);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const { addNotification } = useNotification();
  const skipPhoneticConversionOnceRef = useRef(false); 


  useEffect(() => {
    if (transaction) {
      skipPhoneticConversionOnceRef.current = true; 
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setDate(new Date(transaction.date).toISOString().slice(0, 16));
      setSelectedBankAccountId(transaction.bankAccountId || undefined); // New
      setCurrentFilteredSuggestions(allSuggestions.filter(s => s.toLowerCase().includes(transaction.description.toLowerCase())));
    }
  }, [transaction, allSuggestions, isOpen]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInputValue: string = e.target.value;

    if (skipPhoneticConversionOnceRef.current) {
      setDescription(rawInputValue);
      skipPhoneticConversionOnceRef.current = false;
    } else {
      setDescription(rawInputValue); 
    }

    if (rawInputValue.trim()) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(rawInputValue.toLowerCase())
      );
      setCurrentFilteredSuggestions(filtered);
      setShowSuggestionsDropdown(true); 
    } else {
      setCurrentFilteredSuggestions(allSuggestions); 
      setShowSuggestionsDropdown(true); 
    }
  };
  
  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (skipPhoneticConversionOnceRef.current) return;

    if (isGlobalPhoneticModeActive && e.key === ' ') {
      e.preventDefault();
      const inputElement = e.target as HTMLInputElement;
      const currentValue = inputElement.value;
      const selectionStart = inputElement.selectionStart || 0;

      let wordStart = selectionStart - 1;
      while (wordStart >= 0 && currentValue[wordStart] !== ' ') {
        wordStart--;
      }
      wordStart++;

      const wordToConvert = currentValue.substring(wordStart, selectionStart);

      if (wordToConvert.trim()) {
        const convertedWord = convertToBanglaPhonetic(wordToConvert);
        const newValue = 
          currentValue.substring(0, wordStart) + 
          convertedWord + 
          ' ' + 
          currentValue.substring(selectionStart);
        
        setDescription(newValue);
        setTimeout(() => {
          const newCursorPos = wordStart + convertedWord.length + 1;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        const newValue = 
          currentValue.substring(0, selectionStart) + 
          ' ' + 
          currentValue.substring(selectionStart);
        setDescription(newValue);
        setTimeout(() => {
          inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
      }
      setShowSuggestionsDropdown(false);
    }
  };

  const handleDescriptionPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (skipPhoneticConversionOnceRef.current) {
        skipPhoneticConversionOnceRef.current = false; 
        return;
    }
    if (isGlobalPhoneticModeActive) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const convertedPastedText = convertToBanglaPhonetic(pastedText);
      
      const inputElement = e.target as HTMLInputElement;
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      
      const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
      setDescription(newValue);

      setTimeout(() => {
        const newCursorPos = start + convertedPastedText.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      setShowSuggestionsDropdown(false);
    }
  };


  const handleDescriptionFocus = () => {
    const valueForFiltering = descriptionInputRef.current?.value || description;
    if (valueForFiltering.trim() === '') {
      setCurrentFilteredSuggestions(allSuggestions);
    } else {
       const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(valueForFiltering.toLowerCase())
      );
      setCurrentFilteredSuggestions(filtered);
    }
    setShowSuggestionsDropdown(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    skipPhoneticConversionOnceRef.current = true; 
    setDescription(suggestion); 
    setShowSuggestionsDropdown(false);
    descriptionInputRef.current?.focus();
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        descriptionInputRef.current && !descriptionInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false);
      }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || !date) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR, 'error');
      return;
    }
    
    const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

    const updatedTransactionData: Transaction = {
      ...transaction,
      description: description.trim(), 
      amount: numAmount,
      type,
      date: new Date(date).toISOString(), 
      lastModified: new Date().toISOString(),
      originalDate: transaction.originalDate || transaction.date, 
      bankAccountId: selectedBankAccountId || undefined, // New
      bankAccountName: selectedAccount?.accountName || undefined, // New
    };
    onSave(updatedTransactionData);
    setShowSuggestionsDropdown(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[95]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-transaction-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 id="edit-transaction-modal-title" className="text-2xl font-semibold text-slate-700 mb-6">
          {BN_UI_TEXT.EDIT_TRANSACTION}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="flex justify-between items-end mb-1">
                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-600">
                {BN_UI_TEXT.DESCRIPTION}
                </label>
                 <button 
                    type="button" 
                    onClick={onOpenManageSuggestions}
                    className="text-xs text-teal-600 hover:text-teal-800 hover:underline flex items-center space-x-1"
                    title={BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT}
                    >
                    <ManageIcon className="w-3 h-3"/> 
                    <span>{BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT}</span>
                </button>
            </div>
            <input
              ref={descriptionInputRef}
              type="text"
              id="edit-description"
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={handleDescriptionKeyDown}
              onPaste={handleDescriptionPaste}
              onFocus={handleDescriptionFocus}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="edit-description-suggestions"
              aria-expanded={showSuggestionsDropdown}
            />
            {showSuggestionsDropdown && (
            <ul
              ref={suggestionsRef}
              id="edit-description-suggestions"
              className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
              role="listbox"
            >
              {currentFilteredSuggestions.length > 0 ? (
                currentFilteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseDown={(e) => e.preventDefault()} 
                    className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                    role="option"
                    aria-selected={description === suggestion} 
                  >
                    {suggestion}
                  </li>
                ))
              ) : (
                 description.trim() && ( 
                  <li className="px-4 py-2 text-center text-xs text-slate-500">
                    {BN_UI_TEXT.TRANSACTION_DESCRIPTION_NO_SUGGESTIONS}
                  </li>
                )
              )}
            </ul>
          )}
          </div>
          <div>
            <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL})
            </label>
            <input
              type="number"
              id="edit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
              min="0.01"
              step="0.01"
            />
          </div>
           <div>
            <label htmlFor="edit-date" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DATE}
            </label>
            <input
              type="datetime-local"
              id="edit-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-bank-account" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.SELECT_BANK_ACCOUNT_TRANSACTION_LABEL}
            </label>
            <select
              id="edit-bank-account"
              value={selectedBankAccountId || ''}
              onChange={(e) => setSelectedBankAccountId(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="">{BN_UI_TEXT.SELECT_BANK_ACCOUNT_PLACEHOLDER}</option>
              {bankAccounts.filter(acc => !acc.isDeleted).map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} {acc.bankName && `(${acc.bankName})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-600 mb-2">{BN_UI_TEXT.TRANSACTION_TYPE}</span>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-type"
                  value={TransactionType.INCOME}
                  checked={type === TransactionType.INCOME}
                  onChange={() => setType(TransactionType.INCOME)}
                  className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                />
                <span className="text-green-700">{BN_UI_TEXT.INCOME}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-type"
                  value={TransactionType.EXPENSE}
                  checked={type === TransactionType.EXPENSE}
                  onChange={() => setType(TransactionType.EXPENSE)}
                  className="form-radio h-5 w-5 text-red-600 focus:ring-red-500"
                />
                <span className="text-red-700">{BN_UI_TEXT.EXPENSE}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {BN_UI_TEXT.CANCEL}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {BN_UI_TEXT.SAVE_CHANGES}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;