
import { User, UserSuggestion, Invoice, InvoiceType, InvoicePaymentMethod } from '../types'; // Corrected path and added UserSuggestion, Invoice, InvoiceType, InvoicePaymentMethod
import bcrypt from 'bcryptjs'; // Import bcrypt

const API_BASE_URL = 'https://live.medha4u.com/';
const ACCESS_TOKEN = 'DzhIpz0ALDkOKCx6Bqvg4RYNgrwQWpyk';

interface ColumnDefinition {
  name: string;
  type: string;
  options?: string;
}

// Generic request function
async function makeApiRequest(payload: { method: string; table?: string; [key: string]: any }): Promise<any> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.success === false) {
      console.error(
        'API Request Failed. Status:', response.status, response.statusText,
        '\nBackend Response:', JSON.stringify(responseData, null, 2),
        '\nOriginal Payload:', JSON.stringify(payload, null, 2)
      );
      let errMsg = responseData.error || `API request failed with status ${response.status}.`;
      if (responseData.success === false && !responseData.error) {
        errMsg += " The backend indicated failure but did not provide a specific error message. Check backend logs and ensure the backend's JSON response includes an 'error' field on failure.";
      }
      if (payload.method === 'tableCreate' && responseData.sql) {
          errMsg += ` Attempted SQL: ${responseData.sql || 'N/A'}`;
      }
      // Special handling for specific password reset backend errors if needed
      if (payload.method === 'requestPasswordReset' && responseData.error?.includes("User not found")) {
        // This specific error can be handled differently by the caller, maybe not throwing
      }
      throw new Error(errMsg);
    }
    return responseData;
  } catch (error: any) { 
    console.error(
        'Exception during API Request. Error:', error,
        '\nOriginal Payload:', JSON.stringify(payload, null, 2)
    );
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(`Network error: Failed to fetch from API (${API_BASE_URL}). Check API server status and CORS configuration.`);
    }
    throw error; 
  }
}

async function createTableIfNotExists(
  tableName: string, 
  columnsDefinition: ColumnDefinition[],
  charset: string = "utf8mb4"
): Promise<any> {
  return makeApiRequest({
    method: 'tableCreate',
    table: tableName, 
    columns: columnsDefinition,
    charset: charset,
  });
}

