






import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Transaction, TransactionType, Debt, DebtType, DebtVersion, TransactionVersion, User, 
  Person, PersonVersion, PersonLedgerEntry, PersonLedgerEntryType, DebtFormSubmitData, 
  FormPurpose, AuthFormMode, BudgetCategory, Budget, BudgetPeriod, ProfileImageAction,
  Message, ImageMessageContent, AudioMessageContent, MessageVersion, MessageVersionSnapshot,
  UserSuggestion, SuggestionType, ExpenseFieldRequirements, Invoice, InvoiceItem, InvoicePaymentStatus, 
  InvoiceCreationData, Product, CompanyProfile, StockAdjustment, StockAdjustmentType, InvoiceType,
  GeminiSettings, AppContextData, AIPreRenderData, AILogEntry, AILanguageCode, mapAILanguageCodeToGeminiLanguage, AIScope, BankAccount
} from './types'; 
import { InvoiceVersion as AppInvoiceVersion, InvoicePayment, InvoiceVersionSnapshot as AppInvoiceVersionSnapshot } from './types'; 
import { BN_UI_TEXT, LOCAL_STORAGE_KEYS, INCOME_DESCRIPTION_SUGGESTIONS_BN, EXPENSE_DESCRIPTION_SUGGESTIONS_BN, TRANSACTION_DESCRIPTION_SUGGESTIONS_BN, COMMON_UNITS_BN, DEFAULT_GEMINI_SETTINGS, ADMIN_EMAIL } from './constants'; 
import Header from './components/Header';
import Summary from './components/Summary';
import { SimplifiedTransactionForm } from './components/SimplifiedTransactionForm';
import TransactionList from './components/TransactionList';
import { AITipCard } from './components/AITipCard';
import EditTransactionModal from './components/EditTransactionModal';
import DebtForm from './components/DebtForm';
import AuthForm from './components/AuthForm'; 
import EditDebtModal from './components/EditDebtModal';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import DebtHistoryModal from './components/DebtHistoryModal';
import Modal from './components/Modal';
import ConfirmationModal from './components/ConfirmationModal'; 
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext'; 
import NotificationsDisplay from './components/NotificationsDisplay'; 
import { ReportModal } from './components/ReportModal';
import ArchiveModal from './components/ArchiveModal'; 
import DebtList from './components/DebtList'; 
import SimpleErrorModal from './components/SimpleErrorModal'; 
import ExclamationCircleIcon from './components/icons/ExclamationCircleIcon';
import ChangePasswordModal from './components/ChangePasswordModal'; 
import EditProfileModal from './components/EditProfileModal'; 
import HomePageLoggedOut from './components/HomePageLoggedOut';


// Person Management Components
import PersonList from './components/PersonList';
import PersonForm, { ImportedUserDetails } from './components/PersonForm';
import PersonHistoryModal from './components/PersonHistoryModal';
import SelectPersonModal from './components/SelectPersonModal';
import PersonDebtsHistoryModal from './components/PersonDebtsHistoryModal'; 
import AddPersonLedgerEntryModal from './components/AddPersonLedgerEntryModal';
import PersonLedgerHistoryModal from './components/PersonLedgerHistoryModal';
import PersonFinancialOverviewModal from './components/PersonFinancialOverviewModal'; 
import ReceivablePersonsModal, { ReceivablePersonData } from './components/ReceivablePersonsModal';
import PayablePersonsModal, { PayablePersonData } from './components/PayablePersonsModal';
import ManageSuggestionsModal from './components/ManageSuggestionsModal';
// Budgeting Components
import BudgetSetupModal from './components/BudgetSetupModal';
// Chat Components
import ChatModal from './components/ChatModal';
import InboxModal from './components/InboxModal'; 
import ImageViewerModal from './components/ImageViewerModal';
// Video Call Components
import VideoCallModal from './components/VideoCallModal';
// Invoice Components
import CreateInvoiceModal from './components/CreateInvoiceModal';
import CreatePurchaseBillModal from './components/CreatePurchaseBillModal'; 
import InvoiceListModal from './components/InvoiceListModal';
import ViewInvoiceModal from './components/ViewInvoiceModal';
// Company Profile Components
import ManageCompanyProfilesModal from './components/ManageCompanyProfilesModal'; 
// Product Management Components
import ManageProductsModal from './components/ManageProductsModal'; 
import ProductFormModal from './components/ProductFormModal'; 
// Stock Report Modal
import StockReportModal from './components/StockReportModal';
// Gemini Settings Modal
import GeminiSettingsModal from './components/GeminiSettingsModal';
// App Admin Settings Modal
import AppAdminSettingsModal from './components/AppAdminSettingsModal';
// AI Interaction Log Modal
import AIInteractionLogModal from './components/AIInteractionLogModal';
// Bank Account Components
import ManageBankAccountsModal from './components/ManageBankAccountsModal';
import BankAccountFormModal from './components/BankAccountFormModal';
import BankReportModal from './components/BankReportModal'; // New


import * as apiService from './apiService'; 
import * as geminiService from './services/geminiService'; 
import * as speechService from './services/speechService';
import { convertToBanglaPhonetic } from './utils/textUtils';
import { SpeechRecognitionEvent, SpeechRecognitionErrorEvent, SpeechRecognition, SpeechRecognitionStatic } from './types/speechRecognitionTypes';


// For generating more unique client-side IDs for payments
let paymentIdCounter = 0;
let lastPaymentTimestampForId = 0;

const generateUniquePaymentId = (): string => {
  const now = Date.now();
  if (now === lastPaymentTimestampForId) {
    paymentIdCounter++;
  } else {
    paymentIdCounter = 0;
    lastPaymentTimestampForId = now;
  }
  return `pay_${now}_${paymentIdCounter}_${Math.random().toString(36).substring(2, 9)}`;
};


