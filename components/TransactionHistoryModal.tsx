import React from 'react';
import { Transaction, TransactionVersion, TransactionType } from '../types';
import { BN_UI_TEXT } from '../constants';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) {
    return null;
  }

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
      description: BN_UI_TEXT.FIELD_NAME_DESCRIPTION,
      amount: BN_UI_TEXT.FIELD_NAME_AMOUNT,
      type: BN_UI_TEXT.FIELD_NAME_TYPE,
      date: BN_UI_TEXT.FIELD_NAME_DATE,
      originalDate: "মূল তারিখ",
      linkedLedgerEntryId: "লেজার এন্ট্রি আইডি",
      isDeleted: BN_UI_TEXT.FIELD_NAME_IS_DELETED,
      deletedAt: BN_UI_TEXT.FIELD_NAME_DELETED_AT,
    };
    return map[fieldKey] || fieldKey;
  };
  
  const formatFieldValue = (fieldKey: keyof TransactionVersion['snapshot'], value: any): string => {
    if (value === undefined || value === null) return 'নেই';
    switch (fieldKey) {
      case 'type':
        return value === TransactionType.INCOME ? BN_UI_TEXT.INCOME : BN_UI_TEXT.EXPENSE;
      case 'date':
      case 'originalDate':
      case 'deletedAt':
        return formatDisplayTimestamp(String(value));
      case 'isDeleted':
        return value ? BN_UI_TEXT.FIELD_VALUE_TRUE : BN_UI_TEXT.FIELD_VALUE_FALSE;
      case 'amount':
        return `${BN_UI_TEXT.BDT_SYMBOL} ${Number(value).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return String(value);
    }
  };

  const renderVersionChanges = (currentVersion: TransactionVersion, previousVersionSnapshot?: TransactionVersion['snapshot']) => {
    const changes: JSX.Element[] = [];
    const currentSnapshot = currentVersion.snapshot;

    if (currentVersion.action === 'created' || (!previousVersionSnapshot && currentVersion.action !== 'updated' && currentVersion.action !== 'restored')) {
      // For 'created' or if no previous snapshot (e.g. 'deleted' or 'restored' as first history - though unlikely)
      (Object.keys(currentSnapshot) as Array<keyof TransactionVersion['snapshot']>).forEach(key => {
        if (currentSnapshot[key] !== undefined) {
          changes.push(
            <li key={key} className="text-sm">
              <strong>{getFieldDisplayName(key)}:</strong> {formatFieldValue(key, currentSnapshot[key])}
            </li>
          );
        }
      });
    } else if ((currentVersion.action === 'updated' || currentVersion.action === 'restored') && previousVersionSnapshot) {
      // For 'updated' AND 'restored' (if previous snapshot exists)
      let hasMeaningfulChanges = false;
      (Object.keys(currentSnapshot) as Array<keyof TransactionVersion['snapshot']>).forEach(key => {
        const oldValue = previousVersionSnapshot[key];
        const newValue = currentSnapshot[key];
        
        // Compare values, special handling for booleans that might be 0/1
        let valueChanged = false;
        if (key === 'isDeleted') {
            valueChanged = !!newValue !== !!oldValue;
        } else {
            valueChanged = String(newValue) !== String(oldValue);
        }

        if (valueChanged) {
          // For 'restored' action, only show changes to isDeleted and deletedAt, or other actual field changes.
          // Avoid showing unchanged fields as "changed from X to X".
          if (currentVersion.action === 'restored') {
            if (key === 'isDeleted' || key === 'deletedAt' || String(newValue) !== String(oldValue)) {
              hasMeaningfulChanges = true;
              changes.push(
                <li key={key} className="text-sm">
                  {BN_UI_TEXT.FIELD_CHANGES_FROM_TO
                    .replace('{field}', getFieldDisplayName(key))
                    .replace('{oldValue}', formatFieldValue(key, oldValue))
                    .replace('{newValue}', formatFieldValue(key, newValue))}
                </li>
              );
            }
          } else { // For 'updated' action
            hasMeaningfulChanges = true;
            changes.push(
              <li key={key} className="text-sm">
                {BN_UI_TEXT.FIELD_CHANGES_FROM_TO
                  .replace('{field}', getFieldDisplayName(key))
                  .replace('{oldValue}', formatFieldValue(key, oldValue))
                  .replace('{newValue}', formatFieldValue(key, newValue))}
              </li>
            );
          }
        }
      });

      if (!hasMeaningfulChanges) {
        if (currentVersion.action === 'updated') {
            changes.push(<li key="no-changes" className="text-sm italic">এই সংস্করণে কোনো তথ্য পরিবর্তন হয়নি।</li>);
        } else if (currentVersion.action === 'restored') {
            // If specifically isDeleted or deletedAt changed, it's meaningful.
            // This case might be hit if only those changed and loop above didn't mark hasMeaningfulChanges.
            const isDelChanged = !!currentSnapshot.isDeleted !== !!previousVersionSnapshot.isDeleted;
            const delAtChanged = String(currentSnapshot.deletedAt) !== String(previousVersionSnapshot.deletedAt);

            if (isDelChanged) {
                 changes.push(
                    <li key="isDeleted-restore-specific" className="text-sm">
                    {BN_UI_TEXT.FIELD_CHANGES_FROM_TO
                        .replace('{field}', getFieldDisplayName('isDeleted'))
                        .replace('{oldValue}', formatFieldValue('isDeleted', previousVersionSnapshot.isDeleted))
                        .replace('{newValue}', formatFieldValue('isDeleted', currentSnapshot.isDeleted))}
                    </li>
                );
            }
            if (delAtChanged) {
                 changes.push(
                    <li key="deletedAt-restore-specific" className="text-sm">
                    {BN_UI_TEXT.FIELD_CHANGES_FROM_TO
                        .replace('{field}', getFieldDisplayName('deletedAt'))
                        .replace('{oldValue}', formatFieldValue('deletedAt', previousVersionSnapshot.deletedAt))
                        .replace('{newValue}', formatFieldValue('deletedAt', currentSnapshot.deletedAt))}
                    </li>
                );
            }
            if (!isDelChanged && !delAtChanged) { // If neither critical field changed somehow (should not happen for restore)
                 changes.push(<li key="no-substantive-restore-changes" className="text-sm italic">স্ট্যাটাস পুনরুদ্ধার হয়েছে কিন্তু কোনো দৃশ্যমান পরিবর্তন নেই।</li>);
            }
        }
      }
    } else if (currentVersion.action === 'deleted') { 
        // Show key fields for deleted action primarily, others if they have values.
        (Object.keys(currentSnapshot) as Array<keyof TransactionVersion['snapshot']>).forEach(key => {
            if (key === 'isDeleted' || key === 'deletedAt' || (currentSnapshot[key] !== undefined && currentSnapshot[key] !== null)) {
                 changes.push(
                    <li key={key} className="text-sm">
                    <strong>{getFieldDisplayName(key)}:</strong> {formatFieldValue(key, currentSnapshot[key])}
                    </li>
                );
            }
        });
    }
    
    if (changes.length === 0) {
        return <li className="text-sm italic">কোনো পরিবর্তন দেখানো যাচ্ছে না।</li>;
    }
    return <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">{changes}</ul>;
  };
  
  const getActionTextAndColor = (action: TransactionVersion['action']) => {
    switch (action) {
      case 'created': return { text: BN_UI_TEXT.ACTION_CREATED, color: 'bg-green-100 text-green-700' };
      case 'updated': return { text: BN_UI_TEXT.ACTION_UPDATED, color: 'bg-blue-100 text-blue-700' };
      case 'deleted': return { text: BN_UI_TEXT.ACTION_DELETED, color: 'bg-red-100 text-red-700' };
      case 'restored': return { text: BN_UI_TEXT.ACTION_RESTORED, color: 'bg-yellow-100 text-yellow-700' };
      default: return { text: action, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[95]" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="transaction-history-modal-title"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" style={{animation: 'fadeIn 0.3s ease-out'}}>
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h2 id="transaction-history-modal-title" className="text-xl font-semibold text-slate-800">
              {BN_UI_TEXT.TRANSACTION_HISTORY_MODAL_TITLE}: <span className="font-normal">{transaction.description}</span>
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
          {transaction.editHistory && transaction.editHistory.length > 0 ? (
            transaction.editHistory
              .slice() 
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
              .map((version, index, arr) => {
                // Find the immediate previous version in the *sorted* array to correctly diff against chronological predecessor
                const chronologicalPreviousVersion = arr[index + 1]; // Since arr is sorted descending, previous is next in array
                const previousSnapshotForDiff = chronologicalPreviousVersion ? chronologicalPreviousVersion.snapshot : undefined;
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
                    {renderVersionChanges(version, previousSnapshotForDiff)}
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

export default TransactionHistoryModal;