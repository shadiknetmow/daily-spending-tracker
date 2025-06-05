


import React from 'react';
import { Person } from '../types';
import { BN_UI_TEXT } from '../constants';
import EyeIcon from './icons/EyeIcon'; 

export interface ReceivablePersonData {
  personId: string;
  personName: string;
  personMobile?: string;
  totalReceivableAmount: number;
}

interface ReceivablePersonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivablePersons: ReceivablePersonData[];
  onViewPersonDetails: (person: Person) => void; 
  persons: Person[]; 
}

const ReceivablePersonsModal: React.FC<ReceivablePersonsModalProps> = ({
  isOpen,
  onClose,
  receivablePersons,
  onViewPersonDetails,
  persons,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (num: number): string =>
    `${BN_UI_TEXT.BDT_SYMBOL} ${num.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePersonClick = (personId: string) => {
    const personObject = persons.find(p => p.id === personId); 
    if (personObject) {
      onViewPersonDetails(personObject);
      onClose(); 
    }
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[98]" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="receivable-persons-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="receivable-persons-modal-title" className="text-xl font-semibold text-slate-800">
            {BN_UI_TEXT.RECEIVABLE_PERSONS_MODAL_TITLE}
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

        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1">
          {receivablePersons.length === 0 ? (
            <p className="text-slate-500 text-center py-8">{BN_UI_TEXT.NO_PERSONS_WITH_RECEIVABLES}</p>
          ) : (
            <ul className="space-y-3">
              {receivablePersons.map((item) => (
                <li key={item.personId} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow duration-150">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-semibold text-green-700">{item.personName}</h3>
                      {item.personMobile && (
                        <p className="text-xs text-slate-500">
                          {BN_UI_TEXT.PERSON_MOBILE_NUMBER}: {item.personMobile}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mt-0.5">
                        {BN_UI_TEXT.TOTAL_RECEIVABLE_FROM_PERSON_LABEL}{' '}
                        <span className="font-bold text-green-600">{formatCurrency(item.totalReceivableAmount)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handlePersonClick(item.personId)}
                      className="text-sky-600 hover:text-sky-700 p-2 rounded-full hover:bg-sky-100 transition-colors"
                      title={BN_UI_TEXT.VIEW_DETAILS_FOR_PERSON_RECEIVABLE_TOOLTIP.replace('{personName}', item.personName)}
                      aria-label={BN_UI_TEXT.VIEW_DETAILS_FOR_PERSON_RECEIVABLE_TOOLTIP.replace('{personName}', item.personName)}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 pt-4 text-right border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ReceivablePersonsModal;