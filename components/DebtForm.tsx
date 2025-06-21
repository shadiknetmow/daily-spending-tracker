import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Debt, DebtType, Person, FormPurpose, DebtFormSubmitData } from '../types'; // Updated paths
import { BN_UI_TEXT } from '../constants'; // Updated path
import UsersIcon from './icons/UsersIcon';
import { useNotification } from '../contexts/NotificationContext'; 

interface DebtFormProps {
  onAddDebt: (debtData: DebtFormSubmitData) => void; 
  showTitle?: boolean;
  persons: Person[];
  debts: Debt[]; 
  onOpenSelectPersonModal: (callback: (personId: string) => void) => void;
  getCompositePersonBalance: (personId: string) => number; 
}

interface DisplayBalanceInfo {
  text: string;
  amount: number;
  colorClass: string;
}

const DebtForm: React.FC<DebtFormProps> = ({ 
  onAddDebt, 
  showTitle = true,
  persons,
  onOpenSelectPersonModal,
  getCompositePersonBalance,
}) => {
  const [personNameValue, setPersonNameValue] = useState('');
  const [personIdFromSelection, setPersonIdFromSelection] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currentFormPurpose, setCurrentFormPurpose] = useState<FormPurpose>(FormPurpose.CREATE_RECEIVABLE);
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  
  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const personInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [displayBalanceInfo, setDisplayBalanceInfo] = useState<DisplayBalanceInfo | null>(null);
  const [calculatedNetBalance, setCalculatedNetBalance] = useState<number>(0);
  const prevPersonIdRef = useRef<string | null>(null);
  const { addNotification } = useNotification(); 


  useEffect(() => {
    let newCalculatedNetBalance = 0;
    let newDisplayBalanceInfo: DisplayBalanceInfo | null = null;

    if (personIdFromSelection && getCompositePersonBalance) {
        newCalculatedNetBalance = getCompositePersonBalance(personIdFromSelection);

        if (newCalculatedNetBalance > 0) { 
            newDisplayBalanceInfo = {
                text: BN_UI_TEXT.PERSON_OWES_YOU_NET_DEBT_LABEL,
                amount: newCalculatedNetBalance,
                colorClass: 'text-green-600 font-medium',
            };
        } else if (newCalculatedNetBalance < 0) { 
            newDisplayBalanceInfo = {
                text: BN_UI_TEXT.YOU_OWE_PERSON_NET_DEBT_LABEL,
                amount: Math.abs(newCalculatedNetBalance),
                colorClass: 'text-red-600 font-medium',
            };
        } else { 
            newDisplayBalanceInfo = {
                text: BN_UI_TEXT.NET_DEBT_BALANCE_ZERO_LABEL,
                amount: 0,
                colorClass: 'text-slate-600',
            };
        }
    }
    
    setCalculatedNetBalance(newCalculatedNetBalance);
    setDisplayBalanceInfo(newDisplayBalanceInfo);

    if (personIdFromSelection !== prevPersonIdRef.current) {
        if (personIdFromSelection) {
            if (newCalculatedNetBalance > 0) { 
                setCurrentFormPurpose(FormPurpose.RECORD_PERSON_PAYMENT);
            } else if (newCalculatedNetBalance < 0) { 
                setCurrentFormPurpose(FormPurpose.RECORD_USER_PAYMENT_TO_PERSON); 
            } else { 
                setCurrentFormPurpose(FormPurpose.CREATE_RECEIVABLE);
            }
        } else { 
            setCurrentFormPurpose(FormPurpose.CREATE_RECEIVABLE);
        }
    }
    prevPersonIdRef.current = personIdFromSelection;

  }, [personIdFromSelection, getCompositePersonBalance]);

  useEffect(() => {
      const recordPaymentFromPersonIsDisabled = !personIdFromSelection || calculatedNetBalance <= 0;
      const recordPaymentToPersonIsDisabled = !personIdFromSelection || calculatedNetBalance >= 0;

      if (currentFormPurpose === FormPurpose.RECORD_PERSON_PAYMENT && recordPaymentFromPersonIsDisabled) {
          setCurrentFormPurpose(FormPurpose.CREATE_RECEIVABLE); 
      }
      if (currentFormPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON && recordPaymentToPersonIsDisabled) {
          setCurrentFormPurpose(FormPurpose.CREATE_PAYABLE); 
      }
  }, [currentFormPurpose, personIdFromSelection, calculatedNetBalance]);

  useEffect(() => {
      if (currentFormPurpose === FormPurpose.RECORD_PERSON_PAYMENT || currentFormPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON) {
          setDueDate(''); 
          if (!paymentDate) { 
              setPaymentDate(new Date().toISOString().slice(0, 16));
          }
      } else {
          setPaymentDate('');
      }
  }, [currentFormPurpose, paymentDate]); 

  const handlePersonSelectedFromModal = (selectedPersonId: string) => {
    const person = persons.find(p => p.id === selectedPersonId);
    if (person) {
      setPersonNameValue(person.customAlias || person.name);
      setPersonIdFromSelection(person.id); 
    } else {
      setPersonNameValue('');
      setPersonIdFromSelection(null); 
    }
    setShowSuggestions(false);
  };

  const handlePersonNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const Pname = e.target.value;
    setPersonNameValue(Pname);
    setPersonIdFromSelection(null); // Clear explicit selection when typing
    setDisplayBalanceInfo(null); // Clear balance info when typing
    
    if (Pname.trim()) {
      const lowerPname = Pname.toLowerCase();
      const filteredSuggestions = persons.filter(p => 
        !p.isDeleted && (
          (p.customAlias && p.customAlias.toLowerCase().includes(lowerPname)) ||
          p.name.toLowerCase().includes(lowerPname) || 
          (p.mobileNumber && p.mobileNumber.includes(Pname)) 
        )
      ).slice(0, 5); 
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (person: Person) => {
    setPersonNameValue(person.customAlias || person.name);
    setPersonIdFromSelection(person.id); 
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        personInputRef.current && !personInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!personNameValue.trim()) {
      addNotification(BN_UI_TEXT.PERSON_NAME_REQUIRED, 'error');
      return;
    }
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR, 'error');
      return;
    }

    const payload: DebtFormSubmitData = {
      personNameValue: personNameValue.trim(),
      explicitSelectedPersonId: personIdFromSelection, 
      amount: numAmount,
      description,
      formPurpose: currentFormPurpose,
    };

    if (currentFormPurpose === FormPurpose.CREATE_PAYABLE) {
      payload.debtType = DebtType.PAYABLE;
      payload.dueDate = dueDate || undefined;
    } else if (currentFormPurpose === FormPurpose.CREATE_RECEIVABLE) {
      payload.debtType = DebtType.RECEIVABLE;
      payload.dueDate = dueDate || undefined;
    } else if (currentFormPurpose === FormPurpose.RECORD_PERSON_PAYMENT || currentFormPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON) {
      if (!paymentDate) {
        addNotification(BN_UI_TEXT.DEBT_FORM_ALERT_PAYMENT_DATE_REQUIRED, 'error');
        return;
      }
      payload.paymentDate = new Date(paymentDate).toISOString();
    }
    
    onAddDebt(payload);

    setPersonNameValue('');
    setPersonIdFromSelection(null); 
    setAmount('');
    setDescription('');
    setDueDate('');
    setPaymentDate(''); 
    setShowSuggestions(false);
    setDisplayBalanceInfo(null);
  };
  
  const recordPaymentFromPersonDisabled = !personIdFromSelection || calculatedNetBalance <= 0;
  const recordPaymentToPersonDisabled = !personIdFromSelection || calculatedNetBalance >= 0;


  return (
    <section aria-labelledby={showTitle ? "add-debt-heading" : undefined} className={`${showTitle ? 'my-8 p-6 bg-white rounded-xl shadow-lg' : ''}`}>
      {showTitle && (
        <h2 id="add-debt-heading" className="text-2xl font-semibold text-slate-700 mb-6 text-center">
          {BN_UI_TEXT.ADD_NEW_DEBT} 
        </h2>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="debt-person-name" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.PERSON_NAME} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center space-x-2">
              <input
                ref={personInputRef}
                type="text"
                id="debt-person-name"
                value={personNameValue}
                onChange={handlePersonNameInputChange}
                onFocus={() => personNameValue.trim() && setShowSuggestions(true)} 
                placeholder={BN_UI_TEXT.PERSON_NAME_PLACEHOLDER}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="person-suggestions"
              />
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false); 
                  onOpenSelectPersonModal(handlePersonSelectedFromModal);
                }}
                className="p-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400"
                title={BN_UI_TEXT.SELECT_PERSON_BTN_TITLE}
                aria-label={BN_UI_TEXT.SELECT_PERSON_BTN_TITLE}
              >
                <UsersIcon className="w-5 h-5" />
              </button>
            </div>
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                id="person-suggestions"
                className="absolute z-10 w-full sm:w-[calc(100%-3.5rem)] bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto" // Adjusted width for smaller screens
                role="listbox"
                aria-label="ব্যক্তির নামের সাজেশন"
              >
                {suggestions.length > 0 ? (
                  <ul
                    className="list-none p-0"
                  >
                    {suggestions.map(person => (
                      <li
                        key={person.id}
                        onClick={() => handleSuggestionClick(person)}
                        onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click
                        className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                        role="option"
                        aria-selected={person.id === personIdFromSelection}
                      >
                        <p className="font-medium text-slate-700">{person.customAlias || person.name}</p>
                        {person.mobileNumber && <p className="text-xs text-slate-500">মোবাইল: {person.mobileNumber}</p>}
                        {person.shopName && <p className="text-xs text-slate-500">দোকান: {person.shopName}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  personNameValue.trim() && (
                    <div className="p-3 text-center text-sm text-slate-500">
                      {BN_UI_TEXT.NO_SUGGESTIONS_FOUND} <span className="italic">"{personNameValue}"</span>.
                      <br />
                      চালিয়ে গেলে, "<span className="font-semibold">{personNameValue}</span>" নামে নতুন ব্যক্তি তৈরি হবে এবং এই এন্ট্রিটি তার সাথে যুক্ত হবে।
                    </div>
                  )
                )}
              </div>
            )}
          </div>
          {displayBalanceInfo && personIdFromSelection && ( 
            <div className={`mt-2 px-3 py-1.5 text-xs rounded-md bg-slate-50 border border-slate-200 ${displayBalanceInfo.colorClass}`}>
              {displayBalanceInfo.text}{' '}
              {displayBalanceInfo.amount !== 0 || displayBalanceInfo.text === BN_UI_TEXT.NET_DEBT_BALANCE_ZERO_LABEL ? (
                <>
                  {displayBalanceInfo.text !== BN_UI_TEXT.NET_DEBT_BALANCE_ZERO_LABEL && (
                    <span className="font-semibold">
                      {BN_UI_TEXT.BDT_SYMBOL}{' '}
                      {displayBalanceInfo.amount.toLocaleString('bn-BD', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </>
              ): null }
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="debt-description" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.DESCRIPTION} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="debt-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={BN_UI_TEXT.DEBT_DESCRIPTION_PLACEHOLDER}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="debt-amount" className="block text-sm font-medium text-slate-600 mb-1">
            {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="debt-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={BN_UI_TEXT.AMOUNT_PLACEHOLDER}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            required
            min="0.01"
            step="0.01"
          />
        </div>

        {(currentFormPurpose === FormPurpose.CREATE_PAYABLE || currentFormPurpose === FormPurpose.CREATE_RECEIVABLE) && (
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DUE_DATE}
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        )}

        {(currentFormPurpose === FormPurpose.RECORD_PERSON_PAYMENT || currentFormPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON) && (
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.PAYMENT_DATE} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="paymentDate"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
        )}

        <div>
          <span className="block text-sm font-medium text-slate-600 mb-2">{BN_UI_TEXT.ENTRY_NATURE_LABEL}</span>
          <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-200 border border-transparent">
              <input
                type="radio"
                name="formPurpose"
                value={FormPurpose.CREATE_PAYABLE}
                checked={currentFormPurpose === FormPurpose.CREATE_PAYABLE}
                onChange={() => setCurrentFormPurpose(FormPurpose.CREATE_PAYABLE)}
                className="form-radio h-4 w-4 text-red-600 focus:ring-red-500 border-slate-400"
              />
              <span className="text-sm text-red-700 font-medium">{BN_UI_TEXT.DEBT_PAYABLE_USER_OWES}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-200 border border-transparent">
              <input
                type="radio"
                name="formPurpose"
                value={FormPurpose.CREATE_RECEIVABLE}
                checked={currentFormPurpose === FormPurpose.CREATE_RECEIVABLE}
                onChange={() => setCurrentFormPurpose(FormPurpose.CREATE_RECEIVABLE)}
                className="form-radio h-4 w-4 text-green-600 focus:ring-green-500 border-slate-400"
              />
              <span className="text-sm text-green-700 font-medium">{BN_UI_TEXT.DEBT_RECEIVABLE_USER_IS_OWED}</span>
            </label>
            <label className={`flex items-center space-x-2 p-2 rounded-md border border-transparent ${recordPaymentFromPersonDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50 has-[:checked]:bg-teal-50 has-[:checked]:border-teal-200'}`}>
              <input
                type="radio"
                name="formPurpose"
                value={FormPurpose.RECORD_PERSON_PAYMENT}
                checked={currentFormPurpose === FormPurpose.RECORD_PERSON_PAYMENT}
                onChange={() => setCurrentFormPurpose(FormPurpose.RECORD_PERSON_PAYMENT)}
                className="form-radio h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-400"
                disabled={recordPaymentFromPersonDisabled}
              />
              <span className={`text-sm font-medium ${recordPaymentFromPersonDisabled ? 'text-slate-500' : 'text-teal-700'}`}>{BN_UI_TEXT.PERSON_PAYMENT_RECEIVED_LEDGER_CREDIT}</span>
            </label>
            <label className={`flex items-center space-x-2 p-2 rounded-md border border-transparent ${recordPaymentToPersonDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-200'}`}>
              <input
                type="radio"
                name="formPurpose"
                value={FormPurpose.RECORD_USER_PAYMENT_TO_PERSON}
                checked={currentFormPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON}
                onChange={() => setCurrentFormPurpose(FormPurpose.RECORD_USER_PAYMENT_TO_PERSON)}
                className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-400"
                disabled={recordPaymentToPersonDisabled}
              />
              <span className={`text-sm font-medium ${recordPaymentToPersonDisabled ? 'text-slate-500' : 'text-orange-700'}`}>{BN_UI_TEXT.PERSON_PAYMENT_MADE_BY_USER_LEDGER_DEBIT}</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          {BN_UI_TEXT.ADD_ENTRY_BTN}
        </button>
      </form>
    </section>
  );
};

export default DebtForm;