// Main App Component
export const App = (): JSX.Element => { 
  const authContextHookData = useAuth(); 
  
  const IS_PREVIEW_SIMULATION_ENABLED = false; 
  const PREVIEW_USER_ID = 'previewUserSSR';
  const PREVIEW_USER_MOCK: User = { id: PREVIEW_USER_ID, email: 'preview@app.com', name: 'পূর্বরূপ ব্যবহারকারী' };

  let currentUser: User | null;
  let isAuthContextLoading: boolean;

  if (IS_PREVIEW_SIMULATION_ENABLED && !authContextHookData.currentUser && !authContextHookData.isAuthLoading) {
    currentUser = PREVIEW_USER_MOCK;
    isAuthContextLoading = false; 
  } else {
    currentUser = authContextHookData.currentUser;
    isAuthContextLoading = authContextHookData.isAuthLoading;
  }
  
  const { 
    authError: authContextError, 
    clearAuthError,
    login,
    signup,
    logout: authLogout,
    requestPasswordReset,
    resetPasswordWithCode,
    changePassword,
    updateCurrentUserData,
  } = authContextHookData; 
  
  const { addNotification } = useNotification(); 
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personLedgerEntries, setPersonLedgerEntries] = useState<PersonLedgerEntry[]>([]);
  const [userCustomSuggestions, setUserCustomSuggestions] = useState<UserSuggestion[]>([]); 
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]); 
  const [products, setProducts] = useState<Product[]>([]); 
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]); 
  
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettings>(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.GEMINI_SETTINGS);
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings);
      } catch (e) {
        console.error("Failed to parse Gemini settings from localStorage", e);
      }
    }
    return DEFAULT_GEMINI_SETTINGS;
  });

  const [isLoadingData, setIsLoadingData] = useState(
    (IS_PREVIEW_SIMULATION_ENABLED && currentUser?.id === PREVIEW_USER_ID) ? false : true
  ); 
  const [appError, setAppError] = useState<string | null>(null);

  // AI Assistant states
  const [aiAssistantLanguage, setAiAssistantLanguage] = useState<AILanguageCode>('bn-BD'); 
  const [aiVoiceReplayEnabled, setAiVoiceReplayEnabled] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_VOICE_REPLAY_ENABLED);
    return storedValue ? JSON.parse(storedValue) : false; 
  });
  const [aiAssistantScope, setAiAssistantScope] = useState<AIScope>(() => {
    const storedScope = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_SCOPE) as AIScope | null;
    return storedScope || 'app'; 
  });
  const [isListeningForAI, setIsListeningForAI] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [processingAICommand, setProcessingAICommand] = useState(false);
  const [aiPreRenderDataForInvoice, setAiPreRenderDataForInvoice] = useState<AIPreRenderData | null>(null);
  const [aiLogs, setAiLogs] = useState<AILogEntry[]>(() => {
    const storedLogs = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_LOGS);
    try {
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (e) {
      console.error("Failed to parse AI logs from localStorage", e);
      return [];
    }
  });
  const [isAILogModalOpen, setIsAILogModalOpen] = useState(false);


  const [expenseFieldRequirements, setExpenseFieldRequirements] = useState<ExpenseFieldRequirements>(() => {
    const storedRequirements = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSE_FIELD_REQUIREMENTS);
    if (storedRequirements) {
      try {
        return JSON.parse(storedRequirements);
      } catch (e) {
        console.error("Failed to parse expense field requirements from localStorage", e);
      }
    }
    return {
      quantityRequired: false,
      unitRequired: false,
      notesRequired: false,
    };
  });
  const [isGlobalPhoneticModeActive, setIsGlobalPhoneticModeActive] = useState<boolean>(() => {
    const storedPhoneticMode = localStorage.getItem(LOCAL_STORAGE_KEYS.GLOBAL_PHONETIC_MODE);
    if (storedPhoneticMode) {
      try {
        return JSON.parse(storedPhoneticMode);
      } catch (e) {
        console.error("Failed to parse global phonetic mode from localStorage", e);
        return false;
      }
    }
    return false; 
  });


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTransactionEditHistoryModalOpen, setIsTransactionEditHistoryModalOpen] = useState(false);
  const [viewingTransactionEditHistoryFor, setViewingTransactionEditHistoryFor] = useState<Transaction | null>(null);
  const [isManageSuggestionsModalOpen, setIsManageSuggestionsModalOpen] = useState(false);

  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [isEditDebtModalOpen, setIsEditDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isDebtEditHistoryModalOpen, setIsDebtEditHistoryModalOpen] = useState(false);
  const [viewingDebtEditHistoryFor, setViewingDebtEditHistoryFor] = useState<Debt | null>(null);
  
  const [isManagePersonsModalOpen, setIsManagePersonsModalOpen] = useState(false);
  const [isPersonFormModalOpen, setIsPersonFormModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isPersonHistoryModalOpen, setIsPersonHistoryModalOpen] = useState(false);
  const [viewingPersonHistoryFor, setViewingPersonHistoryFor] = useState<Person | null>(null);
  
  const [isSelectPersonModalOpen, setIsSelectPersonModalOpen] = useState(false);
  const [activePersonSelectionCallback, setActivePersonSelectionCallback] = useState<((personId: string) => void) | null>(null);
  const [isAddingPersonForSelectionContext, setIsAddingPersonForSelectionContext] = useState(false);


  const [isPersonDebtsHistoryModalOpen, setIsPersonDebtsHistoryModalOpen] = useState(false);
  const [viewingPersonForDebtsHistory, setViewingPersonForDebtsHistory] = useState<Person | null>(null);

  const [isAddLedgerEntryModalOpen, setIsAddLedgerEntryModalOpen] = useState(false);
  const [isPersonLedgerHistoryModalOpen, setIsPersonLedgerHistoryModalOpen] = useState(false);
  const [selectedPersonForLedger, setSelectedPersonForLedger] = useState<Person | null>(null);

  const [isPersonFinancialOverviewModalOpen, setIsPersonFinancialOverviewModalOpen] = useState(false);
  const [viewingPersonForOverview, setViewingPersonForOverview] = useState<Person | null>(null);

  const [isReceivablePersonsModalOpen, setIsReceivablePersonsModalOpen] = useState(false);
  const [isPayablePersonsModalOpen, setIsPayablePersonsModalOpen] = useState(false);

  const [isViewTransactionsModalOpen, setIsViewTransactionsModalOpen] = useState(false); 
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBankReportModalOpen, setIsBankReportModalOpen] = useState(false); // New
  const [isStockReportModalOpen, setIsStockReportModalOpen] = useState(false); 
  const [isBudgetSetupModalOpen, setIsBudgetSetupModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false); 
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false); 
  const [isGeminiSettingsModalOpen, setIsGeminiSettingsModalOpen] = useState(false); 
  const [isAppAdminSettingsModalOpen, setIsAppAdminSettingsModalOpen] = useState(false);

  
  const [isCreateSalesInvoiceModalOpen, setIsCreateSalesInvoiceModalOpen] = useState(false); 
  const [isCreatePurchaseBillModalOpen, setIsCreatePurchaseBillModalOpen] = useState(false); 
  const [isInvoiceListModalOpen, setIsInvoiceListModalOpen] = useState(false);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null); 
  const [isManageCompanyProfilesModalOpen, setIsManageCompanyProfilesModalOpen] = useState(false); 
  
  const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false);
  const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isManageBankAccountsModalOpen, setIsManageBankAccountsModalOpen] = useState(false);
  const [isBankAccountFormModalOpen, setIsBankAccountFormModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [defaultBankAccountId, setDefaultBankAccountId] = useState<string | null>(null); 
  
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chattingWithPerson, setChattingWithPerson] = useState<Person | null>(null);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false); 
  
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImageDetails, setViewingImageDetails] = useState<{ url: string; name?: string } | null>(null);

  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [videoCallTargetPerson, setVideoCallTargetPerson] = useState<Person | null>(null);


  const [authPageMode, setAuthPageMode] = useState<AuthFormMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); 
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | undefined>();

  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    title: '',
    message: '' as string | React.ReactNode,
    onConfirmAction: () => Promise.resolve(),
    confirmButtonText: undefined as string | undefined,
    confirmButtonColor: undefined as string | undefined,
  });
  
  const [isOpeningInvoiceModalFromAI, setIsOpeningInvoiceModalFromAI] = useState(false);
  
  const isAdminUser = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser]);


  const addAILogEntry = useCallback((entryData: Omit<AILogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AILogEntry = {
      id: Date.now().toString() + Math.random().toString(16).substring(2),
      timestamp: new Date().toISOString(),
      ...entryData,
    };
    setAiLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newEntry];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_LOGS, JSON.stringify(updatedLogs));
      } catch (storageError) {
        console.error("Failed to save AI logs to localStorage:", storageError);
      }
      return updatedLogs;
    });
  }, []); 

  const clearAILogs = useCallback(() => {
    setAiLogs([]);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_LOGS);
    addNotification(BN_UI_TEXT.AI_LOG_CLEARED_SUCCESS, 'success');
  }, [addNotification]);

  const handleSetAiVoiceReplayEnabled = (enabled: boolean) => {
    setAiVoiceReplayEnabled(enabled);
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_VOICE_REPLAY_ENABLED, JSON.stringify(aiVoiceReplayEnabled));
  }, [aiVoiceReplayEnabled]);

  const handleSetAiAssistantScope = (scope: AIScope) => {
    setAiAssistantScope(scope);
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ASSISTANT_SCOPE, aiAssistantScope);
  }, [aiAssistantScope]);


  const loadAllData = useCallback(async () => {
    if (!currentUser || !currentUser.id || (IS_PREVIEW_SIMULATION_ENABLED && currentUser.id === PREVIEW_USER_ID)) {
      if (IS_PREVIEW_SIMULATION_ENABLED && currentUser?.id === PREVIEW_USER_ID) {
        setIsLoadingData(false);
      }
      return;
    }

    if (currentUser.enableDataFetchOnStartup === false) {
      console.log("Data fetch on startup is disabled by admin setting. Skipping data load.");
      setIsLoadingData(false);
      addNotification("স্টার্টআপ ডেটা লোড নিষ্ক্রিয় করা হয়েছে।", "info", 5000);
      return;
    }

    setIsLoadingData(true);
    try {
      const [
        fetchedTransactions, fetchedDebts, fetchedPersons, fetchedLedger, 
        fetchedSuggestions, fetchedBudgetCategories, fetchedBudgets, 
        fetchedMessages, fetchedInvoices, fetchedProducts, fetchedCompanyProfiles,
        fetchedBankAccounts 
      ] = await Promise.all([
        apiService.fetchRecords<Transaction>('transactions', currentUser.id),
        apiService.fetchRecords<Debt>('debts', currentUser.id),
        apiService.fetchRecords<Person>('persons', currentUser.id),
        apiService.fetchRecords<PersonLedgerEntry>('person_ledger_entries', currentUser.id),
        apiService.fetchUserSuggestions(currentUser.id),
        apiService.fetchRecords<BudgetCategory>('budgetCategories', currentUser.id),
        apiService.fetchRecords<Budget>('budgets', currentUser.id),
        apiService.fetchRecords<Message>('messages', currentUser.id),
        apiService.fetchRecords<Invoice>('invoices', currentUser.id),
        apiService.fetchRecords<Product>('products', currentUser.id),
        apiService.fetchRecords<CompanyProfile>('company_profiles', currentUser.id),
        apiService.fetchRecords<BankAccount>('bank_accounts', currentUser.id), 
      ]);
      setTransactions(fetchedTransactions);
      setDebts(fetchedDebts);
      setPersons(fetchedPersons);
      setPersonLedgerEntries(fetchedLedger);
      setUserCustomSuggestions(fetchedSuggestions);
      setBudgetCategories(fetchedBudgetCategories);
      setBudgets(fetchedBudgets);
      setMessages(fetchedMessages);
      setInvoices(fetchedInvoices);
      setProducts(fetchedProducts);
      setCompanyProfiles(fetchedCompanyProfiles);
      setBankAccounts(fetchedBankAccounts); 

      const storedDefaultBankId = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_BANK_ACCOUNT_ID);
      if (currentUser.defaultBankAccountId) {
        setDefaultBankAccountId(currentUser.defaultBankAccountId);
      } else if (storedDefaultBankId) {
        setDefaultBankAccountId(storedDefaultBankId);
      }


    } catch (error: any) {
      console.error("Error loading data:", error);
      setAppError(`ডেটা লোড করতে সমস্যা হয়েছে: ${error.message}`);
      addNotification(`ডেটা লোড করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, addNotification, IS_PREVIEW_SIMULATION_ENABLED]);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      if (IS_PREVIEW_SIMULATION_ENABLED && currentUser.id === PREVIEW_USER_ID) {
        setTransactions([]);
        setDebts([]);
        setPersons([]);
        setPersonLedgerEntries([]);
        setUserCustomSuggestions([]);
        setBudgetCategories([]);
        setBudgets([]);
        setMessages([]);
        setInvoices([]);
        setProducts([]);
        setCompanyProfiles([]);
        setBankAccounts([]); 
        setIsLoadingData(false);
      } else {
        loadAllData();
      }
    } else {
      setTransactions([]);
      setDebts([]);
      setPersons([]);
      setPersonLedgerEntries([]);
      setUserCustomSuggestions([]);
      setBudgetCategories([]);
      setBudgets([]);
      setMessages([]);
      setInvoices([]);
      setProducts([]);
      setCompanyProfiles([]);
      setBankAccounts([]); 
      if (!isAuthContextLoading) { 
          setIsLoadingData(false);
      }
    }
  }, [currentUser, loadAllData, IS_PREVIEW_SIMULATION_ENABLED, isAuthContextLoading]);


  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSE_FIELD_REQUIREMENTS, JSON.stringify(expenseFieldRequirements));
  }, [expenseFieldRequirements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.GLOBAL_PHONETIC_MODE, JSON.stringify(isGlobalPhoneticModeActive));
  }, [isGlobalPhoneticModeActive]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.GEMINI_SETTINGS, JSON.stringify(geminiSettings));
  }, [geminiSettings]);
  
  useEffect(() => {
    if (defaultBankAccountId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.DEFAULT_BANK_ACCOUNT_ID, defaultBankAccountId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DEFAULT_BANK_ACCOUNT_ID);
    }
  }, [defaultBankAccountId]);


  const handleToggleGlobalPhoneticMode = () => {
    setIsGlobalPhoneticModeActive(prev => {
      const newState = !prev;
      addNotification(
        newState ? BN_UI_TEXT.PHONETIC_BANGLA_ACTIVE : BN_UI_TEXT.PHONETIC_ENGLISH_ACTIVE,
        'info',
        3000
      );
      return newState;
    });
  };

 const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate'>): Promise<boolean> => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
        addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে নতুন লেনদেন যোগ করা যাবে না।" : BN_UI_TEXT.AUTH_ERROR_GENERAL, 'info');
        return false;
    }
    
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const nowISO = new Date().toISOString();

    const newTransactionDataWithId = { 
        ...transactionData, 
        id: transactionId, 
        userId: currentUser.id, 
        originalDate: transactionData.date, 
        lastModified: nowISO,
        editHistory: [{
            timestamp: nowISO,
            action: 'created' as 'created',
            userId: currentUser.id,
            snapshot: {
                date: transactionData.date,
                description: transactionData.description,
                amount: transactionData.amount,
                type: transactionData.type,
                originalDate: transactionData.date,
                linkedLedgerEntryId: transactionData.linkedLedgerEntryId,
                bankAccountId: transactionData.bankAccountId,
                bankAccountName: transactionData.bankAccountName,
                isDeleted: false,
                deletedAt: undefined,
            }
        }]
    };

    const newTransactionForState: Transaction = {
        ...newTransactionDataWithId
    };

    try {
        const response = await apiService.insertRecord('transactions', currentUser.id, newTransactionDataWithId);
        
        if (response.success) {
            setTransactions(prev => [newTransactionForState, ...prev.filter(t => t.id !== newTransactionForState.id)]);
            addNotification(BN_UI_TEXT.TRANSACTION_ADDED_SUCCESS || "লেনদেন যোগ করা হয়েছে!", 'success');
            return true; 
        } else {
            console.error("Error adding transaction (backend success:false):", response.error, response.sql);
            addNotification(`লেনদেন যোগ করতে সমস্যা হয়েছে: ${response.error || 'অজানা ত্রুটি'}`, 'error');
            return false;
        }
    } catch (error: any) {
        console.error("Error adding transaction (exception):", error);
        addNotification(`লেনদেন যোগ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        return false;
    }
  };
  
  const handleSaveTransaction = async (updatedTransaction: Transaction) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
        addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে লেনদেন সম্পাদন করা যাবে না।" : BN_UI_TEXT.AUTH_ERROR_GENERAL, 'info');
        setIsEditModalOpen(false); setEditingTransaction(null);
        return;
    }

    const now = new Date().toISOString();
    const transactionWithHistory: Transaction = {
      ...updatedTransaction,
      lastModified: now,
      editHistory: [
        ...(updatedTransaction.editHistory || []),
        {
          timestamp: now,
          action: 'updated',
          userId: currentUser.id,
          snapshot: {
            date: updatedTransaction.date,
            description: updatedTransaction.description,
            amount: updatedTransaction.amount,
            type: updatedTransaction.type,
            originalDate: updatedTransaction.originalDate,
            linkedLedgerEntryId: updatedTransaction.linkedLedgerEntryId,
            bankAccountId: updatedTransaction.bankAccountId,
            bankAccountName: updatedTransaction.bankAccountName,
            isDeleted: updatedTransaction.isDeleted,
            deletedAt: updatedTransaction.deletedAt,
          }
        }
      ]
    };
    
    try {
      setTransactions(prev => prev.map(t => t.id === transactionWithHistory.id ? transactionWithHistory : t));
      await apiService.updateRecord('transactions', currentUser.id, transactionWithHistory, `id = '${transactionWithHistory.id}'`);
      addNotification(BN_UI_TEXT.TRANSACTION_UPDATED, 'success');
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      addNotification(`লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
      setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)); 
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
        addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে লেনদেন মোছা যাবে না।" : BN_UI_TEXT.AUTH_ERROR_GENERAL, 'info');
        return;
    }
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
        const deletedAtTime = new Date().toISOString();
        const snapshotForHistory: TransactionVersion['snapshot'] = {
            date: transactionToDelete.date,
            description: transactionToDelete.description,
            amount: transactionToDelete.amount,
            type: transactionToDelete.type,
            originalDate: transactionToDelete.originalDate,
            linkedLedgerEntryId: transactionToDelete.linkedLedgerEntryId,
            bankAccountId: transactionToDelete.bankAccountId,
            bankAccountName: transactionToDelete.bankAccountName,
            isDeleted: true,
            deletedAt: deletedAtTime,
        };
        const updatedTransaction: Transaction = {
            ...transactionToDelete,
            isDeleted: true,
            deletedAt: deletedAtTime,
            lastModified: new Date().toISOString(),
            editHistory: [
                ...(transactionToDelete.editHistory || []),
                {
                    timestamp: new Date().toISOString(),
                    action: 'deleted' as TransactionVersion['action'],
                    userId: currentUser.id,
                    snapshot: snapshotForHistory,
                }
            ]
        };
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        await apiService.updateRecord('transactions', currentUser!.id!, { 
            isDeleted: 1, 
            deletedAt: updatedTransaction.deletedAt, 
            lastModified: updatedTransaction.lastModified, 
            editHistory: JSON.stringify(updatedTransaction.editHistory) 
        }, `id = '${id}'`);
        addNotification(BN_UI_TEXT.ITEM_DELETED, 'success');
    }
  };
  const handleRestoreTransaction = async (id: string) => { console.log("Restore transaction", id); };
  const handleViewTransactionHistory = (transaction: Transaction) => { setViewingTransactionEditHistoryFor(transaction); setIsTransactionEditHistoryModalOpen(true); };

const handleSaveDebt = async (debtData: DebtFormSubmitData, originalDebtId?: string) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে দেনা/পাওনা সংরক্ষণ করা যাবে না।" : BN_UI_TEXT.AUTH_ERROR_GENERAL, 'info');
      if(originalDebtId) setIsEditDebtModalOpen(false); else setIsAddDebtModalOpen(false);
      return;
    }

    let personIdToUse = debtData.explicitSelectedPersonId;
    if (!personIdToUse && debtData.personNameValue.trim()) {
      const existingPerson = persons.find(p => 
        !p.isDeleted && (
            (p.customAlias && p.customAlias.toLowerCase() === debtData.personNameValue.trim().toLowerCase()) ||
            p.name.toLowerCase() === debtData.personNameValue.trim().toLowerCase()
        )
      );
      if (existingPerson) {
        personIdToUse = existingPerson.id;
      } else {
        addNotification("নতুন ব্যক্তি তৈরি করার সুবিধা এখনো সম্পূর্ণ হয়নি। অনুগ্রহ করে তালিকা থেকে ব্যক্তি নির্বাচন করুন অথবা নিশ্চিত করুন নামটি সঠিক।", 'warning');
        const newPerson = await handleSavePerson({ name: debtData.personNameValue.trim() });
        if (newPerson && newPerson.id) {
          personIdToUse = newPerson.id;
          addNotification(BN_UI_TEXT.PERSON_ADDED_IMPLICITLY_DEBT.replace("{personName}", debtData.personNameValue.trim()), 'success');
        } else {
          addNotification("ব্যক্তি তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", 'error');
          return;
        }
      }
    }

    if (!personIdToUse) {
      addNotification(BN_UI_TEXT.PERSON_NAME_REQUIRED, 'error');
      return;
    }

    const now = new Date().toISOString();
    const debtTypeFromFormPurpose = 
        debtData.formPurpose === FormPurpose.CREATE_PAYABLE ? DebtType.PAYABLE : 
        debtData.formPurpose === FormPurpose.CREATE_RECEIVABLE ? DebtType.RECEIVABLE : 
        null;
    
    if (!debtTypeFromFormPurpose && !originalDebtId) { 
        addNotification("দেনা/পাওনার ধরণ নির্ধারণ করা হয়নি।", 'error');
        return;
    }


    if (originalDebtId) { 
      const debtToUpdate = debts.find(d => d.id === originalDebtId);
      if (!debtToUpdate) {
        addNotification("সম্পাদনার জন্য দেনা/পাওনা খুঁজে পাওয়া যায়নি।", 'error');
        return;
      }

      const updatedDebtData: Partial<Debt> = {
        personId: personIdToUse,
        originalAmount: debtData.amount, 
        remainingAmount: debtData.amount - (debtToUpdate.originalAmount - debtToUpdate.remainingAmount),
        description: debtData.description,
        type: debtData.debtType || debtToUpdate.type, 
        dueDate: debtData.dueDate || undefined,
        lastModified: now,
      };
      
      if (updatedDebtData.remainingAmount! < 0) {
          addNotification("মূল পরিমাণ পরিশোধিত পরিমাণের চেয়ে কম হতে পারবে না।", 'warning');
          updatedDebtData.remainingAmount = 0; 
      }
      if (updatedDebtData.remainingAmount === 0 && !debtToUpdate.isSettled) {
      }


      const newHistoryEntry: DebtVersion = {
        timestamp: now,
        action: 'updated',
        userId: currentUser.id,
        snapshot: {
          personId: updatedDebtData.personId!,
          originalAmount: updatedDebtData.originalAmount!,
          remainingAmount: updatedDebtData.remainingAmount!,
          description: updatedDebtData.description!,
          type: updatedDebtData.type!,
          dueDate: updatedDebtData.dueDate,
          isSettled: debtToUpdate.isSettled, 
          creationDate: debtToUpdate.creationDate,
          settledDate: debtToUpdate.settledDate,
        }
      };

      const finalDebtToUpdate: Debt = {
        ...debtToUpdate,
        ...updatedDebtData,
        editHistory: [...(debtToUpdate.editHistory || []), newHistoryEntry],
      };
      
      try {
        setDebts(prevDebts => prevDebts.map(d => d.id === originalDebtId ? finalDebtToUpdate : d));
        await apiService.updateRecord('debts', currentUser.id, finalDebtToUpdate, `id = '${originalDebtId}'`);
        addNotification(BN_UI_TEXT.DEBT_UPDATED, 'success');
        setIsEditDebtModalOpen(false);
        setEditingDebt(null);
      } catch (error: any) {
        console.error("Error updating debt:", error);
        addNotification(`দেনা/পাওনা আপডেট করতে সমস্যা: ${error.message}`, 'error');
        setDebts(prev => prev.map(d => d.id === originalDebtId ? debtToUpdate : d)); 
      }

    } else { 
      if (!debtTypeFromFormPurpose) { 
          addNotification("নতুন দেনা/পাওনার জন্য ধরণ আবশ্যক।", 'error');
          return;
      }
      const newDebtId = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newDebt: Debt = {
        id: newDebtId,
        userId: currentUser.id,
        personId: personIdToUse,
        originalAmount: debtData.amount,
        remainingAmount: debtData.amount,
        description: debtData.description,
        type: debtTypeFromFormPurpose,
        dueDate: debtData.dueDate || undefined,
        isSettled: false,
        creationDate: now,
        lastModified: now,
        editHistory: [{
          timestamp: now,
          action: 'created',
          userId: currentUser.id,
          snapshot: {
            personId: personIdToUse,
            originalAmount: debtData.amount,
            remainingAmount: debtData.amount,
            description: debtData.description,
            type: debtTypeFromFormPurpose,
            dueDate: debtData.dueDate || undefined,
            isSettled: false,
            creationDate: now,
          }
        }],
      };

      try {
        setDebts(prevDebts => [newDebt, ...prevDebts]);
        await apiService.insertRecord('debts', currentUser.id, newDebt);
        addNotification(BN_UI_TEXT.DEBT_ADDED, 'success');
        setIsAddDebtModalOpen(false);
      } catch (error: any) {
        console.error("Error adding debt:", error);
        addNotification(`দেনা/পাওনা যোগ করতে সমস্যা: ${error.message}`, 'error');
        setDebts(prevDebts => prevDebts.filter(d => d.id !== newDebtId)); 
      }
    }
  };

  const handleDeleteDebt = async (id: string) => { console.log("Delete debt", id); };
  
  const handleToggleSettleDebt = async (id: string) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification("ব্যবহারকারী লগইন করা নেই অথবা পূর্বরূপ মোডে এই কাজ করা যাবে না।", 'info');
      return;
    }
    const debtIndex = debts.findIndex(d => d.id === id);
    if (debtIndex === -1) return;

    const debtToUpdate = debts[debtIndex];
    const now = new Date().toISOString();
    const wasSettled = debtToUpdate.isSettled;
    const newSettledStatus = !wasSettled;

    const updatedDebt: Debt = {
      ...debtToUpdate,
      isSettled: newSettledStatus,
      settledDate: newSettledStatus ? now : undefined,
      remainingAmount: newSettledStatus ? 0 : debtToUpdate.originalAmount, // Reset remaining if unsettled
      lastModified: now,
      editHistory: [
        ...(debtToUpdate.editHistory || []),
        {
          timestamp: now,
          action: 'updated',
          userId: currentUser.id,
          snapshot: {
            ...debtToUpdate, // old state before this change
            isSettled: newSettledStatus,
            settledDate: newSettledStatus ? now : undefined,
            remainingAmount: newSettledStatus ? 0 : debtToUpdate.originalAmount,
          } as DebtVersion['snapshot'],
        }
      ]
    };
    
    setDebts(prevDebts => prevDebts.map(d => d.id === id ? updatedDebt : d));

    try {
      await apiService.updateRecord('debts', currentUser.id, updatedDebt, `id = '${id}'`);
      addNotification(newSettledStatus ? "দেনা/পাওনা পরিশোধিত হিসাবে চিহ্নিত করা হয়েছে।" : "দেনা/পাওনা অপরিশোধিত হিসাবে চিহ্নিত করা হয়েছে।", 'success');

      // If marking as settled, create a transaction
      if (newSettledStatus && debtToUpdate.remainingAmount > 0) {
        const person = persons.find(p => p.id === debtToUpdate.personId);
        const personName = person ? (person.customAlias || person.name) : BN_UI_TEXT.UNKNOWN_PERSON;
        
        const transactionData: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate'> = {
          date: debtToUpdate.settledDate || now,
          amount: debtToUpdate.remainingAmount, // The amount settled
          type: debtToUpdate.type === DebtType.PAYABLE ? TransactionType.EXPENSE : TransactionType.INCOME,
          description: debtToUpdate.type === DebtType.PAYABLE 
            ? `দেনা পরিশোধ: ${personName} (${debtToUpdate.description})`
            : `পাওনা আদায়: ${personName} (${debtToUpdate.description})`,
          linkedLedgerEntryId: `debt_settle_${debtToUpdate.id}`,
          bankAccountId: defaultBankAccountId || undefined,
          bankAccountName: defaultBankAccountId ? bankAccounts.find(ba => ba.id === defaultBankAccountId)?.accountName : undefined,
        };
        await handleAddTransaction(transactionData);
      }
      // Note: If un-settling, ideally the corresponding transaction should be voided/deleted.
      // This is complex and not implemented here for simplicity.

    } catch (error: any) {
      console.error("Error updating debt settlement status:", error);
      addNotification(`দেনা/পাওনার অবস্থা পরিবর্তনে সমস্যা: ${error.message}`, 'error');
      setDebts(prevDebts => prevDebts.map(d => d.id === id ? debtToUpdate : d)); // Revert on error
    }
  };
  
  const handleViewDebtHistory = (debt: Debt) => { setViewingDebtEditHistoryFor(debt); setIsDebtEditHistoryModalOpen(true); };
  
  const handleSavePerson = async (personData: any, existingPersonId?: string) => { console.log("Save person", personData, existingPersonId); return null;};
  const handleDeletePerson = async (id: string) => { console.log("Delete person", id); };
  const handleRestorePerson = async (id: string) => { console.log("Restore person", id); };
  const handleViewPersonHistory = (person: Person) => { setViewingPersonHistoryFor(person); setIsPersonHistoryModalOpen(true); };

  const handleStockAdjustmentFromPurchase = async (productId: string, quantity: number, invoiceNumber: string, purchaseDate: string) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) return;
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) {
      console.error(`Product with ID ${productId} not found for stock adjustment.`);
      return;
    }

    const now = new Date().toISOString();
    const adjustmentDate = purchaseDate || now;

    const newStockLevel = (productToUpdate.currentStock || 0) + quantity;

    const stockAdjustmentEntry: StockAdjustment = {
      id: `sh_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
      date: adjustmentDate,
      type: 'purchase_received',
      quantityChange: quantity,
      newStockLevel: newStockLevel,
      notes: `ক্রয় বিল #${invoiceNumber} থেকে প্রাপ্ত`,
      relatedInvoiceId: invoices.find(inv => inv.invoiceNumber === invoiceNumber)?.id, 
      userId: currentUser.id,
    };

    const updatedProduct: Product = {
      ...productToUpdate,
      currentStock: newStockLevel,
      stockHistory: [...(productToUpdate.stockHistory || []), stockAdjustmentEntry],
      lastModified: now,
    };

    setProducts(prevProducts => prevProducts.map(p => p.id === productId ? updatedProduct : p));
    try {
      await apiService.updateRecord('products', currentUser.id, {
        currentStock: updatedProduct.currentStock,
        stockHistory: JSON.stringify(updatedProduct.stockHistory),
        lastModified: updatedProduct.lastModified,
      }, `id = '${productId}'`);
      addNotification(`'${productToUpdate.name}' এর স্টক ${quantity.toLocaleString('bn-BD')} ${productToUpdate.stockUnit || ''} বৃদ্ধি করা হয়েছে।`, 'success');
    } catch (error: any) {
      addNotification(`'${productToUpdate.name}' এর স্টক আপডেট করতে সমস্যা: ${error.message}`, 'error');
      setProducts(prevProducts => prevProducts.map(p => p.id === productId ? productToUpdate : p));
    }
  };

  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'stockHistory' | 'isDeleted' | 'deletedAt' | 'currentStock' | 'stockUnit' | 'lowStockThreshold'>,
    initialStockData?: { initialStock?: number, stockUnit?: string, lowStockThreshold?: number },
    existingProductId?: string
  ) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে পণ্য যোগ/সম্পাদন করা যাবে না।" : "ব্যবহারকারী লগইন করা নেই।", 'error');
      return null;
    }
    const now = new Date().toISOString();
    if (existingProductId) { 
      const productToUpdate = products.find(p => p.id === existingProductId);
      if (!productToUpdate) {
        addNotification("পণ্য খুঁজে পাওয়া যায়নি।", 'error');
        return null;
      }
      const updatedProductData: Product = { 
        ...productToUpdate,
        ...productData, 
        stockUnit: initialStockData?.stockUnit || productToUpdate.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE, 
        lowStockThreshold: initialStockData?.lowStockThreshold ?? productToUpdate.lowStockThreshold ?? 5, 
        lastModified: now,
      };
      
      setProducts(prev => prev.map(p => p.id === existingProductId ? updatedProductData : p));
      await apiService.updateRecord('products', currentUser.id, updatedProductData, `id = '${existingProductId}'`);
      addNotification(BN_UI_TEXT.PRODUCT_UPDATED_SUCCESS, 'success');
      setIsProductFormModalOpen(false);
      setEditingProduct(null);
      setIsManageProductsModalOpen(true); 
      return updatedProductData;

    } else { 
      const newProduct: Product = {
        id: `prod_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUser.id,
        ...productData,
        createdAt: now,
        lastModified: now,
        currentStock: initialStockData?.initialStock ?? 0,
        stockUnit: initialStockData?.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE,
        lowStockThreshold: initialStockData?.lowStockThreshold ?? 5,
        stockHistory: initialStockData?.initialStock && initialStockData.initialStock > 0 ? [
          {
            id: `sh_${Date.now()}`,
            date: now,
            type: 'initial',
            quantityChange: initialStockData.initialStock,
            newStockLevel: initialStockData.initialStock,
            userId: currentUser.id,
          }
        ] : [],
      };
      setProducts(prev => [newProduct, ...prev]);
      await apiService.insertRecord('products', currentUser.id, newProduct);
      addNotification(BN_UI_TEXT.PRODUCT_ADDED_SUCCESS, 'success');
      setIsProductFormModalOpen(false);
      setIsManageProductsModalOpen(true); 
      return newProduct;
    }
  };
  const handleDeleteProduct = async (id: string) => { console.log("Delete product", id); };
  const handleRestoreProduct = async (id: string) => { console.log("Restore product", id); };

  const handleSaveInvoice = async (invoiceData: InvoiceCreationData, originalInvoiceId?: string): Promise<Invoice | null> => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে চালান তৈরি/সম্পাদনা করা যাবে না।" : "ব্যবহারকারী লগইন করা নেই।", 'error');
      return null;
    }
    const now = new Date().toISOString();

    if (originalInvoiceId) { 
      const invoiceToUpdate = invoices.find(inv => inv.id === originalInvoiceId);
      if (!invoiceToUpdate) {
        addNotification(BN_UI_TEXT.INVOICE_NOT_FOUND_ERROR || "চালান খুঁজে পাওয়া যায়নি।", 'error');
        return null;
      }

      const finalInvoiceType = invoiceToUpdate.invoiceType;

      const updatedInvoice: Invoice = {
        ...invoiceToUpdate, 
        ...invoiceData,    
        invoiceType: finalInvoiceType, 
        lastModified: now,
        editHistory: [
          ...(invoiceToUpdate.editHistory || []),
          {
            timestamp: now,
            action: 'updated',
            userId: currentUser.id,
            snapshot: { 
              invoiceNumber: invoiceData.invoiceNumber,
              invoiceType: finalInvoiceType, 
              invoiceDate: invoiceData.invoiceDate,
              dueDate: invoiceData.dueDate,
              personId: invoiceData.personId,
              companyProfileId: invoiceData.companyProfileId,
              items: invoiceData.items,
              subtotal: invoiceData.subtotal,
              totalAmount: invoiceData.totalAmount,
              paymentStatus: invoiceData.paymentStatus,
            } as AppInvoiceVersionSnapshot, 
          }
        ],
      };
      delete (updatedInvoice as any).initialPayment; 

      setInvoices(prev => prev.map(inv => inv.id === originalInvoiceId ? updatedInvoice : inv));
      setEditingInvoice(null);
      try {
        await apiService.updateRecord('invoices', currentUser.id, updatedInvoice, `id = '${originalInvoiceId}'`);
        addNotification(BN_UI_TEXT.INVOICE_UPDATED_SUCCESS, 'success');
        return updatedInvoice;
      } catch (error: any) {
        addNotification(BN_UI_TEXT.INVOICE_CREATION_ERROR.replace('{error}', error.message).replace('তৈরি', 'আপডেট'), 'error');
        setInvoices(prev => prev.map(inv => inv.id === originalInvoiceId ? invoiceToUpdate : inv)); 
        return null;
      }

    } else { 
      if (!invoiceData.invoiceType) {
          addNotification("চালানের প্রকার (বিক্রয়/ক্রয়) নির্ধারণ করা হয়নি।", 'error');
          return null;
      }

      const newInvoiceId = `inv_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`;
      let paymentsReceived: InvoicePayment[] = [];
      let finalPaymentStatus = invoiceData.paymentStatus;

      if (invoiceData.initialPayment) {
        const newPayment: InvoicePayment = {
          ...invoiceData.initialPayment,
          id: generateUniquePaymentId(), 
          recordedAt: now,
        };
        paymentsReceived.push(newPayment);

        if (newPayment.amount >= invoiceData.totalAmount) {
          finalPaymentStatus = InvoicePaymentStatus.PAID;
        } else if (newPayment.amount > 0) {
          finalPaymentStatus = InvoicePaymentStatus.PARTIALLY_PAID;
        }
      }

      const newInvoice: Invoice = {
        ...invoiceData,
        id: newInvoiceId,
        userId: currentUser.id,
        createdAt: now,
        lastModified: now,
        paymentsReceived: paymentsReceived,
        paymentStatus: finalPaymentStatus,
        editHistory: [], 
        isDeleted: false,
      };
      
      setInvoices(prev => [newInvoice, ...prev]);
      try {
        await apiService.insertRecord('invoices', currentUser.id, newInvoice);
        addNotification(BN_UI_TEXT.INVOICE_CREATED_SUCCESS, 'success');

        if ((newInvoice.paymentStatus === InvoicePaymentStatus.PAID || newInvoice.paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID) && newInvoice.initialPayment && newInvoice.initialPayment.amount > 0) {
          const transactionAmount = newInvoice.initialPayment.amount;
          let transactionDescription = '';
          let transactionType: TransactionType;

          if (newInvoice.invoiceType === InvoiceType.SALES) {
              transactionDescription = BN_UI_TEXT.INVOICE_INITIAL_PAYMENT_TRANSACTION_CREATED_DESC
                  .replace('{invoiceNumber}', newInvoice.invoiceNumber)
                  .replace('{amount}', transactionAmount.toLocaleString('bn-BD'));
              transactionType = TransactionType.INCOME;
          } else { 
              transactionDescription = BN_UI_TEXT.BILL_INITIAL_PAYMENT_TRANSACTION_CREATED_DESC
                  .replace('{invoiceNumber}', newInvoice.invoiceNumber)
                  .replace('{amount}', transactionAmount.toLocaleString('bn-BD'));
              transactionType = TransactionType.EXPENSE;
          }
          
          const newTransactionData: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate'> = {
            date: newInvoice.initialPayment.paymentDate || now,
            description: transactionDescription,
            amount: transactionAmount,
            type: transactionType,
            linkedLedgerEntryId: `invoice_${newInvoice.id}_payment_initial`,
            bankAccountId: newInvoice.initialPayment.bankAccountId,
            bankAccountName: newInvoice.initialPayment.bankAccountName,
          };
          await handleAddTransaction(newTransactionData);
        }

        if (newInvoice.invoiceType === InvoiceType.PURCHASE) {
          for (const item of newInvoice.items) {
            if (item.originalProductId) { 
              await handleStockAdjustmentFromPurchase(item.originalProductId, item.quantity, newInvoice.invoiceNumber, newInvoice.invoiceDate);
            } else {
              const productByName = products.find(p => p.name === item.productName);
              if(productByName) {
                  await handleStockAdjustmentFromPurchase(productByName.id, item.quantity, newInvoice.invoiceNumber, newInvoice.invoiceDate);
              } else {
                  console.warn(`Could not adjust stock for item '${item.productName}' in purchase bill ${newInvoice.invoiceNumber} as product ID was missing or product not found by name.`);
              }
            }
          }
        }
        return newInvoice;
      } catch (error: any) {
        addNotification(BN_UI_TEXT.INVOICE_CREATION_ERROR.replace('{error}', error.message), 'error');
        setInvoices(prev => prev.filter(inv => inv.id !== newInvoiceId));
        return null;
      }
    }
  };

  const handleRecordInvoicePayment = async (invoiceId: string, paymentData: Omit<InvoicePayment, 'id' | 'recordedAt'>) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে পেমেন্ট রেকর্ড করা যাবে না।" : "ব্যবহারকারী লগইন করা নেই।", 'error');
      return;
    }

    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex === -1) {
      addNotification(BN_UI_TEXT.INVOICE_NOT_FOUND_ERROR || "চালান খুঁজে পাওয়া যায়নি।", 'error');
      return;
    }
    const originalInvoice = invoices[invoiceIndex];
    const now = new Date().toISOString();

    const newPayment: InvoicePayment = {
      ...paymentData,
      id: generateUniquePaymentId(), 
      recordedAt: now,
    };

    const updatedPaymentsReceived = [...(originalInvoice.paymentsReceived || []), newPayment];
    const totalPaid = updatedPaymentsReceived.reduce((sum, p) => sum + p.amount, 0);
    
    let newPaymentStatus = originalInvoice.paymentStatus;
    if (Math.abs(totalPaid - originalInvoice.totalAmount) < 0.001) { 
      newPaymentStatus = InvoicePaymentStatus.PAID;
    } else if (totalPaid > 0) {
      newPaymentStatus = InvoicePaymentStatus.PARTIALLY_PAID;
    } else {
      newPaymentStatus = InvoicePaymentStatus.PENDING; 
    }

    const updatedInvoice: Invoice = {
      ...originalInvoice,
      paymentsReceived: updatedPaymentsReceived,
      paymentStatus: newPaymentStatus,
      lastModified: now,
      editHistory: [
        ...(originalInvoice.editHistory || []),
        {
          timestamp: now,
          action: 'payment_recorded',
          userId: currentUser.id,
          snapshot: { 
            ...originalInvoice, 
            items: originalInvoice.items, 
            paymentsReceived: updatedPaymentsReceived,
            paymentStatus: newPaymentStatus,
            invoiceType: originalInvoice.invoiceType, 
          } as AppInvoiceVersionSnapshot,
        }
      ],
    };

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv));

    try {
      await apiService.updateRecord('invoices', currentUser.id, updatedInvoice, `id = '${invoiceId}'`);
      addNotification(BN_UI_TEXT.PAYMENT_RECORDED_SUCCESS, 'success');

      let transactionDescription = '';
      let transactionType: TransactionType;

      if (updatedInvoice.invoiceType === InvoiceType.SALES) {
        transactionDescription = BN_UI_TEXT.INVOICE_PAYMENT_TRANSACTION_CREATED_DESC
            .replace('{invoiceNumber}', updatedInvoice.invoiceNumber)
            .replace('{amount}', paymentData.amount.toLocaleString('bn-BD'));
        transactionType = TransactionType.INCOME;
      } else { 
        transactionDescription = BN_UI_TEXT.BILL_PAYMENT_TRANSACTION_CREATED_DESC
            .replace('{invoiceNumber}', updatedInvoice.invoiceNumber)
            .replace('{amount}', paymentData.amount.toLocaleString('bn-BD'));
        transactionType = TransactionType.EXPENSE;
      }
      
      const newTransactionData: Omit<Transaction, 'id' | 'userId' | 'editHistory' | 'lastModified' | 'originalDate'> = {
        date: paymentData.paymentDate,
        description: transactionDescription,
        amount: paymentData.amount,
        type: transactionType,
        linkedLedgerEntryId: `invoice_${invoiceId}_payment_${newPayment.id}`,
        bankAccountId: paymentData.bankAccountId, 
        bankAccountName: paymentData.bankAccountName, 
      };
      await handleAddTransaction(newTransactionData);

    } catch (error: any) {
      addNotification(BN_UI_TEXT.PAYMENT_RECORDING_ERROR.replace('{error}', error.message), 'error');
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? originalInvoice : inv)); 
    }
  };
  
  const handleSaveCompanyProfile = async (profileData: Omit<CompanyProfile, 'id' | 'userId' | 'createdAt' | 'lastModified'>, existingId?: string): Promise<CompanyProfile | null> => { console.log("Save company profile", profileData, existingId); return null; };
  const handleUpdateCompanyProfile = async (profileId: string, updates: Partial<CompanyProfile>) => { console.log("Update company profile", profileId, updates); };
  const handleDeleteCompanyProfile = async (profileId: string) => { console.log("Delete company profile", profileId); };

  const handleManageBankAccountsClick = () => setIsManageBankAccountsModalOpen(true);
  
  const handleOpenBankAccountFormModalForAdd = () => {
    setIsManageBankAccountsModalOpen(false);
    setEditingBankAccount(null);
    setIsBankAccountFormModalOpen(true);
  };

  const handleOpenBankAccountFormModalForEdit = (accountToEdit: BankAccount) => {
    setIsManageBankAccountsModalOpen(false);
    setEditingBankAccount(accountToEdit);
    setIsBankAccountFormModalOpen(true);
  };
  
  const handleCloseBankAccountFormModal = () => {
    setIsBankAccountFormModalOpen(false);
    setEditingBankAccount(null);
    setIsManageBankAccountsModalOpen(true);
  };

  const handleSaveBankAccount = async (
    bankAccountData: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory' | 'isDeleted' | 'deletedAt'>,
    existingBankAccountId?: string
  ) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) {
      addNotification(currentUser?.id === PREVIEW_USER_ID ? "পূর্বরূপ মোডে ব্যাংক অ্যাকাউন্ট সংরক্ষণ করা যাবে না।" : "ব্যবহারকারী লগইন করা নেই।", 'error');
      return;
    }
    const now = new Date().toISOString();

    if (existingBankAccountId) {
      const accountToUpdate = bankAccounts.find(acc => acc.id === existingBankAccountId);
      if (!accountToUpdate) {
        addNotification("ব্যাংক অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।", 'error');
        return;
      }

      const updatedAccount: BankAccount = {
        ...accountToUpdate,
        ...bankAccountData,
        lastModified: now,
        editHistory: [
          ...(accountToUpdate.editHistory || []),
          {
            timestamp: now,
            action: 'updated',
            userId: currentUser.id,
            snapshot: { ...bankAccountData, isDeleted: accountToUpdate.isDeleted, deletedAt: accountToUpdate.deletedAt },
          }
        ]
      };
      setBankAccounts(prev => prev.map(acc => acc.id === existingBankAccountId ? updatedAccount : acc));
      await apiService.updateRecord('bank_accounts', currentUser.id, updatedAccount, `id = '${existingBankAccountId}'`);
      addNotification(BN_UI_TEXT.BANK_ACCOUNT_UPDATED_SUCCESS, 'success');

    } else {
      const newAccountId = `bank_${Date.now().toString()}_${Math.random().toString(36).substring(2,7)}`;
      const newAccount: BankAccount = {
        id: newAccountId,
        userId: currentUser.id,
        ...bankAccountData,
        createdAt: now,
        lastModified: now,
        editHistory: [{
          timestamp: now,
          action: 'created',
          userId: currentUser.id,
          snapshot: { ...bankAccountData, isDeleted: false },
        }],
      };
      setBankAccounts(prev => [newAccount, ...prev]);
      await apiService.insertRecord('bank_accounts', currentUser.id, newAccount);
      addNotification(BN_UI_TEXT.BANK_ACCOUNT_ADDED_SUCCESS, 'success');
    }
    
    if (bankAccountData.isDefault) {
        await handleSetDefaultBankAccount(existingBankAccountId || bankAccounts.find(ba => ba.accountName === bankAccountData.accountName)?.id || ''); 
    } else if (existingBankAccountId && defaultBankAccountId === existingBankAccountId && !bankAccountData.isDefault) {
        await handleSetDefaultBankAccount(''); 
    }

    handleCloseBankAccountFormModal();
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) return;
    
    openConfirmationModal(
        BN_UI_TEXT.CONFIRM_DELETE_BANK_ACCOUNT_MSG.split("?")[0] + "?",
        BN_UI_TEXT.CONFIRM_DELETE_BANK_ACCOUNT_MSG.split("?")[1],
        async () => {
            const accountToDelete = bankAccounts.find(acc => acc.id === accountId);
            if (!accountToDelete) return;
            
            const now = new Date().toISOString();
            const updatedAccount: BankAccount = {
                ...accountToDelete,
                isDeleted: true,
                deletedAt: now,
                lastModified: now,
                editHistory: [
                  ...(accountToDelete.editHistory || []),
                  {
                    timestamp: now,
                    action: 'deleted',
                    userId: currentUser.id!,
                    snapshot: { ...accountToDelete, isDeleted: true, deletedAt: now } as any, 
                  }
                ]
            };

            setBankAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));
            await apiService.updateRecord('bank_accounts', currentUser.id, { isDeleted: 1, deletedAt: now, lastModified: now, editHistory: JSON.stringify(updatedAccount.editHistory) }, `id = '${accountId}'`);
            addNotification(BN_UI_TEXT.BANK_ACCOUNT_DELETED_SUCCESS, 'success');
            if (defaultBankAccountId === accountId) {
              await handleSetDefaultBankAccount(''); 
            }
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };
  
  const handleSetDefaultBankAccount = async (accountId: string) => {
      if (!currentUser) return;
      const oldDefault = bankAccounts.find(ba => ba.isDefault);
      const newDefault = bankAccounts.find(ba => ba.id === accountId);

      setBankAccounts(prevAccounts => prevAccounts.map(acc => ({
          ...acc,
          isDefault: acc.id === accountId,
      })));
      setDefaultBankAccountId(accountId || null); 

      try {
          await updateCurrentUserData({ defaultBankAccountId: accountId || null });
          if (oldDefault && oldDefault.id !== accountId) {
              await apiService.updateRecord('bank_accounts', currentUser.id, { isDefault: 0 }, `id = '${oldDefault.id}'`);
          }
          if (newDefault && newDefault.id !== oldDefault?.id) {
              await apiService.updateRecord('bank_accounts', currentUser.id, { isDefault: 1 }, `id = '${newDefault.id}'`);
          }
          if (newDefault) {
            addNotification(BN_UI_TEXT.BANK_ACCOUNT_SET_AS_DEFAULT_SUCCESS.replace('{accountName}', newDefault.accountName), 'success');
          } else if (oldDefault) {
            addNotification(BN_UI_TEXT.BANK_ACCOUNT_REMOVED_AS_DEFAULT_SUCCESS.replace('{accountName}', oldDefault.accountName), 'info');
          }
      } catch (error: any) {
          addNotification(`ডিফল্ট ব্যাংক অ্যাকাউন্ট সেট করতে সমস্যা: ${error.message}`, 'error');
          setBankAccounts(prev => prev.map(acc => ({...acc, isDefault: acc.id === oldDefault?.id})));
          setDefaultBankAccountId(oldDefault?.id || null);
      }
  };


  const totalIncome = useMemo(() => transactions.filter(t => t.type === TransactionType.INCOME && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === TransactionType.EXPENSE && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const totalPayable = useMemo(() => debts.filter(d => d.type === DebtType.PAYABLE && !d.isSettled).reduce((sum, d) => sum + d.remainingAmount, 0), [debts]);
  const totalReceivable = useMemo(() => debts.filter(d => d.type === DebtType.RECEIVABLE && !d.isSettled).reduce((sum, d) => sum + d.remainingAmount, 0), [debts]);
  
  const allTransactionSuggestions = useMemo(() => {
    const combined = [
        ...INCOME_DESCRIPTION_SUGGESTIONS_BN,
        ...EXPENSE_DESCRIPTION_SUGGESTIONS_BN,
        ...userCustomSuggestions.map(s => s.text),
    ];
    return [...new Set(combined)].sort((a, b) => a.localeCompare(b, 'bn-BD'));
  }, [userCustomSuggestions]);
  
  const getPersonNetLedgerBalance = useCallback((personId: string): number => {
    const relevantEntries = personLedgerEntries.filter(entry => entry.personId === personId);
    if (relevantEntries.length === 0) return 0;
    const latestEntry = relevantEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return latestEntry?.balanceAfterEntry || 0;
  }, [personLedgerEntries]);

  const handleOpenProductFormModalForAdd = () => {
    setIsManageProductsModalOpen(false); 
    setEditingProduct(null);
    setIsProductFormModalOpen(true);
  };

  const handleOpenProductFormModalForEdit = (productToEdit: Product) => {
    setIsManageProductsModalOpen(false);
    setEditingProduct(productToEdit);
    setIsProductFormModalOpen(true);
  };
  
  const handleCloseProductFormModal = () => {
    setIsProductFormModalOpen(false);
    setEditingProduct(null);
    setIsManageProductsModalOpen(true); 
  };


  const unreadMessagesCount = useMemo(() => {
    if (!currentUser || !currentUser.id) return 0;
    return messages.filter(msg => msg.actualReceiverId === currentUser.id && !msg.isRead && !msg.isDeleted).length;
  }, [messages, currentUser]);


  const getCompositePersonBalance = useCallback((personId: string): number => {
    const ledgerBalance = getPersonNetLedgerBalance(personId); 
    const unsettledDebts = debts.filter(d => d.personId === personId && !d.isSettled);
    
    let netDebtEffect = 0;
    unsettledDebts.forEach(debt => {
      if (debt.type === DebtType.RECEIVABLE) { 
        netDebtEffect += debt.remainingAmount;
      } else { 
        netDebtEffect -= debt.remainingAmount;
      }
    });
    return ledgerBalance + netDebtEffect;
  }, [getPersonNetLedgerBalance, debts]);

  const handleOpenPersonFinancialOverview = (person: Person) => {
    setViewingPersonForOverview(person);
    setIsPersonFinancialOverviewModalOpen(true);
  };


  const handleOpenAddIncomeModal = () => setIsAddIncomeModalOpen(true);
  const handleOpenAddExpenseModal = () => setIsAddExpenseModalOpen(true);
  const handleViewTransactionsClick = () => setIsViewTransactionsModalOpen(true);
  const handleManagePersonsClick = () => setIsManagePersonsModalOpen(true);
  const handleAddDebtClick = () => setIsAddDebtModalOpen(true);
  const handleViewReportClick = () => setIsReportModalOpen(true);
  const handleOpenBankReportModal = () => setIsBankReportModalOpen(true); // New
  const handleOpenStockReportModal = () => setIsStockReportModalOpen(true); 
  const handleBudgetClick = () => setIsBudgetSetupModalOpen(true);
  const handleArchiveClick = () => setIsArchiveModalOpen(true);
  const handleEditProfileClick = () => setIsEditProfileModalOpen(true);
  const handleChangePasswordClick = () => setIsChangePasswordModalOpen(true);
  const handleOpenInboxModal = () => setIsInboxModalOpen(true);
  const handleManageSuggestionsClick = () => setIsManageSuggestionsModalOpen(true);
  const handleOpenGeminiSettingsModal = () => setIsGeminiSettingsModalOpen(true); 
  const handleOpenAdminAppSettingsModal = () => setIsAppAdminSettingsModalOpen(true); 
  const handleOpenAILogModal = () => setIsAILogModalOpen(true);
  
  const handleCreateSalesInvoiceClick = () => {
    setEditingInvoice(null); 
    setAiPreRenderDataForInvoice(null); 
    setIsCreateSalesInvoiceModalOpen(true);
  }; 
  const handleCreatePurchaseBillClick = () => {
    setEditingInvoice(null); 
    setAiPreRenderDataForInvoice(null); 
    setIsCreatePurchaseBillModalOpen(true); 
  }; 
  const handleOpenInvoiceListModal = () => setIsInvoiceListModalOpen(true);
  const handleManageProductsClick = () => setIsManageProductsModalOpen(true);
  const handleManageCompanyProfilesClick = () => setIsManageCompanyProfilesModalOpen(true);
  
  const handleOpenEditInvoiceModal = (invoiceToEdit: Invoice) => {
    setEditingInvoice(invoiceToEdit);
    if (invoiceToEdit.invoiceType === InvoiceType.SALES) {
      setIsCreateSalesInvoiceModalOpen(true);
    } else if (invoiceToEdit.invoiceType === InvoiceType.PURCHASE) {
      setIsCreatePurchaseBillModalOpen(true);
    }
    setIsInvoiceListModalOpen(false); 
  };

  const handleResetAppDataClick = () => {
    setConfirmModalProps({
        title: BN_UI_TEXT.RESET_APP_DATA_BTN,
        message: BN_UI_TEXT.CONFIRM_RESET_APP_DATA_MSG,
        onConfirmAction: async () => {
            Object.values(LOCAL_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            addNotification(BN_UI_TEXT.APP_DATA_RESET_SUCCESS, 'success');
            setTimeout(() => window.location.reload(), 2000);
        },
        confirmButtonText: BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        confirmButtonColor: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    });
    setIsConfirmModalOpen(true);
  };
  const handleOpenSelectPersonModal = (callback: (personId: string) => void) => {
    setActivePersonSelectionCallback(() => callback); 
    setIsSelectPersonModalOpen(true);
  };

  const handleAddNewPersonFromSelection = () => {
    setIsSelectPersonModalOpen(false); 
    setIsAddingPersonForSelectionContext(true); 
    setEditingPerson(null); 
    setIsPersonFormModalOpen(true);
  };

  const handleSavePersonFromSelectionContext = async (
    personData: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'>,
    existingPersonId?: string
  ) => {
    const savedPerson = await handleSavePerson(personData, existingPersonId); 
    if (savedPerson && activePersonSelectionCallback) {
      activePersonSelectionCallback(savedPerson.id); 
    }
    setIsPersonFormModalOpen(false);
    setIsAddingPersonForSelectionContext(false);
    setActivePersonSelectionCallback(null);
  };

  const handleCancelPersonFormFromSelectionContext = () => {
    setIsPersonFormModalOpen(false);
    setIsAddingPersonForSelectionContext(false);
    if (activePersonSelectionCallback) {
        setIsSelectPersonModalOpen(true); 
    }
    setActivePersonSelectionCallback(null);
  };

   const onOpenImageViewer = (imageUrl: string, imageName?: string) => {
    setViewingImageDetails({ url: imageUrl, name: imageName });
    setIsImageViewerOpen(true);
  };

  const openChatForPerson = (person: Person) => {
    setChattingWithPerson(person);
    setIsChatModalOpen(true);
  };

  const openVideoCallForPerson = (person: Person) => {
    setVideoCallTargetPerson(person);
    setIsVideoCallModalOpen(true);
  };

  const getPeriodDates = (period: string): { startDate: Date, endDate: Date } => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
  
    switch (period.toLowerCase()) {
      case 'today':
      case 'আজকে':
      case 'আজ':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'current_week':
      case 'এই সপ্তাহে':
        const firstDayOfWeek = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); 
        startDate = new Date(new Date(today).setDate(firstDayOfWeek));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'current_month':
      case 'এই মাসে':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all_time':
      default:
        startDate = new Date(0); 
        endDate = new Date();    
        break;
    }
    return { startDate, endDate };
  };

  const handleProcessAICommand = useCallback(async (transcript: string, languageCode: AILanguageCode = aiAssistantLanguage) => {
    console.log('[AI Assistant Debug - App.tsx] ENTERING handleProcessAICommand. Transcript:', `"${transcript}"`, "CurrentUser ID:", currentUser ? currentUser.id : "NULL", "Language:", languageCode, "Scope:", aiAssistantScope);
  
    if (!transcript || !currentUser) {
      addAILogEntry({ type: 'error', commandText: transcript, errorMessage: 'Transcript or currentUser was null for processing.' });
      setProcessingAICommand(false);
      return;
    }
  
    addAILogEntry({ type: 'command', commandText: transcript, rawAIResponse: "Processing command..." });
    speechService.cancelSpeech();
    setProcessingAICommand(true);
    addNotification(BN_UI_TEXT.AI_ASSISTANT_PROCESSING, 'info', 3000);
  
    const appContext: AppContextData = {
      totalIncome, totalExpense, balance, totalPayable, totalReceivable,
      activeTransactionsCount: transactions.filter(t => !t.isDeleted).length,
      personsCount: persons.filter(p => !p.isDeleted).length,
      featureList: [
        BN_UI_TEXT.APP_FEATURE_TRANSACTION_TRACKING, BN_UI_TEXT.APP_FEATURE_DEBT_MANAGEMENT,
        BN_UI_TEXT.APP_FEATURE_PERSON_MANAGEMENT, BN_UI_TEXT.APP_FEATURE_BUDGETING,
        BN_UI_TEXT.APP_FEATURE_INVOICING, BN_UI_TEXT.APP_FEATURE_PRODUCT_MANAGEMENT,
        BN_UI_TEXT.APP_FEATURE_AI_FINANCIAL_TIPS, BN_UI_TEXT.APP_FEATURE_CHAT_WITH_CONTACTS,
        BN_UI_TEXT.APP_FEATURE_DATA_REPORTS, BN_UI_TEXT.APP_FEATURE_USER_PROFILE_SETTINGS,
        BN_UI_TEXT.APP_FEATURE_DATA_QUERY_AI,
      ],
    };
  
    try {
      const aiResponse = await geminiService.processUserCommandViaAI(transcript, appContext, geminiSettings, languageCode, aiAssistantScope);
      const intent = aiResponse?.intent;
      let responseTextForLog = aiResponse?.responseText || (languageCode === 'bn-BD' ? BN_UI_TEXT.AI_REPLY_CANNOT_UNDERSTAND : "Sorry, I couldn't understand your request.");
      const actionDetails = aiResponse?.actionDetails;
      const rawAIResponse = aiResponse?.rawResponse || JSON.stringify(aiResponse);
      
      let appGeneratedResponseText = responseTextForLog; 

      if (intent === 'perform_action' && actionDetails?.actionType) {
        // ... (existing action handling logic)
        appGeneratedResponseText = languageCode === 'bn-BD' ? BN_UI_TEXT.AI_ACTION_PERFORMED : "Okay, initiating that action for you.";
      } else if (intent === 'query_app_data' && actionDetails) {
        // ... (existing query handling logic)
      } else if (intent === 'explain_feature') {
          appGeneratedResponseText = aiResponse.responseText || (languageCode === 'bn-BD' ? "এই বৈশিষ্ট্যটি সম্পর্কে বলতে পারছি না।" : "I'm unable to explain that feature.");
      } else if (intent === 'general_query') { 
          appGeneratedResponseText = aiResponse.responseText || (languageCode === 'bn-BD' ? "দুঃখিত, এই প্রশ্নের উত্তর আমার জানা নেই।" : "Sorry, I don't have an answer for that question.");
      } else { 
          appGeneratedResponseText = aiResponse.responseText || (languageCode === 'bn-BD' ? BN_UI_TEXT.AI_FALLBACK_RESPONSE : "Sorry, I can only assist with matters related to this application.");
      }
      
      if (aiVoiceReplayEnabled) {
        speechService.speakText(appGeneratedResponseText, languageCode);
      }
      
      addAILogEntry({
        type: aiResponse?.error ? 'error' : 'response',
        commandText: transcript,
        responseText: appGeneratedResponseText, 
        parsedIntent: intent,
        actionDetails: actionDetails,
        rawAIResponse: rawAIResponse,
        errorMessage: aiResponse?.error ? `AI Service Error: ${aiResponse.error}` : undefined,
      });
  
    } catch (error: any) {
      console.error('[AI Assistant Debug - App.tsx] CATCH BLOCK in handleProcessAICommand. Error:', error);
      const errorMsg = error.message || BN_UI_TEXT.AI_ASSISTANT_ERROR_UNKNOWN;
      addNotification(errorMsg, 'error');
      const responseToSpeak = languageCode === 'bn-BD' ? BN_UI_TEXT.AI_REPLY_GENERAL_ERROR : "Sorry, an error occurred.";
      if (aiVoiceReplayEnabled) {
        speechService.speakText(responseToSpeak, languageCode);
      }
      addAILogEntry({
          type: 'error',
          commandText: transcript,
          errorMessage: `Error in handleProcessAICommand: ${errorMsg}`,
          rawAIResponse: error.toString(),
      });
      setAiPreRenderDataForInvoice(null);
    } finally {
      console.log('[AI Assistant Debug - App.tsx] FINALLY block in handleProcessAICommand. Setting processingAICommand to false.');
      setProcessingAICommand(false);
    }
  }, [currentUser, addAILogEntry, addNotification, geminiSettings, totalIncome, totalExpense, balance, totalPayable, totalReceivable, transactions, persons, debts, aiAssistantLanguage, aiVoiceReplayEnabled, aiAssistantScope]);


  const handleToggleAIAssistantListening = useCallback(() => {
    if (processingAICommand) {
      console.log('[AI Assistant Debug - App.tsx] AI is currently processing a command, ignoring toggle.');
      addAILogEntry({ type: 'error', errorMessage: "AI command processing in progress. Cannot start new listening session now."});
      return;
    }

    if (isListeningForAI && speechRecognitionRef.current) {
      console.log('[AI Assistant Debug - App.tsx] User explicitly stopped listening.');
      speechRecognitionRef.current.stop(); 
      setIsListeningForAI(false); 
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionStatic | undefined;
    if (!SpeechRecognitionAPI) {
      const errorMsg = BN_UI_TEXT.AI_ASSISTANT_ERROR_SERVICE_UNAVAILABLE;
      addNotification(errorMsg, 'error');
      addAILogEntry({ type: 'error', errorMessage: `SpeechRecognitionAPI not available: ${errorMsg}` });
      return;
    }

    if (!speechRecognitionRef.current) {
      console.log('[AI Assistant Debug - App.tsx] Initializing SpeechRecognition.');
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.continuous = true; 
      speechRecognitionRef.current.interimResults = false;
      
      speechRecognitionRef.current.onstart = () => {
        console.log('[AI Assistant Debug - App.tsx] Speech recognition started.');
        setIsListeningForAI(true); 
        addNotification(BN_UI_TEXT.AI_ASSISTANT_LISTENING, 'info', 3000);
      };

      speechRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        // ... (existing onresult logic)
      };

      speechRecognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        // ... (existing onerror logic)
      };
      
      speechRecognitionRef.current.onend = () => {
        // ... (existing onend logic)
      };
    }
    
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.lang = aiAssistantLanguage; 
    }

    try {
      console.log('[AI Assistant Debug - App.tsx] Attempting to start speech recognition with language:', aiAssistantLanguage);
      speechRecognitionRef.current?.start();
    } catch (e: any) {
      // ... (existing start error logic)
    }
  }, [isListeningForAI, processingAICommand, addAILogEntry, addNotification, handleProcessAICommand, aiAssistantLanguage]);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        console.log('[AI Assistant Debug - App.tsx] Cleaning up speech recognition service on unmount/logout.');
        speechRecognitionRef.current.stop(); 
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current = null; 
      }
      setIsListeningForAI(false); 
    };
  }, [currentUser]); 

  const openConfirmationModal = useCallback((title: string, message: string | React.ReactNode, onConfirmAction: () => Promise<void>, confirmButtonText?: string, confirmButtonColor?: string) => {
    setConfirmModalProps({ title, message, onConfirmAction, confirmButtonText, confirmButtonColor });
    setIsConfirmModalOpen(true);
  }, []);


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <NotificationsDisplay />
      <Header
        isAdminUser={isAdminUser}
        onAddIncomeClick={handleOpenAddIncomeModal}
        onAddExpenseClick={handleOpenAddExpenseModal}
        onViewTransactionsClick={handleViewTransactionsClick}
        onManagePersonsClick={handleManagePersonsClick}
        onAddDebtClick={handleAddDebtClick}
        onViewReportClick={handleViewReportClick}
        onOpenBankReportModal={handleOpenBankReportModal} // New Prop
        onOpenStockReportModal={handleOpenStockReportModal} 
        onBudgetClick={handleBudgetClick}
        onArchiveClick={handleArchiveClick}
        onEditProfileClick={handleEditProfileClick}
        onChangePasswordClick={handleChangePasswordClick}
        onOpenInboxModal={handleOpenInboxModal}
        onManageSuggestionsClick={handleManageSuggestionsClick}
        onCreateSalesInvoiceClick={handleCreateSalesInvoiceClick} 
        onCreatePurchaseBillClick={handleCreatePurchaseBillClick} 
        onOpenInvoiceListModal={handleOpenInvoiceListModal}
        onManageProductsClick={handleManageProductsClick}
        onManageBankAccountsClick={handleManageBankAccountsClick} 
        onSwitchAuthMode={(mode) => { setAuthPageMode(mode); setIsAuthModalOpen(true); }}
        unreadMessagesCount={unreadMessagesCount}
        onResetAppDataClick={handleResetAppDataClick}
        isGlobalPhoneticModeActive={isGlobalPhoneticModeActive}
        onToggleGlobalPhoneticMode={handleToggleGlobalPhoneticMode}
        onManageCompanyProfilesClick={handleManageCompanyProfilesClick}
        onOpenGeminiSettingsModal={handleOpenGeminiSettingsModal} 
        onOpenAdminAppSettingsModal={handleOpenAdminAppSettingsModal}
        onOpenAILogModal={handleOpenAILogModal}
        isProcessingAICommand={processingAICommand}
        isAIAssistantListening={isListeningForAI}
        onToggleAIAssistantListening={handleToggleAIAssistantListening}
      />
      <main className="container mx-auto p-4 flex-grow pt-20 sm:pt-24">
        {isAuthContextLoading && (
          <div className="text-center py-20 text-slate-600 text-lg">{BN_UI_TEXT.LOADING}</div>
        )}

        {!currentUser && !isAuthContextLoading && (
          <HomePageLoggedOut
            onSwitchAuthMode={(mode) => {
              setAuthPageMode(mode);
              setIsAuthModalOpen(true);
            }}
            onOpenInvoiceListModal={handleOpenInvoiceListModal} 
          />
        )}

        {currentUser && !isAuthContextLoading && (
          <>
            {isLoadingData && <div className="text-center py-10 text-slate-500">{BN_UI_TEXT.LOADING}</div>}
            {!isLoadingData && (
                <>
                    <Summary
                        totalIncome={totalIncome}
                        totalExpense={totalExpense}
                        balance={balance}
                        totalPayable={totalPayable}
                        totalReceivable={totalReceivable}
                        onOpenReceivablePersonsModal={() => setIsReceivablePersonsModalOpen(true)}
                        onOpenPayablePersonsModal={() => setIsPayablePersonsModalOpen(true)}
                    />
                    {isAdminUser && <AITipCard balance={balance} geminiSettings={geminiSettings} />}
                     <DebtList 
                        debts={debts}
                        persons={persons}
                        onDeleteDebt={handleDeleteDebt}
                        onToggleSettle={handleToggleSettleDebt}
                        onEditDebt={(debt) => { setEditingDebt(debt); setIsEditDebtModalOpen(true); }}
                        onViewHistory={handleViewDebtHistory}
                        onViewPersonFinancialOverview={handleOpenPersonFinancialOverview}
                     />
                </>
            )}
          </>
        )}
      </main>

      {/* ---- Modals ---- */}
      {/* ... (Existing Modals: Auth, AddIncome, AddExpense, EditTransaction, TransactionHistory, Suggestions, Debts, Persons, etc.) ... */}
      {isAuthModalOpen && ( <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title={authPageMode === 'login' ? BN_UI_TEXT.LOGIN : authPageMode === 'signup' ? BN_UI_TEXT.SIGNUP : authPageMode === 'forgotPasswordRequest' ? BN_UI_TEXT.FORGOT_PASSWORD_TITLE : BN_UI_TEXT.FORGOT_PASSWORD_TITLE }> <AuthForm mode={authPageMode} initialEmail={emailForPasswordReset} onClose={() => setIsAuthModalOpen(false)} onSwitchMode={(newMode, email) => { setAuthPageMode(newMode); if (email) setEmailForPasswordReset(email); }} /> </Modal> )}
      {isAddIncomeModalOpen && ( <Modal isOpen={isAddIncomeModalOpen} onClose={() => setIsAddIncomeModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME}> <SimplifiedTransactionForm transactionType={TransactionType.INCOME} onAddTransaction={handleAddTransaction} suggestionsList={allTransactionSuggestions.filter(s => INCOME_DESCRIPTION_SUGGESTIONS_BN.includes(s) || userCustomSuggestions.find(us => us.text === s && us.type === 'income'))} onOpenManageSuggestions={() => { setIsAddIncomeModalOpen(false); setIsManageSuggestionsModalOpen(true); }} formTitle={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME} expenseFieldRequirements={expenseFieldRequirements} onUpdateExpenseFieldRequirements={() => {}} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} bankAccounts={bankAccounts} defaultBankAccountId={defaultBankAccountId} /> </Modal> )}
      {isAddExpenseModalOpen && ( <Modal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE}> <SimplifiedTransactionForm transactionType={TransactionType.EXPENSE} onAddTransaction={handleAddTransaction} suggestionsList={allTransactionSuggestions.filter(s => EXPENSE_DESCRIPTION_SUGGESTIONS_BN.includes(s) || userCustomSuggestions.find(us => us.text === s && us.type === 'expense'))} onOpenManageSuggestions={() => { setIsAddExpenseModalOpen(false); setIsManageSuggestionsModalOpen(true); }} formTitle={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE} expenseFieldRequirements={expenseFieldRequirements} onUpdateExpenseFieldRequirements={(newReq) => setExpenseFieldRequirements(prev => ({...prev, ...newReq}))} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} bankAccounts={bankAccounts} defaultBankAccountId={defaultBankAccountId} /> </Modal> )}
      {isEditModalOpen && editingTransaction && ( <EditTransactionModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingTransaction(null); }} transaction={editingTransaction} onSave={handleSaveTransaction} allSuggestions={allTransactionSuggestions} onOpenManageSuggestions={() => { setIsEditModalOpen(false); setIsManageSuggestionsModalOpen(true); }} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} bankAccounts={bankAccounts} /> )}
      {isTransactionEditHistoryModalOpen && viewingTransactionEditHistoryFor && ( <TransactionHistoryModal isOpen={isTransactionEditHistoryModalOpen} onClose={() => setIsTransactionEditHistoryModalOpen(false)} transaction={viewingTransactionEditHistoryFor} /> )}
      {isManageSuggestionsModalOpen && ( <ManageSuggestionsModal isOpen={isManageSuggestionsModalOpen} onClose={() => setIsManageSuggestionsModalOpen(false)} userSuggestions={userCustomSuggestions} predefinedIncomeSuggestions={INCOME_DESCRIPTION_SUGGESTIONS_BN} predefinedExpenseSuggestions={EXPENSE_DESCRIPTION_SUGGESTIONS_BN} onAddSuggestion={async (text, type) => { }} onEditSuggestion={async (id, newText) => { }} onDeleteSuggestion={async (id) => { }} /> )}
      {isAddDebtModalOpen && ( <Modal isOpen={isAddDebtModalOpen} onClose={() => setIsAddDebtModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT}> <DebtForm onAddDebt={handleSaveDebt} persons={persons.filter(p => !p.isDeleted)} debts={debts} onOpenSelectPersonModal={handleOpenSelectPersonModal} getCompositePersonBalance={getCompositePersonBalance} /> </Modal> )}
      {isEditDebtModalOpen && editingDebt && ( <EditDebtModal isOpen={isEditDebtModalOpen} onClose={() => setIsEditDebtModalOpen(false)} debt={editingDebt} onSave={handleSaveDebt} persons={persons.filter(p => !p.isDeleted)} onOpenSelectPersonModal={handleOpenSelectPersonModal} /> )}
      {isDebtEditHistoryModalOpen && viewingDebtEditHistoryFor && ( <DebtHistoryModal isOpen={isDebtEditHistoryModalOpen} onClose={() => setIsDebtEditHistoryModalOpen(false)} debt={viewingDebtEditHistoryFor} persons={persons} /> )}
      {isManagePersonsModalOpen && ( <Modal isOpen={isManagePersonsModalOpen} onClose={() => setIsManagePersonsModalOpen(false)} title={BN_UI_TEXT.MANAGE_PERSONS_MODAL_TITLE} size="xl"> <PersonList persons={persons} onEditPerson={(person) => { setEditingPerson(person); setIsPersonFormModalOpen(true); setIsManagePersonsModalOpen(false); }} onDeletePerson={handleDeletePerson} onViewPersonHistory={handleViewPersonHistory} onAddNewPerson={() => { setEditingPerson(null); setIsPersonFormModalOpen(true); setIsManagePersonsModalOpen(false); }} onViewPersonDebtsHistory={(person) => { setViewingPersonForDebtsHistory(person); setIsPersonDebtsHistoryModalOpen(true); }} onViewPersonLedger={(person) => { setSelectedPersonForLedger(person); setIsPersonLedgerHistoryModalOpen(true);}} getPersonNetLedgerBalance={getPersonNetLedgerBalance} onRestorePerson={handleRestorePerson} onOpenChat={openChatForPerson} onOpenVideoCall={openVideoCallForPerson} /> </Modal> )}
      {isPersonFormModalOpen && ( <Modal isOpen={isPersonFormModalOpen} onClose={() => { setIsPersonFormModalOpen(false); if (!isAddingPersonForSelectionContext) setIsManagePersonsModalOpen(true); else handleCancelPersonFormFromSelectionContext(); }} title={editingPerson ? BN_UI_TEXT.EDIT_PERSON_MODAL_TITLE : BN_UI_TEXT.ADD_PERSON_MODAL_TITLE} > <PersonForm initialData={editingPerson} onSave={ isAddingPersonForSelectionContext ? handleSavePersonFromSelectionContext : async (data, id) => { await handleSavePerson(data, id); setIsPersonFormModalOpen(false); setIsManagePersonsModalOpen(true); }} onCancel={() => { setIsPersonFormModalOpen(false); if (!isAddingPersonForSelectionContext) setIsManagePersonsModalOpen(true); else handleCancelPersonFormFromSelectionContext();}} allPersons={persons} onUserDetailsImported={(details) => { }} /> </Modal> )}
      {isPersonHistoryModalOpen && viewingPersonHistoryFor && ( <PersonHistoryModal isOpen={isPersonHistoryModalOpen} onClose={() => setIsPersonHistoryModalOpen(false)} person={viewingPersonHistoryFor} /> )}
      {isSelectPersonModalOpen && activePersonSelectionCallback && ( <SelectPersonModal isOpen={isSelectPersonModalOpen} onClose={() => { setIsSelectPersonModalOpen(false); setActivePersonSelectionCallback(null); }} persons={persons.filter(p => !p.isDeleted)} onSelectPerson={(personId) => { activePersonSelectionCallback(personId); setIsSelectPersonModalOpen(false); setActivePersonSelectionCallback(null); }} onAddNewPerson={handleAddNewPersonFromSelection} /> )}
      {isPersonDebtsHistoryModalOpen && viewingPersonForDebtsHistory && ( <PersonDebtsHistoryModal isOpen={isPersonDebtsHistoryModalOpen} onClose={() => setIsPersonDebtsHistoryModalOpen(false)} person={viewingPersonForDebtsHistory} personDebts={debts.filter(d => d.personId === viewingPersonForDebtsHistory.id)} allPersons={persons} onDeleteDebt={handleDeleteDebt} onToggleSettle={handleToggleSettleDebt} onEditDebt={(debt) => { setIsEditDebtModalOpen(true); setEditingDebt(debt); setIsPersonDebtsHistoryModalOpen(false); }} onViewDebtHistory={handleViewDebtHistory} /> )}
      {isAddLedgerEntryModalOpen && selectedPersonForLedger && ( <AddPersonLedgerEntryModal isOpen={isAddLedgerEntryModalOpen} onClose={() => setIsAddLedgerEntryModalOpen(false)} person={selectedPersonForLedger} onAddEntry={async (entryData) => { console.log(entryData); }} /> )}
      {isPersonLedgerHistoryModalOpen && selectedPersonForLedger && ( <PersonLedgerHistoryModal isOpen={isPersonLedgerHistoryModalOpen} onClose={() => setIsPersonLedgerHistoryModalOpen(false)} person={selectedPersonForLedger} ledgerEntries={personLedgerEntries.filter(e => e.personId === selectedPersonForLedger.id)} currentNetBalance={getPersonNetLedgerBalance(selectedPersonForLedger.id)} onAddEntryClick={(person) => { setIsAddLedgerEntryModalOpen(true); setSelectedPersonForLedger(person); }} onDeleteEntry={async (entryId, personId) => { }} /> )}
      {isPersonFinancialOverviewModalOpen && viewingPersonForOverview && ( <PersonFinancialOverviewModal isOpen={isPersonFinancialOverviewModalOpen} onClose={() => setIsPersonFinancialOverviewModalOpen(false)} person={viewingPersonForOverview} personDebts={debts.filter(d => d.personId === viewingPersonForOverview.id)} personLedgerEntries={personLedgerEntries.filter(e => e.personId === viewingPersonForOverview.id)} currentNetLedgerBalance={getPersonNetLedgerBalance(viewingPersonForOverview.id)} allPersons={persons} onDeleteDebt={handleDeleteDebt} onToggleSettle={handleToggleSettleDebt} onEditDebt={(debt) => { setIsEditDebtModalOpen(true); setEditingDebt(debt); }} onViewDebtHistory={handleViewDebtHistory} onAddLedgerEntryClick={(person) => { setIsAddLedgerEntryModalOpen(true); setSelectedPersonForLedger(person); }} onDeleteLedgerEntry={async (entryId, personId) => { }} /> )}
      {isReceivablePersonsModalOpen && ( <ReceivablePersonsModal isOpen={isReceivablePersonsModalOpen} onClose={() => setIsReceivablePersonsModalOpen(false)} receivablePersons={persons.map(p => ({ personId: p.id, personName: p.customAlias || p.name, personMobile: p.mobileNumber, totalReceivableAmount: debts.filter(d => d.personId === p.id && d.type === DebtType.RECEIVABLE && !d.isSettled).reduce((sum,d) => sum + d.remainingAmount, 0) })).filter(p => p.totalReceivableAmount > 0)} onViewPersonDetails={(person) => { setViewingPersonForOverview(persons.find(p => p.id === person.id)!); setIsPersonFinancialOverviewModalOpen(true); setIsReceivablePersonsModalOpen(false); }} persons={persons} /> )}
      {isPayablePersonsModalOpen && ( <PayablePersonsModal isOpen={isPayablePersonsModalOpen} onClose={() => setIsPayablePersonsModalOpen(false)} payablePersons={persons.map(p => ({ personId: p.id, personName: p.customAlias || p.name, personMobile: p.mobileNumber, totalPayableAmount: debts.filter(d => d.personId === p.id && d.type === DebtType.PAYABLE && !d.isSettled).reduce((sum,d) => sum + d.remainingAmount, 0) })).filter(p => p.totalPayableAmount > 0)} onViewPersonDetails={(person) => { setViewingPersonForOverview(persons.find(p => p.id === person.id)!); setIsPersonFinancialOverviewModalOpen(true); setIsPayablePersonsModalOpen(false); }} persons={persons} /> )}
      {isViewTransactionsModalOpen && ( <Modal isOpen={isViewTransactionsModalOpen} onClose={() => setIsViewTransactionsModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY} size="3xl"> <TransactionList transactions={transactions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={(t) => { setEditingTransaction(t); setIsEditModalOpen(true); setIsViewTransactionsModalOpen(false); }} onViewHistory={handleViewTransactionHistory} onRestoreTransaction={handleRestoreTransaction} initialShowDeleted={false} /> </Modal> )}
      {isReportModalOpen && ( <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} transactions={transactions} allDescriptions={allTransactionSuggestions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={(t) => { setEditingTransaction(t); setIsEditModalOpen(true); setIsReportModalOpen(false); }} onViewHistory={handleViewTransactionHistory} onRestoreTransaction={handleRestoreTransaction} /> )}
      {isBankReportModalOpen && currentUser && ( <BankReportModal isOpen={isBankReportModalOpen} onClose={() => setIsBankReportModalOpen(false)} transactions={transactions} invoices={invoices} persons={persons} bankAccounts={bankAccounts} debts={debts} /> )}
      {isStockReportModalOpen && currentUser && ( <StockReportModal isOpen={isStockReportModalOpen} onClose={() => setIsStockReportModalOpen(false)} products={products} invoices={invoices} /> )}
      {isBudgetSetupModalOpen && currentUser && ( <BudgetSetupModal isOpen={isBudgetSetupModalOpen} onClose={() => setIsBudgetSetupModalOpen(false)} categories={budgetCategories} budgets={budgets} transactions={transactions} allTransactionSuggestions={allTransactionSuggestions} userCustomSuggestions={userCustomSuggestions.map(s => s.text)} onAddCategory={async (name, suggestions) => { }} onUpdateCategory={async (id, name, suggestions) => { }} onDeleteCategory={async (id) => { }} onAddBudget={async (catId, amount, period, start, end) => { }} onUpdateBudget={async (id, amount) => { }} onDeleteBudget={async (id) => { }} calculateBudgetUsage={(budget, trans) => ({spent: 0, remaining: 0, percentageUsed: 0})} /> )}
      {isArchiveModalOpen && ( <ArchiveModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} allTransactions={transactions} persons={persons} onRestoreTransaction={handleRestoreTransaction} onRestorePerson={handleRestorePerson} onViewTransactionHistory={handleViewTransactionHistory} onViewPersonHistory={handleViewPersonHistory} onEditPerson={(p) => {setEditingPerson(p); setIsPersonFormModalOpen(true); setIsArchiveModalOpen(false);}} onViewPersonDebtsHistory={(p) => {setViewingPersonForDebtsHistory(p); setIsPersonDebtsHistoryModalOpen(true);}} onViewPersonLedger={(p) => {setSelectedPersonForLedger(p); setIsPersonLedgerHistoryModalOpen(true);}} getPersonNetLedgerBalance={getPersonNetLedgerBalance} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={(t) => { setEditingTransaction(t); setIsEditModalOpen(true); setIsArchiveModalOpen(false); }} onOpenChat={openChatForPerson} onOpenVideoCall={openVideoCallForPerson} /> )}
      {isChangePasswordModalOpen && ( <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} /> )}
      {isEditProfileModalOpen && ( <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} /> )}
      {isGeminiSettingsModalOpen && isAdminUser && ( <GeminiSettingsModal isOpen={isGeminiSettingsModalOpen} onClose={() => setIsGeminiSettingsModalOpen(false)} currentSettings={geminiSettings} onSaveSettings={setGeminiSettings} /> )}
      {isAppAdminSettingsModalOpen && isAdminUser && ( <AppAdminSettingsModal isOpen={isAppAdminSettingsModalOpen} onClose={() => setIsAppAdminSettingsModalOpen(false)} /> )}
      {isAILogModalOpen && currentUser && ( <AIInteractionLogModal isAdminUser={isAdminUser} isOpen={isAILogModalOpen} onClose={() => setIsAILogModalOpen(false)} logs={aiLogs} onClearLogs={clearAILogs} isAIAssistantListening={isListeningForAI} isAICommandProcessing={processingAICommand} onToggleAIAssistantListening={handleToggleAIAssistantListening} currentAILanguage={aiAssistantLanguage} onSetAILanguage={setAiAssistantLanguage} currentAIScope={aiAssistantScope} onSetAIScope={handleSetAiAssistantScope} onSendCommand={handleProcessAICommand} aiVoiceReplayEnabled={aiVoiceReplayEnabled} onSetAiVoiceReplayEnabled={handleSetAiVoiceReplayEnabled} /> )}
      {isCreateSalesInvoiceModalOpen && currentUser && ( <CreateInvoiceModal isOpen={isCreateSalesInvoiceModalOpen} onClose={() => { setIsCreateSalesInvoiceModalOpen(false); setEditingInvoice(null); setAiPreRenderDataForInvoice(null); }} onSaveInvoice={handleSaveInvoice} persons={persons.filter(p => !p.isDeleted)} products={products.filter(p => !p.isDeleted)} companyProfiles={companyProfiles.filter(cp => !cp.isDeleted)} onOpenSelectPersonModal={handleOpenSelectPersonModal} onPersonAdded={async (personData) => await handleSavePerson(personData)} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} onOpenManageProductsModal={handleManageProductsClick} editingInvoiceData={editingInvoice} aiPreRenderData={isOpeningInvoiceModalFromAI ? aiPreRenderDataForInvoice : undefined} onAIInvoiceDataProcessed={() => { setAiPreRenderDataForInvoice(null); setIsOpeningInvoiceModalFromAI(false); }} onOpenConfirmationModal={openConfirmationModal} /> )}
      {isCreatePurchaseBillModalOpen && currentUser && ( <CreatePurchaseBillModal isOpen={isCreatePurchaseBillModalOpen} onClose={() => {setIsCreatePurchaseBillModalOpen(false); setEditingInvoice(null); setAiPreRenderDataForInvoice(null);}} onSaveInvoice={handleSaveInvoice} persons={persons.filter(p => !p.isDeleted)} products={products.filter(p => !p.isDeleted)} companyProfiles={companyProfiles.filter(cp => !cp.isDeleted)} onOpenSelectPersonModal={handleOpenSelectPersonModal} onPersonAdded={async (personData) => await handleSavePerson(personData)} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} onOpenManageProductsModal={handleManageProductsClick} editingInvoiceData={editingInvoice} /> )}
      {isInvoiceListModalOpen && ( <InvoiceListModal isOpen={isInvoiceListModalOpen} onClose={() => setIsInvoiceListModalOpen(false)} invoices={invoices} persons={persons} onViewInvoice={(invoice) => { setViewingInvoice(invoice); setIsViewInvoiceModalOpen(true); setIsInvoiceListModalOpen(false); }} onCreateNewInvoice={() => { setEditingInvoice(null); setIsCreateSalesInvoiceModalOpen(true); setIsInvoiceListModalOpen(false); }} onOpenEditInvoiceModal={handleOpenEditInvoiceModal} /> )}
      {isViewInvoiceModalOpen && viewingInvoice && ( <ViewInvoiceModal isOpen={isViewInvoiceModalOpen} onClose={() => { setIsViewInvoiceModalOpen(false); setViewingInvoice(null); }} invoice={viewingInvoice} persons={persons} companyProfiles={companyProfiles.filter(cp => !cp.isDeleted)} onRecordPayment={handleRecordInvoicePayment} currentUserName={currentUser?.name} /> )}
      {isManageCompanyProfilesModalOpen && currentUser && ( <ManageCompanyProfilesModal isOpen={isManageCompanyProfilesModalOpen} onClose={() => setIsManageCompanyProfilesModalOpen(false)} companyProfiles={companyProfiles} onAddProfile={handleSaveCompanyProfile} onUpdateProfile={handleUpdateCompanyProfile} onDeleteProfile={handleDeleteCompanyProfile} /> )}
      {isManageProductsModalOpen && currentUser && ( <ManageProductsModal isOpen={isManageProductsModalOpen} onClose={() => setIsManageProductsModalOpen(false)} products={products} currentUser={currentUser} onAddNewProductClick={handleOpenProductFormModalForAdd} onEditProductClick={handleOpenProductFormModalForEdit} onAddProduct={async (combinedData) => { const { initialStock, stockUnit, lowStockThreshold, ...productDetails } = combinedData; return handleSaveProduct(productDetails, { initialStock, stockUnit, lowStockThreshold });}} onUpdateProduct={async (id, updates) => { await handleSaveProduct(updates as any, undefined, id); }} onDeleteProduct={handleDeleteProduct} onRestoreProduct={handleRestoreProduct} onAdjustStock={async (productId, adj) => { if (!currentUser || !currentUser.id || currentUser.id === PREVIEW_USER_ID) return; const productToUpdate = products.find(p => p.id === productId); if (!productToUpdate) return; const now = new Date().toISOString(); const newStockLevel = (productToUpdate.currentStock || 0) + adj.quantityChange; const stockAdjustmentEntry: StockAdjustment = { id: `sh_${Date.now().toString()}_${Math.random().toString(36).substring(2,7)}`, date: now, type: adj.type, quantityChange: adj.quantityChange, newStockLevel: newStockLevel, notes: adj.notes, userId: currentUser.id, }; const updatedProduct: Product = { ...productToUpdate, currentStock: newStockLevel, stockHistory: [...(productToUpdate.stockHistory || []), stockAdjustmentEntry], lastModified: now, }; setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p)); await apiService.updateRecord('products', currentUser.id, { currentStock: updatedProduct.currentStock, stockHistory: JSON.stringify(updatedProduct.stockHistory), lastModified: updatedProduct.lastModified }, `id = '${productId}'`); }} onViewStockHistory={async (id) => { }} /> )}
      {isProductFormModalOpen && ( <ProductFormModal isOpen={isProductFormModalOpen} onClose={handleCloseProductFormModal} onSave={handleSaveProduct} initialData={editingProduct} isGlobalPhoneticModeActive={isGlobalPhoneticModeActive} /> )}
      {isManageBankAccountsModalOpen && currentUser && ( <ManageBankAccountsModal isOpen={isManageBankAccountsModalOpen} onClose={() => setIsManageBankAccountsModalOpen(false)} bankAccounts={bankAccounts} onOpenBankAccountForm={(acc) => acc ? handleOpenBankAccountFormModalForEdit(acc) : handleOpenBankAccountFormModalForAdd()} onDeleteBankAccount={handleDeleteBankAccount} onSetDefaultBankAccount={handleSetDefaultBankAccount} /> )}
      {isBankAccountFormModalOpen && currentUser && ( <BankAccountFormModal isOpen={isBankAccountFormModalOpen} onClose={handleCloseBankAccountFormModal} onSave={handleSaveBankAccount} initialData={editingBankAccount} /> )}
      {isChatModalOpen && chattingWithPerson && currentUser && ( <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} person={chattingWithPerson} currentUser={currentUser} messages={messages.filter(msg => msg.threadId === [currentUser.id, chattingWithPerson.systemUserId].sort().join('_'))} onSendMessage={async (content, recipient, image, audio) => { }} onReactToMessage={async (msgId, emoji) => { }} onDeleteMessage={async (msgId) => { }} /> )}
      {isInboxModalOpen && currentUser && ( <InboxModal isOpen={isInboxModalOpen} onClose={() => setIsInboxModalOpen(false)} currentUser={currentUser} persons={persons} messages={messages} onOpenChat={openChatForPerson} onOpenImageViewer={(imgContent) => imgContent && onOpenImageViewer(imgContent.base64Data, imgContent.fileName)} onDeleteChatHistory={async (person) => { }} /> )}
      {isImageViewerOpen && viewingImageDetails && ( <ImageViewerModal isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} imageUrl={viewingImageDetails.url} imageName={viewingImageDetails.name} /> )}
      {isVideoCallModalOpen && videoCallTargetPerson && currentUser && ( <VideoCallModal isOpen={isVideoCallModalOpen} onClose={() => setIsVideoCallModalOpen(false)} targetPerson={videoCallTargetPerson} currentUser={currentUser} /> )}
      {appError && ( <SimpleErrorModal isOpen={!!appError} onClose={() => setAppError(null)} message={appError} /> )}
      {isConfirmModalOpen && ( <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={async () => { await confirmModalProps.onConfirmAction(); setIsConfirmModalOpen(false); }} title={String(confirmModalProps.title)} message={confirmModalProps.message} confirmButtonText={confirmModalProps.confirmButtonText} confirmButtonColor={confirmModalProps.confirmButtonColor} /> )}
    </div>
  );
};
