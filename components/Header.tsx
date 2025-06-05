


import React, { useState, useEffect, useRef } from 'react';
import { BN_UI_TEXT } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import HistoryIcon from './icons/HistoryIcon'; 
import UsersIcon from './icons/UsersIcon'; 
import ReportIcon from './icons/ReportIcon';
import IncomeIcon from './icons/IncomeIcon'; 
import ExpenseIcon from './icons/ExpenseIcon'; 
import DocumentTextIcon from './icons/DocumentTextIcon';
import HamburgerIcon from './icons/HamburgerIcon';
import XMarkIcon from './icons/XMarkIcon';
import LogoutIcon from './icons/LogoutIcon'; 
import ChartPieIcon from './icons/ChartPieIcon';
import LoginIcon from './icons/LoginIcon'; 
import UserPlusIcon from './icons/UserPlusIcon'; 
import ArchiveBoxIcon from './icons/ArchiveBoxIcon'; 
import KeyIcon from './icons/KeyIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import InboxIcon from './icons/InboxIcon'; 
import ArrowPathIcon from './icons/ArrowPathIcon'; 
import KeyboardIcon from './icons/KeyboardIcon'; // New Icon
import { AuthFormMode } from '../types';


interface HeaderProps {
  onAddIncomeClick: () => void; 
  onAddExpenseClick: () => void; 
  onAddDebtClick: () => void;
  onViewTransactionsClick: () => void;
  onManagePersonsClick: () => void; 
  onViewReportClick: () => void;
  onBudgetClick: () => void;
  onArchiveClick: () => void; 
  onEditProfileClick: () => void;
  onChangePasswordClick: () => void; 
  onOpenInboxModal: () => void; 
  onSwitchAuthMode: (mode: AuthFormMode) => void; 
  unreadMessagesCount?: number; 
  onResetAppDataClick: () => void; 
  isGlobalPhoneticModeActive: boolean; // New prop
  onToggleGlobalPhoneticMode: () => void; // New prop
}

