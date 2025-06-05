
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { BudgetCategory, Budget, BudgetPeriod, Transaction } from '../types';
import { BN_UI_TEXT } from '../constants';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  budgets: Budget[];
  transactions: Transaction[];
  allTransactionSuggestions: string[];
  userCustomSuggestions: string[];
  onAddCategory: (name: string, associatedSuggestions: string[]) => Promise<void>;
  onUpdateCategory: (id: string, newName: string, associatedSuggestions: string[]) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddBudget: (categoryId: string, amount: number, period: BudgetPeriod, startDateISO: string, customEndDateISO?: string) => Promise<void>;
  onUpdateBudget: (id: string, newAmount: number) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  calculateBudgetUsage: (budget: Budget, transactions: Transaction[]) => { spent: number; remaining: number; percentageUsed: number };
}

const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  isOpen,
  onClose,
  categories,
  budgets,
  transactions,
  allTransactionSuggestions,
  userCustomSuggestions,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  calculateBudgetUsage,
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'categories'>('budgets');
  
  // Category Form State
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [currentCategoryAssociatedSuggestions, setCurrentCategoryAssociatedSuggestions] = useState<string[]>([]);

  // Budget Form State
  const [budgetCategorySearch, setBudgetCategorySearch] = useState('');
  const [selectedBudgetCategoryId, setSelectedBudgetCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);
  
  // Date state for different periods
  const [budgetMonthYear, setBudgetMonthYear] = useState(''); // YYYY-MM for monthly
  const [budgetYearForWeekly, setBudgetYearForWeekly] = useState(new Date().getFullYear().toString());
  const [budgetWeek, setBudgetWeek] = useState(''); // Week number
  const [budgetYearForQuarterly, setBudgetYearForQuarterly] = useState(new Date().getFullYear().toString());
  const [budgetQuarter, setBudgetQuarter] = useState('1'); // 1, 2, 3, 4
  const [budgetYearForYearly, setBudgetYearForYearly] = useState(new Date().getFullYear().toString());
  const [customStartDate, setCustomStartDate] = useState(''); // YYYY-MM-DD
  const [customEndDate, setCustomEndDate] = useState(''); // YYYY-MM-DD

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const predefinedOnlySuggestions = useMemo(() => 
    allTransactionSuggestions.filter(
      s => !userCustomSuggestions.includes(s)
    ).sort((a,b) => a.localeCompare(b, 'bn-BD')),
    [allTransactionSuggestions, userCustomSuggestions]
  );

  const sortedUserSuggestions = useMemo(() => 
    [...userCustomSuggestions].sort((a,b) => a.localeCompare(b, 'bn-BD')),
    [userCustomSuggestions]
  );


  useEffect(() => {
    if (isOpen) {
      setCategoryName('');
      setEditingCategory(null);
      setCurrentCategoryAssociatedSuggestions([]);
      
      setSelectedBudgetCategoryId('');
      setBudgetCategorySearch('');
      setBudgetAmount('');
      setBudgetPeriod(BudgetPeriod.MONTHLY);
      
      const today = new Date();
      setBudgetMonthYear(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
      setBudgetYearForWeekly(today.getFullYear().toString());
      setBudgetWeek(getWeekNumber(today).toString());
      setBudgetYearForQuarterly(today.getFullYear().toString());
      setBudgetQuarter((Math.floor(today.getMonth() / 3) + 1).toString());
      setBudgetYearForYearly(today.getFullYear().toString());
      setCustomStartDate(today.toISOString().split('T')[0]);
      setCustomEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]); // End of current month

      setEditingBudget(null);
      setActiveTab('budgets');
    }
  }, [isOpen]);

  function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  }

  const handleToggleAllSuggestions = (listType: 'user' | 'predefined', selectAll: boolean) => {
    const suggestionsToToggle = listType === 'user' ? sortedUserSuggestions : predefinedOnlySuggestions;
    if (selectAll) {
      setCurrentCategoryAssociatedSuggestions(prev => Array.from(new Set([...prev, ...suggestionsToToggle])));
    } else {
      setCurrentCategoryAssociatedSuggestions(prev => prev.filter(s => !suggestionsToToggle.includes(s)));
    }
  };

  const handleSuggestionToggle = (suggestion: string) => {
    setCurrentCategoryAssociatedSuggestions(prev =>
      prev.includes(suggestion) ? prev.filter(s => s !== suggestion) : [...prev, suggestion]
    );
  };

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, categoryName, currentCategoryAssociatedSuggestions);
      setEditingCategory(null);
    } else {
      await onAddCategory(categoryName, currentCategoryAssociatedSuggestions);
    }
    setCategoryName('');
    setCurrentCategoryAssociatedSuggestions([]);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCurrentCategoryAssociatedSuggestions(category.associatedSuggestions || []);
    setActiveTab('categories'); 
  };
  
  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCurrentCategoryAssociatedSuggestions([]);
  };

  const handleBudgetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(budgetAmount);
    let startDateForAPI = '';
    let endDateForAPI: string | undefined = undefined;

    switch(budgetPeriod) {
        case BudgetPeriod.MONTHLY:
            startDateForAPI = `${budgetMonthYear}-01`;
            break;
        case BudgetPeriod.WEEKLY:
            const weekStartDate = new Date(parseInt(budgetYearForWeekly), 0, 1 + (parseInt(budgetWeek) - 1) * 7);
            // Adjust to Monday of that week
            const dayOfWeek = weekStartDate.getDay(); // 0 (Sun) to 6 (Sat)
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // if Sunday, go back 6 days, else go to Monday
            weekStartDate.setDate(weekStartDate.getDate() + diffToMonday);
            startDateForAPI = weekStartDate.toISOString().split('T')[0];
            break;
        case BudgetPeriod.QUARTERLY:
            const quarterMonth = (parseInt(budgetQuarter) - 1) * 3; // 0 for Q1, 3 for Q2, etc.
            startDateForAPI = new Date(parseInt(budgetYearForQuarterly), quarterMonth, 1).toISOString().split('T')[0];
            break;
        case BudgetPeriod.YEARLY:
            startDateForAPI = new Date(parseInt(budgetYearForYearly), 0, 1).toISOString().split('T')[0];
            break;
        case BudgetPeriod.CUSTOM:
            if (!customStartDate || !customEndDate) {
                alert(BN_UI_TEXT.BUDGET_INVALID_CUSTOM_DATE_RANGE); return;
            }
            if (new Date(customEndDate) < new Date(customStartDate)) {
                alert(BN_UI_TEXT.BUDGET_INVALID_CUSTOM_DATE_RANGE); return;
            }
            startDateForAPI = customStartDate;
            endDateForAPI = customEndDate;
            break;
        default:
            alert("অবৈধ বাজেট সময়কাল।"); return;
    }


    if (editingBudget) {
      await onUpdateBudget(editingBudget.id, amountNum);
      setEditingBudget(null);
    } else {
      await onAddBudget(selectedBudgetCategoryId, amountNum, budgetPeriod, startDateForAPI, endDateForAPI);
    }
    setBudgetAmount('');
    if (!editingBudget) {
        setSelectedBudgetCategoryId('');
        setBudgetCategorySearch('');
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setSelectedBudgetCategoryId(budget.categoryId);
    const category = categories.find(c => c.id === budget.categoryId);
    setBudgetCategorySearch(category ? category.name : '');
    setBudgetAmount(budget.amount.toString());
    setBudgetPeriod(budget.period);
    
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);

    switch(budget.period) {
        case BudgetPeriod.MONTHLY:
            setBudgetMonthYear(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`);
            break;
        case BudgetPeriod.WEEKLY:
            setBudgetYearForWeekly(startDate.getFullYear().toString());
            setBudgetWeek(getWeekNumber(startDate).toString());
            break;
        case BudgetPeriod.QUARTERLY:
            setBudgetYearForQuarterly(startDate.getFullYear().toString());
            setBudgetQuarter((Math.floor(startDate.getMonth() / 3) + 1).toString());
            break;
        case BudgetPeriod.YEARLY:
            setBudgetYearForYearly(startDate.getFullYear().toString());
            break;
        case BudgetPeriod.CUSTOM:
            setCustomStartDate(startDate.toISOString().split('T')[0]);
            setCustomEndDate(endDate.toISOString().split('T')[0]);
            break;
    }
    setActiveTab('budgets'); 
  };
  
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || BN_UI_TEXT.UNKNOWN_PERSON;
  };

  const formatBudgetPeriodDisplay = (budget: Budget) => {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    switch (budget.period) {
        case BudgetPeriod.MONTHLY:
            return startDate.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
        case BudgetPeriod.WEEKLY:
             return `${startDate.toLocaleDateString('bn-BD', options)} - ${endDate.toLocaleDateString('bn-BD', options)} (সপ্তাহ ${getWeekNumber(startDate)})`;
        case BudgetPeriod.QUARTERLY:
            const quarter = Math.floor(startDate.getMonth() / 3) + 1;
            const quarterNames: {[key:number]: string} = {1: BN_UI_TEXT.QUARTER_1, 2: BN_UI_TEXT.QUARTER_2, 3:BN_UI_TEXT.QUARTER_3, 4:BN_UI_TEXT.QUARTER_4};
            return `${startDate.getFullYear()} ${quarterNames[quarter] || `ত্রৈমাসিক ${quarter}`}`;
        case BudgetPeriod.YEARLY:
            return startDate.getFullYear().toString() + " সাল";
        case BudgetPeriod.CUSTOM:
            return `${startDate.toLocaleDateString('bn-BD', options)} - ${endDate.toLocaleDateString('bn-BD', options)}`;
        default:
            return formatMonthYear(budget.startDate);
    }
  };

  const formatMonthYear = (isoDateString: string) => {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
  };

  const ProgressBar: React.FC<{ percentage: number, isOverspent: boolean }> = ({ percentage, isOverspent }) => {
    const cappedPercentage = isOverspent ? 100 : Math.max(0, Math.min(100, percentage));
    let bgColor = 'bg-green-500';
    if (isOverspent) {
        bgColor = 'bg-red-600';
    } else if (percentage > 90) {
        bgColor = 'bg-red-500';
    } else if (percentage > 75) {
        bgColor = 'bg-yellow-500';
    }
  
    return (
      <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 my-1">
        <div 
          className={`${bgColor} h-2.5 rounded-full transition-all duration-300 ease-out`} 
          style={{ width: `${cappedPercentage}%` }}
          aria-valuenow={isOverspent ? 100 : percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          aria-label={`${BN_UI_TEXT.BUDGET_PERCENTAGE_USED_LABEL.replace('{percentage}', percentage.toFixed(0))}`}
        ></div>
      </div>
    );
  };

  const sortedCategories = [...categories].sort((a,b) => a.name.localeCompare(b.name, 'bn-BD'));
  const sortedBudgets = [...budgets].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || getCategoryName(a.categoryId).localeCompare(getCategoryName(b.categoryId)));
  
  const filteredBudgetCategories = useMemo(() => {
    if (!budgetCategorySearch) return sortedCategories;
    return sortedCategories.filter(cat => cat.name.toLowerCase().includes(budgetCategorySearch.toLowerCase()));
  }, [budgetCategorySearch, sortedCategories]);


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[95]"
      role="dialog" aria-modal="true" aria-labelledby="budget-setup-modal-title"
    >
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="budget-setup-modal-title" className="text-xl sm:text-2xl font-semibold text-slate-800">
            {BN_UI_TEXT.BUDGET_SETUP_MODAL_TITLE}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 border-b border-slate-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('budgets')}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'budgets' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  aria-current={activeTab === 'budgets' ? 'page' : undefined}
            >
              {BN_UI_TEXT.BUDGETS_SECTION_TITLE}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'categories' 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  aria-current={activeTab === 'categories' ? 'page' : undefined}
            >
              {BN_UI_TEXT.BUDGET_CATEGORIES_SECTION_TITLE}
            </button>
          </nav>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar-modal pr-1">
          {activeTab === 'categories' && (
            <section aria-labelledby="categories-section-title">
              <h3 id="categories-section-title" className="text-lg font-semibold text-slate-700 mb-3">
                {editingCategory ? BN_UI_TEXT.EDIT_BUDGET_CATEGORY_BTN : BN_UI_TEXT.ADD_NEW_BUDGET_CATEGORY_BTN}
              </h3>
              <form onSubmit={handleCategorySubmit} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_CATEGORY_NAME_LABEL}</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder={BN_UI_TEXT.BUDGET_CATEGORY_NAME_PLACEHOLDER}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-2">এই ক্যাটেগরির জন্য বিবরণ পরামর্শ নির্বাচন করুন:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 max-h-60 overflow-y-auto custom-scrollbar-modal p-2 border rounded-md bg-white">
                        <div>
                            <div className="flex justify-between items-center sticky top-0 bg-white py-1">
                                <p className="text-xs font-semibold text-indigo-600">{BN_UI_TEXT.USER_SUGGESTIONS_TITLE_EXPENSE}</p> 
                                {sortedUserSuggestions.length > 0 && (
                                <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-indigo-500 rounded-sm border-slate-400 focus:ring-indigo-400"
                                    title={currentCategoryAssociatedSuggestions.filter(s => sortedUserSuggestions.includes(s)).length === sortedUserSuggestions.length ? BN_UI_TEXT.DESELECT_ALL_SUGGESTIONS_LABEL : BN_UI_TEXT.SELECT_ALL_SUGGESTIONS_LABEL}
                                    checked={sortedUserSuggestions.length > 0 && currentCategoryAssociatedSuggestions.filter(s => sortedUserSuggestions.includes(s)).length === sortedUserSuggestions.length}
                                    onChange={(e) => handleToggleAllSuggestions('user', e.target.checked)} />
                                )}
                            </div>
                            {sortedUserSuggestions.length > 0 ? sortedUserSuggestions.map(suggestion => (
                                <label key={`user-${suggestion}`} className="flex items-center space-x-2 text-xs text-slate-700 mb-1 p-1 hover:bg-indigo-50 rounded">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-3.5 w-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    checked={currentCategoryAssociatedSuggestions.includes(suggestion)}
                                    onChange={() => handleSuggestionToggle(suggestion)}
                                />
                                <span>{suggestion}</span>
                                </label>
                            )) : <p className="text-xs text-slate-400 italic">{BN_UI_TEXT.NO_USER_SUGGESTIONS_FOR_TYPE}</p>}
                        </div>
                        <div>
                            <div className="flex justify-between items-center sticky top-0 bg-white py-1">
                                <p className="text-xs font-semibold text-sky-600">{BN_UI_TEXT.PREDEFINED_SUGGESTIONS_TITLE_EXPENSE}</p>
                                {predefinedOnlySuggestions.length > 0 && (
                                 <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-sky-500 rounded-sm border-slate-400 focus:ring-sky-400"
                                    title={currentCategoryAssociatedSuggestions.filter(s => predefinedOnlySuggestions.includes(s)).length === predefinedOnlySuggestions.length ? BN_UI_TEXT.DESELECT_ALL_SUGGESTIONS_LABEL : BN_UI_TEXT.SELECT_ALL_SUGGESTIONS_LABEL}
                                    checked={predefinedOnlySuggestions.length > 0 && currentCategoryAssociatedSuggestions.filter(s => predefinedOnlySuggestions.includes(s)).length === predefinedOnlySuggestions.length}
                                    onChange={(e) => handleToggleAllSuggestions('predefined', e.target.checked)} />
                                )}
                            </div>
                            {predefinedOnlySuggestions.map(suggestion => (
                                <label key={`predefined-${suggestion}`} className="flex items-center space-x-2 text-xs text-slate-700 mb-1 p-1 hover:bg-sky-50 rounded">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-3.5 w-3.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                                    checked={currentCategoryAssociatedSuggestions.includes(suggestion)}
                                    onChange={() => handleSuggestionToggle(suggestion)}
                                />
                                <span>{suggestion}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center space-x-1.5">
                    <PlusCircleIcon className="w-4 h-4" />
                    <span>{editingCategory ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.SAVE_BUDGET_CATEGORY_BTN}</span>
                  </button>
                  {editingCategory && (
                    <button type="button" onClick={handleCancelEditCategory} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm">
                      {BN_UI_TEXT.CANCEL}
                    </button>
                  )}
                </div>
              </form>

              {sortedCategories.length === 0 && !editingCategory ? (
                <p className="text-slate-500 text-center py-4">{BN_UI_TEXT.NO_BUDGET_CATEGORIES_FOUND}</p>
              ) : (
                <ul className="space-y-2">
                  {sortedCategories.map(cat => (
                    <li key={cat.id} className="p-2.5 bg-white rounded-md border border-slate-200 hover:shadow-sm group">
                       <div className="flex justify-between items-center">
                            <span className="text-slate-700 text-sm font-medium">{cat.name}</span>
                            <div className="space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button onClick={() => handleEditCategory(cat)} className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50" title={BN_UI_TEXT.EDIT_BUDGET_CATEGORY_BTN}>
                                <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteCategory(cat.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50" title={BN_UI_TEXT.DELETE_BUDGET_CATEGORY_BTN}>
                                <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                       </div>
                       {cat.associatedSuggestions && cat.associatedSuggestions.length > 0 && (
                           <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                               <p className="text-xs text-slate-500 mb-0.5">সম্পর্কিত পরামর্শ ({cat.associatedSuggestions.length}টি):</p>
                               <div className="flex flex-wrap gap-1">
                                   {cat.associatedSuggestions.slice(0, 5).map(sugg => ( 
                                       <span key={sugg} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{sugg}</span>
                                   ))}
                                   {cat.associatedSuggestions.length > 5 && <span className="text-xs text-slate-400 px-1.5 py-0.5">...আরও</span>}
                               </div>
                           </div>
                       )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeTab === 'budgets' && (
             <section aria-labelledby="budgets-section-title">
              <h3 id="budgets-section-title" className="text-lg font-semibold text-slate-700 mb-3">
                 {editingBudget ? BN_UI_TEXT.EDIT_BUDGET_BTN : BN_UI_TEXT.ADD_NEW_BUDGET_BTN}
              </h3>
               <form onSubmit={handleBudgetSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="budgetCategorySearch" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.SELECT_BUDGET_CATEGORY_LABEL}</label>
                    <input
                      type="text"
                      id="budgetCategorySearch"
                      value={budgetCategorySearch}
                      onChange={(e) => {
                        setBudgetCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                        setSelectedBudgetCategoryId(''); // Clear selection if typing
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder={BN_UI_TEXT.BUDGET_SELECT_CATEGORY_PLACEHOLDER}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white"
                      required={!selectedBudgetCategoryId}
                      disabled={!!editingBudget}
                      autoComplete="off"
                    />
                    {showCategoryDropdown && !editingBudget && (
                      <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {filteredBudgetCategories.length > 0 ? filteredBudgetCategories.map(cat => (
                          <li key={cat.id}
                            onClick={() => {
                              setSelectedBudgetCategoryId(cat.id);
                              setBudgetCategorySearch(cat.name);
                              setShowCategoryDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                          >{cat.name}</li>
                        )) : <li className="px-3 py-2 text-xs text-slate-500">কোনো ক্যাটেগরি মেলেনি</li>}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label htmlFor="budgetAmount" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_AMOUNT_LABEL}</label>
                    <input
                      type="number"
                      id="budgetAmount"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder={BN_UI_TEXT.AMOUNT_PLACEHOLDER}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                      required min="0.01" step="0.01"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="budgetPeriod" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_PERIOD_LABEL}</label>
                        <select
                        id="budgetPeriod"
                        value={budgetPeriod}
                        onChange={(e) => setBudgetPeriod(e.target.value as BudgetPeriod)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white"
                        required
                        disabled={!!editingBudget}
                        >
                            <option value={BudgetPeriod.MONTHLY}>{BN_UI_TEXT.BUDGET_MONTHLY_PERIOD}</option>
                            <option value={BudgetPeriod.WEEKLY}>{BN_UI_TEXT.BUDGET_WEEKLY_PERIOD}</option>
                            <option value={BudgetPeriod.QUARTERLY}>{BN_UI_TEXT.BUDGET_QUARTERLY_PERIOD}</option>
                            <option value={BudgetPeriod.YEARLY}>{BN_UI_TEXT.BUDGET_YEARLY_PERIOD}</option>
                            <option value={BudgetPeriod.CUSTOM}>{BN_UI_TEXT.BUDGET_CUSTOM_PERIOD_LABEL}</option>
                        </select>
                    </div>
                    {/* Date/Period Inputs based on selectedBudgetPeriod */}
                    {budgetPeriod === BudgetPeriod.MONTHLY && (
                        <div>
                            <label htmlFor="budgetMonthYear" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_START_MONTH_LABEL}</label>
                            <input type="month" id="budgetMonthYear" value={budgetMonthYear} onChange={e => setBudgetMonthYear(e.target.value)} disabled={!!editingBudget}
                                   className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white" required />
                        </div>
                    )}
                    {budgetPeriod === BudgetPeriod.WEEKLY && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="budgetYearForWeekly" className="block text-xs font-medium text-slate-600 mb-1">বছর</label>
                                <input type="number" id="budgetYearForWeekly" value={budgetYearForWeekly} onChange={e => setBudgetYearForWeekly(e.target.value)} disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" placeholder="বছর" required />
                            </div>
                            <div>
                                <label htmlFor="budgetWeek" className="block text-xs font-medium text-slate-600 mb-1">সপ্তাহ নং</label>
                                <input type="number" id="budgetWeek" value={budgetWeek} onChange={e => setBudgetWeek(e.target.value)} min="1" max="53" disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" placeholder="সপ্তাহ" required />
                            </div>
                        </div>
                    )}
                    {budgetPeriod === BudgetPeriod.QUARTERLY && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="budgetYearForQuarterly" className="block text-xs font-medium text-slate-600 mb-1">বছর</label>
                                <input type="number" id="budgetYearForQuarterly" value={budgetYearForQuarterly} onChange={e => setBudgetYearForQuarterly(e.target.value)} disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" placeholder="বছর" required />
                            </div>
                            <div>
                                <label htmlFor="budgetQuarter" className="block text-xs font-medium text-slate-600 mb-1">ত্রৈমাসিক</label>
                                <select id="budgetQuarter" value={budgetQuarter} onChange={e => setBudgetQuarter(e.target.value)} disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" required>
                                    <option value="1">{BN_UI_TEXT.QUARTER_1}</option>
                                    <option value="2">{BN_UI_TEXT.QUARTER_2}</option>
                                    <option value="3">{BN_UI_TEXT.QUARTER_3}</option>
                                    <option value="4">{BN_UI_TEXT.QUARTER_4}</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {budgetPeriod === BudgetPeriod.YEARLY && (
                        <div>
                             <label htmlFor="budgetYearForYearly" className="block text-sm font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_START_YEAR_LABEL}</label>
                            <input type="number" id="budgetYearForYearly" value={budgetYearForYearly} onChange={e => setBudgetYearForYearly(e.target.value)} disabled={!!editingBudget}
                                   className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white" placeholder="বছর, যেমন ২০২৪" required />
                        </div>
                    )}
                    {budgetPeriod === BudgetPeriod.CUSTOM && (
                        <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                             <div>
                                <label htmlFor="customStartDate" className="block text-xs font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_CUSTOM_START_DATE_LABEL}</label>
                                <input type="date" id="customStartDate" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" required/>
                            </div>
                            <div>
                                <label htmlFor="customEndDate" className="block text-xs font-medium text-slate-600 mb-1">{BN_UI_TEXT.BUDGET_CUSTOM_END_DATE_LABEL}</label>
                                <input type="date" id="customEndDate" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} disabled={!!editingBudget}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white text-sm" required/>
                            </div>
                        </div>
                    )}
                 </div>
                <div className="flex items-center space-x-3 pt-2">
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center space-x-1.5">
                     <PlusCircleIcon className="w-4 h-4" />
                     <span>{editingBudget ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.SAVE_BUDGET_BTN}</span>
                  </button>
                  {editingBudget && (
                    <button type="button" onClick={() => { setEditingBudget(null); setSelectedBudgetCategoryId(''); setBudgetCategorySearch(''); setBudgetAmount(''); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-md text-sm">
                      {BN_UI_TEXT.CANCEL}
                    </button>
                  )}
                </div>
              </form>

              {sortedBudgets.length === 0 && !editingBudget ? (
                 <p className="text-slate-500 text-center py-4">{BN_UI_TEXT.NO_BUDGETS_FOUND}</p>
              ) : (
                <ul className="space-y-3">
                  {sortedBudgets.map(budget => {
                    const usage = calculateBudgetUsage(budget, transactions);
                    const isOverspent = usage.spent > budget.amount;
                    return (
                        <li key={budget.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md group">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                            <div className="mb-2 sm:mb-0">
                                <h4 className="font-semibold text-md text-indigo-700">{getCategoryName(budget.categoryId)}</h4>
                                <p className="text-xs text-slate-500">{BN_UI_TEXT.BUDGET_FOR_PERIOD_LABEL.replace('{periodDisplay}', formatBudgetPeriodDisplay(budget))}</p>
                            </div>
                            <div className="flex space-x-1 self-start sm:self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button onClick={() => handleEditBudget(budget)} className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50" title={BN_UI_TEXT.EDIT_BUDGET_BTN}><EditIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteBudget(budget.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50" title={BN_UI_TEXT.DELETE_BUDGET_BTN}><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="mt-1">
                            <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                                <span>{BN_UI_TEXT.BUDGET_SPENT_LABEL}: {BN_UI_TEXT.BDT_SYMBOL}{usage.spent.toLocaleString('bn-BD')}</span>
                                <span>{BN_UI_TEXT.BUDGET_TARGET_LABEL}: {BN_UI_TEXT.BDT_SYMBOL}{budget.amount.toLocaleString('bn-BD')}</span>
                            </div>
                            <ProgressBar percentage={usage.percentageUsed} isOverspent={isOverspent} />
                            <div className="flex justify-between text-xs mt-0.5">
                                {isOverspent ? (
                                    <span className="text-red-600 font-medium">{BN_UI_TEXT.BUDGET_OVERSPENT_LABEL}: {BN_UI_TEXT.BDT_SYMBOL}{(usage.spent - budget.amount).toLocaleString('bn-BD')}</span>
                                ) : (
                                    <span className="text-green-600">{BN_UI_TEXT.BUDGET_REMAINING_LABEL}: {BN_UI_TEXT.BDT_SYMBOL}{usage.remaining.toLocaleString('bn-BD')}</span>
                                )}
                                <span className="text-slate-500">{BN_UI_TEXT.BUDGET_PERCENTAGE_USED_LABEL.replace('{percentage}', usage.percentageUsed.toFixed(0))}</span>
                            </div>
                        </div>
                        </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="mt-6 pt-4 text-right border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg shadow-md focus:outline-none"
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
      `}</style>
    </div>
  );
};

export default BudgetSetupModal;
