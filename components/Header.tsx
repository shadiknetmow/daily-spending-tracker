






import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthFormMode, AILogEntry } from '../types'; 
import { BN_UI_TEXT } from '../constants'; 

// Icons
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
import KeyboardIcon from './icons/KeyboardIcon';
import CogIcon from './icons/CogIcon'; 
import DocumentPlusIcon from './icons/DocumentPlusIcon';
import ListChecksIcon from './icons/ListChecksIcon'; 
import BuildingOfficeIcon from './icons/BuildingOfficeIcon'; 
import CubeIcon from './icons/CubeIcon'; 
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import Dropdown, { DropdownButtonTrigger } from './Dropdown'; 
import SlidersHorizontalIcon from './icons/SlidersHorizontalIcon';
import MicrophoneIconSolid from './icons/MicrophoneIconSolid';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import TerminalIcon from './icons/TerminalIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon'; 
// Removed useNotification as it's not used for AI notifications directly in Header

interface HeaderProps {
  isAdminUser: boolean; // New prop
  onAddIncomeClick: () => void;
  onAddExpenseClick: () => void;
  onAddDebtClick: () => void;
  onViewTransactionsClick: () => void;
  onManagePersonsClick: () => void;
  onViewReportClick: () => void;
  onOpenBankReportModal: () => void; // New
  onOpenStockReportModal: () => void; 
  onBudgetClick: () => void;
  onArchiveClick: () => void;
  onEditProfileClick: () => void;
  onChangePasswordClick: () => void;
  onOpenInboxModal: () => void;
  onManageSuggestionsClick: () => void;
  onCreateSalesInvoiceClick: () => void; 
  onCreatePurchaseBillClick: () => void; 
  onOpenInvoiceListModal: () => void; 
  onManageProductsClick: () => void; 
  onManageBankAccountsClick: () => void; 
  onSwitchAuthMode: (mode: AuthFormMode) => void;
  unreadMessagesCount?: number;
  onResetAppDataClick: () => void;
  isGlobalPhoneticModeActive: boolean;
  onToggleGlobalPhoneticMode: () => void;
  onManageCompanyProfilesClick: () => void; 
  onOpenGeminiSettingsModal: () => void; 
  onOpenAdminAppSettingsModal: () => void; 
  onOpenAILogModal: () => void; 
  isProcessingAICommand: boolean; 
  isAIAssistantListening: boolean; 
  onToggleAIAssistantListening: () => void; 
}

interface NavIconProps {
  className?: string;
}

const NavLinkContent: React.FC<{ text: string; icon: React.ReactElement<NavIconProps>; additionalContent?: React.ReactNode; badgeCount?: number; srText?: string }> = ({ text, icon, additionalContent, badgeCount, srText}) => (
    <>
        {React.cloneElement(icon, { className: "w-5 h-5 mr-3 text-teal-600 flex-shrink-0" })}
        <span className="text-sm font-medium">{text}</span>
        {additionalContent && <span className="ml-auto text-xs text-slate-500">{additionalContent}</span>}
        {srText && <span className="sr-only">{srText}</span>}
        {badgeCount && badgeCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {badgeCount > 9 ? '9+' : badgeCount}
            </span>
        )}
    </>
);


