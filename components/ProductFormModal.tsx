
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Product } from '../types';
import { BN_UI_TEXT, COMMON_UNITS_BN, PRODUCT_IMAGE_MAX_SIZE_BYTES } from '../constants'; // Added PRODUCT_IMAGE_MAX_SIZE_BYTES
import Modal from './Modal';
import { useNotification } from '../contexts/NotificationContext';
import { convertToBanglaPhonetic } from '../utils/textUtils';
import CameraIcon from './icons/CameraIcon';
import TrashIcon from './icons/TrashIcon';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    productData: Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'stockHistory' | 'isDeleted' | 'deletedAt' | 'currentStock' | 'stockUnit' | 'lowStockThreshold'>,
    initialStockData: { initialStock: number; stockUnit: string; lowStockThreshold: number },
    existingProductId?: string
  ) => void;
  initialData?: Product | null;
  isGlobalPhoneticModeActive: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isGlobalPhoneticModeActive,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | string>(''); // Sales Price
  const [mrp, setMrp] = useState<number | string>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | string>('');
  const [productImage, setProductImage] = useState<string | undefined>(undefined);
  const [unit, setUnit] = useState('');
  
  const [initialStock, setInitialStock] = useState<number | string>(0);
  const [stockUnit, setStockUnit] = useState(COMMON_UNITS_BN.find(u => u === "পিস") || COMMON_UNITS_BN[0] || '');
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(5);

  const { addNotification } = useNotification();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);
  const stockUnitInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  
  const skipPhoneticConversionMapRef = useRef<{[key:string]: boolean}>({});


  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setUnitPrice(initialData.unitPrice !== undefined ? initialData.unitPrice : '');
        setMrp(initialData.mrp !== undefined ? initialData.mrp : '');
        setWholesalePrice(initialData.wholesalePrice !== undefined ? initialData.wholesalePrice : '');
        setProductImage(initialData.productImage);
        setUnit(initialData.unit || '');
        setStockUnit(initialData.stockUnit || COMMON_UNITS_BN.find(u => u === "পিস") || COMMON_UNITS_BN[0] || '');
        setLowStockThreshold(initialData.lowStockThreshold !== undefined ? initialData.lowStockThreshold : 5);
        // For editing, currentStock is what matters. initialStock field is not directly edited.
        // If we want to show current stock for reference: setInitialStock(initialData.currentStock);
        setInitialStock(0); // Keep this disabled/informative for edit mode
      } else {
        setName('');
        setDescription('');
        setUnitPrice('');
        setMrp('');
        setWholesalePrice('');
        setProductImage(undefined);
        setUnit('');
        setInitialStock(0);
        setStockUnit(COMMON_UNITS_BN.find(u => u === "পিস") || COMMON_UNITS_BN[0] || '');
        setLowStockThreshold(5);
      }
      skipPhoneticConversionMapRef.current = {};
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
        addNotification(BN_UI_TEXT.PRODUCT_IMAGE_SIZE_TOO_LARGE, 'error');
        if(productImageInputRef.current) productImageInputRef.current.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProductImage(undefined);
    if (productImageInputRef.current) {
      productImageInputRef.current.value = ""; 
    }
  };

  const makeChangeHandler = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldKey: string, 
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    if (skipPhoneticConversionMapRef.current[fieldKey]) {
        setter(rawValue);
        skipPhoneticConversionMapRef.current[fieldKey] = false;
    } else {
        setter(rawValue);
    }
  };

  const makeKeyDownHandler = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldKey: string,
    inputRefToUpdate?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (skipPhoneticConversionMapRef.current[fieldKey]) return;

    if (isGlobalPhoneticModeActive && e.key === ' ') {
      e.preventDefault();
      const inputElement = inputRefToUpdate?.current || e.target as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = inputElement.value;
      const selectionStart = inputElement.selectionStart || 0;

      let wordStart = selectionStart - 1;
      while (wordStart >= 0 && currentValue[wordStart] !== ' ') {
        wordStart--;
      }
      wordStart++;

      const wordToConvert = currentValue.substring(wordStart, selectionStart);

      if (wordToConvert.trim()) {
        const convertedWord = convertToBanglaPhonetic(wordToConvert);
        const newValue = 
          currentValue.substring(0, wordStart) + 
          convertedWord + 
          ' ' + 
          currentValue.substring(selectionStart);
        
        setter(newValue);
        setTimeout(() => {
          const newCursorPos = wordStart + convertedWord.length + 1;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        const newValue = 
          currentValue.substring(0, selectionStart) + 
          ' ' + 
          currentValue.substring(selectionStart);
        setter(newValue);
        setTimeout(() => {
          inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }, 0);
      }
    }
  };
  
  const makePasteHandler = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldKey: string,
    inputRefToUpdate?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (skipPhoneticConversionMapRef.current[fieldKey]) {
        skipPhoneticConversionMapRef.current[fieldKey] = false;
        return;
    }
    if (isGlobalPhoneticModeActive) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const convertedPastedText = convertToBanglaPhonetic(pastedText);
      
      const inputElement = inputRefToUpdate?.current || e.target as HTMLInputElement | HTMLTextAreaElement;
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const currentValue = inputElement.value;
      
      const newValue = currentValue.substring(0, start) + convertedPastedText + currentValue.substring(end);
      setter(newValue);

      setTimeout(() => {
        const newCursorPos = start + convertedPastedText.length;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleNameChange = makeChangeHandler(setName, 'name');
  const handleNameKeyDown = makeKeyDownHandler(setName, 'name', nameInputRef);
  const handleNamePaste = makePasteHandler(setName, 'name', nameInputRef);

  const handleDescriptionChange = makeChangeHandler(setDescription, 'description');
  const handleDescriptionKeyDown = makeKeyDownHandler(setDescription, 'description', descriptionTextareaRef);
  const handleDescriptionPaste = makePasteHandler(setDescription, 'description', descriptionTextareaRef);
  
  const handleUnitChange = makeChangeHandler(setUnit, 'unit');
  const handleUnitKeyDown = makeKeyDownHandler(setUnit, 'unit', unitInputRef);
  const handleUnitPaste = makePasteHandler(setUnit, 'unit', unitInputRef);

  const handleStockUnitChange = makeChangeHandler(setStockUnit, 'stockUnit');
  const handleStockUnitKeyDown = makeKeyDownHandler(setStockUnit, 'stockUnit', stockUnitInputRef);
  const handleStockUnitPaste = makePasteHandler(setStockUnit, 'stockUnit', stockUnitInputRef);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addNotification(BN_UI_TEXT.PRODUCT_NAME_REQUIRED, 'error');
      return;
    }
    const numUnitPrice = unitPrice === '' ? undefined : parseFloat(String(unitPrice));
    const numMrp = mrp === '' ? undefined : parseFloat(String(mrp));
    const numWholesalePrice = wholesalePrice === '' ? undefined : parseFloat(String(wholesalePrice));
    const numInitialStock = initialStock === '' ? 0 : parseFloat(String(initialStock));
    const numLowStockThreshold = lowStockThreshold === '' ? 5 : parseFloat(String(lowStockThreshold));

    if (numUnitPrice !== undefined && (isNaN(numUnitPrice) || numUnitPrice < 0)) {
      addNotification(BN_UI_TEXT.INVALID_UNIT_PRICE_ERROR, 'error'); return;
    }
    if (numMrp !== undefined && (isNaN(numMrp) || numMrp < 0)) {
      addNotification(BN_UI_TEXT.INVALID_MRP_ERROR, 'error'); return;
    }
    if (numWholesalePrice !== undefined && (isNaN(numWholesalePrice) || numWholesalePrice < 0)) {
      addNotification(BN_UI_TEXT.INVALID_WHOLESALE_PRICE_ERROR, 'error'); return;
    }
    if (!isEditing && (isNaN(numInitialStock) || numInitialStock < 0)) {
      addNotification(BN_UI_TEXT.INVALID_INITIAL_STOCK_ERROR, 'error'); return;
    }
    if (isNaN(numLowStockThreshold) || numLowStockThreshold < 0) {
      addNotification(BN_UI_TEXT.INVALID_LOW_STOCK_THRESHOLD_ERROR, 'error'); return;
    }

    onSave(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        unitPrice: numUnitPrice, // Sales Price
        mrp: numMrp,
        wholesalePrice: numWholesalePrice,
        productImage: productImage,
        unit: unit.trim() || undefined,
      },
      {
        initialStock: numInitialStock, // This is ignored during edit by handleSaveProduct
        stockUnit: stockUnit.trim() || (COMMON_UNITS_BN.find(u => u === "পিস") || COMMON_UNITS_BN[0] || ''),
        lowStockThreshold: numLowStockThreshold,
      },
      initialData?.id
    );
  };

  const modalTitle = isEditing ? BN_UI_TEXT.PRODUCT_FORM_MODAL_TITLE_EDIT : BN_UI_TEXT.PRODUCT_FORM_MODAL_TITLE_ADD;
  const saveButtonText = isEditing ? BN_UI_TEXT.SAVE_CHANGES : BN_UI_TEXT.SAVE_PRODUCT_BTN;
  const inputClass = "w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white";
  const disabledInputClass = "w-full px-3 py-1.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-md text-sm cursor-not-allowed";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="product-name" className="block text-xs font-medium text-slate-600 mb-0.5">
            {BN_UI_TEXT.PRODUCT_NAME_LABEL} <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            id="product-name"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
            onPaste={handleNamePaste}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{BN_UI_TEXT.PRODUCT_IMAGE_LABEL}</label>
          <div className="mt-1 flex items-center space-x-3">
            <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-slate-100 ring-1 ring-slate-200">
              {productImage ? (
                <img src={productImage} alt={BN_UI_TEXT.PRODUCT_IMAGE_PREVIEW_ALT} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-300">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 6h-15A2.5 2.5 0 002 8.5v7A2.5 2.5 0 004.5 18h15a2.5 2.5 0 002.5-2.5v-7A2.5 2.5 0 0019.5 6zM4 8.5H20v7H4v-7zm6 5.5l-2-2.5h8l-2.5 3-1.5-1.5z" /></svg>
                </div>
              )}
            </span>
            <div className="flex flex-col space-y-1.5">
              <button type="button" onClick={() => productImageInputRef.current?.click()}
                className="inline-flex items-center px-2.5 py-1 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                <CameraIcon className="w-4 h-4 mr-1.5 text-slate-500" />
                {productImage ? BN_UI_TEXT.CHANGE_PRODUCT_IMAGE_BTN : BN_UI_TEXT.UPLOAD_PRODUCT_IMAGE_BTN}
              </button>
              <input type="file" ref={productImageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              {productImage && (
                <button type="button" onClick={handleRemoveImage}
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200">
                  <TrashIcon className="w-4 h-4 mr-1.5" />
                  {BN_UI_TEXT.REMOVE_PRODUCT_IMAGE_BTN}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="product-description" className="block text-xs font-medium text-slate-600 mb-0.5">
            {BN_UI_TEXT.PRODUCT_DESCRIPTION_LABEL}
          </label>
          <textarea
            ref={descriptionTextareaRef}
            id="product-description"
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleDescriptionKeyDown}
            onPaste={handleDescriptionPaste}
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="product-sales-price" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.SALES_PRICE_LABEL}
            </label>
            <input type="number" id="product-sales-price" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} min="0" step="any" className={inputClass} />
          </div>
          <div>
            <label htmlFor="product-mrp" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.MRP_LABEL}
            </label>
            <input type="number" id="product-mrp" value={mrp} onChange={(e) => setMrp(e.target.value)} min="0" step="any" className={inputClass} />
          </div>
          <div>
            <label htmlFor="product-wholesale-price" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.WHOLESALE_PRICE_LABEL}
            </label>
            <input type="number" id="product-wholesale-price" value={wholesalePrice} onChange={(e) => setWholesalePrice(e.target.value)} min="0" step="any" className={inputClass} />
          </div>
        </div>
        
        <div>
            <label htmlFor="product-unit" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.PRODUCT_UNIT_LABEL}
            </label>
            <input
              ref={unitInputRef}
              type="text"
              id="product-unit"
              value={unit}
              onChange={handleUnitChange}
              onKeyDown={handleUnitKeyDown}
              onPaste={handleUnitPaste}
              placeholder={BN_UI_TEXT.PRODUCT_UNIT_PLACEHOLDER}
              className={inputClass}
              list="product-common-units"
            />
            <datalist id="product-common-units">
              {COMMON_UNITS_BN.map(u => <option key={`prod-unit-${u}`} value={u} />)}
            </datalist>
          </div>
        
        {!isEditing && (
          <div>
            <label htmlFor="initial-stock" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.INITIAL_STOCK_LABEL}
            </label>
            <input
              type="number"
              id="initial-stock"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              min="0"
              step="any"
              className={inputClass}
              disabled={isEditing} // Disable when editing
            />
          </div>
        )}
         {isEditing && (
          <div>
            <label htmlFor="current-stock-display" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.CURRENT_STOCK_LABEL}
            </label>
            <input
              type="text"
              id="current-stock-display"
              value={`${initialData?.currentStock.toLocaleString('bn-BD') || '0'} ${initialData?.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE}`}
              className={disabledInputClass}
              disabled 
            />
             <p className="mt-1 text-[10px] text-slate-500">স্টক পরিবর্তন করতে 'স্টক অ্যাডজাস্টমেন্ট' অপশন ব্যবহার করুন।</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock-unit" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.STOCK_UNIT_LABEL}
            </label>
            <input
              ref={stockUnitInputRef}
              type="text"
              id="stock-unit"
              value={stockUnit}
              onChange={handleStockUnitChange}
              onKeyDown={handleStockUnitKeyDown}
              onPaste={handleStockUnitPaste}
              placeholder={BN_UI_TEXT.PRODUCT_UNIT_PLACEHOLDER}
              className={inputClass}
              list="stock-common-units"
            />
             <datalist id="stock-common-units">
              {COMMON_UNITS_BN.map(u => <option key={`stock-unit-${u}`} value={u} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="low-stock-threshold" className="block text-xs font-medium text-slate-600 mb-0.5">
              {BN_UI_TEXT.LOW_STOCK_THRESHOLD_LABEL}
            </label>
            <input
              type="number"
              id="low-stock-threshold"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              min="0"
              step="any"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            {BN_UI_TEXT.CANCEL}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >
            {saveButtonText}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
