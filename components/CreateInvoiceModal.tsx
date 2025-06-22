
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Invoice, InvoiceItem, InvoicePaymentStatus, Person, InvoicePaymentMethod, InvoiceCreationData, Product, CompanyProfile, InvoiceType, User, AIPreRenderData } from '../types';
import { BN_UI_TEXT, COMMON_UNITS_BN, LOCAL_STORAGE_KEYS } from '../constants';
import { useNotification } from '../contexts/NotificationContext';
import PlusCircleIcon from './icons/PlusCircleIcon';
import TrashIcon from './icons/TrashIcon';
import UsersIcon from './icons/UsersIcon';
import Modal from './Modal';
import { convertToBanglaPhonetic } from '../utils/textUtils';
import CubeIcon from './icons/CubeIcon';
import PinIcon from './icons/PinIcon';
import { useAuth } from '../contexts/AuthContext';
import ArrowsPointingOutIcon from './icons/ArrowsPointingOutIcon';
import ArrowsPointingInIcon from './icons/ArrowsPointingInIcon';
import CogIcon from './icons/CogIcon';
import PlusIcon from './icons/PlusIcon';
import MinusIcon from './icons/MinusIcon';
import ArrowUturnLeftIcon from './icons/ArrowUturnLeftIcon';


interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoiceData: InvoiceCreationData, originalInvoiceId?: string) => Promise<Invoice | null>;
  persons: Person[];
  products: Product[];
  companyProfiles: CompanyProfile[];
  onOpenSelectPersonModal: (callback: (personId: string) => void) => void;
  onPersonAdded: (personData: Omit<Person, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory'>) => Promise<Person | null>;
  isGlobalPhoneticModeActive: boolean;
  onOpenManageProductsModal: () => void;
  editingInvoiceData?: Invoice | null;
  aiPreRenderData?: AIPreRenderData | null;
  onAIInvoiceDataProcessed: () => void;
  onOpenConfirmationModal: (title: string, message: string | React.ReactNode, onConfirmAction: () => Promise<void>, confirmButtonText?: string, confirmButtonColor?: string) => void;
}

type PriceType = 'sales' | 'mrp' | 'wholesale' | 'custom';
type ItemSectionFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

interface LocalInvoiceItem extends InvoiceItem {
  selectedPriceType: PriceType;
  originalProductId?: string;
  availablePrices?: {
    sales?: number;
    mrp?: number;
    wholesale?: number;
  };
}

const initialLocalItemBase: Omit<LocalInvoiceItem, 'id'> = {
  productName: '',
  description: '',
  quantity: 1, 
  unitPrice: 0,  
  total: 0,
  selectedPriceType: 'custom', 
  unit: '',
};

interface SalesColumnVisibility {
  productName: boolean;
  description: boolean;
  quantity: boolean;
  unitPrice: boolean;
  totalPrice: boolean;
  unit: boolean;
}

const defaultSalesColumnVisibility: SalesColumnVisibility = {
  productName: true,
  description: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  unit: true,
};