export const schemas: Record<string, ColumnDefinition[]> = {
  users: [ 
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'name', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'email', type: 'VARCHAR(255)', options: 'NOT NULL UNIQUE' },
    { name: 'mobileNumber', type: 'VARCHAR(255)', options: 'NULL UNIQUE' },
    { name: 'facebookProfileUrl', type: 'TEXT', options: 'NULL' },
    { name: 'hashed_password', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'created_at', type: 'TIMESTAMP', options: 'DEFAULT CURRENT_TIMESTAMP' },
    { name: 'reset_code', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'reset_token_expiry', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    // Sales Invoice Defaults
    { name: 'defaultSalesPaymentStatus', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesInvoiceDateOffset', type: 'INTEGER', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesDueDateOffset', type: 'INTEGER', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesCompanyProfileId', type: 'VARCHAR(255)', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesDiscountType', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesDiscountValue', type: 'REAL', options: 'NULL DEFAULT NULL' }, 
    { name: 'defaultSalesTaxType', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesTaxValue', type: 'REAL', options: 'NULL DEFAULT NULL' }, 
    { name: 'defaultSalesPaymentMethod', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesPaymentNotes', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultSalesInvoiceNotes', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    // Purchase Bill Defaults
    { name: 'defaultPurchaseBillDateOffset', type: 'INTEGER', options: 'NULL DEFAULT NULL' },
    { name: 'defaultPurchaseDueDateOffset', type: 'INTEGER', options: 'NULL DEFAULT NULL' },
    { name: 'defaultPurchaseCompanyProfileId', type: 'VARCHAR(255)', options: 'NULL DEFAULT NULL' },
    { name: 'defaultPurchaseDiscountType', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultPurchaseDiscountValue', type: 'REAL', options: 'NULL DEFAULT NULL' }, 
    { name: 'defaultPurchaseTaxType', type: 'TEXT', options: 'NULL DEFAULT NULL' },
    { name: 'defaultPurchaseTaxValue', type: 'REAL', options: 'NULL DEFAULT NULL' }, 
  ],
  company_profiles: [ 
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'companyName', type: 'TEXT', options: 'NOT NULL' },
    { name: 'address', type: 'TEXT', options: 'NULL' },
    { name: 'phone', type: 'TEXT', options: 'NULL' },
    { name: 'email', type: 'TEXT', options: 'NULL' },
    { name: 'logoBase64', type: 'MEDIUMTEXT', options: 'NULL' },
    { name: 'taxId', type: 'TEXT', options: 'NULL' },
    { name: 'isDefault', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'createdAt', type: 'TEXT', options: 'NOT NULL' },
    { name: 'lastModified', type: 'TEXT', options: 'NOT NULL' },
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT', options: 'NULL' },
  ],
  transactions: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'date', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'amount', type: 'REAL' },
    { name: 'type', type: 'TEXT' },
    { name: 'originalDate', type: 'TEXT' },
    { name: 'lastModified', type: 'TEXT' },
    { name: 'editHistory', type: 'MEDIUMTEXT' }, 
    { name: 'linkedLedgerEntryId', type: 'TEXT' },
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT', options: 'NULL' },
  ],
  persons: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'name', type: 'TEXT' },
    { name: 'customAlias', type: 'TEXT', options: 'NULL' }, 
    { name: 'mobileNumber', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'shopName', type: 'TEXT' },
    { name: 'email', type: 'TEXT', options: 'NULL' },
    { name: 'profileImage', type: 'MEDIUMTEXT', options: 'NULL' }, 
    { name: 'systemUserId', type: 'VARCHAR(255)', options: 'NULL' }, 
    { name: 'createdAt', type: 'TEXT' },
    { name: 'lastModified', type: 'TEXT' },
    { name: 'editHistory', type: 'MEDIUMTEXT' }, 
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT', options: 'NULL' },
  ],
  debts: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'personId', type: 'TEXT' },
    { name: 'originalAmount', type: 'REAL' },
    { name: 'remainingAmount', type: 'REAL' },
    { name: 'description', type: 'TEXT' },
    { name: 'type', type: 'TEXT' },
    { name: 'dueDate', type: 'TEXT' },
    { name: 'isSettled', type: 'INTEGER' }, 
    { name: 'creationDate', type: 'TEXT' },
    { name: 'settledDate', type: 'TEXT' },
    { name: 'lastModified', type: 'TEXT' },
    { name: 'editHistory', type: 'MEDIUMTEXT' },  
  ],
  person_ledger_entries: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'personId', type: 'TEXT' },
    { name: 'date', type: 'TEXT' },
    { name: 'type', type: 'TEXT' },
    { name: 'amount', type: 'REAL' },
    { name: 'description', type: 'TEXT' },
    { name: 'balanceAfterEntry', type: 'REAL' },
  ],
  user_transaction_suggestions: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'text', type: 'TEXT', options: 'NOT NULL' },
    { name: 'type', type: 'TEXT', options: 'NOT NULL' },
  ],
  budgetCategories: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'name', type: 'TEXT', options: 'NOT NULL' },
    { name: 'associatedSuggestions', type: 'TEXT' }, 
    { name: 'createdAt', type: 'TEXT' },
    { name: 'lastModified', type: 'TEXT' },
  ],
  budgets: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'categoryId', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'amount', type: 'REAL', options: 'NOT NULL' },
    { name: 'period', type: 'TEXT', options: 'NOT NULL' }, 
    { name: 'startDate', type: 'TEXT', options: 'NOT NULL' }, 
    { name: 'endDate', type: 'TEXT', options: 'NOT NULL' }, 
    { name: 'createdAt', type: 'TEXT' },
    { name: 'lastModified', type: 'TEXT' },
  ],
  messages: [
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' }, 
    { name: 'threadId', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'actualSenderId', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'actualReceiverId', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'content', type: 'TEXT', options: 'NOT NULL' },
    { name: 'imageContent', type: 'MEDIUMTEXT', options: 'NULL' }, 
    { name: 'audioContent', type: 'MEDIUMTEXT', options: 'NULL' },
    { name: 'timestamp', type: 'TEXT', options: 'NOT NULL' }, 
    { name: 'isRead', type: 'INTEGER', options: 'NOT NULL DEFAULT 0' }, 
    { name: 'reactions', type: 'TEXT', options: 'NULL' },
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' }, 
    { name: 'deletedAt', type: 'TEXT', options: 'NULL' },       
    { name: 'editHistory', type: 'MEDIUMTEXT', options: 'NULL' }, 
  ],
  invoices: [ 
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'invoiceNumber', type: 'VARCHAR(255)', options: 'NOT NULL' }, 
    { name: 'invoiceType', type: 'TEXT', options: "NOT NULL" }, 
    { name: 'invoiceDate', type: 'TEXT', options: 'NOT NULL' },
    { name: 'dueDate', type: 'TEXT' },
    { name: 'personId', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'companyProfileId', type: 'VARCHAR(255)', options: 'NULL' },
    { name: 'items', type: 'MEDIUMTEXT', options: 'NOT NULL' }, 
    { name: 'subtotal', type: 'REAL', options: 'NOT NULL' },
    { name: 'discountType', type: 'TEXT' },
    { name: 'discountValue', type: 'REAL' },
    { name: 'discountAmount', type: 'REAL' },
    { name: 'taxType', type: 'TEXT' },
    { name: 'taxValue', type: 'REAL' },
    { name: 'taxAmount', type: 'REAL' },
    { name: 'totalAmount', type: 'REAL', options: 'NOT NULL' },
    { name: 'notes', type: 'TEXT' },
    { name: 'paymentStatus', type: 'TEXT', options: 'NOT NULL' },
    { name: 'paymentsReceived', type: 'MEDIUMTEXT', options: 'NULL' },
    { name: 'createdAt', type: 'TEXT', options: 'NOT NULL' },
    { name: 'lastModified', type: 'TEXT', options: 'NOT NULL' },
    { name: 'editHistory', type: 'MEDIUMTEXT' }, 
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT' },
  ],
  products: [ 
    { name: 'id', type: 'VARCHAR(255)', options: 'PRIMARY KEY' },
    { name: 'user_id', type: 'VARCHAR(255)', options: 'NOT NULL' },
    { name: 'name', type: 'TEXT', options: 'NOT NULL' },
    { name: 'description', type: 'TEXT', options: 'NULL' },
    { name: 'unitPrice', type: 'REAL', options: 'NULL' }, // Sales Price
    { name: 'unit', type: 'TEXT', options: 'NULL' },
    { name: 'productImage', type: 'MEDIUMTEXT', options: 'NULL' },
    { name: 'mrp', type: 'REAL', options: 'NULL' },
    { name: 'wholesalePrice', type: 'REAL', options: 'NULL' },
    { name: 'createdAt', type: 'TEXT', options: 'NOT NULL' },
    { name: 'lastModified', type: 'TEXT', options: 'NOT NULL' },
    { name: 'isDeleted', type: 'INTEGER', options: 'DEFAULT 0' },
    { name: 'deletedAt', type: 'TEXT', options: 'NULL' },
    // Inventory Management Fields
    { name: 'currentStock', type: 'REAL', options: 'DEFAULT 0' },
    { name: 'stockUnit', type: 'TEXT', options: 'NULL' },
    { name: 'lowStockThreshold', type: 'REAL', options: 'DEFAULT 0' },
    { name: 'stockHistory', type: 'MEDIUMTEXT', options: 'NULL'}
  ],
};


