
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Invoice, InvoiceItem, InvoicePaymentStatus, InvoiceType } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import { useNotification } from '../contexts/NotificationContext';
import DownloadIcon from './icons/DownloadIcon';
import FilterIcon from './icons/FilterIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface StockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  invoices: Invoice[];
}

const StockReportModal: React.FC<StockReportModalProps> = ({ isOpen, onClose, products, invoices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setStockStatusFilter('all');
      setIsFilterDropdownOpen(false);
    }
  }, [isOpen]);

  const getStockStatus = (currentStock: number, lowStockThreshold?: number): { text: string; colorClass: string; chipColorClass: string } => {
    if (currentStock <= 0) {
      return { text: BN_UI_TEXT.STOCK_STATUS_OUT_OF_STOCK, colorClass: 'text-red-600', chipColorClass: 'bg-red-100 text-red-700' };
    }
    if (lowStockThreshold !== undefined && currentStock <= lowStockThreshold) {
      return { text: BN_UI_TEXT.STOCK_STATUS_LOW_STOCK, colorClass: 'text-orange-600', chipColorClass: 'bg-orange-100 text-orange-700' };
    }
    return { text: BN_UI_TEXT.STOCK_STATUS_IN_STOCK, colorClass: 'text-green-600', chipColorClass: 'bg-green-100 text-green-700' };
  };

  const calculateCommittedStockForSales = useMemo(() => {
    const committedMap: Record<string, number> = {};
    products.forEach(p => committedMap[p.id] = 0);

    invoices.forEach(invoice => {
      if (
        invoice.invoiceType === InvoiceType.SALES &&
        !invoice.isDeleted &&
        invoice.paymentStatus !== InvoicePaymentStatus.PAID &&
        invoice.paymentStatus !== InvoicePaymentStatus.CANCELLED
      ) {
        invoice.items.forEach(item => {
          const product = products.find(p => p.id === item.originalProductId || p.name === item.productName);
          if (product) {
            committedMap[product.id] = (committedMap[product.id] || 0) + item.quantity;
          }
        });
      }
    });
    return committedMap;
  }, [invoices, products]);


  const filteredProductsData = useMemo(() => {
    return products
      .filter(p => !p.isDeleted)
      .map(p => {
        const committedForSales = calculateCommittedStockForSales[p.id] || 0;
        const availableForSale = p.currentStock - committedForSales;
        const currentStockStatusInfo = getStockStatus(p.currentStock, p.lowStockThreshold);
        const availableForSaleStatusInfo = getStockStatus(availableForSale, p.lowStockThreshold);
        return {
          ...p,
          committedStockForSales: committedForSales,
          availableForSale,
          currentStockStatusInfo,
          availableForSaleStatusInfo,
        };
      })
      .filter(pData => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const nameMatch = pData.name.toLowerCase().includes(lowerSearchTerm);
        const descriptionMatch = pData.description && pData.description.toLowerCase().includes(lowerSearchTerm);
        
        let statusMatch = true;
        if (stockStatusFilter !== 'all') {
          if (stockStatusFilter === 'in_stock') statusMatch = pData.currentStockStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_IN_STOCK && pData.availableForSaleStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_IN_STOCK;
          else if (stockStatusFilter === 'low_stock') statusMatch = pData.currentStockStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_LOW_STOCK || pData.availableForSaleStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_LOW_STOCK;
          else if (stockStatusFilter === 'out_of_stock') statusMatch = pData.currentStockStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_OUT_OF_STOCK || pData.availableForSaleStatusInfo.text === BN_UI_TEXT.STOCK_STATUS_OUT_OF_STOCK;
        }
        return (nameMatch || descriptionMatch) && statusMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'bn-BD'));
  }, [products, searchTerm, stockStatusFilter, calculateCommittedStockForSales]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);


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
    if (filteredProductsData.length === 0) {
      addNotification(BN_UI_TEXT.NO_PRODUCTS_FOR_REPORT, 'warning');
      return;
    }
    const headers = [
      BN_UI_TEXT.SERIAL_NO_COLUMN,
      BN_UI_TEXT.COLUMN_PRODUCT_NAME,
      BN_UI_TEXT.COLUMN_CURRENT_STOCK,
      BN_UI_TEXT.COLUMN_COMMITTED_FOR_SALES,
      BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE,
      BN_UI_TEXT.COLUMN_STOCK_UNIT,
      BN_UI_TEXT.COLUMN_LOW_STOCK_THRESHOLD,
      `${BN_UI_TEXT.COLUMN_CURRENT_STOCK} (${BN_UI_TEXT.COLUMN_STOCK_STATUS})`,
      `${BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE} (${BN_UI_TEXT.COLUMN_STOCK_STATUS})`,
    ];
    const csvRows = [headers.join(',')];
    filteredProductsData.forEach((pData, index) => {
      csvRows.push([
        (index + 1).toLocaleString('bn-BD'),
        `"${pData.name.replace(/"/g, '""')}"`,
        pData.currentStock.toLocaleString('bn-BD'),
        pData.committedStockForSales.toLocaleString('bn-BD'),
        pData.availableForSale.toLocaleString('bn-BD'),
        pData.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE,
        (pData.lowStockThreshold || 0).toLocaleString('bn-BD'),
        pData.currentStockStatusInfo.text,
        pData.availableForSaleStatusInfo.text
      ].join(','));
    });
    const csvString = "\uFEFF" + csvRows.join('\n');
    downloadFile(csvString, 'Stock_Report.csv', 'text/csv;charset=utf-8;');
    addNotification("CSV ফাইল ডাউনলোড শুরু হয়েছে।", 'success');
  };

  const handleDownloadPDF = () => {
    if (filteredProductsData.length === 0) {
        addNotification(BN_UI_TEXT.NO_PRODUCTS_FOR_REPORT, 'warning');
        return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.addFont('https://fonts.gstatic.com/s/notosansbengali/v21/Cn-SJs6VTz3I6DdhgmkAaqAPU79fP_7D80y2z3g.ttf', 'Noto Sans Bengali', 'normal');
    doc.setFont('Noto Sans Bengali');

    doc.setFontSize(16);
    doc.text(BN_UI_TEXT.STOCK_REPORT_MODAL_TITLE, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${BN_UI_TEXT.REPORT_FOR_PERIOD} ${new Date().toLocaleDateString('bn-BD')}`, 14, 25);

    const head = [[
        BN_UI_TEXT.SERIAL_NO_COLUMN,
        BN_UI_TEXT.COLUMN_PRODUCT_NAME,
        BN_UI_TEXT.COLUMN_CURRENT_STOCK,
        BN_UI_TEXT.COLUMN_COMMITTED_FOR_SALES,
        BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE,
        BN_UI_TEXT.COLUMN_STOCK_UNIT,
        BN_UI_TEXT.COLUMN_LOW_STOCK_THRESHOLD,
        `${BN_UI_TEXT.COLUMN_CURRENT_STOCK.split(" ")[0]} ${BN_UI_TEXT.COLUMN_STOCK_STATUS}`,
        `${BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE.split(" ")[0]} ${BN_UI_TEXT.COLUMN_STOCK_STATUS}`
    ]];
    const body = filteredProductsData.map((pData, index) => {
        return [
            (index + 1).toLocaleString('bn-BD'),
            pData.name,
            pData.currentStock.toLocaleString('bn-BD'),
            pData.committedStockForSales.toLocaleString('bn-BD'),
            pData.availableForSale.toLocaleString('bn-BD'),
            pData.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE,
            (pData.lowStockThreshold || 0).toLocaleString('bn-BD'),
            pData.currentStockStatusInfo.text,
            pData.availableForSaleStatusInfo.text
        ];
    });

    autoTable(doc, {
        startY: 30,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133], font: 'Noto Sans Bengali', fontStyle: 'bold', fontSize: 7 },
        bodyStyles: { font: 'Noto Sans Bengali', fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 }, // Serial
            1: { cellWidth: 'auto' }, // Product Name
            2: { halign: 'right', cellWidth: 18 }, // Current Stock
            3: { halign: 'right', cellWidth: 18 }, // Committed
            4: { halign: 'right', cellWidth: 18 }, // Available
            5: { cellWidth: 12 }, // Stock Unit
            6: { halign: 'right', cellWidth: 18 }, // Low Stock Threshold
            7: { halign: 'center', cellWidth: 22 }, // Current Stock Status
            8: { halign: 'center', cellWidth: 22 }, // Available Stock Status
        },
        didDrawPage: (data) => {
            let str = "পৃষ্ঠা " + doc.getNumberOfPages();
            doc.setFontSize(10);
            doc.setFont('Noto Sans Bengali', 'normal');
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });
    doc.save('Stock_Report.pdf');
    addNotification("PDF ফাইল ডাউনলোড শুরু হয়েছে।", 'success');
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.STOCK_REPORT_MODAL_TITLE} size="3xl">
      <div className="flex flex-col h-full">
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <input
            type="text"
            placeholder={BN_UI_TEXT.SEARCH_PRODUCTS_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-grow px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
          <div className="relative w-full sm:w-auto sm:min-w-[180px]">
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setIsFilterDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm text-sm bg-white text-slate-700 hover:border-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              aria-haspopup="listbox"
              aria-expanded={isFilterDropdownOpen}
            >
              <span className="flex items-center">
                <FilterIcon className="w-4 h-4 mr-2 text-slate-400" />
                {stockStatusFilter === 'all' ? BN_UI_TEXT.FILTER_BY_STOCK_STATUS : getStockStatus(stockStatusFilter === 'in_stock' ? 10 : (stockStatusFilter === 'low_stock' ? 1 : 0), stockStatusFilter === 'low_stock' ? 2 : undefined).text }
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''} text-slate-400`} />
            </button>
            {isFilterDropdownOpen && (
              <div
                ref={filterDropdownRef}
                className="absolute z-20 mt-1 w-full bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar-modal"
                role="listbox"
              >
                {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as StockStatusFilter[]).map(status => (
                  <button
                    key={status}
                    onClick={() => { setStockStatusFilter(status); setIsFilterDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    role="option"
                    aria-selected={stockStatusFilter === status}
                  >
                    {status === 'all' ? BN_UI_TEXT.ALL_PRODUCTS_FILTER : getStockStatus(status === 'in_stock' ? 10 : (status === 'low_stock' ? 1 : 0), status === 'low_stock' ? 2 : undefined).text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-modal pr-1">
          {filteredProductsData.length === 0 ? (
            <p className="text-slate-500 text-center py-10">
              {BN_UI_TEXT.NO_PRODUCTS_FOR_REPORT}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.SERIAL_NO_COLUMN}</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.COLUMN_PRODUCT_NAME}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.COLUMN_CURRENT_STOCK}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.COLUMN_COMMITTED_FOR_SALES}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE}</th>
                    <th className="px-2 py-2 text-left font-medium text-slate-600">{BN_UI_TEXT.COLUMN_STOCK_UNIT}</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-600">{BN_UI_TEXT.COLUMN_LOW_STOCK_THRESHOLD}</th>
                    <th className="px-2 py-2 text-center font-medium text-slate-600">{`${BN_UI_TEXT.COLUMN_CURRENT_STOCK.split(" ")[0]} ${BN_UI_TEXT.COLUMN_STOCK_STATUS}`}</th>
                    <th className="px-2 py-2 text-center font-medium text-slate-600">{`${BN_UI_TEXT.COLUMN_AVAILABLE_FOR_SALE.split(" ")[0]} ${BN_UI_TEXT.COLUMN_STOCK_STATUS}`}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredProductsData.map((pData, index) => (
                      <tr key={pData.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 whitespace-nowrap text-slate-500">{ (index + 1).toLocaleString('bn-BD') }</td>
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-slate-700">{pData.name}</td>
                        <td className={`px-2 py-2 whitespace-nowrap text-right font-semibold ${pData.currentStockStatusInfo.colorClass}`}>{pData.currentStock.toLocaleString('bn-BD')}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-right text-slate-500">{pData.committedStockForSales.toLocaleString('bn-BD')}</td>
                        <td className={`px-2 py-2 whitespace-nowrap text-right font-semibold ${pData.availableForSaleStatusInfo.colorClass}`}>{pData.availableForSale.toLocaleString('bn-BD')}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-500">{pData.stockUnit || BN_UI_TEXT.DEFAULT_UNIT_PIECE}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-right text-slate-500">{(pData.lowStockThreshold || 0).toLocaleString('bn-BD')}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${pData.currentStockStatusInfo.chipColorClass}`}>
                            {pData.currentStockStatusInfo.text}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${pData.availableForSaleStatusInfo.chipColorClass}`}>
                            {pData.availableForSaleStatusInfo.text}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {filteredProductsData.length > 0 && (
            <>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <DownloadIcon className="w-4 h-4"/> <span>CSV</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                 <DownloadIcon className="w-4 h-4"/> <span>PDF</span>
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
    </Modal>
  );
};

export default StockReportModal;
