import React from 'react';
import { useNotification, NotificationType } from '../contexts/NotificationContext'; // Import NotificationType
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import WarningIcon from './icons/WarningIcon';
import XMarkIcon from './icons/XMarkIcon';

const NotificationsDisplay: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="w-6 h-6 text-sky-500" />;
      case 'warning':
        return <WarningIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getColors = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-400 text-red-700';
      case 'info':
        return 'bg-sky-50 border-sky-400 text-sky-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-700';
      default:
        return 'bg-slate-50 border-slate-400 text-slate-700';
    }
  };

  return (
    <>
      <div className="fixed top-5 right-5 z-[250] w-full max-w-xs sm:max-w-sm space-y-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 flex items-start space-x-3 transition-all duration-300 ease-in-out transform animate-slideInRight ${getColors(notification.type)}`}
            role="alert"
            aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-grow text-sm">
              {notification.message}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`p-1 -mr-1 -mt-1 rounded-full hover:bg-opacity-20 ${
                notification.type === 'success' ? 'hover:bg-green-200' :
                notification.type === 'error' ? 'hover:bg-red-200' :
                notification.type === 'info' ? 'hover:bg-sky-200' :
                notification.type === 'warning' ? 'hover:bg-yellow-200' : 'hover:bg-slate-200'
              }`}
              aria-label="Close notification"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style>
        {`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slideInRight {
            animation: slideInRight 0.3s ease-out forwards;
          }
        `}
      </style>
    </>
  );
};

export default NotificationsDisplay;