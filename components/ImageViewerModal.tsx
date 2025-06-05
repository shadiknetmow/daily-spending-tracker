
import React from 'react';
import { BN_UI_TEXT } from '../constants';
import XMarkIcon from './icons/XMarkIcon';
import DownloadIcon from './icons/DownloadIcon'; // New Icon

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageName?: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName = 'chat-image',
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up blob URL if it was one
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[110]" // Higher z-index
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 via-black/30 to-transparent">
          <h2 id="image-viewer-modal-title" className="text-lg font-semibold text-white truncate pr-2">
            {imageName !== 'chat-image' ? imageName : BN_UI_TEXT.IMAGE_PREVIEW_CHAT_ALT}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-300 p-1.5 bg-black/30 hover:bg-black/50 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow flex items-center justify-center overflow-hidden p-2">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 flex justify-center items-center z-10 bg-gradient-to-t from-black/50 via-black/30 to-transparent">
            <button
                onClick={handleDownload}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md flex items-center space-x-2 transition-colors duration-150"
                aria-label="Download image"
            >
                <DownloadIcon className="w-5 h-5" />
                <span>ডাউনলোড</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default ImageViewerModal;
