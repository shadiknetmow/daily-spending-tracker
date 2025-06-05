


import React from 'react';
import { Debt, DebtVersion, DebtType, Person } from '../types'; 
import { BN_UI_TEXT } from '../constants';

interface DebtHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  persons: Person[]; 
}

const DebtHistoryModal: React.FC<DebtHistoryModalProps> = ({ isOpen, onClose, debt, persons }) => {
  if (!isOpen || !debt) {
    return null;
  }
  
  const currentPerson = persons.find(p => p.id === debt.personId);
  const debtTitlePersonName = currentPerson ? currentPerson.name : BN_UI_TEXT.UNKNOWN_PERSON;


  const formatDisplayTimestamp = (isoTimestamp?: string) => {
    if (!isoTimestamp) return 'N/A';
    try {
        return new Date(isoTimestamp).toLocaleString('bn-BD', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });
    } catch {
        return isoTimestamp;
    }
  };

  const getFieldDisplayName = (fieldKey: string): string => {
    const map: Record<string, string> = {
      personId: BN_UI_TEXT.FIELD_NAME_PERSON_NAME,
      originalAmount: BN_UI_TEXT.FIELD_NAME_ORIGINAL_AMOUNT || "মূল পরিমাণ",
      remainingAmount: BN_UI_TEXT.FIELD_NAME_REMAINING_AMOUNT || "বাকি পরিমাণ",
      description: BN_UI_TEXT.FIELD_NAME_DESCRIPTION,
      type: BN_UI_TEXT.FIELD_NAME_TYPE,
      dueDate: BN_UI_TEXT.FIELD_NAME_DUE_DATE,
      isSettled: BN_UI_TEXT.FIELD_NAME_IS_SETTLED,
      creationDate: BN_UI_TEXT.FIELD_NAME_CREATION_DATE,
      settledDate: BN_UI_TEXT.FIELD_NAME_SETTLED_DATE,
    };
    return map[fieldKey] || fieldKey;
  };
  
  const formatFieldValue = (fieldKey: keyof DebtVersion['snapshot'], value: any): string => {
    if (value === undefined || value === null) return 'নেই';
    switch (fieldKey) {
      case 'type':
        return value === DebtType.PAYABLE ? BN_UI_TEXT.PAYABLE : BN_UI_TEXT.RECEIVABLE;
      case 'isSettled':
        return value ? BN_UI_TEXT.FIELD_VALUE_TRUE : BN_UI_TEXT.FIELD_VALUE_FALSE;
      case 'creationDate':
      case 'settledDate':
      case 'dueDate':
        return formatDisplayTimestamp(String(value));
      case 'originalAmount':
      case 'remainingAmount':
        return `${BN_UI_TEXT.BDT_SYMBOL} ${Number(value).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'personId':
        const person = persons.find(p => p.id === String(value));
        return person ? person.name : `${BN_UI_TEXT.UNKNOWN_PERSON} (ID: ${value})`;
      default:
        return String(value);
    }
  };

  const renderVersionChanges = (currentVersion: DebtVersion, previousVersionSnapshot?: DebtVersion['snapshot']) => {
    const changes: JSX.Element[] = [];
    const currentSnapshot = currentVersion.snapshot;

    if (currentVersion.action === 'created' || !previousVersionSnapshot) { 
      (Object.keys(currentSnapshot) as Array<keyof DebtVersion['snapshot']>).forEach(key => {
         if (currentSnapshot[key] !== undefined) { 
            changes.push(
            <li key={key} className="text-sm">
                <strong>{getFieldDisplayName(key)}:</strong> {formatFieldValue(key, currentSnapshot[key])}
            </li>
            );
        }
      });
    } else { 
      let hasChanges = false;
      (Object.keys(currentSnapshot) as Array<keyof DebtVersion['snapshot']>).forEach(key => {
        const currentValue = currentSnapshot[key];
        const previousValue = previousVersionSnapshot ? previousVersionSnapshot[key] : undefined;
        
        let valueChanged = false;
        if (key === 'isSettled') {
            valueChanged = !!currentValue !== !!previousValue;
        } else if (typeof currentValue === 'number' || typeof previousValue === 'number') {
            valueChanged = Number(currentValue) !== Number(previousValue);
        } else {
            valueChanged = String(currentValue) !== String(previousValue);
        }

        if (valueChanged) {
          hasChanges = true;
          changes.push(
            <li key={key} className="text-sm">
              {BN_UI_TEXT.FIELD_CHANGES_FROM_TO
                .replace('{field}', getFieldDisplayName(key))
                .replace('{oldValue}', formatFieldValue(key, previousValue))
                .replace('{newValue}', formatFieldValue(key, currentValue))}
            </li>
          );
        }
      });
       if (!hasChanges) {
         changes.push(<li key="no-changes" className="text-sm italic">এই সংস্করণে কোনো তথ্য পরিবর্তন হয়নি।</li>);
       }
    }
    
    if (changes.length === 0) {
        return <li className="text-sm italic">কোনো পরিবর্তন দেখানো যাচ্ছে না।</li>;
    }
    return <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">{changes}</ul>;
  };

  const getActionTextAndColor = (action: DebtVersion['action']) => {
    switch (action) {
      case 'created': return { text: BN_UI_TEXT.ACTION_CREATED, color: 'bg-green-100 text-green-700' };
      case 'updated': return { text: BN_UI_TEXT.ACTION_UPDATED, color: 'bg-blue-100 text-blue-700' };
      default: return { text: action, color: 'bg-slate-100 text-slate-700' };
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[95]"
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="debt-history-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" style={{animation: 'fadeIn 0.3s ease-out'}}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h2 id="debt-history-modal-title" className="text-xl font-semibold text-slate-800">
                {BN_UI_TEXT.DEBT_HISTORY_MODAL_TITLE}: <span className="font-normal">{debtTitlePersonName} - {debt.description}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow pr-1 space-y-4 custom-scrollbar">
          {debt.editHistory && debt.editHistory.length > 0 ? (
            debt.editHistory
              .slice() 
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
              .map((version, index, arr) => {
                const previousVersion = arr.find(v => new Date(v.timestamp).getTime() < new Date(version.timestamp).getTime());
                const previousVersionSnapshot = previousVersion ? previousVersion.snapshot : undefined;
                const actionInfo = getActionTextAndColor(version.action);
                return (
                  <div key={version.timestamp} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm hover:shadow-md transition-shadow duration-150">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700"> ব্যবহারকারী: </span>{version.userId}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionInfo.color}`}>
                          {actionInfo.text}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {BN_UI_TEXT.VERSION_AT_TIMESTAMP} {formatDisplayTimestamp(version.timestamp)}
                    </p>
                    {renderVersionChanges(version, previousVersionSnapshot)}
                  </div>
                );
              })
          ) : (
            <p className="text-slate-500 text-center py-6">{BN_UI_TEXT.NO_HISTORY}</p>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-500 */
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DebtHistoryModal;