interface NavIconProps { 
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddIncomeClick,
  onAddExpenseClick,
  onAddDebtClick,
  onViewTransactionsClick,
  onManagePersonsClick,
  onViewReportClick,
  onBudgetClick,
  onArchiveClick, 
  onEditProfileClick,
  onChangePasswordClick,
  onOpenInboxModal, 
  onSwitchAuthMode, 
  unreadMessagesCount, 
  onResetAppDataClick, 
  isGlobalPhoneticModeActive, // Destructure new prop
  onToggleGlobalPhoneticMode, // Destructure new prop
}) => {
  const { currentUser, logout, isAuthLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const commonButtonClass = "text-white hover:bg-teal-700/70 font-medium py-2 px-3 rounded-md transition duration-150 flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75";
  
  const NavLink: React.FC<{ onClick: () => void; text: string; icon: React.ReactElement<NavIconProps>; srText?: string; badgeCount?: number; additionalContent?: React.ReactNode }> = ({ onClick, text, icon, srText, badgeCount, additionalContent }) => (
    <button
      onClick={() => { onClick(); setIsMenuOpen(false); }}
      className="flex items-center w-full px-4 py-3 text-left text-slate-700 hover:bg-teal-50 transition-colors duration-150 relative"
      role="menuitem"
    >
      {React.cloneElement(icon, { className: "w-5 h-5 mr-3 text-teal-600 flex-shrink-0" })}
      <span className="text-sm font-medium">{text}</span>
      {additionalContent && <span className="ml-auto text-xs text-slate-500">{additionalContent}</span>}
      {srText && <span className="sr-only">{srText}</span>}
      {badgeCount && badgeCount > 0 && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
  
  const phoneticToggleTooltip = isGlobalPhoneticModeActive ? BN_UI_TEXT.PHONETIC_BANGLA_ACTIVE : BN_UI_TEXT.PHONETIC_ENGLISH_ACTIVE;

  return (
    <>
      <header className="bg-teal-600 text-white p-3 sm:p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap truncate">{BN_UI_TEXT.APP_TITLE}</h1>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {isAuthLoading && !currentUser ? (
              <div className="text-xs sm:text-sm animate-pulse p-2">{BN_UI_TEXT.LOADING}</div>
            ) : currentUser ? (
              <>
                <button
                    onClick={onToggleGlobalPhoneticMode}
                    className={`${commonButtonClass} ${isGlobalPhoneticModeActive ? 'bg-orange-500 hover:bg-orange-400' : 'bg-sky-500 hover:bg-sky-400'}`}
                    title={phoneticToggleTooltip}
                    aria-label={BN_UI_TEXT.PHONETIC_TYPING_TOGGLE_TOOLTIP}
                >
                    <KeyboardIcon className="w-5 h-5" />
                    <span className="hidden xs:inline ml-1 text-xs sm:text-sm">
                        {isGlobalPhoneticModeActive ? 'বাংলা' : 'EN'}
                    </span>
                </button>
                <button
                  onClick={onAddIncomeClick}
                  className={`${commonButtonClass} bg-green-500 hover:bg-green-400`}
                  title={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME}
                >
                  <IncomeIcon className="w-5 h-5" />
                  <span className="hidden xs:inline ml-1 text-xs sm:text-sm">{BN_UI_TEXT.HEADER_ADD_INCOME_BTN}</span>
                </button>
                 <button
                  onClick={onAddExpenseClick}
                  className={`${commonButtonClass} bg-red-500 hover:bg-red-400`}
                  title={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE}
                >
                  <ExpenseIcon className="w-5 h-5" />
                  <span className="hidden xs:inline ml-1 text-xs sm:text-sm">{BN_UI_TEXT.HEADER_ADD_EXPENSE_BTN}</span>
                </button>
                <button
                  onClick={onAddDebtClick}
                  className={`${commonButtonClass} bg-sky-500 hover:bg-sky-400`}
                  title={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span className="hidden xs:inline ml-1 text-xs sm:text-sm">{BN_UI_TEXT.MODAL_TITLE_ADD_DEBT.split(" ")[0]}</span>
                </button>

                <div className="hidden lg:flex items-center space-x-1">
                  <button onClick={onViewTransactionsClick} className={commonButtonClass} title={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY}>
                    <HistoryIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY.split(" ")[0]}</span>
                  </button>
                  <button onClick={onManagePersonsClick} className={commonButtonClass} title={BN_UI_TEXT.PERSON_LIST_TITLE}>
                    <UsersIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.PERSON_LIST_TITLE.split(" ")[0]}</span>
                  </button>
                  <button onClick={onViewReportClick} className={commonButtonClass} title={BN_UI_TEXT.MODAL_TITLE_REPORTS}>
                    <ReportIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.MODAL_TITLE_REPORTS.split(" ")[0]}</span>
                  </button>
                  <button onClick={onBudgetClick} className={commonButtonClass} title={BN_UI_TEXT.BUDGET_MANAGEMENT_TITLE}>
                    <ChartPieIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.MANAGE_BUDGETS_NAV_BTN}</span>
                  </button>
                   <button onClick={onArchiveClick} className={commonButtonClass} title={BN_UI_TEXT.ARCHIVE_NAV_BTN}>
                    <ArchiveBoxIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.ARCHIVE_NAV_BTN}</span>
                  </button>
                  <button onClick={onOpenInboxModal} className={`${commonButtonClass} relative`} title={BN_UI_TEXT.MESSAGES_NAV_BTN}>
                    <InboxIcon className="w-5 h-5" /> 
                    <span className="text-xs sm:text-sm">{BN_UI_TEXT.MESSAGES_NAV_BTN}</span>
                    {unreadMessagesCount && unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </span>
                    )}
                  </button>
                  <button onClick={onEditProfileClick} className={commonButtonClass} title={BN_UI_TEXT.EDIT_PROFILE_MODAL_TITLE}>
                    <UserCircleIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.EDIT_PROFILE_NAV_BTN_TEXT}</span>
                  </button>
                  <button onClick={onChangePasswordClick} className={commonButtonClass} title={BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE}>
                    <KeyIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">{BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE.split(" ")[0]}</span>
                  </button>
                  <button onClick={onResetAppDataClick} className={`${commonButtonClass} bg-orange-500 hover:bg-orange-600`} title={BN_UI_TEXT.RESET_APP_DATA_BTN}>
                    <ArrowPathIcon className="w-5 h-5" /> <span className="text-xs sm:text-sm">রিসেট</span>
                  </button>
                </div>
                
                <span className="text-sm hidden xl:block border-l border-teal-500 pl-3 ml-2 whitespace-nowrap">{currentUser.name || currentUser.email}</span>
                <button onClick={logout} className="hidden lg:flex bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 items-center space-x-1.5" title={BN_UI_TEXT.LOGOUT}>
                  <LogoutIcon className="w-4 h-4" /> <span>{BN_UI_TEXT.LOGOUT}</span>
                </button>
              </>
            ) : (
              null 
            )}

            <button
              ref={hamburgerButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-teal-700/70 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              title="মেনু খুলুন"
            >
              <span className="sr-only">মেনু খুলুন</span>
              {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <>
        {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-[55] lg:hidden" onClick={() => setIsMenuOpen(false)} aria-hidden="true"></div>}
        <div
          id="mobile-menu"
          ref={menuRef}
          className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-xl z-[60] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col
                      ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
            <h2 id="mobile-menu-title" className="text-lg font-semibold text-teal-700">{BN_UI_TEXT.APP_TITLE}</h2>
            <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-500 hover:text-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" title="মেনু বন্ধ করুন">
              <XMarkIcon className="w-6 h-6" /> <span className="sr-only">মেনু বন্ধ করুন</span>
            </button>
          </div>

          {currentUser ? (
            <>
              <nav className="flex-grow py-3 overflow-y-auto" role="navigation" aria-label="প্রধান নেভিগেশন">
                <NavLink 
                    onClick={onToggleGlobalPhoneticMode} 
                    text={BN_UI_TEXT.PHONETIC_TYPING_TOGGLE_TOOLTIP} 
                    icon={<KeyboardIcon />}
                    additionalContent={<span className={`px-1.5 py-0.5 text-xs rounded ${isGlobalPhoneticModeActive ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>{isGlobalPhoneticModeActive ? 'বাংলা' : 'EN'}</span>}
                />
                <hr className="my-2 border-slate-100" />
                <NavLink onClick={onAddIncomeClick} text={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME} icon={<IncomeIcon />} />
                <NavLink onClick={onAddExpenseClick} text={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE} icon={<ExpenseIcon />} />
                <NavLink onClick={onAddDebtClick} text={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT} icon={<DocumentTextIcon />} />
                <hr className="my-2 border-slate-100" />
                <NavLink onClick={onViewTransactionsClick} text={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY} icon={<HistoryIcon />} />
                <NavLink onClick={onManagePersonsClick} text={BN_UI_TEXT.MANAGE_PERSONS_MODAL_TITLE} icon={<UsersIcon />} />
                <NavLink onClick={onViewReportClick} text={BN_UI_TEXT.MODAL_TITLE_REPORTS} icon={<ReportIcon />} />
                <NavLink onClick={onBudgetClick} text={BN_UI_TEXT.BUDGET_MANAGEMENT_TITLE} icon={<ChartPieIcon />} /> 
                <NavLink onClick={onArchiveClick} text={BN_UI_TEXT.ARCHIVE_NAV_BTN} icon={<ArchiveBoxIcon />} />
                <NavLink onClick={onOpenInboxModal} text={BN_UI_TEXT.MESSAGES_NAV_BTN} icon={<InboxIcon />} badgeCount={unreadMessagesCount} />
                <hr className="my-2 border-slate-100" />
                <NavLink onClick={onEditProfileClick} text={BN_UI_TEXT.EDIT_PROFILE_MODAL_TITLE} icon={<UserCircleIcon />} />
                <NavLink onClick={onChangePasswordClick} text={BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE} icon={<KeyIcon />} />
                <NavLink onClick={onResetAppDataClick} text={BN_UI_TEXT.RESET_APP_DATA_BTN} icon={<ArrowPathIcon />} /> 
              </nav>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700">{currentUser.name || currentUser.email}</p>
                  <p className="text-xs text-slate-500">ব্যবহারকারী</p>
                </div>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150">
                  <LogoutIcon className="w-4 h-4 mr-2" /> {BN_UI_TEXT.LOGOUT}
                </button>
              </div>
            </>
          ) : (
            <nav className="flex-grow py-3 overflow-y-auto" role="navigation" aria-label="প্রমাণীকরণ নেভিগেশন">
              <NavLink onClick={() => onSwitchAuthMode('login')} text={BN_UI_TEXT.LOGIN} icon={<LoginIcon />} />
              <NavLink onClick={() => onSwitchAuthMode('signup')} text={BN_UI_TEXT.SIGNUP} icon={<UserPlusIcon />} />
            </nav>
          )}
        </div>
      </>
    </>
  );
};

export default Header;