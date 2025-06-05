import React from 'react';
import { BN_UI_TEXT } from '../constants';
import { AuthFormMode } from '../types';
import LoginIcon from './icons/LoginIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import LightBulbIcon from './icons/LightBulbIcon'; // Example features
import DocumentTextIcon from './icons/DocumentTextIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import UsersIcon from './icons/UsersIcon';


interface HomePageLoggedOutProps {
  onSwitchAuthMode: (mode: AuthFormMode) => void;
}

const FeatureCard: React.FC<{title: string, description: string, icon: React.ReactNode}> = ({ title, description, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
        <div className="text-teal-500 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
);

const HomePageLoggedOut: React.FC<HomePageLoggedOutProps> = ({ onSwitchAuthMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <header className="text-center mb-10 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 animate-fadeInUp">
          {BN_UI_TEXT.WELCOME_TO_APP_MAIN_TITLE}
        </h1>
        <p className="text-lg sm:text-xl text-teal-100 max-w-2xl mx-auto animate-fadeInUp animation-delay-300">
          {BN_UI_TEXT.WELCOME_TO_APP_SUBTITLE}
        </p>
      </header>

      <main className="w-full max-w-5xl">
        <section className="mb-10 sm:mb-12 animate-fadeInUp animation-delay-600">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-8 text-white">
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
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_REPORTS_TITLE}
                    description={BN_UI_TEXT.FEATURE_REPORTS_DESC}
                    icon={<LightBulbIcon className="w-10 h-10"/>} // Using LightBulb as placeholder
                />
                 <FeatureCard 
                    title={BN_UI_TEXT.FEATURE_PERSON_LEDGER_TITLE}
                    description={BN_UI_TEXT.FEATURE_PERSON_LEDGER_DESC}
                    icon={<UsersIcon className="w-10 h-10" />} // Using Users as placeholder
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
            className="w-full sm:w-auto bg-white text-teal-600 font-semibold py-3 px-10 rounded-lg shadow-md hover:bg-slate-100 transition duration-150 text-lg flex items-center justify-center space-x-2"
          >
            <LoginIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.LOGIN}</span>
          </button>
          <button
            onClick={() => onSwitchAuthMode('signup')}
            className="w-full sm:w-auto bg-yellow-400 text-yellow-800 font-semibold py-3 px-10 rounded-lg shadow-md hover:bg-yellow-300 transition duration-150 text-lg flex items-center justify-center space-x-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>{BN_UI_TEXT.SIGNUP}</span>
          </button>
        </div>
      </main>

      <footer className="mt-10 sm:mt-16 text-center text-teal-200 text-sm animate-fadeInUp animation-delay-1200">
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
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0; /* Start hidden */
        }
      `}</style>
    </div>
  );
};

export default HomePageLoggedOut;