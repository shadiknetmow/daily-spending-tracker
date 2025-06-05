
import React, { useState, useMemo } from 'react';
import { Person } from '../types';
import { BN_UI_TEXT } from '../constants';
import PlusCircleIcon from './icons/PlusCircleIcon'; // Assuming you have this icon

interface SelectPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  onSelectPerson: (personId: string) => void;
  onAddNewPerson: () => void; // Callback to trigger opening the Add Person form
}

const SelectPersonModal: React.FC<SelectPersonModalProps> = ({
  isOpen,
  onClose,
  persons,
  onSelectPerson,
  onAddNewPerson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersons = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return persons // Already filtered for !isDeleted in App.tsx before passing
      .filter(person =>
        person.name.toLowerCase().includes(lowerSearchTerm) ||
        (person.mobileNumber && person.mobileNumber.includes(lowerSearchTerm))
      )
      .sort((a,b) => a.name.localeCompare(b.name, 'bn-BD'));
  }, [persons, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[97]" // Higher z-index than primary modals
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-person-modal-title"
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="select-person-modal-title" className="text-xl font-semibold text-slate-800">
            {BN_UI_TEXT.SELECT_PERSON_MODAL_TITLE}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={BN_UI_TEXT.SEARCH_PERSON_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            autoFocus
            aria-label="ব্যক্তি খুঁজুন"
          />
          <button
            onClick={() => {
              onAddNewPerson(); // This will be handled by App.tsx to open PersonFormModal
            }}
            className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition duration-150 text-sm sm:text-base flex-shrink-0"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.ADD_NEW_PERSON_BTN}</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1">
          {filteredPersons.length === 0 ? (
            <p className="text-slate-500 text-center py-5">
              {searchTerm ? `"${searchTerm}" এর জন্য কোনো ব্যক্তি খুঁজে পাওয়া যায়নি।` : BN_UI_TEXT.NO_PERSONS_FOUND}
            </p>
          ) : (
            <ul className="space-y-2" role="listbox" aria-label="ব্যক্তিদের তালিকা">
              {filteredPersons.map(person => (
                <li key={person.id} role="option" aria-selected="false">
                  <button
                    onClick={() => {
                      onSelectPerson(person.id);
                      // onClose(); // App.tsx will handle closing after callback
                    }}
                    className="w-full text-left p-3 rounded-md hover:bg-teal-50 focus:bg-teal-100 focus:outline-none focus:ring-1 focus:ring-teal-500 transition duration-150"
                  >
                    <span className="font-medium text-slate-700">{person.name}</span>
                    {person.mobileNumber && <span className="text-xs text-slate-500 block">মোবাইল: {person.mobileNumber}</span>}
                    {person.shopName && <span className="text-xs text-slate-500 block">দোকান: {person.shopName}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-200 text-right">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
                {BN_UI_TEXT.CANCEL}
            </button>
        </div>
      </div>
       <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: #f8fafc; /* bg-slate-50 */ border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #e2e8f0; /* slate-200 */ border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #cbd5e1; /* slate-300 */ }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default SelectPersonModal;