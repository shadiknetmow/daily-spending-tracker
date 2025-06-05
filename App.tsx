
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Transaction, TransactionType, Debt, DebtType, DebtVersion, TransactionVersion, User, 
  Person, PersonVersion, PersonLedgerEntry, PersonLedgerEntryType, DebtFormSubmitData, 
  FormPurpose, AuthFormMode, BudgetCategory, Budget, BudgetPeriod, ProfileImageAction,
  Message, ImageMessageContent, AudioMessageContent, MessageVersion, MessageVersionSnapshot,
  UserSuggestion, SuggestionType, ExpenseFieldRequirements 
} from './types';
import { BN_UI_TEXT, LOCAL_STORAGE_KEYS, INCOME_DESCRIPTION_SUGGESTIONS_BN, EXPENSE_DESCRIPTION_SUGGESTIONS_BN, TRANSACTION_DESCRIPTION_SUGGESTIONS_BN } from './constants';
import Header from './components/Header';
import Summary from './components/Summary';
import { SimplifiedTransactionForm } from './components/SimplifiedTransactionForm';
import TransactionList from './components/TransactionList';
import AITipCard from './components/AITipCard';
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
import { ReportModal } from './components/ReportModal'; // Changed to named import
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


import * as apiService from './apiService'; 

export const App = (): JSX.Element => { 
  const { 
    currentUser, 
    logout: authLogout, 
    isAuthLoading: isAuthContextLoading, 
    authError: authContextError,
    clearAuthError           
  } = useAuth(); 
  const { addNotification } = useNotification(); 
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personLedgerEntries, setPersonLedgerEntries] = useState<PersonLedgerEntry[]>([]);
  const [userCustomSuggestions, setUserCustomSuggestions] = useState<UserSuggestion[]>([]); 
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
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


  const [isLoadingData, setIsLoadingData] = useState(false); 
  const [appError, setAppError] = useState<string | null>(null);

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
  const [isBudgetSetupModalOpen, setIsBudgetSetupModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false); 
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false); 
  
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
  const [confirmModalAction, setConfirmModalAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalButtonText, setConfirmModalButtonText] = useState<string | undefined>(undefined);
  const [confirmModalButtonColor, setConfirmModalButtonColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSE_FIELD_REQUIREMENTS, JSON.stringify(expenseFieldRequirements));
  }, [expenseFieldRequirements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.GLOBAL_PHONETIC_MODE, JSON.stringify(isGlobalPhoneticModeActive));
  }, [isGlobalPhoneticModeActive]);

  const handleToggleGlobalPhoneticMode = () => {
    setIsGlobalPhoneticModeActive(prev => {
      const newState = !prev;
      addNotification(
        newState ? BN_UI_TEXT.PHONETIC_BANGLA_ACTIVE : BN_UI_TEXT.PHONETIC_ENGLISH_ACTIVE,
        'info',
        2000
      );
      return newState;
    });
  };

  const handleSwitchAuthMode = (newMode: AuthFormMode, emailPayload?: string) => {
    clearAuthError();
    if (newMode === 'forgotPasswordReset' && emailPayload) {
        setEmailForPasswordReset(emailPayload);
    } else if (newMode !== 'forgotPasswordReset' && newMode !== 'forgotPasswordRequest') {
        setEmailForPasswordReset(undefined);
    }
    setAuthPageMode(newMode);
    setIsAuthModalOpen(true); 
  };
  
  const getAuthModalTitle = (mode: AuthFormMode): string => {
    switch(mode) {
      case 'login': return BN_UI_TEXT.LOGIN;
      case 'signup': return BN_UI_TEXT.SIGNUP;
      case 'forgotPasswordRequest':
      case 'forgotPasswordReset':
        return BN_UI_TEXT.FORGOT_PASSWORD_TITLE;
      default: return '';
    }
  };

  const handleUpdateExpenseFieldRequirements = (newRequirements: Partial<ExpenseFieldRequirements>) => {
    setExpenseFieldRequirements(prev => ({ ...prev, ...newRequirements }));
  };

  useEffect(() => {
    if (currentUser) {
      setIsAuthModalOpen(false); 
      setEmailForPasswordReset(undefined); 
    }
  }, [currentUser]);


  const openConfirmationModal = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => Promise<void>,
    buttonText?: string,
    buttonColor?: string
  ) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setConfirmModalAction(() => onConfirm);
    setConfirmModalButtonText(buttonText);
    setConfirmModalButtonColor(buttonColor);
    setIsConfirmModalOpen(true);
  }, []);


  const loadAppData = useCallback(async () => {
    if (currentUser && currentUser.id) { 
      const userIdForContext = currentUser.id;
      setIsLoadingData(true);
      setAppError(null); 
      console.log(`[loadAppData START] User: ${userIdForContext}`);
      try {
        const [
          fetchedTransactions,
          fetchedDebts,
          fetchedPersons,
          fetchedLedgerEntries,
          fetchedSuggestions,
          fetchedBudgetCategories,
          fetchedBudgets,
          fetchedMessages
        ] = await Promise.all([
          apiService.fetchRecords<Transaction>('transactions', userIdForContext, "1", true),
          apiService.fetchRecords<Debt>('debts', userIdForContext),
          apiService.fetchRecords<Person>('persons', userIdForContext, "1", true),
          apiService.fetchRecords<PersonLedgerEntry>('person_ledger_entries', userIdForContext),
          apiService.fetchUserSuggestions(userIdForContext), 
          apiService.fetchRecords<BudgetCategory>('budgetCategories', userIdForContext),
          apiService.fetchRecords<Budget>('budgets', userIdForContext),
          apiService.fetchRecords<Message>('messages', userIdForContext) 
        ]);
        
        console.log(`[loadAppData] Fetched for user ${userIdForContext}: ${fetchedTransactions.length} Tx, ${fetchedDebts.length} Debts, ${fetchedPersons.length} Persons, ${fetchedMessages.length} Msgs, ${fetchedSuggestions.length} Suggestions.`);
        
        setTransactions(fetchedTransactions);
        setDebts(fetchedDebts);
        setPersons(fetchedPersons);
        setPersonLedgerEntries(fetchedLedgerEntries);
        setUserCustomSuggestions(fetchedSuggestions);
        setBudgetCategories(fetchedBudgetCategories);
        setBudgets(fetchedBudgets);
        setMessages(fetchedMessages.map(m => ({...m, editHistory: m.editHistory || []}))); 

      } catch (error: any) {
        console.error("[loadAppData] Failed to load app data:", error); 
        setAppError(`তথ্য লোড করতে সমস্যা হয়েছে: ${error.message}. অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা পরে আবার চেষ্টা করুন।`);
        addNotification(BN_UI_TEXT.AUTH_ERROR_GENERAL, 'error');
      } finally {
        setIsLoadingData(false);
        console.log(`[loadAppData END] User: ${userIdForContext}. Loading data finished.`);
      }
    } else {
        console.log("[loadAppData] No current user, skipping data load.");
    }
  }, [currentUser, addNotification]);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadAppData();
    } else {
      setTransactions([]);
      setDebts([]);
      setPersons([]);
      setPersonLedgerEntries([]);
      setUserCustomSuggestions([]);
      setBudgetCategories([]);
      setBudgets([]);
      setMessages([]);
    }
  }, [currentUser, loadAppData]);

  
  const totalIncome = useMemo(() => 
    transactions.filter(t => t.type === TransactionType.INCOME && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === TransactionType.EXPENSE && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const totalReceivable = useMemo(() =>
    debts.filter(d => d.type === DebtType.RECEIVABLE && !d.isSettled).reduce((sum, d) => sum + d.remainingAmount, 0),
    [debts]
  );
  const totalPayable = useMemo(() =>
    debts.filter(d => d.type === DebtType.PAYABLE && !d.isSettled).reduce((sum, d) => sum + d.remainingAmount, 0),
    [debts]
  );

  const incomeSuggestions = useMemo(() => {
    const customIncomeTexts = userCustomSuggestions
        .filter(s => s.type === 'income')
        .map(s => s.text);
    const uniqueSuggestions = new Set([...customIncomeTexts, ...INCOME_DESCRIPTION_SUGGESTIONS_BN]);
    return Array.from(uniqueSuggestions).sort((a,b) => a.localeCompare(b, 'bn-BD'));
  }, [userCustomSuggestions]);

  const expenseSuggestions = useMemo(() => {
     const customExpenseTexts = userCustomSuggestions
        .filter(s => s.type === 'expense')
        .map(s => s.text);
    const uniqueSuggestions = new Set([...customExpenseTexts, ...EXPENSE_DESCRIPTION_SUGGESTIONS_BN]);
    return Array.from(uniqueSuggestions).sort((a,b) => a.localeCompare(b, 'bn-BD'));
  }, [userCustomSuggestions]);
  
  const combinedTransactionSuggestionsForEdit = useMemo(() => { 
    const uniqueTransactionDescs = new Set(transactions.map(t => t.description.split(" | ")[0].split(" [")[0])); 
    const allUserSuggestionTexts = userCustomSuggestions.map(s => s.text.split(" | ")[0]); 
    const allPredefinedSuggestionTexts = TRANSACTION_DESCRIPTION_SUGGESTIONS_BN.map(s => s.split(" | ")[0]); 

    const combinedUniqueStems = new Set([
      ...Array.from(uniqueTransactionDescs), 
      ...allUserSuggestionTexts, 
      ...allPredefinedSuggestionTexts
    ]);
    return Array.from(combinedUniqueStems).sort((a,b) => a.localeCompare(b, 'bn-BD'));
  }, [transactions, userCustomSuggestions]);
  
  const unreadMessagesCount = useMemo(() => {
    if (!currentUser || !messages || !currentUser.id) return 0;
    return messages.filter(msg =>
        msg.userId === currentUser.id && 
        msg.actualReceiverId === currentUser.id && 
        !msg.isRead && !msg.isDeleted 
      ).length;
  }, [currentUser, messages]);
  

  // Transaction Handlers
  const handleAddTransaction = async (transactionData: { description: string; amount: number; type: TransactionType; date: string }): Promise<boolean> => {
    if (!currentUser || !currentUser.id) return false;
    const userIdForContext = currentUser.id;
    const currentDateISO = transactionData.date || new Date().toISOString(); 

    const newTransactionBase: Omit<Transaction, 'editHistory'> = {
      id: 'txn_' + Date.now().toString() + Math.random().toString(36).substring(2, 9),
      date: currentDateISO,
      originalDate: currentDateISO,
      lastModified: currentDateISO,
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      userId: userIdForContext,
      isDeleted: false,
      deletedAt: undefined,
    };
    
    const snapshot: TransactionVersion['snapshot'] = {
      date: newTransactionBase.date,
      description: newTransactionBase.description,
      amount: newTransactionBase.amount,
      type: newTransactionBase.type,
      originalDate: newTransactionBase.originalDate,
      isDeleted: newTransactionBase.isDeleted,
    };

    const newTransaction: Transaction = {
      ...newTransactionBase,
      editHistory: [{
        timestamp: newTransactionBase.lastModified,
        action: 'created',
        userId: userIdForContext,
        snapshot: snapshot 
      }],
    };

    try {
      await apiService.insertRecord('transactions', userIdForContext, newTransaction);
      setTransactions(prev => [newTransaction, ...prev]);
      addNotification( (newTransaction.type === TransactionType.INCOME ? BN_UI_TEXT.INCOME : BN_UI_TEXT.EXPENSE) + " সফলভাবে যোগ করা হয়েছে।", 'success');
      if (newTransaction.type === TransactionType.INCOME) {
        setIsAddIncomeModalOpen(false);
      }
      // For EXPENSE, do not close the modal, allow form reset for next entry.
      // if (newTransaction.type === TransactionType.EXPENSE) setIsAddExpenseModalOpen(false);
      return true;
    } catch (error: any) {
      addNotification(`লেনদেন যোগ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
      return false;
    }
  };

  const handleOpenEditTransactionModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedTransaction = async (updatedTransactionData: Transaction) => {
    if (!currentUser || !currentUser.id || !editingTransaction) return;
    const userIdForContext = currentUser.id;
    const currentDate = new Date().toISOString();

    const { editHistory: oldEditHistory, ...originalTxnDataForSnapshot } = editingTransaction;

    const snapshot: TransactionVersion['snapshot'] = {
        date: updatedTransactionData.date,
        description: updatedTransactionData.description,
        amount: updatedTransactionData.amount,
        type: updatedTransactionData.type,
        originalDate: originalTxnDataForSnapshot.originalDate || originalTxnDataForSnapshot.date,
        linkedLedgerEntryId: updatedTransactionData.linkedLedgerEntryId,
        isDeleted: updatedTransactionData.isDeleted,
        deletedAt: updatedTransactionData.deletedAt
    };
    
    const transactionToSave: Transaction = {
      ...updatedTransactionData,
      lastModified: currentDate,
      editHistory: [
        ...(editingTransaction.editHistory || []), 
        {
          timestamp: currentDate,
          action: 'updated',
          userId: userIdForContext,
          snapshot: snapshot, 
        }
      ]
    };
    
    try {
      await apiService.updateRecord('transactions', userIdForContext, transactionToSave, `id = '${transactionToSave.id}'`);
      setTransactions(prev => prev.map(t => t.id === transactionToSave.id ? transactionToSave : t));
      addNotification(BN_UI_TEXT.TRANSACTION_UPDATED, 'success');
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      addNotification(`লেনদেন আপডেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;

    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;

    openConfirmationModal(
        BN_UI_TEXT.MODAL_TITLE_CONFIRM_DELETE,
        BN_UI_TEXT.CONFIRM_DELETE_MSG,
        async () => {
            const currentDate = new Date().toISOString();
            
            const snapshot: TransactionVersion['snapshot'] = {
                date: transactionToDelete.date,
                description: transactionToDelete.description,
                amount: transactionToDelete.amount,
                type: transactionToDelete.type,
                originalDate: transactionToDelete.originalDate,
                linkedLedgerEntryId: transactionToDelete.linkedLedgerEntryId,
                isDeleted: true, 
                deletedAt: currentDate,
            };

            const updatedTransaction: Transaction = {
                ...transactionToDelete,
                isDeleted: true,
                deletedAt: currentDate,
                lastModified: currentDate,
                editHistory: [
                    ...(transactionToDelete.editHistory || []),
                    {
                        timestamp: currentDate,
                        action: 'deleted',
                        userId: userIdForContext,
                        snapshot: snapshot
                    }
                ]
            };
            try {
                await apiService.updateRecord('transactions', userIdForContext, updatedTransaction, `id = '${id}'`);
                setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
                addNotification(BN_UI_TEXT.ITEM_DELETED, 'success');
            } catch (error: any) {
                addNotification(`লেনদেন সরাতে সমস্যা হয়েছে: ${error.message}`, 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };
  
  const handleRestoreTransaction = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;

    const transactionToRestore = transactions.find(t => t.id === id);
    if (!transactionToRestore) return;

    openConfirmationModal(
        BN_UI_TEXT.RESTORE_ITEM_TOOLTIP,
        BN_UI_TEXT.CONFIRM_RESTORE_TRANSACTION_MSG,
        async () => {
            const currentDate = new Date().toISOString();
            const snapshot: TransactionVersion['snapshot'] = {
                date: transactionToRestore.date,
                description: transactionToRestore.description,
                amount: transactionToRestore.amount,
                type: transactionToRestore.type,
                originalDate: transactionToRestore.originalDate,
                linkedLedgerEntryId: transactionToRestore.linkedLedgerEntryId,
                isDeleted: false, 
                deletedAt: undefined, 
            };
            const restoredTransaction: Transaction = {
                ...transactionToRestore,
                isDeleted: false,
                deletedAt: undefined,
                lastModified: currentDate,
                editHistory: [
                    ...(transactionToRestore.editHistory || []),
                    {
                        timestamp: currentDate,
                        action: 'restored',
                        userId: userIdForContext,
                        snapshot: snapshot
                    }
                ]
            };
            try {
                await apiService.updateRecord('transactions', userIdForContext, restoredTransaction, `id = '${id}'`);
                setTransactions(prev => prev.map(t => t.id === id ? restoredTransaction : t));
                addNotification(BN_UI_TEXT.ITEM_RESTORED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(`লেনদেন পুনরুদ্ধার করতে সমস্যা হয়েছে: ${error.message}`, 'error');
            }
             setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_RESTORE,
        "bg-green-600 hover:bg-green-700 focus:ring-green-500"
    );
  };

  const handleViewTransactionHistory = (transaction: Transaction) => {
    setViewingTransactionEditHistoryFor(transaction);
    setIsTransactionEditHistoryModalOpen(true);
  };
  
  // Person Handler
  const handleSavePerson = async (
    personData: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'>,
    existingPersonId?: string,
    isImplicitAdd: boolean = false, 
    forSelectionContext: boolean = false 
  ): Promise<Person | null> => {
    if (!currentUser || !currentUser.id) return null;
    const userIdForContext = currentUser.id;
    const currentDate = new Date().toISOString();

    let profileImageAction: ProfileImageAction = 'none';
    if (existingPersonId) {
        const originalPerson = persons.find(p => p.id === existingPersonId);
        if (personData.profileImage && !originalPerson?.profileImage) profileImageAction = 'added';
        else if (personData.profileImage && originalPerson?.profileImage && personData.profileImage !== originalPerson.profileImage) profileImageAction = 'updated';
        else if (!personData.profileImage && originalPerson?.profileImage) profileImageAction = 'removed';
    } else if (personData.profileImage) {
        profileImageAction = 'added';
    }

    const snapshot: PersonVersion['snapshot'] = {
      name: personData.name,
      customAlias: personData.customAlias || '',
      mobileNumber: personData.mobileNumber || '',
      address: personData.address || '',
      shopName: personData.shopName || '',
      email: personData.email || '',
      profileImageAction: profileImageAction,
      isDeleted: personData.isDeleted || false, 
      deletedAt: personData.deletedAt || undefined,
      systemUserId: personData.systemUserId || undefined,
    };

    if (existingPersonId) {
      const originalPerson = persons.find(p => p.id === existingPersonId);
      if (!originalPerson) {
        addNotification("সম্পাদনার জন্য ব্যক্তি খুঁজে পাওয়া যায়নি।", "error");
        return null;
      }
      const updatedPerson: Person = {
        ...originalPerson,
        ...personData, 
        lastModified: currentDate,
        userId: userIdForContext, 
        editHistory: [
          ...(originalPerson.editHistory || []),
          { timestamp: currentDate, action: 'updated', userId: userIdForContext, snapshot }
        ],
      };
      try {
        await apiService.updateRecord('persons', userIdForContext, updatedPerson, `id = '${existingPersonId}'`);
        setPersons(prev => prev.map(p => p.id === existingPersonId ? updatedPerson : p));
        addNotification(BN_UI_TEXT.PERSON_UPDATED_SUCCESS, 'success');
        setIsPersonFormModalOpen(false);
        setEditingPerson(null);
        return updatedPerson;
      } catch (error: any) {
        addNotification(`ব্যক্তির তথ্য আপডেট করতে সমস্যা: ${error.message}`, 'error');
        return null;
      }
    } else {
      const newPersonId = 'person_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newPerson: Person = {
        id: newPersonId,
        userId: userIdForContext,
        ...personData,
        createdAt: currentDate,
        lastModified: currentDate,
        editHistory: [{ timestamp: currentDate, action: 'created', userId: userIdForContext, snapshot }],
        isDeleted: false,
      };
      try {
        await apiService.insertRecord('persons', userIdForContext, newPerson);
        setPersons(prev => [newPerson, ...prev]);
        if (!isImplicitAdd) { 
            addNotification(BN_UI_TEXT.PERSON_ADDED_SUCCESS, 'success');
        }
        setIsPersonFormModalOpen(false);
        
        if (forSelectionContext && activePersonSelectionCallback) {
            activePersonSelectionCallback(newPerson.id);
            setActivePersonSelectionCallback(null); 
            setIsAddingPersonForSelectionContext(false); 
        }
        return newPerson;
      } catch (error: any) {
        addNotification(`নতুন ব্যক্তি যোগ করতে সমস্যা: ${error.message}`, 'error');
        return null;
      }
    }
  };

  // Ledger Entry Handler
  const handleAddPersonLedgerEntry = async (data: {
    personId: string;
    type: PersonLedgerEntryType;
    amount: number;
    description: string;
    date: string; 
  }): Promise<PersonLedgerEntry | null> => {
    if (!currentUser || !currentUser.id) return null;
    const userIdForContext = currentUser.id;

    const personSpecificEntries = personLedgerEntries
      .filter(entry => entry.personId === data.personId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));
    
    let lastBalance = 0;
    if (personSpecificEntries.length > 0) {
      lastBalance = personSpecificEntries[personSpecificEntries.length - 1].balanceAfterEntry;
    }

    const currentEntryEffect = data.type === PersonLedgerEntryType.CREDIT ? data.amount : -data.amount;
    const balanceAfterThisEntry = lastBalance + currentEntryEffect;

    const newEntry: PersonLedgerEntry = {
      id: 'ple_' + Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: userIdForContext,
      personId: data.personId,
      date: data.date,
      type: data.type,
      amount: data.amount,
      description: data.description,
      balanceAfterEntry: balanceAfterThisEntry,
    };

    try {
      await apiService.insertRecord('person_ledger_entries', userIdForContext, newEntry);
      setPersonLedgerEntries(prev => [...prev, newEntry]);
      addNotification(BN_UI_TEXT.LEDGER_ENTRY_ADDED_SUCCESS, 'success');
      
      const personName = persons.find(p => p.id === data.personId)?.name || BN_UI_TEXT.UNKNOWN_PERSON;
      let transactionDesc = '';
      let transactionType: TransactionType | null = null;

      if (data.type === PersonLedgerEntryType.CREDIT) {
        transactionDesc = BN_UI_TEXT.LEDGER_CREDIT_INCOME_DESC
            .replace("{personName}", personName)
            .replace("{description}", data.description);
        transactionType = TransactionType.INCOME;
      } else { 
         transactionDesc = BN_UI_TEXT.LEDGER_DEBIT_EXPENSE_DESC
            .replace("{personName}", personName)
            .replace("{description}", data.description);
         transactionType = TransactionType.EXPENSE;
      }

      if (transactionType) {
        const transactionDataForLedger = {
            description: transactionDesc,
            amount: data.amount,
            type: transactionType,
            date: data.date,
        };
        await handleAddTransaction(transactionDataForLedger); 
      }
      return newEntry;
    } catch (error: any) {
      addNotification(`খতিয়ান এন্ট্রি যোগ করতে সমস্যা: ${error.message}`, 'error');
      return null;
    }
  };


  // Debt Handlers
  const handleAddOrUpdateDebtEntry = async (debtFormData: DebtFormSubmitData, originalDebtId?: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;
    const currentDate = new Date().toISOString();

    const { personNameValue, explicitSelectedPersonId, amount, description, formPurpose, debtType, dueDate, paymentDate } = debtFormData;
    let personId = explicitSelectedPersonId;

    if (!personId) { 
      const existingPerson = persons.find(p => p.name.toLowerCase() === personNameValue.toLowerCase() && !p.isDeleted);
      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const newPersonData: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'> = { 
            name: personNameValue 
        };
        const addedPerson = await handleSavePerson(newPersonData, undefined, true); 
        if (addedPerson) {
          personId = addedPerson.id;
          addNotification(
            (formPurpose === FormPurpose.CREATE_PAYABLE || formPurpose === FormPurpose.CREATE_RECEIVABLE) 
              ? BN_UI_TEXT.PERSON_ADDED_IMPLICITLY_DEBT.replace("{personName}", personNameValue)
              : BN_UI_TEXT.PERSON_ADDED_IMPLICITLY_FOR_ENTRY.replace("{personName}", personNameValue),
            'info',
            6000
          );
        } else {
          addNotification("নতুন ব্যক্তি যোগ করতে সমস্যা হয়েছে।", 'error');
          return;
        }
      }
    }

    if (!personId) {
        addNotification("ব্যক্তির আইডি নির্ধারণ করা যায়নি।", 'error');
        return;
    }

    if (formPurpose === FormPurpose.RECORD_PERSON_PAYMENT || formPurpose === FormPurpose.RECORD_USER_PAYMENT_TO_PERSON) {
      if (!paymentDate) {
        addNotification(BN_UI_TEXT.DEBT_FORM_ALERT_PAYMENT_DATE_REQUIRED, 'error');
        return;
      }
      
      const relevantDebts = debts.filter(d => d.personId === personId && !d.isSettled &&
        (formPurpose === FormPurpose.RECORD_PERSON_PAYMENT ? d.type === DebtType.RECEIVABLE : d.type === DebtType.PAYABLE))
        .sort((a,b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()); 

      let remainingPaymentAmount = amount;
      for (const debt of relevantDebts) {
        if (remainingPaymentAmount <= 0) break;
        
        const paymentForThisDebt = Math.min(remainingPaymentAmount, debt.remainingAmount);
        const newRemainingAmountForDebt = debt.remainingAmount - paymentForThisDebt;
        const isNowSettled = newRemainingAmountForDebt <= 0;
        const settledDateForSnapshot = isNowSettled ? paymentDate : undefined;

        const snapshotForLedgerDebtUpdate: DebtVersion['snapshot'] = {
            personId: debt.personId,
            originalAmount: debt.originalAmount,
            remainingAmount: newRemainingAmountForDebt,
            description: `${debt.description} ${BN_UI_TEXT.DEBT_HISTORY_PAID_BY_LEDGER_CREDIT.replace("{amount}", paymentForThisDebt.toString())}`.trim(),
            type: debt.type,
            dueDate: debt.dueDate,
            isSettled: isNowSettled,
            creationDate: debt.creationDate,
            settledDate: settledDateForSnapshot,
        };

        const updatedDebt: Debt = {
          ...debt,
          remainingAmount: newRemainingAmountForDebt,
          isSettled: isNowSettled,
          settledDate: settledDateForSnapshot,
          lastModified: currentDate,
          editHistory: [
            ...(debt.editHistory || []),
            {
              timestamp: currentDate,
              action: 'updated',
              userId: userIdForContext,
              snapshot: snapshotForLedgerDebtUpdate
            }
          ]
        };
        try {
            await apiService.updateRecord('debts', userIdForContext, updatedDebt, `id = '${updatedDebt.id}'`);
            setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
            remainingPaymentAmount -= paymentForThisDebt;
        } catch (error: any) {
            addNotification(`সম্পর্কিত দেনা/পাওনা আপডেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        }
      }

      const ledgerEntryType = formPurpose === FormPurpose.RECORD_PERSON_PAYMENT ? PersonLedgerEntryType.CREDIT : PersonLedgerEntryType.DEBIT;
      await handleAddPersonLedgerEntry({
        personId: personId,
        type: ledgerEntryType,
        amount: amount,
        description: description,
        date: paymentDate
      });
      
      addNotification(
        formPurpose === FormPurpose.RECORD_PERSON_PAYMENT ? BN_UI_TEXT.LEDGER_ENTRY_FROM_DEBT_FORM_SUCCESS : BN_UI_TEXT.LEDGER_ENTRY_USER_PAYMENT_SUCCESS,
        'success'
      );
      setIsAddDebtModalOpen(false);

    } else { 
      if (!debtType) {
        addNotification("দেনা/পাওনার ধরণ নির্ধারণ করা যায়নি।", 'error');
        return;
      }
      
      if (originalDebtId) { 
        const existingDebt = debts.find(d => d.id === originalDebtId);
        if (!existingDebt) {
          addNotification("সম্পাদনার জন্য দেনা/পাওনা খুঁজে পাওয়া যায়নি।", 'error');
          return;
        }
        const newRemainingAmount = existingDebt.isSettled ? 0 : amount; 

        const snapshotForDebtUpdate: DebtVersion['snapshot'] = {
            personId: personId,
            originalAmount: amount,
            remainingAmount: newRemainingAmount,
            description: description,
            type: debtType,
            dueDate: dueDate || undefined,
            isSettled: existingDebt.isSettled, 
            creationDate: existingDebt.creationDate, 
            settledDate: existingDebt.settledDate, 
        };

        const updatedDebt: Debt = {
            ...existingDebt,
            personId: personId, 
            originalAmount: amount,
            remainingAmount: newRemainingAmount, 
            description: description,
            type: debtType,
            dueDate: dueDate || undefined,
            lastModified: currentDate,
            editHistory: [
              ...(existingDebt.editHistory || []),
              {
                timestamp: currentDate,
                action: 'updated',
                userId: userIdForContext,
                snapshot: snapshotForDebtUpdate
              }
            ]
        };
        try {
            await apiService.updateRecord('debts', userIdForContext, updatedDebt, `id = '${updatedDebt.id}'`);
            setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
            addNotification(BN_UI_TEXT.DEBT_UPDATED, 'success');
            setIsEditDebtModalOpen(false);
            setEditingDebt(null);
        } catch (error: any) {
            addNotification(`দেনা/পাওনা আপডেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        }
      } else { // Adding new debt
         const newDebtId = 'debt_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
         const snapshotForNewDebt: DebtVersion['snapshot'] = {
            personId: personId,
            originalAmount: amount,
            remainingAmount: amount,
            description: description,
            type: debtType,
            dueDate: dueDate || undefined,
            isSettled: false,
            creationDate: currentDate,
         };
         const newDebt: Debt = {
            id: newDebtId,
            userId: userIdForContext,
            personId: personId,
            originalAmount: amount,
            remainingAmount: amount,
            description: description,
            type: debtType,
            dueDate: dueDate || undefined,
            isSettled: false,
            creationDate: currentDate,
            lastModified: currentDate,
            editHistory: [{
              timestamp: currentDate,
              action: 'created',
              userId: userIdForContext,
              snapshot: snapshotForNewDebt
            }]
         };
        try {
            await apiService.insertRecord('debts', userIdForContext, newDebt);
            setDebts(prev => [newDebt, ...prev]);
            addNotification(BN_UI_TEXT.DEBT_ADDED, 'success');
            setIsAddDebtModalOpen(false);
        } catch (error: any) {
            addNotification(`নতুন দেনা/পাওনা যোগ করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        }
      }
    }
  };

  const handleOpenAddIncomeModal = () => {
    setIsAddIncomeModalOpen(true);
  };

  const handleOpenAddExpenseModal = () => {
    setIsAddExpenseModalOpen(true);
  };


  const handleToggleSettleDebt = async (debtId: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;
    const debtToToggle = debts.find(d => d.id === debtId);
    if (!debtToToggle) return;

    const isNowSettled = !debtToToggle.isSettled;
    const currentDate = new Date().toISOString();
    
    const snapshot: DebtVersion['snapshot'] = {
        personId: debtToToggle.personId,
        originalAmount: debtToToggle.originalAmount,
        remainingAmount: isNowSettled ? 0 : debtToToggle.originalAmount, 
        description: debtToToggle.description,
        type: debtToToggle.type,
        dueDate: debtToToggle.dueDate,
        isSettled: isNowSettled,
        creationDate: debtToToggle.creationDate,
        settledDate: isNowSettled ? currentDate : undefined,
    };

    const updatedDebt: Debt = {
      ...debtToToggle,
      isSettled: isNowSettled,
      remainingAmount: isNowSettled ? 0 : debtToToggle.originalAmount, 
      settledDate: isNowSettled ? currentDate : undefined,
      lastModified: currentDate,
      editHistory: [
        ...(debtToToggle.editHistory || []),
        {
          timestamp: currentDate,
          action: 'updated',
          userId: userIdForContext,
          snapshot: snapshot
        }
      ]
    };

    try {
        await apiService.updateRecord('debts', userIdForContext, updatedDebt, `id = '${debtId}'`);
        setDebts(prev => prev.map(d => d.id === debtId ? updatedDebt : d));
        addNotification(BN_UI_TEXT.DEBT_UPDATED, 'success');

        if (isNowSettled) {
            const person = persons.find(p => p.id === debtToToggle.personId);
            const personName = person ? person.name : BN_UI_TEXT.UNKNOWN_PERSON;
            let transactionDesc = '';
            let transactionType: TransactionType;

            if (debtToToggle.type === DebtType.RECEIVABLE) {
                transactionDesc = BN_UI_TEXT.DEBT_SETTLED_INCOME_DESC
                .replace("{personName}", personName)
                .replace("{description}", debtToToggle.description);
                transactionType = TransactionType.INCOME;
            } else {
                transactionDesc = BN_UI_TEXT.DEBT_SETTLED_EXPENSE_DESC
                .replace("{personName}", personName)
                .replace("{description}", debtToToggle.description);
                transactionType = TransactionType.EXPENSE;
            }
            
            const transactionDataForDebtSettle = {
                description: transactionDesc,
                amount: debtToToggle.originalAmount, 
                type: transactionType,
                date: currentDate, 
            };
            await handleAddTransaction(transactionDataForDebtSettle);
        }
    } catch (error: any) {
        addNotification(`দেনা/পাওনা আপডেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;
    openConfirmationModal(
      BN_UI_TEXT.DELETE_DEBT_TOOLTIP,
      BN_UI_TEXT.CONFIRM_DELETE_DEBT_MSG,
      async () => {
        try {
          await apiService.deleteRecord('debts', userIdForContext, `id = '${id}'`);
          setDebts(prev => prev.filter(d => d.id !== id));
          addNotification(BN_UI_TEXT.DEBT_DELETED, 'success');
        } catch (error: any) {
          addNotification(`দেনা/পাওনা মুছতে সমস্যা হয়েছে: ${error.message}`, 'error');
        }
        setIsConfirmModalOpen(false);
      },
      BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
      "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };

  const handleViewDebtHistory = (debt: Debt) => {
    setViewingDebtEditHistoryFor(debt);
    setIsDebtEditHistoryModalOpen(true);
  };

  const handleOpenEditDebtModal = (debt: Debt) => {
    setEditingDebt(debt);
    setIsEditDebtModalOpen(true);
  };

  const handleOpenManagePersonsModal = () => {
    setIsManagePersonsModalOpen(true);
  };
  
  const handleOpenPersonFormModal = (personToEdit?: Person) => {
    setEditingPerson(personToEdit || null);
    setIsPersonFormModalOpen(true);
    setIsManagePersonsModalOpen(false); 
  };

  const handleClosePersonFormModal = () => {
    setIsPersonFormModalOpen(false);
    setEditingPerson(null);
    if(isAddingPersonForSelectionContext) {
        setIsSelectPersonModalOpen(true); 
        setIsAddingPersonForSelectionContext(false);
    } else {
        setIsManagePersonsModalOpen(true); 
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;

    const personToDelete = persons.find(p => p.id === personId);
    if (!personToDelete) return;

    openConfirmationModal(
        BN_UI_TEXT.DELETE_PERSON_BTN_LABEL,
        BN_UI_TEXT.CONFIRM_DELETE_PERSON_MSG,
        async () => {
            const currentDate = new Date().toISOString();
            const snapshot: PersonVersion['snapshot'] = {
              name: personToDelete.name,
              mobileNumber: personToDelete.mobileNumber,
              address: personToDelete.address,
              shopName: personToDelete.shopName,
              email: personToDelete.email,
              profileImageAction: personToDelete.profileImage ? 'removed' : 'none',
              isDeleted: true,
              deletedAt: currentDate,
              systemUserId: personToDelete.systemUserId,
              customAlias: personToDelete.customAlias,
            };

            const updatedPerson: Person = {
              ...personToDelete,
              isDeleted: true,
              deletedAt: currentDate,
              profileImage: undefined, // Remove profile image on soft delete
              lastModified: currentDate,
              editHistory: [
                ...(personToDelete.editHistory || []),
                {
                  timestamp: currentDate,
                  action: 'deleted',
                  userId: userIdForContext,
                  snapshot: snapshot
                }
              ]
            };
            try {
                await apiService.updateRecord('persons', userIdForContext, updatedPerson, `id = '${personId}'`);
                setPersons(prev => prev.map(p => p.id === personId ? updatedPerson : p));
                addNotification(BN_UI_TEXT.PERSON_DELETED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(`ব্যক্তিকে সরাতে সমস্যা হয়েছে: ${error.message}`, 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };
  
  const handleRestorePerson = async (personId: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;

    const personToRestore = persons.find(p => p.id === personId);
    if (!personToRestore) return;
    
    openConfirmationModal(
        BN_UI_TEXT.RESTORE_ITEM_TOOLTIP,
        BN_UI_TEXT.CONFIRM_RESTORE_PERSON_MSG,
        async () => {
            const currentDate = new Date().toISOString();
            const snapshot: PersonVersion['snapshot'] = {
                name: personToRestore.name,
                mobileNumber: personToRestore.mobileNumber,
                address: personToRestore.address,
                shopName: personToRestore.shopName,
                email: personToRestore.email,
                profileImageAction: 'none', 
                isDeleted: false,
                deletedAt: undefined,
                systemUserId: personToRestore.systemUserId,
                customAlias: personToRestore.customAlias,
            };
            const restoredPerson: Person = {
              ...personToRestore,
              isDeleted: false,
              deletedAt: undefined,
              lastModified: currentDate,
              editHistory: [
                ...(personToRestore.editHistory || []),
                {
                  timestamp: currentDate,
                  action: 'restored',
                  userId: userIdForContext,
                  snapshot: snapshot
                }
              ]
            };
            try {
                await apiService.updateRecord('persons', userIdForContext, restoredPerson, `id = '${personId}'`);
                setPersons(prev => prev.map(p => p.id === personId ? restoredPerson : p));
                addNotification(BN_UI_TEXT.PERSON_RESTORED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(`ব্যক্তিকে পুনরুদ্ধার করতে সমস্যা হয়েছে: ${error.message}`, 'error');
            }
             setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_RESTORE,
        "bg-green-600 hover:bg-green-700 focus:ring-green-500"
    );
  };


  const handleViewPersonHistory = (person: Person) => {
    setViewingPersonHistoryFor(person);
    setIsPersonHistoryModalOpen(true);
  };

  const handleOpenSelectPersonModal = (callback: (personId: string) => void) => {
    setActivePersonSelectionCallback(() => callback);
    setIsSelectPersonModalOpen(true);
  };

  const handleOpenPersonFormForSelectionContext = () => {
    setIsSelectPersonModalOpen(false); 
    setIsAddingPersonForSelectionContext(true); 
    handleOpenPersonFormModal(); 
  };

  const getPersonNetDebtBalance = (personId: string): number => {
    let netBalance = 0;
    debts.forEach(debt => {
      if (debt.personId === personId && !debt.isSettled) {
        if (debt.type === DebtType.RECEIVABLE) {
          netBalance += debt.remainingAmount;
        } else {
          netBalance -= debt.remainingAmount;
        }
      }
    });
    return netBalance;
  };

  const getPersonNetLedgerBalance = (personId: string): number => {
    const personEntries = personLedgerEntries.filter(e => e.personId === personId);
    if (personEntries.length === 0) return 0;
    
    const lastEntry = personEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id) )[0];
    return lastEntry.balanceAfterEntry;
  };
  
  const getCompositePersonBalance = (personId: string): number => {
    const netDebt = getPersonNetDebtBalance(personId);
    const netLedger = getPersonNetLedgerBalance(personId);
    return netDebt + netLedger; 
  };

  const handleViewPersonDebtsHistory = (person: Person) => {
    setViewingPersonForDebtsHistory(person);
    setIsPersonDebtsHistoryModalOpen(true);
  };

  const handleOpenPersonLedgerHistory = (person: Person) => {
    setSelectedPersonForLedger(person);
    setIsPersonLedgerHistoryModalOpen(true);
  };

  const handleOpenAddLedgerEntryModal = (person: Person) => {
    setSelectedPersonForLedger(person);
    setIsPersonLedgerHistoryModalOpen(false); 
    setIsAddLedgerEntryModalOpen(true);
  };

  const handleDeleteLedgerEntry = async (entryId: string, personIdOfEntry: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;
    try {
      await apiService.deleteRecord('person_ledger_entries', userIdForContext, `id = '${entryId}'`);
      
      const deletedEntry = personLedgerEntries.find(e => e.id === entryId);
      const remainingEntriesForPerson = personLedgerEntries.filter(e => e.personId === personIdOfEntry && e.id !== entryId)
                                          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));
      
      let lastBalanceBeforeDeleted = 0;
      const entriesBeforeDeleted = personLedgerEntries
                                  .filter(e => e.personId === personIdOfEntry && new Date(e.date).getTime() < new Date(deletedEntry!.date).getTime())
                                  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));
      if (entriesBeforeDeleted.length > 0) {
          lastBalanceBeforeDeleted = entriesBeforeDeleted[entriesBeforeDeleted.length-1].balanceAfterEntry;
      }
      
      const updatedEntriesAfterDelete: PersonLedgerEntry[] = [];
      let currentBalance = lastBalanceBeforeDeleted;
      
      for (const entry of remainingEntriesForPerson) {
          if (new Date(entry.date).getTime() >= new Date(deletedEntry!.date).getTime()) {
              currentBalance += entry.type === PersonLedgerEntryType.CREDIT ? entry.amount : -entry.amount;
              const updatedEntry = { ...entry, balanceAfterEntry: currentBalance };
              updatedEntriesAfterDelete.push(updatedEntry);
              await apiService.updateRecord('person_ledger_entries', userIdForContext, updatedEntry, `id = '${entry.id}'`);
          } else {
             updatedEntriesAfterDelete.push(entry); // Keep entries before the deleted one as is for this list
          }
      }
      
      setPersonLedgerEntries(prev => 
          prev.filter(e => e.id !== entryId) // Remove deleted
              .map(e => updatedEntriesAfterDelete.find(upd => upd.id === e.id) || e) // Replace with updated
      );
      addNotification(BN_UI_TEXT.LEDGER_ENTRY_DELETED_SUCCESS, 'success');
      
      if(deletedEntry) {
        const personName = persons.find(p => p.id === personIdOfEntry)?.name || BN_UI_TEXT.UNKNOWN_PERSON;
        let transactionDescToFind = '';
        if (deletedEntry.type === PersonLedgerEntryType.CREDIT) {
            transactionDescToFind = BN_UI_TEXT.LEDGER_CREDIT_INCOME_DESC
                .replace("{personName}", personName)
                .replace("{description}", deletedEntry.description);
        } else {
             transactionDescToFind = BN_UI_TEXT.LEDGER_DEBIT_EXPENSE_DESC
                .replace("{personName}", personName)
                .replace("{description}", deletedEntry.description);
        }
        const linkedTransaction = transactions.find(t => t.description === transactionDescToFind && t.amount === deletedEntry.amount && new Date(t.date).toISOString().split('T')[0] === new Date(deletedEntry.date).toISOString().split('T')[0] && !t.isDeleted);
        if(linkedTransaction) {
            await handleDeleteTransaction(linkedTransaction.id);
        }
      }

    } catch (error: any) {
      addNotification(`খতিয়ান এন্ট্রি মুছতে সমস্যা: ${error.message}`, 'error');
    }
  };

  const handleOpenPersonFinancialOverview = (person: Person) => {
    setViewingPersonForOverview(person);
    setIsPersonFinancialOverviewModalOpen(true);
  };
  
  const receivablePersonsData = useMemo(() => {
    const map = new Map<string, ReceivablePersonData>();
    persons.forEach(person => {
      if (!person.isDeleted) {
        const netDebt = getCompositePersonBalance(person.id);
        if (netDebt > 0) { 
          map.set(person.id, {
            personId: person.id,
            personName: person.customAlias || person.name,
            personMobile: person.mobileNumber,
            totalReceivableAmount: netDebt,
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalReceivableAmount - a.totalReceivableAmount);
  }, [persons, debts, personLedgerEntries, getCompositePersonBalance]); 


  const payablePersonsData = useMemo(() => {
    const map = new Map<string, PayablePersonData>();
    persons.forEach(person => {
      if (!person.isDeleted) {
        const netDebt = getCompositePersonBalance(person.id);
        if (netDebt < 0) { 
          map.set(person.id, {
            personId: person.id,
            personName: person.customAlias || person.name,
            personMobile: person.mobileNumber,
            totalPayableAmount: Math.abs(netDebt), 
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalPayableAmount - a.totalPayableAmount);
  }, [persons, debts, personLedgerEntries, getCompositePersonBalance]);
  

  const handleOpenReportModal = () => setIsReportModalOpen(true);

  const handleLogout = () => {
    authLogout(); 
  };
  
  const handleResetAppData = () => {
    openConfirmationModal(
      BN_UI_TEXT.RESET_APP_DATA_BTN,
      BN_UI_TEXT.CONFIRM_RESET_APP_DATA_MSG,
      async () => {
        try {
          await apiService.makeApiRequest({ method: 'resetDatabase' });
          addNotification(BN_UI_TEXT.APP_DATA_RESET_SUCCESS, 'success', 5000);
          setTimeout(() => window.location.reload(), 3000); 
        } catch (error: any) {
          addNotification(`অ্যাপ ডেটা রিসেট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
        }
        setIsConfirmModalOpen(false);
      },
      BN_UI_TEXT.RESET_APP_DATA_BTN,
      "bg-red-700 hover:bg-red-800 focus:ring-red-600"
    );
  };

  const handleUserDetailsImportedForPersonForm = (details: ImportedUserDetails) => {
    if (!currentUser) return;
    openConfirmationModal(
        BN_UI_TEXT.CONFIRM_SAVE_IMPORTED_PERSON.replace("{USER_NAME}", details.name).replace("{USER_EMAIL}", details.email || 'N/A'),
        `"${details.name}" (${details.mobileNumber}) নামের এই ব্যবহারকারীকে আপনার তালিকায় যোগ করতে চান?`,
        async () => {
            const personDataToSave: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'> = {
                name: details.name,
                mobileNumber: details.mobileNumber,
                email: details.email || undefined,
                profileImage: details.profileImage || undefined,
                systemUserId: details.systemUserId, 
            };
            await handleSavePerson(personDataToSave, undefined, false, isAddingPersonForSelectionContext);
            addNotification(BN_UI_TEXT.PERSON_SAVED_AFTER_IMPORT, "success");
            setIsConfirmModalOpen(false);
            if(isAddingPersonForSelectionContext) {
              setIsPersonFormModalOpen(false); 
            }
        },
        BN_UI_TEXT.SAVE_CHANGES,
        "bg-green-600 hover:bg-green-700 focus:ring-green-500"
    );
  };

  const handleUserSuggestionAdded = async (text: string, type: SuggestionType) => {
    if (!currentUser || !currentUser.id) return;
    const newSuggestionId = 'sugg_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newSuggestion: UserSuggestion = { id: newSuggestionId, userId: currentUser.id, text, type };
    
    try {
        await apiService.addUserSuggestion(currentUser.id, newSuggestion);
        setUserCustomSuggestions(prev => [...prev, newSuggestion].sort((a,b) => a.text.localeCompare(b.text, 'bn-BD')));
        addNotification(BN_UI_TEXT.SUGGESTION_ADDED_SUCCESS, 'success');
    } catch (error: any) {
        addNotification(error.message || BN_UI_TEXT.SUGGESTION_EXISTS_ERROR, 'error');
    }
  };

  const handleUserSuggestionEdited = async (id: string, newText: string) => {
    if (!currentUser || !currentUser.id) return;
    try {
        await apiService.updateUserSuggestion(currentUser.id, id, newText);
        setUserCustomSuggestions(prev => 
            prev.map(s => s.id === id ? { ...s, text: newText } : s).sort((a,b) => a.text.localeCompare(b.text, 'bn-BD'))
        );
        addNotification(BN_UI_TEXT.SUGGESTION_UPDATED_SUCCESS, 'success');
    } catch (error: any) {
        addNotification(error.message || "পরামর্শ আপডেট করতে সমস্যা হয়েছে।", 'error');
    }
  };

  const handleUserSuggestionDeleted = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    openConfirmationModal(
        BN_UI_TEXT.DELETE_SUGGESTION_TOOLTIP,
        BN_UI_TEXT.CONFIRM_DELETE_SUGGESTION_MSG,
        async () => {
            try {
                await apiService.deleteUserSuggestion(currentUser.id, id);
                setUserCustomSuggestions(prev => prev.filter(s => s.id !== id));
                addNotification(BN_UI_TEXT.SUGGESTION_DELETED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(error.message || "পরামর্শ মুছতে সমস্যা হয়েছে।", 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };
  

  // Budgeting Handlers
  const handleAddBudgetCategory = async (name: string, associatedSuggestions: string[]) => {
    if (!currentUser || !currentUser.id) return;
    const newCategory: BudgetCategory = {
      id: 'cat_' + Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      name,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      associatedSuggestions
    };
    try {
      await apiService.insertRecord('budgetCategories', currentUser.id, newCategory);
      setBudgetCategories(prev => [...prev, newCategory]);
      addNotification(BN_UI_TEXT.BUDGET_CATEGORY_ADDED_SUCCESS, 'success');
    } catch (error: any) {
      addNotification(`ক্যাটেগরি যোগ করতে সমস্যা: ${error.message}`, 'error');
    }
  };

  const handleUpdateBudgetCategory = async (id: string, newName: string, newAssociatedSuggestions: string[]) => {
    if (!currentUser || !currentUser.id) return;
    const categoryToUpdate = budgetCategories.find(c => c.id === id);
    if (!categoryToUpdate) return;
    const updatedCategory: BudgetCategory = {
      ...categoryToUpdate,
      name: newName,
      associatedSuggestions: newAssociatedSuggestions,
      lastModified: new Date().toISOString()
    };
    try {
      await apiService.updateRecord('budgetCategories', currentUser.id, updatedCategory, `id = '${id}'`);
      setBudgetCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
      addNotification(BN_UI_TEXT.BUDGET_CATEGORY_UPDATED_SUCCESS, 'success');
    } catch (error: any) {
      addNotification(`ক্যাটেগরি আপডেট করতে সমস্যা: ${error.message}`, 'error');
    }
  };

  const handleDeleteBudgetCategory = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    // Check if any budget uses this category
    if (budgets.some(b => b.categoryId === id)) {
        addNotification(BN_UI_TEXT.BUDGET_CATEGORY_HAS_BUDGETS_ERROR, 'error', 7000);
        return;
    }
    openConfirmationModal(
        BN_UI_TEXT.DELETE_BUDGET_CATEGORY_BTN,
        BN_UI_TEXT.CONFIRM_DELETE_BUDGET_CATEGORY_MSG,
        async () => {
            try {
                await apiService.deleteRecord('budgetCategories', currentUser.id!, `id = '${id}'`);
                setBudgetCategories(prev => prev.filter(c => c.id !== id));
                addNotification(BN_UI_TEXT.BUDGET_CATEGORY_DELETED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(`ক্যাটেগরি মুছতে সমস্যা: ${error.message}`, 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };

  const handleAddBudget = async (categoryId: string, amount: number, period: BudgetPeriod, startDateISO: string, customEndDateISO?: string) => {
    if (!currentUser || !currentUser.id) return;

    let endDateISO = '';
    const startDate = new Date(startDateISO);

    switch(period) {
        case BudgetPeriod.MONTHLY:
            endDateISO = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            break;
        case BudgetPeriod.WEEKLY:
            const endDateForWeek = new Date(startDate);
            endDateForWeek.setDate(startDate.getDate() + 6);
            endDateForWeek.setHours(23, 59, 59, 999);
            endDateISO = endDateForWeek.toISOString();
            break;
        case BudgetPeriod.QUARTERLY:
            endDateISO = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 999).toISOString();
            break;
        case BudgetPeriod.YEARLY:
            endDateISO = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
            break;
        case BudgetPeriod.CUSTOM:
            if (!customEndDateISO) {
                addNotification(BN_UI_TEXT.BUDGET_INVALID_CUSTOM_DATE_RANGE, 'error');
                return;
            }
            const customEndDate = new Date(customEndDateISO);
            customEndDate.setHours(23, 59, 59, 999);
            endDateISO = customEndDate.toISOString();
            break;
        default:
            return; // Should not happen
    }
    
    const newBudget: Budget = {
      id: 'bud_' + Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      categoryId,
      amount,
      period,
      startDate: startDateISO,
      endDate: endDateISO,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    try {
      await apiService.insertRecord('budgets', currentUser.id, newBudget);
      setBudgets(prev => [...prev, newBudget]);
      addNotification(BN_UI_TEXT.BUDGET_ADDED_SUCCESS, 'success');
    } catch (error: any) {
      addNotification(`বাজেট যোগ করতে সমস্যা: ${error.message}`, 'error');
    }
  };
  
  const handleUpdateBudget = async (id: string, newAmount: number) => {
    if (!currentUser || !currentUser.id) return;
    const budgetToUpdate = budgets.find(b => b.id === id);
    if (!budgetToUpdate) return;
    const updatedBudget: Budget = {
      ...budgetToUpdate,
      amount: newAmount,
      lastModified: new Date().toISOString()
    };
    try {
      await apiService.updateRecord('budgets', currentUser.id, updatedBudget, `id = '${id}'`);
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
      addNotification(BN_UI_TEXT.BUDGET_UPDATED_SUCCESS, 'success');
    } catch (error: any) {
      addNotification(`বাজেট আপডেট করতে সমস্যা: ${error.message}`, 'error');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!currentUser || !currentUser.id) return;
    openConfirmationModal(
        BN_UI_TEXT.DELETE_BUDGET_BTN,
        BN_UI_TEXT.CONFIRM_DELETE_BUDGET_MSG,
        async () => {
            try {
                await apiService.deleteRecord('budgets', currentUser.id!, `id = '${id}'`);
                setBudgets(prev => prev.filter(b => b.id !== id));
                addNotification(BN_UI_TEXT.BUDGET_DELETED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(`বাজেট মুছতে সমস্যা: ${error.message}`, 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };

  const calculateBudgetUsage = (budget: Budget, allUserTransactions: Transaction[]): { spent: number; remaining: number; percentageUsed: number } => {
    const budgetCategory = budgetCategories.find(c => c.id === budget.categoryId);
    if (!budgetCategory) return { spent: 0, remaining: budget.amount, percentageUsed: 0 };

    const budgetStartDate = new Date(budget.startDate);
    const budgetEndDate = new Date(budget.endDate);
    budgetEndDate.setHours(23, 59, 59, 999); // Ensure end of day

    const relevantTransactions = allUserTransactions.filter(t => {
        if (t.isDeleted || t.type !== TransactionType.EXPENSE) return false;
        const tDate = new Date(t.date);
        if (tDate < budgetStartDate || tDate > budgetEndDate) return false;
        
        // Check against associated suggestions for the category
        const mainDescriptionPart = t.description.split(" | ")[0].split(" [")[0]; // Get "বাজার খরচ" from "বাজার খরচ [২ কেজি] - অতিরিক্ত তথ্য"
        return budgetCategory.associatedSuggestions?.some(sugg => mainDescriptionPart.toLowerCase().startsWith(sugg.toLowerCase())) ?? false;
    });

    const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.amount - spent;
    const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return { spent, remaining, percentageUsed };
  };

  const handleOpenChatModal = (personToChatWith: Person) => {
    if (!personToChatWith.systemUserId) {
        addNotification(BN_UI_TEXT.CHAT_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', personToChatWith.customAlias || personToChatWith.name), 'warning');
        return;
    }
    if (personToChatWith.systemUserId === currentUser?.id) {
        addNotification("আপনি নিজের সাথে চ্যাট করতে পারবেন না।", 'warning');
        return;
    }
    setChattingWithPerson(personToChatWith);
    setIsChatModalOpen(true);
  };
  
  const handleSendMessage = async (content: string, recipientPerson: Person, imageToSend?: ImageMessageContent, audioToSend?: AudioMessageContent) => {
    if (!currentUser || !currentUser.id || !recipientPerson.systemUserId) {
      addNotification(BN_UI_TEXT.MESSAGE_SEND_ERROR + " (প্রাপক সঠিকভাবে নির্ধারিত নয়)", 'error');
      return;
    }
    if (recipientPerson.systemUserId === currentUser.id) {
        addNotification("আপনি নিজের কাছে বার্তা পাঠাতে পারবেন না।", 'error');
        return;
    }

    const messageId = 'msg_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();
    const threadId = [currentUser.id, recipientPerson.systemUserId].sort().join('_');

    const snapshot: MessageVersionSnapshot = {
        content: content,
        imageContent: imageToSend,
        audioContent: audioToSend,
        isDeleted: false,
    };

    const editHistoryEntry: MessageVersion = {
        timestamp: timestamp,
        action: 'created',
        userId: currentUser.id,
        snapshot: snapshot
    };

    const senderMessage: Message = {
      id: messageId + '_sender',
      userId: currentUser.id,
      threadId,
      actualSenderId: currentUser.id,
      actualReceiverId: recipientPerson.systemUserId,
      content,
      imageContent: imageToSend,
      audioContent: audioToSend,
      timestamp,
      isRead: true, // Sender's copy is always "read" by sender
      editHistory: [editHistoryEntry]
    };

    const receiverMessage: Message = {
      id: messageId + '_receiver',
      userId: recipientPerson.systemUserId, 
      threadId,
      actualSenderId: currentUser.id,
      actualReceiverId: recipientPerson.systemUserId,
      content,
      imageContent: imageToSend,
      audioContent: audioToSend,
      timestamp,
      isRead: false, 
      editHistory: [editHistoryEntry] 
    };
    
    try {
      await apiService.insertRecord('messages', currentUser.id, senderMessage);
      await apiService.insertRecord('messages', recipientPerson.systemUserId, receiverMessage);
      setMessages(prev => [...prev, senderMessage, receiverMessage].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ));
      // addNotification(BN_UI_TEXT.MESSAGE_SENT_SUCCESS, 'success', 1500); // Often too quick, can be annoying
    } catch (error: any) {
      addNotification(BN_UI_TEXT.MESSAGE_SEND_ERROR + `: ${error.message}`, 'error');
    }
  };
  
  const handleReactionToMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !currentUser.id) return;
    const currentUserId = currentUser.id;
    
    const targetMessage = messages.find(msg => msg.id === messageId && msg.userId === currentUserId); // Ensure user owns this message copy
    if (!targetMessage || targetMessage.actualSenderId === currentUserId) { // Can't react to own messages
        // console.log("Cannot react to own message or message not found for current user.");
        return;
    }

    const updatedReactions = { ...(targetMessage.reactions || {}) };
    
    if (!updatedReactions[emoji]) {
        updatedReactions[emoji] = [];
    }

    const userIndex = updatedReactions[emoji].indexOf(currentUserId);
    if (userIndex > -1) { // User already reacted with this emoji, so remove reaction
        updatedReactions[emoji].splice(userIndex, 1);
        if (updatedReactions[emoji].length === 0) {
            delete updatedReactions[emoji];
        }
    } else { // Add user's reaction
        updatedReactions[emoji].push(currentUserId);
    }

    const updatedMessage: Message = { ...targetMessage, reactions: updatedReactions };

    try {
        await apiService.updateRecord('messages', currentUserId, updatedMessage, `id = '${messageId}'`);
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
    } catch (error: any) {
        addNotification(BN_UI_TEXT.MESSAGE_REACTION_ERROR + `: ${error.message}`, 'error');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser || !currentUser.id) return;
    const userIdForContext = currentUser.id;

    const messageToDelete = messages.find(msg => msg.id === messageId && msg.userId === userIdForContext);
    if (!messageToDelete || messageToDelete.actualSenderId !== userIdForContext) { // Only sender can delete their copy
        addNotification("আপনি শুধুমাত্র নিজের পাঠানো বার্তা মুছে ফেলতে পারবেন।", 'warning');
        return;
    }
    if (messageToDelete.isDeleted) return; // Already marked as deleted

    openConfirmationModal(
        BN_UI_TEXT.DELETE_MESSAGE_TOOLTIP,
        BN_UI_TEXT.CONFIRM_DELETE_MESSAGE_MSG,
        async () => {
            const currentDate = new Date().toISOString();
            const snapshot: MessageVersionSnapshot = {
                content: messageToDelete.content,
                imageContent: messageToDelete.imageContent,
                audioContent: messageToDelete.audioContent,
                isDeleted: true,
                deletedAt: currentDate,
            };
            const updatedMessage: Message = {
                ...messageToDelete,
                isDeleted: true,
                deletedAt: currentDate,
                editHistory: [
                    ...(messageToDelete.editHistory || []),
                    { timestamp: currentDate, action: 'deleted', userId: userIdForContext, snapshot }
                ]
            };
            try {
                await apiService.updateRecord('messages', userIdForContext, updatedMessage, `id = '${messageId}'`);
                setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
                addNotification(BN_UI_TEXT.MESSAGE_DELETED_SUCCESS, 'success');
            } catch (error: any) {
                addNotification(BN_UI_TEXT.MESSAGE_DELETE_ERROR + `: ${error.message}`, 'error');
            }
            setIsConfirmModalOpen(false);
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_DELETE,
        "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    );
  };
  
  const handleOpenVideoCallModal = (personToCall: Person) => {
    if (!personToCall.systemUserId) {
        addNotification(BN_UI_TEXT.VIDEO_CALL_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', personToCall.customAlias || personToCall.name), 'warning');
        return;
    }
     if (personToCall.systemUserId === currentUser?.id) {
        addNotification("আপনি নিজের সাথে ভিডিও কল করতে পারবেন না।", 'warning');
        return;
    }
    setVideoCallTargetPerson(personToCall);
    setIsVideoCallModalOpen(true);
  };


  if (isLoadingData && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="text-center">
          <div role="status" className="mb-4">
            <svg aria-hidden="true" className="inline w-10 h-10 text-slate-300 animate-spin dark:text-slate-500 fill-teal-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">{BN_UI_TEXT.LOADING}</span>
          </div>
          <p className="text-lg text-slate-600">{BN_UI_TEXT.LOADING}</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !isAuthContextLoading) {
    return (
      <>
        <NotificationsDisplay />
        <HomePageLoggedOut onSwitchAuthMode={(mode) => handleSwitchAuthMode(mode)} />
        {isAuthModalOpen && (
          <Modal
            isOpen={isAuthModalOpen}
            onClose={() => { setIsAuthModalOpen(false); clearAuthError(); }}
            title={getAuthModalTitle(authPageMode)}
            size="md"
          >
            <AuthForm 
                mode={authPageMode} 
                initialEmail={emailForPasswordReset}
                onClose={() => { setIsAuthModalOpen(false); clearAuthError();}} 
                onSwitchMode={handleSwitchAuthMode} 
            />
          </Modal>
        )}
      </>
    );
  }
  
  // Fallback for any state where currentUser is somehow null after loading and auth error checks
  if (!currentUser && !isAuthContextLoading && !authContextError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
              <ExclamationCircleIcon className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-xl text-slate-700 font-semibold mb-2">{BN_UI_TEXT.AUTH_ERROR_GENERAL}</p>
              <p className="text-slate-500 text-center mb-6"> ব্যবহারকারী xác định করা যায়নি। অনুগ্রহ করে আবার লগইন করার চেষ্টা করুন।</p>
              <button
                  onClick={() => {
                      authLogout(); // Ensure clean logout state
                      setIsAuthModalOpen(true);
                      setAuthPageMode('login');
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
              >
                  {BN_UI_TEXT.LOGIN}
              </button>
          </div>
      );
  }


  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <NotificationsDisplay />
      <Header 
        onAddIncomeClick={handleOpenAddIncomeModal}
        onAddExpenseClick={handleOpenAddExpenseModal}
        onAddDebtClick={() => setIsAddDebtModalOpen(true)}
        onViewTransactionsClick={() => setIsViewTransactionsModalOpen(true)}
        onManagePersonsClick={handleOpenManagePersonsModal}
        onViewReportClick={handleOpenReportModal}
        onBudgetClick={() => setIsBudgetSetupModalOpen(true)}
        onArchiveClick={() => setIsArchiveModalOpen(true)}
        onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        onEditProfileClick={() => setIsEditProfileModalOpen(true)}
        onOpenInboxModal={() => setIsInboxModalOpen(true)}
        onSwitchAuthMode={(mode) => handleSwitchAuthMode(mode)}
        unreadMessagesCount={unreadMessagesCount}
        onResetAppDataClick={handleResetAppData}
        isGlobalPhoneticModeActive={isGlobalPhoneticModeActive}
        onToggleGlobalPhoneticMode={handleToggleGlobalPhoneticMode}
      />
      <main className="container mx-auto p-3 sm:p-4 md:p-6 flex-grow">
        {isLoadingData && (
            <div className="text-center py-10">
                <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                </div>
                <p className="mt-2 text-slate-500">{BN_UI_TEXT.LOADING}</p>
            </div>
        )}
        {!isLoadingData && appError && (
             <div className="my-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg text-center">
                <ExclamationCircleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-semibold">{appError}</p>
            </div>
        )}
        {!isLoadingData && !appError && (
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
            <TransactionList 
              transactions={transactions.filter(t => !t.isDeleted)}
              onDeleteTransaction={handleDeleteTransaction} 
              onEditTransaction={handleOpenEditTransactionModal}
              onViewHistory={handleViewTransactionHistory}
              onRestoreTransaction={handleRestoreTransaction} 
            />
            <DebtList 
              debts={debts} 
              persons={persons}
              onDeleteDebt={handleDeleteDebt} 
              onToggleSettle={handleToggleSettleDebt} 
              onEditDebt={handleOpenEditDebtModal}
              onViewHistory={handleViewDebtHistory}
              onViewPersonFinancialOverview={handleOpenPersonFinancialOverview}
            />
            <AITipCard balance={balance} />
          </>
        )}
      </main>

      {isAddIncomeModalOpen && (
        <Modal isOpen={isAddIncomeModalOpen} onClose={() => setIsAddIncomeModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME} size="lg">
          <SimplifiedTransactionForm
            transactionType={TransactionType.INCOME}
            onAddTransaction={handleAddTransaction}
            suggestionsList={incomeSuggestions}
            onOpenManageSuggestions={() => setIsManageSuggestionsModalOpen(true)}
            formTitle={BN_UI_TEXT.MODAL_TITLE_ADD_INCOME}
            expenseFieldRequirements={expenseFieldRequirements}
            onUpdateExpenseFieldRequirements={handleUpdateExpenseFieldRequirements}
            isGlobalPhoneticModeActive={isGlobalPhoneticModeActive}
          />
        </Modal>
      )}
      {isAddExpenseModalOpen && (
        <Modal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE} size="lg">
          <SimplifiedTransactionForm
            transactionType={TransactionType.EXPENSE}
            onAddTransaction={handleAddTransaction}
            suggestionsList={expenseSuggestions}
            onOpenManageSuggestions={() => setIsManageSuggestionsModalOpen(true)}
            formTitle={BN_UI_TEXT.MODAL_TITLE_ADD_EXPENSE}
            expenseFieldRequirements={expenseFieldRequirements}
            onUpdateExpenseFieldRequirements={handleUpdateExpenseFieldRequirements}
            isGlobalPhoneticModeActive={isGlobalPhoneticModeActive}
          />
        </Modal>
      )}

      {isAddDebtModalOpen && (
        <Modal isOpen={isAddDebtModalOpen} onClose={() => setIsAddDebtModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_ADD_DEBT} size="lg">
          <DebtForm 
            onAddDebt={handleAddOrUpdateDebtEntry} 
            persons={persons.filter(p => !p.isDeleted)}
            debts={debts}
            onOpenSelectPersonModal={handleOpenSelectPersonModal}
            getCompositePersonBalance={getCompositePersonBalance}
          />
        </Modal>
      )}
      
      {isViewTransactionsModalOpen && (
        <Modal isOpen={isViewTransactionsModalOpen} onClose={() => setIsViewTransactionsModalOpen(false)} title={BN_UI_TEXT.MODAL_TITLE_TRANSACTION_HISTORY} size="3xl">
          <TransactionList 
            transactions={transactions.filter(t => !t.isDeleted)}
            onDeleteTransaction={handleDeleteTransaction} 
            onEditTransaction={handleOpenEditTransactionModal}
            onViewHistory={handleViewTransactionHistory}
            onRestoreTransaction={handleRestoreTransaction}
            showTitle={false} 
          />
        </Modal>
      )}

      {isManagePersonsModalOpen && (
        <Modal isOpen={isManagePersonsModalOpen} onClose={() => setIsManagePersonsModalOpen(false)} title={BN_UI_TEXT.MANAGE_PERSONS_MODAL_TITLE} size="2xl">
            <PersonList
              persons={persons.filter(p => !p.isDeleted)}
              onEditPerson={handleOpenPersonFormModal}
              onDeletePerson={handleDeletePerson}
              onViewPersonHistory={handleViewPersonHistory}
              onAddNewPerson={() => handleOpenPersonFormModal()}
              onViewPersonDebtsHistory={handleViewPersonDebtsHistory}
              onViewPersonLedger={handleOpenPersonLedgerHistory}
              getPersonNetLedgerBalance={getCompositePersonBalance} 
              onRestorePerson={handleRestorePerson}
              onOpenChat={handleOpenChatModal}
              onOpenVideoCall={handleOpenVideoCallModal}
            />
        </Modal>
      )}
      
      {isPersonFormModalOpen && (
        <Modal
          isOpen={isPersonFormModalOpen}
          onClose={handleClosePersonFormModal}
          title={editingPerson ? BN_UI_TEXT.EDIT_PERSON_MODAL_TITLE : BN_UI_TEXT.ADD_PERSON_MODAL_TITLE}
          size="xl"
        >
          <PersonForm
            onSave={(data, id) => handleSavePerson(data, id, false, isAddingPersonForSelectionContext)}
            initialData={editingPerson}
            onCancel={handleClosePersonFormModal}
            allPersons={persons}
            onUserDetailsImported={handleUserDetailsImportedForPersonForm}
          />
        </Modal>
      )}

      {isSelectPersonModalOpen && (
        <SelectPersonModal
          isOpen={isSelectPersonModalOpen}
          onClose={() => {
              setIsSelectPersonModalOpen(false);
              setActivePersonSelectionCallback(null);
              if(isAddingPersonForSelectionContext){ // If "Add New Person" from Select modal was cancelled
                  setIsAddingPersonForSelectionContext(false);
                  // Determine which modal to reopen - AddDebt or EditDebt
                  // This logic might need refinement based on actual flow
                  if (isAddDebtModalOpen || isEditDebtModalOpen) { /* do nothing, it's behind */ }
                  else { setIsAddDebtModalOpen(true); } // Default or based on other context
              }
          }}
          persons={persons.filter(p => !p.isDeleted)}
          onSelectPerson={(personId) => {
            if (activePersonSelectionCallback) {
              activePersonSelectionCallback(personId);
            }
            setIsSelectPersonModalOpen(false);
            setActivePersonSelectionCallback(null);
          }}
          onAddNewPerson={handleOpenPersonFormForSelectionContext}
        />
      )}


      {isEditModalOpen && editingTransaction && (
        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingTransaction(null); }}
          transaction={editingTransaction}
          onSave={handleSaveEditedTransaction}
          allSuggestions={combinedTransactionSuggestionsForEdit}
          onOpenManageSuggestions={() => setIsManageSuggestionsModalOpen(true)}
          isGlobalPhoneticModeActive={isGlobalPhoneticModeActive}
        />
      )}
      {isEditDebtModalOpen && editingDebt && (
        <EditDebtModal
          isOpen={isEditDebtModalOpen}
          onClose={() => { setIsEditDebtModalOpen(false); setEditingDebt(null);}}
          debt={editingDebt}
          onSave={handleAddOrUpdateDebtEntry}
          persons={persons.filter(p => !p.isDeleted)}
          onOpenSelectPersonModal={handleOpenSelectPersonModal}
        />
      )}
       {isTransactionEditHistoryModalOpen && viewingTransactionEditHistoryFor && (
        <TransactionHistoryModal
          isOpen={isTransactionEditHistoryModalOpen}
          onClose={() => { setIsTransactionEditHistoryModalOpen(false); setViewingTransactionEditHistoryFor(null); }}
          transaction={viewingTransactionEditHistoryFor}
        />
      )}
      {isDebtEditHistoryModalOpen && viewingDebtEditHistoryFor && (
        <DebtHistoryModal
          isOpen={isDebtEditHistoryModalOpen}
          onClose={() => { setIsDebtEditHistoryModalOpen(false); setViewingDebtEditHistoryFor(null); }}
          debt={viewingDebtEditHistoryFor}
          persons={persons}
        />
      )}
      {isPersonHistoryModalOpen && viewingPersonHistoryFor && (
        <PersonHistoryModal
          isOpen={isPersonHistoryModalOpen}
          onClose={() => { setIsPersonHistoryModalOpen(false); setViewingPersonHistoryFor(null); }}
          person={viewingPersonHistoryFor}
        />
      )}
      {isPersonDebtsHistoryModalOpen && viewingPersonForDebtsHistory && (
        <PersonDebtsHistoryModal
            isOpen={isPersonDebtsHistoryModalOpen}
            onClose={() => { setIsPersonDebtsHistoryModalOpen(false); setViewingPersonForDebtsHistory(null);}}
            person={viewingPersonForDebtsHistory}
            personDebts={debts.filter(d => d.personId === viewingPersonForDebtsHistory.id)}
            allPersons={persons}
            onDeleteDebt={handleDeleteDebt}
            onToggleSettle={handleToggleSettleDebt}
            onEditDebt={handleOpenEditDebtModal}
            onViewDebtHistory={handleViewDebtHistory}
        />
      )}

      {isAddLedgerEntryModalOpen && selectedPersonForLedger && (
        <AddPersonLedgerEntryModal
            isOpen={isAddLedgerEntryModalOpen}
            onClose={() => {
                setIsAddLedgerEntryModalOpen(false);
                // Reopen ledger history if it was the source
                if (!isPersonFinancialOverviewModalOpen) { // Avoid reopening if overview is also open
                   setIsPersonLedgerHistoryModalOpen(true);
                } 
            }}
            person={selectedPersonForLedger}
            onAddEntry={handleAddPersonLedgerEntry}
        />
      )}
      {isPersonLedgerHistoryModalOpen && selectedPersonForLedger && (
        <PersonLedgerHistoryModal
            isOpen={isPersonLedgerHistoryModalOpen}
            onClose={() => { setIsPersonLedgerHistoryModalOpen(false); setSelectedPersonForLedger(null); }}
            person={selectedPersonForLedger}
            ledgerEntries={personLedgerEntries.filter(e => e.personId === selectedPersonForLedger.id)}
            currentNetBalance={getCompositePersonBalance(selectedPersonForLedger.id)}
            onAddEntryClick={handleOpenAddLedgerEntryModal}
            onDeleteEntry={handleDeleteLedgerEntry}
        />
      )}

      {isPersonFinancialOverviewModalOpen && viewingPersonForOverview && (
        <PersonFinancialOverviewModal
            isOpen={isPersonFinancialOverviewModalOpen}
            onClose={() => { setIsPersonFinancialOverviewModalOpen(false); setViewingPersonForOverview(null);}}
            person={viewingPersonForOverview}
            personDebts={debts.filter(d => d.personId === viewingPersonForOverview.id)}
            personLedgerEntries={personLedgerEntries.filter(e => e.personId === viewingPersonForOverview.id)}
            currentNetLedgerBalance={getCompositePersonBalance(viewingPersonForOverview.id)}
            allPersons={persons}
            onDeleteDebt={handleDeleteDebt}
            onToggleSettle={handleToggleSettleDebt}
            onEditDebt={handleOpenEditDebtModal}
            onViewDebtHistory={handleViewDebtHistory}
            onAddLedgerEntryClick={handleOpenAddLedgerEntryModal}
            onDeleteLedgerEntry={handleDeleteLedgerEntry}
        />
      )}

      {isReceivablePersonsModalOpen && (
        <ReceivablePersonsModal
            isOpen={isReceivablePersonsModalOpen}
            onClose={() => setIsReceivablePersonsModalOpen(false)}
            receivablePersons={receivablePersonsData}
            onViewPersonDetails={handleOpenPersonFinancialOverview}
            persons={persons}
        />
      )}
      {isPayablePersonsModalOpen && (
        <PayablePersonsModal
            isOpen={isPayablePersonsModalOpen}
            onClose={() => setIsPayablePersonsModalOpen(false)}
            payablePersons={payablePersonsData}
            onViewPersonDetails={handleOpenPersonFinancialOverview}
            persons={persons}
        />
      )}
      
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          transactions={transactions}
          allDescriptions={combinedTransactionSuggestionsForEdit}
          onDeleteTransaction={handleDeleteTransaction} 
          onEditTransaction={handleOpenEditTransactionModal}
          onViewHistory={handleViewTransactionHistory}
          onRestoreTransaction={handleRestoreTransaction}
        />
      )}
       
      {isArchiveModalOpen && (
        <ArchiveModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          allTransactions={transactions}
          allPersons={persons}
          onRestoreTransaction={handleRestoreTransaction}
          onRestorePerson={handleRestorePerson}
          onViewTransactionHistory={handleViewTransactionHistory}
          onViewPersonHistory={handleViewPersonHistory}
          onEditPerson={handleOpenPersonFormModal}
          onViewPersonDebtsHistory={handleViewPersonDebtsHistory}
          onViewPersonLedger={handleOpenPersonLedgerHistory}
          getPersonNetLedgerBalance={getCompositePersonBalance}
          onDeleteTransaction={handleDeleteTransaction} 
          onEditTransaction={handleOpenEditTransactionModal}
          onOpenChat={handleOpenChatModal}
          onOpenVideoCall={handleOpenVideoCallModal}
        />
      )}

      {isManageSuggestionsModalOpen && (
        <ManageSuggestionsModal
            isOpen={isManageSuggestionsModalOpen}
            onClose={() => setIsManageSuggestionsModalOpen(false)}
            userSuggestions={userCustomSuggestions}
            predefinedIncomeSuggestions={INCOME_DESCRIPTION_SUGGESTIONS_BN}
            predefinedExpenseSuggestions={EXPENSE_DESCRIPTION_SUGGESTIONS_BN}
            onAddSuggestion={handleUserSuggestionAdded}
            onEditSuggestion={handleUserSuggestionEdited}
            onDeleteSuggestion={handleUserSuggestionDeleted}
        />
      )}

      {isBudgetSetupModalOpen && currentUser && (
        <BudgetSetupModal
            isOpen={isBudgetSetupModalOpen}
            onClose={() => setIsBudgetSetupModalOpen(false)}
            categories={budgetCategories}
            budgets={budgets}
            transactions={transactions}
            allTransactionSuggestions={TRANSACTION_DESCRIPTION_SUGGESTIONS_BN}
            userCustomSuggestions={userCustomSuggestions.map(s=>s.text)}
            onAddCategory={handleAddBudgetCategory}
            onUpdateCategory={handleUpdateBudgetCategory}
            onDeleteCategory={handleDeleteBudgetCategory}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
            calculateBudgetUsage={(budget, txns) => calculateBudgetUsage(budget, txns)}
        />
      )}

      {isChatModalOpen && chattingWithPerson && currentUser && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => { setIsChatModalOpen(false); setChattingWithPerson(null); }}
          person={chattingWithPerson}
          currentUser={currentUser}
          messages={messages.filter(msg => msg.threadId === [currentUser.id, chattingWithPerson.systemUserId].sort().join('_') && msg.userId === currentUser.id)}
          onSendMessage={handleSendMessage}
          onReactToMessage={handleReactionToMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      )}
      {isInboxModalOpen && currentUser && (
        <InboxModal
          isOpen={isInboxModalOpen}
          onClose={() => setIsInboxModalOpen(false)}
          currentUser={currentUser}
          persons={persons}
          messages={messages}
          onOpenChat={(person) => { setIsInboxModalOpen(false); handleOpenChatModal(person); }}
          onOpenImageViewer={(imgContent) => {
            if (imgContent) {
              setViewingImageDetails({ url: imgContent.base64Data, name: imgContent.fileName });
              setIsImageViewerOpen(true);
            }
          }}
          onDeleteChatHistory={(personToDeleteChatWith) => {
            if (!currentUser.id || !personToDeleteChatWith.systemUserId) return;
            const threadIdToDelete = [currentUser.id, personToDeleteChatWith.systemUserId].sort().join('_');
            openConfirmationModal(
                BN_UI_TEXT.DELETE_CHAT_HISTORY_TOOLTIP,
                BN_UI_TEXT.CONFIRM_DELETE_CHAT_HISTORY_MSG.replace('{personName}', personToDeleteChatWith.customAlias || personToDeleteChatWith.name),
                async () => {
                    const userMessagesInThread = messages.filter(m => m.userId === currentUser.id && m.threadId === threadIdToDelete);
                    const deletionPromises = userMessagesInThread.map(msg => {
                        const currentDate = new Date().toISOString();
                        const snapshot: MessageVersionSnapshot = {
                            content: msg.content,
                            imageContent: msg.imageContent,
                            audioContent: msg.audioContent,
                            isDeleted: true,
                            deletedAt: currentDate,
                        };
                         const updatedMessage: Message = {
                            ...msg,
                            isDeleted: true,
                            deletedAt: currentDate,
                            editHistory: [
                                ...(msg.editHistory || []),
                                { timestamp: currentDate, action: 'history_deleted', userId: currentUser.id!, snapshot }
                            ]
                        };
                        return apiService.updateRecord('messages', currentUser.id!, updatedMessage, `id = '${msg.id}'`);
                    });
                    try {
                        await Promise.all(deletionPromises);
                        setMessages(prev => prev.map(msg => {
                            if (msg.userId === currentUser.id && msg.threadId === threadIdToDelete) {
                                return {...msg, isDeleted: true, deletedAt: new Date().toISOString()};
                            }
                            return msg;
                        }));
                        addNotification(BN_UI_TEXT.CHAT_HISTORY_DELETED_SUCCESS, 'success');
                    } catch (error: any) {
                        addNotification("চ্যাট ইতিহাস মুছতে সমস্যা হয়েছে: " + error.message, 'error');
                    }
                    setIsConfirmModalOpen(false);
                },
                BN_UI_TEXT.CONFIRM_BTN_YES_DELETE, "bg-red-600 hover:bg-red-700"
            );
          }}
        />
      )}
      {isImageViewerOpen && viewingImageDetails && (
          <ImageViewerModal
              isOpen={isImageViewerOpen}
              onClose={() => { setIsImageViewerOpen(false); setViewingImageDetails(null); }}
              imageUrl={viewingImageDetails.url}
              imageName={viewingImageDetails.name}
          />
      )}
      {isVideoCallModalOpen && videoCallTargetPerson && currentUser && (
        <VideoCallModal
          isOpen={isVideoCallModalOpen}
          onClose={() => { setIsVideoCallModalOpen(false); setVideoCallTargetPerson(null); }}
          targetPerson={videoCallTargetPerson}
          currentUser={currentUser}
        />
      )}


      {isAuthModalOpen && !currentUser && (
          <Modal
            isOpen={isAuthModalOpen}
            onClose={() => { setIsAuthModalOpen(false); clearAuthError(); setEmailForPasswordReset(undefined); }}
            title={getAuthModalTitle(authPageMode)}
            size="md"
          >
            <AuthForm 
                mode={authPageMode} 
                initialEmail={emailForPasswordReset}
                onClose={() => { setIsAuthModalOpen(false); clearAuthError(); setEmailForPasswordReset(undefined);}} 
                onSwitchMode={handleSwitchAuthMode} 
            />
          </Modal>
      )}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
      {isEditProfileModalOpen && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
        />
      )}
      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setConfirmModalAction(null);
          }}
          onConfirm={async () => {
            if (confirmModalAction) {
              await confirmModalAction();
            }
          }}
          title={confirmModalTitle}
          message={confirmModalMessage}
          confirmButtonText={confirmModalButtonText}
          confirmButtonColor={confirmModalButtonColor}
        />
      )}
      {appError && !isLoadingData && ( 
        <SimpleErrorModal
          isOpen={!!appError}
          onClose={() => setAppError(null)}
          message={appError}
          title="অ্যাপ্লিকেশনে ত্রুটি"
        />
      )}
    </div>
  );
};

// export default App; // Removed default export
