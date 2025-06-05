


import React, { useMemo } from 'react';
import { Message, Person, User, ImageMessageContent, AudioMessageContent } from '../types'; 
import { BN_UI_TEXT } from '../constants';
import XMarkIcon from './icons/XMarkIcon'; 
import TrashIcon from './icons/TrashIcon'; // Import TrashIcon

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  persons: Person[];
  messages: Message[];
  onOpenChat: (person: Person) => void;
  onOpenImageViewer: (imageContent: ImageMessageContent | undefined) => void; 
  onDeleteChatHistory: (person: Person) => void; // New prop
}

interface ConversationThread {
  person: Person;
  lastMessage: Message;
  unreadCount: number;
}

const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  persons,
  messages,
  onOpenChat,
  onOpenImageViewer, 
  onDeleteChatHistory, // Destructure new prop
}) => {
  if (!isOpen) return null;

  const conversationThreads = useMemo((): ConversationThread[] => {
    if (!currentUser.id) return [];
    const threadsMap = new Map<string, ConversationThread>(); // Key: Person.id

    // Filter out messages deleted by the current user before processing for threads
    const visibleMessagesForCurrentUser = messages.filter(msg => msg.userId === currentUser.id && !msg.isDeleted);

    visibleMessagesForCurrentUser.forEach(msg => {
      let otherUserSystemId: string | undefined;
      if (msg.actualSenderId === currentUser.id) {
        otherUserSystemId = msg.actualReceiverId;
      } else if (msg.actualReceiverId === currentUser.id) {
        otherUserSystemId = msg.actualSenderId;
      } else {
        return; 
      }

      if (!otherUserSystemId) return;

      const chatPartnerPerson = persons.find(p => p.systemUserId === otherUserSystemId && !p.isDeleted);

      if (chatPartnerPerson) {
        const existingThread = threadsMap.get(chatPartnerPerson.id);
        if (!existingThread || new Date(msg.timestamp) > new Date(existingThread.lastMessage.timestamp)) {
          threadsMap.set(chatPartnerPerson.id, {
            person: chatPartnerPerson,
            lastMessage: msg,
            unreadCount: 0, 
          });
        }
      }
    });
    
    // Calculate unread counts based on *all* messages for the current user,
    // including those not yet soft-deleted, to accurately reflect what's unread from others.
    threadsMap.forEach(thread => {
      const otherUserSystemId = thread.person.systemUserId;
      if (!otherUserSystemId || !currentUser.id) return;

      const threadIdForCount = [currentUser.id, otherUserSystemId].sort().join('_');
      
      thread.unreadCount = messages.filter( // Use original messages array for unread count
        m => 
             m.userId === currentUser.id && 
             m.threadId === threadIdForCount &&
             m.actualReceiverId === currentUser.id && 
             m.actualSenderId === otherUserSystemId && 
             !m.isRead && !m.isDeleted // Still ensure it's not a message "deleted" by current user
      ).length;
    });

    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }, [messages, persons, currentUser]);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'গতকাল';
    }
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
  };
  
  const getInitials = (nameStr: string) => {
    if (!nameStr) return '';
    const nameParts = nameStr.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const renderLastMessageContent = (lastMessage: Message) => {
    const isSentByCurrentUser = lastMessage.actualSenderId === currentUser.id;
    const prefix = isSentByCurrentUser ? `${BN_UI_TEXT.MESSAGE_FROM_YOU}: ` : '';

    return (
      <div className="text-xs flex items-baseline">
        {prefix && <span className="mr-1 flex-shrink-0">{prefix}</span>}
        <div className="truncate flex-grow min-w-0 flex items-baseline"> {/* Container for truncation */}
          {lastMessage.audioContent && (
            <span className="italic text-slate-500 mr-1 flex-shrink-0">{BN_UI_TEXT.AUDIO_MESSAGE_LABEL}</span>
          )}
          {lastMessage.imageContent && (
            <span className="italic text-slate-500 mr-1 flex-shrink-0">{'[ছবি]'}</span>
          )}
          {lastMessage.content ? (
            <span className="truncate">{lastMessage.content}</span> 
          ) : (!lastMessage.audioContent && !lastMessage.imageContent) ? (
            <span className="italic text-slate-400">{'[খালি বার্তা]'}</span>
          ) : null}
        </div>
      </div>
    );
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inbox-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-md md:max-w-lg h-[85vh] sm:h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScaleUp 0.2s ease-out forwards' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white rounded-t-xl sticky top-0">
          <h2 id="inbox-modal-title" className="text-lg font-semibold text-slate-700">
            {BN_UI_TEXT.INBOX_MODAL_TITLE}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar-chat">
          {conversationThreads.length === 0 ? (
            <p className="text-center text-slate-500 py-10">
              {BN_UI_TEXT.NO_INCOMING_MESSAGES}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {conversationThreads.map(thread => (
                <li
                  key={thread.person.id}
                  className="p-3 hover:bg-teal-50 cursor-pointer flex items-start space-x-3 transition-colors duration-150 group"
                  aria-label={`${BN_UI_TEXT.VIEW_CHAT_HISTORY_WITH_PERSON.replace('{personName}', thread.person.customAlias || thread.person.name)}${thread.unreadCount > 0 ? `. ${thread.unreadCount} টি অপঠিত বার্তা` : ''}`}
                >
                  <div 
                    className="flex-shrink-0 pt-1"
                    onClick={() => {
                      if (!thread.person.systemUserId) {
                          alert(BN_UI_TEXT.CHAT_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', thread.person.customAlias || thread.person.name));
                          return;
                      }
                      onOpenChat(thread.person);
                      onClose(); 
                    }}
                  >
                    {thread.person.profileImage ? (
                      <img src={thread.person.profileImage} alt={thread.person.customAlias || thread.person.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium text-sm">
                        {getInitials(thread.person.customAlias || thread.person.name)}
                      </span>
                    )}
                  </div>
                  <div 
                    className="flex-grow min-w-0"
                     onClick={() => {
                      if (!thread.person.systemUserId) {
                          alert(BN_UI_TEXT.CHAT_NOT_AVAILABLE_FOR_NON_REGISTERED_PERSON.replace('{personName}', thread.person.customAlias || thread.person.name));
                          return;
                      }
                      onOpenChat(thread.person);
                      onClose(); 
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className={`text-sm font-semibold truncate ${thread.unreadCount > 0 ? 'text-teal-600' : 'text-slate-700'}`}>
                        {thread.person.customAlias || thread.person.name}
                         {thread.person.systemUserId ? '' : <span className="text-xs text-orange-500 ml-1">(অনিবন্ধিত)</span>}
                      </h3>
                      <span className={`text-xs ${thread.unreadCount > 0 ? 'text-teal-500 font-medium' : 'text-slate-400'}`}>
                        {formatTimestamp(thread.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                        <div className={`min-w-0 ${thread.unreadCount > 0 ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                            {renderLastMessageContent(thread.lastMessage)}
                        </div>
                        {thread.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center p-0.5">
                            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                        </span>
                        )}
                    </div>
                    {thread.lastMessage.imageContent && !thread.lastMessage.audioContent && ( 
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onOpenImageViewer(thread.lastMessage.imageContent);
                            }}
                            className="mt-1 p-0 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded"
                            aria-label="ছবিটি বড় করে দেখুন"
                        >
                            <img 
                                src={thread.lastMessage.imageContent.base64Data} 
                                alt="সংযুক্ত ছবি" 
                                className="max-h-16 max-w-[64px] rounded border border-slate-300 object-cover"
                            />
                        </button>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChatHistory(thread.person);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-red-50"
                      title={BN_UI_TEXT.DELETE_CHAT_HISTORY_TOOLTIP}
                      aria-label={BN_UI_TEXT.DELETE_CHAT_HISTORY_TOOLTIP}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeInScaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
         .custom-scrollbar-chat::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-chat::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-chat::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-chat::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default InboxModal;