
import React, { useState, useMemo } from 'react';
import { Person } from '../types';
import { BN_UI_TEXT } from '../constants';
import PersonItem from './PersonItem';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface PersonListProps {
  persons: Person[];
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onViewPersonHistory: (person: Person) => void;
  onAddNewPerson: () => void;
  onViewPersonDebtsHistory: (person: Person) => void;
  onViewPersonLedger: (person: Person) => void; 
  getPersonNetLedgerBalance: (personId: string) => number; 
  onRestorePerson: (personId: string) => void;
  onOpenChat: (person: Person) => void; 
  onOpenVideoCall: (person: Person) => void; // New prop
}

const PersonList: React.FC<PersonListProps> = ({
  persons,
  onEditPerson,
  onDeletePerson,
  onViewPersonHistory,
  onAddNewPerson,
  onViewPersonDebtsHistory,
  onViewPersonLedger,
  getPersonNetLedgerBalance, 
  onRestorePerson,
  onOpenChat, 
  onOpenVideoCall, // Destructure new prop
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const { activePersons, deletedPersons } = useMemo(() => {
    const active: Person[] = [];
    const deleted: Person[] = [];
    const lowerSearch = searchTerm.toLowerCase();

    persons.forEach(person => {
      const nameMatch = person.name.toLowerCase().includes(lowerSearch);
      const mobileMatch = person.mobileNumber && person.mobileNumber.includes(lowerSearch);
      const aliasMatch = person.customAlias && person.customAlias.toLowerCase().includes(lowerSearch);
      
      if (nameMatch || mobileMatch || aliasMatch) {
        if (person.isDeleted) {
          deleted.push(person);
        } else {
          active.push(person);
        }
      }
    });
    active.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    deleted.sort((a, b) => new Date(b.deletedAt || b.lastModified).getTime() - new Date(a.deletedAt || b.lastModified).getTime());
    return { activePersons: active, deletedPersons: deleted };
  }, [persons, searchTerm]);

  const personsToDisplay = showDeleted ? [...activePersons, ...deletedPersons] : activePersons;
  const totalDeletedCount = deletedPersons.length;


  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <input
          type="text"
          placeholder={BN_UI_TEXT.SEARCH_PERSON_PLACEHOLDER}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
        />
        <div className="flex items-center space-x-2 w-full sm:w-auto">
            {totalDeletedCount > 0 && (
                <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className="text-xs text-teal-600 hover:text-teal-700 underline focus:outline-none py-2 px-2 whitespace-nowrap"
                >
                    {showDeleted ? BN_UI_TEXT.HIDE_DELETED_ITEMS_BTN : `${BN_UI_TEXT.SHOW_DELETED_ITEMS_BTN} (${totalDeletedCount}টি)`}
                </button>
            )}
            <button
            onClick={onAddNewPerson}
            className="flex-grow sm:flex-grow-0 flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition duration-150"
            >
            <PlusCircleIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.ADD_NEW_PERSON_BTN}</span>
            </button>
        </div>
      </div>

      {personsToDisplay.length === 0 ? (
        <p className="text-slate-500 text-center py-6">
            {searchTerm && !showDeleted ? `"${searchTerm}" নামে কোনো সক্রিয় ব্যক্তি খুঁজে পাওয়া যায়নি।` :
             searchTerm && showDeleted ? `"${searchTerm}" নামে কোনো ব্যক্তি (সক্রিয় বা সরানো) খুঁজে পাওয়া যায়নি।` :
             !searchTerm && showDeleted && totalDeletedCount === 0 ? BN_UI_TEXT.NO_DELETED_PERSONS :
             !searchTerm && !showDeleted && activePersons.length === 0 && totalDeletedCount > 0 ? BN_UI_TEXT.NO_PERSONS_FOUND + " " + BN_UI_TEXT.SHOW_DELETED_ITEMS_BTN + " চেষ্টা করুন।" :
             BN_UI_TEXT.NO_PERSONS_FOUND
            }
        </p>
      ) : (
        <ul className="space-y-4">
          {personsToDisplay.map(person => (
            <PersonItem
              key={person.id}
              person={person}
              netLedgerBalance={getPersonNetLedgerBalance(person.id)} 
              onEdit={onEditPerson}
              onDelete={onDeletePerson}
              onViewHistory={onViewPersonHistory}
              onViewPersonDebtsHistory={onViewPersonDebtsHistory}
              onViewPersonLedger={onViewPersonLedger}
              onRestore={onRestorePerson}
              onOpenChat={onOpenChat}
              onOpenVideoCall={onOpenVideoCall} // Pass handler
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default PersonList;
