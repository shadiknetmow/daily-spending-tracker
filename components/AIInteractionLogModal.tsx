


import React, { useRef, useEffect, useState } from 'react';
import { AILogEntry, AILanguageCode, AILanguageOptions, AIScope } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import TrashIcon from './icons/TrashIcon';
import MicrophoneIconSolid from './icons/MicrophoneIconSolid';
import ArrowPathIcon from './icons/ArrowPathIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon'; // For send button

interface AIInteractionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AILogEntry[];
  onClearLogs: () => void;
  isAIAssistantListening: boolean;
  isAICommandProcessing: boolean;
  onToggleAIAssistantListening: () => void;
  currentAILanguage: AILanguageCode;
  onSetAILanguage: (lang: AILanguageCode) => void;
  currentAIScope: AIScope; 
  onSetAIScope: (scope: AIScope) => void; 
  onSendCommand: (command: string, language: AILanguageCode) => void;
  aiVoiceReplayEnabled: boolean;
  onSetAiVoiceReplayEnabled: (enabled: boolean) => void;
  isAdminUser: boolean; // New prop
}

const AIInteractionLogModal: React.FC<AIInteractionLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  isAIAssistantListening,
  isAICommandProcessing,
  onToggleAIAssistantListening,
  currentAILanguage,
  onSetAILanguage,
  currentAIScope, 
  onSetAIScope,   
  onSendCommand,
  aiVoiceReplayEnabled,
  onSetAiVoiceReplayEnabled,
  isAdminUser, // Destructure new prop
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const [typedCommand, setTypedCommand] = useState('');
  const typedCommandInputRef = useRef<HTMLTextAreaElement>(null);


  const sortedLogs = React.useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  useEffect(() => {
    if (isOpen && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
    if (isOpen) {
      typedCommandInputRef.current?.focus();
    }
  }, [sortedLogs, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node) &&
        langButtonRef.current &&
        !langButtonRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);


  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('bn-BD', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
    } catch {
      return isoString;
    }
  };
  
  const getLogTypeStyle = (type: AILogEntry['type']) => {
    switch (type) {
      case 'command':
        return 'bg-sky-50 border-sky-200';
      case 'response':
        return 'bg-teal-50 border-teal-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getLogTypeLabel = (type: AILogEntry['type']) => {
     switch (type) {
      case 'command':
        return BN_UI_TEXT.AI_LOG_TYPE_COMMAND;
      case 'response':
        return BN_UI_TEXT.AI_LOG_TYPE_RESPONSE;
      case 'error':
        return BN_UI_TEXT.AI_LOG_TYPE_ERROR;
      default:
        return type;
    }
  }

  let aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL;
  let aiAssistantButtonIcon = <MicrophoneIconSolid className="w-4 h-4" />;
  let aiAssistantButtonBgClass = 'bg-cyan-500 hover:bg-cyan-600';
  let aiAssistantButtonAnimationClass = '';

  if (isAICommandProcessing) {
    aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_PROCESSING;
    aiAssistantButtonIcon = <ArrowPathIcon className="w-4 h-4 animate-spin" />;
    aiAssistantButtonBgClass = 'bg-purple-500 hover:bg-purple-600';
    aiAssistantButtonAnimationClass = 'animate-pulse';
  } else if (isAIAssistantListening) {
    aiAssistantButtonText = BN_UI_TEXT.AI_ASSISTANT_LISTENING;
    aiAssistantButtonIcon = <MicrophoneIconSolid className="w-4 h-4" />;
    aiAssistantButtonBgClass = 'bg-red-500 hover:bg-red-600';
    aiAssistantButtonAnimationClass = 'animate-pulse';
  }
  
  const commonButtonClass = "text-white hover:bg-opacity-80 font-medium py-2 px-3 rounded-md transition duration-150 flex items-center space-x-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-opacity-75";

  const handleTypedCommandSend = () => {
    const command = typedCommand.trim();
    if (command) {
      onSendCommand(command, currentAILanguage);
      setTypedCommand('');
    }
  };

  const modalHeaderActions = isAdminUser ? ( // Conditionally render language dropdown
    <div className="relative">
      <button
        ref={langButtonRef}
        onClick={() => setIsLangDropdownOpen(prev => !prev)}
        className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md flex items-center space-x-1"
        aria-haspopup="true"
        aria-expanded={isLangDropdownOpen}
        title="ভাষা পরিবর্তন করুন"
      >
        <span>{AILanguageOptions.find(opt => opt.code === currentAILanguage)?.label || currentAILanguage}</span>
        <ChevronDownIcon className="w-3 h-3" />
      </button>
      {isLangDropdownOpen && (
        <div
          ref={langDropdownRef}
          className="absolute right-0 mt-1 w-32 bg-white border border-slate-300 rounded-md shadow-lg z-10 py-1"
        >
          {AILanguageOptions.map(langOpt => (
            <button
              key={langOpt.code}
              onClick={() => {
                onSetAILanguage(langOpt.code);
                setIsLangDropdownOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                currentAILanguage === langOpt.code ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
              }`}
            >
              {langOpt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;


  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={BN_UI_TEXT.AI_LOG_MODAL_TITLE} 
        size="2xl"
        headerActions={modalHeaderActions}
    >
      <div className="flex flex-col h-[70vh]">
        {isAdminUser && ( // Conditionally render scope section
          <div className="mb-3 p-3 border border-slate-200 rounded-md bg-slate-50">
            <p className="text-xs font-medium text-slate-600 mb-1.5">{BN_UI_TEXT.AI_ASSISTANT_SCOPE_LABEL}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ai-scope"
                  value="app"
                  checked={currentAIScope === 'app'}
                  onChange={() => onSetAIScope('app')}
                  className="form-radio h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-slate-400"
                />
                <span className="text-xs text-slate-700">{BN_UI_TEXT.AI_ASSISTANT_SCOPE_APP_SPECIFIC}</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ai-scope"
                  value="global"
                  checked={currentAIScope === 'global'}
                  onChange={() => onSetAIScope('global')}
                  className="form-radio h-3.5 w-3.5 text-teal-600 focus:ring-teal-500 border-slate-400"
                />
                <span className="text-xs text-slate-700">{BN_UI_TEXT.AI_ASSISTANT_SCOPE_GLOBAL}</span>
              </label>
            </div>
          </div>
        )}

        <div ref={logContainerRef} className="flex-grow overflow-y-auto space-y-3 p-2 bg-slate-100 rounded-md custom-scrollbar-modal mb-4 min-h-20">
          {sortedLogs.length === 0 ? (
            <p className="text-center text-slate-500 py-10">{BN_UI_TEXT.AI_LOG_NO_LOGS}</p>
          ) : (
            sortedLogs.map((log) => (
              <div key={log.id} className={`p-3 rounded-md border ${getLogTypeStyle(log.type)} shadow-sm text-sm`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600">
                    {getLogTypeLabel(log.type)}
                  </span>
                  <span className="text-xs text-slate-400">{formatTimestamp(log.timestamp)}</span>
                </div>
                
                {log.commandText && (
                  <p className="text-slate-700">
                    <strong className="text-slate-500">{BN_UI_TEXT.AI_LOG_USER_COMMAND_LABEL}:</strong> {log.commandText}
                  </p>
                )}
                {log.type === 'response' && log.responseText && (
                  <p className="mt-1 text-slate-800">
                    <strong className="text-slate-500">{BN_UI_TEXT.AI_LOG_AI_RESPONSE_LABEL}:</strong> {log.responseText}
                  </p>
                )}
                {log.type === 'response' && log.parsedIntent && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong className="text-slate-500">{BN_UI_TEXT.AI_LOG_INTENT_LABEL}:</strong> {log.parsedIntent}
                  </p>
                )}
                 {log.type === 'response' && log.actionDetails && Object.keys(log.actionDetails).length > 0 && (
                    <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-700">{BN_UI_TEXT.AI_LOG_ACTION_DETAILS_LABEL}</summary>
                        <pre className="bg-slate-200 p-1.5 rounded text-slate-600 text-[11px] overflow-x-auto custom-scrollbar-modal">
                        {JSON.stringify(log.actionDetails, null, 2)}
                        </pre>
                    </details>
                )}
                {log.type === 'error' && log.errorMessage && (
                  <p className="mt-1 text-red-700">
                    <strong className="text-red-500">{BN_UI_TEXT.AI_LOG_TYPE_ERROR}:</strong> {log.errorMessage}
                  </p>
                )}
                {log.rawAIResponse && (
                    <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-700">{BN_UI_TEXT.AI_LOG_RAW_RESPONSE_LABEL}</summary>
                        <pre className="bg-slate-200 p-1.5 rounded text-slate-600 text-[11px] overflow-x-auto custom-scrollbar-modal">
                        {log.rawAIResponse}
                        </pre>
                    </details>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="mb-2">
            <textarea
                ref={typedCommandInputRef}
                value={typedCommand}
                onChange={(e) => setTypedCommand(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTypedCommandSend();
                    }
                }}
                placeholder="AI সহকারীর জন্য এখানে কমান্ড টাইপ করুন..."
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm min-h-[40px]"
                rows={1}
                aria-label="কমান্ড টাইপ করুন"
                disabled={isAICommandProcessing}
            />
        </div>

        <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
                <button
                    onClick={onToggleAIAssistantListening}
                    className={`${commonButtonClass} ${aiAssistantButtonBgClass} ${aiAssistantButtonAnimationClass} focus:ring-current`}
                    title={BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL}
                    aria-label={BN_UI_TEXT.AI_ASSISTANT_BUTTON_LABEL}
                    disabled={!(('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) || (isAICommandProcessing && !isAIAssistantListening)}
                >
                    {aiAssistantButtonIcon}
                    <span>{aiAssistantButtonText}</span>
                </button>
                <button
                    onClick={handleTypedCommandSend}
                    className={`${commonButtonClass} bg-teal-600 hover:bg-teal-700 focus:ring-teal-400`}
                    disabled={!typedCommand.trim() || isAICommandProcessing}
                    title="কমান্ড পাঠান"
                    aria-label="কমান্ড পাঠান"
                >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    <span>পাঠান</span>
                </button>
            </div>
            <div className="flex items-center space-x-3">
              {isAdminUser && ( // Conditionally render voice replay toggle
                <div className="flex items-center space-x-1.5">
                    <input
                        type="checkbox"
                        id="ai-voice-replay-toggle-modal"
                        className="form-checkbox h-3.5 w-3.5 text-teal-600 border-slate-400 rounded focus:ring-teal-500 cursor-pointer"
                        checked={aiVoiceReplayEnabled}
                        onChange={(e) => onSetAiVoiceReplayEnabled(e.target.checked)}
                    />
                    <label htmlFor="ai-voice-replay-toggle-modal" className="text-xs text-slate-600 cursor-pointer">
                        {BN_UI_TEXT.AI_VOICE_REPLAY_ENABLE_LABEL}
                    </label>
                </div>
              )}
                <button
                    onClick={onClearLogs}
                    disabled={logs.length === 0}
                    className="flex items-center space-x-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{BN_UI_TEXT.AI_LOG_CLEAR_BTN}</span>
                </button>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default AIInteractionLogModal;
