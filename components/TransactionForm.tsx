
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { BN_UI_TEXT } from '../constants'; 
import ManageIcon from './icons/ManageIcon'; 
import { useNotification } from '../contexts/NotificationContext'; // Import useNotification

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'originalDate' | 'lastModified' | 'userId' | 'editHistory' | 'linkedLedgerEntryId'>) => void;
  showTitle?: boolean;
  allSuggestions: string[]; 
  onOpenManageSuggestions: () => void; 
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAddTransaction, 
  showTitle = true,
  allSuggestions,
  onOpenManageSuggestions
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  const [currentFilteredSuggestions, setCurrentFilteredSuggestions] = useState<string[]>(allSuggestions);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const { addNotification } = useNotification(); // Use notification hook

  useEffect(() => {
    if (description.trim() === '' || document.activeElement === descriptionInputRef.current) {
      setCurrentFilteredSuggestions(allSuggestions);
    }
  }, [allSuggestions, description]);


  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);
    if (value.trim()) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setCurrentFilteredSuggestions(filtered);
      setShowSuggestionsDropdown(true); 
    } else {
      setCurrentFilteredSuggestions(allSuggestions); 
      setShowSuggestionsDropdown(true); 
    }
  };

  const handleDescriptionFocus = () => {
    if (description.trim() === '') {
      setCurrentFilteredSuggestions(allSuggestions);
    } else {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(description.toLowerCase())
      );
      setCurrentFilteredSuggestions(filtered);
    }
    setShowSuggestionsDropdown(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR, 'error'); // Use notification
      return;
    }
    onAddTransaction({ description: description.trim(), amount: numAmount, type });
    setDescription('');
    setAmount('');
    setType(TransactionType.EXPENSE); 
    setShowSuggestionsDropdown(false);
    setCurrentFilteredSuggestions(allSuggestions); 
  };

  return (
    <section aria-labelledby={showTitle ? "add-transaction-heading" : undefined} className={` ${showTitle ? 'my-8 p-6 bg-white rounded-xl shadow-lg' : ''}`}>
      {showTitle && (
        <h2 id="add-transaction-heading" className="text-2xl font-semibold text-slate-700 mb-6 text-center">
          {BN_UI_TEXT.ADD_NEW_TRANSACTION}
        </h2>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="flex justify-between items-end mb-1">
            <label htmlFor="description" className="block text-sm font-medium text-slate-600">
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
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            onFocus={handleDescriptionFocus}
            placeholder={BN_UI_TEXT.DESCRIPTION_PLACEHOLDER}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
            required
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="description-suggestions"
            aria-expanded={showSuggestionsDropdown}
          />
          {showSuggestionsDropdown && (
            <ul
              ref={suggestionsRef}
              id="description-suggestions"
              className="absolute z-10 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="বিবরণের পরামর্শ"
            >
              {currentFilteredSuggestions.length > 0 ? (
                currentFilteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseDown={(e) => e.preventDefault()} 
                    className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm text-slate-700"
                    role="option"
                    aria-selected={description === suggestion}
                    tabIndex={0} 
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleSuggestionClick(suggestion);}}
                  >
                    {suggestion}
                  </li>
                ))
              ) : (
                 description.trim() && ( 
                  <li className="px-4 py-2 text-center text-xs text-slate-500" role="option" aria-live="polite">
                    {BN_UI_TEXT.TRANSACTION_DESCRIPTION_NO_SUGGESTIONS}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL})
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={BN_UI_TEXT.AMOUNT_PLACEHOLDER}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
            required
            min="0.01"
            step="0.01"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-slate-600 mb-2">{BN_UI_TEXT.TRANSACTION_TYPE}</span>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50">
              <input
                type="radio"
                name="type"
                value={TransactionType.INCOME}
                checked={type === TransactionType.INCOME}
                onChange={() => setType(TransactionType.INCOME)}
                className="form-radio h-5 w-5 text-green-600 focus:ring-green-500 border-slate-400"
              />
              <span className="text-green-700 font-medium">{BN_UI_TEXT.INCOME}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50">
              <input
                type="radio"
                name="type"
                value={TransactionType.EXPENSE}
                checked={type === TransactionType.EXPENSE}
                onChange={() => setType(TransactionType.EXPENSE)}
                className="form-radio h-5 w-5 text-red-600 focus:ring-red-500 border-slate-400"
              />
              <span className="text-red-700 font-medium">{BN_UI_TEXT.EXPENSE}</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          {BN_UI_TEXT.ADD_TRANSACTION_BTN}
        </button>
      </form>
    </section>
  );
};

export default TransactionForm;
