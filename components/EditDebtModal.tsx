
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Debt, DebtType, Person, DebtFormSubmitData, FormPurpose } from '../types';
import { BN_UI_TEXT } from '../constants';
import UsersIcon from './icons/UsersIcon';
import { useNotification } from '../contexts/NotificationContext';

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onSave: (updatedDebtData: DebtFormSubmitData, originalDebtId: string) => void;
  persons: Person[]; 
  onOpenSelectPersonModal: (callback: (personId: string) => void) => void;
}

const EditDebtModal: React.FC<EditDebtModalProps> = ({ 
    isOpen, 
    onClose, 
    debt, 
    onSave, 
    persons, 
    onOpenSelectPersonModal 
}) => {
  const [personNameValue, setPersonNameValue] = useState('');
  const [personIdFromSelection, setPersonIdFromSelection] = useState<string | null>(null);
  const [amount, setAmount] = useState(''); // This will represent originalAmount
  const [description, setDescription] = useState('');
  const [currentDebtType, setCurrentDebtType] = useState<DebtType>(DebtType.PAYABLE);
  const [dueDate, setDueDate] = useState('');

  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const personInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();


  useEffect(() => {
    if (debt) {
      const currentPerson = persons.find(p => p.id === debt.personId && !p.isDeleted);
      setPersonNameValue(currentPerson ? currentPerson.name : BN_UI_TEXT.UNKNOWN_PERSON);
      setPersonIdFromSelection(debt.personId); 
      
      setAmount(debt.originalAmount.toString()); // Edit originalAmount
      setDescription(debt.description);
      setCurrentDebtType(debt.type);
      setDueDate(debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '');
      setShowSuggestions(false); 
    } else {
      setPersonNameValue('');
      setPersonIdFromSelection(null);
      setAmount('');
      setDescription('');
      setCurrentDebtType(DebtType.PAYABLE);
      setDueDate('');
      setShowSuggestions(false);
    }
  }, [debt, persons]);

  if (!isOpen || !debt) return null;

  const handlePersonSelectedFromModal = (selectedPersonId: string) => {
    const person = persons.find(p => p.id === selectedPersonId && !p.isDeleted);
    if (person) {
      setPersonNameValue(person.name);
      setPersonIdFromSelection(person.id);
    } else {
      // If selected person is somehow not found or deleted, revert or handle
      const currentPerson = persons.find(p => p.id === debt.personId && !p.isDeleted);
      setPersonNameValue(currentPerson ? currentPerson.name : BN_UI_TEXT.UNKNOWN_PERSON);
      setPersonIdFromSelection(debt.personId);
      addNotification("নির্বাচিত ব্যক্তিকে খুঁজে পাওয়া যায়নি বা মুছে ফেলা হয়েছে।", "warning");
    }
    setShowSuggestions(false);
  };

  const handlePersonNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const Pname = e.target.value;
    setPersonNameValue(Pname);
    setPersonIdFromSelection(null); // Clear explicit selection when typing

    if (Pname.trim()) {
      const lowerPname = Pname.toLowerCase();
      const filteredSuggestions = persons.filter(p => 
        !p.isDeleted && (
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
    setPersonNameValue(person.name);
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
    const numAmount = parseFloat(amount); // This is the new originalAmount
    if (!personNameValue.trim()) {
      addNotification(BN_UI_TEXT.PERSON_NAME_REQUIRED, 'error');
      return;
    }
    if (!personIdFromSelection && !persons.find(p => p.name.toLowerCase() === personNameValue.trim().toLowerCase() && !p.isDeleted)) {
        // If no ID selected AND typed name doesn't match any existing non-deleted person,
        // it implies creating a new person which might not be desired in edit mode without explicit confirmation.
        // However, the main onSave will handle this logic. Here we primarily validate form fields.
    }
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR, 'error');
      return;
    }
    
    const formPurpose: FormPurpose = currentDebtType === DebtType.PAYABLE ? FormPurpose.CREATE_PAYABLE : FormPurpose.CREATE_RECEIVABLE;

    onSave({
      personNameValue: personNameValue.trim(),
      explicitSelectedPersonId: personIdFromSelection,
      amount: numAmount, // This is the new/edited originalAmount
      description,
      formPurpose: formPurpose, // In edit mode, formPurpose is mainly to determine DebtType
      debtType: currentDebtType,
      dueDate: dueDate || undefined,
    }, debt.id);
    setShowSuggestions(false); 
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[95]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-debt-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 id="edit-debt-modal-title" className="text-2xl font-semibold text-slate-700 mb-6">
          {BN_UI_TEXT.EDIT_DEBT_MODAL_TITLE}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="edit-debt-person-name" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.PERSON_NAME} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                ref={personInputRef}
                type="text"
                id="edit-debt-person-name"
                value={personNameValue}
                onChange={handlePersonNameInputChange}
                onFocus={() => personNameValue.trim() && setShowSuggestions(true)} 
                placeholder={BN_UI_TEXT.PERSON_NAME_PLACEHOLDER}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                required
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="edit-person-suggestions"
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
                id="edit-person-suggestions"
                className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
                role="listbox"
              >
                {suggestions.length > 0 ? (
                  <ul
                    className="list-none p-0"
                  >
                    {suggestions.map(p => (
                      <li
                        key={p.id}
                        onClick={() => handleSuggestionClick(p)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                        role="option"
                        aria-selected={p.id === personIdFromSelection}
                      >
                        <p className="font-medium text-slate-700">{p.name}</p>
                        {p.mobileNumber && <p className="text-xs text-slate-500">মোবাইল: {p.mobileNumber}</p>}
                        {p.shopName && <p className="text-xs text-slate-500">দোকান: {p.shopName}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  personNameValue.trim() && (
                    <div className="p-3 text-center text-sm text-slate-500">
                        {BN_UI_TEXT.NO_SUGGESTIONS_FOUND} <span className="italic">"{personNameValue}"</span>.
                        <br/>
                        চালিয়ে গেলে, "<span className="font-semibold">{personNameValue}</span>" নামে নতুন ব্যক্তি তৈরি হবে এবং এই এন্ট্রিটি তার সাথে যুক্ত হবে।
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-debt-description" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DESCRIPTION} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="edit-debt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-debt-amount" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL}) <span className="text-sm text-slate-500">(মূল পরিমাণ)</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="edit-debt-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
              min="0.01"
              step="0.01"
            />
             {debt && debt.remainingAmount < parseFloat(amount) && !debt.isSettled && (
              <p className="mt-1 text-xs text-sky-600">
                বর্তমান বাকি: {BN_UI_TEXT.BDT_SYMBOL} {debt.remainingAmount.toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}. মূল পরিমাণ পরিবর্তন করলে বাকি থাকা পরিমাণ অ্যাডজাস্ট হতে পারে।
              </p>
            )}
          </div>
          <div>
            <label htmlFor="edit-debt-dueDate" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DUE_DATE}
            </label>
            <input
              type="date"
              id="edit-debt-dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-600 mb-2">{BN_UI_TEXT.DEBT_TYPE}</span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-200 border border-transparent">
                <input
                  type="radio"
                  name="edit-debtType"
                  value={DebtType.PAYABLE}
                  checked={currentDebtType === DebtType.PAYABLE}
                  onChange={() => setCurrentDebtType(DebtType.PAYABLE)}
                  className="form-radio h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-red-700">{BN_UI_TEXT.DEBT_PAYABLE_USER_OWES}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-50 has-[:checked]:bg-green-50 has-[:checked]:border-green-200 border border-transparent">
                <input
                  type="radio"
                  name="edit-debtType"
                  value={DebtType.RECEIVABLE}
                  checked={currentDebtType === DebtType.RECEIVABLE}
                  onChange={() => setCurrentDebtType(DebtType.RECEIVABLE)}
                  className="form-radio h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-green-700">{BN_UI_TEXT.DEBT_RECEIVABLE_USER_IS_OWED}</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
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

export default EditDebtModal;