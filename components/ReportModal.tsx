
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Transaction, TransactionType } from '../types';
import { BN_UI_TEXT } from '../constants';
import TransactionList from './TransactionList'; 
import { useNotification } from '../contexts/NotificationContext';
import DownloadIcon from './icons/DownloadIcon';
import FilterIcon from './icons/FilterIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  allDescriptions: string[]; 
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onViewHistory: (transaction: Transaction) => void;
  onRestoreTransaction: (id: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions,
  allDescriptions,
  onDeleteTransaction,
  onEditTransaction,
  onViewHistory,
  onRestoreTransaction
}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [showDeletedInReport, setShowDeletedInReport] = useState(false);
  
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>([]);
  const [descriptionSearchTerm, setDescriptionSearchTerm] = useState('');
  const [isDescriptionDropdownOpen, setIsDescriptionDropdownOpen] = useState(false);
  const descriptionDropdownRef = useRef<HTMLDivElement>(null);
  const descriptionButtonRef = useRef<HTMLButtonElement>(null);


  const [reportData, setReportData] = useState<{
    filteredTransactions: Transaction[];
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    deletedCountInPeriod: number;
  } | null>(null);
  
  const { addNotification } = useNotification();

  const uniqueDescriptionsForFilter = useMemo(() => {
    return [...new Set(allDescriptions.map(d => d.split(" | ")[0]))].sort((a,b) => a.localeCompare(b, 'bn-BD'));
  }, [allDescriptions]);

  const filteredUniqueDescriptionsForDropdown = useMemo(() => {
    if (!descriptionSearchTerm.trim()) return uniqueDescriptionsForFilter;
    return uniqueDescriptionsForFilter.filter(desc => 
      desc.toLowerCase().includes(descriptionSearchTerm.toLowerCase())
    );
  }, [uniqueDescriptionsForFilter, descriptionSearchTerm]);

  const handleGenerateReport = useCallback(() => {
    if (!startDate || !endDate) {
      addNotification("অনুগ্রহ করে শুরুর এবং শেষের তারিখ নির্বাচন করুন।", 'warning');
      return;
    }
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); 
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); 

    let income = 0;
    let expense = 0;
    let deletedInPeriod = 0;

    const filteredForDisplay = transactions.filter(t => {
      const tDate = new Date(t.date);
      const isInPeriod = tDate >= start && tDate <= end;
      if (!isInPeriod) return false;

      const descriptionMatches = selectedDescriptions.length === 0 || selectedDescriptions.some(selDesc => {
          const mainTransactionDesc = t.description.split(" | ")[0].split(" [")[0];
          return mainTransactionDesc.toLowerCase() === selDesc.toLowerCase();
      });
      if (!descriptionMatches) return false;

      if (t.isDeleted) {
        deletedInPeriod++;
        return showDeletedInReport; 
      }
      if (t.type === TransactionType.INCOME) income += t.amount;
      else expense += t.amount;
      return true; 
    });

    setReportData({
      filteredTransactions: filteredForDisplay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      deletedCountInPeriod: deletedInPeriod,
    });
  }, [startDate, endDate, transactions, selectedDescriptions, showDeletedInReport, addNotification]);
  
  useEffect(() => {
    if (isOpen) {
      handleGenerateReport();
    } else {
      setReportData(null); 
      setShowDeletedInReport(false);
      setSelectedDescriptions([]);
      setDescriptionSearchTerm('');
      setIsDescriptionDropdownOpen(false);
    }
  }, [isOpen, startDate, endDate, showDeletedInReport, selectedDescriptions, handleGenerateReport]); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        descriptionDropdownRef.current &&
        !descriptionDropdownRef.current.contains(event.target as Node) &&
        descriptionButtonRef.current &&
        !descriptionButtonRef.current.contains(event.target as Node)
      ) {
        setIsDescriptionDropdownOpen(false);
      }
    };
    if (isDescriptionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDescriptionDropdownOpen]);


  const handleDescriptionSelectionChange = (description: string) => {
    setSelectedDescriptions(prev => 
      prev.includes(description) 
        ? prev.filter(d => d !== description)
        : [...prev, description]
    );
  };

  const handleToggleSelectAllVisibleDescriptions = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDescriptions(prev => Array.from(new Set([...prev, ...filteredUniqueDescriptionsForDropdown])));
    } else {
      setSelectedDescriptions(prev => prev.filter(d => !filteredUniqueDescriptionsForDropdown.includes(d)));
    }
  };
  
  const handleClearAllSelectedDescriptions = () => {
    setSelectedDescriptions([]);
    setDescriptionSearchTerm(''); // Optionally clear search term as well
  };


  const formatDisplayDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric'});
    } catch { return dateString; }
  }
  
  const formatIsoDateTimeForOutput = (isoDateString?: string): string => {
    if (!isoDateString) return 'N/A';
    try {
      const date = new Date(isoDateString);
      return date.toLocaleString('bn-BD', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(',', ''); 
    } catch (e) { return isoDateString; }
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadCSV = () => {
    if (!reportData || !reportData.filteredTransactions) {
      addNotification("রিপোর্ট ডেটা উপলব্ধ নেই।", 'error');
      return;
    }

    const headers = [
      "তারিখ (Date)", 
      "বিবরণ (Description)", 
      "ধরণ (Type)", 
      `পরিমাণ (${BN_UI_TEXT.BDT_SYMBOL}) (Amount)`,
      "অবস্থা (Status)"
    ];
    
    const csvRows = [headers.join(',')];

    reportData.filteredTransactions.forEach(t => {
      const date = formatIsoDateTimeForOutput(t.date);
      const description = `"${t.description.replace(/"/g, '""')}"`; 
      const type = t.type === TransactionType.INCOME ? BN_UI_TEXT.INCOME : BN_UI_TEXT.EXPENSE;
      const amount = t.amount.toFixed(2);
      const status = t.isDeleted ? "সরানো হয়েছে" : "সক্রিয়";
      csvRows.push([date, description, type, amount, status].join(','));
    });

    const csvString = "\uFEFF" + csvRows.join('\n'); 
    const fileName = `Report_${startDate}_to_${endDate}${selectedDescriptions.length > 0 ? '_Filtered' : ''}.csv`;
    downloadFile(csvString, fileName, 'text/csv;charset=utf-8;');
    addNotification("CSV ফাইল ডাউনলোড শুরু হয়েছে।", 'success');
  };

  const handleDownloadPDF = () => {
    if (!reportData || !reportData.filteredTransactions) {
      addNotification("রিপোর্ট ডেটা উপলব্ধ নেই।", 'error');
      return;
    }
    
    const doc = new jsPDF();
    let effectiveFont = 'Helvetica'; // Default to Helvetica

    try {
      // Attempt to set Noto Sans Bengali. This might not work without proper embedding.
      // The try-catch is to prevent failure if the font isn't available.
      // doc.addFont('https://fonts.gstatic.com/s/notosansbengali/v21/Cn-SJs6VTz3I6DdhgmkAaqAPU79fP_7D80y2z3g.ttf', 'Noto Sans Bengali', 'normal'); // REMOVED
      doc.setFont('Noto Sans Bengali', 'normal'); // This will likely use a fallback if not embedded
      // To check if font was actually set (complex, jsPDF doesn't provide an easy API for this)
      // For now, assume it might fall back and proceed. If issues, force Helvetica.
      // If Noto Sans Bengali is critical, true font embedding is needed.
      effectiveFont = 'Noto Sans Bengali'; // Assume it *might* work or fallback gracefully for text rendering
    } catch (e) {
      console.warn("Noto Sans Bengali could not be set in jsPDF for doc.setFont. Falling back to Helvetica for document text.", e);
      doc.setFont('Helvetica', 'normal');
      effectiveFont = 'Helvetica';
    }

    doc.setFontSize(18);
    doc.text(BN_UI_TEXT.REPORT_MODAL_TITLE, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const reportPeriodText = `${BN_UI_TEXT.REPORT_FOR_PERIOD} ${formatDisplayDate(startDate)} ${BN_UI_TEXT.TO_DATE} ${formatDisplayDate(endDate)}`;
    doc.text(reportPeriodText, 14, 30);
    
    let summaryY = 38;
    if (selectedDescriptions.length > 0) {
        const descFilterText = `${BN_UI_TEXT.REPORT_FOR_DESCRIPTIONS} ${selectedDescriptions.slice(0,3).join(', ')}${selectedDescriptions.length > 3 ? '...' : ''}`;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(descFilterText, 14, summaryY);
        summaryY += 7;
        doc.setFontSize(11);
        doc.setTextColor(100);
    }


    const summaryLines = [
      `${BN_UI_TEXT.SUMMARY_TOTAL_INCOME}: ${BN_UI_TEXT.BDT_SYMBOL} ${reportData.totalIncome.toLocaleString('bn-BD', {minimumFractionDigits: 2})}`,
      `${BN_UI_TEXT.SUMMARY_TOTAL_EXPENSE}: ${BN_UI_TEXT.BDT_SYMBOL} ${reportData.totalExpense.toLocaleString('bn-BD', {minimumFractionDigits: 2})}`,
      `${BN_UI_TEXT.NET_BALANCE_FOR_PERIOD}: ${BN_UI_TEXT.BDT_SYMBOL} ${reportData.netBalance.toLocaleString('bn-BD', {minimumFractionDigits: 2})}`
    ];
    
    summaryLines.forEach(line => {
      doc.text(line, 14, summaryY);
      summaryY += 7;
    });
    
    const tableColumnStyles: { [key: string]: any } = {
        3: { halign: 'right' }, // Amount column
        0: { cellWidth: 35 }, // Date column
        1: { cellWidth: 'auto'}, // Description column
        2: { cellWidth: 25 }, // Type column
    };

    const head = [[
        BN_UI_TEXT.DATE, 
        BN_UI_TEXT.DESCRIPTION, 
        BN_UI_TEXT.TRANSACTION_TYPE, 
        BN_UI_TEXT.AMOUNT + ` (${BN_UI_TEXT.BDT_SYMBOL})`
    ]];
    
    const body = reportData.filteredTransactions.map(t => [
      formatIsoDateTimeForOutput(t.date),
      t.description, 
      t.type === TransactionType.INCOME ? BN_UI_TEXT.INCOME : BN_UI_TEXT.EXPENSE,
      t.amount.toLocaleString('bn-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})
    ]);

    // For autoTable, explicitly use a known font to avoid "widths" error.
    // If Noto Sans Bengali was not truly embedded, using it here might lead to errors.
    // Using 'Helvetica' for table to ensure stability.
    const tableFont = effectiveFont === 'Noto Sans Bengali' ? 'Noto Sans Bengali' : 'Helvetica';


    autoTable(doc, {
      startY: summaryY + 5,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133], font: tableFont, fontStyle: 'bold' },
      bodyStyles: { font: tableFont },
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Light grey
      columnStyles: tableColumnStyles,
      didDrawPage: (data) => {
        // Footer
        let str = "পৃষ্ঠা " + doc.getNumberOfPages();
        doc.setFontSize(10);
        // Ensure footer font is also set robustly
        try {
            doc.setFont(tableFont, 'normal');
        } catch {
            doc.setFont('Helvetica', 'normal');
        }
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
    
    const fileName = `Report_${startDate}_to_${endDate}${selectedDescriptions.length > 0 ? '_Filtered' : ''}.pdf`;
    doc.save(fileName);
    addNotification("PDF ফাইল ডাউনলোড শুরু হয়েছে।", 'success');
  };
  

  if (!isOpen) return null;

  const descriptionButtonText = selectedDescriptions.length > 0 
    ? BN_UI_TEXT.DESCRIPTIONS_SELECTED_COUNT_TEXT.replace('{count}', selectedDescriptions.length.toString())
    : BN_UI_TEXT.SELECT_DESCRIPTIONS_BTN_TEXT;


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[95]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <h2 id="report-modal-title" className="text-xl font-semibold text-slate-800">
            {BN_UI_TEXT.REPORT_MODAL_TITLE}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <p className="text-sm font-medium text-slate-600">{BN_UI_TEXT.SELECT_DATE_RANGE}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-slate-500 mb-1">{BN_UI_TEXT.START_DATE}</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-slate-500 mb-1">{BN_UI_TEXT.END_DATE}</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
           <div className="relative">
            <button
              ref={descriptionButtonRef}
              type="button"
              onClick={() => setIsDescriptionDropdownOpen(prev => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm text-sm
                ${isDescriptionDropdownOpen ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-300'}
                ${selectedDescriptions.length > 0 ? 'bg-teal-50 text-teal-700' : 'bg-white text-slate-700 hover:border-slate-400'}`}
              aria-haspopup="listbox"
              aria-expanded={isDescriptionDropdownOpen}
            >
              <span className="flex items-center">
                <FilterIcon className={`w-4 h-4 mr-2 ${selectedDescriptions.length > 0 ? 'text-teal-600' : 'text-slate-400'}`} />
                {descriptionButtonText}
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDescriptionDropdownOpen ? 'rotate-180' : ''} ${selectedDescriptions.length > 0 ? 'text-teal-600' : 'text-slate-400'}`} />
            </button>
            {isDescriptionDropdownOpen && (
              <div
                ref={descriptionDropdownRef}
                className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-72 flex flex-col"
                role="listbox"
              >
                <div className="p-2 border-b border-slate-200">
                  <input
                    type="search"
                    value={descriptionSearchTerm}
                    onChange={(e) => setDescriptionSearchTerm(e.target.value)}
                    placeholder={BN_UI_TEXT.SEARCH_DESCRIPTIONS_PLACEHOLDER}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar-modal">
                  {filteredUniqueDescriptionsForDropdown.length === 0 ? (
                     <p className="text-xs text-slate-500 text-center py-2">{BN_UI_TEXT.NO_DESCRIPTIONS_AVAILABLE}</p>
                  ) : (
                    filteredUniqueDescriptionsForDropdown.map(desc => (
                      <label key={desc} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedDescriptions.includes(desc)}
                          onChange={() => handleDescriptionSelectionChange(desc)}
                          className="form-checkbox h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-slate-700">{desc}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                  <button onClick={() => handleToggleSelectAllVisibleDescriptions(true)} className="text-xs text-teal-600 hover:underline">{BN_UI_TEXT.SELECT_ALL_VISIBLE_DESCRIPTIONS_LABEL}</button>
                  <button onClick={() => handleToggleSelectAllVisibleDescriptions(false)} className="text-xs text-orange-600 hover:underline">{BN_UI_TEXT.DESELECT_ALL_VISIBLE_DESCRIPTIONS_LABEL}</button>
                  <button onClick={handleClearAllSelectedDescriptions} className="text-xs text-red-600 hover:underline">{BN_UI_TEXT.CLEAR_SELECTION_BTN_TEXT}</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerateReport}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-150"
            >
              {BN_UI_TEXT.GENERATE_REPORT_BTN}
            </button>
          </div>
        </div>
        
        {reportData ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
            <div className="mb-4 p-3 bg-sky-50 rounded-md border border-sky-200 text-sm">
              <h3 className="font-semibold text-sky-700 mb-1.5">{BN_UI_TEXT.REPORT_SUMMARY_TITLE}</h3>
              <p>{BN_UI_TEXT.REPORT_FOR_PERIOD} <span className="font-medium">{formatDisplayDate(startDate)}</span> {BN_UI_TEXT.TO_DATE} <span className="font-medium">{formatDisplayDate(endDate)}</span></p>
              {selectedDescriptions.length > 0 && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {BN_UI_TEXT.REPORT_FOR_DESCRIPTIONS} <span className="font-medium">{selectedDescriptions.join(', ')}</span>
                </p>
              )}
              <p>{BN_UI_TEXT.SUMMARY_TOTAL_INCOME}: <span className="font-medium text-green-600">{BN_UI_TEXT.BDT_SYMBOL} {reportData.totalIncome.toLocaleString('bn-BD', {minimumFractionDigits: 2})}</span></p>
              <p>{BN_UI_TEXT.SUMMARY_TOTAL_EXPENSE}: <span className="font-medium text-red-600">{BN_UI_TEXT.BDT_SYMBOL} {reportData.totalExpense.toLocaleString('bn-BD', {minimumFractionDigits: 2})}</span></p>
              <p>{BN_UI_TEXT.NET_BALANCE_FOR_PERIOD}: <span className={`font-medium ${reportData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{BN_UI_TEXT.BDT_SYMBOL} {reportData.netBalance.toLocaleString('bn-BD', {minimumFractionDigits: 2})}</span></p>
               {reportData.deletedCountInPeriod > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-sky-100">
                    <label className="flex items-center space-x-2 text-xs text-orange-700">
                    <input
                        type="checkbox"
                        checked={showDeletedInReport}
                        onChange={(e) => setShowDeletedInReport(e.target.checked)}
                        className="form-checkbox h-3.5 w-3.5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                    />
                    <span>রিপোর্টে {reportData.deletedCountInPeriod}টি সরানো লেনদেন অন্তর্ভুক্ত করুন</span>
                    </label>
                </div>
                )}
            </div>
            {reportData.filteredTransactions.length > 0 ? (
              <TransactionList
                transactions={reportData.filteredTransactions}
                onDeleteTransaction={onDeleteTransaction}
                onEditTransaction={onEditTransaction}
                onViewHistory={onViewHistory}
                onRestoreTransaction={onRestoreTransaction}
                showTitle={false}
                initialShowDeleted={showDeletedInReport} 
              />
            ) : (
              <p className="text-slate-500 text-center py-6">{BN_UI_TEXT.NO_TRANSACTIONS_IN_RANGE}</p>
            )}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
             <p className="text-slate-500">{BN_UI_TEXT.LOADING} অথবা রিপোর্ট জেনারেট করতে উপরের ফর্ম ব্যবহার করুন...</p>
          </div>
        )}

        <div className="mt-6 pt-4 text-right border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
           {reportData && reportData.filteredTransactions.length > 0 && (
            <>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <DownloadIcon className="w-4 h-4"/> <span>CSV ডাউনলোড করুন</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                 <DownloadIcon className="w-4 h-4"/> <span>PDF ডাউনলোড করুন</span>
              </button>
            </>
           )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {BN_UI_TEXT.CLOSE_BTN}
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};
