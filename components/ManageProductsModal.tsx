
import React, { useState } from 'react';
import { Product, User } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import PlusCircleIcon from './icons/PlusCircleIcon';
import EditIcon from './icons/EditIcon'; // Import EditIcon
// Placeholder for ProductListItem, ProductForm, StockHistoryModal, AdjustStockForm etc.

interface ManageProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: User;
  onAddNewProductClick: () => void; 
  onEditProductClick: (product: Product) => void; // Added for editing
  onAddProduct: (productData: Omit<Product, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'stockHistory' | 'isDeleted' | 'deletedAt' | 'currentStock' | 'stockUnit' | 'lowStockThreshold'> & { initialStock?: number, stockUnit?: string, lowStockThreshold?: number }) => Promise<Product | null>;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onRestoreProduct: (productId: string) => Promise<void>;
  onAdjustStock: (productId: string, adjustment: { type: 'manual_in' | 'manual_out' | 'purchase_received'; quantityChange: number; notes?: string }) => Promise<void>;
  onViewStockHistory: (productId: string) => Promise<void>;
}

const ManageProductsModal: React.FC<ManageProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  onAddNewProductClick, 
  onEditProductClick, // Destructured
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestoreProduct,
  onAdjustStock,
  onViewStockHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Add other states for form data, selected product, etc.

  if (!isOpen) return null;

  const activeProducts = products.filter(p => 
    !p.isDeleted && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())))
  ).sort((a,b) => a.name.localeCompare(b.name, 'bn-BD'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.MANAGE_PRODUCTS_MODAL_TITLE} size="3xl">
      <div className="flex flex-col h-full">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <input
            type="text"
            placeholder={BN_UI_TEXT.SEARCH_PRODUCT_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto flex-grow px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
            aria-label="পণ্য খুঁজুন"
          />
          <button
            onClick={onAddNewProductClick} // Use the passed prop here
            className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition duration-150 w-full sm:w-auto"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.ADD_NEW_PRODUCT_BTN}</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          {activeProducts.length === 0 ? (
            <p className="text-slate-500 text-center py-10">
              {searchTerm
                ? `"${searchTerm}" নামে কোনো পণ্য খুঁজে পাওয়া যায়নি।`
                : BN_UI_TEXT.NO_PRODUCTS_FOUND}
            </p>
          ) : (
            <ul className="space-y-3">
              {activeProducts.map(product => (
                <li key={product.id} className="p-3 bg-white rounded-md border border-slate-200 flex items-start space-x-3 group">
                  {product.productImage ? (
                    <img src={product.productImage} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0 border border-slate-100"/>
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs flex-shrink-0 border border-slate-200">ছবি নেই</div>
                  )}
                  <div className="flex-grow">
                    <button 
                      onClick={() => onEditProductClick(product)}
                      className="font-medium text-slate-700 hover:text-teal-600 hover:underline text-left"
                      title={`${BN_UI_TEXT.EDIT_PRODUCT_BTN}: ${product.name}`}
                    >
                      {product.name}
                    </button>
                    <p className="text-xs text-slate-500">
                      স্টক: {product.currentStock.toLocaleString('bn-BD')} {product.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE}
                      {product.unitPrice !== undefined && ` | ${BN_UI_TEXT.SALES_PRICE_LABEL.split(" ")[0]}: ${product.unitPrice.toLocaleString('bn-BD')}৳`}
                      {product.mrp !== undefined && ` | MRP: ${product.mrp.toLocaleString('bn-BD')}৳`}
                      {product.wholesalePrice !== undefined && ` | পাইকারি: ${product.wholesalePrice.toLocaleString('bn-BD')}৳`}
                    </p>
                    {product.description && <p className="text-xs text-slate-400 truncate max-w-md">{product.description}</p>}
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                     <button
                        onClick={() => onEditProductClick(product)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
                        title={BN_UI_TEXT.EDIT_PRODUCT_BTN}
                        aria-label={BN_UI_TEXT.EDIT_PRODUCT_BTN}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    {/* TODO: Add Delete, Stock History, Adjust Stock buttons */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageProductsModal;
