
import React, { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { TransactionType, ExpenseFieldRequirements, BankAccount } from '../types';
import { BN_UI_TEXT, COMMON_UNITS_BN, EXPENSE_TO_UNIT_MAP_BN } from '../constants';
import ManageIcon from './icons/ManageIcon';
import { useNotification } from '../contexts/NotificationContext';
import { convertToBanglaPhonetic } from '../utils/textUtils'; 

interface SimplifiedTransactionFormProps {
  transactionType: TransactionType;
  onAddTransaction: (transactionData: { 
    description: string; 
    amount: number; 
    type: TransactionType; 
    date: string;
    bankAccountId?: string; // New
    bankAccountName?: string; // New
  }) => Promise<boolean>;
  suggestionsList: string[];
  onOpenManageSuggestions: () => void;
  formTitle: string;
  expenseFieldRequirements: ExpenseFieldRequirements;
  onUpdateExpenseFieldRequirements: (newRequirements: Partial<ExpenseFieldRequirements>) => void;
  isGlobalPhoneticModeActive: boolean;
  bankAccounts: BankAccount[]; // New
  defaultBankAccountId?: string | null; // New
}

export const SimplifiedTransactionForm: React.FC<SimplifiedTransactionFormProps> = ({
  transactionType,
  onAddTransaction,
  suggestionsList,
  onOpenManageSuggestions,
  expenseFieldRequirements,
  onUpdateExpenseFieldRequirements,
  isGlobalPhoneticModeActive,
  bankAccounts, // New
  defaultBankAccountId, // New
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>(defaultBankAccountId || undefined); // New

  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [currentFilteredSuggestions, setCurrentFilteredSuggestions] = useState<string[]>(suggestionsList);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);
  const additionalNotesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const { addNotification } = useNotification();
  const skipPhoneticConversionOnceRef = useRef(false); 

  const resetFormForNewEntry = useCallback(() => {
    skipPhoneticConversionOnceRef.current = true;
    setDescription('');
    setAmount('');
    setQuantity('');
    setUnit('');
    setAdditionalNotes('');
    // setTransactionDate(new Date().toISOString().slice(0, 16)); // Keep date or reset as needed
    setSelectedBankAccountId(defaultBankAccountId || undefined); // Reset to default or undefined
    setCurrentFilteredSuggestions(suggestionsList);
    setShowSuggestionsDropdown(false);
    setTimeout(() => descriptionInputRef.current?.focus(), 0);
  }, [suggestionsList, defaultBankAccountId]);

  useEffect(() => {
    resetFormForNewEntry();
  }, [transactionType, suggestionsList, resetFormForNewEntry]);

  useEffect(() => {
    // When defaultBankAccountId changes (e.g., user sets a new default elsewhere),
    // update the selectedBankAccountId in this form *if* no account is currently selected for this entry.
    if (!selectedBankAccountId && defaultBankAccountId) {
      setSelectedBankAccountId(defaultBankAccountId);
    }
  }, [defaultBankAccountId, selectedBankAccountId]);
  

  useEffect(() => {
    if (transactionType === TransactionType.EXPENSE && description) {
      const lowerDesc = description.toLowerCase(); 
      let suggestedUnitVal = '';
      for (const keyword in EXPENSE_TO_UNIT_MAP_BN) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          suggestedUnitVal = EXPENSE_TO_UNIT_MAP_BN[keyword];
          break;
        }
      }
      if (suggestedUnitVal && !unit.trim()) {
        skipPhoneticConversionOnceRef.current = true;
        setUnit(suggestedUnitVal);
      }
    } else if (transactionType !== TransactionType.EXPENSE) {
      skipPhoneticConversionOnceRef.current = true;
      setUnit('');
    }
  }, [description, transactionType, unit]);

  // Generic change handler
  const makeChangeHandler = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    filterSuggestions?: (value: string) => void
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawInputValue: string = e.target.value;
    if (skipPhoneticConversionOnceRef.current) {
      setter(rawInputValue); 
      skipPhoneticConversionOnceRef.current = false;
    } else {
      setter(rawInputValue); 
    }
    if (filterSuggestions) {
      filterSuggestions(rawInputValue);
    }
  };
  
  // Generic keydown handler
  const makeKeyDownHandler = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    inputRefToUpdate?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (skipPhoneticConversionOnceRef.current) return;

    if (isGlobalPhoneticModeActive && e.key === ' ') {
      e.preventDefault();
      const inputElement = inputRefToUpdate?.current || e.target as HTMLInputElement | HTMLTextAreaElement;
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
        
        setter(newValue); 
        setTimeout(() => {
          const newCursorPos = wordStart + convertedWord.length + 1;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        const newValue = 
          currentValue.substring(0, selectionStart) + 
          ' ' + 
          currentValue.substring(selectionStart);
        setter(newValue); 
        setTimeout(() => {
          inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
      }
      if (setter === setDescription) setShowSuggestionsDropdown(false);
    }
  };

  // Generic paste handler
  const makePasteHandler = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    inputRefToUpdate?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (skipPhoneticConversionOnceRef.current) {
        skipPhoneticConversionOnceRef.current = false;
        return;
    }
    if (isGlobalPhoneticModeActive) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const convertedPastedText = convertToBanglaPhonetic(pastedText); 
      
      const inputElement = inputRefToUpdate?.current || e.target as HTMLInputElement | HTMLTextAreaElement;
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      
      const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
      setter(newValue); 

      setTimeout(() => {
        const newCursorPos = start + convertedPastedText.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      if (setter === setDescription) setShowSuggestionsDropdown(false);
    }
  };

  const descriptionSuggestionFilter = (value: string) => {
    if (value.trim()) {
      const filtered = suggestionsList.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setCurrentFilteredSuggestions(filtered);
      setShowSuggestionsDropdown(true);
    } else {
      setCurrentFilteredSuggestions(suggestionsList);
      setShowSuggestionsDropdown(true); 
    }
  };

  const handleDescriptionChange = makeChangeHandler(setDescription, descriptionSuggestionFilter);
  const handleDescriptionKeyDown = makeKeyDownHandler(setDescription, descriptionInputRef);
  const handleDescriptionPaste = makePasteHandler(setDescription, descriptionInputRef);
  
  const handleUnitChange = makeChangeHandler(setUnit);
  const handleUnitKeyDown = makeKeyDownHandler(setUnit, unitInputRef);
  const handleUnitPaste = makePasteHandler(setUnit, unitInputRef);

  const handleAdditionalNotesChange = makeChangeHandler(setAdditionalNotes);
  const handleAdditionalNotesKeyDown = makeKeyDownHandler(setAdditionalNotes, additionalNotesTextareaRef);
  const handleAdditionalNotesPaste = makePasteHandler(setAdditionalNotes, additionalNotesTextareaRef);


  const handleDescriptionFocus = () => {
    const valueForFiltering = descriptionInputRef.current?.value || description;

    if (valueForFiltering.trim() === '') {
      setCurrentFilteredSuggestions(suggestionsList);
    } else {
      const filtered = suggestionsList.filter(suggestion =>
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0 || !transactionDate) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR, 'error');
      return;
    }

    if (transactionType === TransactionType.EXPENSE) {
      if (expenseFieldRequirements.quantityRequired && !quantity.trim()) {
        addNotification(`${BN_UI_TEXT.QUANTITY_LABEL} ${BN_UI_TEXT.FIELD_IS_REQUIRED}`, 'error');
        return;
      }
      if (expenseFieldRequirements.unitRequired && !unit.trim()) {
        addNotification(`${BN_UI_TEXT.UNIT_LABEL} ${BN_UI_TEXT.FIELD_IS_REQUIRED}`, 'error');
        return;
      }
      if (expenseFieldRequirements.notesRequired && !additionalNotes.trim()) {
        addNotification(`${BN_UI_TEXT.ADDITIONAL_NOTES_LABEL.replace("(ঐচ্ছিক)", "").trim()} ${BN_UI_TEXT.FIELD_IS_REQUIRED}`, 'error');
        return;
      }
    }

    let finalDescription = description.trim();
    if (transactionType === TransactionType.EXPENSE) {
        const qtyTrimmed = quantity.trim();
        const unitTrimmed = unit.trim();
        const notesTrimmed = additionalNotes.trim();
        
        const detailParts: string[] = [];
        if (qtyTrimmed || unitTrimmed) { 
            let qtyUnitString = qtyTrimmed || ""; 
            if (unitTrimmed) {
                qtyUnitString = qtyTrimmed ? `${qtyTrimmed} ${unitTrimmed}` : unitTrimmed;
            }
            if(qtyUnitString) detailParts.push(`[${qtyUnitString}]`);
        }
        if (notesTrimmed) {
            detailParts.push(notesTrimmed);
        }

        if (detailParts.length > 0) {
            finalDescription += ` ${detailParts.join(' - ')}`;
        }
    }
    
    const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

    const success = await onAddTransaction({
      description: finalDescription,
      amount: numAmount,
      type: transactionType,
      date: new Date(transactionDate).toISOString(),
      bankAccountId: selectedBankAccountId || undefined,
      bankAccountName: selectedAccount?.accountName || undefined,
    });

    if (success) {
      resetFormForNewEntry();
    }
  };

  const submitButtonText = transactionType === TransactionType.INCOME
    ? BN_UI_TEXT.ADD_INCOME_BTN_TEXT
    : BN_UI_TEXT.ADD_EXPENSE_BTN_TEXT;

  const showExpenseDetails = transactionType === TransactionType.EXPENSE && description.trim() !== '';

  const renderRequirementToggle = (fieldKey: keyof ExpenseFieldRequirements, fieldLabel: string) => (
    <div className="flex items-center space-x-1.5">
      <input
        type="checkbox"
        id={`require-${String(fieldKey)}`}
        checked={expenseFieldRequirements[fieldKey]}
        onChange={(e) => onUpdateExpenseFieldRequirements({ [fieldKey]: e.target.checked })}
        className="form-checkbox h-3.5 w-3.5 text-teal-500 rounded-sm border-slate-400 focus:ring-teal-400 cursor-pointer"
        aria-label={`${fieldLabel} আবশ্যক করুন`}
      />
      <label htmlFor={`require-${String(fieldKey)}`} className="text-xs text-slate-500 cursor-pointer">{BN_UI_TEXT.FIELD_REQUIRED_TOGGLE}</label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <div className="flex justify-between items-end mb-1">
          <label htmlFor="s-description" className="block text-sm font-medium text-slate-600">
            {BN_UI_TEXT.DESCRIPTION} <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={onOpenManageSuggestions}
            className="text-xs text-teal-600 hover:text-teal-800 hover:underline flex items-center space-x-1"
            title={BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT}
          >
            <ManageIcon className="w-3 h-3" />
            <span>{BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT}</span>
          </button>
        </div>
        <input
          ref={descriptionInputRef}
          type="text"
          id="s-description"
          value={description}
          onChange={handleDescriptionChange}
          onKeyDown={handleDescriptionKeyDown}
          onPaste={handleDescriptionPaste}
          onFocus={handleDescriptionFocus}
          placeholder={BN_UI_TEXT.DESCRIPTION_PLACEHOLDER}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
          required
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="s-description-suggestions"
          aria-expanded={showSuggestionsDropdown}
        />
        {showSuggestionsDropdown && (
          <ul
            ref={suggestionsRef}
            id="s-description-suggestions"
            className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
            role="listbox"
          >
            {currentFilteredSuggestions.length > 0 ? (
              currentFilteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm text-slate-700"
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleSuggestionClick(suggestion);}}
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

      {showExpenseDetails && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="s-quantity" className="block text-sm font-medium text-slate-600">
                        {BN_UI_TEXT.QUANTITY_LABEL}
                        {expenseFieldRequirements.quantityRequired && <span className="text-red-500">*</span>}
                    </label>
                    {renderRequirementToggle('quantityRequired', BN_UI_TEXT.QUANTITY_LABEL)}
                </div>
              <input
                type="number"
                id="s-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="যেমন: ২"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                min="0"
                step="any"
                required={expenseFieldRequirements.quantityRequired}
              />
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="s-unit" className="block text-sm font-medium text-slate-600">
                        {BN_UI_TEXT.UNIT_LABEL}
                        {expenseFieldRequirements.unitRequired && <span className="text-red-500">*</span>}
                    </label>
                    {renderRequirementToggle('unitRequired', BN_UI_TEXT.UNIT_LABEL)}
                </div>
              <input
                ref={unitInputRef}
                type="text"
                id="s-unit"
                value={unit}
                onChange={handleUnitChange}
                onKeyDown={handleUnitKeyDown}
                onPaste={handleUnitPaste}
                placeholder={BN_UI_TEXT.UNIT_PLACEHOLDER}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                list="common-units-datalist"
                required={expenseFieldRequirements.unitRequired}
              />
              <datalist id="common-units-datalist">
                {COMMON_UNITS_BN.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="s-additional-notes" className="block text-sm font-medium text-slate-600">
                {BN_UI_TEXT.ADDITIONAL_NOTES_LABEL}
                {expenseFieldRequirements.notesRequired && <span className="text-red-500">*</span>}
                </label>
                {renderRequirementToggle('notesRequired', BN_UI_TEXT.ADDITIONAL_NOTES_LABEL.replace("(ঐচ্ছিক)","").trim())}
            </div>
            <textarea
              ref={additionalNotesTextareaRef}
              id="s-additional-notes"
              value={additionalNotes}
              onChange={handleAdditionalNotesChange}
              onKeyDown={handleAdditionalNotesKeyDown}
              onPaste={handleAdditionalNotesPaste}
              placeholder={BN_UI_TEXT.ADDITIONAL_NOTES_PLACEHOLDER}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required={expenseFieldRequirements.notesRequired}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="s-amount" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="s-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={BN_UI_TEXT.AMOUNT_PLACEHOLDER}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            required
            min="0.01"
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="s-transaction-date" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.DATE} <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="s-transaction-date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="s-bank-account" className="block text-sm font-medium text-slate-600 mb-1">
          {BN_UI_TEXT.SELECT_BANK_ACCOUNT_TRANSACTION_LABEL}
        </label>
        <select
          id="s-bank-account"
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


      <button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-150 ease-in-out"
      >
        {submitButtonText}
      </button>
    </form>
  );
};