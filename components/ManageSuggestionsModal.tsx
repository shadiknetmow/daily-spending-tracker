
import React, { useState, useEffect } from 'react';
import { BN_UI_TEXT } from '../constants';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import { UserSuggestion, SuggestionType } from '../types'; // Import UserSuggestion and SuggestionType
import { useNotification } from '../contexts/NotificationContext';

interface ManageSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSuggestions: UserSuggestion[]; // Changed from string[]
  predefinedIncomeSuggestions: string[]; 
  predefinedExpenseSuggestions: string[];
  onAddSuggestion: (text: string, type: SuggestionType) => void; // Now takes type
  onEditSuggestion: (suggestionId: string, newText: string) => void; // Takes ID
  onDeleteSuggestion: (suggestionId: string) => void; // Takes ID
}

const ManageSuggestionsModal: React.FC<ManageSuggestionsModalProps> = ({
  isOpen,
  onClose,
  userSuggestions,
  predefinedIncomeSuggestions,
  predefinedExpenseSuggestions,
  onAddSuggestion,
  onEditSuggestion,
  onDeleteSuggestion,
}) => {
  const [activeTab, setActiveTab] = useState<SuggestionType>('expense');
  const [newSuggestionText, setNewSuggestionText] = useState('');
  const [editingSuggestion, setEditingSuggestion] = useState<{ id: string; currentText: string; type: SuggestionType } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      setActiveTab('expense'); // Default to expense or income as preferred
      setNewSuggestionText('');
      setEditingSuggestion(null);
      setFormError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedSuggestion = newSuggestionText.trim();
    if (!trimmedSuggestion) {
      setFormError(BN_UI_TEXT.SUGGESTION_CANNOT_BE_EMPTY);
      return;
    }

    const allExistingForType = [
      ...userSuggestions.filter(s => s.type === activeTab).map(s => s.text.toLowerCase()),
      ...(activeTab === 'income' ? predefinedIncomeSuggestions : predefinedExpenseSuggestions).map(s => s.toLowerCase())
    ];

    if (allExistingForType.includes(trimmedSuggestion.toLowerCase())) {
      setFormError(BN_UI_TEXT.SUGGESTION_ALREADY_EXISTS);
      return;
    }
    
    onAddSuggestion(trimmedSuggestion, activeTab);
    setNewSuggestionText('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingSuggestion || !editingSuggestion.currentText.trim()) {
      setFormError(BN_UI_TEXT.SUGGESTION_CANNOT_BE_EMPTY);
      return;
    }
    const trimmedCurrent = editingSuggestion.currentText.trim();
    const originalText = userSuggestions.find(s => s.id === editingSuggestion.id)?.text || '';

    const allExistingForType = [
      ...userSuggestions
        .filter(s => s.type === editingSuggestion.type && s.id !== editingSuggestion.id)
        .map(s => s.text.toLowerCase()),
      ...(editingSuggestion.type === 'income' ? predefinedIncomeSuggestions : predefinedExpenseSuggestions).map(s => s.toLowerCase())
    ];
    
    if (trimmedCurrent.toLowerCase() !== originalText.toLowerCase() && allExistingForType.includes(trimmedCurrent.toLowerCase())) {
      setFormError(BN_UI_TEXT.SUGGESTION_ALREADY_EXISTS);
      return;
    }
    
    onEditSuggestion(editingSuggestion.id, trimmedCurrent);
    setEditingSuggestion(null);
  };

  const startEdit = (suggestion: UserSuggestion) => {
    setEditingSuggestion({ id: suggestion.id, currentText: suggestion.text, type: suggestion.type });
    setFormError(null); 
    setActiveTab(suggestion.type); // Switch to the tab of the item being edited
  };
  
  const currentPredefinedSuggestions = activeTab === 'income' ? predefinedIncomeSuggestions : predefinedExpenseSuggestions;
  const currentUserSuggestionsForTab = userSuggestions.filter(s => s.type === activeTab);

  const renderSuggestionList = (
    suggestions: (UserSuggestion[] | string[]), 
    isUserList: boolean,
    listTitle: string
  ) => (
    <section className="mb-4">
      <h3 className="text-md font-semibold text-slate-700 mb-2">{listTitle}</h3>
      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          {isUserList ? BN_UI_TEXT.NO_USER_SUGGESTIONS_FOR_TYPE : "কোনো পূর্বনির্ধারিত পরামর্শ নেই।"}
        </p>
      ) : (
        <ul className={`space-y-1.5 ${isUserList ? '' : 'max-h-40 overflow-y-auto custom-scrollbar-modal pr-1 border-t border-slate-200 pt-2'}`}>
          {suggestions.map((suggestionItem, index) => {
            const suggestionText = isUserList ? (suggestionItem as UserSuggestion).text : (suggestionItem as string);
            const suggestionId = isUserList ? (suggestionItem as UserSuggestion).id : `predefined-${index}`;
            
            return (
              <li 
                key={suggestionId} 
                className={`flex justify-between items-center p-2 rounded-md group ${isUserList ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100'}`}
              >
                <span className={`text-sm ${isUserList ? 'text-slate-700' : 'text-slate-600'}`}>{suggestionText}</span>
                {isUserList && (
                  <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(suggestionItem as UserSuggestion)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title={BN_UI_TEXT.EDIT_SUGGESTION_TOOLTIP}
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSuggestion((suggestionItem as UserSuggestion).id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title={BN_UI_TEXT.DELETE_SUGGESTION_TOOLTIP}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[100]" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-suggestions-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg md:max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="manage-suggestions-modal-title" className="text-xl font-semibold text-slate-800">
            {BN_UI_TEXT.MANAGE_SUGGESTIONS_MODAL_TITLE}
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

        <div className="mb-4 border-b border-slate-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('income')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'income' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    aria-current={activeTab === 'income' ? 'page' : undefined}
                >
                    {BN_UI_TEXT.SUGGESTIONS_INCOME_TAB}
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'expense' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    aria-current={activeTab === 'expense' ? 'page' : undefined}
                >
                    {BN_UI_TEXT.SUGGESTIONS_EXPENSE_TAB}
                </button>
            </nav>
        </div>
        
        {/* Form for adding or editing */}
        <div className="mb-5 p-3.5 border border-teal-200 bg-teal-50 rounded-lg">
            <h3 className="text-md font-medium text-teal-700 mb-2">
                {editingSuggestion ? BN_UI_TEXT.EDIT_SUGGESTION_MODAL_TITLE : `${activeTab === 'income' ? BN_UI_TEXT.INCOME : BN_UI_TEXT.EXPENSE} ${BN_UI_TEXT.ADD_NEW_SUGGESTION_LABEL.toLowerCase()}`}
            </h3>
            <form onSubmit={editingSuggestion ? handleEditSubmit : handleAddSubmit} className="space-y-2.5">
                <input
                    type="text"
                    value={editingSuggestion ? editingSuggestion.currentText : newSuggestionText}
                    onChange={(e) => editingSuggestion ? setEditingSuggestion({...editingSuggestion, currentText: e.target.value}) : setNewSuggestionText(e.target.value)}
                    placeholder={BN_UI_TEXT.SUGGESTION_PLACEHOLDER}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
                    autoFocus={!!editingSuggestion}
                />
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <div className="flex items-center space-x-2">
                    <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-3.5 rounded-md text-sm flex items-center space-x-1.5">
                       <PlusCircleIcon className="w-4 h-4" />
                       <span>{editingSuggestion ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.ADD_SUGGESTION_BTN}</span>
                    </button>
                    {editingSuggestion && (
                        <button type="button" onClick={() => { setEditingSuggestion(null); setFormError(null); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3.5 rounded-md text-sm">
                        {BN_UI_TEXT.CANCEL}
                        </button>
                    )}
                </div>
            </form>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1 space-y-5">
            {renderSuggestionList(
                currentUserSuggestionsForTab, 
                true,
                activeTab === 'income' ? BN_UI_TEXT.USER_SUGGESTIONS_TITLE_INCOME : BN_UI_TEXT.USER_SUGGESTIONS_TITLE_EXPENSE
            )}
            {renderSuggestionList(
                currentPredefinedSuggestions, 
                false,
                activeTab === 'income' ? BN_UI_TEXT.PREDEFINED_SUGGESTIONS_TITLE_INCOME : BN_UI_TEXT.PREDEFINED_SUGGESTIONS_TITLE_EXPENSE
            )}
        </div>

        <div className="mt-6 pt-4 text-right border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg shadow-md"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageSuggestionsModal;