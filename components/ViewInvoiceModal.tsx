
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, InvoiceItem, InvoicePayment, InvoicePaymentStatus, Person, InvoicePaymentMethod, CompanyProfile, InvoiceType } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import PrinterIcon from './icons/PrinterIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  persons: Person[];
  companyProfiles: CompanyProfile[];
  onRecordPayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id' | 'recordedAt'>) => Promise<void>;
  currentUserName?: string; 
}

const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  persons,
  companyProfiles,
  onRecordPayment,
  currentUserName,
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false); // New state for submission lock

  useEffect(() => {
    if (isOpen && invoice) {
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Cash');
      setPaymentNotes('');
      setIsSubmittingPayment(false); // Reset submission lock
    }
  }, [isOpen, invoice]);

  const otherParty = useMemo(() => { // This is the 'Person' object, either customer or supplier
    if (!invoice) return null;
    return persons.find(p => p.id === invoice.personId);
  }, [invoice, persons]);

  const myCompanyProfileForInvoice = useMemo(() => { // This is always 'my' company profile
    if (!invoice || !invoice.companyProfileId) { 
        const defaultProfile = companyProfiles.find(cp => cp.isDefault);
        if (defaultProfile) return defaultProfile;
        if (companyProfiles.length > 0) return companyProfiles[0]; 
        return null;
    }
    return companyProfiles.find(cp => cp.id === invoice.companyProfileId);
  }, [invoice, companyProfiles]);


  const calculatedPaidAmount = useMemo(() => {
    if (!invoice || !invoice.paymentsReceived) return 0;
    return invoice.paymentsReceived.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [invoice]);

  const remainingAmount = invoice ? (invoice.totalAmount || 0) - calculatedPaidAmount : 0;

  const canRecordPayment = invoice &&
    (invoice.paymentStatus === InvoicePaymentStatus.PENDING ||
     invoice.paymentStatus === InvoicePaymentStatus.PARTIALLY_PAID ||
     invoice.paymentStatus === InvoicePaymentStatus.OVERDUE) &&
    remainingAmount > 0.009; 

  if (!isOpen || !invoice) return null;

  const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
  const formatDateTime = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  
  const paymentMethods: InvoicePaymentMethod[] = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque', 'Other'];
  const paymentMethodTranslations: Record<InvoicePaymentMethod, string> = {
      'Cash': BN_UI_TEXT.PAYMENT_METHOD_CASH,
      'Bank Transfer': BN_UI_TEXT.PAYMENT_METHOD_BANK_TRANSFER,
      'bKash': BN_UI_TEXT.PAYMENT_METHOD_BKASH,
      'Nagad': BN_UI_TEXT.PAYMENT_METHOD_NAGAD,
      'Rocket': BN_UI_TEXT.PAYMENT_METHOD_ROCKET,
      'Card': BN_UI_TEXT.PAYMENT_METHOD_CARD,
      'Cheque': BN_UI_TEXT.PAYMENT_METHOD_CHEQUE,
      'Other': BN_UI_TEXT.PAYMENT_METHOD_OTHER,
  };


  const getStatusInfo = (status: InvoicePaymentStatus) => {
    switch (status) {
      case InvoicePaymentStatus.PENDING: return { text: BN_UI_TEXT.PAYMENT_STATUS_PENDING, color: 'text-yellow-600', bgColor: 'bg-yellow-100', printClass: 'status-pending', tooltip: BN_UI_TEXT.INVOICE_STATUS_PENDING_TOOLTIP };
      case InvoicePaymentStatus.PARTIALLY_PAID: return { text: BN_UI_TEXT.PAYMENT_STATUS_PARTIALLY_PAID, color: 'text-blue-600', bgColor: 'bg-blue-100', printClass: 'status-partially-paid', tooltip: BN_UI_TEXT.INVOICE_STATUS_PARTIALLY_PAID_TOOLTIP };
      case InvoicePaymentStatus.PAID: return { text: BN_UI_TEXT.PAYMENT_STATUS_PAID, color: 'text-green-600', bgColor: 'bg-green-100', printClass: 'status-paid', tooltip: BN_UI_TEXT.INVOICE_STATUS_PAID_TOOLTIP };
      case InvoicePaymentStatus.OVERDUE: return { text: BN_UI_TEXT.PAYMENT_STATUS_OVERDUE, color: 'text-red-600', bgColor: 'bg-red-100', printClass: 'status-overdue', tooltip: BN_UI_TEXT.INVOICE_STATUS_OVERDUE_TOOLTIP };
      case InvoicePaymentStatus.CANCELLED: return { text: BN_UI_TEXT.PAYMENT_STATUS_CANCELLED, color: 'text-slate-600 line-through', bgColor: 'bg-slate-100', printClass: 'status-cancelled', tooltip: BN_UI_TEXT.INVOICE_STATUS_CANCELLED_TOOLTIP };
      default: return { text: status, color: 'text-slate-700', bgColor: 'bg-slate-100', printClass: 'status-default', tooltip: '' };
    }
  };
  const statusInfo = getStatusInfo(invoice.paymentStatus);
  const isPurchase = invoice.invoiceType === InvoiceType.PURCHASE;

  // Determine From/To details based on invoice type
  const fromPartyName = isPurchase 
    ? (otherParty?.customAlias || otherParty?.name || BN_UI_TEXT.UNKNOWN_PERSON) 
    : (myCompanyProfileForInvoice?.companyName || currentUserName || BN_UI_TEXT.APP_TITLE);
  const fromPartyAddress = isPurchase ? otherParty?.address : myCompanyProfileForInvoice?.address;
  const fromPartyPhone = isPurchase ? otherParty?.mobileNumber : myCompanyProfileForInvoice?.phone;
  const fromPartyEmail = isPurchase ? otherParty?.email : myCompanyProfileForInvoice?.email;
  const fromPartyTaxId = isPurchase ? '' : myCompanyProfileForInvoice?.taxId;
  const fromPartyPhoneLabel = isPurchase ? BN_UI_TEXT.SUPPLIER_MOBILE_LABEL : (myCompanyProfileForInvoice?.phone ? "ফোন" : BN_UI_TEXT.PERSON_MOBILE_NUMBER);


  const toPartyName = isPurchase 
    ? (myCompanyProfileForInvoice?.companyName || currentUserName || BN_UI_TEXT.APP_TITLE)
    : (otherParty?.customAlias || otherParty?.name || BN_UI_TEXT.UNKNOWN_PERSON);
  const toPartyAddress = isPurchase ? myCompanyProfileForInvoice?.address : otherParty?.address;
  const toPartyPhone = isPurchase ? myCompanyProfileForInvoice?.phone : otherParty?.mobileNumber;
  const toPartyEmail = isPurchase ? myCompanyProfileForInvoice?.email : otherParty?.email;
  const toPartyTaxId = isPurchase ? myCompanyProfileForInvoice?.taxId : '';
  const toPartyPhoneLabel = isPurchase ? (myCompanyProfileForInvoice?.phone ? "ফোন" : BN_UI_TEXT.PERSON_MOBILE_NUMBER) : BN_UI_TEXT.CUSTOMER_MOBILE_LABEL;

  const mainHeaderName = myCompanyProfileForInvoice?.companyName || currentUserName || BN_UI_TEXT.APP_TITLE;
  const mainHeaderLogo = myCompanyProfileForInvoice?.logoBase64;


  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printDocumentTitle = isPurchase ? BN_UI_TEXT.BILL_TITLE_FOR_PRINT : `${BN_UI_TEXT.INVOICE_TITLE_FOR_PRINT} - ${invoice.invoiceNumber}`;
      const mainDocumentHeading = isPurchase ? BN_UI_TEXT.BILL_TITLE_FOR_PRINT : BN_UI_TEXT.INVOICE_TITLE_FOR_PRINT;
      
      let printContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${printDocumentTitle}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: "Noto Sans Bengali", sans-serif; margin: 20px; color: #333; line-height: 1.4; font-size: 10pt; }
              .print-container { max-width: 800px; margin: auto; padding:10px; border: 1px solid #eee; }
              .print-header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee;}
              .company-logo-print { display: block; margin: 0 auto 10px auto; max-width: 160px; max-height: 70px; object-fit: contain; }
              .print-header h1 { font-size: 1.6em; margin: 0; color: #111; }
              .print-header h2.invoice-title { font-size: 1.3em; margin: 5px 0 0 0; color: #444; font-weight: normal; }
              
              .addresses { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.9em; }
              .address-block { width: 48%; }
              .address-block h4 { margin-top: 0; font-size: 0.95em; color: #555; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 6px; font-weight: 600; }
              .address-block p { margin: 2px 0; }
              .address-block .label { font-weight: 500; color: #444; padding-right: 5px;}

              .invoice-meta { background-color: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 0.9em; }
              .invoice-meta table { width: 100%; }
              .invoice-meta td { padding: 3px 0; }
              .invoice-meta .label { font-weight: 500; color: #444; padding-right: 10px; }
              
              .status-chip { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; border: 1px solid transparent; }
              .status-pending { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
              .status-partially-paid { background-color: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
              .status-paid { background-color: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
              .status-overdue { background-color: #fef2f2; color: #dc2626; border-color: #fecaca; }
              .status-cancelled { background-color: #f1f5f9; color: #475569; text-decoration: line-through; border-color: #e2e8f0;}
              .status-default { background-color: #f8fafc; color: #334155; border-color: #e2e8f0;}

              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ccc; padding: 7px; font-size: 0.85rem; vertical-align: top; }
              .items-table th { background-color: #f0f0f0; font-weight: 600; }
              .items-table .text-right { text-align: right; }
              .items-table .item-description { font-size: 0.75em; color: #555; padding-left: 8px; margin-top: 2px; white-space: pre-wrap; }
              
              .totals-section { margin-left: auto; width: 55%; max-width: 300px; margin-top: 10px; font-size: 0.9em; }
              .totals-section table { width: 100%; }
              .totals-section td { padding: 3px 0; }
              .totals-section .label { text-align: right; padding-right: 15px; color: #444; }
              .totals-section .value { text-align: right; font-weight: 500; }
              .totals-section .grand-total td { font-weight: bold; font-size: 1.05em; color: #000; border-top: 2px solid #555; padding-top: 5px; }
              
              .notes-section, .payment-history-section { margin-top: 20px; padding-top:10px; border-top: 1px dashed #ccc; font-size: 0.85em; }
              .notes-section h4, .payment-history-section h4 { font-size: 1em; color: #555; margin-bottom: 5px; font-weight: 600; }
              .notes-section p { white-space: pre-wrap; }
              .payment-history-section ul { list-style: none; padding: 0; }
              .payment-history-section li { background-color: #f9f9f9; padding: 5px 8px; border-radius: 3px; margin-bottom: 4px; border: 1px solid #eee;}
              .payment-history-section li div { display: flex; justify-content: space-between; }
              .payment-history-section li .payment-notes { font-size: 0.9em; color: #666; margin-top: 2px; }

              .footer-print { text-align: center; font-size: 0.8em; color: #777; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; }
              .no-print { display: none !important; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="print-container">
      `;

      printContent += `<div class="print-header">`;
      if (mainHeaderLogo) {
        printContent += `<img src="${mainHeaderLogo}" alt="${mainHeaderName} ${BN_UI_TEXT.LOGO_TEXT}" class="company-logo-print" />`;
      }
      printContent += `<h1>${mainHeaderName}</h1>`;
      printContent += `<h2 class="invoice-title">${mainDocumentHeading}</h2>`;
      printContent += `</div>`;

      printContent += `<div class="addresses">`;
      printContent += `<div class="address-block"><h4>${isPurchase ? BN_UI_TEXT.SUPPLIER_LABEL : BN_UI_TEXT.INVOICE_FROM_LABEL}:</h4>`; // প্রেরক / Supplier
      printContent += `<p class="font-semibold">${fromPartyName}</p>`;
      if (fromPartyAddress) printContent += `<p>${fromPartyAddress}</p>`;
      if (fromPartyPhone) printContent += `<p><span class="label">${fromPartyPhoneLabel}:</span> ${fromPartyPhone}</p>`;
      if (fromPartyEmail) printContent += `<p><span class="label">${BN_UI_TEXT.EMAIL}:</span> ${fromPartyEmail}</p>`;
      if (fromPartyTaxId && !isPurchase) printContent += `<p><span class="label">${BN_UI_TEXT.TAX_LABEL} ${BN_UI_TEXT.ID_LABEL}:</span> ${fromPartyTaxId}</p>`;
      printContent += `</div>`;
      
      printContent += `<div class="address-block" style="text-align: right;"><h4>${isPurchase ? "গ্রহীতা (আপনার বিবরণ)" : BN_UI_TEXT.BILLED_TO_LABEL}:</h4>`; // প্রাপক / Customer
      printContent += `<p class="font-semibold">${toPartyName}</p>`;
      if (toPartyAddress) printContent += `<p>${toPartyAddress}</p>`;
      if (toPartyPhone) printContent += `<p><span class="label">${toPartyPhoneLabel}:</span> ${toPartyPhone}</p>`;
      if (toPartyEmail) printContent += `<p><span class="label">${BN_UI_TEXT.EMAIL}:</span> ${toPartyEmail}</p>`;
      if (toPartyTaxId && isPurchase) printContent += `<p><span class="label">${BN_UI_TEXT.TAX_LABEL} ${BN_UI_TEXT.ID_LABEL}:</span> ${toPartyTaxId}</p>`;
      printContent += `</div></div>`;

      printContent += `<div class="invoice-meta"><table><tr>`;
      printContent += `<td><span class="label">${BN_UI_TEXT.INVOICE_NUMBER_LABEL}:</span> ${invoice.invoiceNumber}</td>`;
      printContent += `<td><span class="label">${BN_UI_TEXT.INVOICE_DATE_LABEL}:</span> ${formatDate(invoice.invoiceDate)}</td></tr><tr>`;
      if (invoice.dueDate) {
        printContent += `<td><span class="label">${BN_UI_TEXT.DUE_DATE_INVOICE_LABEL}:</span> ${formatDate(invoice.dueDate)}</td>`;
      }
      printContent += `<td ${!invoice.dueDate ? 'colspan="2"' : ''}><span class="label">${BN_UI_TEXT.PAYMENT_STATUS_LABEL}:</span> <span class="status-chip ${statusInfo.printClass}">${statusInfo.text}</span></td>`;
      printContent += `</tr></table></div>`;
      
      printContent += `<table class="items-table"><thead><tr>
        <th>${BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_PRODUCT}</th>
        <th class="text-right">${BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_QTY}</th>
        <th class="text-right">${BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_UNIT_PRICE}</th>
        <th class="text-right">${BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_TOTAL}</th>
      </tr></thead><tbody>`;
      invoice.items.forEach(item => {
        printContent += `<tr>
          <td>${item.productName}${item.description ? `<p class="item-description">${item.description}</p>` : ''}</td>
          <td class="text-right">${(item.quantity || 0).toLocaleString('bn-BD')}${item.unit ? ` ${item.unit}` : ''}</td>
          <td class="text-right">${(item.unitPrice || 0).toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
          <td class="text-right font-semibold">${(item.total || 0).toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
        </tr>`;
      });
      printContent += `</tbody></table>`;

      printContent += `<div class="totals-section"><table>`;
      printContent += `<tr><td class="label">${BN_UI_TEXT.SUBTOTAL_LABEL}:</td><td class="value">${BN_UI_TEXT.BDT_SYMBOL} ${(invoice.subtotal || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
      if ((invoice.discountAmount || 0) > 0) {
        printContent += `<tr><td class="label">${BN_UI_TEXT.DISCOUNT_LABEL} (${invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : BN_UI_TEXT.BDT_SYMBOL + invoice.discountValue}):</td><td class="value" style="color: red;">- ${BN_UI_TEXT.BDT_SYMBOL} ${(invoice.discountAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
      }
      if ((invoice.taxAmount || 0) > 0) {
        printContent += `<tr><td class="label">${BN_UI_TEXT.TAX_LABEL} (${invoice.taxType === 'percentage' ? `${invoice.taxValue}%` : BN_UI_TEXT.BDT_SYMBOL + invoice.taxValue}):</td><td class="value" style="color: green;">+ ${BN_UI_TEXT.BDT_SYMBOL} ${(invoice.taxAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
      }
      printContent += `<tr class="grand-total"><td class="label">${BN_UI_TEXT.GRAND_TOTAL_LABEL}:</td><td class="value">${BN_UI_TEXT.BDT_SYMBOL} ${(invoice.totalAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
      if (invoice.paymentsReceived && invoice.paymentsReceived.length > 0) {
        printContent += `<tr><td class="label">${BN_UI_TEXT.PAID_AMOUNT_LABEL}:</td><td class="value" style="color: green;">${BN_UI_TEXT.BDT_SYMBOL} ${(calculatedPaidAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
        printContent += `<tr><td class="label">${BN_UI_TEXT.REMAINING_AMOUNT_LABEL}:</td><td class="value" style="${remainingAmount > 0.009 ? 'color: red;' : 'color: green;'}">${BN_UI_TEXT.BDT_SYMBOL} ${(remainingAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</td></tr>`;
      }
      printContent += `</table></div><div style="clear:both;"></div>`;

      if (invoice.paymentsReceived && invoice.paymentsReceived.length > 0) {
        printContent += `<div class="payment-history-section"><h4>${BN_UI_TEXT.PAYMENT_HISTORY_LABEL}</h4><ul>`;
        invoice.paymentsReceived.forEach(p => {
          printContent += `<li><div><span>${formatDateTime(p.paymentDate)} - ${BN_UI_TEXT.BDT_SYMBOL} ${(p.amount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span><span class="payment-method">${p.paymentMethod ? paymentMethodTranslations[p.paymentMethod] : ''}</span></div>`;
          if (p.notes) printContent += `<p class="payment-notes">${BN_UI_TEXT.NOTES_LABEL}: ${p.notes}</p>`;
          printContent += `</li>`;
        });
        printContent += `</ul></div>`;
      }

      if (invoice.notes) {
        printContent += `<div class="notes-section"><h4>${BN_UI_TEXT.NOTES_TERMS_LABEL}:</h4><p>${invoice.notes}</p></div>`;
      }
      
      printContent += `<div class="footer-print">${BN_UI_TEXT.APP_TITLE} দ্বারা তৈরি।</div>`;
      printContent += `</div></body></html>`;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert("প্রিন্ট উইন্ডো খুলতে সমস্যা হয়েছে। পপ-আপ ব্লকার পরীক্ষা করুন।");
    }
  };
  
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return; 

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(BN_UI_TEXT.FORM_VALIDATION_ERROR); 
      return;
    }
    if (amountNum > remainingAmount + 0.001) { 
        alert(BN_UI_TEXT.PAYMENT_AMOUNT_EXCEEDS_REMAINING_ERROR);
        return;
    }
    if (!paymentDate) {
        alert(BN_UI_TEXT.PAYMENT_DATE_REQUIRED_ERROR);
        return;
    }
    
    setIsSubmittingPayment(true);
    try {
        await onRecordPayment(invoice.id, {
        paymentDate,
        amount: amountNum,
        paymentMethod: paymentMethod || undefined,
        notes: paymentNotes.trim() || undefined,
        });
        setShowPaymentForm(false); 
        setPaymentAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentNotes('');
    } catch (error) {
        console.error("Payment recording failed:", error);
    } finally {
        setIsSubmittingPayment(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${isPurchase ? BN_UI_TEXT.BILL_TITLE_FOR_PRINT : BN_UI_TEXT.VIEW_INVOICE_MODAL_TITLE} - ${invoice.invoiceNumber}`} size="2xl">
      <div id="invoice-display-area" className="p-1"> 
        <header className="mb-6 text-center">
          {mainHeaderLogo ? (
            <img src={mainHeaderLogo} alt={`${mainHeaderName} ${BN_UI_TEXT.LOGO_TEXT}`} className="mx-auto mb-2 max-w-[180px] max-h-[80px] object-contain" />
          ) : (
            <h1 className="text-2xl font-bold text-slate-800">{mainHeaderName}</h1>
          )}
          <p className="text-sm text-slate-500">{isPurchase ? BN_UI_TEXT.BILL_TITLE_FOR_PRINT : BN_UI_TEXT.INVOICE_TITLE_FOR_PRINT}</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <h4 className="font-semibold text-slate-700 mb-1">{isPurchase ? BN_UI_TEXT.SUPPLIER_LABEL : BN_UI_TEXT.INVOICE_FROM_LABEL}</h4>
            <p className="font-semibold">{fromPartyName}</p>
            {fromPartyAddress && <p className="text-xs">{fromPartyAddress}</p>}
            {fromPartyPhone && <p className="text-xs">{fromPartyPhoneLabel}: {fromPartyPhone}</p>}
            {fromPartyEmail && <p className="text-xs">{BN_UI_TEXT.EMAIL}: {fromPartyEmail}</p>}
            {fromPartyTaxId && !isPurchase && <p className="text-xs">{BN_UI_TEXT.TAX_LABEL} {BN_UI_TEXT.ID_LABEL}: {fromPartyTaxId}</p>}
          </div>
          <div className="sm:text-right">
            <h4 className="font-semibold text-slate-700 mb-1">{isPurchase ? "গ্রহীতা (আপনার বিবরণ)" : BN_UI_TEXT.BILLED_TO_LABEL}</h4>
            <p className="font-semibold">{toPartyName}</p>
            {toPartyAddress && <p className="text-xs">{toPartyAddress}</p>}
            {toPartyPhone && <p className="text-xs">{toPartyPhoneLabel}: {toPartyPhone}</p>}
            {toPartyEmail && <p className="text-xs">{BN_UI_TEXT.EMAIL}: {toPartyEmail}</p>}
            {toPartyTaxId && isPurchase && <p className="text-xs">{BN_UI_TEXT.TAX_LABEL} {BN_UI_TEXT.ID_LABEL}: {toPartyTaxId}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mb-6 text-sm border-b pb-3">
          <div><span className="font-semibold">{BN_UI_TEXT.INVOICE_NUMBER_LABEL}:</span> {invoice.invoiceNumber}</div>
          <div><span className="font-semibold">{BN_UI_TEXT.INVOICE_DATE_LABEL}:</span> {formatDate(invoice.invoiceDate)}</div>
          {invoice.dueDate && <div><span className="font-semibold">{BN_UI_TEXT.DUE_DATE_INVOICE_LABEL}:</span> {formatDate(invoice.dueDate)}</div>}
          <div className="col-span-2 sm:col-span-1 mt-1">
            <span className="font-semibold">{BN_UI_TEXT.PAYMENT_STATUS_LABEL}:</span>
            <span title={statusInfo.tooltip} className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        <h4 className="text-md font-semibold text-slate-700 mb-2">{BN_UI_TEXT.INVOICE_ITEMS_LABEL}</h4>
        <div className="overflow-x-auto">
            <table className="w-full text-sm mb-6 min-w-[500px]">
            <thead className="bg-slate-100">
                <tr>
                <th className="p-2 text-left font-medium">{BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_PRODUCT}</th>
                <th className="p-2 text-right font-medium">{BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_QTY}</th>
                <th className="p-2 text-right font-medium">{BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_UNIT_PRICE}</th>
                <th className="p-2 text-right font-medium">{BN_UI_TEXT.INVOICE_ITEMS_TABLE_HEADER_TOTAL}</th>
                </tr>
            </thead>
            <tbody>
                {invoice.items.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                    <td className="p-2">
                    {item.productName}
                    {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                    </td>
                    <td className="p-2 text-right">{ (item.quantity || 0).toLocaleString('bn-BD')}{item.unit ? ` ${item.unit}` : ''}</td>
                    <td className="p-2 text-right">{(item.unitPrice || 0).toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td className="p-2 text-right font-medium">{(item.total || 0).toLocaleString('bn-BD', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-full sm:w-1/2 md:w-2/5 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">{BN_UI_TEXT.SUBTOTAL_LABEL}:</span> <span>{BN_UI_TEXT.BDT_SYMBOL} {(invoice.subtotal || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
            {(invoice.discountAmount || 0) > 0 && <div className="flex justify-between text-red-600"><span className="text-slate-600">{BN_UI_TEXT.DISCOUNT_LABEL} ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : BN_UI_TEXT.BDT_SYMBOL + invoice.discountValue}):</span> <span>- {BN_UI_TEXT.BDT_SYMBOL} {(invoice.discountAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>}
            {(invoice.taxAmount || 0) > 0 && <div className="flex justify-between text-green-600"><span className="text-slate-600">{BN_UI_TEXT.TAX_LABEL} ({invoice.taxType === 'percentage' ? `${invoice.taxValue}%` : BN_UI_TEXT.BDT_SYMBOL + invoice.taxValue}):</span> <span>+ {BN_UI_TEXT.BDT_SYMBOL} {(invoice.taxAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>}
            <div className="flex justify-between font-bold text-lg text-slate-800 border-t pt-1 mt-1"><span className="text-slate-700">{BN_UI_TEXT.GRAND_TOTAL_LABEL}:</span> <span>{BN_UI_TEXT.BDT_SYMBOL} {(invoice.totalAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
            {invoice.paymentsReceived && invoice.paymentsReceived.length > 0 && (
              <>
                <div className="flex justify-between text-green-600"><span className="text-slate-600">{BN_UI_TEXT.PAID_AMOUNT_LABEL}:</span> <span>{BN_UI_TEXT.BDT_SYMBOL} {(calculatedPaidAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
                <div className={`flex justify-between font-semibold ${remainingAmount > 0.009 ? 'text-red-600' : 'text-green-600'}`}><span className="text-slate-600">{BN_UI_TEXT.REMAINING_AMOUNT_LABEL}:</span> <span>{BN_UI_TEXT.BDT_SYMBOL} {(remainingAmount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span></div>
              </>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6 text-sm">
            <h4 className="font-semibold text-slate-700 mb-1">{BN_UI_TEXT.NOTES_TERMS_LABEL}:</h4>
            <p className="text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {invoice.paymentsReceived && invoice.paymentsReceived.length > 0 && (
            <div className="mb-6 text-sm">
                <h4 className="font-semibold text-slate-700 mb-2">{BN_UI_TEXT.PAYMENT_HISTORY_LABEL}</h4>
                <ul className="space-y-1.5">
                    {invoice.paymentsReceived.map(p => (
                        <li key={p.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                            <div className="flex justify-between items-center">
                                <span>{formatDateTime(p.paymentDate)} - {BN_UI_TEXT.BDT_SYMBOL} {(p.amount || 0).toLocaleString('bn-BD', {minimumFractionDigits:2})}</span>
                                <span className="text-slate-500">{p.paymentMethod ? paymentMethodTranslations[p.paymentMethod] : ''}</span>
                            </div>
                            {p.notes && <p className="text-slate-500 mt-0.5 text-[11px]">{BN_UI_TEXT.NOTES_LABEL}: {p.notes}</p>}
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>

      {!showPaymentForm && canRecordPayment && (
        <div className="mt-4 pt-4 border-t border-slate-200 text-center no-print">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 mx-auto"
            disabled={isSubmittingPayment}
          >
            <CreditCardIcon className="w-4 h-4" />
            <span>{BN_UI_TEXT.RECORD_PAYMENT_BTN_LABEL}</span>
          </button>
        </div>
      )}
      {invoice.paymentStatus === InvoicePaymentStatus.PAID && (
           <p className="text-center text-green-600 text-sm mt-4 no-print">{BN_UI_TEXT.INVOICE_ALREADY_PAID_INFO}</p>
      )}
      {invoice.paymentStatus === InvoicePaymentStatus.CANCELLED && (
            <p className="text-center text-slate-500 text-sm mt-4 no-print">{BN_UI_TEXT.INVOICE_CANCELLED_NO_PAYMENT}</p>
      )}

      {showPaymentForm && canRecordPayment && (
        <form onSubmit={handleRecordPaymentSubmit} className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-sm no-print">
          <h4 className="font-semibold text-slate-700 mb-2">{BN_UI_TEXT.PAYMENT_RECORD_FOR_INVOICE_TITLE.replace('{invoiceNumber}', invoice.invoiceNumber)}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="paymentAmount" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.PAYMENT_AMOUNT_LABEL} ({BN_UI_TEXT.REMAINING_AMOUNT_LABEL}: {remainingAmount.toLocaleString('bn-BD')}৳)</label>
              <input type="number" id="paymentAmount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                     className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                     min="0.01" step="0.01" max={remainingAmount} required disabled={isSubmittingPayment}/>
            </div>
            <div>
              <label htmlFor="paymentDateModal" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.PAYMENT_DATE_LABEL}</label>
              <input type="date" id="paymentDateModal" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                     className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" required disabled={isSubmittingPayment}/>
            </div>
          </div>
          <div>
            <label htmlFor="paymentMethod" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.PAYMENT_METHOD_LABEL}</label>
            <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as InvoicePaymentMethod)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white" disabled={isSubmittingPayment}>
                {paymentMethods.map(method => <option key={method} value={method}>{paymentMethodTranslations[method]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="paymentNotes" className="block text-xs font-medium text-slate-600 mb-0.5">{BN_UI_TEXT.PAYMENT_NOTES_LABEL}</label>
            <textarea id="paymentNotes" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                      placeholder={BN_UI_TEXT.PAYMENT_NOTES_PLACEHOLDER} rows={2}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500" disabled={isSubmittingPayment}></textarea>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setShowPaymentForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md" disabled={isSubmittingPayment}>
              {BN_UI_TEXT.CANCEL}
            </button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm flex items-center space-x-1 disabled:opacity-70" disabled={isSubmittingPayment}>
              <PlusCircleIcon className="w-3.5 h-3.5"/>
              <span>{isSubmittingPayment ? BN_UI_TEXT.LOADING : BN_UI_TEXT.ADD_PAYMENT_BTN_LABEL}</span>
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-4 text-right border-t border-slate-200 flex justify-end space-x-3 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center space-x-2"
        >
          <PrinterIcon className="w-4 h-4" />
          <span>{BN_UI_TEXT.PRINT_INVOICE_BTN}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
        >
          {BN_UI_TEXT.CLOSE_BTN}
        </button>
      </div>
    </Modal>
  );
};

export default ViewInvoiceModal;
