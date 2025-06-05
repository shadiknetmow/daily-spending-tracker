


import React from 'react';
import { Debt, DebtType, Person } from '../types'; 
import { BN_UI_TEXT } from '../constants';
import DebtItem from './DebtItem';

interface DebtListProps {
  debts: Debt[];
  persons: Person[]; 
  onDeleteDebt: (id: string) => void;
  onToggleSettle: (id: string) => void;
  onEditDebt: (debt: Debt) => void;
  onViewHistory: (debt: Debt) => void;
  onViewPersonFinancialOverview: (person: Person) => void; 
}

const DebtList: React.FC<DebtListProps> = ({ 
  debts, 
  persons, 
  onDeleteDebt, 
  onToggleSettle, 
  onEditDebt, 
  onViewHistory,
  onViewPersonFinancialOverview 
}) => {
  const receivables = debts.filter(d => d.type === DebtType.RECEIVABLE).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  const payables = debts.filter(d => d.type === DebtType.PAYABLE).sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

  return (
    <section aria-labelledby="debt-list-heading" className="my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 id="debt-list-heading" className="text-2xl font-semibold text-slate-700 mb-6 text-center">
        {BN_UI_TEXT.DEBT_LIST_TITLE}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-medium text-green-700 mb-4 pb-2 border-b-2 border-green-200"> 
            {BN_UI_TEXT.RECEIVABLES_SUBTITLE}
          </h3>
          {receivables.length === 0 ? (
            <p className="text-slate-500 text-center py-4">{BN_UI_TEXT.NO_DEBTS_RECEIVABLE}</p>
          ) : (
            <ul className="space-y-4">
              {receivables.map((debt) => (
                <DebtItem
                  key={debt.id}
                  debt={debt}
                  persons={persons} 
                  onDeleteDebt={onDeleteDebt}
                  onToggleSettle={onToggleSettle}
                  onEditDebt={onEditDebt}
                  onViewHistory={onViewHistory}
                  onViewPersonFinancialOverview={onViewPersonFinancialOverview} 
                />
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xl font-medium text-red-700 mb-4 pb-2 border-b-2 border-red-200"> 
            {BN_UI_TEXT.PAYABLES_SUBTITLE}
          </h3>
          {payables.length === 0 ? (
            <p className="text-slate-500 text-center py-4">{BN_UI_TEXT.NO_DEBTS_PAYABLE}</p>
          ) : (
            <ul className="space-y-4">
              {payables.map((debt) => (
                <DebtItem
                  key={debt.id}
                  debt={debt}
                  persons={persons} 
                  onDeleteDebt={onDeleteDebt}
                  onToggleSettle={onToggleSettle}
                  onEditDebt={onEditDebt}
                  onViewHistory={onViewHistory}
                  onViewPersonFinancialOverview={onViewPersonFinancialOverview} 
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default DebtList;