const Header: React.FC<HeaderProps> = (props) => {
  const { 
    isAdminUser, // Destructure new prop
    onAddIncomeClick, onAddExpenseClick, onAddDebtClick, onViewTransactionsClick, onManagePersonsClick,
    onViewReportClick, onOpenBankReportModal, onOpenStockReportModal, onBudgetClick, onArchiveClick, onEditProfileClick, onChangePasswordClick, 
    onOpenInboxModal, onManageSuggestionsClick, 
    onCreateSalesInvoiceClick, onCreatePurchaseBillClick, 
    onOpenInvoiceListModal, onManageProductsClick, onManageBankAccountsClick, 
    onSwitchAuthMode, unreadMessagesCount, 
    onResetAppDataClick, isGlobalPhoneticModeActive, onToggleGlobalPhoneticMode, onManageCompanyProfilesClick,
    onOpenGeminiSettingsModal, onOpenAdminAppSettingsModal, onOpenAILogModal,
    isProcessingAICommand, 
    isAIAssistantListening, onToggleAIAssistantListening 
  } = props;

  const { currentUser, logout, isAuthLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);


  const commonButtonClass = "text-white hover:bg-teal-700/70 font-medium py-2 px-3 rounded-md transition duration-150 flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75";
  
  const DropdownItem: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className }) => (
    <button
      onClick={() => {
        onClick();
      }}
      className={`flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 transition-colors duration-150 ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
  
  const phoneticToggleTooltip = isGlobalPhoneticModeActive ? BN_UI_TEXT.PHONETIC_BANGLA_ACTIVE : BN_UI_TEXT.PHONETIC_ENGLISH_ACTIVE;

  const renderNavLinksForMobile = () => (
    <>
      <DropdownItem onClick={onToggleGlobalPhoneticMode}>
        <NavLinkContent text={phoneticToggleTooltip} icon={<KeyboardIcon />} additionalContent={<span className={`px-1.5 py-0.5 text-xs rounded ${isGlobalPhoneticModeActive ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>{isGlobalPhoneticModeActive ? 'বাংলা' : 'EN'}</span>} />
      </DropdownItem>
      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{BN_UI_TEXT.MODAL_TITLE_ADD_TRANSACTION.split(" ")[2]}</h4> {/* লেনদেন */}
      <DropdownItem onClick={() => { onAddIncomeClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME} icon={<IncomeIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onAddExpenseClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE} icon={<ExpenseIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onViewTransactionsClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY} icon={<HistoryIcon />} /></DropdownItem>
      
      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">চালান ও পণ্য</h4>
      <DropdownItem onClick={() => { onCreateSalesInvoiceClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.CREATE_SALES_INVOICE_NAV_BTN} icon={<DocumentPlusIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onCreatePurchaseBillClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.CREATE_PURCHASE_BILL_NAV_BTN} icon={<ShoppingBagIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onOpenInvoiceListModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.VIEW_INVOICES_NAV_BTN} icon={<ListChecksIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onManageProductsClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MANAGE_PRODUCTS_STOCK_NAV_BTN} icon={<CubeIcon />} /></DropdownItem>


      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">আর্থিক সত্তা</h4> {/* Entity Management */}
      <DropdownItem onClick={() => { onManagePersonsClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MANAGE_PERSONS_MODAL_TITLE} icon={<UsersIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onAddDebtClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT} icon={<DocumentTextIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onManageBankAccountsClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MANAGE_BANK_ACCOUNTS_NAV_BTN} icon={<BuildingLibraryIcon />}/></DropdownItem> 


      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">রিপোর্ট ও বাজেট</h4>
      <DropdownItem onClick={() => { onViewReportClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_REPORTS} icon={<ReportIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onOpenBankReportModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.BANK_REPORT_MODAL_TITLE} icon={<BuildingLibraryIcon />} /></DropdownItem> {/* New Bank Report */}
      <DropdownItem onClick={() => { onOpenStockReportModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.STOCK_REPORT_NAV_BTN} icon={<ListChecksIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onBudgetClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.BUDGET_MANAGEMENT_TITLE} icon={<ChartPieIcon />} /></DropdownItem>
      
      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">যোগাযোগ</h4>
      <DropdownItem onClick={() => { onOpenInboxModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MESSAGES_NAV_BTN} icon={<InboxIcon />} badgeCount={unreadMessagesCount} /></DropdownItem>
      
      <hr className="my-1 border-slate-100" />
      <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">সেটিংস</h4>
      <DropdownItem onClick={() => { onEditProfileClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.EDIT_PROFILE_MODAL_TITLE} icon={<UserCircleIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onChangePasswordClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE} icon={<KeyIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onManageCompanyProfilesClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MANAGE_COMPANY_PROFILES_BTN} icon={<BuildingOfficeIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onManageSuggestionsClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT} icon={<UsersIcon />} /></DropdownItem>
      <DropdownItem onClick={() => { onOpenAILogModal(); setIsMobileMenuOpen(false);}}><NavLinkContent text={BN_UI_TEXT.AI_LOG_MODAL_TITLE} icon={<TerminalIcon />} /></DropdownItem>
      
      {isAdminUser && (
        <>
          <DropdownItem onClick={() => { onOpenGeminiSettingsModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.SETTINGS_NAV_ITEM_GEMINI} icon={<SlidersHorizontalIcon />} /></DropdownItem>
          <DropdownItem onClick={() => { onOpenAdminAppSettingsModal(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.APP_ADMIN_SETTINGS_NAV_ITEM} icon={<WrenchScrewdriverIcon />} /></DropdownItem>
          <DropdownItem onClick={() => { onResetAppDataClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.RESET_APP_DATA_BTN} icon={<ArrowPathIcon />} /></DropdownItem>
        </>
      )}
      <DropdownItem onClick={() => { onArchiveClick(); setIsMobileMenuOpen(false); }}><NavLinkContent text={BN_UI_TEXT.ARCHIVE_NAV_BTN} icon={<ArchiveBoxIcon />} /></DropdownItem>
    </>
  );

  let aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL;
  let aiAssistantButtonIcon = <MicrophoneIconSolid className="w-5 h-5" />;
  let aiAssistantButtonBgClass = 'bg-cyan-500 hover:bg-cyan-600';
  let aiAssistantButtonAnimationClass = '';

  if (isProcessingAICommand) {
    aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_PROCESSING;
    aiAssistantButtonIcon = <ArrowPathIcon className="w-5 h-5 animate-spin" />;
    aiAssistantButtonBgClass = 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400';
    aiAssistantButtonAnimationClass = 'animate-pulse';
  } else if (isAIAssistantListening) {
    aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_LISTENING;
    aiAssistantButtonIcon = <MicrophoneIconSolid className="w-5 h-5" />;
    aiAssistantButtonBgClass = 'bg-red-500 hover:bg-red-600 focus:ring-red-400';
    aiAssistantButtonAnimationClass = 'animate-pulse';
  }


  return (
    <>
      <header className="bg-teal-600 text-white p-3 sm:p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap truncate">{BN_UI_TEXT.APP_TITLE}</h1>
          
          <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2">
            {isAuthLoading && !currentUser ? (
              <div className="text-xs sm:text-sm animate-pulse p-2">{BN_UI_TEXT.LOADING}</div>
            ) : currentUser ? (
              <>
                <button
                    onClick={onToggleGlobalPhoneticMode}
                    className={`${commonButtonClass} ${isGlobalPhoneticModeActive ? 'bg-orange-500 hover:bg-orange-400 focus:ring-orange-400' : 'bg-sky-500 hover:bg-sky-400 focus:ring-sky-400'}`}
                    title={phoneticToggleTooltip}
                    aria-label={BN_UI_TEXT.PHONETIC_TYPING_TOGGLE_TOOLTIP}
                >
                    <KeyboardIcon className="w-5 h-5" />
                    <span className="hidden xs:inline ml-1 text-xs sm:text-sm">
                        {isGlobalPhoneticModeActive ? 'বাংলা' : 'EN'}
                    </span>
                </button>

                
                <button
                  onClick={onToggleAIAssistantListening}
                  className={`${commonButtonClass} ${aiAssistantButtonBgClass} ${aiAssistantButtonAnimationClass}`}
                  title={BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL}
                  aria-label={BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL}
                  disabled={!(('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) || (isProcessingAICommand && !isAIAssistantListening)}
                >
                  {aiAssistantButtonIcon}
                  <span className="hidden md:inline text-xs sm:text-sm">
                    {aiAssistantButtonText}
                  </span>
                </button>
                <button
                  onClick={onOpenAILogModal}
                  className={`${commonButtonClass} bg-slate-500 hover:bg-slate-600 focus:ring-slate-400`}
                  title={BN_UI_TEXT.AI_LOG_MODAL_TITLE}
                  aria-label={BN_UI_TEXT.AI_LOG_MODAL_TITLE}
                >
                  <TerminalIcon className="w-5 h-5" />
                    <span className="hidden md:inline text-xs sm:text-sm">
                    AI লগ
                  </span>
                </button>
                


                {/* Desktop Dropdowns */}
                <div className="hidden lg:flex items-center space-x-0.5">
                    <Dropdown trigger={<DropdownButtonTrigger text={BN_UI_TEXT.MODAL_TITLE_ADD_TRANSACTION.split(" ")[2]} />}> {/* লেনদেন */}
                        <DropdownItem onClick={onAddIncomeClick}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME} icon={<IncomeIcon />}/></DropdownItem>
                        <DropdownItem onClick={onAddExpenseClick}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE} icon={<ExpenseIcon />}/></DropdownItem>
                        <DropdownItem onClick={onViewTransactionsClick}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY} icon={<HistoryIcon />}/></DropdownItem>
                    </Dropdown>
                     <Dropdown trigger={<DropdownButtonTrigger text="চালান ও পণ্য" />}>
                        <DropdownItem onClick={onCreateSalesInvoiceClick}><NavLinkContent text={BN_UI_TEXT.CREATE_SALES_INVOICE_NAV_BTN} icon={<DocumentPlusIcon />} /></DropdownItem>
                        <DropdownItem onClick={onCreatePurchaseBillClick}><NavLinkContent text={BN_UI_TEXT.CREATE_PURCHASE_BILL_NAV_BTN} icon={<ShoppingBagIcon />} /></DropdownItem>
                        <DropdownItem onClick={onOpenInvoiceListModal}><NavLinkContent text={BN_UI_TEXT.VIEW_INVOICES_NAV_BTN} icon={<ListChecksIcon />} /></DropdownItem>
                        <DropdownItem onClick={onManageProductsClick}><NavLinkContent text={BN_UI_TEXT.MANAGE_PRODUCTS_STOCK_NAV_BTN} icon={<CubeIcon />} /></DropdownItem>
                    </Dropdown>
                    <Dropdown trigger={<DropdownButtonTrigger text="আর্থিক সত্তা" />}> {/* Entity Management */}
                        <DropdownItem onClick={onManagePersonsClick}><NavLinkContent text={BN_UI_TEXT.MANAGE_PERSONS_MODAL_TITLE} icon={<UsersIcon />}/></DropdownItem>
                        <DropdownItem onClick={onAddDebtClick}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT} icon={<DocumentTextIcon />}/></DropdownItem>
                        <DropdownItem onClick={onManageBankAccountsClick}><NavLinkContent text={BN_UI_TEXT.MANAGE_BANK_ACCOUNTS_NAV_BTN} icon={<BuildingLibraryIcon />}/></DropdownItem>
                    </Dropdown>
                     <Dropdown trigger={<DropdownButtonTrigger text="রিপোর্ট ও বাজেট" />}>
                        <DropdownItem onClick={onViewReportClick}><NavLinkContent text={BN_UI_TEXT.MODAL_TITLE_REPORTS} icon={<ReportIcon />}/></DropdownItem>
                        <DropdownItem onClick={onOpenBankReportModal}><NavLinkContent text={BN_UI_TEXT.BANK_REPORT_MODAL_TITLE} icon={<BuildingLibraryIcon />} /></DropdownItem> {/* New Bank Report */}
                        <DropdownItem onClick={onOpenStockReportModal}><NavLinkContent text={BN_UI_TEXT.STOCK_REPORT_NAV_BTN} icon={<ListChecksIcon />} /></DropdownItem>
                        <DropdownItem onClick={onBudgetClick}><NavLinkContent text={BN_UI_TEXT.BUDGET_MANAGEMENT_TITLE} icon={<ChartPieIcon />}/></DropdownItem>
                    </Dropdown>
                     <Dropdown trigger={<DropdownButtonTrigger text={BN_UI_TEXT.MESSAGES_NAV_BTN} />}>
                        <DropdownItem onClick={onOpenInboxModal}><NavLinkContent text={BN_UI_TEXT.INBOX_MODAL_TITLE} icon={<InboxIcon />} badgeCount={unreadMessagesCount} /></DropdownItem>
                    </Dropdown>
                </div>
                
                {/* Quick Add Buttons (for medium screens or if preferred) */}
                <div className="hidden sm:flex lg:hidden items-center space-x-1">
                    <button onClick={onAddIncomeClick} className={`${commonButtonClass} bg-green-500 hover:bg-green-400`} title={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME}><IncomeIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">আয়</span></button>
                    <button onClick={onAddExpenseClick} className={`${commonButtonClass} bg-red-500 hover:bg-red-400`} title={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE}><ExpenseIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">ব্যয়</span></button>
                    <button onClick={onAddDebtClick} className={`${commonButtonClass} bg-sky-500 hover:bg-sky-400`} title={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT}><DocumentTextIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">দেনা</span></button>
                    <button onClick={onCreateSalesInvoiceClick} className={`${commonButtonClass} bg-purple-500 hover:bg-purple-400`} title={BN_UI_TEXT.CREATE_SALES_INVOICE_NAV_BTN}><DocumentPlusIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">বিক্রয়</span></button>
                    <button onClick={onCreatePurchaseBillClick} className={`${commonButtonClass} bg-indigo-500 hover:bg-indigo-400`} title={BN_UI_TEXT.CREATE_PURCHASE_BILL_NAV_BTN}><ShoppingBagIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">ক্রয়</span></button>
                    <button onClick={onManageProductsClick} className={`${commonButtonClass} bg-orange-500 hover:bg-orange-400`} title={BN_UI_TEXT.MANAGE_PRODUCTS_STOCK_NAV_BTN}><CubeIcon className="w-5 h-5" /><span className="hidden md:inline text-xs">পণ্য</span></button>
                </div>


                <div className="hidden lg:flex items-center">
                    <Dropdown trigger={<button className={`${commonButtonClass} p-2`} title="সেটিংস"><CogIcon className="w-5 h-5"/></button>}>
                        <DropdownItem onClick={onEditProfileClick}><NavLinkContent text={BN_UI_TEXT.EDIT_PROFILE_MODAL_TITLE} icon={<UserCircleIcon />}/></DropdownItem>
                        <DropdownItem onClick={onChangePasswordClick}><NavLinkContent text={BN_UI_TEXT.CHANGE_PASSWORD_MODAL_TITLE} icon={<KeyIcon />}/></DropdownItem>
                        <DropdownItem onClick={onManageCompanyProfilesClick}><NavLinkContent text={BN_UI_TEXT.MANAGE_COMPANY_PROFILES_BTN} icon={<BuildingOfficeIcon />} /></DropdownItem>
                        <DropdownItem onClick={onManageSuggestionsClick}><NavLinkContent text={BN_UI_TEXT.MANAGE_SUGGESTIONS_BTN_TEXT} icon={<UsersIcon />}/></DropdownItem>
                        {isAdminUser && (
                          <>
                            <DropdownItem onClick={onOpenGeminiSettingsModal}><NavLinkContent text={BN_UI_TEXT.SETTINGS_NAV_ITEM_GEMINI} icon={<SlidersHorizontalIcon />} /></DropdownItem>
                            <DropdownItem onClick={onOpenAdminAppSettingsModal}><NavLinkContent text={BN_UI_TEXT.APP_ADMIN_SETTINGS_NAV_ITEM} icon={<WrenchScrewdriverIcon />} /></DropdownItem>
                            <DropdownItem onClick={onResetAppDataClick}><NavLinkContent text={BN_UI_TEXT.RESET_APP_DATA_BTN} icon={<ArrowPathIcon />}/></DropdownItem>
                          </>
                        )}
                        <DropdownItem onClick={onArchiveClick}><NavLinkContent text={BN_UI_TEXT.ARCHIVE_NAV_BTN} icon={<ArchiveBoxIcon />}/></DropdownItem>
                    </Dropdown>
                </div>
                
                <span className="text-sm hidden xl:block border-l border-teal-500 pl-3 ml-2 whitespace-nowrap">{currentUser.name || currentUser.email}</span>
                <button onClick={logout} className="hidden lg:flex bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg shadow-md transition duration-150 items-center space-x-1.5" title={BN_UI_TEXT.LOGOUT}>
                  <LogoutIcon className="w-4 h-4" /> <span>{BN_UI_TEXT.LOGOUT}</span>
                </button>
              </>
            ) : (
              // Logged-out desktop buttons
              <div className="hidden lg:flex items-center space-x-2">
                 <button onClick={() => onSwitchAuthMode('login')} className={`${commonButtonClass} bg-green-500 hover:bg-green-600`}>
                    <LoginIcon className="w-4 h-4 mr-1.5" />{BN_UI_TEXT.LOGIN}
                </button>
                <button onClick={() => onSwitchAuthMode('signup')} className={`${commonButtonClass} bg-sky-500 hover:bg-sky-600`}>
                    <UserPlusIcon className="w-4 h-4 mr-1.5" />{BN_UI_TEXT.SIGNUP}
                </button>
              </div>
            )}

            <button
              ref={hamburgerButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-teal-700/70 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              title="মেনু খুলুন"
            >
              <span className="sr-only">মেনু খুলুন</span>
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <>
        {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-[55] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true"></div>}
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-xl z-[60] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col
                      ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
            <h2 id="mobile-menu-title" className="text-lg font-semibold text-teal-700">{BN_UI_TEXT.APP_TITLE}</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500 hover:text-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" title="মেনু বন্ধ করুন">
              <XMarkIcon className="w-6 h-6" /> <span className="sr-only">মেনু বন্ধ করুন</span>
            </button>
          </div>

          {currentUser ? (
            <>
              <nav className="flex-grow py-2 overflow-y-auto" role="navigation" aria-label="প্রধান নেভিগেশন">
                {renderNavLinksForMobile()}
              </nav>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700">{currentUser.name || currentUser.email}</p>
                  <p className="text-xs text-slate-500">ব্যবহারকারী</p>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150">
                  <LogoutIcon className="w-4 h-4 mr-2" /> {BN_UI_TEXT.LOGOUT}
                </button>
              </div>
            </>
          ) : (
            <nav className="flex-grow py-3 overflow-y-auto" role="navigation" aria-label="প্রমাণীকরণ নেভিগেশন">
              <DropdownItem onClick={() => {onSwitchAuthMode('login'); setIsMobileMenuOpen(false);}}><NavLinkContent text={BN_UI_TEXT.LOGIN} icon={<LoginIcon />} /></DropdownItem>
              <DropdownItem onClick={() => {onSwitchAuthMode('signup'); setIsMobileMenuOpen(false);}}><NavLinkContent text={BN_UI_TEXT.SIGNUP} icon={<UserPlusIcon />} /></DropdownItem>
            </nav>
          )}
        </div>
      </>
    </>
  );
};

export default Header;
