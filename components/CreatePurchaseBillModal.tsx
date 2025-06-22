
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Invoice, InvoiceItem, InvoicePaymentStatus, Person, InvoicePaymentMethod, InvoiceCreationData, Product, CompanyProfile, InvoiceType, User } from '../types';
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


interface CreatePurchaseBillModalProps {
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
}

type PriceType = 'custom'; // Purchase price is always custom
type ItemSectionFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';


interface LocalInvoiceItem extends InvoiceItem {
  selectedPriceType: PriceType; 
  originalProductId?: string;
  availablePrices?: { // Not strictly needed for purchase but kept for consistency
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

interface PurchaseColumnVisibility {
  productName: boolean;
  quantity: boolean;
  total: boolean;
  unitPrice: boolean; // Purchase Price
  unit: boolean;
}

const defaultPurchaseColumnVisibility: PurchaseColumnVisibility = {
  productName: true,
  quantity: true,
  total: true,
  unitPrice: true,
  unit: true,
};

const purchaseColumnConfigs: { key: keyof PurchaseColumnVisibility; label: string; defaultGridSpan: string; headerTextAlign?: string; cellTextAlign?: string; }[] = [
  { key: 'productName', label: BN_UI_TEXT.PRODUCT_SERVICE_NAME_LABEL, defaultGridSpan: 'minmax(0, 2.5fr)', headerTextAlign: 'text-left', cellTextAlign: 'text-left' },
  { key: 'quantity', label: BN_UI_TEXT.QUANTITY_INVOICE_LABEL, defaultGridSpan: 'minmax(0, 0.8fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'total', label: BN_UI_TEXT.ITEM_TOTAL_LABEL, defaultGridSpan: 'minmax(0, 1fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'unitPrice', label: "একক মূল্য (ক্রয়)", defaultGridSpan: 'minmax(0, 1.2fr)', headerTextAlign: 'text-right', cellTextAlign: 'text-right' },
  { key: 'unit', label: BN_UI_TEXT.PRODUCT_UNIT_LABEL, defaultGridSpan: 'minmax(0, 0.8fr)', headerTextAlign: 'text-left', cellTextAlign: 'text-left' },
];


const CreatePurchaseBillModal: React.FC<CreatePurchaseBillModalProps> = ({
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
}) => {
  const { addNotification } = useNotification();
  const { currentUser, updateCurrentUserData } = useAuth();
  const isEditingMode = !!editingInvoiceData;
  const invoiceNumberInitializedRef = useRef(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierSuggestions, setSupplierSuggestions] = useState<Person[]>([]);
  const [showSupplierSuggestionsDropdown, setShowSupplierSuggestionsDropdown] = useState(false);
  const [selectedCompanyProfileIdForInvoice, setSelectedCompanyProfileIdForInvoice] = useState<string | undefined>(undefined);

  const [items, setItems] = useState<LocalInvoiceItem[]>([{ ...initialLocalItemBase, id: Date.now().toString() }]);
  
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<'percentage' | 'fixed' | null>(null);
  const [taxValue, setTaxValue] = useState<number>(0);
  
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>(InvoicePaymentStatus.PENDING);

  // Pin States
  const [isBillDatePinned, setIsBillDatePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_BILL_DATE) === 'true');
  const [isDueDatePinned, setIsDueDatePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_DUE_DATE) === 'true');
  const [isCompanyProfilePinned, setIsCompanyProfilePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_COMPANY_PROFILE) === 'true');
  const [isDiscountTypePinned, setIsDiscountTypePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_DISCOUNT_TYPE) === 'true');
  const [isTaxTypePinned, setIsTaxTypePinned] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_TAX_TYPE) === 'true');

  const [initialPaidAmount, setInitialPaidAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<InvoicePaymentMethod>('Cash');
  const [initialPaymentNotes, setInitialPaymentNotes] = useState('');

  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const supplierSearchInputRef = useRef<HTMLInputElement>(null);
  const supplierSuggestionsRef = useRef<HTMLUListElement>(null);
  
  const billNumberInputRef = useRef<HTMLInputElement>(null);
  const billDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null); // Ref for Due Date

  const itemProductNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemProductSuggestionsRef = useRef<(HTMLUListElement | null)[]>([]);
  const itemQuantityRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemUnitPriceRefs = useRef<(HTMLInputElement | null)[]>([]); // For Purchase Price
  const itemTotalRefs = useRef<(HTMLInputElement | null)[]>([]); // For Total
  const itemUnitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemDescriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const skipPhoneticConversionMapRef = useRef<{[key:string]: boolean}>({});
  const [itemProductSuggestions, setItemProductSuggestions] = useState<Product[][]>(() => items.map(() => []));
  const [showItemProductSuggestionsDropdown, setShowItemProductSuggestionsDropdown] = useState<boolean[]>(() => items.map(() => false));

  const [columnVisibility, setColumnVisibility] = useState<PurchaseColumnVisibility>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_COLUMN_VISIBILITY_PURCHASE_V1);
    try {
      return stored ? JSON.parse(stored) : defaultPurchaseColumnVisibility;
    } catch (e) {
      console.error("Failed to parse purchase column visibility from localStorage", e);
      return defaultPurchaseColumnVisibility;
    }
  });
  
  const [itemSectionFontSize, setItemSectionFontSize] = useState<ItemSectionFontSize>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICE_ITEM_FONT_SIZE_PURCHASE_V1) as ItemSectionFontSize | null) || 'sm';
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICE_COLUMN_VISIBILITY_PURCHASE_V1, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICE_ITEM_FONT_SIZE_PURCHASE_V1, itemSectionFontSize);
  }, [itemSectionFontSize]);

  const handleColumnVisibilityChange = (column: keyof PurchaseColumnVisibility) => {
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
    return sizeMap[itemSectionFontSize] || 'text-sm'; // Default to 'sm' if somehow invalid
  };


  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const columnSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const columnSettingsDropdownRef = useRef<HTMLDivElement>(null);
  
  const itemGridDynamicStyle = useMemo(() => {
      const visibleConfiguredSpans = purchaseColumnConfigs
          .filter(config => columnVisibility[config.key])
          .map(config => config.defaultGridSpan);
      
      const allSpans = [
          ...visibleConfiguredSpans,
          'minmax(0, 1.5fr)', // For the description textarea, which is always rendered in its own grid cell
          'auto' // For the remove button
      ];
      return { gridTemplateColumns: allSpans.join(' ') };
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
          updateCurrentUserData(updatesToProfile);
        }
      }
      return newPinState;
    });
  }, [currentUser, updateCurrentUserData, addNotification]);

  const toggleBillDatePin = useCallback(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const billDateObj = new Date(invoiceDate); billDateObj.setHours(0,0,0,0);
    const offset = Math.round((billDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    makePinToggleHandler(setIsBillDatePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_BILL_DATE, 'defaultPurchaseBillDateOffset', offset, undefined, undefined, BN_UI_TEXT.INVOICE_DATE_LABEL.replace("ইনভয়েস/বিলের", "বিলের"))();
  },[makePinToggleHandler, invoiceDate]);
  const toggleDueDatePin = useCallback(() => {
     if(invoiceDate && dueDate){
        const billDateObj = new Date(invoiceDate); billDateObj.setHours(0,0,0,0);
        const dDateObj = new Date(dueDate); dDateObj.setHours(0,0,0,0);
        const offset = Math.round((dDateObj.getTime() - billDateObj.getTime()) / (1000 * 60 * 60 * 24));
        makePinToggleHandler(setIsDueDatePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_DUE_DATE, 'defaultPurchaseDueDateOffset', offset, undefined, undefined, BN_UI_TEXT.DUE_DATE_INVOICE_LABEL)();
     } else {
        makePinToggleHandler(setIsDueDatePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_DUE_DATE, 'defaultPurchaseDueDateOffset', 0, undefined, undefined, BN_UI_TEXT.DUE_DATE_INVOICE_LABEL)(); // Default to 0 days offset
     }
  }, [makePinToggleHandler, invoiceDate, dueDate]);
  const toggleCompanyProfilePin = useCallback(() => makePinToggleHandler(setIsCompanyProfilePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_COMPANY_PROFILE, 'defaultPurchaseCompanyProfileId', selectedCompanyProfileIdForInvoice, undefined, undefined, "প্রাপক (কোম্পানি)")(),[makePinToggleHandler, selectedCompanyProfileIdForInvoice]);
  const toggleDiscountTypePin = useCallback(() => makePinToggleHandler(setIsDiscountTypePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_DISCOUNT_TYPE, 'defaultPurchaseDiscountType', discountType, 'defaultPurchaseDiscountValue', discountValue, BN_UI_TEXT.DISCOUNT_TYPE_LABEL)(), [makePinToggleHandler, discountType, discountValue]);
  const toggleTaxTypePin = useCallback(() => makePinToggleHandler(setIsTaxTypePinned, LOCAL_STORAGE_KEYS.PIN_PURCHASE_TAX_TYPE, 'defaultPurchaseTaxType', taxType, 'defaultPurchaseTaxValue', taxValue, BN_UI_TEXT.TAX_TYPE_LABEL)(), [makePinToggleHandler, taxType, taxValue]);


  useEffect(() => {
    if (paymentStatus !== InvoicePaymentStatus.PARTIALLY_PAID && paymentStatus !== InvoicePaymentStatus.PAID) { 
      setInitialPaidAmount('');
      setInitialPaymentMethod('Cash');
      setInitialPaymentNotes('');
    }
  }, [paymentStatus]);
  
  const getLocalDateYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateInvoiceNumber = useCallback(() => {
    const defaultCompany = companyProfiles.find(cp => cp.isDefault) || (companyProfiles.length > 0 ? companyProfiles[0] : null);
    const companyPrefix = defaultCompany?.companyName.substring(0,3).toUpperCase().replace(/\s/g, '') || "CMP";
    const typePrefix = "BILL";
    const personTypePrefix = "SUPP";
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${typePrefix}-${companyPrefix}-${personTypePrefix}${year}${month}${day}-${randomSuffix}`;
  }, [companyProfiles]);

 const resetForm = useCallback(() => {
    // Load pin states directly from localStorage
    const newIsBillDatePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_BILL_DATE) === 'true';
    const newIsDueDatePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_DUE_DATE) === 'true';
    const newIsCompanyProfilePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_COMPANY_PROFILE) === 'true';
    const newIsDiscountTypePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_DISCOUNT_TYPE) === 'true';
    const newIsTaxTypePinned = localStorage.getItem(LOCAL_STORAGE_KEYS.PIN_PURCHASE_TAX_TYPE) === 'true';

    setIsBillDatePinned(newIsBillDatePinned);
    setIsDueDatePinned(newIsDueDatePinned);
    setIsCompanyProfilePinned(newIsCompanyProfilePinned);
    setIsDiscountTypePinned(newIsDiscountTypePinned);
    setIsTaxTypePinned(newIsTaxTypePinned);

    if (isEditingMode && editingInvoiceData) {
        setInvoiceNumber(editingInvoiceData.invoiceNumber);
        invoiceNumberInitializedRef.current = true;

        const editBillDate = new Date(editingInvoiceData.invoiceDate);
        setInvoiceDate(getLocalDateYYYYMMDD(new Date(editBillDate.getUTCFullYear(), editBillDate.getUTCMonth(), editBillDate.getUTCDate())));
        
        if (editingInvoiceData.dueDate) {
            const editDueDate = new Date(editingInvoiceData.dueDate);
            setDueDate(getLocalDateYYYYMMDD(new Date(editDueDate.getUTCFullYear(), editDueDate.getUTCMonth(), editDueDate.getUTCDate())));
        } else {
            setDueDate('');
        }
        
        const supplier = persons.find(p => p.id === editingInvoiceData.personId);
        if (supplier) {
            setSelectedPersonId(supplier.id);
            setSupplierSearchTerm(supplier.customAlias || supplier.name);
        } else {
            setSelectedPersonId(null);
            setSupplierSearchTerm('');
        }
        setSelectedCompanyProfileIdForInvoice(editingInvoiceData.companyProfileId);

        const loadedItems: LocalInvoiceItem[] = editingInvoiceData.items.map(item => ({
            ...item,
            unit: item.unit || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            selectedPriceType: 'custom', 
            originalProductId: products.find(p => p.name === item.productName || (p.id && item.originalProductId === p.id))?.id,
        }));
        setItems(loadedItems.length > 0 ? loadedItems : [{ ...initialLocalItemBase, id: Date.now().toString() }]);
        
        setDiscountType(editingInvoiceData.discountType || null);
        setDiscountValue(editingInvoiceData.discountValue || 0);
        setTaxType(editingInvoiceData.taxType || null);
        setTaxValue(editingInvoiceData.taxValue || 0);
        setNotes(editingInvoiceData.notes || '');
        setPaymentStatus(editingInvoiceData.paymentStatus);
        
        setInitialPaidAmount('');
        setInitialPaymentMethod('Cash');
        setInitialPaymentNotes('');
    } else { 
        let baseDateForBill = new Date(); // Local today
        if (newIsBillDatePinned && currentUser?.defaultPurchaseBillDateOffset !== null && currentUser?.defaultPurchaseBillDateOffset !== undefined) {
            baseDateForBill.setDate(baseDateForBill.getDate() + currentUser.defaultPurchaseBillDateOffset);
        }
        const tempBillDateString = getLocalDateYYYYMMDD(baseDateForBill);
        setInvoiceDate(tempBillDateString);

        const [year, month, day] = tempBillDateString.split('-').map(Number);
        let baseDateForDue = new Date(year, month - 1, day); // Local date from tempBillDateString
        
        if (newIsDueDatePinned && currentUser?.defaultPurchaseDueDateOffset !== null && currentUser?.defaultPurchaseDueDateOffset !== undefined) {
            baseDateForDue.setDate(baseDateForDue.getDate() + currentUser.defaultPurchaseDueDateOffset);
            setDueDate(getLocalDateYYYYMMDD(baseDateForDue));
        } else {
             // Default: Due date is same as bill date for purchases, or empty
            setDueDate(getLocalDateYYYYMMDD(baseDateForDue)); 
        }
        
        if (newIsCompanyProfilePinned && currentUser?.defaultPurchaseCompanyProfileId && companyProfiles.find(cp => cp.id === currentUser!.defaultPurchaseCompanyProfileId)) {
            setSelectedCompanyProfileIdForInvoice(currentUser.defaultPurchaseCompanyProfileId);
        } else {
            const defaultCompany = companyProfiles.find(cp => cp.isDefault) || (companyProfiles.length > 0 ? companyProfiles[0] : null);
            setSelectedCompanyProfileIdForInvoice(defaultCompany?.id);
        }

        if (!invoiceNumberInitializedRef.current) {
            setInvoiceNumber(generateInvoiceNumber());
            invoiceNumberInitializedRef.current = true;
        }
        
        setSelectedPersonId(null);
        setSupplierSearchTerm('');
        
        setItems([{ ...initialLocalItemBase, id: Date.now().toString(), selectedPriceType: 'custom', unit: '' }]);
        
        if (newIsDiscountTypePinned && currentUser?.defaultPurchaseDiscountType) {
            setDiscountType(currentUser.defaultPurchaseDiscountType);
            setDiscountValue(currentUser.defaultPurchaseDiscountValue ?? 0);
        } else {
            setDiscountType(null);
            setDiscountValue(0);
        }

        if (newIsTaxTypePinned && currentUser?.defaultPurchaseTaxType) {
            setTaxType(currentUser.defaultPurchaseTaxType);
            setTaxValue(currentUser.defaultPurchaseTaxValue ?? 0);
        } else {
            setTaxType(null);
            setTaxValue(0);
        }
        
        setNotes('');
        setPaymentStatus(InvoicePaymentStatus.PENDING); 
        setInitialPaidAmount('');
        setInitialPaymentMethod('Cash');
        setInitialPaymentNotes('');
    }
    const currentItemsListState = isEditingMode && editingInvoiceData ? editingInvoiceData.items : [{ ...initialLocalItemBase, id: Date.now().toString() }];
    setItemProductSuggestions(currentItemsListState.map(() => []));
    setShowItemProductSuggestionsDropdown(currentItemsListState.map(() => false));
    skipPhoneticConversionMapRef.current = {};
  }, [
    isEditingMode, editingInvoiceData, currentUser, persons, products, companyProfiles, generateInvoiceNumber
  ]); 

  useEffect(() => {
    if (isOpen) {
        resetForm();
    } else {
        invoiceNumberInitializedRef.current = false; 
        setInvoiceNumber(''); 
    }
  }, [isOpen, resetForm]); 

  useEffect(() => {
      // If creating a new bill and due date is pinned, calculate based on bill date
      if (!isEditingMode && isDueDatePinned && currentUser?.defaultPurchaseDueDateOffset !== null && currentUser?.defaultPurchaseDueDateOffset !== undefined && invoiceDate) {
          const [year, month, day] = invoiceDate.split('-').map(Number);
          let baseDateForDue = new Date(year, month - 1, day); // Local date from invoiceDate string
          baseDateForDue.setDate(baseDateForDue.getDate() + currentUser.defaultPurchaseDueDateOffset);
          setDueDate(getLocalDateYYYYMMDD(baseDateForDue));
      }
  }, [invoiceDate, isDueDatePinned, currentUser?.defaultPurchaseDueDateOffset, isEditingMode]);

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
    }
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
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
    } else { 
        const newItems = [...items];
        const currentItem = newItems[index];
        currentItem.description = '';
        currentItem.unitPrice = 0;
        currentItem.total = 0;
        currentItem.unit = '';
        currentItem.selectedPriceType = 'custom';
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
    }
  };

 const handleItemProductSuggestionClick = (index: number, product: Product) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    
    const productNameFieldKey = `productName-${index}`;
    const descriptionFieldKey = `description-${index}`;
    const unitFieldKey = `unit-${index}`;
    
    skipPhoneticConversionMapRef.current[productNameFieldKey] = true;
    if (product.description) {
        skipPhoneticConversionMapRef.current[descriptionFieldKey] = true;
    }
    if (product.unit) {
        skipPhoneticConversionMapRef.current[unitFieldKey] = true;
    }

    currentItem.productName = product.name;
    currentItem.description = product.description || '';
    currentItem.unit = product.unit || '';
    
    currentItem.originalProductId = product.id;
    currentItem.availablePrices = { 
      sales: product.unitPrice,
      mrp: product.mrp,
      wholesale: product.wholesalePrice,
    };

    // For purchase bills, we prompt for purchase price.
    // We can prefill with wholesale if available, otherwise 0 or last purchase price (not implemented here).
    currentItem.unitPrice = product.wholesalePrice ?? 0; // Prefill with wholesale, or 0. User must confirm.
    currentItem.selectedPriceType = 'custom'; 
    
    currentItem.total = currentItem.quantity * currentItem.unitPrice;
    
    setItems(newItems);

    setItemProductSuggestions(prev => { const newSugg = [...prev]; newSugg[index] = []; return newSugg; });
    setShowItemProductSuggestionsDropdown(prev => { const newShow = [...prev]; newShow[index] = false; return newShow; });
    
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


  const handleSupplierSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTermRaw = e.target.value;
    if (skipPhoneticConversionMapRef.current['supplierSearch']) {
        setSupplierSearchTerm(searchTermRaw);
        skipPhoneticConversionMapRef.current['supplierSearch'] = false;
    } else {
        setSupplierSearchTerm(searchTermRaw);
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
        setSupplierSuggestions(filtered);
        setShowSupplierSuggestionsDropdown(true);
    } else {
        setSupplierSuggestions([]);
        setShowSupplierSuggestionsDropdown(false);
    }
  };

  const handleSupplierSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSupplierSuggestionsDropdown && supplierSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
           // Handle ArrowDown
        } else if (e.key === 'ArrowUp') {
           // Handle ArrowUp
        } else if (e.key === 'Enter') {
            if (false /* Replace with actual check if a suggestion is active */) {
                // handleSupplierSuggestionClick(...)
            } else {
                e.preventDefault();
                setShowSupplierSuggestionsDropdown(false);
                // setActiveSupplierSuggestionIndex(null); // If you implement active index
                if (items.length > 0 && itemProductNameRefs.current[0]) {
                   itemProductNameRefs.current[0]?.focus();
                }
            }
        } else if (e.key === 'Escape') {
             setShowSupplierSuggestionsDropdown(false);
             // setActiveSupplierSuggestionIndex(null);
        }
    } else if (e.key === 'Enter') { 
        e.preventDefault();
        setShowSupplierSuggestionsDropdown(false);
        // setActiveSupplierSuggestionIndex(null);
        if (items.length > 0 && itemProductNameRefs.current[0]) {
            itemProductNameRefs.current[0]?.focus();
        }
    } else { // Default phonetic handling if not a special key for dropdown
        if (skipPhoneticConversionMapRef.current['supplierSearch']) return;
        if (isGlobalPhoneticModeActive && e.key === ' ') {
            e.preventDefault();
            const inputElement = supplierSearchInputRef.current || e.target as HTMLInputElement;
            const currentValue = inputElement.value;
            const selectionStart = inputElement.selectionStart || 0;
            let wordStart = selectionStart - 1;
            while(wordStart >=0 && currentValue[wordStart] !== ' ') wordStart--;
            wordStart++;
            const wordToConvert = currentValue.substring(wordStart, selectionStart);
            if (wordToConvert.trim()) {
                const convertedWord = convertToBanglaPhonetic(wordToConvert);
                const newValue = currentValue.substring(0, wordStart) + convertedWord + ' ' + currentValue.substring(selectionStart);
                setSupplierSearchTerm(newValue);
                setTimeout(() => {
                    const newCursorPos = wordStart + convertedWord.length + 1;
                    inputElement.setSelectionRange(newCursorPos, newCursorPos);
                },0);
            } else {
                const newValue = currentValue.substring(0, selectionStart) + ' ' + currentValue.substring(selectionStart);
                setSupplierSearchTerm(newValue);
                setTimeout(() => { inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);},0);
            }
            setShowSupplierSuggestionsDropdown(false);
        }
    }
  };

  const handleSupplierSearchPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (skipPhoneticConversionMapRef.current['supplierSearch']) {
        skipPhoneticConversionMapRef.current['supplierSearch'] = false; return;
    }
    if (isGlobalPhoneticModeActive) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const convertedPastedText = convertToBanglaPhonetic(pastedText);
        const inputElement = supplierSearchInputRef.current || e.target as HTMLInputElement;
        const start = inputElement.selectionStart || 0;
        const end = inputElement.selectionEnd || 0;
        const currentValue = inputElement.value;
        const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
        setSupplierSearchTerm(newValue);
        setTimeout(() => {
            const newCursorPos = start + convertedPastedText.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
        },0);
        setShowSupplierSuggestionsDropdown(false);
    }
  };
  
  const handleSupplierSuggestionClick = (person: Person) => {
    skipPhoneticConversionMapRef.current['supplierSearch'] = true;
    setSupplierSearchTerm(person.customAlias || person.name);
    setSelectedPersonId(person.id);
    setSupplierSuggestions([]);
    setShowSupplierSuggestionsDropdown(false);
    // Focus first item's product name instead of bill date
    if (items.length > 0 && itemProductNameRefs.current[0]) {
        itemProductNameRefs.current[0]?.focus();
    } else {
        billDateInputRef.current?.focus(); // Fallback if no items
    }
  };
  
  const handleSelectPersonFromModalCallback = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    if (person) {
        skipPhoneticConversionMapRef.current['supplierSearch'] = true;
        setSupplierSearchTerm(person.customAlias || person.name);
        setSelectedPersonId(person.id);
        setSupplierSuggestions([]);
        setShowSupplierSuggestionsDropdown(false);
        // Focus first item's product name after selecting from modal
        if (items.length > 0 && itemProductNameRefs.current[0]) {
          itemProductNameRefs.current[0]?.focus();
        }
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierSuggestionsRef.current && !supplierSuggestionsRef.current.contains(event.target as Node) &&
          supplierSearchInputRef.current && !supplierSearchInputRef.current.contains(event.target as Node)) {
        setShowSupplierSuggestionsDropdown(false);
      }
    };
    if (showSupplierSuggestionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSupplierSuggestionsDropdown]);


  const makeItemFieldKeyDownHandler = (index: number, field: 'productName' | 'unit' | 'description', refArray: React.MutableRefObject<(HTMLInputElement | HTMLTextAreaElement | null)[]>) => 
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldKey = `${field}-${index}`;
    if (skipPhoneticConversionMapRef.current[fieldKey]) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const focusOrder: (keyof PurchaseColumnVisibility | 'description')[] = ['productName', 'quantity', 'total', 'unitPrice', 'unit', 'description'];
            const visibleFocusOrder = focusOrder.filter(f => f === 'description' || columnVisibility[f as keyof PurchaseColumnVisibility] || f === 'productName');
            
            const currentFocusIndex = visibleFocusOrder.indexOf(field);
            let nextFocusIndex = currentFocusIndex + 1;
            
            while(nextFocusIndex < visibleFocusOrder.length && visibleFocusOrder[nextFocusIndex] !== 'description' && !columnVisibility[visibleFocusOrder[nextFocusIndex] as keyof PurchaseColumnVisibility]) {
                nextFocusIndex++;
            }

            if (nextFocusIndex < visibleFocusOrder.length) {
                const nextFieldToFocus = visibleFocusOrder[nextFocusIndex];
                let targetRef: HTMLInputElement | HTMLTextAreaElement | null = null;
                if (nextFieldToFocus === 'quantity') targetRef = itemQuantityRefs.current[index];
                else if (nextFieldToFocus === 'total') targetRef = itemTotalRefs.current[index];
                else if (nextFieldToFocus === 'unitPrice') targetRef = itemUnitPriceRefs.current[index];
                else if (nextFieldToFocus === 'unit') targetRef = itemUnitRefs.current[index];
                else if (nextFieldToFocus === 'description') targetRef = itemDescriptionRefs.current[index];
                
                if(targetRef) { targetRef.focus(); if(targetRef instanceof HTMLInputElement || targetRef instanceof HTMLTextAreaElement) (targetRef as any).select?.(); }
            } else {
                 if (index === items.length - 1) addItem();
                 else itemProductNameRefs.current[index + 1]?.focus();
            }
        }
        return;
    }

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
    } else if (e.key === 'Enter') { 
        e.preventDefault();
        const focusOrder: (keyof PurchaseColumnVisibility | 'description')[] = ['productName', 'quantity', 'total', 'unitPrice', 'unit', 'description'];
        const visibleFocusOrder = focusOrder.filter(f => f === 'description' || columnVisibility[f as keyof PurchaseColumnVisibility] || f === 'productName');
        
        const currentFocusIndex = visibleFocusOrder.indexOf(field);
        let nextFocusIndex = currentFocusIndex + 1;
        
        while(nextFocusIndex < visibleFocusOrder.length && visibleFocusOrder[nextFocusIndex] !== 'description' && !columnVisibility[visibleFocusOrder[nextFocusIndex] as keyof PurchaseColumnVisibility]) {
            nextFocusIndex++;
        }

        if (nextFocusIndex < visibleFocusOrder.length) {
            const nextFieldToFocus = visibleFocusOrder[nextFocusIndex];
            let targetRef: HTMLInputElement | HTMLTextAreaElement | null = null;
            if (nextFieldToFocus === 'quantity') targetRef = itemQuantityRefs.current[index];
            else if (nextFieldToFocus === 'total') targetRef = itemTotalRefs.current[index];
            else if (nextFieldToFocus === 'unitPrice') targetRef = itemUnitPriceRefs.current[index];
            else if (nextFieldToFocus === 'unit') targetRef = itemUnitRefs.current[index];
            else if (nextFieldToFocus === 'description') targetRef = itemDescriptionRefs.current[index];
            
            if(targetRef) { targetRef.focus(); if(targetRef instanceof HTMLInputElement || targetRef instanceof HTMLTextAreaElement) (targetRef as any).select?.(); }
        } else {
            if (index === items.length - 1) addItem();
            else itemProductNameRefs.current[index + 1]?.focus();
        }
    }
  };
  
  const makeItemNumericFieldKeyDownHandler = (
    index: number,
    currentFieldKey: keyof PurchaseColumnVisibility,
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const focusOrder: (keyof PurchaseColumnVisibility | 'description')[] = ['quantity', 'total', 'unitPrice', 'unit', 'description'];
      const visibleFocusOrder = focusOrder.filter(f => f === 'description' || columnVisibility[f as keyof PurchaseColumnVisibility]);

      let currentVisibleIndex = visibleFocusOrder.indexOf(currentFieldKey);
      if (currentVisibleIndex === -1 && currentFieldKey === 'quantity' && columnVisibility.quantity) currentVisibleIndex = 0;
      
      let nextVisibleIndex = currentVisibleIndex + 1;
      
      if (nextVisibleIndex < visibleFocusOrder.length) {
          const nextFieldToFocus = visibleFocusOrder[nextVisibleIndex];
          let targetRef: HTMLInputElement | HTMLTextAreaElement | null = null;
          if (nextFieldToFocus === 'quantity') targetRef = itemQuantityRefs.current[index];
          else if (nextFieldToFocus === 'total') targetRef = itemTotalRefs.current[index];
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


  const addItem = () => {
    const newItemBase: Omit<LocalInvoiceItem, 'id'> = {
      ...initialLocalItemBase,
      selectedPriceType: 'custom', // For purchase, price is always custom
      unit: '', // Default unit or last used unit can be set here
    };
    const newId = Date.now().toString();
    setItems(prevItems => [...prevItems, { ...newItemBase, id: newId }]);
    setItemProductSuggestions(prev => [...prev, []]);
    setShowItemProductSuggestionsDropdown(prev => [...prev, false]);
    
    requestAnimationFrame(() => {
        const newIndex = items.length; // This will be the index of the newly added item *before* state update completes
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
      addNotification(BN_UI_TEXT.INVOICE_NUMBER_LABEL.replace("ইনভয়েস", "বিল") + " " + BN_UI_TEXT.FIELD_IS_REQUIRED.toLowerCase(), 'error');
      if (!firstInvalidFieldRef && billNumberInputRef.current) firstInvalidFieldRef = billNumberInputRef.current;
    }

    if (!selectedPersonId && !supplierSearchTerm.trim()) {
      addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_REQUIRED_ERROR.replace("গ্রাহক", "প্রেরক"), 'error');
      if (!firstInvalidFieldRef && supplierSearchInputRef.current) firstInvalidFieldRef = supplierSearchInputRef.current;
    }
    if (!invoiceDate) {
      addNotification(BN_UI_TEXT.INVOICE_DATE_REQUIRED_ERROR.replace("ইনভয়েস", "বিল"), 'error');
      if (!firstInvalidFieldRef && billDateInputRef.current) firstInvalidFieldRef = billDateInputRef.current;
    }
    
    const itemsToSave = items.filter(item => {
        const nameFilled = item.productName.trim() !== '';
        const quantityValid = (item.quantity || 0) > 0;
        const priceValid = (item.unitPrice || 0) >= 0; // Purchase price can be 0
        return nameFilled && quantityValid && priceValid;
    });

    if (itemsToSave.length === 0) {
      addNotification(BN_UI_TEXT.INVOICE_NO_ITEMS_ERROR.replace("ইনভয়েস", "বিল"), 'error');
      if (!firstInvalidFieldRef && itemProductNameRefs.current[0]) firstInvalidFieldRef = itemProductNameRefs.current[0];
    }

    if (firstInvalidFieldRef === billNumberInputRef.current && supplierSearchInputRef.current) {
        firstInvalidFieldRef = supplierSearchInputRef.current;
    } else if (firstInvalidFieldRef === billDateInputRef.current && supplierSearchInputRef.current) {
        firstInvalidFieldRef = supplierSearchInputRef.current;
    }


    if(firstInvalidFieldRef){
        firstInvalidFieldRef.focus();
        if (typeof (firstInvalidFieldRef as HTMLInputElement | HTMLTextAreaElement).select === 'function') {
          (firstInvalidFieldRef as HTMLInputElement | HTMLTextAreaElement).select();
        }
        return;
    }


    let finalPersonId = selectedPersonId;
    if (!finalPersonId && supplierSearchTerm.trim()) {
      const existingPerson = persons.find(p => (p.customAlias || p.name).toLowerCase() === supplierSearchTerm.trim().toLowerCase());
      if (existingPerson) {
        finalPersonId = existingPerson.id;
      } else {
        try {
          const newPerson = await onPersonAdded({ name: supplierSearchTerm.trim() });
          if (newPerson) {
            finalPersonId = newPerson.id;
            addNotification(BN_UI_TEXT.PERSON_ADDED_IMPLICITLY_INVOICE.replace("{personName}", supplierSearchTerm.trim()).replace("{personType}", BN_UI_TEXT.PERSON_TYPE_SUPPLIER), 'success');
          } else {
            throw new Error("New person creation returned null");
          }
        } catch (error) {
          console.error("Error adding person implicitly:", error);
          addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_CREATION_ERROR.replace("গ্রাহক", "প্রেরক"), 'error');
          return;
        }
      }
    }

    if (!finalPersonId) {
      addNotification(BN_UI_TEXT.INVOICE_CUSTOMER_REQUIRED_ERROR.replace("গ্রাহক", "প্রেরক"), 'error');
      return;
    }
    
    const invoiceData: InvoiceCreationData = {
      invoiceNumber,
      invoiceType: InvoiceType.PURCHASE, 
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
    
    if ((paymentStatus === InvoicePaymentStatus.PAID || paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID) && !isEditingMode) { 
        const paidAmountNum = parseFloat(initialPaidAmount);
        if (isNaN(paidAmountNum) || paidAmountNum <= 0) {
            if(paymentStatus === InvoicePaymentStatus.PAID && totalAmount > 0) {
                invoiceData.initialPayment = {
                    paymentDate: new Date().toISOString(),
                    amount: totalAmount, 
                    paymentMethod: initialPaymentMethod, 
                    notes: initialPaymentNotes.trim() || BN_UI_TEXT.AUTO_PAYMENT_NOTE_FOR_PAID_INVOICE.replace("চালান","বিল"),
                };
            } else if (paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID) {
                addNotification(BN_UI_TEXT.PAYMENT_AMOUNT_INVALID_FOR_PARTIAL, 'error');
                return;
            }
        } else {
             if (paidAmountNum >= totalAmount && paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID) {
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

    const savedInvoice = await onSaveInvoice(invoiceData, editingInvoiceData?.id);
    if (savedInvoice) {
      addNotification(isEditingMode ? BN_UI_TEXT.INVOICE_UPDATED_SUCCESS.replace("চালান", "বিল") : BN_UI_TEXT.INVOICE_CREATED_SUCCESS.replace("ইনভয়েস", "বিল"), 'success');
      
      if (!isEditingMode) {
        if (currentUser) {
            const updatesToProfile: Partial<User> = {};
            if(isBillDatePinned) {
                const today = new Date(); today.setHours(0,0,0,0);
                const billDateObj = new Date(invoiceDate); billDateObj.setHours(0,0,0,0);
                updatesToProfile.defaultPurchaseBillDateOffset = Math.round((billDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
            if(isDueDatePinned && dueDate) {
                const billDateObj = new Date(invoiceDate); billDateObj.setHours(0,0,0,0);
                const dDateObj = new Date(dueDate); dDateObj.setHours(0,0,0,0);
                updatesToProfile.defaultPurchaseDueDateOffset = Math.round((dDateObj.getTime() - billDateObj.getTime()) / (1000 * 60 * 60 * 24));
            }
            if(isCompanyProfilePinned) updatesToProfile.defaultPurchaseCompanyProfileId = selectedCompanyProfileIdForInvoice;
            if(isDiscountTypePinned) {
              (updatesToProfile as any).defaultPurchaseDiscountType = discountType;
              (updatesToProfile as any).defaultPurchaseDiscountValue = discountValue;
            }
            if(isTaxTypePinned) {
              (updatesToProfile as any).defaultPurchaseTaxType = taxType;
              (updatesToProfile as any).defaultPurchaseTaxValue = taxValue;
            }
            
            if(Object.keys(updatesToProfile).length > 0) {
                await updateCurrentUserData(updatesToProfile);
            }
        }
        resetForm(); 
        requestAnimationFrame(() => {
          if (itemProductNameRefs.current[0]) {
            itemProductNameRefs.current[0]?.focus();
          }
        });
      } else { 
        onClose(); 
      }
    }
  };
  
  const modalDynamicTitle = isEditingMode ? BN_UI_TEXT.EDIT_INVOICE_MODAL_TITLE.replace("চালান", "বিল") : BN_UI_TEXT.CREATE_PURCHASE_BILL_MODAL_TITLE;
  const personLabel = BN_UI_TEXT.SUPPLIER_LABEL; 
  const personSearchPlaceholder = BN_UI_TEXT.SUPPLIER_SEARCH_PLACEHOLDER; 
  const selectPersonButtonTitle = BN_UI_TEXT.SELECT_SUPPLIER_BTN_LABEL; 
  const saveButtonText = isEditingMode ? BN_UI_TEXT.SAVE_INVOICE_BTN_LABEL.replace("চালান", "বিল") : BN_UI_TEXT.CREATE_INVOICE_BTN_LABEL.replace("ইনভয়েস", "বিল");

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
    <Modal isOpen={isOpen} onClose={onClose} title={modalDynamicTitle} size={isFullScreen ? "screen" : "3xl"} headerActions={headerActions}>
      <div className={`flex flex-col ${isFullScreen ? 'h-full' : ''}`}>
        <div className={`p-1 ${isFullScreen ? 'flex-grow overflow-y-auto custom-scrollbar-modal pr-2 pb-20' : 'space-y-4 pb-20'}`}>
          
          {/* Header Section - Row 1: Recipient Company Profile, Bill Number, Bill Date, Supplier */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div>
                <label htmlFor="purchaseCompanyProfile" className="block text-xs font-medium text-slate-600 mb-0.5">প্রাপক (আপনার কোম্পানি)</label>
                <div className="flex items-end">
                  <select id="purchaseCompanyProfile" value={selectedCompanyProfileIdForInvoice || ''} 
                          onChange={e => setSelectedCompanyProfileIdForInvoice(e.target.value || undefined)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white">
                    <option value="">-- বিল আমার ব্যক্তিগত নামে --</option>
                    {companyProfiles.filter(cp => !cp.isDeleted).map(cp => (
                      <option key={cp.id} value={cp.id}>{cp.companyName}</option>
                    ))}
                  </select>
                  {!isEditingMode && <button type="button" onClick={toggleCompanyProfilePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isCompanyProfilePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isCompanyProfilePinned ? BN_UI_TEXT.UNPIN_COMPANY_PROFILE_DEFAULT : BN_UI_TEXT.PIN_COMPANY_PROFILE_DEFAULT}><PinIcon isFilled={isCompanyProfilePinned} /></button>}
                </div>
              </div>
              <div>
                <label htmlFor="billNumber" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.INVOICE_NUMBER_LABEL.replace("ইনভয়েস", "বিল")}</label>
                <input ref={billNumberInputRef} type="text" id="billNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          billDateInputRef.current?.focus();
                        }
                      }}
                      />
              </div>
              <div>
                <label htmlFor="billDate" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.INVOICE_DATE_LABEL.replace("ইনভয়েস/বিলের", "বিলের")}</label>
                <div className="flex items-end">
                    <input 
                        ref={billDateInputRef} 
                        type="date" 
                        id="billDate" 
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
                    {!isEditingMode && <button type="button" onClick={toggleBillDatePin} className={`ml-1.5 p-1.5 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 ${isBillDatePinned ? 'bg-teal-100 border-teal-300 text-teal-600 hover:bg-teal-200' : 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'}`} title={isBillDatePinned ? BN_UI_TEXT.UNPIN_INVOICE_DATE_DEFAULT : BN_UI_TEXT.PIN_INVOICE_DATE_DEFAULT}><PinIcon isFilled={isBillDatePinned} /></button>}
                </div>
              </div>
              <div className="relative">
                  <label htmlFor="supplierSearch" className="block text-xs font-medium text-slate-600 mb-0.5">
                      {personLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                      <input
                          ref={supplierSearchInputRef}
                          type="text"
                          id="supplierSearch"
                          value={supplierSearchTerm}
                          onChange={handleSupplierSearchChange}
                          onKeyDown={handleSupplierSearchKeyDown}
                          onPaste={handleSupplierSearchPaste}
                          onFocus={() => supplierSearchTerm.trim() && setShowSupplierSuggestionsDropdown(true)}
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
                  {showSupplierSuggestionsDropdown && (
                      <ul ref={supplierSuggestionsRef} className="absolute z-20 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto custom-scrollbar-modal">
                          {supplierSuggestions.length > 0 ? supplierSuggestions.map(p => (
                              <li key={p.id} onClick={() => handleSupplierSuggestionClick(p)}
                                  className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-xs">
                                  {p.customAlias || p.name} {p.mobileNumber && `(${p.mobileNumber})`}
                              </li>
                          )) : supplierSearchTerm.trim() && (
                              <li className="px-3 py-2 text-xs text-slate-500">{BN_UI_TEXT.NO_SUPPLIER_SUGGESTIONS}</li>
                          )}
                      </ul>
                  )}
              </div>
          </section>
          
           <div className="relative z-10"> {/* Item Entry Section Wrapper */}
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
                                {purchaseColumnConfigs.map(({ key, label }) => (
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
            </section>

            {/* Item Headers */}
            <div className={`grid gap-x-2 items-end mb-1.5 print:hidden font-medium text-slate-600 ${getFontSizeClass('header')}`} style={itemGridDynamicStyle}>
                {purchaseColumnConfigs.map(config => (
                    <div key={config.key} className={`${columnVisibility[config.key] ? '' : 'hidden'} ${config.headerTextAlign || 'text-left'}`}>
                        <label>{config.label}</label>
                    </div>
                ))}
                 <div className="text-left"><label>{BN_UI_TEXT.ITEM_DESCRIPTION_LABEL}</label></div>
                <div className="text-center"><label>অপসারণ</label></div>
            </div>

            <div className={`space-y-3 mb-3 ${isFullScreen ? 'pr-1' : 'max-h-[65vh] overflow-y-auto custom-scrollbar-modal pr-1'}`}>
             {items.map((item, index) => (
              <div key={item.id} className={`grid gap-x-2 gap-y-1 items-start py-2 border-b border-slate-100 group`} style={itemGridDynamicStyle}>
                {/* Product Name */}
                <div className={`relative ${columnVisibility.productName ? '' : 'hidden'}`}> 
                    <input
                      ref={el => { itemProductNameRefs.current[index] = el; }}
                      type="text" id={`purchase-item-name-${index}`} value={item.productName}
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
                      }}
                      className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`}
                      placeholder={BN_UI_TEXT.PRODUCT_NAME_PLACEHOLDER} autoComplete="off"
                    />
                    {showItemProductSuggestionsDropdown[index] && itemProductSuggestions[index] && itemProductSuggestions[index].length > 0 && (
                      <ul ref={el => { itemProductSuggestionsRef.current[index] = el; }} className="absolute z-30 w-full bg-white border border-slate-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto custom-scrollbar-modal">
                        {itemProductSuggestions[index].map(p => (
                          <li key={p.id} 
                              onClick={() => handleItemProductSuggestionClick(index, p)}
                              onMouseDown={(e) => e.preventDefault()}
                              className={`px-3 py-2 hover:bg-teal-50 cursor-pointer ${getFontSizeClass('input')}`}>
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Quantity */}
                  <div className={`${columnVisibility.quantity ? '' : 'hidden'}`}> 
                    <input ref={el => { itemQuantityRefs.current[index] = el; }} type="number" id={`purchase-item-quantity-${index}`} value={item.quantity} onChange={e => handleItemFieldChange(index, 'quantity', e.target.value)}
                           onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'quantity')}
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 min-w-20 text-right ${getFontSizeClass('input')}`} min="0" step="any" />
                  </div>
                  {/* Total */}
                  <div className={`${columnVisibility.total ? '' : 'hidden'}`}> 
                     <input ref={el => { itemTotalRefs.current[index] = el; }} type="number" value={item.total} 
                           onChange={e => handleItemFieldChange(index, 'total', e.target.value)}
                           onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'total')}
                           className={`w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-700 font-medium text-right focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} min="0" step="any"/>
                  </div>
                  {/* Unit Price (Purchase Price) */}
                  <div className={`${columnVisibility.unitPrice ? '' : 'hidden'}`}> 
                    <input ref={el => { itemUnitPriceRefs.current[index] = el; }} type="number" id={`purchase-item-unitprice-${index}`} value={item.unitPrice} 
                          onChange={e => handleItemFieldChange(index, 'unitPrice', e.target.value)}
                           onKeyDown={makeItemNumericFieldKeyDownHandler(index, 'unitPrice')}
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 min-w-24 text-right ${getFontSizeClass('input')}`} 
                          min="0" step="any" />
                  </div>
                  {/* Unit */}
                  <div className={`${columnVisibility.unit ? '' : 'hidden'}`}> 
                      <input
                        ref={el => { itemUnitRefs.current[index] = el; }}
                        type="text" id={`purchase-item-unit-${index}`} value={item.unit || ''} 
                        onChange={e => handleItemFieldChange(index, 'unit', e.target.value, skipPhoneticConversionMapRef.current[`unit-${index}`])}
                        onKeyDown={makeItemFieldKeyDownHandler(index, 'unit', itemUnitRefs as any)}
                        onPaste={makeItemFieldPasteHandler(index, 'unit', itemUnitRefs as any)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} 
                        placeholder="যেমন: পিস" list={`purchase-common-units-datalist-item-${index}`} />
                      <datalist id={`purchase-common-units-datalist-item-${index}`}>
                          {COMMON_UNITS_BN.map(u => <option key={u} value={u} />)}
                      </datalist>
                  </div>
                   {/* Item Description (for purchase bill, this is part of the grid) */}
                  <div className="col-span-1"> {/* Always visible as part of layout */}
                      <textarea
                          ref={el => { itemDescriptionRefs.current[index] = el; }}
                          id={`purchase-item-desc-${index}`} value={item.description}
                          onChange={e => handleItemFieldChange(index, 'description', e.target.value, skipPhoneticConversionMapRef.current[`description-${index}`])}
                          onKeyDown={makeItemFieldKeyDownHandler(index, 'description', itemDescriptionRefs as any)}
                          onPaste={makeItemFieldPasteHandler(index, 'description', itemDescriptionRefs as any)}
                          placeholder={BN_UI_TEXT.ITEM_DESCRIPTION_PLACEHOLDER}
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 resize-y ${getFontSizeClass('input')}`}
                          rows={1}
                      />
                  </div>
                 {/* Remove Button */}
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
        </div> {/* End Item Entry Section Wrapper */}


          {/* Totals Section */}
          <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${getFontSizeClass('input')} ${isFullScreen ? '' : 'mt-4 pt-3 border-t'}`}>
            <div className="space-y-3">
              <div className="flex items-end">
                  <div className="flex-grow">
                    <label htmlFor="purchaseDiscountType" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DISCOUNT_TYPE_LABEL}</label>
                    <select id="purchaseDiscountType" value={discountType || ''} 
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
                  <label htmlFor="purchaseDiscountValue" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DISCOUNT_LABEL} {discountType === 'percentage' ? '(%)' : `(${BN_UI_TEXT.BDT_SYMBOL})`}</label>
                  <input type="number" id="purchaseDiscountValue" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} min="0" step="any" />
                </div>
              )}
              <div className="flex items-end">
                  <div className="flex-grow">
                    <label htmlFor="purchaseTaxType" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.TAX_TYPE_LABEL}</label>
                    <select id="purchaseTaxType" value={taxType || ''} 
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
                  <label htmlFor="purchaseTaxValue" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.TAX_LABEL} {taxType === 'percentage' ? '(%)' : `(${BN_UI_TEXT.BDT_SYMBOL})`}</label>
                  <input type="number" id="purchaseTaxValue" value={taxValue} onChange={e => setTaxValue(parseFloat(e.target.value) || 0)}
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
          
          {/* Notes Section */}
          <section className="mt-4">
            <label htmlFor="purchaseBillNotes" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.NOTES_TERMS_LABEL}</label>
            <textarea
              ref={notesTextareaRef}
              id="purchaseBillNotes" value={notes} 
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
          </section>

          {/* Payment Status and Due Date - After Notes */}
          <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4 pt-3 border-t ${getFontSizeClass('input')}`}>
             <div>
                <label htmlFor="purchasePaymentStatus" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_STATUS_LABEL}</label>
                <div className="flex items-end">
                    <select id="purchasePaymentStatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as InvoicePaymentStatus)}
                            className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}>
                        <option value={InvoicePaymentStatus.PENDING}>{BN_UI_TEXT.PAYMENT_STATUS_PENDING}</option>
                        <option value={InvoicePaymentStatus.PARTIALLY_PAID}>{BN_UI_TEXT.PAYMENT_STATUS_PARTIALLY_PAID}</option>
                        <option value={InvoicePaymentStatus.PAID}>{BN_UI_TEXT.PAYMENT_STATUS_PAID}</option>
                        <option value={InvoicePaymentStatus.OVERDUE}>{BN_UI_TEXT.PAYMENT_STATUS_OVERDUE}</option>
                        <option value={InvoicePaymentStatus.CANCELLED}>{BN_UI_TEXT.PAYMENT_STATUS_CANCELLED}</option>
                    </select>
                </div>
              </div>
              {shouldShowDueDate && (
                <div className="flex items-end">
                    <div className="flex-grow">
                    <label htmlFor="purchaseDueDate" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.DUE_DATE_INVOICE_LABEL}</label>
                    <input 
                        ref={dueDateInputRef}
                        type="date" 
                        id="purchaseDueDate" 
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
          
          {/* Initial Payment Section (if applicable) */}
           {showInitialPaymentFields && (
             <section className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 mt-2 ${getFontSizeClass('input')}`}>
                  <div>
                      <label htmlFor="purchaseInitialPaidAmount" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.INITIAL_PAID_AMOUNT_LABEL}</label>
                      <input 
                          type="number" 
                          id="purchaseInitialPaidAmount" 
                          value={initialPaidAmount} 
                          onChange={e => setInitialPaidAmount(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')} ${isInitialPaidAmountReadOnly ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-300 bg-white'}`}
                          min="0.01" 
                          step="0.01" 
                          max={paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID && totalAmount > 0 ? totalAmount - 0.01 : undefined}
                          readOnly={isInitialPaidAmountReadOnly}
                      />
                  </div>
                  <div>
                      <label htmlFor="purchaseInitialPaymentMethod" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_METHOD_LABEL}</label>
                      <select 
                          id="purchaseInitialPaymentMethod" 
                          value={initialPaymentMethod} 
                          onChange={e => setInitialPaymentMethod(e.target.value as InvoicePaymentMethod)}
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white ${getFontSizeClass('input')}`}
                      >
                          {(['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque', 'Other'] as InvoicePaymentMethod[]).map(method => (
                              <option key={method} value={method}>{BN_UI_TEXT[`PAYMENT_METHOD_${method.toUpperCase().replace(' ', '_')}` as keyof typeof BN_UI_TEXT] || method}</option>
                          ))}
                      </select>
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="purchaseInitialPaymentNotes" className={`block text-xs font-medium text-slate-600 mb-0.5 ${getFontSizeClass('header')}`}>{BN_UI_TEXT.PAYMENT_NOTES_LABEL}</label>
                      <input 
                          type="text" 
                          id="purchaseInitialPaymentNotes" 
                          value={initialPaymentNotes} 
                          onChange={e => setInitialPaymentNotes(e.target.value)}
                          placeholder={BN_UI_TEXT.PAYMENT_NOTES_PLACEHOLDER}
                          className={`w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 ${getFontSizeClass('input')}`} 
                      />
                  </div>
              </section>
          )}
        </div>

        {/* Sticky Actions Footer */}
        <div className={`pt-3 border-t bg-white rounded-b-xl
                         ${isFullScreen ? 'sticky bottom-0 left-0 right-0 z-10 px-4 pb-4 sm:px-6 sm:pb-5' : 'px-1'}
                         flex justify-end space-x-3`}>
          <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
            {BN_UI_TEXT.CANCEL}
          </button>
          <button type="button" onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">
            {saveButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePurchaseBillModal;
