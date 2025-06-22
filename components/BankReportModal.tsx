
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Invoice, Person, BankAccount, Debt, DebtType, TransactionType, InvoicePaymentStatus, InvoiceType } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import DownloadIcon from './icons/DownloadIcon';
import FilterIcon from './icons/FilterIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable'; // or autoTable from 'jspdf-autotable'


interface ReportItem {
  id: string;
  date: string;
  description: string;
  typeLabel: string;
  debit: number;
  credit: number;
  runningBalance: number;
  originalItemType: 'transaction' | 'invoice_payment' | 'debt_settlement';
  originalItemId: string;
}

interface BankReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  invoices: Invoice[];
  persons: Person[];
  bankAccounts: BankAccount[];
  debts: Debt[];
}

const BankReportModal: React.FC<BankReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  invoices,
  persons,
  bankAccounts,
  debts,
}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('all');
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const [includeDirectTransactions, setIncludeDirectTransactions] = useState(true);
  const [includeSalesPayments, setIncludeSalesPayments] = useState(true);
  const [includePurchasePayments, setIncludePurchasePayments] = useState(true);
  const [includeDebtSettlements, setIncludeDebtSettlements] = useState(true);

  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  const getPersonName = (personId: string) => persons.find(p => p.id === personId)?.name || BN_UI_TEXT.UNKNOWN_PERSON;

  const generateReportData = () => {
    if (!startDate || !endDate) {
      alert(BN_UI_TEXT.SELECT_DATE_RANGE);
      return;
    }
    const reportStartDate = new Date(startDate);
    reportStartDate.setHours(0,0,0,0);
    const reportEndDate = new Date(endDate);
    reportEndDate.setHours(23,59,59,999);

    let currentOpeningBalance = 0;
    const itemsForReport: ReportItem[] = [];
    
    const selectedBank = bankAccounts.find(ba => ba.id === selectedBankAccountId);

    if (selectedBank) { // Single bank selected
      currentOpeningBalance = selectedBank.initialBalance;
      // Adjust opening balance with pre-period transactions for this specific bank
      transactions.forEach(t => {
        if (t.bankAccountId === selectedBank.id && new Date(t.date) < reportStartDate) {
          currentOpeningBalance += (t.type === TransactionType.INCOME ? t.amount : -t.amount);
        }
      });
      invoices.forEach(inv => {
        inv.paymentsReceived?.forEach(p => {
          if (p.bankAccountId === selectedBank.id && new Date(p.paymentDate) < reportStartDate) {
            currentOpeningBalance += (inv.invoiceType === InvoiceType.SALES ? p.amount : -p.amount);
          }
        });
      });
    } else if (selectedBankAccountId === 'all') { // All banks selected
        bankAccounts.filter(ba => !ba.isDeleted).forEach(bank => {
            currentOpeningBalance += bank.initialBalance;
            transactions.forEach(t => {
                if (t.bankAccountId === bank.id && new Date(t.date) < reportStartDate) {
                    currentOpeningBalance += (t.type === TransactionType.INCOME ? t.amount : -t.amount);
                }
            });
            invoices.forEach(inv => {
                inv.paymentsReceived?.forEach(p => {
                if (p.bankAccountId === bank.id && new Date(p.paymentDate) < reportStartDate) {
                    currentOpeningBalance += (inv.invoiceType === InvoiceType.SALES ? p.amount : -p.amount);
                }
                });
            });
        });
    }


    if (includeDirectTransactions) {
      transactions.filter(t => 
        (selectedBankAccountId === 'all' ? !!t.bankAccountId : t.bankAccountId === selectedBankAccountId) &&
        new Date(t.date) >= reportStartDate && new Date(t.date) <= reportEndDate && !t.isDeleted
      ).forEach(t => {
        itemsForReport.push({
          id: `tx-${t.id}`, date: t.date, description: t.description,
          typeLabel: t.type === TransactionType.INCOME ? BN_UI_TEXT.ENTRY_TYPE_INCOME : BN_UI_TEXT.ENTRY_TYPE_EXPENSE,
          credit: t.type === TransactionType.INCOME ? t.amount : 0,
          debit: t.type === TransactionType.EXPENSE ? t.amount : 0,
          runningBalance: 0, originalItemType: 'transaction', originalItemId: t.id
        });
      });
    }

    if (includeSalesPayments) {
      invoices.filter(inv => inv.invoiceType === InvoiceType.SALES && !inv.isDeleted)
        .forEach(inv => {
          inv.paymentsReceived?.forEach(p => {
            if ( (selectedBankAccountId === 'all' ? !!p.bankAccountId : p.bankAccountId === selectedBankAccountId) &&
                 new Date(p.paymentDate) >= reportStartDate && new Date(p.paymentDate) <= reportEndDate) {
              itemsForReport.push({
                id: `invp-${inv.id}-${p.id}`, date: p.paymentDate, 
                description: `${BN_UI_TEXT.ENTRY_TYPE_SALES_PAYMENT} (${inv.invoiceNumber} - ${getPersonName(inv.personId)})`,
                typeLabel: BN_UI_TEXT.ENTRY_TYPE_SALES_PAYMENT,
                credit: p.amount, debit: 0, runningBalance: 0, originalItemType: 'invoice_payment', originalItemId: inv.id
              });
            }
          });
        });
    }
    
    if (includePurchasePayments) {
      invoices.filter(inv => inv.invoiceType === InvoiceType.PURCHASE && !inv.isDeleted)
        .forEach(inv => {
          inv.paymentsReceived?.forEach(p => {
             if ( (selectedBankAccountId === 'all' ? !!p.bankAccountId : p.bankAccountId === selectedBankAccountId) &&
                 new Date(p.paymentDate) >= reportStartDate && new Date(p.paymentDate) <= reportEndDate) {
                itemsForReport.push({
                    id: `invp-${inv.id}-${p.id}`, date: p.paymentDate,
                    description: `${BN_UI_TEXT.ENTRY_TYPE_PURCHASE_PAYMENT} (${inv.invoiceNumber} - ${getPersonName(inv.personId)})`,
                    typeLabel: BN_UI_TEXT.ENTRY_TYPE_PURCHASE_PAYMENT,
                    credit: 0, debit: p.amount, runningBalance: 0, originalItemType: 'invoice_payment', originalItemId: inv.id
                });
            }
          });
        });
    }
    
    if (includeDebtSettlements) {
        transactions.filter(t => 
            t.linkedLedgerEntryId?.startsWith('debt_settle_') &&
            (selectedBankAccountId === 'all' ? !!t.bankAccountId : t.bankAccountId === selectedBankAccountId) &&
            new Date(t.date) >= reportStartDate && new Date(t.date) <= reportEndDate && !t.isDeleted
        ).forEach(t => {
            const typeLabel = t.type === TransactionType.INCOME ? BN_UI_TEXT.ENTRY_TYPE_DEBT_RECEIVED_TO_BANK : BN_UI_TEXT.ENTRY_TYPE_DEBT_PAID_FROM_BANK;
            itemsForReport.push({
                id: `debt-tx-${t.id}`, date: t.date, description: t.description,
                typeLabel: typeLabel,
                credit: t.type === TransactionType.INCOME ? t.amount : 0,
                debit: t.type === TransactionType.EXPENSE ? t.amount : 0,
                runningBalance: 0, originalItemType: 'debt_settlement', originalItemId: t.linkedLedgerEntryId || t.id
            });
        });
    }


    itemsForReport.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = currentOpeningBalance;
    let currentTotalCredits = 0;
    let currentTotalDebits = 0;

    const finalReportItems = itemsForReport.map(item => {
      runningBalance = runningBalance + item.credit - item.debit;
      currentTotalCredits += item.credit;
      currentTotalDebits += item.debit;
      return { ...item, runningBalance };
    });

    setOpeningBalance(currentOpeningBalance);
    setReportItems(finalReportItems);
    setTotalCredits(currentTotalCredits);
    setTotalDebits(currentTotalDebits);
    setClosingBalance(runningBalance);
  };
  
  useEffect(() => {
    if(isOpen) generateReportData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedBankAccountId, startDate, endDate, includeDirectTransactions, includeSalesPayments, includePurchasePayments, includeDebtSettlements]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.BANK_REPORT_MODAL_TITLE} size="3xl">
      <div className="flex flex-col h-full">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label htmlFor="bankAccountFilter" className="block text-xs font-medium text-slate-500 mb-1">{BN_UI_TEXT.SELECT_BANK_ACCOUNT_LABEL}</label>
              <select id="bankAccountFilter" value={selectedBankAccountId} onChange={e => setSelectedBankAccountId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white">
                <option value="all">{BN_UI_TEXT.ALL_BANK_ACCOUNTS_OPTION}</option>
                {bankAccounts.filter(ba => !ba.isDeleted).map(ba => <option key={ba.id} value={ba.id}>{ba.accountName}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reportStartDate" className="block text-xs font-medium text-slate-500 mb-1">{BN_UI_TEXT.START_DATE}</label>
              <input type="date" id="reportStartDate" value={startDate} onChange={e => setStartDate(e.target.value)} 
                     className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white" />
            </div>
            <div>
              <label htmlFor="reportEndDate" className="block text-xs font-medium text-slate-500 mb-1">{BN_UI_TEXT.END_DATE}</label>
              <input type="date" id="reportEndDate" value={endDate} onChange={e => setEndDate(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">{BN_UI_TEXT.FILTER_BY_ENTRY_TYPE_LABEL}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                {[
                    {label: BN_UI_TEXT.INCLUDE_DIRECT_TRANSACTIONS_LABEL, state: includeDirectTransactions, setter: setIncludeDirectTransactions},
                    {label: BN_UI_TEXT.INCLUDE_SALES_INVOICE_PAYMENTS_LABEL, state: includeSalesPayments, setter: setIncludeSalesPayments},
                    {label: BN_UI_TEXT.INCLUDE_PURCHASE_BILL_PAYMENTS_LABEL, state: includePurchasePayments, setter: setIncludePurchasePayments},
                    {label: BN_UI_TEXT.INCLUDE_DEBT_SETTLEMENTS_LABEL, state: includeDebtSettlements, setter: setIncludeDebtSettlements},
                ].map(filter => (
                    <label key={filter.label} className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={filter.state} onChange={e => filter.setter(e.target.checked)}
                               className="form-checkbox h-3.5 w-3.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
                        <span className="text-slate-700">{filter.label}</span>
                    </label>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          <div className="mb-3 p-2.5 bg-sky-50 rounded-md border border-sky-200 text-xs">
            <h3 className="font-semibold text-sky-700 mb-1">{BN_UI_TEXT.REPORT_SUMMARY_TITLE}</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <span>{BN_UI_TEXT.OPENING_BALANCE_LABEL}:</span> <span className="text-right font-medium">{openingBalance.toLocaleString('bn-BD', {minimumFractionDigits:2})}৳</span>
                <span>{BN_UI_TEXT.TOTAL_CREDITS_LABEL}:</span> <span className="text-right font-medium text-green-600">+{totalCredits.toLocaleString('bn-BD', {minimumFractionDigits:2})}৳</span>
                <span>{BN_UI_TEXT.TOTAL_DEBITS_LABEL}:</span> <span className="text-right font-medium text-red-600">-{totalDebits.toLocaleString('bn-BD', {minimumFractionDigits:2})}৳</span>
                <span className="font-semibold">{BN_UI_TEXT.CLOSING_BALANCE_LABEL}:</span> <span className={`text-right font-semibold ${closingBalance >= 0 ? 'text-sky-700' : 'text-red-700'}`}>{closingBalance.toLocaleString('bn-BD', {minimumFractionDigits:2})}৳</span>
            </div>
          </div>
          
          {reportItems.length === 0 ? (
            <p className="text-slate-500 text-center py-8">{BN_UI_TEXT.NO_BANK_ACTIVITIES_FOR_PERIOD}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_DATE_HEADER}</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_DESCRIPTION_HEADER}</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_TYPE_HEADER}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_CREDIT_HEADER}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_DEBIT_HEADER}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.REPORT_TABLE_BALANCE_HEADER}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {reportItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-2 py-2 whitespace-nowrap text-slate-500">{new Date(item.date).toLocaleDateString('bn-BD')}</td>
                      <td className="px-2 py-2 whitespace-normal break-words max-w-xs text-slate-700">{item.description}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-slate-600">{item.typeLabel}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-right text-green-600">{item.credit > 0 ? item.credit.toLocaleString('bn-BD',{minimumFractionDigits:2}) : '-'}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-right text-red-600">{item.debit > 0 ? item.debit.toLocaleString('bn-BD',{minimumFractionDigits:2}) : '-'}</td>
                      <td className={`px-2 py-2 whitespace-nowrap text-right font-medium ${item.runningBalance >= 0 ? 'text-slate-800' : 'text-red-700'}`}>{item.runningBalance.toLocaleString('bn-BD',{minimumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Download buttons can be added here later */}
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 rounded-lg shadow-sm">
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BankReportModal;