const salesColumnConfigs: { key: keyof SalesColumnVisibility; label: string; defaultGridSpan: string; headerTextAlign?: string, cellTextAlign?: string }[] = [
  { key: 'productName', label: BN_UI_TEXT.PRODUCT_SERVICE_NAME_LABEL, defaultGridSpan: 'minmax(0, 2.5fr)', headerTextAlign: 'text-left', cellTextAlign: 'text-left' },
  { key: 'description', label: BN_UI_TEXT.ITEM_DESCRIPTION_LABEL, defaultGridSpan: 'minmax(0, 1.5fr)', headerTextAlign: 'text-left', cellTextAlign: 'text-left' },
  { key: 'quantity', label: BN_UI_TEXT.QUANTITY_INVOICE_LABEL, defaultGridSpan: 'minmax(0, 0.8fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'unitPrice', label: BN_UI_TEXT.UNIT_PRICE_LABEL, defaultGridSpan: 'minmax(0, 1.2fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'totalPrice', label: BN_UI_TEXT.ITEM_TOTAL_LABEL, defaultGridSpan: 'minmax(0, 1fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'unit', label: BN_UI_TEXT.PRODUCT_UNIT_LABEL, defaultGridSpan: 'minmax(0, 0.8fr)', headerTextAlign: 'text-left', cellTextAlign: 'text-left' },
];


const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveInvoice,
  persons,
  products,
  companyProfiles,
  onOpenSelectPersonModal,
  onPersonAdded,
  isGlobalPhoneticModeActive,
  onOpenManageProductsModal,
  editingInvoiceData,
  aiPreRenderData,
  onAIInvoiceDataProcessed,
  onOpenConfirmationModal,
}) => {
  const { addNotification } = useNotification();
  const { currentUser, updateCurrentUserData } = useAuth();
  const isEditingMode = !!editingInvoiceData;
  const invoiceInitializedRef = useRef(false); 
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Person[]>([]);
  const [showCustomerSuggestionsDropdown, setShowCustomerSuggestionsDropdown] = useState(false);
  const [activeCustomerSuggestionIndex, setActiveCustomerSuggestionIndex] = useState<number | null>(null);
  const [selectedCompanyProfileIdForInvoice, setSelectedCompanyProfileIdForInvoice] = useState<string | undefined>(undefined);

  const [items, setItems] = useState<LocalInvoiceItem[]>([{ ...initialLocalItemBase, id: Date.now().toString(), quantity: 1, unitPrice: 0 }]);
  const [globalSelectedPriceType, setGlobalSelectedPriceType] = useState<PriceType>(() => {
    const storedType = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE) as PriceType | null;
    return storedType || 'mrp';
  });

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<'percentage' | 'fixed' | null>(null);
  const [taxValue, setTaxValue] = useState<number>(0);
  
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>(InvoicePaymentStatus.PENDING);
  
  const [isPaymentStatusPinned, setIsPaymentStatusPinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_PAYMENT_STATUS) === 'true');
  const [isInvoiceDatePinned, setIsInvoiceDatePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_DATE) === 'true');
  const [isDueDatePinned, setIsDueDatePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_DUE_DATE) === 'true');
  const [isCompanyProfilePinned, setIsCompanyProfilePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_COMPANY_PROFILE) === 'true');
  const [isDiscountTypePinned, setIsDiscountTypePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_DISCOUNT_TYPE) === 'true');
  const [isTaxTypePinned, setIsTaxTypePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_TAX_TYPE) === 'true');
  const [isPaymentMethodPinned, setIsPaymentMethodPinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_METHOD) === 'true');
  const [isPaymentNotesPinned, setIsPaymentNotesPinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_NOTES) === 'true');
  const [isInvoiceNotesPinned, setIsInvoiceNotesPinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_NOTES) === 'true');


  const [initialPaidAmount, setInitialPaidAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<InvoicePaymentMethod>('Cash');
  const [initialPaymentNotes, setInitialPaymentNotes] = useState('');

  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const customerSearchInputRef = useRef<HTMLInputElement>(null);
  const customerSuggestionsRef = useRef<HTMLUListElement>(null);
  const paymentNotesInputRef = useRef<HTMLInputElement>(null); 
  
  const invoiceNumberInputRef = useRef<HTMLInputElement>(null);
  const invoiceDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null); // Ref for Due Date
  const saveButtonRef = useRef<HTMLButtonElement>(null); // Ref for Save button

  const itemProductNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemQuantityRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemUnitPriceRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemUnitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemDescriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const itemTotalRefs = useRef<(HTMLInputElement | null)[]>([]); 
  
  const itemProductSuggestionsRef = useRef<(HTMLUListElement | null)[]>([]);
  const [itemProductSuggestions, setItemProductSuggestions] = useState<Product[][]>(() => items.map(() => []));
  const [showItemProductSuggestionsDropdown, setShowItemProductSuggestionsDropdown] = useState<boolean[]>(() => items.map(() => false));
  const [activeProductSuggestionIndex, setActiveProductSuggestionIndex] = useState<{ itemIndex: number; suggestionIndex: number } | null>(null);
  
  const skipPhoneticConversionMapRef = useRef<{[key:string]: boolean}>({});

  const [columnVisibility, setColumnVisibility] = useState<SalesColumnVisibility>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_COLUMN_VISIBILITY_SALES_V1);
    try {
      return stored ? JSON.parse(stored) : defaultSalesColumnVisibility;
    } catch (e) {
      console.error("Failed to parse sales column visibility from localStorage", e);
      return defaultSalesColumnVisibility;
    }
  });

  const [itemSectionFontSize, setItemSectionFontSize] = useState<ItemSectionFontSize>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_ITEM_FONT_SIZE_SALES_V1) as ItemSectionFontSize | null) || 'sm';
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICE_COLUMN_VISIBILITY_SALES_V1, JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICE_ITEM_FONT_SIZE_SALES_V1, itemSectionFontSize);
  }, [itemSectionFontSize]);

  const handleColumnVisibilityChange = (column: keyof SalesColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  const handleFontSizeChange = (newSize: ItemSectionFontSize) => {
    setItemSectionFontSize(newSize);
  };
  
  const cycleFontSize = (direction: 'increase' | 'decrease') => {
    const sizes: ItemSectionFontSize[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
    const currentIndex = sizes.indexOf(itemSectionFontSize);
    if (direction === 'increase') {
      if (currentIndex < sizes.length - 1) {
        setItemSectionFontSize(sizes[currentIndex + 1]);
      }
    } else { 
      if (currentIndex > 0) {
        setItemSectionFontSize(sizes[currentIndex - 1]);
      }
    }
  };

  const getFontSizeClass = (type: 'header' | 'input'): string => {
    const sizeMap = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };
    return sizeMap[itemSectionFontSize] || 'text-sm';
  };


  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const columnSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const columnSettingsDropdownRef = useRef<HTMLDivElement>(null);

  const dynamicGridStyle = useMemo(() => {
    const visibleSpans = salesColumnConfigs
      .filter(config => columnVisibility[config.key])
      .map(config => config.defaultGridSpan);
    visibleSpans.push('auto'); 
    return { gridTemplateColumns: visibleSpans.join(' ') };
  }, [columnVisibility]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSettingsDropdownRef.current && !columnSettingsDropdownRef.current.contains(event.target as Node) &&
          columnSettingsButtonRef.current && !columnSettingsButtonRef.current.contains(event.target as Node)) {
        setIsColumnSettingsOpen(false);
      }
    };
    if (isColumnSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColumnSettingsOpen]);


  const toggleFullScreen = () => setIsFullScreen(prev => !prev);

  const makePinToggleHandler = useCallback((
    pinStateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    storageKeyForPinState: string,
    userPreferenceKeyForType: keyof User,
    currentTypeToSave: any,
    userPreferenceKeyForValue?: keyof User, 
    currentValueToSave?: number | null,
    fieldNameForNotification?: string 
  ) => async () => {
    pinStateSetter(prevPinState => {
      const newPinState = !prevPinState;
      localStorage.setItem(storageKeyForPinState, String(newPinState));
  
      if (currentUser) {
        const updatesToProfile: Partial<User> = {};
        if (newPinState) {
          (updatesToProfile as any)[userPreferenceKeyForType] = currentTypeToSave;
          if (userPreferenceKeyForValue && (currentValueToSave !== undefined && currentValueToSave !== null)) {
            (updatesToProfile as any)[userPreferenceKeyForValue] = currentValueToSave;
          }
          if(fieldNameForNotification) addNotification(`${fieldNameForNotification} ${BN_UI_TEXT.DEFAULT_VALUE_PINNED_SUCCESS.split(" ").slice(2).join(" ")}`, 'success', 2000);
        } else {
          (updatesToProfile as any)[userPreferenceKeyForType] = null;
          if (userPreferenceKeyForValue) {
            (updatesToProfile as any)[userPreferenceKeyForValue] = null;
          }
          if(fieldNameForNotification) addNotification(`${fieldNameForNotification} ${BN_UI_TEXT.DEFAULT_VALUE_UNPINNED_SUCCESS.split(" ").slice(2).join(" ")}`, 'info', 2000);
        }
        if (Object.keys(updatesToProfile).length > 0) {
          updateCurrentUserData(updatesToProfile as Partial<User>);
        }
      }
      return newPinState;
    });
  }, [currentUser, updateCurrentUserData, addNotification]);

  const togglePaymentStatusPin = useCallback(() => makePinToggleHandler(setIsPaymentStatusPinned, LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_PAYMENT_STATUS, 'defaultSalesPaymentStatus', paymentStatus, undefined, undefined, BN_UI_TEXT.PAYMENT_STATUS_LABEL)(), [makePinToggleHandler, paymentStatus]);
  const toggleInvoiceDatePin = useCallback(() => {
      const today = new Date(); today.setHours(0,0,0,0);
      const invDate = new Date(invoiceDate); invDate.setHours(0,0,0,0);
      const offset = Math.round((invDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      makePinToggleHandler(setIsInvoiceDatePinned, LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_DATE, 'defaultSalesInvoiceDateOffset', offset, undefined, undefined, BN_UI_TEXT.INVOICE_DATE_LABEL)();
  }, [makePinToggleHandler, invoiceDate]);
  const toggleDueDatePin = useCallback(() => {
    if(invoiceDate && dueDate){
        const invDate = new Date(invoiceDate); invDate.setHours(0,0,0,0);
        const dDate = new Date(dueDate); dDate.setHours(0,0,0,0);
        const offset = Math.round((dDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        makePinToggleHandler(setIsDueDatePinned, LOCAL_STORAGE_KEYS.PIN_SALES_DUE_DATE, 'defaultSalesDueDateOffset', offset, undefined, undefined, BN_UI_TEXT.DUE_DATE_INVOICE_LABEL)();
    } else {
        makePinToggleHandler(setIsDueDatePinned, LOCAL_STORAGE_KEYS.PIN_SALES_DUE_DATE, 'defaultSalesDueDateOffset', 30, undefined, undefined, BN_UI_TEXT.DUE_DATE_INVOICE_LABEL)();
    }
  }, [makePinToggleHandler, invoiceDate, dueDate]);
  const toggleCompanyProfilePin = useCallback(() => makePinToggleHandler(setIsCompanyProfilePinned, LOCAL_STORAGE_KEYS.PIN_SALES_COMPANY_PROFILE, 'defaultSalesCompanyProfileId', selectedCompanyProfileIdForInvoice, undefined, undefined, "কোম্পানির প্রোফাইল")(), [makePinToggleHandler, selectedCompanyProfileIdForInvoice]);
  const toggleDiscountTypePin = useCallback(() => makePinToggleHandler(setIsDiscountTypePinned, LOCAL_STORAGE_KEYS.PIN_SALES_DISCOUNT_TYPE, 'defaultSalesDiscountType', discountType, 'defaultSalesDiscountValue', discountValue, BN_UI_TEXT.DISCOUNT_TYPE_LABEL)(), [makePinToggleHandler, discountType, discountValue]);
  const toggleTaxTypePin = useCallback(() => makePinToggleHandler(setIsTaxTypePinned, LOCAL_STORAGE_KEYS.PIN_SALES_TAX_TYPE, 'defaultSalesTaxType', taxType, 'defaultSalesTaxValue', taxValue, BN_UI_TEXT.TAX_TYPE_LABEL)(), [makePinToggleHandler, taxType, taxValue]);
  
  const togglePaymentMethodPin = useCallback(() => makePinToggleHandler(setIsPaymentMethodPinned, LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_METHOD, 'defaultSalesPaymentMethod', initialPaymentMethod, undefined, undefined, BN_UI_TEXT.PAYMENT_METHOD_LABEL)(), [makePinToggleHandler, initialPaymentMethod]);
  const togglePaymentNotesPin = useCallback(() => makePinToggleHandler(setIsPaymentNotesPinned, LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_NOTES, 'defaultSalesPaymentNotes', initialPaymentNotes.trim() || null, undefined, undefined, BN_UI_TEXT.PAYMENT_NOTES_LABEL)(), [makePinToggleHandler, initialPaymentNotes]);
  const toggleInvoiceNotesPin = useCallback(() => makePinToggleHandler(setIsInvoiceNotesPinned, LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_NOTES, 'defaultSalesInvoiceNotes', notes.trim() || null, undefined, undefined, BN_UI_TEXT.NOTES_TERMS_LABEL)(), [makePinToggleHandler, notes]);

  useEffect(() => {
    if (paymentStatus === InvoicePaymentStatus.PAID) {
      setInitialPaidAmount(totalAmount.toString());
      if (!isEditingMode) { 
        if (!isPaymentMethodPinned || !currentUser?.defaultSalesPaymentMethod) {
            setInitialPaymentMethod('Cash');
        }
        if (!isPaymentNotesPinned || !currentUser?.defaultSalesPaymentNotes) {
            setInitialPaymentNotes(BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE);
        }
      }
    } else if (paymentStatus !== InvoicePaymentStatus.PARTIALLY_PAID) {
      if (!isPaymentMethodPinned || !currentUser?.defaultSalesPaymentMethod) setInitialPaymentMethod('Cash');
      if (!isPaymentNotesPinned || !currentUser?.defaultSalesPaymentNotes) setInitialPaymentNotes('');
      setInitialPaidAmount(''); 
    }
  }, [paymentStatus, totalAmount, isEditingMode, isPaymentMethodPinned, isPaymentNotesPinned, currentUser]);


  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE, globalSelectedPriceType);
  }, [globalSelectedPriceType]);

  const getLocalDateYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const generateInvoiceNumber = useCallback(() => {
    const defaultCompany = companyProfiles.find(cp => cp.isDefault) || (companyProfiles.length > 0 ? companyProfiles[0] : null);
    const companyPrefix = defaultCompany?.companyName.substring(0,3).toUpperCase().replace(/\s/g, '') || "CMP";
    const typePrefix = "INV";
    const personTypePrefix = "CUST";
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${typePrefix}-${companyPrefix}-${personTypePrefix}${year}${month}${day}-${randomSuffix}`;
  }, [companyProfiles]);

  const resetForm = useCallback(() => {
    const currentGlobalPriceTypeFromStorage = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE) as PriceType | null || 'mrp';
    setGlobalSelectedPriceType(currentGlobalPriceTypeFromStorage);

    const newIsPaymentStatusPinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_PAYMENT_STATUS) === 'true';
    const newIsInvoiceDatePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_DATE) === 'true';
    const newIsDueDatePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_DUE_DATE) === 'true';
    const newIsCompanyProfilePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_COMPANY_PROFILE) === 'true';
    const newIsDiscountTypePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_DISCOUNT_TYPE) === 'true';
    const newIsTaxTypePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_TAX_TYPE) === 'true';
    const newIsPaymentMethodPinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_METHOD) === 'true';
    const newIsPaymentNotesPinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_PAYMENT_NOTES) === 'true';
    const newIsInvoiceNotesPinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_SALES_INVOICE_NOTES) === 'true';
    
    setIsPaymentStatusPinned(newIsPaymentStatusPinned);
    setIsInvoiceDatePinned(newIsInvoiceDatePinned);
    setIsDueDatePinned(newIsDueDatePinned);
    setIsCompanyProfilePinned(newIsCompanyProfilePinned);
    setIsDiscountTypePinned(newIsDiscountTypePinned);
    setIsTaxTypePinned(newIsTaxTypePinned);
    setIsPaymentMethodPinned(newIsPaymentMethodPinned);
    setIsPaymentNotesPinned(newIsPaymentNotesPinned);
    setIsInvoiceNotesPinned(newIsInvoiceNotesPinned);


    if (isEditingMode && editingInvoiceData) {
        setInvoiceNumber(editingInvoiceData.invoiceNumber);
        
        const editInvDate = new Date(editingInvoiceData.invoiceDate);
        setInvoiceDate(getLocalDateYYYYMMDD(new Date(editInvDate.getUTCFullYear(), editInvDate.getUTCMonth(), editInvDate.getUTCDate())));

        if (editingInvoiceData.dueDate) {
            const editDueDate = new Date(editingInvoiceData.dueDate);
            setDueDate(getLocalDateYYYYMMDD(new Date(editDueDate.getUTCFullYear(), editDueDate.getUTCMonth(), editDueDate.getUTCDate())));
        } else {
            setDueDate('');
        }
        
        const customer = persons.find(p => p.id === editingInvoiceData.personId);
        setSelectedPersonId(customer?.id || null);
        setCustomerSearchTerm(customer ? (customer.customAlias || customer.name) : '');
        
        setSelectedCompanyProfileIdForInvoice(editingInvoiceData.companyProfileId);
        setDiscountType(editingInvoiceData.discountType || null);
        setDiscountValue(editingInvoiceData.discountValue || 0);
        setTaxType(editingInvoiceData.taxType || null);
        setTaxValue(editingInvoiceData.taxValue || 0);
        setNotes(editingInvoiceData.notes || '');
        setPaymentStatus(editingInvoiceData.paymentStatus);

        const loadedItems: LocalInvoiceItem[] = editingInvoiceData.items.map(item => {
            const product = products.find(p => p.name === item.productName || (p.id && item.originalProductId === p.id));
            let defaultPriceType: PriceType = 'custom';
            if (product) {
                 if (item.unitPrice === product.mrp) defaultPriceType = 'mrp';
                 else if (item.unitPrice === product.wholesalePrice) defaultPriceType = 'wholesale';
                 else if (item.unitPrice === product.unitPrice) defaultPriceType = 'sales';
            }
            return { ...item, unit: item.unit || '', quantity: item.quantity || 1, unitPrice: item.unitPrice || 0, selectedPriceType: defaultPriceType, originalProductId: product?.id, availablePrices: product ? { sales: product.unitPrice, mrp: product.mrp, wholesale: product.wholesalePrice } : undefined };
        });
        setItems(loadedItems.length > 0 ? loadedItems : [{ ...initialLocalItemBase, id: Date.now().toString(), quantity: 1, unitPrice: 0, selectedPriceType: currentGlobalPriceTypeFromStorage }]);
        
        if (editingInvoiceData.paymentStatus === InvoicePaymentStatus.PAID) {
            setInitialPaidAmount(editingInvoiceData.totalAmount.toString());
            const firstPayment = editingInvoiceData.paymentsReceived?.[0];
            if (firstPayment && firstPayment.amount === editingInvoiceData.totalAmount && firstPayment.notes === BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE) {
                setInitialPaymentMethod(firstPayment.paymentMethod || 'Cash');
                setInitialPaymentNotes(firstPayment.notes || BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE);
            } else if (firstPayment) {
                 setInitialPaymentMethod(firstPayment.paymentMethod || 'Cash');
                 setInitialPaymentNotes(firstPayment.notes || '');
            } else {
                 setInitialPaymentMethod('Cash');
                 setInitialPaymentNotes(BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE);
            }
        } else if (editingInvoiceData.paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID && editingInvoiceData.paymentsReceived && editingInvoiceData.paymentsReceived.length > 0) {
            const firstPayment = editingInvoiceData.paymentsReceived[0];
            setInitialPaidAmount(firstPayment.amount.toString());
            setInitialPaymentMethod(firstPayment.paymentMethod || 'Cash');
            setInitialPaymentNotes(firstPayment.notes || '');
        } else {
            setInitialPaidAmount('');
            setInitialPaymentMethod('Cash');
            setInitialPaymentNotes('');
        }

    } else { 
        setInvoiceNumber(generateInvoiceNumber()); 
        
        let baseDateForInvoice = new Date(); 
        if (newIsInvoiceDatePinned && currentUser?.defaultSalesInvoiceDateOffset !== null && currentUser?.defaultSalesInvoiceDateOffset !== undefined) {
            baseDateForInvoice.setDate(baseDateForInvoice.getDate() + currentUser.defaultSalesInvoiceDateOffset);
        }
        const tempInvoiceDateString = getLocalDateYYYYMMDD(baseDateForInvoice);
        setInvoiceDate(tempInvoiceDateString);

        const [year, month, day] = tempInvoiceDateString.split('-').map(Number);
        let baseDateForDue = new Date(year, month - 1, day); 

        if (newIsDueDatePinned && currentUser?.defaultSalesDueDateOffset !== null && currentUser?.defaultSalesDueDateOffset !== undefined) {
            baseDateForDue.setDate(baseDateForDue.getDate() + currentUser.defaultSalesDueDateOffset);
        } else {
            const defaultSalesDueDateOffset = 30; 
            baseDateForDue.setDate(baseDateForDue.getDate() + defaultSalesDueDateOffset);
        }
        setDueDate(getLocalDateYYYYMMDD(baseDateForDue));
        
        setSelectedPersonId(null);
        setCustomerSearchTerm('');
        
        if (newIsCompanyProfilePinned && currentUser?.defaultSalesCompanyProfileId && companyProfiles.find(cp => cp.id === currentUser!.defaultSalesCompanyProfileId)) {
            setSelectedCompanyProfileIdForInvoice(currentUser.defaultSalesCompanyProfileId);
        } else {
            setSelectedCompanyProfileIdForInvoice(companyProfiles.find(cp => cp.isDefault)?.id || (companyProfiles.length > 0 ? companyProfiles[0].id : undefined));
        }

        const newInitialItem = { ...initialLocalItemBase, id: Date.now().toString(), quantity: 1, unitPrice: 0 };
        newInitialItem.selectedPriceType = currentGlobalPriceTypeFromStorage;
        setItems([newInitialItem]);
        
        if (newIsDiscountTypePinned && currentUser?.defaultSalesDiscountType) {
            setDiscountType(currentUser.defaultSalesDiscountType);
            setDiscountValue(currentUser.defaultSalesDiscountValue ?? 0);
        } else {
            setDiscountType(null);
            setDiscountValue(0);
        }

        if (newIsTaxTypePinned && currentUser?.defaultSalesTaxType) {
            setTaxType(currentUser.defaultSalesTaxType);
            setTaxValue(currentUser.defaultSalesTaxValue ?? 0);
        } else {
            setTaxType(null);
            setTaxValue(0);
        }
        
        if (newIsInvoiceNotesPinned && currentUser?.defaultSalesInvoiceNotes) {
            setNotes(currentUser.defaultSalesInvoiceNotes);
        } else {
            setNotes('');
        }
        
        if (newIsPaymentStatusPinned && currentUser?.defaultSalesPaymentStatus) {
            setPaymentStatus(currentUser.defaultSalesPaymentStatus);
        } else {
            setPaymentStatus(InvoicePaymentStatus.PENDING);
        }

        setInitialPaidAmount('');
        if(newIsPaymentMethodPinned && currentUser?.defaultSalesPaymentMethod) {
            setInitialPaymentMethod(currentUser.defaultSalesPaymentMethod);
        } else {
            setInitialPaymentMethod('Cash');
        }
        if(newIsPaymentNotesPinned && currentUser?.defaultSalesPaymentNotes) {
            setInitialPaymentNotes(currentUser.defaultSalesPaymentNotes);
        } else {
            setInitialPaymentNotes('');
        }
    }
    
    const currentItemsListState = isEditingMode && editingInvoiceData ? editingInvoiceData.items : [{ ...initialLocalItemBase, id: Date.now().toString(), selectedPriceType: currentGlobalPriceTypeFromStorage }];
    setItemProductSuggestions(currentItemsListState.map(() => []));
    setShowItemProductSuggestionsDropdown(currentItemsListState.map(() => false));
    setActiveProductSuggestionIndex(null);
    setActiveCustomerSuggestionIndex(null);
    skipPhoneticConversionMapRef.current = {};
  }, [
    isEditingMode, editingInvoiceData, currentUser, persons, products, companyProfiles, generateInvoiceNumber
  ]); 


  useEffect(() => {
    if (isOpen) {
        const isAIPrefillSession = aiPreRenderData && !isEditingMode && !invoiceInitializedRef.current;

        if (isAIPrefillSession) {
            resetForm(); // Reset for new invoice before AI data
            if (aiPreRenderData!.customerName) {
                skipPhoneticConversionMapRef.current['customerSearch'] = true;
                setCustomerSearchTerm(aiPreRenderData!.customerName);
                const existingPerson = persons.find(p => (p.customAlias || p.name).toLowerCase() === aiPreRenderData!.customerName!.toLowerCase());
                if (existingPerson) setSelectedPersonId(existingPerson.id);
            }
            if (aiPreRenderData!.items && aiPreRenderData!.items.length > 0) {
                const currentGlobalPriceType = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE) as PriceType | null || 'mrp';
                const newItemsFromAI: LocalInvoiceItem[] = aiPreRenderData!.items.map((aiItem, idx) => {
                    const product = products.find(p => p.name.toLowerCase() === aiItem.productName.toLowerCase());
                    let unitPrice = aiItem.unitPrice || 0;
                    let selectedPriceType: PriceType = 'custom';
                    if (product) {
                        if (currentGlobalPriceType === 'mrp' && product.mrp !== undefined) { unitPrice = product.mrp; selectedPriceType = 'mrp'; }
                        else if (currentGlobalPriceType === 'wholesale' && product.wholesalePrice !== undefined) { unitPrice = product.wholesalePrice; selectedPriceType = 'wholesale'; }
                        else if (currentGlobalPriceType === 'sales' && product.unitPrice !== undefined) { unitPrice = product.unitPrice; selectedPriceType = 'sales'; }
                        else if (product.mrp !== undefined) { unitPrice = product.mrp; selectedPriceType = 'mrp'; }
                        else if (product.unitPrice !== undefined) { unitPrice = product.unitPrice; selectedPriceType = 'sales'; }
                    }
                    return { id: `ai_item_${Date.now()}_${idx}`, productName: aiItem.productName, description: '', quantity: aiItem.quantity || 1, unitPrice, total: (aiItem.quantity || 1) * unitPrice, unit: aiItem.unit || product?.unit || '', selectedPriceType, originalProductId: product?.id, availablePrices: product ? { sales: product.unitPrice, mrp: product.mrp, wholesale: product.wholesalePrice } : undefined };
                });
                setItems(newItemsFromAI.length > 0 ? newItemsFromAI : [{ ...initialLocalItemBase, id: Date.now().toString() }]);
            } else {
                 setItems([{ ...initialLocalItemBase, id: Date.now().toString() }]);
            }
            if (aiPreRenderData!.notes) {
                skipPhoneticConversionMapRef.current['notes'] = true;
                setNotes(aiPreRenderData!.notes);
            }
            invoiceInitializedRef.current = true;
            onAIInvoiceDataProcessed(); 
        } else if (!invoiceInitializedRef.current) {
            resetForm();
            invoiceInitializedRef.current = true;
        }
    } else {
        invoiceInitializedRef.current = false; 
    }
  }, [isOpen, aiPreRenderData, isEditingMode, editingInvoiceData, onAIInvoiceDataProcessed, resetForm, persons, products]);


  useEffect(() => {
    if (!isEditingMode && isDueDatePinned && currentUser?.defaultSalesDueDateOffset !== null && currentUser?.defaultSalesDueDateOffset !== undefined && invoiceDate) {
        const [year, month, day] = invoiceDate.split('-').map(Number);
        let baseDateForDue = new Date(year, month - 1, day);
        baseDateForDue.setDate(baseDateForDue.getDate() + currentUser.defaultSalesDueDateOffset);
        setDueDate(getLocalDateYYYYMMDD(baseDateForDue));
    }
  }, [invoiceDate, isDueDatePinned, currentUser?.defaultSalesDueDateOffset, isEditingMode]);


  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSubtotal(newSubtotal);

    let newDiscountAmount = 0;
    if (discountType === 'percentage' && discountValue > 0) {
      newDiscountAmount = (newSubtotal * discountValue) / 100;
    } else if (discountType === 'fixed' && discountValue > 0) {
      newDiscountAmount = discountValue;
    }
    newDiscountAmount = Math.max(0, Math.min(newDiscountAmount, newSubtotal));
    setDiscountAmount(newDiscountAmount);

    const taxableAmount = newSubtotal - newDiscountAmount;
    let newTaxAmount = 0;
    if (taxType === 'percentage' && taxValue > 0) {
      newTaxAmount = (taxableAmount * taxValue) / 100;
    } else if (taxType === 'fixed' && taxValue > 0) {
      newTaxAmount = taxValue;
    }
    setTaxAmount(newTaxAmount);

    setTotalAmount(taxableAmount + newTaxAmount);
  }, [items, discountType, discountValue, taxType, taxValue]);

  const handleItemFieldChange = (index: number, field: keyof LocalInvoiceItem, value: string | number, skipConversion?: boolean) => {
    const fieldKey = `${field}-${index}`; 
    if(skipConversion) skipPhoneticConversionMapRef.current[fieldKey] = true;

    const newItems = [...items];
    const item = newItems[index];
    
    if (field === 'productName' || field === 'description' || field === 'unit') {
        (item[field] as string) = value as string;
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'total') {
        const numValue = parseFloat(value as string);
        (item[field] as number) = isNaN(numValue) || numValue < 0 ? 0 : numValue;
        
        if (field === 'unitPrice' && item.selectedPriceType !== 'custom') {
            item.selectedPriceType = 'custom'; 
        }
        if (field === 'total' && item.selectedPriceType !== 'custom') { 
            item.selectedPriceType = 'custom';
        }
    }

    if (globalSelectedPriceType !== 'custom' || item.selectedPriceType !== 'custom') {
      if (field === 'quantity' || field === 'unitPrice') {
        item.total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      }
    }
    
    setItems(newItems);
  };

  const handleItemPriceTypeChange = (index: number, newType: PriceType) => {
    const newItems = [...items];
    const item = newItems[index];
    item.selectedPriceType = newType;

    if (newType === 'custom') {
        // User will edit unitPrice and total (if global custom is on)
    } else if (item.availablePrices) {
        let newUnitPrice: number | undefined;
        if (newType === 'sales') newUnitPrice = item.availablePrices.sales;
        else if (newType === 'mrp') newUnitPrice = item.availablePrices.mrp;
        else if (newType === 'wholesale') newUnitPrice = item.availablePrices.wholesale;
        
        item.unitPrice = newUnitPrice !== undefined ? newUnitPrice : (item.unitPrice || 0);
    }
    
    if (globalSelectedPriceType !== 'custom' || newType !== 'custom') {
        item.total = item.quantity * item.unitPrice;
    }
    setItems(newItems);
  };


  const handleItemProductNameChange = (index: number, value: string) => {
    const fieldKey = `productName-${index}`;
    if (skipPhoneticConversionMapRef.current[fieldKey]) {
        handleItemFieldChange(index, 'productName', value);
        skipPhoneticConversionMapRef.current[fieldKey] = false;
    } else {
        handleItemFieldChange(index, 'productName', value);
    }
    
    if (value.trim()) {
        const filtered = products.filter(p => 
            !p.isDeleted && p.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
        setItemProductSuggestions(prev => {
            const newSugg = [...prev];
            newSugg[index] = filtered;
            return newSugg;
        });
        setShowItemProductSuggestionsDropdown(prev => {
            const newShow = [...prev];
            newShow[index] = true;
            return newShow;
        });
        setActiveProductSuggestionIndex({ itemIndex: index, suggestionIndex: -1 });
    } else { 
        const newItems = [...items];
        const currentItem = newItems[index];
        currentItem.description = '';
        currentItem.unitPrice = 0;
        currentItem.total = 0;
        currentItem.unit = '';
        currentItem.selectedPriceType = globalSelectedPriceType === 'custom' ? 'custom' : (localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE) as PriceType | null || 'mrp');
        currentItem.originalProductId = undefined;
        currentItem.availablePrices = undefined;
        setItems(newItems);

        setItemProductSuggestions(prev => {
            const newSugg = [...prev];
            newSugg[index] = [];
            return newSugg;
        });
        setShowItemProductSuggestionsDropdown(prev => {
            const newShow = [...prev];
            newShow[index] = false;
            return newShow;
        });
        setActiveProductSuggestionIndex(null);
    }
  };

 const handleItemProductSuggestionClick = (index: number, product: Product) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    
    const productNameFieldKey = `productName-${index}`;
    const descriptionFieldKey = `description-${index}`;
    const unitFieldKey = `unit-${index}`;
    
    skipPhoneticConversionMapRef.current[productNameFieldKey] = true;
    
    const shortDescription = product.description || '';
    if (shortDescription) {
        skipPhoneticConversionMapRef.current[descriptionFieldKey] = true;
    }
    currentItem.description = shortDescription;
    
    currentItem.productName = product.name;

    if (product.unit) {
        skipPhoneticConversionMapRef.current[unitFieldKey] = true;
    }
    currentItem.unit = product.unit || '';
    
    currentItem.originalProductId = product.id;
    currentItem.availablePrices = {
      sales: product.unitPrice,
      mrp: product.mrp,
      wholesale: product.wholesalePrice,
    };

    let priceToSet = 0;
    let priceTypeToSet: PriceType = 'custom';

    const productHasMrp = product.mrp !== undefined && product.mrp !== null;
    const productHasWholesale = product.wholesalePrice !== undefined && product.wholesalePrice !== null;
    const productHasSales = product.unitPrice !== undefined && product.unitPrice !== null;

    if (globalSelectedPriceType === 'mrp' && productHasMrp) {
        priceToSet = product.mrp!; priceTypeToSet = 'mrp';
    } else if (globalSelectedPriceType === 'wholesale' && productHasWholesale) {
        priceToSet = product.wholesalePrice!; priceTypeToSet = 'wholesale';
    } else if (globalSelectedPriceType === 'sales' && productHasSales) {
        priceToSet = product.unitPrice!; priceTypeToSet = 'sales';
    } else if (globalSelectedPriceType === 'custom') {
        if (productHasMrp) priceToSet = product.mrp!;
        else if (productHasWholesale) priceToSet = product.wholesalePrice!;
        else if (productHasSales) priceToSet = product.unitPrice!;
        priceTypeToSet = 'custom';
    } else { 
        if (productHasMrp) { priceToSet = product.mrp!; priceTypeToSet = 'mrp'; }
        else if (productHasWholesale) { priceToSet = product.wholesalePrice!; priceTypeToSet = 'wholesale'; }
        else if (productHasSales) { priceToSet = product.unitPrice!; priceTypeToSet = 'sales'; }
        else { priceToSet = 0; priceTypeToSet = 'custom'; }
    }
    
    currentItem.unitPrice = priceToSet;
    currentItem.selectedPriceType = priceTypeToSet;
    currentItem.total = currentItem.quantity * currentItem.unitPrice;
    
    setItems(newItems);

    setItemProductSuggestions(prev => { const newSugg = [...prev]; newSugg[index] = []; return newSugg; });
    setShowItemProductSuggestionsDropdown(prev => { const newShow = [...prev]; newShow[index] = false; return newShow; });
    setActiveProductSuggestionIndex(null);
    
    itemQuantityRefs.current[index]?.focus();
    itemQuantityRefs.current[index]?.select();
  };
  
  useEffect(() => {
    const handleClickOutsideItemProductSuggestions = (event: MouseEvent) => {
        itemProductSuggestionsRef.current.forEach((ref, index) => {
            if (ref && !ref.contains(event.target as Node) &&
                itemProductNameRefs.current[index] && !itemProductNameRefs.current[index]?.contains(event.target as Node)) {
                setShowItemProductSuggestionsDropdown(prev => {
                    const newShow = [...prev];
                    if (newShow[index]) newShow[index] = false;
                    return newShow;
                });
            }
        });
    };
    if (showItemProductSuggestionsDropdown.some(s => s)) {
      document.addEventListener('mousedown', handleClickOutsideItemProductSuggestions);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideItemProductSuggestions);
  }, [showItemProductSuggestionsDropdown]);


  const checkAndFocusSaveButtonOrNext = (currentPersonId: string | null) => {
    // Check if main header fields are filled and total amount is positive
    if (
      invoiceNumber.trim() &&
      invoiceDate.trim() &&
      currentPersonId && // Make sure a person is actually selected/identified
      totalAmount > 0
    ) {
      saveButtonRef.current?.focus();
    } else if (items.length > 0 && itemProductNameRefs.current[0]) {
      itemProductNameRefs.current[0]?.focus();
    }
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTermRaw = e.target.value;
    if (skipPhoneticConversionMapRef.current['customerSearch']) {
        setCustomerSearchTerm(searchTermRaw);
        skipPhoneticConversionMapRef.current['customerSearch'] = false;
    } else {
        setCustomerSearchTerm(searchTermRaw);
    }
    
    setSelectedPersonId(null); 

    if (searchTermRaw.trim()) {
        const lowerSearch = searchTermRaw.toLowerCase();
        const filtered = persons.filter(p =>
            !p.isDeleted && (
            (p.customAlias && p.customAlias.toLowerCase().includes(lowerSearch)) ||
            p.name.toLowerCase().includes(lowerSearch) ||
            (p.mobileNumber && p.mobileNumber.includes(searchTermRaw)) 
            )
        ).slice(0, 5);
        setCustomerSuggestions(filtered);
        setShowCustomerSuggestionsDropdown(true);
        setActiveCustomerSuggestionIndex(-1); // Reset active index
    } else {
        setCustomerSuggestions([]);
        setShowCustomerSuggestionsDropdown(false);
        setActiveCustomerSuggestionIndex(null);
    }
  };

  const handleCustomerSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCustomerSuggestionsDropdown && customerSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveCustomerSuggestionIndex(prev => {
                const newIndex = prev === null || prev >= customerSuggestions.length -1 ? 0 : prev + 1;
                customerSuggestionsRef.current?.children[newIndex]?.scrollIntoView({ block: 'nearest' });
                return newIndex;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveCustomerSuggestionIndex(prev => {
                const newIndex = prev === null || prev <= 0 ? customerSuggestions.length - 1 : prev - 1;
                customerSuggestionsRef.current?.children[newIndex]?.scrollIntoView({ block: 'nearest' });
                return newIndex;
            });
        } else if (e.key === 'Enter') {
            if (activeCustomerSuggestionIndex !== null && activeCustomerSuggestionIndex >= 0 && activeCustomerSuggestionIndex < customerSuggestions.length) {
                e.preventDefault();
                handleCustomerSuggestionClick(customerSuggestions[activeCustomerSuggestionIndex]);
            } else { // Enter pressed on typed text without active suggestion
                e.preventDefault();
                setShowCustomerSuggestionsDropdown(false);
                setActiveCustomerSuggestionIndex(null);
                const trimmedSearch = customerSearchTerm.trim();
                if (trimmedSearch) {
                    const matchedPerson = persons.find(p =>
                        !p.isDeleted && (
                            (p.customAlias && p.customAlias.toLowerCase() === trimmedSearch.toLowerCase()) ||
                            p.name.toLowerCase() === trimmedSearch.toLowerCase() ||
                            (p.mobileNumber && p.mobileNumber === trimmedSearch)
                        )
                    );
                    if (matchedPerson) {
                        setSelectedPersonId(matchedPerson.id); // Update state
                        checkAndFocusSaveButtonOrNext(matchedPerson.id); // Perform check
                    } else {
                         if (items.length > 0 && itemProductNameRefs.current[0]) {
                           itemProductNameRefs.current[0]?.focus();
                         }
                    }
                } else {
                     if (items.length > 0 && itemProductNameRefs.current[0]) {
                       itemProductNameRefs.current[0]?.focus();
                     }
                }
            }
        } else if (e.key === 'Escape') {
            setShowCustomerSuggestionsDropdown(false);
            setActiveCustomerSuggestionIndex(null);
        }
    } else if (e.key === 'Enter') {  // No suggestions dropdown visible
        e.preventDefault();
        setShowCustomerSuggestionsDropdown(false);
        setActiveCustomerSuggestionIndex(null);
        const trimmedSearch = customerSearchTerm.trim();
        let personFound = false;
        if (trimmedSearch) {
            const matchedPerson = persons.find(p =>
                !p.isDeleted && (
                    (p.customAlias && p.customAlias.toLowerCase() === trimmedSearch.toLowerCase()) ||
                    p.name.toLowerCase() === trimmedSearch.toLowerCase() ||
                    (p.mobileNumber && p.mobileNumber === trimmedSearch)
                )
            );
            if (matchedPerson) {
                setSelectedPersonId(matchedPerson.id);
                checkAndFocusSaveButtonOrNext(matchedPerson.id);
                personFound = true;
            }
        }
        if (!personFound) {
            if (items.length > 0 && itemProductNameRefs.current[0]) {
                itemProductNameRefs.current[0]?.focus();
            }
        }
    } else { 
        if (skipPhoneticConversionMapRef.current['customerSearch']) return;
        if (isGlobalPhoneticModeActive && e.key === ' ') {
            e.preventDefault();
            const inputElement = customerSearchInputRef.current || e.target as HTMLInputElement;
            const currentValue = inputElement.value;
            const selectionStart = inputElement.selectionStart || 0;
            let wordStart = selectionStart - 1;
            while(wordStart >=0 && currentValue[wordStart] !== ' ') wordStart--;
            wordStart++;
            const wordToConvert = currentValue.substring(wordStart, selectionStart);
            if (wordToConvert.trim()) {
                const convertedWord = convertToBanglaPhonetic(wordToConvert);
                const newValue = currentValue.substring(0, wordStart) + convertedWord + ' ' + currentValue.substring(selectionStart);
                setCustomerSearchTerm(newValue);
                setTimeout(() => {
                    const newCursorPos = wordStart + convertedWord.length + 1;
                    inputElement.setSelectionRange(newCursorPos, newCursorPos);
                },0);
            } else {
                const newValue = currentValue.substring(0, selectionStart) + ' ' + currentValue.substring(selectionStart);
                setCustomerSearchTerm(newValue);
                setTimeout(() => { inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);},0);
            }
            setShowCustomerSuggestionsDropdown(false);
            setActiveCustomerSuggestionIndex(null);
        }
    }
  };

  const handleCustomerSearchPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (skipPhoneticConversionMapRef.current['customerSearch']) {
        skipPhoneticConversionMapRef.current['customerSearch'] = false; return;
    }
    if (isGlobalPhoneticModeActive) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const convertedPastedText = convertToBanglaPhonetic(pastedText);
        const inputElement = customerSearchInputRef.current || e.target as HTMLInputElement;
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentValue = inputElement.value;
        const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
        setCustomerSearchTerm(newValue);
        setTimeout(() => {
            const newCursorPos = start + convertedPastedText.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        },0);
        setShowCustomerSuggestionsDropdown(false);
        setActiveCustomerSuggestionIndex(null);
    }
  };
  
  const handleCustomerSuggestionClick = (person: Person) => {
    skipPhoneticConversionMapRef.current['customerSearch'] = true;
    setCustomerSearchTerm(person.customAlias || person.name);
    setSelectedPersonId(person.id);
    setCustomerSuggestions([]);
    setShowCustomerSuggestionsDropdown(false);
    setActiveCustomerSuggestionIndex(null);
    checkAndFocusSaveButtonOrNext(person.id);
  };
  
  const handleSelectPersonFromModalCallback = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    if (person) {
        skipPhoneticConversionMapRef.current['customerSearch'] = true;
        setCustomerSearchTerm(person.customAlias || person.name);
        setSelectedPersonId(person.id);
        setCustomerSuggestions([]);
        setShowCustomerSuggestionsDropdown(false);
        setActiveCustomerSuggestionIndex(null);
        checkAndFocusSaveButtonOrNext(person.id);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSuggestionsRef.current && !customerSuggestionsRef.current.contains(event.target as Node) &&
          customerSearchInputRef.current && !customerSearchInputRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestionsDropdown(false);
        setActiveCustomerSuggestionIndex(null);
      }
    };
    if (showCustomerSuggestionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomerSuggestionsDropdown]);


  const makeItemFieldKeyDownHandler = (index: number, field: 'productName' | 'description' | 'unit', refArray: React.MutableRefObject<(HTMLInputElement | HTMLTextAreaElement | null)[]>) => 
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldKey = `${field}-${index}`;
    const currentItem = items[index];
    const isItemEffectivelyEmpty = !currentItem.productName.trim() && currentItem.total === 0;

    if (showItemProductSuggestionsDropdown[index] && itemProductSuggestions[index] && itemProductSuggestions[index].length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveProductSuggestionIndex(prev => {
          const newSuggestionIndex = prev?.itemIndex !== index || prev.suggestionIndex === null || prev.suggestionIndex >= itemProductSuggestions[index].length - 1 
            ? 0 
            : prev.suggestionIndex + 1;
          itemProductSuggestionsRef.current[index]?.children[newSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
          return { itemIndex: index, suggestionIndex: newSuggestionIndex };
        });
        return; 
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveProductSuggestionIndex(prev => {
          const newSuggestionIndex = prev?.itemIndex !== index || prev.suggestionIndex === null || prev.suggestionIndex <= 0
            ? itemProductSuggestions[index].length - 1
            : prev.suggestionIndex - 1;
          itemProductSuggestionsRef.current[index]?.children[newSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
          return { itemIndex: index, suggestionIndex: newSuggestionIndex };
        });
        return;
      } else if (e.key === 'Enter') {
        if (activeProductSuggestionIndex?.itemIndex === index && activeProductSuggestionIndex.suggestionIndex >= 0 && activeProductSuggestionIndex.suggestionIndex < itemProductSuggestions[index].length) {
          e.preventDefault();
          handleItemProductSuggestionClick(index, itemProductSuggestions[index][activeProductSuggestionIndex.suggestionIndex]);
        } else { 
            e.preventDefault();
            if(isItemEffectivelyEmpty && index === items.length -1) { 
                handleSave(); 
                return; 
            }
            if (index === items.length - 1) { addItem(); } 
            else { itemProductNameRefs.current[index + 1]?.focus(); }
        }
        return;
      } else if (e.key === 'Escape') {
        setShowItemProductSuggestionsDropdown(prev => { const newShow = [...prev]; newShow[index] = false; return newShow; });
        setActiveProductSuggestionIndex(null);
        return;
      }
    }


    if (e.key === 'Enter') {
        e.preventDefault();
        if (isItemEffectivelyEmpty && index === items.length -1) { 
            handleSave(); 
            return;
        }

        const focusOrder: (keyof SalesColumnVisibility)[] = ['productName', 'description', 'quantity', 'unitPrice', 'totalPrice', 'unit'];
        const visibleFocusOrder = focusOrder.filter(f => columnVisibility[f] || f === 'productName'); 
        
        const currentFocusIndex = visibleFocusOrder.indexOf(field as keyof SalesColumnVisibility);
        let nextFocusIndex = currentFocusIndex + 1;
        
        while(nextFocusIndex < visibleFocusOrder.length && !columnVisibility[visibleFocusOrder[nextFocusIndex] as keyof SalesColumnVisibility]) {
            nextFocusIndex++;
        }

        if (nextFocusIndex < visibleFocusOrder.length) {
            const nextFieldToFocus = visibleFocusOrder[nextFocusIndex];
            let targetRef: HTMLInputElement | HTMLTextAreaElement | null = null;
            if (nextFieldToFocus === 'quantity') targetRef = itemQuantityRefs.current[index];
            else if (nextFieldToFocus === 'totalPrice') targetRef = itemTotalRefs.current[index];
            else if (nextFieldToFocus === 'unitPrice') targetRef = itemUnitPriceRefs.current[index];
            else if (nextFieldToFocus === 'unit') targetRef = itemUnitRefs.current[index];
            else if (nextFieldToFocus === 'description') targetRef = itemDescriptionRefs.current[index];
            
            if(targetRef) { targetRef.focus(); if(targetRef instanceof HTMLInputElement || targetRef instanceof HTMLTextAreaElement) (targetRef as any).select?.(); }
        } else { 
            if (index === items.length - 1) addItem();
            else {
               const nextProductNameInput = itemProductNameRefs.current[index + 1];
               if(nextProductNameInput) {nextProductNameInput.focus(); nextProductNameInput.select();}
            }
        }
        return; 
    }


    if (skipPhoneticConversionMapRef.current[fieldKey]) return;

    if (isGlobalPhoneticModeActive && e.key === ' ') {
        if(field === 'productName' && showItemProductSuggestionsDropdown[index]){
            return; 
        }
        e.preventDefault();
        const inputElement = refArray.current[index] || e.target as HTMLInputElement | HTMLTextAreaElement;
        const currentValue = inputElement.value;
        const selectionStart = inputElement.selectionStart || 0;

        let wordStart = selectionStart - 1;
        while(wordStart >=0 && currentValue[wordStart] !== ' ') wordStart--;
        wordStart++;
        
        const wordToConvert = currentValue.substring(wordStart, selectionStart);
        if (wordToConvert.trim()) {
            const convertedWord = convertToBanglaPhonetic(wordToConvert);
            const newValue = currentValue.substring(0, wordStart) + convertedWord + ' ' + currentValue.substring(selectionStart);
            handleItemFieldChange(index, field, newValue, true); 
            setTimeout(() => {
                const newCursorPos = wordStart + convertedWord.length + 1;
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            },0);
        } else {
             const newValue = currentValue.substring(0, selectionStart) + ' ' + currentValue.substring(selectionStart);
             handleItemFieldChange(index, field, newValue, true); 
             setTimeout(() => { inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);},0);
        }
    }
  };
  
  const makeItemNumericFieldKeyDownHandler = (
    index: number,
    currentFieldKey: keyof SalesColumnVisibility,
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentItem = items[index];
      const isItemEffectivelyEmpty = !currentItem.productName.trim() && currentItem.total === 0;
      if (isItemEffectivelyEmpty && index === items.length -1) { 
            handleSave(); 
            return;
      }

      const focusOrder: (keyof SalesColumnVisibility)[] = ['quantity', 'totalPrice', 'unitPrice', 'unit', 'description'];
      const visibleFocusOrder = focusOrder.filter(f => columnVisibility[f]);

      let currentVisibleIndex = visibleFocusOrder.indexOf(currentFieldKey);
      if (currentVisibleIndex === -1 && currentFieldKey === 'quantity' && columnVisibility.quantity) currentVisibleIndex = 0;

      let nextVisibleIndex = currentVisibleIndex + 1;
      
      if (nextVisibleIndex < visibleFocusOrder.length) {
          const nextFieldToFocus = visibleFocusOrder[nextVisibleIndex];
          let targetRef: HTMLInputElement | HTMLTextAreaElement | null = null;
          if (nextFieldToFocus === 'quantity') targetRef = itemQuantityRefs.current[index];
          else if (nextFieldToFocus === 'totalPrice') targetRef = itemTotalRefs.current[index];
          else if (nextFieldToFocus === 'unitPrice') targetRef = itemUnitPriceRefs.current[index];
          else if (nextFieldToFocus === 'unit') targetRef = itemUnitRefs.current[index];
          else if (nextFieldToFocus === 'description') targetRef = itemDescriptionRefs.current[index];
          
          if(targetRef) { 
            targetRef.focus(); 
            if(targetRef instanceof HTMLInputElement || targetRef instanceof HTMLTextAreaElement) {
              if (targetRef.type !== 'button' && targetRef.type !== 'submit' && targetRef.type !== 'reset' && targetRef.type !== 'hidden') {
                 (targetRef as HTMLInputElement | HTMLTextAreaElement).select();
              }
            }
          }
      } else { 
          if (index === items.length - 1) addItem();
          else {
            const nextProductNameInput = itemProductNameRefs.current[index + 1];
            if(nextProductNameInput) {nextProductNameInput.focus(); nextProductNameInput.select(); }
          }
      }
    }
  };


  const makeItemFieldPasteHandler = (index: number, field: 'productName' | 'description' | 'unit', refArray: React.MutableRefObject<(HTMLInputElement | HTMLTextAreaElement | null)[]>) => 
    (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldKey = `${field}-${index}`;
    if (skipPhoneticConversionMapRef.current[fieldKey]) {
        skipPhoneticConversionMapRef.current[fieldKey] = false; return;
    }
    if (isGlobalPhoneticModeActive) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const convertedPastedText = convertToBanglaPhonetic(pastedText);
        const inputElement = refArray.current[index] || e.target as HTMLInputElement | HTMLTextAreaElement;
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentValue = inputElement.value;
        const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
        handleItemFieldChange(index, field, newValue, true); 
        setTimeout(() => {
            const newCursorPos = start + convertedPastedText.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        },0);
    }
  };
  
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (skipPhoneticConversionMapRef.current['notes']) return;
    if (isGlobalPhoneticModeActive && e.key === ' ') {
        e.preventDefault();
        const inputElement = notesTextareaRef.current || e.target as HTMLTextAreaElement;
        const currentValue = inputElement.value;
        const selectionStart = inputElement.selectionStart || 0;
        let wordStart = selectionStart - 1;
        while(wordStart >=0 && currentValue[wordStart] !== ' ') wordStart--;
        wordStart++;
        const wordToConvert = currentValue.substring(wordStart, selectionStart);
        if (wordToConvert.trim()) {
            const convertedWord = convertToBanglaPhonetic(wordToConvert);
            const newValue = currentValue.substring(0, wordStart) + convertedWord + ' ' + currentValue.substring(selectionStart);
            setNotes(newValue);
            setTimeout(() => {
                const newCursorPos = wordStart + convertedWord.length + 1;
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            },0);
        } else {
             const newValue = currentValue.substring(0, selectionStart) + ' ' + currentValue.substring(selectionStart);
             setNotes(newValue);
             setTimeout(() => { inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);},0);
        }
    }
  };
  const handleNotesPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
     if (skipPhoneticConversionMapRef.current['notes']) {
        skipPhoneticConversionMapRef.current['notes'] = false; return;
    }
    if (isGlobalPhoneticModeActive) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const convertedPastedText = convertToBanglaPhonetic(pastedText);
        const inputElement = notesTextareaRef.current || e.target as HTMLTextAreaElement;
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentValue = inputElement.value;
        const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
        setNotes(newValue);
        setTimeout(() => {
            const newCursorPos = start + convertedPastedText.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        },0);
    }
  };
  const handlePaymentNotesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (skipPhoneticConversionMapRef.current['paymentNotes']) return;
    if (isGlobalPhoneticModeActive && e.key === ' ') {
        e.preventDefault();
        const inputElement = paymentNotesInputRef.current || e.target as HTMLInputElement;
        const currentValue = inputElement.value;
        const selectionStart = inputElement.selectionStart || 0;
        let wordStart = selectionStart - 1;
        while(wordStart >=0 && currentValue[wordStart] !== ' ') wordStart--;
        wordStart++;
        const wordToConvert = currentValue.substring(wordStart, selectionStart);
        if (wordToConvert.trim()) {
            const convertedWord = convertToBanglaPhonetic(wordToConvert);
            const newValue = currentValue.substring(0, wordStart) + convertedWord + ' ' + currentValue.substring(selectionStart);
            setInitialPaymentNotes(newValue);
            setTimeout(() => {
                const newCursorPos = wordStart + convertedWord.length + 1;
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            },0);
        } else {
             const newValue = currentValue.substring(0, selectionStart) + ' ' + currentValue.substring(selectionStart);
             setInitialPaymentNotes(newValue);
             setTimeout(() => { inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);},0);
        }
    }
  };
  const handlePaymentNotesPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
     if (skipPhoneticConversionMapRef.current['paymentNotes']) {
        skipPhoneticConversionMapRef.current['paymentNotes'] = false; return;
    }
    if (isGlobalPhoneticModeActive) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const convertedPastedText = convertToBanglaPhonetic(pastedText);
        const inputElement = paymentNotesInputRef.current || e.target as HTMLInputElement;
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentValue = inputElement.value;
        const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
        setInitialPaymentNotes(newValue);
        setTimeout(() => {
            const newCursorPos = start + convertedPastedText.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        },0);
    }
  };


  const addItem = () => {
    const newItemBase: Omit<LocalInvoiceItem, 'id'> = {
      ...initialLocalItemBase,
      quantity: 1, unitPrice: 0,
      selectedPriceType: globalSelectedPriceType === 'custom' ? 'custom' : (localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_GLOBAL_PRICE_TYPE) as PriceType | null || 'mrp'),
    };
    const newId = Date.now().toString();
    setItems(prevItems => [...prevItems, { ...newItemBase, id: newId }]);
    setItemProductSuggestions(prev => [...prev, []]);
    setShowItemProductSuggestionsDropdown(prev => [...prev, false]);
    
    requestAnimationFrame(() => {
        const newIndex = items.length; 
        if (itemProductNameRefs.current[newIndex]) {
          itemProductNameRefs.current[newIndex]?.focus();
        }
      });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setItemProductSuggestions(prev => prev.filter((_, i) => i !== index));
    setShowItemProductSuggestionsDropdown(prev => prev.filter((_, i) => i !== index));
  };


  const handleSave = async () => {
    let firstInvalidFieldRef: HTMLElement | null = null;

    if (!invoiceNumber.trim()) {
      addNotification(BN_UI_TEXT.INVOICE_NUMBER_LABEL + " " + BN_UI_TEXT.FIELD_IS_REQUIRED.toLowerCase(), 'error');
      if (!firstInvalidFieldRef && invoiceNumberInputRef.current) firstInvalidFieldRef = invoiceNumberInputRef.current;
    }
    if (!invoiceDate) {
      addNotification(BN_UI_TEXT.INVOICE_DATE_REQUIRED_ERROR, 'error');
      if (!firstInvalidFieldRef && invoiceDateInputRef.current) firstInvalidFieldRef = invoiceDateInputRef.current;
    }
    if (!selectedPersonId && !customerSearchTerm.trim()) {
      addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_REQUIRED_ERROR, 'error');
       if (!firstInvalidFieldRef && customerSearchInputRef.current) firstInvalidFieldRef = customerSearchInputRef.current;
    }
     if (totalAmount <= 0) { 
      addNotification(BN_UI_TEXT.INVOICE_TOTAL_MUST_BE_POSITIVE_ERROR, 'error');
      if (!firstInvalidFieldRef && items.length > 0 && itemQuantityRefs.current[0]) {
        firstInvalidFieldRef = itemQuantityRefs.current[0];
      }
    }
    
    const activeItems = items.filter(item =>
        item.productName.trim() !== '' || (item.description || '').trim() !== '' || (item.quantity || 0) > 0 || (item.unitPrice || 0) > 0
    );

    if (activeItems.length === 0) {
      addNotification(BN_UI_TEXT.INVOICE_NO_ITEMS_ERROR, 'error');
      if (!firstInvalidFieldRef && itemProductNameRefs.current[0]) {
        firstInvalidFieldRef = itemProductNameRefs.current[0];
      }
    }

    const invalidItemIndex = activeItems.findIndex(item =>
      (item.productName.trim() !== '') && ((item.quantity || 0) <= 0 || (item.unitPrice || 0) < 0)
    );

    if (invalidItemIndex !== -1) {
      addNotification(BN_UI_TEXT.INVOICE_ITEM_VALIDATION_ERROR, 'error');
      if (!firstInvalidFieldRef) {
        if (itemQuantityRefs.current[invalidItemIndex] && (activeItems[invalidItemIndex].quantity || 0) <= 0) {
            firstInvalidFieldRef = itemQuantityRefs.current[invalidItemIndex];
        } else if (itemUnitPriceRefs.current[invalidItemIndex] && (activeItems[invalidItemIndex].unitPrice || 0) < 0) {
            firstInvalidFieldRef = itemUnitPriceRefs.current[invalidItemIndex];
        } else if (itemProductNameRefs.current[invalidItemIndex]) {
            firstInvalidFieldRef = itemProductNameRefs.current[invalidItemIndex];
        }
      }
    }

    if (firstInvalidFieldRef === invoiceNumberInputRef.current && customerSearchInputRef.current) {
        firstInvalidFieldRef = customerSearchInputRef.current; 
    } else if (firstInvalidFieldRef === invoiceDateInputRef.current && customerSearchInputRef.current) {
        firstInvalidFieldRef = customerSearchInputRef.current;
    }


    if(firstInvalidFieldRef){
        firstInvalidFieldRef.focus();
        if (typeof (firstInvalidFieldRef as HTMLInputElement | HTMLTextAreaElement).select === 'function') {
          (firstInvalidFieldRef as HTMLInputElement | HTMLTextAreaElement).select();
        }
        return;
    }
    const itemsToSave = activeItems;


    let finalPersonId = selectedPersonId;
    if (!finalPersonId && customerSearchTerm.trim()) {
      const existingPerson = persons.find(p => (p.customAlias || p.name).toLowerCase() === customerSearchTerm.trim().toLowerCase());
      if (existingPerson) {
        finalPersonId = existingPerson.id;
      } else {
        try {
          const newPerson = await onPersonAdded({ name: customerSearchTerm.trim() });
          if (newPerson) {
            finalPersonId = newPerson.id;
            addNotification(BN_UI_TEXT.PERSON_ADDED_IMPLICITLY_INVOICE.replace("{personName}", customerSearchTerm.trim()).replace("{personType}", BN_UI_TEXT.PERSON_TYPE_CUSTOMER), 'success');
          } else {
            throw new Error("New person creation returned null");
          }
        } catch (error) {
          console.error("Error adding person implicitly:", error);
          addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_CREATION_ERROR, 'error');
          customerSearchInputRef.current?.focus();
          return;
        }
      }
    }

    if (!finalPersonId) {
      addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_REQUIRED_ERROR, 'error');
      customerSearchInputRef.current?.focus();
      return;
    }
    
    const invoiceData: InvoiceCreationData = {
      invoiceNumber,
      invoiceType: InvoiceType.SALES, 
      invoiceDate,
      dueDate: dueDate || undefined,
      personId: finalPersonId,
      companyProfileId: selectedCompanyProfileIdForInvoice,
      items: itemsToSave.map(({selectedPriceType, originalProductId, availablePrices, ...item}) => ({...item, originalProductId: originalProductId || undefined }) ), 
      subtotal,
      discountType: discountType || undefined,
      discountValue: discountValue || undefined,
      discountAmount: discountAmount || undefined,
      taxType: taxType || undefined,
      taxValue: taxValue || undefined,
      taxAmount: taxAmount || undefined,
      totalAmount,
      notes: notes.trim() || undefined,
      paymentStatus,
    };
    
    if (!isEditingMode) { 
        if (paymentStatus === InvoicePaymentStatus.PAID) {
            invoiceData.initialPayment = {
                paymentDate: new Date().toISOString(),
                amount: totalAmount, 
                paymentMethod: initialPaymentMethod, 
                notes: initialPaymentNotes.trim() || BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE,
            };
        } else if (paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID) {
            const paidAmountNum = parseFloat(initialPaidAmount);
            if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
                addNotification(BN_UI_TEXT.PAYMENT_AMOUNT_INVALID_FOR_PARTIAL, 'error');
                return;
            }
            if (paidAmountNum >= totalAmount) {
                addNotification(BN_UI_TEXT.PARTIAL_PAYMENT_CANT_BE_FULL, 'warning');
            }
            invoiceData.initialPayment = {
                paymentDate: new Date().toISOString(),
                amount: paidAmountNum,
                paymentMethod: initialPaymentMethod,
                notes: initialPaymentNotes.trim() || undefined,
            };
        }
    }

    
    onOpenConfirmationModal(
        BN_UI_TEXT.CONFIRM_CREATE_INVOICE_TITLE,
        BN_UI_TEXT.CONFIRM_CREATE_INVOICE_MSG,
        async () => { 
            const savedInvoice = await onSaveInvoice(invoiceData, editingInvoiceData?.id);
            if (savedInvoice) {
              addNotification(isEditingMode ? BN_UI_TEXT.INVOICE_UPDATED_SUCCESS : BN_UI_TEXT.INVOICE_CREATED_SUCCESS, 'success');
              
              if (!isEditingMode) { 
                if (currentUser) {
                    const updatesToProfile: Partial<User> = {};
                    if(isPaymentStatusPinned) updatesToProfile.defaultSalesPaymentStatus = paymentStatus;
                    if(isInvoiceDatePinned) {
                        const today = new Date(); today.setHours(0,0,0,0);
                        const invDateObj = new Date(invoiceDate); invDateObj.setHours(0,0,0,0);
                        updatesToProfile.defaultSalesInvoiceDateOffset = Math.round((invDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    }
                    if(isDueDatePinned && dueDate) {
                        const invDateObj = new Date(invoiceDate); invDateObj.setHours(0,0,0,0);
                        const dDateObj = new Date(dueDate); dDateObj.setHours(0,0,0,0);
                        updatesToProfile.defaultSalesDueDateOffset = Math.round((dDateObj.getTime() - invDateObj.getTime()) / (1000 * 60 * 60 * 24));
                    }
                    if(isCompanyProfilePinned) updatesToProfile.defaultSalesCompanyProfileId = selectedCompanyProfileIdForInvoice;
                    if(isDiscountTypePinned) {
                      (updatesToProfile as any).defaultSalesDiscountType = discountType; 
                      (updatesToProfile as any).defaultSalesDiscountValue = discountValue;
                    }
                    if(isTaxTypePinned) {
                      (updatesToProfile as any).defaultSalesTaxType = taxType; 
                      (updatesToProfile as any).defaultSalesTaxValue = taxValue;
                    }
                    if(isPaymentMethodPinned) updatesToProfile.defaultSalesPaymentMethod = initialPaymentMethod;
                    if(isPaymentNotesPinned) updatesToProfile.defaultSalesPaymentNotes = initialPaymentNotes.trim() || null;
                    if(isInvoiceNotesPinned) updatesToProfile.defaultSalesInvoiceNotes = notes.trim() || null;
                    
                    if(Object.keys(updatesToProfile).length > 0) {
                        await updateCurrentUserData(updatesToProfile as Partial<User>);
                    }
                }
                resetForm();
                invoiceInitializedRef.current = false; 
                requestAnimationFrame(() => {
                  if (itemProductNameRefs.current[0]) {
                    itemProductNameRefs.current[0]?.focus();
                  }
                });
              } else { 
                onClose(); 
              }
            }
        },
        BN_UI_TEXT.CONFIRM_BTN_YES_CREATE,
        BN_UI_TEXT.CONFIRM_BTN_COLOR_CREATE
    );
  };
  
  const modalDynamicTitle = isEditingMode ? BN_UI_TEXT.EDIT_INVOICE_MODAL_TITLE : BN_UI_TEXT.CREATE_SALES_INVOICE_MODAL_TITLE;
  const personLabel = BN_UI_TEXT.BILLED_TO_LABEL;
  const personSearchPlaceholder = BN_UI_TEXT.CUSTOMER_SEARCH_PLACEHOLDER;
  const selectPersonButtonTitle = BN_UI_TEXT.SELECT_CUSTOMER_BTN_LABEL;
  const saveButtonText = isEditingMode ? BN_UI_TEXT.SAVE_INVOICE_BTN_LABEL : BN_UI_TEXT.CREATE_INVOICE_BTN_LABEL;

  const showInitialPaymentFields = !isEditingMode && (paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID || paymentStatus === InvoicePaymentStatus.PAID);
  const isInitialPaidAmountReadOnly = !isEditingMode && paymentStatus === InvoicePaymentStatus.PAID;
  const shouldShowDueDate = paymentStatus === InvoicePaymentStatus.PENDING || paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID || paymentStatus === InvoicePaymentStatus.OVERDUE;


  const headerActions = (
    <button
        onClick={toggleFullScreen}
        className="text-slate-500 hover:text-teal-600 p-1.5 rounded-full hover:bg-teal-50 transition-colors"
        title={isFullScreen ? BN_UI_TEXT.RESTORE_MODAL_DEFAULT_SIZE : BN_UI_TEXT.EXPAND_MODAL_FULL_SCREEN}
        aria-label={isFullScreen ? BN_UI_TEXT.RESTORE_MODAL_DEFAULT_SIZE : BN_UI_TEXT.EXPAND_MODAL_FULL_SCREEN}
    >
        {isFullScreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
    </button>
  );

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={modalDynamicTitle} 
        size={isFullScreen ? "screen" : "3xl"}
        headerActions={headerActions}
    >
      <div className={`flex flex-col ${isFullScreen ? 'h-full' : ''}`}>
        <div className={`p-1 ${isFullScreen ? 'flex-grow overflow-y-auto custom-scrollbar-modal pr-2 pb-20' : 'space-y-4 pb-20'}`}>
          {/* Header Section - Row 1: Company Profile, Invoice Number, Invoice Date, Customer */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="companyProfile" className="block text-xs font-medium text-slate-600 mb-0.5">কোম্পানির প্রোফাইল (ঐচ্ছিক)</label>
                <div className="flex items-end">
                  <select id="companyProfile" value={selectedCompanyProfileIdForInvoice || ''} 
                          onChange={e => setSelectedCompanyProfileIdForInvoice(e.target.value || undefined)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white">
                    <option value="">-- সাধারণ ইনভয়েস --</option>
                    {companyProfiles.filter(cp => !cp.isDeleted).map(cp => (
                      <option key={cp.id} value={cp.id}>{cp.companyName}</option>
                    ))}
                  </select>
                  {!isEditingMode && <button type="button" onClick={toggleCompanyProfilePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isCompanyProfilePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isCompanyProfilePinned ? BN_UI_TEXT.UNPIN_COMPANY_PROFILE_DEFAULT : BN_UI_TEXT.PIN_COMPANY_PROFILE_DEFAULT}><PinIcon isFilled={isCompanyProfilePinned} /></button>}
                </div>
              </div>
              <div>
                <label htmlFor="invoiceNumber" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.INVOICE_NUMBER_LABEL}</label>
                <input ref={invoiceNumberInputRef} type="text" id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          invoiceDateInputRef.current?.focus();
                        }
                      }}
                      />
              </div>
              <div>
                <label htmlFor="invoiceDate" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.INVOICE_DATE_LABEL}</label>
                <div className="flex items-end">
                  <input 
                        ref={invoiceDateInputRef} 
                        type="date" 
                        id="invoiceDate" 
                        value={invoiceDate} 
                        onChange={e => setInvoiceDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white" 
                        required 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (shouldShowDueDate && dueDateInputRef.current) {
                                dueDateInputRef.current.focus();
                              } else if (items.length > 0 && itemProductNameRefs.current[0]) {
                                itemProductNameRefs.current[0]?.focus();
                              }
                            }
                        }}
                    />
                  {!isEditingMode && <button type="button" onClick={toggleInvoiceDatePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isInvoiceDatePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isInvoiceDatePinned ? BN_UI_TEXT.UNPIN_INVOICE_DATE_DEFAULT : BN_UI_TEXT.PIN_INVOICE_DATE_DEFAULT}><PinIcon isFilled={isInvoiceDatePinned} /></button>}
                </div>
              </div>
              <div className="relative">
                  <label htmlFor="customerSearch" className="block text-xs font-medium text-slate-600 mb-0.5">
                      {personLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                      <input
                          ref={customerSearchInputRef}
                          type="text"
                          id="customerSearch"
                          value={customerSearchTerm}
                          onChange={handleCustomerSearchChange}
                          onKeyDown={handleCustomerSearchKeyDown}
                          onPaste={handleCustomerSearchPaste}
                          onFocus={() => customerSearchTerm.trim() && setShowCustomerSuggestionsDropdown(true)}
                          placeholder={personSearchPlaceholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
                          autoComplete="off"
                      />
                      <button
                          type="button"
                          onClick={() => onOpenSelectPersonModal(handleSelectPersonFromModalCallback)}
                          className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          title={selectPersonButtonTitle}
                      >
                          <UsersIcon className="w-4 h-4" />
                      </button>
                  </div>
                  {showCustomerSuggestionsDropdown && (
                      <ul ref={customerSuggestionsRef} className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto custom-scrollbar-modal">
                          {customerSuggestions.length > 0 ? customerSuggestions.map((p, idx) => (
                              <li key={p.id} onClick={() => handleCustomerSuggestionClick(p)}
                                  className={`px-3 py-2 hover:bg-teal-50 cursor-pointer text-xs ${activeCustomerSuggestionIndex === idx ? 'bg-teal-100' : ''}`}
                                  onMouseEnter={() => setActiveCustomerSuggestionIndex(idx)}
                                  role="option"
                                  aria-selected={activeCustomerSuggestionIndex === idx}
                                >
                                  {p.customAlias || p.name} {p.mobileNumber && `(${p.mobileNumber})`}
                              </li>
                          )) : customerSearchTerm.trim() && (
                              <li className="px-3 py-2 text-xs text-slate-500">{BN_UI_TEXT.NO_CUSTOMER_SUGGESTIONS}</li>
                          )}
                      </ul>
                  )}
              </div>
          </section>
          
          <div className="relative z-10"> 
            <section className={`${isFullScreen ? '' : 'border-t pt-3 mt-3'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-md font-semibold text-slate-700 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.INVOICE_ITEMS_LABEL}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                          <button type="button" onClick={() => cycleFontSize('decrease')} title="ফন্ট ছোট করুন" className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50" disabled={itemSectionFontSize === 'xs'}>
                            <MinusIcon className="w-4 h-4"/>
                          </button>
                          <button type="button" onClick={() => handleFontSizeChange('sm')} title="ডিফল্ট ফন্ট" className="p-1 rounded hover:bg-slate-200 text-slate-600">
                            <ArrowUturnLeftIcon className="w-4 h-4"/>
                          </button>
                          <button type="button" onClick={() => cycleFontSize('increase')} title="ফন্ট বড় করুন" className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-50" disabled={itemSectionFontSize === '2xl'}>
                            <PlusIcon className="w-4 h-4"/>
                          </button>
                      </div>
                      <div className="relative">
                          <button
                          ref={columnSettingsButtonRef}
                          type="button"
                          onClick={() => setIsColumnSettingsOpen(prev => !prev)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-1 px-2.5 rounded-md flex items-center space-x-1"
                          title="কলাম সেটিংস"
                          aria-haspopup="true"
                          aria-expanded={isColumnSettingsOpen}
                          >
                          <CogIcon className="w-3.5 h-3.5" />
                          <span>কলাম</span>
                          </button>
                          {isColumnSettingsOpen && (
                          <div
                              ref={columnSettingsDropdownRef}
                              className="absolute right-0 mt-1 w-60 bg-white border border-slate-300 rounded-md shadow-lg z-30 py-1"
                              role="menu"
                          >
                              <div className="px-3 pt-2 pb-1 border-b">
                                  <p className="text-xs font-medium text-slate-500">কলাম দেখান/লুকান</p>
                              </div>
                              {salesColumnConfigs.map(({ key, label }) => (
                              <label key={key} className="flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs">
                                  <input
                                  type="checkbox"
                                  checked={columnVisibility[key]}
                                  onChange={() => handleColumnVisibilityChange(key)}
                                  className="form-checkbox h-3.5 w-3.5 text-teal-600 border-slate-400 rounded focus:ring-teal-500"
                                  />
                                  <span className="text-slate-700">{label}</span>
                              </label>
                              ))}
                              <div className="px-3 pt-2 pb-1 border-t mt-1">
                                  <p className="text-xs font-medium text-slate-500">ফন্ট সাইজ</p>
                              </div>
                              <div className="flex justify-around items-center px-3 py-1.5">
                                  <button onClick={() => handleFontSizeChange('xs')} title="ছোট" className={`p-1 rounded hover:bg-slate-100 ${itemSectionFontSize === 'xs' ? 'text-teal-600' : 'text-slate-500'}`}><MinusIcon className="w-4 h-4"/></button>
                                  <button onClick={() => handleFontSizeChange('sm')} title="ডিফল্ট" className={`p-1 rounded hover:bg-slate-100 ${itemSectionFontSize === 'sm' ? 'text-teal-600' : 'text-slate-500'}`}><ArrowUturnLeftIcon className="w-4 h-4"/></button>
                                  <button onClick={() => handleFontSizeChange('base')} title="বড়" className={`p-1 rounded hover:bg-slate-100 ${itemSectionFontSize === 'base' ? 'text-teal-600' : 'text-slate-500'}`}><PlusIcon className="w-4 h-4"/></button>
                                  <button onClick={() => handleFontSizeChange('lg')} title="আরও বড়" className={`p-1 rounded hover:bg-slate-100 ${itemSectionFontSize === 'lg' ? 'text-teal-600' : 'text-slate-500'}`}><PlusIcon className="w-5 h-5"/></button>
                                  <button onClick={() => handleFontSizeChange('xl')} title="সবচেয়ে বড়" className={`p-1 rounded hover:bg-slate-100 ${itemSectionFontSize === 'xl' ? 'text-teal-600' : 'text-slate-500'}`}><PlusIcon className="w-6 h-6"/></button>
                              </div>
                          </div>
                          )}
                      </div>
                      <button
                          type="button"
                          onClick={() => { 
                          onClose(); 
                          onOpenManageProductsModal(); 
                          }}
                          className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2.5 rounded-md flex items-center space-x-1"
                          title={BN_UI_TEXT.MANAGE_PRODUCTS_STOCK_NAV_BTN}
                      >
                          <CubeIcon className="w-3.5 h-3.5" />
                          <span>{BN_UI_TEXT.MANAGE_PRODUCTS_STOCK_NAV_BTN}</span>
                      </button>
                    </div>
                </div>
                <div className="p-3 bg-slate-100 rounded-md mb-3">
                    <label className={`block text-xs font-medium text-slate-600 mb-1.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PRICE_TYPE_LABEL} (ডিফল্ট)</label>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                        {(['mrp', 'wholesale', 'sales', 'custom'] as PriceType[]).map(pt => (
                            <label key={pt} className="flex items-center space-x-1 cursor-pointer">
                                <input type="radio" name="globalPriceType" value={pt} checked={globalSelectedPriceType === pt} 
                                      onChange={() => setGlobalSelectedPriceType(pt)}
                                      className="form-radio h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-slate-400"
                                />
                                <span className={`${globalSelectedPriceType === pt ? "text-teal-700 font-medium" : "text-slate-600"} ${getFontSizeClass('input')}`}>
                                    {pt === 'mrp' ? BN_UI_TEXT.PRICE_TYPE_MRP : 
                                    pt === 'wholesale' ? BN_UI_TEXT.PRICE_TYPE_WHOLESALE : 
                                    pt === 'sales' ? BN_UI_TEXT.PRICE_TYPE_SALES :
                                    BN_UI_TEXT.PRICE_TYPE_CUSTOM}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            <div className={`grid gap-x-2 items-end mb-1.5 print:hidden font-medium text-slate-600 ${getFontSizeClass('header')}`} style={dynamicGridStyle}>
              {salesColumnConfigs.map(config => (
                <div key={config.key} className={`${columnVisibility[config.key] ? '' : 'hidden'} ${config.headerTextAlign || 'text-left'}`}>
                    <label>{config.label}</label>
                </div>
              ))}
              <div className="text-center"><label>অপসারণ</label></div>
            </div>


            <div className={`space-y-3 mb-3 ${isFullScreen ? 'pr-1' : 'max-h-[65vh] overflow-y-auto custom-scrollbar-modal pr-1'}`}>
              {items.map((item, index) => {
                const isItemCustomPriceMode = globalSelectedPriceType === 'custom' && item.selectedPriceType === 'custom';
                let isUnitPriceReadOnly = false;
                isUnitPriceReadOnly = !isItemCustomPriceMode && item.selectedPriceType !== 'custom' && !!item.originalProductId && (
                    (item.selectedPriceType === 'mrp' && item.availablePrices?.mrp !== undefined) ||
                    (item.selectedPriceType === 'wholesale' && item.availablePrices?.wholesale !== undefined) ||
                    (item.selectedPriceType === 'sales' && item.availablePrices?.sales !== undefined)
                );

                return (
                <div key={item.id} className={`grid gap-x-2 gap-y-1 items-start py-2 border-b border-slate-100 group`} style={dynamicGridStyle}>
                  <div className={`relative ${columnVisibility.productName ? '' : 'hidden'}`}> 
                    <input
                      ref={el => { itemProductNameRefs.current[index] = el; }}
                      type="text" id={`item-name-${index}`} value={item.productName}
                      onChange={e => handleItemProductNameChange(index, e.target.value)}
                      onKeyDown={makeItemFieldKeyDownHandler(index, 'productName', itemProductNameRefs as any)}
                      onPaste={makeItemFieldPasteHandler(index, 'productName', itemProductNameRefs as any)}
                      onFocus={() => {
                        if(item.productName.trim()){
                          const filtered = products.filter(p => !p.isDeleted && p.name.toLowerCase().includes(item.productName.toLowerCase())).slice(0,5);
                          setItemProductSuggestions(prev => { const newSugg = [...prev]; newSugg[index] = filtered; return newSugg; });
                        } else {
                          setItemProductSuggestions(prev => { const newSugg = [...prev]; newSugg[index] = products.filter(p => !p.isDeleted).slice(0,5); return newSugg; });
                        }
                        setShowItemProductSuggestionsDropdown(prev => { const newShow = [...prev]; newShow[index] = true; return newShow; });
                        setActiveProductSuggestionIndex({ itemIndex: index, suggestionIndex: -1});
                      }}
                      className={`w-full px-3 py-1.5 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')} ${showItemProductSuggestionsDropdown[index] ? 'border-teal-500' : 'border-slate-300'}`}
                      placeholder={BN_UI_TEXT.PRODUCT_NAME_PLACEHOLDER} autoComplete="off"
                      aria-activedescendant={activeProductSuggestionIndex?.itemIndex === index && activeProductSuggestionIndex.suggestionIndex !== -1 ? `product-suggestion-${index}-${activeProductSuggestionIndex.suggestionIndex}` : undefined}
                    />
                    {showItemProductSuggestionsDropdown[index] && itemProductSuggestions[index] && itemProductSuggestions[index].length > 0 && (
                      <ul ref={el => { itemProductSuggestionsRef.current[index] = el; }} 
                          className="absolute z-30 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto custom-scrollbar-modal"
                          role="listbox">
                        {itemProductSuggestions[index].map((p, suggIdx) => (
                          <li key={p.id} 
                              id={`product-suggestion-${index}-${suggIdx}`}
                              onClick={() => handleItemProductSuggestionClick(index, p)}
                              onMouseDown={(e) => e.preventDefault()}
                              className={`px-3 py-2 hover:bg-teal-50 cursor-pointer ${getFontSizeClass('input')} ${activeProductSuggestionIndex?.itemIndex === index && activeProductSuggestionIndex.suggestionIndex === suggIdx ? 'bg-teal-100' : ''}`}
                              onMouseEnter={() => setActiveProductSuggestionIndex({itemIndex: index, suggestionIndex: suggIdx})}
                              role="option"
                              aria-selected={activeProductSuggestionIndex?.itemIndex === index && activeProductSuggestionIndex.suggestionIndex === suggIdx}
                            >
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={`${columnVisibility.description ? '' : 'hidden'}`}> 
                    <textarea
                        ref={el => { itemDescriptionRefs.current[index] = el; }}
                        id={`item-short-desc-${index}`} value={item.description}
                        onChange={e => handleItemFieldChange(index, 'description', e.target.value, skipPhoneticConversionMapRef.current[`description-${index}`])}
                        onKeyDown={makeItemFieldKeyDownHandler(index, 'description', itemDescriptionRefs as any)} 
                        onPaste={makeItemFieldPasteHandler(index, 'description', itemDescriptionRefs as any)}
                        placeholder={BN_UI_TEXT.ITEM_DESCRIPTION_PLACEHOLDER}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 resize-y ${getFontSizeClass('input')}`}
                        rows={1}
                    />
                  </div>
                  <div className={`${columnVisibility.quantity ? '' : 'hidden'}`}> 
                    <input ref={el => { itemQuantityRefs.current[index] = el; }} type="number" id={`item-quantity-${index}`} value={item.quantity} 
                           onChange={e => handleItemFieldChange(index, 'quantity', e.target.value)}
                           onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'quantity')} 
                           className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 min-w-20 text-right ${getFontSizeClass('input')}`} min="0" step="any" />
                  </div>
                  <div className={`relative ${columnVisibility.unitPrice ? '' : 'hidden'}`}> 
                    <input ref={el => { itemUnitPriceRefs.current[index] = el; }} type="number" id={`item-unitprice-${index}`} value={item.unitPrice} 
                          onChange={e => handleItemFieldChange(index, 'unitPrice', e.target.value)}
                          onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'unitPrice')} 
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 min-w-24 text-right ${getFontSizeClass('input')}`} 
                          min="0" step="any" 
                          readOnly={isUnitPriceReadOnly}
                          />
                    {item.originalProductId && (
                      <select value={item.selectedPriceType} 
                              onChange={(e) => handleItemPriceTypeChange(index, e.target.value as PriceType)}
                              className={`absolute right-1 bottom-1 text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 ${getFontSizeClass('input') === 'text-xs' ? 'text-[8px]' : getFontSizeClass('input') === 'text-base' ? 'text-[10px]' : 'text-[9px]'}`}>
                          <option value="mrp" disabled={item.availablePrices?.mrp === undefined || item.availablePrices?.mrp === null}>{BN_UI_TEXT.PRICE_TYPE_MRP} {item.availablePrices?.mrp === undefined || item.availablePrices?.mrp === null ? ` (${BN_UI_TEXT.PRICE_NOT_AVAILABLE})`:''}</option>
                          <option value="wholesale" disabled={item.availablePrices?.wholesale === undefined || item.availablePrices?.wholesale === null}>{BN_UI_TEXT.PRICE_TYPE_WHOLESALE} {item.availablePrices?.wholesale === undefined || item.availablePrices?.wholesale === null ? ` (${BN_UI_TEXT.PRICE_NOT_AVAILABLE})`:''}</option>
                          <option value="sales" disabled={item.availablePrices?.sales === undefined || item.availablePrices?.sales === null}>{BN_UI_TEXT.PRICE_TYPE_SALES} {item.availablePrices?.sales === undefined || item.availablePrices?.sales === null ? ` (${BN_UI_TEXT.PRICE_NOT_AVAILABLE})`:''}</option>
                          <option value="custom">{BN_UI_TEXT.PRICE_TYPE_CUSTOM}</option>
                      </select>
                    )}
                  </div>
                  <div className={`${columnVisibility.totalPrice ? '' : 'hidden'}`}> 
                    {isItemCustomPriceMode ? (
                      <input ref={el => { itemTotalRefs.current[index] = el; }} type="number" value={item.total} 
                             onChange={e => handleItemFieldChange(index, 'total', e.target.value)}
                             onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'totalPrice')} 
                             className={`w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 font-medium text-right focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} min="0" step="any"/>
                    ) : (
                      <input ref={el => { itemTotalRefs.current[index] = el; }} type="text" value={(item.total || 0).toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}
                             onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'totalPrice')} 
                             className={`w-full px-3 py-1.5 border-0 bg-slate-50 rounded-md text-slate-700 font-medium text-right ${getFontSizeClass('input')}`} readOnly />
                    )}
                  </div>
                  <div className={`${columnVisibility.unit ? '' : 'hidden'}`}> 
                      <input
                        ref={el => { itemUnitRefs.current[index] = el; }}
                        type="text" id={`item-unit-${index}`} value={item.unit || ''} 
                        onChange={e => handleItemFieldChange(index, 'unit', e.target.value, skipPhoneticConversionMapRef.current[`unit-${index}`])}
                        onKeyDown={makeItemFieldKeyDownHandler(index, 'unit', itemUnitRefs as any)} 
                        onPaste={makeItemFieldPasteHandler(index, 'unit', itemUnitRefs as any)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} 
                        placeholder="যেমন: পিস" list={`common-units-datalist-item-${index}`} />
                      <datalist id={`common-units-datalist-item-${index}`}>
                          {COMMON_UNITS_BN.map(u => <option key={u} value={u} />)}
                      </datalist>
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title={BN_UI_TEXT.REMOVE_ITEM_BTN_LABEL}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
            <button type="button" onClick={addItem}
                    className={`w-full text-teal-600 hover:text-teal-700 font-medium py-2 px-3 border-2 border-dashed border-teal-300 hover:border-teal-400 rounded-md flex items-center justify-center space-x-1.5 transition-colors ${getFontSizeClass('header')}`}>
              <PlusCircleIcon className="w-4 h-4" />
              <span>{BN_UI_TEXT.ADD_ITEM_BTN_LABEL}</span>
            </button>
          </div>

          <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${getFontSizeClass('input')} ${isFullScreen ? '' : 'mt-4 pt-3 border-t'}`}>
            <div className="space-y-3">
              <div className="flex items-end">
                  <div className="flex-grow">
                    <label htmlFor="discountType" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DISCOUNT_TYPE_LABEL}</label>
                    <select id="discountType" value={discountType || ''} 
                            onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed' || null)}
                            className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}>
                      <option value="">-- {BN_UI_TEXT.DISCOUNT_LABEL} নেই --</option>
                      <option value="percentage">{BN_UI_TEXT.DISCOUNT_PERCENTAGE_LABEL}</option>
                      <option value="fixed">{BN_UI_TEXT.DISCOUNT_FIXED_AMOUNT_LABEL}</option>
                    </select>
                  </div>
                  {!isEditingMode && <button type="button" onClick={toggleDiscountTypePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isDiscountTypePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isDiscountTypePinned ? BN_UI_TEXT.UNPIN_DISCOUNT_TYPE_DEFAULT : BN_UI_TEXT.PIN_DISCOUNT_TYPE_DEFAULT}><PinIcon isFilled={isDiscountTypePinned} /></button>}
              </div>
              {discountType && (
                <div>
                  <label htmlFor="discountValue" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DISCOUNT_LABEL} {discountType === 'percentage' ? '(%)' : `(${BN_UI_TEXT.BDT_SYMBOL})`}</label>
                  <input type="number" id="discountValue" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} min="0" step="any" />
                </div>
              )}
              <div className="flex items-end">
                  <div className="flex-grow">
                    <label htmlFor="taxType" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.TAX_TYPE_LABEL}</label>
                    <select id="taxType" value={taxType || ''} 
                            onChange={e => setTaxType(e.target.value as 'percentage' | 'fixed' || null)}
                            className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}>
                      <option value="">-- {BN_UI_TEXT.TAX_LABEL} নেই --</option>
                      <option value="percentage">{BN_UI_TEXT.TAX_PERCENTAGE_LABEL}</option>
                      <option value="fixed">{BN_UI_TEXT.TAX_FIXED_AMOUNT_LABEL}</option>
                    </select>
                  </div>
                  {!isEditingMode && <button type="button" onClick={toggleTaxTypePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isTaxTypePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isTaxTypePinned ? BN_UI_TEXT.UNPIN_TAX_TYPE_DEFAULT : BN_UI_TEXT.PIN_TAX_TYPE_DEFAULT}><PinIcon isFilled={isTaxTypePinned} /></button>}
              </div>
              {taxType && (
                <div>
                  <label htmlFor="taxValue" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.TAX_LABEL} {taxType === 'percentage' ? '(%)' : `(${BN_UI_TEXT.BDT_SYMBOL})`}</label>
                  <input type="number" id="taxValue" value={taxValue} onChange={e => setTaxValue(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} min="0" step="any" />
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1 text-right">
              <div className="flex justify-between"><span className="text-slate-600">{BN_UI_TEXT.SUBTOTAL_LABEL}:</span> <span className="font-medium">{BN_UI_TEXT.BDT_SYMBOL} {subtotal.toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-red-600"><span className="text-slate-600">{BN_UI_TEXT.DISCOUNT_LABEL} ({discountType === 'percentage' ? `${discountValue}%` : BN_UI_TEXT.BDT_SYMBOL + discountValue}):</span> <span className="font-medium">- {BN_UI_TEXT.BDT_SYMBOL} {discountAmount.toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between text-green-600"><span className="text-slate-600">{BN_UI_TEXT.TAX_LABEL} ({taxType === 'percentage' ? `${taxValue}%` : BN_UI_TEXT.BDT_SYMBOL + taxValue}):</span> <span className="font-medium">+ {BN_UI_TEXT.BDT_SYMBOL} {taxAmount.toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>}
              <div className="flex justify-between font-bold text-lg text-slate-800 border-t pt-1 mt-1"><span className="text-slate-700">{BN_UI_TEXT.GRAND_TOTAL_LABEL}:</span> <span>{BN_UI_TEXT.BDT_SYMBOL} {totalAmount.toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
            </div>
          </section>
          
          <section className="mt-4">
            <label htmlFor="invoiceNotes" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.NOTES_TERMS_LABEL}</label>
            <div className="flex items-end">
                <textarea
                ref={notesTextareaRef}
                id="invoiceNotes" value={notes} 
                onChange={e => {
                    if (skipPhoneticConversionMapRef.current['notes']) {
                        setNotes(e.target.value);
                        skipPhoneticConversionMapRef.current['notes'] = false;
                    } else {
                        setNotes(e.target.value);
                    }
                }}
                onKeyDown={handleNotesKeyDown}
                onPaste={handleNotesPaste}
                rows={isFullScreen ? 3 : 2} placeholder={BN_UI_TEXT.NOTES_TERMS_PLACEHOLDER}
                className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 resize-y ${getFontSizeClass('input')}`}
                />
                 {!isEditingMode && <button type="button" onClick={toggleInvoiceNotesPin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isInvoiceNotesPinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isInvoiceNotesPinned ? BN_UI_TEXT.UNPIN_DEFAULT : BN_UI_TEXT.PIN_TO_REMEMBER_AS_DEFAULT}><PinIcon isFilled={isInvoiceNotesPinned} /></button>}
            </div>
          </section>

          <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4 pt-3 border-t ${getFontSizeClass('input')}`}>
             <div>
                <label htmlFor="paymentStatus" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_STATUS_LABEL}</label>
                <div className="flex items-end">
                  <div className="flex-grow">
                      <select id="paymentStatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as InvoicePaymentStatus)}
                              className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}>
                          <option value={InvoicePaymentStatus.PENDING}>{BN_UI_TEXT.PAYMENT_STATUS_PENDING}</option>
                          <option value={InvoicePaymentStatus.PARTIALLY_PAID}>{BN_UI_TEXT.PAYMENT_STATUS_PARTIALLY_PAID}</option>
                          <option value={InvoicePaymentStatus.PAID}>{BN_UI_TEXT.PAYMENT_STATUS_PAID}</option>
                          <option value={InvoicePaymentStatus.OVERDUE}>{BN_UI_TEXT.PAYMENT_STATUS_OVERDUE}</option>
                          <option value={InvoicePaymentStatus.CANCELLED}>{BN_UI_TEXT.PAYMENT_STATUS_CANCELLED}</option>
                      </select>
                  </div>
                  {!isEditingMode && (
                    <button
                      type="button"
                      onClick={togglePaymentStatusPin}
                      className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400
                        ${isPaymentStatusPinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`}
                      title={isPaymentStatusPinned ? BN_UI_TEXT.UNPIN_DEFAULT : BN_UI_TEXT.PIN_TO_REMEMBER_AS_DEFAULT}
                    >
                      <PinIcon isFilled={isPaymentStatusPinned} />
                    </button>
                  )}
                </div>
              </div>
              {shouldShowDueDate && (
                <div className="flex items-end">
                    <div className="flex-grow">
                    <label htmlFor="dueDate" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DUE_DATE_INVOICE_LABEL}</label>
                    <input 
                        ref={dueDateInputRef}
                        type="date" 
                        id="dueDate" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                             if (items.length > 0 && itemProductNameRefs.current[0]) {
                                itemProductNameRefs.current[0]?.focus();
                              }
                          }
                        }}
                        />
                    </div>
                    {!isEditingMode && <button type="button" onClick={toggleDueDatePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isDueDatePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isDueDatePinned ? BN_UI_TEXT.UNPIN_DUE_DATE_DEFAULT : BN_UI_TEXT.PIN_DUE_DATE_DEFAULT}><PinIcon isFilled={isDueDatePinned} /></button>}
                </div>
              )}
          </section>
          
           {showInitialPaymentFields && (
             <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 mt-2 ${getFontSizeClass('input')}`}>
                  <div>
                      <label htmlFor="initialPaidAmount" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.INITIAL_PAID_AMOUNT_LABEL}</label>
                      <input 
                          type="number" 
                          id="initialPaidAmount" 
                          value={initialPaidAmount} 
                          onChange={e => setInitialPaidAmount(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')} ${isInitialPaidAmountReadOnly ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-300 bg-white'}`}
                          min="0.01" 
                          step="0.01" 
                          max={paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID && totalAmount > 0 ? totalAmount - 0.01 : undefined}
                          readOnly={isInitialPaidAmountReadOnly}
                      />
                  </div>
                  <div className="flex items-end">
                      <div className="flex-grow">
                          <label htmlFor="initialPaymentMethod" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_METHOD_LABEL}</label>
                          <select 
                              id="initialPaymentMethod" 
                              value={initialPaymentMethod} 
                              onChange={e => setInitialPaymentMethod(e.target.value as InvoicePaymentMethod)}
                              className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}
                          >
                              {(['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque', 'Other'] as InvoicePaymentMethod[]).map(method => (
                                  <option key={method} value={method}>{BN_UI_TEXT[`PAYMENT_METHOD_${method.toUpperCase().replace(' ', '_')}` as keyof typeof BN_UI_TEXT] || method}</option>
                              ))}
                          </select>
                      </div>
                      {!isEditingMode && <button type="button" onClick={togglePaymentMethodPin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isPaymentMethodPinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isPaymentMethodPinned ? BN_UI_TEXT.UNPIN_DEFAULT : BN_UI_TEXT.PIN_TO_REMEMBER_AS_DEFAULT}><PinIcon isFilled={isPaymentMethodPinned} /></button>}
                  </div>
                  <div className="md:col-span-2 flex items-end">
                      <div className="flex-grow">
                        <label htmlFor="initialPaymentNotes" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_NOTES_LABEL}</label>
                        <input 
                            ref={paymentNotesInputRef}
                            type="text" 
                            id="initialPaymentNotes" 
                            value={initialPaymentNotes} 
                            onChange={e => {
                                if(skipPhoneticConversionMapRef.current['paymentNotes']) {
                                    setInitialPaymentNotes(e.target.value);
                                    skipPhoneticConversionMapRef.current['paymentNotes'] = false;
                                } else {
                                    setInitialPaymentNotes(e.target.value);
                                }
                            }}
                            onKeyDown={handlePaymentNotesKeyDown}
                            onPaste={handlePaymentNotesPaste}
                            placeholder={BN_UI_TEXT.PAYMENT_NOTES_PLACEHOLDER}
                            className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} 
                        />
                      </div>
                       {!isEditingMode && <button type="button" onClick={togglePaymentNotesPin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isPaymentNotesPinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isPaymentNotesPinned ? BN_UI_TEXT.UNPIN_DEFAULT : BN_UI_TEXT.PIN_TO_REMEMBER_AS_DEFAULT}><PinIcon isFilled={isPaymentNotesPinned} /></button>}
                  </div>
              </section>
          )}
        </div>

        <div className={`pt-3 border-t bg-white rounded-b-xl
                         ${isFullScreen ? 'sticky bottom-0 left-0 right-0 z-10 px-4 pb-4 sm:px-6 sm:pb-5' : 'px-1'}
                         flex justify-end space-x-3`}>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
            {BN_UI_TEXT.CANCEL}
          </button>
          <button 
                ref={saveButtonRef}
                type="button" onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">
            {saveButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateInvoiceModal;