function addUserScopeToData(data: Record<string, any>, ownerUserId: string): Record<string, any> {
  const { userId, ...restOfData } = data; 
  return { ...restOfData, user_id: ownerUserId }; 
}

function addUserScopeToWhereClause(whereClause: string, userIdValue: string): string {
  const escapedUserId = userIdValue.replace(/'/g, "''"); 
  return `user_id = '${escapedUserId}' AND (${whereClause})`;
}


function prepareDataForStorage(data: Record<string, any>): Record<string, any> {
  const processedData = { ...data };
  if (processedData.hasOwnProperty('userId')) { 
    delete processedData.userId;
  }
  
  const fieldsToStringify = ['editHistory', 'associatedSuggestions', 'imageContent', 'audioContent', 'reactions', 'items', 'paymentsReceived', 'logoBase64', 'stockHistory', 'productImage']; 
  fieldsToStringify.forEach(fieldKey => {
    if (processedData[fieldKey] && (Array.isArray(processedData[fieldKey]) || typeof processedData[fieldKey] === 'object')) {
      processedData[fieldKey] = JSON.stringify(processedData[fieldKey]);
    } else if (processedData[fieldKey] === undefined && (fieldKey === 'items' || fieldKey === 'paymentsReceived' || fieldKey === 'editHistory' || fieldKey === 'associatedSuggestions' || fieldKey === 'stockHistory')) {
      processedData[fieldKey] = JSON.stringify([]); 
    }
  });

  const booleanFieldsToConvert: (keyof typeof processedData)[] = ['isSettled', 'isDeleted', 'isRead', 'isDefault'];
  booleanFieldsToConvert.forEach(fieldKey => {
    if (typeof processedData[fieldKey] === 'boolean') {
      processedData[fieldKey] = processedData[fieldKey] ? 1 : 0;
    }
  });
  
  const nullableFields: (keyof typeof processedData)[] = [
    'customAlias', 'systemUserId', 'profileImage', 'productImage', 'email', 'facebookProfileUrl', 
    'deletedAt', 'linkedLedgerEntryId', 'originalDate', 'dueDate', 'settledDate', 
    'reset_code', 'reset_token_expiry', 
    'defaultSalesPaymentStatus', 'defaultSalesInvoiceDateOffset', 'defaultSalesDueDateOffset', 'defaultSalesCompanyProfileId', 
    'defaultSalesDiscountType', 'defaultSalesDiscountValue', 'defaultSalesTaxType', 'defaultSalesTaxValue',
    'defaultSalesPaymentMethod', 'defaultSalesPaymentNotes', 'defaultSalesInvoiceNotes', // Added new sales defaults
    'defaultPurchaseBillDateOffset', 'defaultPurchaseDueDateOffset', 'defaultPurchaseCompanyProfileId', 
    'defaultPurchaseDiscountType', 'defaultPurchaseDiscountValue', 'defaultPurchaseTaxType', 'defaultPurchaseTaxValue',
    'imageContent', 'audioContent', 'reactions', 'editHistory', 
    'discountType', 'discountValue', 'discountAmount', 'taxType', 'taxValue', 'taxAmount', 'notes', 'paymentsReceived', 
    'description', 'unitPrice', 'unit', 'address', 'phone', 'logoBase64', 'taxId', 'companyProfileId', 
    'stockUnit', 'lowStockThreshold', 'stockHistory', 'mrp', 'wholesalePrice'
  ]; 
  nullableFields.forEach(field => {
    if (processedData.hasOwnProperty(field) && processedData[field] === undefined) {
        if (field === 'paymentsReceived' || field === 'items' || field === 'editHistory' || field === 'associatedSuggestions' || field === 'stockHistory') {
             processedData[field] = JSON.stringify([]);
        } else if (typeof field === 'string' && (String(field).endsWith('Value') || String(field).endsWith('Offset') || field === 'defaultSalesPaymentMethod' || field === 'defaultSalesPaymentNotes' || field === 'defaultSalesInvoiceNotes') && processedData[field] === undefined) { // Added new sales defaults
            processedData[field] = null; 
        } else {
            processedData[field] = null;
        }
    }
  });
  
  // Ensure numeric fields that should default to 0 are handled if undefined
  const numericFieldsDefaultZero: (keyof typeof processedData)[] = ['currentStock', 'lowStockThreshold'];
  numericFieldsDefaultZero.forEach(field => {
    if (processedData[field] === undefined) {
        processedData[field] = 0;
    }
  });


  return processedData;
}

function parseDataFromStorage<T>(item: Record<string, any>): T {
    const parsedItem = { ...item } as any;
    
    if (parsedItem.user_id && !parsedItem.userId) {
        parsedItem.userId = parsedItem.user_id;
        delete parsedItem.user_id;
    }

    const fieldsToParseAsJson = ['editHistory', 'associatedSuggestions', 'imageContent', 'audioContent', 'reactions', 'items', 'paymentsReceived', 'logoBase64', 'stockHistory', 'productImage']; 
    fieldsToParseAsJson.forEach(fieldKey => {
        if (parsedItem[fieldKey] && typeof parsedItem[fieldKey] === 'string') {
            try {
                parsedItem[fieldKey] = JSON.parse(parsedItem[fieldKey]);
            } catch (e: any) {
                console.error(`Failed to parse ${fieldKey} for item:`, item, e.message);
                 if (fieldKey === 'imageContent' || fieldKey === 'reactions' || fieldKey === 'audioContent' || fieldKey === 'logoBase64' || fieldKey === 'productImage') { 
                    parsedItem[fieldKey] = undefined;
                 } else { 
                    parsedItem[fieldKey] = []; 
                 }
            }
        } else if (parsedItem[fieldKey] === null || parsedItem[fieldKey] === undefined) {
            if (fieldKey === 'editHistory' || fieldKey === 'associatedSuggestions' || fieldKey === 'items' || fieldKey === 'paymentsReceived' || fieldKey === 'stockHistory') {
                 parsedItem[fieldKey] = [];
            } else if (fieldKey === 'imageContent' || fieldKey === 'reactions' || fieldKey === 'audioContent' || fieldKey === 'logoBase64' || fieldKey === 'productImage') {
                 parsedItem[fieldKey] = undefined;
            }
        }
    });

    const booleanFieldsFromInt = ['isSettled', 'isDeleted', 'isRead', 'isDefault']; 
    booleanFieldsFromInt.forEach(field => {
      if (parsedItem[field] !== undefined && parsedItem[field] !== null) {
        parsedItem[field] = !!Number(parsedItem[field]);
      }
    });
    
    if (parsedItem.paymentsReceived && Array.isArray(parsedItem.paymentsReceived)) {
      parsedItem.paymentsReceived = parsedItem.paymentsReceived.map((payment: any) => {
        const paymentAmountNum = parseFloat(payment.amount);
        return {
          ...payment,
          amount: isNaN(paymentAmountNum) ? 0 : paymentAmountNum,
        };
      });
    }

    if (parsedItem.items && Array.isArray(parsedItem.items)) {
        parsedItem.items = parsedItem.items.map((invoiceItem: any) => {
            const quantityNum = parseFloat(invoiceItem.quantity);
            const unitPriceNum = parseFloat(invoiceItem.unitPrice);
            const totalNum = parseFloat(invoiceItem.total);
            return {
                ...invoiceItem,
                quantity: isNaN(quantityNum) ? 0 : quantityNum,
                unitPrice: isNaN(unitPriceNum) ? 0 : unitPriceNum,
                total: isNaN(totalNum) ? 0 : totalNum,
            };
        });
    }
    
    const numericFields = [
        'amount', 'originalAmount', 'remainingAmount', 'balanceAfterEntry', 
        'subtotal', 'discountValue', 'discountAmount', 'taxValue', 'taxAmount', 'totalAmount', 
        'unitPrice', 'mrp', 'wholesalePrice', 'currentStock', 'lowStockThreshold', 
        'defaultSalesInvoiceDateOffset', 'defaultSalesDueDateOffset', 'defaultSalesDiscountValue', 'defaultSalesTaxValue',
        'defaultPurchaseBillDateOffset', 'defaultPurchaseDueDateOffset', 'defaultPurchaseDiscountValue', 'defaultPurchaseTaxValue'
    ]; 
    numericFields.forEach(field => {
        if (parsedItem[field] !== undefined && parsedItem[field] !== null) {
            const numVal = parseFloat(parsedItem[field]);
            if (!isNaN(numVal)) {
                parsedItem[field] = numVal;
            } else {
                if (['unitPrice', 'mrp', 'wholesalePrice', 'defaultSalesInvoiceDateOffset', 'defaultSalesDueDateOffset', 'defaultSalesDiscountValue', 'defaultSalesTaxValue', 'defaultPurchaseBillDateOffset', 'defaultPurchaseDueDateOffset', 'defaultPurchaseDiscountValue', 'defaultPurchaseTaxValue'].includes(field)) {
                    parsedItem[field] = undefined;
                } else {
                    parsedItem[field] = 0;
                }
            }
        } else {
             if (['currentStock', 'lowStockThreshold'].includes(field)) {
                parsedItem[field] = 0; 
             } else if (['unitPrice', 'mrp', 'wholesalePrice', 'defaultSalesInvoiceDateOffset', 'defaultSalesDueDateOffset', 'defaultSalesDiscountValue', 'defaultSalesTaxValue', 'defaultPurchaseBillDateOffset', 'defaultPurchaseDueDateOffset', 'defaultPurchaseDiscountValue', 'defaultPurchaseTaxValue'].includes(field)) {
                parsedItem[field] = undefined;
             } else {
                parsedItem[field] = 0;
             }
        }
    });
    
    const nullableFieldsFromDb: string[] = [
        'customAlias', 'systemUserId', 'profileImage', 'productImage', 'email', 'facebookProfileUrl', 
        'defaultSalesPaymentStatus', 'defaultSalesInvoiceDateOffset', 'defaultSalesDueDateOffset', 'defaultSalesCompanyProfileId', 
        'defaultSalesDiscountType', 'defaultSalesDiscountValue', 'defaultSalesTaxType', 'defaultSalesTaxValue', 
        'defaultSalesPaymentMethod', 'defaultSalesPaymentNotes', 'defaultSalesInvoiceNotes', // Added new sales defaults
        'defaultPurchaseBillDateOffset', 'defaultPurchaseDueDateOffset', 'defaultPurchaseCompanyProfileId', 
        'defaultPurchaseDiscountType', 'defaultPurchaseDiscountValue', 'defaultPurchaseTaxType', 'defaultPurchaseTaxValue', 
        'deletedAt', 'linkedLedgerEntryId', 'originalDate', 'dueDate', 'settledDate', 'reset_code', 'reset_token_expiry', 
        'imageContent', 'audioContent', 'reactions', 'editHistory', 
        'discountType', 'discountValue', 'discountAmount', 'taxType', 'taxValue', 'taxAmount', 'notes', 'items', 'paymentsReceived', 
        'description', 'unitPrice', 'unit', 'address', 'phone', 'logoBase64', 'taxId', 'companyProfileId', 
        'stockUnit', 'stockHistory', 'mrp', 'wholesalePrice'
    ];
    nullableFieldsFromDb.forEach(field => {
        if (parsedItem[field as string] === null) {
            if (field === 'editHistory' || field === 'items' || field === 'paymentsReceived' || field === 'associatedSuggestions' || field === 'stockHistory') {
                parsedItem[field as string] = [];
            } else if (String(field).endsWith('Value') || String(field).endsWith('Offset') || ['unitPrice', 'logoBase64', 'stockUnit', 'productImage', 'mrp', 'wholesalePrice', 'defaultSalesPaymentMethod', 'defaultSalesPaymentNotes', 'defaultSalesInvoiceNotes'].includes(field)) { // Added new sales defaults
                 parsedItem[field as string] = undefined;
            }
             else {
                parsedItem[field as string] = undefined;
            }
        }
    });
    
    if (parsedItem.hasOwnProperty('stockUnit') && (parsedItem.stockUnit === undefined || parsedItem.stockUnit === null)) {
        parsedItem.stockUnit = "পিস"; 
    }
    if (!parsedItem.hasOwnProperty('stockUnit') && item.hasOwnProperty('name')) {
        parsedItem.stockUnit = "পিস";
    }

    return parsedItem as T;
}

export async function fetchRecords<T>(
  baseTableName: string, 
  userIdForContext: string, 
  whereClause: string = "1",
  includeDeleted: boolean = false 
): Promise<T[]> {
  if (!userIdForContext && baseTableName !== 'users') throw new Error("User ID context required for fetching records from non-user tables.");
  
  let finalWhereClause = baseTableName === 'users' ? whereClause : addUserScopeToWhereClause(whereClause, userIdForContext);

  const softDeleteTablesWithGlobalFlag = ['transactions', 'persons', 'invoices', 'products', 'company_profiles']; 
  if (softDeleteTablesWithGlobalFlag.includes(baseTableName) && !includeDeleted) {
    finalWhereClause = `${finalWhereClause} AND (isDeleted IS NULL OR isDeleted = 0)`;
  }
  
  const response = await makeApiRequest({
    method: 'tableFetch',
    table: baseTableName,
    where: finalWhereClause,
  });
  if (response.success && response.data && Array.isArray(response.data)) {
    return response.data.map(item => parseDataFromStorage<T>(item));
  }
  return [];
}

export async function insertRecord(baseTableName: string, userIdForContext: string, data: object): Promise<any> {
  let dataToInsert = data as Record<string, any>;

  if (baseTableName !== 'users') {
    if (!userIdForContext) throw new Error("User ID context required for inserting records into non-user tables.");
    dataToInsert = addUserScopeToData(dataToInsert, userIdForContext);
  }

  let processedData = prepareDataForStorage(dataToInsert);

  const tableSchema = schemas[baseTableName];
  if (tableSchema) {
    const allowedColumnNames = new Set(tableSchema.map(col => col.name.toLowerCase()));
    const filteredData: Record<string, any> = {};
    for (const key in processedData) {
      if (allowedColumnNames.has(key.toLowerCase())) {
        filteredData[key] = processedData[key];
      }
    }
    processedData = filteredData;
  } else {
    console.warn(`Schema not found for table ${baseTableName} in apiService.insertRecord. Sending all processed fields.`);
  }
  
  if ((baseTableName === 'messages' || baseTableName === 'invoices' || baseTableName === 'transactions' || baseTableName === 'persons' || baseTableName === 'debts') && !processedData.editHistory) {
    const initialVersionContent: any = { isDeleted: false };
     let timestampForHistory = new Date().toISOString();

    if(baseTableName === 'transactions') {
        initialVersionContent.date = processedData.date;
        initialVersionContent.description = processedData.description;
        initialVersionContent.amount = processedData.amount;
        initialVersionContent.type = processedData.type;
        timestampForHistory = processedData.lastModified || processedData.date || timestampForHistory;
    } else if (baseTableName === 'persons') {
        initialVersionContent.name = processedData.name;
        initialVersionContent.mobileNumber = processedData.mobileNumber;
        initialVersionContent.email = processedData.email;
        timestampForHistory = processedData.lastModified || processedData.createdAt || timestampForHistory;
    } else if (baseTableName === 'debts') {
        initialVersionContent.personId = processedData.personId;
        initialVersionContent.originalAmount = processedData.originalAmount;
        initialVersionContent.remainingAmount = processedData.remainingAmount;
        initialVersionContent.type = processedData.type;
        initialVersionContent.isSettled = processedData.isSettled;
        initialVersionContent.creationDate = processedData.creationDate;
        timestampForHistory = processedData.lastModified || processedData.creationDate || timestampForHistory;
    } else if (baseTableName === 'messages') {
      initialVersionContent.content = processedData.content;
      initialVersionContent.imageContent = processedData.imageContent ? JSON.parse(processedData.imageContent) : undefined;
      initialVersionContent.audioContent = processedData.audioContent ? JSON.parse(processedData.audioContent) : undefined;
      timestampForHistory = processedData.timestamp || timestampForHistory;
    } else if (baseTableName === 'invoices') {
        initialVersionContent.invoiceNumber = processedData.invoiceNumber;
        initialVersionContent.invoiceType = processedData.invoiceType; // Added invoiceType to history
        initialVersionContent.invoiceDate = processedData.invoiceDate;
        initialVersionContent.dueDate = processedData.dueDate;
        initialVersionContent.personId = processedData.personId;
        initialVersionContent.companyProfileId = processedData.companyProfileId; 
        initialVersionContent.items = processedData.items ? JSON.parse(processedData.items) : [];
        initialVersionContent.subtotal = processedData.subtotal;
        initialVersionContent.totalAmount = processedData.totalAmount;
        initialVersionContent.paymentStatus = processedData.paymentStatus;
        initialVersionContent.paymentsReceived = processedData.paymentsReceived ? JSON.parse(processedData.paymentsReceived) : [];
        timestampForHistory = processedData.lastModified || processedData.createdAt || timestampForHistory;
    }

    const initialVersionEntry = {
        timestamp: timestampForHistory,
        action: 'created',
        userId: userIdForContext,
        snapshot: initialVersionContent,
    };
    processedData.editHistory = JSON.stringify([initialVersionEntry]);
  }


  return makeApiRequest({
    method: 'tableInsert',
    table: baseTableName,
    fields: processedData,
  });
}

export async function updateRecord(baseTableName: string, userIdForContext: string, data: object, whereClause: string): Promise<any> {
  if (!userIdForContext && baseTableName !== 'users') throw new Error("User ID context required for updating records in non-user tables.");
  
  let processedData = prepareDataForStorage(data as Record<string, any>);
  
  const tableSchema = schemas[baseTableName];
  if (tableSchema) {
    const allowedColumnNames = new Set(tableSchema.map(col => col.name.toLowerCase()));
    const filteredData: Record<string, any> = {};
    for (const key in processedData) {
      if (allowedColumnNames.has(key.toLowerCase())) {
        filteredData[key] = processedData[key];
      }
    }
    processedData = filteredData;
  } else {
    console.warn(`Schema not found for table ${baseTableName} in apiService.updateRecord. Sending all processed fields.`);
  }

  const finalWhereClause = baseTableName === 'users' ? whereClause : addUserScopeToWhereClause(whereClause, userIdForContext);

  return makeApiRequest({
    method: 'tableUpdate',
    table: baseTableName,
    fields: processedData,
    where: finalWhereClause,
  });
}

export async function deleteRecord(baseTableName: string, userIdForContext: string, whereClause: string): Promise<any> {
  if (!userIdForContext && baseTableName !== 'users' && baseTableName !== 'user_transaction_suggestions') { 
     throw new Error("User ID context required for deleting records from non-user tables.");
  }
  
  const finalWhereClause = (baseTableName === 'users' || baseTableName === 'user_transaction_suggestions') 
    ? whereClause 
    : addUserScopeToWhereClause(whereClause, userIdForContext);
    
  return makeApiRequest({
    method: 'tableDelete',
    table: baseTableName,
    where: finalWhereClause,
  });
}


export async function fetchUserSuggestions(userIdForContext: string): Promise<UserSuggestion[]> {
  if (!userIdForContext) throw new Error("User ID required for fetching suggestions.");
  const baseTableName = 'user_transaction_suggestions';
  try {
    const records = await fetchRecords<UserSuggestion>(baseTableName, userIdForContext, "1");
    return records; 
  } catch (error: any) {
    console.warn(`Could not fetch suggestions for user ${userIdForContext}. Error: ${error.message}`);
    return [];
  }
}

export async function addUserSuggestion(userIdForContext: string, suggestionData: Omit<UserSuggestion, 'userId'>): Promise<any> {
  if (!userIdForContext) throw new Error("User ID required for adding suggestion.");
  const baseTableName = 'user_transaction_suggestions';
  const dataToInsert = {
    ...suggestionData, 
    user_id: userIdForContext,
  };
  return insertRecord(baseTableName, userIdForContext, dataToInsert);
}

export async function updateUserSuggestion(userIdForContext: string, suggestionId: string, newText: string): Promise<any> {
  if (!userIdForContext) throw new Error("User ID required for updating suggestion.");
  const baseTableName = 'user_transaction_suggestions';
  const dataToUpdate = { text: newText };
  const whereClause = `id = '${suggestionId.replace(/'/g, "''")}'`;
  return updateRecord(baseTableName, userIdForContext, dataToUpdate, whereClause);
}

export async function deleteUserSuggestion(userIdForContext: string, suggestionId: string): Promise<any> {
  if (!userIdForContext) throw new Error("User ID required for deleting suggestion.");
  const baseTableName = 'user_transaction_suggestions';
  const whereClause = `id = '${suggestionId.replace(/'/g, "''")}'`; 
  return deleteRecord(baseTableName, userIdForContext, whereClause);
}

let sharedTablesInitializedStatus: 'pending' | 'success' | 'failed' = 'pending';

export async function initializeSharedTablesIfNeeded(): Promise<void> {
  console.log("Starting shared table initialization and schema check...");
  sharedTablesInitializedStatus = 'pending';
  const tableInitializationPromises = [];

  for (const tableName in schemas) {
    const expectedSchemaColumns = schemas[tableName];
    
    const tableSetupPromise = (async () => {
      try {
        const createResponse = await createTableIfNotExists(tableName, expectedSchemaColumns);
        console.log(`Shared table ${tableName} creation/check response: SQL: ${createResponse.sql || 'N/A'}, Success: ${createResponse.success}, MySQL Error: ${createResponse.error || 'N/A'}`);
        if (createResponse.success === false && !(createResponse.error?.toLowerCase().includes('already exists') || createResponse.error?.toLowerCase().includes('table exist'))) {
          throw new Error(createResponse.error || `Backend reported failure for table ${tableName}. SQL: ${createResponse.sql || 'N/A'}`);
        }

        const describeResponse = await makeApiRequest({ method: 'describeTable', table: tableName });
        if (!describeResponse.success || !Array.isArray(describeResponse.structure)) {
          console.warn(`Could not describe table '${tableName}'. Skipping column check. Response:`, describeResponse);
          throw new Error(`Failed to describe table '${tableName}'. Cannot verify or add columns.`);
        }
        const existingColumnNames = describeResponse.structure.map((col: any) => col.Field.toLowerCase());

        for (const expectedColumn of expectedSchemaColumns) {
          if (!existingColumnNames.includes(expectedColumn.name.toLowerCase())) {
            console.log(`Column '${expectedColumn.name}' missing in table '${tableName}'. Attempting to add.`);
            const addColumnResponse = await makeApiRequest({
              method: 'columnAdd',
              table: tableName,
              column: {
                name: expectedColumn.name,
                type: expectedColumn.type,
                options: expectedColumn.options || '',
              },
            });
            console.log(`Add column '${expectedColumn.name}' to '${tableName}': Success: ${addColumnResponse.success}, SQL: ${addColumnResponse.sql || 'N/A'}, Error: ${addColumnResponse.error || 'N/A'}`);
            if (addColumnResponse.success === false) {
                 console.warn(`Failed to add column '${expectedColumn.name}' to table '${tableName}'. Error: ${addColumnResponse.error}. This might cause issues.`);
                 if ( (tableName === 'transactions' || tableName === 'persons' || tableName === 'debts' || tableName === 'messages' || tableName === 'invoices' || tableName === 'company_profiles' || tableName === 'products') && (expectedColumn.name === 'editHistory' || expectedColumn.name === 'logoBase64' || expectedColumn.name === 'stockHistory' || expectedColumn.name === 'productImage') ) { 
                    throw new Error(`Critical column '${expectedColumn.name}' (MEDIUMTEXT) could not be added to '${tableName}'.`);
                 }
                 if (tableName === 'persons' && (expectedColumn.name === 'profileImage' || expectedColumn.name === 'email' || expectedColumn.name === 'customAlias' || expectedColumn.name === 'systemUserId')) { 
                     throw new Error(`Critical column '${expectedColumn.name}' could not be added to 'persons' table.`);
                 }
                 if (tableName === 'users' && (expectedColumn.name === 'reset_code' || expectedColumn.name === 'reset_token_expiry' || expectedColumn.name.startsWith('defaultSales') || expectedColumn.name.startsWith('defaultPurchase') )) {
                    throw new Error(`Critical column '${expectedColumn.name}' could not be added to 'users' table.`);
                 }
                  if (tableName === 'users' && expectedColumn.name === 'mobileNumber') {
                    throw new Error(`Critical column 'mobileNumber' could not be added to 'users' table.`);
                 }
                 if (tableName === 'users' && expectedColumn.name === 'facebookProfileUrl') {
                    throw new Error(`Critical column 'facebookProfileUrl' could not be added to 'users' table.`);
                 }
                 if (tableName === 'messages' && (expectedColumn.name === 'threadId' || expectedColumn.name === 'actualSenderId' || expectedColumn.name === 'actualReceiverId' || expectedColumn.name === 'imageContent' || expectedColumn.name === 'reactions' || expectedColumn.name === 'audioContent' || expectedColumn.name === 'isDeleted' || expectedColumn.name === 'deletedAt' )) { 
                    throw new Error(`Critical column '${expectedColumn.name}' could not be added to 'messages' table.`);
                 }
                 if (tableName === 'invoices' && (expectedColumn.name === 'items' || expectedColumn.name === 'paymentsReceived' || expectedColumn.name === 'companyProfileId' || expectedColumn.name === 'invoiceType' )) {
                    throw new Error(`Critical column '${expectedColumn.name}' could not be added to 'invoices' table.`);
                 }
                 if (tableName === 'products' && (expectedColumn.name === 'currentStock' || expectedColumn.name === 'stockUnit' || expectedColumn.name === 'lowStockThreshold' || expectedColumn.name === 'stockHistory' || expectedColumn.name === 'productImage' || expectedColumn.name === 'mrp' || expectedColumn.name === 'wholesalePrice') ) { 
                     throw new Error(`Critical column '${expectedColumn.name}' could not be added to 'products' table.`);
                 }
            }
          }
        }
      } catch (err: any) {
        console.error(`Error processing table '${tableName}':`, err.message);
        throw new Error(`Setup failed for table '${tableName}': ${err.message}`);
      }
    })();
    tableInitializationPromises.push(tableSetupPromise);
  }

  try {
    await Promise.all(tableInitializationPromises);
    sharedTablesInitializedStatus = 'success'; 
    console.log("All shared table initializations and alterations successfully completed or reported success by backend.");
  } catch (error) {
    sharedTablesInitializedStatus = 'failed'; 
    console.error("One or more shared table initializations/alterations failed:", error);
    throw error; 
  }
}

export async function fetchUserByMobile(mobileNumber: string): Promise<User | null> {
  if (!mobileNumber || !mobileNumber.trim()) {
    return null;
  }
  const trimmedMobile = mobileNumber.trim();
  try {
    const response = await makeApiRequest({
      method: 'tableFetch',
      table: 'users', 
      where: `mobileNumber = '${trimmedMobile.replace(/'/g, "''")}'`,
    });
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      const userFromDb = parseDataFromStorage<User>(response.data[0]);
      return { 
        id: userFromDb.id,
        name: userFromDb.name,
        email: userFromDb.email,
        mobileNumber: userFromDb.mobileNumber, 
      };
    }
    return null;
  } catch (error: any) {
    console.error(`Error fetching user by mobile ${trimmedMobile}:`, error.message);
    return null;
  }
}


// --- Password Reset Functions ---
export async function requestPasswordReset(email: string): Promise<any> {
  return makeApiRequest({
    method: 'requestPasswordReset', 
    email: email,
  });
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<any> {
  const hashedPassword = await bcrypt.hash(newPassword, 10); 

  return makeApiRequest({
    method: 'tableUpdate',
    table: 'users',
    fields: {
      hashed_password: hashedPassword,
      reset_code: null, 
      reset_token_expiry: null 
    },
    where: `email='${email.replace(/'/g, "''")}' AND reset_code='${code.replace(/'/g, "''")}'`
  });
}

export { makeApiRequest as sendBackendEmailRequest }; 
export {makeApiRequest};