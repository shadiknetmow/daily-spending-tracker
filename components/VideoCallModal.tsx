
import React, { useState, useEffect, useRef } from 'react';
import { Person, User } from '../types';
import { BN_UI_TEXT } from '../constants';
import XMarkIcon from './icons/XMarkIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import MicrophoneSlashIcon from './icons/MicrophoneSlashIcon';
import VideoCameraIcon from './icons/VideoCameraIcon';
import VideoCameraSlashIcon from './icons/VideoCameraSlashIcon';
import PhoneSlashIcon from './icons/PhoneSlashIcon';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPerson: Person;
  currentUser: User;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  targetPerson,
  currentUser,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null); 

  useEffect(() => {
    if (!isOpen) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      setError(null);
      setIsConnecting(true);
      setIsMicMuted(false);
      setIsVideoOff(false);
      return;
    }

    const startMedia = async () => {
      setIsConnecting(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsConnecting(false);
      } catch (err: any) {
        // console.error("Error accessing media devices.", err); // Retained for diagnosing media issues
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError(BN_UI_TEXT.VIDEO_CALL_DEVICE_ERROR);
        } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError(BN_UI_TEXT.VIDEO_CALL_PERMISSION_ERROR);
        } else {
          setError(`${BN_UI_TEXT.VIDEO_CALL_DEVICE_ERROR} (${err.message})`);
        }
        setIsConnecting(false);
      }
    };

    startMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);


  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    onClose();
  };
  
  const modalTitle = BN_UI_TEXT.VIDEO_CALL_WITH_PERSON_TITLE.replace('{personName}', targetPerson.customAlias || targetPerson.name);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-2 z-[105]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-call-modal-title"
      onClick={onClose} 
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-grow bg-black flex items-center justify-center relative rounded-t-xl">
          <video ref={remoteVideoRef} playsInline autoPlay className="w-full h-full object-cover hidden" aria-label={BN_UI_TEXT.REMOTE_VIDEO_ARIA}></video>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4">
            {isConnecting && !error && <p className="text-lg animate-pulse">{BN_UI_TEXT.CONNECTING_VIDEO_CALL}</p>}
            {!isConnecting && !error && !localStream && <p className="text-lg">{BN_UI_TEXT.VIDEO_CALL_DEVICE_ERROR}</p>}
            {!isConnecting && !error && localStream && (
                <div className="text-center">
                    <p className="text-xl font-semibold text-slate-300">{targetPerson.customAlias || targetPerson.name}</p>
                    <p className="text-sm text-slate-500">{BN_UI_TEXT.WAITING_FOR_PERSON_VIDEO.replace('{personName}', targetPerson.customAlias || targetPerson.name)}</p>
                </div>
            )}
          </div>
           {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900 bg-opacity-80">
              <p className="text-center text-red-400 text-md">{error}</p>
            </div>
          )}
        </div>

        {localStream && !isVideoOff && (
          <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 w-32 h-44 sm:w-40 sm:h-56 bg-black rounded-lg shadow-lg overflow-hidden border-2 border-slate-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
              aria-label={BN_UI_TEXT.LOCAL_VIDEO_PREVIEW_ARIA}
            ></video>
          </div>
        )}
         { localStream && isVideoOff && (
             <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 w-32 h-44 sm:w-40 sm:h-56 bg-slate-700 rounded-lg shadow-lg border-2 border-slate-600 flex items-center justify-center text-slate-400 text-xs p-2">
                ক্যামেরা বন্ধ
            </div>
         )}


        <div className="bg-slate-900 p-3 sm:p-4 flex justify-center items-center space-x-3 sm:space-x-4 rounded-b-xl">
          <button
            onClick={toggleMic}
            className={`p-2 sm:p-3 rounded-full transition-colors ${isMicMuted ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            title={isMicMuted ? BN_UI_TEXT.UNMUTE_MIC_BTN : BN_UI_TEXT.MUTE_MIC_BTN}
            disabled={!localStream || !!error}
          >
            {isMicMuted ? <MicrophoneSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-2 sm:p-3 rounded-full transition-colors ${isVideoOff ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            title={isVideoOff ? BN_UI_TEXT.START_VIDEO_BTN : BN_UI_TEXT.STOP_VIDEO_BTN}
            disabled={!localStream || !!error}
          >
            {isVideoOff ? <VideoCameraSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          <button
            onClick={handleEndCall}
            className="p-2 sm:p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            title={BN_UI_TEXT.END_CALL_BTN}
          >
            <PhoneSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fadeInScaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VideoCallModal;
