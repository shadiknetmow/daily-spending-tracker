import React, { useState, useEffect } from 'react';
import { GeminiSettings } from '../types';
import { BN_UI_TEXT, DEFAULT_GEMINI_SETTINGS } from '../constants';
import Modal from './Modal';
import { useNotification } from '../contexts/NotificationContext';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GeminiSettings;
  onSaveSettings: (settings: GeminiSettings) => void;
}

const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [model, setModel] = useState(currentSettings.model);
  const [temperature, setTemperature] = useState(currentSettings.temperature ?? DEFAULT_GEMINI_SETTINGS.temperature);
  const [topK, setTopK] = useState(currentSettings.topK ?? DEFAULT_GEMINI_SETTINGS.topK);
  const [topP, setTopP] = useState(currentSettings.topP ?? DEFAULT_GEMINI_SETTINGS.topP);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      setModel(currentSettings.model);
      setTemperature(currentSettings.temperature ?? DEFAULT_GEMINI_SETTINGS.temperature);
      setTopK(currentSettings.topK ?? DEFAULT_GEMINI_SETTINGS.topK);
      setTopP(currentSettings.topP ?? DEFAULT_GEMINI_SETTINGS.topP);
    }
  }, [isOpen, currentSettings]);

  const handleSave = () => {
    onSaveSettings({
      model,
      temperature: Number(temperature),
      topK: Number(topK),
      topP: Number(topP),
    });
    addNotification(BN_UI_TEXT.GEMINI_SETTINGS_SAVED_SUCCESS, 'success');
    onClose();
  };

  const handleResetToDefaults = () => {
    setModel(DEFAULT_GEMINI_SETTINGS.model);
    setTemperature(DEFAULT_GEMINI_SETTINGS.temperature);
    setTopK(DEFAULT_GEMINI_SETTINGS.topK);
    setTopP(DEFAULT_GEMINI_SETTINGS.topP);
    addNotification(BN_UI_TEXT.GEMINI_SETTINGS_RESET_SUCCESS, 'info');
  };
  
  const inputClass = "w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm bg-white";
  const sliderThumbClass = "appearance-none w-full h-1.5 bg-slate-200 rounded-full outline-none slider-thumb";
  const sliderTrackClass = "cursor-pointer";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.GEMINI_AI_SETTINGS_MODAL_TITLE} size="lg">
      <div className="space-y-6 p-1">
        <div>
          <label htmlFor="gemini-model" className="block text-sm font-medium text-slate-700 mb-1">
            {BN_UI_TEXT.GEMINI_MODEL_LABEL}
          </label>
          <select
            id="gemini-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
          >
            <option value="gemini-2.5-flash-preview-04-17">gemini-2.5-flash-preview-04-17</option>
            {/* Add other allowed models here if guidelines change */}
          </select>
        </div>

        <div>
          <label htmlFor="gemini-temperature" className="block text-sm font-medium text-slate-700 mb-1">
            {BN_UI_TEXT.GEMINI_TEMPERATURE_LABEL}: <span className="font-mono text-teal-600">{temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            id="gemini-temperature"
            min="0"
            max="1"
            step="0.01"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className={`${sliderThumbClass} ${sliderTrackClass}`}
          />
        </div>

        <div>
          <label htmlFor="gemini-topk" className="block text-sm font-medium text-slate-700 mb-1">
            {BN_UI_TEXT.GEMINI_TOP_K_LABEL}: <span className="font-mono text-teal-600">{topK}</span>
          </label>
          <input
            type="number"
            id="gemini-topk"
            min="1"
            max="100" // Example range, adjust if needed
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="gemini-topp" className="block text-sm font-medium text-slate-700 mb-1">
            {BN_UI_TEXT.GEMINI_TOP_P_LABEL}: <span className="font-mono text-teal-600">{topP.toFixed(2)}</span>
          </label>
          <input
            type="range"
            id="gemini-topp"
            min="0"
            max="1"
            step="0.01"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
             className={`${sliderThumbClass} ${sliderTrackClass}`}
          />
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {BN_UI_TEXT.RESET_GEMINI_SETTINGS_BTN}
          </button>
          <div className="space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {BN_UI_TEXT.CANCEL}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {BN_UI_TEXT.SAVE_GEMINI_SETTINGS_BTN}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        /* Custom styles for slider thumbs - WebKit */
        input[type=range].slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #14b8a6; /* teal-500 */
          cursor: pointer;
          border-radius: 50%;
          margin-top: -6px; /* Adjust to center thumb on track */
        }

        /* Custom styles for slider thumbs - Mozilla */
        input[type=range].slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #14b8a6; /* teal-500 */
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </Modal>
  );
};

export default GeminiSettingsModal;
