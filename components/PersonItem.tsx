
import React from 'react';
import { Person } from '../types';
import { BN_UI_TEXT } from '../constants';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import HistoryIcon from './icons/HistoryIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import LedgerIcon from './icons/LedgerIcon'; 
import UndoIcon from './icons/UndoIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon'; 
import VideoCameraIcon from './icons/VideoCameraIcon'; // New Icon

interface PersonItemProps {
  person: Person;
  netLedgerBalance?: number; 
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  onViewHistory: (person: Person) => void;
  onViewPersonDebtsHistory: (person: Person) => void;
  onViewPersonLedger: (person: Person) => void; 
  onRestore: (personId: string) => void;
  onOpenChat: (person: Person) => void; 
  onOpenVideoCall: (person: Person) => void; // New Prop
}

const PersonItem: React.FC<PersonItemProps> = ({ 
  person, 
  netLedgerBalance, 
  onEdit, 
  onDelete, 
  onViewHistory, 
  onViewPersonDebtsHistory,
  onViewPersonLedger,
  onRestore,
  onOpenChat,
  onOpenVideoCall, // Destructure new prop
}) => {
  const formatDate = (dateString?: string, includeTime: boolean = true) => {
    if (!dateString) return 'N/A';
    try {
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit', month: 'long', year: 'numeric'
      };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return new Date(dateString).toLocaleDateString('bn-BD', options);
    } catch (e) { return dateString; }
  };

  const formatCurrency = (num: number): string => 
    `${BN_UI_TEXT.BDT_SYMBOL} ${Math.abs(num).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getBalanceStatusText = (balance: number): string => {
    if (balance > 0) return BN_UI_TEXT.LEDGER_BALANCE_STATUS_DEBIT.replace("{amount}", formatCurrency(balance)); 
    if (balance < 0) return BN_UI_TEXT.LEDGER_BALANCE_STATUS_CREDIT.replace("{amount}", formatCurrency(balance)); 
    return BN_UI_TEXT.LEDGER_BALANCE_STATUS_ZERO;
  };
  
  const getBalanceColorClass = (balance: number): string => {
    if (balance > 0) return 'text-green-600'; 
    if (balance < 0) return 'text-red-600';   
    return 'text-slate-700'; 
  };

  const itemClass = person.isDeleted ? 'opacity-70 hover:opacity-90' : '';
  const borderColorClass = person.isDeleted ? 'border-slate-400' : 'border-sky-500';
  const deletedDate = person.isDeleted && person.deletedAt ? formatDate(person.deletedAt, true) : null;
  const textColorClass = person.isDeleted ? 'text-slate-400' : 'text-slate-600';
  const smallTextColorClass = person.isDeleted ? 'text-slate-400' : 'text-slate-500';

  const displayName = person.customAlias || person.name;
  const nameClass = person.isDeleted ? 'text-slate-500 line-through' : 'text-sky-700';


  const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const nameParts = nameStr.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };
  
  const canCommunicate = !!person.systemUserId; // For both chat and video call

  const chatButtonTooltip = canCommunicate
    ? BN_UI_TEXT.OPEN_CHAT_TOOLTIP.replace('{personName}', displayName)
    : BN_UI_TEXT.CHAT_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', displayName);
  
  const videoCallButtonTooltip = canCommunicate
    ? BN_UI_TEXT.OPEN_VIDEO_CALL_TOOLTIP.replace('{personName}', displayName)
    : BN_UI_TEXT.VIDEO_CALL_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', displayName);


  return (
    <li className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColorClass} hover:shadow-md transition-shadow duration-150 ${itemClass}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center space-x-3 flex-grow mb-3 sm:mb-0">
          <div className="flex-shrink-0">
            {person.profileImage ? (
              <img src={person.profileImage} alt={displayName} className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold text-lg ring-1 ring-slate-300">
                {getInitials(displayName)}
              </span>
            )}
          </div>
          <div className="flex-grow">
            <h3 className={`text-lg font-semibold ${nameClass}`}>
              {displayName}
              {person.systemUserId && person.customAlias && person.name !== person.customAlias && (
                <span className={`text-xs ${smallTextColorClass} ml-1`}>({person.name} {BN_UI_TEXT.SYSTEM_NAME_INDICATOR})</span>
              )}
              {person.systemUserId && !person.customAlias && (
                <span className={`text-xs ${smallTextColorClass} ml-1`}>{BN_UI_TEXT.SYSTEM_NAME_INDICATOR}</span>
              )}
            </h3>
            {person.mobileNumber && (
              <p className={`text-sm ${textColorClass}`}>
                {BN_UI_TEXT.PERSON_MOBILE_NUMBER}: {person.mobileNumber}
              </p>
            )}
            {person.email && (
              <p className={`text-sm ${textColorClass}`}>
                {BN_UI_TEXT.EMAIL}: {person.email}
              </p>
            )}
            {person.shopName && (
              <p className={`text-sm ${smallTextColorClass}`}>
                {BN_UI_TEXT.PERSON_SHOP_NAME}: {person.shopName}
              </p>
            )}
            {person.address && (
              <p className={`text-xs ${smallTextColorClass} truncate max-w-xs sm:max-w-sm md:max-w-md`} title={person.address}>
                {BN_UI_TEXT.PERSON_ADDRESS}: {person.address}
              </p>
            )}
            {typeof netLedgerBalance === 'number' && !person.isDeleted && (
              <p className={`text-sm font-medium mt-1.5 ${getBalanceColorClass(netLedgerBalance)}`}>
                <span className="text-slate-600 font-normal">{BN_UI_TEXT.CURRENT_NET_LEDGER_BALANCE_LABEL}: </span>
                {getBalanceStatusText(netLedgerBalance)}
              </p>
            )}
            {person.isDeleted && deletedDate && (
              <p className="text-xs text-orange-600 font-medium mt-1">
                {BN_UI_TEXT.DELETED_ON} {deletedDate} ({BN_UI_TEXT.STATUS_ARCHIVED})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-0.5 sm:space-x-1 self-end sm:self-center flex-shrink-0">
          {person.isDeleted ? (
            <button
                onClick={() => onRestore(person.id)}
                className="text-slate-500 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition duration-150"
                aria-label={BN_UI_TEXT.RESTORE_ITEM_TOOLTIP}
                title={BN_UI_TEXT.RESTORE_ITEM_TOOLTIP}
            >
                <UndoIcon className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenVideoCall(person)}
                className={`p-2 rounded-full transition duration-150 ${canCommunicate ? 'text-slate-500 hover:text-green-600 hover:bg-green-50' : 'text-slate-400 cursor-not-allowed'}`}
                title={videoCallButtonTooltip}
                aria-label={videoCallButtonTooltip}
                disabled={!canCommunicate}
              >
                <VideoCameraIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenChat(person)} 
                className={`p-2 rounded-full transition duration-150 ${canCommunicate ? 'text-slate-500 hover:text-purple-600 hover:bg-purple-50' : 'text-slate-400 cursor-not-allowed'}`}
                title={chatButtonTooltip}
                aria-label={chatButtonTooltip}
                disabled={!canCommunicate}
              >
                <ChatBubbleIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewPersonLedger(person)}
                className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition duration-150"
                title={BN_UI_TEXT.VIEW_PERSON_LEDGER_TOOLTIP}
                aria-label={BN_UI_TEXT.VIEW_PERSON_LEDGER_TOOLTIP}
              >
                <LedgerIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewPersonDebtsHistory(person)}
                className="text-slate-500 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition duration-150"
                title={BN_UI_TEXT.VIEW_PERSON_DEBTS_HISTORY_TOOLTIP}
                aria-label={BN_UI_TEXT.VIEW_PERSON_DEBTS_HISTORY_TOOLTIP}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewHistory(person)}
                className="text-slate-500 hover:text-sky-600 p-2 rounded-full hover:bg-sky-50 transition duration-150"
                title={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
                aria-label={BN_UI_TEXT.VIEW_HISTORY_TOOLTIP}
              >
                <HistoryIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(person)}
                className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition duration-150"
                title={BN_UI_TEXT.EDIT_PERSON_BTN_LABEL}
                aria-label={BN_UI_TEXT.EDIT_PERSON_BTN_LABEL}
              >
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(person.id)}
                className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition duration-150"
                title={BN_UI_TEXT.DELETE_PERSON_BTN_LABEL}
                aria-label={BN_UI_TEXT.DELETE_PERSON_BTN_LABEL}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      {!person.isDeleted && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
            <p>{BN_UI_TEXT.CREATED_ON} {formatDate(person.createdAt)}</p>
            {person.lastModified !== person.createdAt && (
            <p>{BN_UI_TEXT.LAST_MODIFIED_ON} {formatDate(person.lastModified)}</p>
            )}
        </div>
      )}
    </li>
  );
};

export default PersonItem;
