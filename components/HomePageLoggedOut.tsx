
import React from 'react';
import { BN_UI_TEXT } from '../constants';
import { AuthFormMode } from '../types';
import LoginIcon from './icons/LoginIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import LightBulbIcon from './icons/LightBulbIcon'; 
import DocumentTextIcon from './icons/DocumentTextIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import UsersIcon from './icons/UsersIcon';
import InvoiceHomeCard from './InvoiceHomeCard'; 
import LedgerIcon from './icons/LedgerIcon';


interface HomePageLoggedOutProps {
  onSwitchAuthMode: (mode: AuthFormMode) => void;
  onOpenInvoiceListModal: () => void; 
}

const FeatureCard: React.FC<{title: string, description: string, icon: React.ReactNode}> = ({ title, description, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center h-full transform hover:scale-105">
        <div className="text-teal-500 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed flex-grow">{description}</p>
    </div>
);

const HomePageLoggedOut: React.FC<HomePageLoggedOutProps> = ({ onSwitchAuthMode, onOpenInvoiceListModal }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-600 text-white flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-yellow-300 selection:text-yellow-900">
      <header className="text-center mb-10 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 animate-fadeInUp text-shadow-sm">
          {BN_UI_TEXT.WELCOME_TO_APP_MAIN_TITLE}
        </h1>
        <p className="text-lg sm:text-xl text-teal-50 max-w-3xl mx-auto animate-fadeInUp animation-delay-300 leading-relaxed">
          {BN_UI_TEXT.WELCOME_TO_APP_SUBTITLE}
        </p>
      </header>

      <main className="w-full max-w-5xl">
        <section className="mb-10 sm:mb-12 animate-fadeInUp animation-delay-600">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-8 text-white text-shadow-xs">
                {BN_UI_TEXT.KEY_FEATURES_TITLE}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_TRANSACTION_TRACKING_TITLE}
                    description={BN_UI_TEXT.FEATURE_TRANSACTION_TRACKING_DESC}
                    icon={<DocumentTextIcon className="w-10 h-10" />}
                />
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_DEBT_MANAGEMENT_TITLE}
                    description={BN_UI_TEXT.FEATURE_DEBT_MANAGEMENT_DESC}
                    icon={<UsersIcon className="w-10 h-10" />}
                />
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_BUDGETING_TITLE}
                    description={BN_UI_TEXT.FEATURE_BUDGETING_DESC}
                    icon={<ChartPieIcon className="w-10 h-10" />}
                />
                 <InvoiceHomeCard onOpenInvoiceListModal={onOpenInvoiceListModal} />
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_PERSON_LEDGER_TITLE}
                    description={BN_UI_TEXT.FEATURE_PERSON_LEDGER_DESC}
                    icon={<LedgerIcon className="w-10 h-10" />} 
                />
                <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_AI_ADVICE_TITLE}
                    description={BN_UI_TEXT.FEATURE_AI_ADVICE_DESC}
                    icon={<LightBulbIcon className="w-10 h-10" />}
                />
            </div>
        </section>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fadeInUp animation-delay-900">
          <button
            onClick={() => onSwitchAuthMode('login')}
            className="w-full sm:w-auto bg-white text-teal-700 font-semibold py-3 px-10 rounded-lg shadow-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-opacity-75 transition-all duration-150 transform hover:scale-105 text-lg flex items-center justify-center space-x-2"
            aria-label={BN_UI_TEXT.LOGIN}
          >
            <LoginIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.LOGIN}</span>
          </button>
          <button
            onClick={() => onSwitchAuthMode('signup')}
            className="w-full sm:w-auto bg-yellow-400 text-yellow-900 font-semibold py-3 px-10 rounded-lg shadow-md hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition-all duration-150 transform hover:scale-105 text-lg flex items-center justify-center space-x-2"
            aria-label={BN_UI_TEXT.SIGNUP}
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.SIGNUP}</span>
          </button>
        </div>
      </main>

      <footer className="mt-10 sm:mt-16 text-center text-teal-100 text-sm animate-fadeInUp animation-delay-1200">
        <p>&copy; {new Date().getFullYear()} {BN_UI_TEXT.APP_TITLE}. সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
      <style>{`
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-900 { animation-delay: 0.9s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fadeInUp {
            animation: fadeInUp 0.7s ease-out forwards;
            opacity: 0; /* Start hidden */
        }
        .text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .text-shadow-xs { text-shadow: 1px 1px 1px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default HomePageLoggedOut;
