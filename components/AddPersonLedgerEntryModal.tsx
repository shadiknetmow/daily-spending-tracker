
import React, { useState, FormEvent, useEffect } from 'react';
import { Person, PersonLedgerEntryType } from '../types';
import { BN_UI_TEXT } from '../constants';
import { useNotification } from '../contexts/NotificationContext'; // Import useNotification

interface AddPersonLedgerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onAddEntry: (data: {
    personId: string;
    type: PersonLedgerEntryType;
    amount: number;
    description: string;
    date: string;
  }) => void;
}

const AddPersonLedgerEntryModal: React.FC<AddPersonLedgerEntryModalProps> = ({
  isOpen,
  onClose,
  person,
  onAddEntry,
}) => {
  const [entryType, setEntryType] = useState<PersonLedgerEntryType>(PersonLedgerEntryType.DEBIT);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const { addNotification } = useNotification(); // Use notification hook

  useEffect(() => {
    if (isOpen) {
      setEntryType(PersonLedgerEntryType.DEBIT);
      setAmount('');
      setDescription('');
      setEntryDate(new Date().toISOString().slice(0, 16)); 
    }
  }, [isOpen]);

  if (!isOpen || !person) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR.replace("বিবরণ এবং ", ""), 'error'); 
      return;
    }
    if (!description.trim()) {
      addNotification(BN_UI_TEXT.FORM_VALIDATION_ERROR.replace(" এবং টাকার পরিমাণ", ""), 'error'); 
      return;
    }
    if (!entryDate) {
      addNotification("অনুগ্রহ করে একটি তারিখ নির্বাচন করুন।", 'error');
      return;
    }

    onAddEntry({
      personId: person.id,
      type: entryType,
      amount: numAmount,
      description: description.trim(),
      date: new Date(entryDate).toISOString(),
    });
    onClose(); 
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[99]" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-ledger-entry-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 id="add-ledger-entry-modal-title" className="text-xl font-semibold text-slate-700">
            {BN_UI_TEXT.ADD_LEDGER_ENTRY_MODAL_TITLE}
          </h2>
           <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-md text-slate-600 mb-5">
          {BN_UI_TEXT.PERSON_NAME}: <span className="font-semibold">{person.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="entry-date" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DATE} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="entry-date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">{BN_UI_TEXT.LEDGER_ENTRY_TYPE_LABEL} <span className="text-red-500">*</span></label>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-slate-200 hover:bg-slate-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-400">
                <input
                  type="radio"
                  name="ledgerEntryType"
                  value={PersonLedgerEntryType.DEBIT}
                  checked={entryType === PersonLedgerEntryType.DEBIT}
                  onChange={() => setEntryType(PersonLedgerEntryType.DEBIT)}
                  className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-orange-700">{BN_UI_TEXT.LEDGER_TYPE_DEBIT_PERSON}</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-slate-200 hover:bg-slate-50 has-[:checked]:bg-teal-50 has-[:checked]:border-teal-400">
                <input
                  type="radio"
                  name="ledgerEntryType"
                  value={PersonLedgerEntryType.CREDIT}
                  checked={entryType === PersonLedgerEntryType.CREDIT}
                  onChange={() => setEntryType(PersonLedgerEntryType.CREDIT)}
                  className="form-radio h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-teal-700">{BN_UI_TEXT.LEDGER_TYPE_CREDIT_PERSON}</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="ledger-amount" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.AMOUNT} ({BN_UI_TEXT.BDT_SYMBOL}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="ledger-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={BN_UI_TEXT.AMOUNT_PLACEHOLDER}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="ledger-description" className="block text-sm font-medium text-slate-600 mb-1">
              {BN_UI_TEXT.DESCRIPTION} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ledger-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={BN_UI_TEXT.LEDGER_ENTRY_DESCRIPTION_PLACEHOLDER}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              {BN_UI_TEXT.CANCEL}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {BN_UI_TEXT.ADD_LEDGER_ENTRY_BTN}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonLedgerEntryModal;
