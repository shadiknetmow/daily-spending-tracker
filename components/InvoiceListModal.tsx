
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Person, InvoiceType, InvoicePaymentStatus } from '../types';
import { BN_UI_TEXT } from '../constants';
import InvoiceListItem from './InvoiceListItem';
import PlusCircleIcon from './icons/PlusCircleIcon';
import Modal from './Modal';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface InvoiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  persons: Person[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void; 
  onCreateNewInvoice: () => void;
  onOpenEditInvoiceModal: (invoice: Invoice) => void;
}

const ITEMS_PER_PAGE = 10;

const InvoiceListModal: React.FC<InvoiceListModalProps> = ({
  isOpen,
  onClose,
  invoices,
  persons,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateNewInvoice,
  onOpenEditInvoiceModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<InvoiceType | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<InvoicePaymentStatus | 'all'>('all'); // New state for payment status filter
  const [currentPage, setCurrentPage] = useState(1);

  const getCustomerName = (personId: string) => {
    const person = persons.find(p => p.id === personId);
    return person ? (person.customAlias || person.name) : BN_UI_TEXT.UNKNOWN_PERSON;
  };

  const filteredInvoices = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return invoices
      .filter(invoice => {
        if (invoice.isDeleted) return false;
        
        const typeMatch = invoiceTypeFilter === 'all' || invoice.invoiceType === invoiceTypeFilter;
        if (!typeMatch) return false;

        const statusMatch = paymentStatusFilter === 'all' || invoice.paymentStatus === paymentStatusFilter; // Filter by payment status
        if (!statusMatch) return false;

        const customerName = getCustomerName(invoice.personId).toLowerCase();
        const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(lowerSearchTerm);
        const customerNameMatch = customerName.includes(lowerSearchTerm);
        return invoiceNumberMatch || customerNameMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, persons, searchTerm, invoiceTypeFilter, paymentStatusFilter]); // Added paymentStatusFilter to dependencies

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, invoiceTypeFilter, paymentStatusFilter]); // Added paymentStatusFilter to dependencies

  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleInvoiceTypeFilterChange = (filter: InvoiceType | 'all') => {
    setInvoiceTypeFilter(filter);
  };

  const handlePaymentStatusFilterChange = (filter: InvoicePaymentStatus | 'all') => { // New handler for payment status
    setPaymentStatusFilter(filter);
  };
  
  const filterButtonClass = (isActive: boolean) => 
    `px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-50 whitespace-nowrap ${
      isActive 
        ? 'bg-teal-600 text-white focus:ring-teal-400' 
        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400'
    }`;

  const paymentStatusLabels: Record<InvoicePaymentStatus, string> = {
    [InvoicePaymentStatus.PENDING]: BN_UI_TEXT.PAYMENT_STATUS_PENDING,
    [InvoicePaymentStatus.PARTIALLY_PAID]: BN_UI_TEXT.PAYMENT_STATUS_PARTIALLY_PAID,
    [InvoicePaymentStatus.PAID]: BN_UI_TEXT.PAYMENT_STATUS_PAID,
    [InvoicePaymentStatus.OVERDUE]: BN_UI_TEXT.PAYMENT_STATUS_OVERDUE,
    [InvoicePaymentStatus.CANCELLED]: BN_UI_TEXT.PAYMENT_STATUS_CANCELLED,
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.INVOICE_LIST_MODAL_TITLE} size="3xl">
      <div className="flex flex-col h-full">
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder={BN_UI_TEXT.SEARCH_INVOICE_PLACEHOLDER}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:flex-grow px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
              aria-label="ইনভয়েস খুঁজুন"
            />
            <button
              onClick={onCreateNewInvoice}
              className="flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md transition duration-150 w-full sm:w-auto flex-shrink-0"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>{BN_UI_TEXT.CREATE_SALES_INVOICE_NAV_BTN}</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button onClick={() => handleInvoiceTypeFilterChange('all')} className={filterButtonClass(invoiceTypeFilter === 'all')}>{BN_UI_TEXT.FILTER_ALL_INVOICES}</button>
            <button onClick={() => handleInvoiceTypeFilterChange(InvoiceType.SALES)} className={filterButtonClass(invoiceTypeFilter === InvoiceType.SALES)}>{BN_UI_TEXT.FILTER_SALES_INVOICES}</button>
            <button onClick={() => handleInvoiceTypeFilterChange(InvoiceType.PURCHASE)} className={filterButtonClass(invoiceTypeFilter === InvoiceType.PURCHASE)}>{BN_UI_TEXT.FILTER_PURCHASE_BILLS}</button>
          </div>
          {/* Payment Status Filter Buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 font-medium mr-1 whitespace-nowrap">{BN_UI_TEXT.PAYMENT_STATUS_LABEL}:</span>
            <button onClick={() => handlePaymentStatusFilterChange('all')} className={filterButtonClass(paymentStatusFilter === 'all')}>{BN_UI_TEXT.FILTER_ALL_STATUSES}</button>
            {Object.values(InvoicePaymentStatus).map(status => (
              <button
                key={status}
                onClick={() => handlePaymentStatusFilterChange(status)}
                className={filterButtonClass(paymentStatusFilter === status)}
              >
                {paymentStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          {paginatedInvoices.length === 0 ? (
            <p className="text-slate-500 text-center py-10">
              {searchTerm || invoiceTypeFilter !== 'all' || paymentStatusFilter !== 'all'
                ? BN_UI_TEXT.NO_ITEMS_FOR_FILTER
                : BN_UI_TEXT.NO_INVOICES_FOUND}
            </p>
          ) : (
            <ul className="space-y-3">
              {paginatedInvoices.map(invoice => (
                <InvoiceListItem
                  key={invoice.id}
                  invoice={invoice}
                  customerName={getCustomerName(invoice.personId)}
                  onViewInvoice={onViewInvoice}
                  onEditInvoice={onOpenEditInvoiceModal}
                  onDeleteInvoice={onDeleteInvoice}
                />
              ))}
            </ul>
          )}
        </div>
        {totalItems > ITEMS_PER_PAGE && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600">
              <p className="mb-2 sm:mb-0">
                {BN_UI_TEXT.PAGE_LABEL} {currentPage.toLocaleString('bn-BD')} {BN_UI_TEXT.OF_LABEL} {totalPages.toLocaleString('bn-BD')} | {BN_UI_TEXT.TOTAL_ITEMS_LABEL}: {totalItems.toLocaleString('bn-BD')}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  aria-label={BN_UI_TEXT.PREVIOUS_PAGE_BTN}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  {BN_UI_TEXT.PREVIOUS_PAGE_BTN}
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  aria-label={BN_UI_TEXT.NEXT_PAGE_BTN}
                >
                  {BN_UI_TEXT.NEXT_PAGE_BTN}
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
      </div>
    </Modal>
  );
};

export default InvoiceListModal;
