
import React from 'react';
import { Invoice, InvoicePaymentStatus, InvoiceType } from '../types';
import { BN_UI_TEXT } from '../constants';
import EyeIcon from './icons/EyeIcon';
import EditIcon from './icons/EditIcon';

interface InvoiceListItemProps {
  invoice: Invoice;
  customerName: string;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void; 
  onDeleteInvoice?: (invoiceId: string) => void; 
}

const InvoiceListItem: React.FC<InvoiceListItemProps> = ({
  invoice,
  customerName,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('bn-BD', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusChip = (status: InvoicePaymentStatus) => {
    let bgColor = 'bg-slate-200';
    let textColor = 'text-slate-700';
    let textLabel: string;

    switch (status) {
      case InvoicePaymentStatus.PENDING:
        bgColor = 'bg-yellow-100'; textColor = 'text-yellow-700'; textLabel = BN_UI_TEXT.PAYMENT_STATUS_PENDING;
        break;
      case InvoicePaymentStatus.PARTIALLY_PAID:
        bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; textLabel = BN_UI_TEXT.PAYMENT_STATUS_PARTIALLY_PAID;
        break;
      case InvoicePaymentStatus.PAID:
        bgColor = 'bg-green-100'; textColor = 'text-green-700'; textLabel = BN_UI_TEXT.PAYMENT_STATUS_PAID;
        break;
      case InvoicePaymentStatus.OVERDUE:
        bgColor = 'bg-red-100'; textColor = 'text-red-700'; textLabel = BN_UI_TEXT.PAYMENT_STATUS_OVERDUE;
        break;
      case InvoicePaymentStatus.CANCELLED:
        bgColor = 'bg-slate-200'; textColor = 'text-slate-600 line-through'; textLabel = BN_UI_TEXT.PAYMENT_STATUS_CANCELLED;
        break;
      default:
        textLabel = status as string; 
    }
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>{textLabel}</span>;
  };
  
  const totalAmount = invoice.totalAmount || 0;
  const paidAmount = invoice.paymentsReceived?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const remainingAmount = totalAmount - paidAmount;

  const invoiceTypeDisplay = invoice.invoiceType === InvoiceType.SALES 
    ? BN_UI_TEXT.INVOICE_TYPE_SALES_SHORT 
    : BN_UI_TEXT.INVOICE_TYPE_PURCHASE_SHORT;
  
  const typeColorClass = invoice.invoiceType === InvoiceType.SALES ? 'text-purple-600 bg-purple-50' : 'text-indigo-600 bg-indigo-50';


  return (
    <li className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 border-l-4 ${invoice.isDeleted ? 'border-slate-400 opacity-70' : (invoice.invoiceType === InvoiceType.SALES ? 'border-purple-500' : 'border-indigo-500')}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-grow mb-2 sm:mb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm sm:text-base font-semibold ${invoice.isDeleted ? 'text-slate-500 line-through' : (invoice.invoiceType === InvoiceType.SALES ? 'text-purple-700' : 'text-indigo-700')}`}>{invoice.invoiceNumber}</h3>
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${typeColorClass}`}>
                {invoiceTypeDisplay}
              </span>
            </div>
            <span className={`text-xs ${invoice.isDeleted ? 'text-slate-400' : 'text-slate-500'} sm:border-l sm:pl-2 ${invoice.isDeleted ? 'sm:border-slate-300' : 'sm:border-slate-300'}`}>
              {invoice.invoiceType === InvoiceType.SALES ? BN_UI_TEXT.BILLED_TO_LABEL : BN_UI_TEXT.SUPPLIER_LABEL}: {customerName}
            </span>
          </div>
          <p className={`text-xs ${invoice.isDeleted ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
            {BN_UI_TEXT.INVOICE_DATE_LABEL}: {formatDate(invoice.invoiceDate)}
            {invoice.dueDate && (
              <span className="ml-2">| {BN_UI_TEXT.DUE_DATE_INVOICE_LABEL}: {formatDate(invoice.dueDate)}</span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end space-y-1 sm:space-y-0 sm:min-w-[160px]">
          <p className={`text-sm sm:text-base font-semibold ${invoice.isDeleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {BN_UI_TEXT.BDT_SYMBOL} {(invoice.totalAmount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {getStatusChip(invoice.paymentStatus)}
        </div>
      </div>
      {(invoice.paymentStatus === InvoicePaymentStatus.PENDING || invoice.paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID || invoice.paymentStatus === InvoicePaymentStatus.OVERDUE) && remainingAmount > 0.009 && !invoice.isDeleted && (
          <p className="text-xs text-red-600 mt-1">
            {BN_UI_TEXT.REMAINING_AMOUNT_LABEL}: {BN_UI_TEXT.BDT_SYMBOL} {(remainingAmount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
      )}
      {invoice.isDeleted && invoice.deletedAt && (
        <p className="text-xs text-orange-600 font-medium mt-1">
            {BN_UI_TEXT.DELETED_ON} {formatDate(invoice.deletedAt)} ({BN_UI_TEXT.STATUS_ARCHIVED})
        </p>
      )}
      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end space-x-1.5">
        {!invoice.isDeleted && (
          <>
            <button
              onClick={() => onViewInvoice(invoice)}
              className="p-1.5 text-xs text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md flex items-center space-x-1"
              title={BN_UI_TEXT.INVOICE_VIEW_DETAILS}
            >
              <EyeIcon className="w-3.5 h-3.5" />
              <span>দেখুন</span>
            </button>
            {onEditInvoice && invoice.invoiceType === InvoiceType.SALES && ( // Only show edit for Sales Invoices and if handler exists
              <button
                onClick={() => onEditInvoice(invoice)}
                className="p-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center space-x-1"
                title={BN_UI_TEXT.EDIT_INVOICE_MODAL_TITLE}
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>এডিট</span>
              </button>
            )}
            {/* Delete button placeholder for future - not part of this request
            {onDeleteInvoice && (
              <button
                onClick={() => onDeleteInvoice(invoice.id)}
                className="p-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-md flex items-center space-x-1"
                title="ইনভয়েস মুছুন"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>মুছুন</span>
              </button>
            )} */}
          </>
        )}
      </div>
    </li>
  );
};

export default InvoiceListItem;
