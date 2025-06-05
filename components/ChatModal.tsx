
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, Person, User, ImageMessageContent, AudioMessageContent } from '../types';
import { BN_UI_TEXT, CHAT_IMAGE_MAX_SIZE_BYTES, ALLOWED_CHAT_IMAGE_TYPES, EMOJI_LIST, REACTION_EMOJI_LIST, CHAT_AUDIO_MAX_DURATION_MS, PREFERRED_AUDIO_MIME_TYPE } from '../constants';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import XMarkIcon from './icons/XMarkIcon';
import PaperClipIcon from './icons/PaperClipIcon';
import FaceSmileIcon from './icons/FaceSmileIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopCircleIcon from './icons/StopCircleIcon';
import TrashIcon from './icons/TrashIcon';
import { useNotification } from '../contexts/NotificationContext';
import ImageViewerModal from './ImageViewerModal';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  currentUser: User;
  messages: Message[];
  onSendMessage: (content: string, recipientPerson: Person, imageToSend?: ImageMessageContent, audioToSend?: AudioMessageContent) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

// Helper for emoji detection
const EMOJI_RANGES = [
  '\\u{1F600}-\\u{1F64F}', // Emoticons
  '\\u{1F300}-\\u{1F5FF}', // Miscellaneous Symbols and Pictographs
  '\\u{1F680}-\\u{1F6FF}', // Transport and Map Symbols
  '\\u{1F700}-\\u{1F77F}', // Alchemical Symbols
  '\\u{1F780}-\\u{1F7FF}', // Geometric Shapes Extended
  '\\u{1F800}-\\u{1F8FF}', // Supplemental Arrows-C
  '\\u{1F900}-\\u{1F9FF}', // Supplemental Symbols and Pictographs
  '\\u{1FA00}-\\u{1FA6F}', // Chess Symbols
  '\\u{1FA70}-\\u{1FAFF}', // Symbols and Pictographs Extended-A
  '\\u{2600}-\\u{26FF}',   // Miscellaneous Symbols
  '\\u{2700}-\\u{27BF}',   // Dingbats
  '\\u{FE00}-\\u{FE0F}',   // Variation Selectors (important for some emojis)
  '\\u{1F1E6}-\\u{1F1FF}', // Regional Indicator Symbols (flags)
  '\\u{E0020}-\\u{E007F}'  // Tagging characters (rarely used alone)
].join('');

// Regex to check if a string consists ONLY of emojis and whitespace
const emojiOnlyRegex = new RegExp(`^[\\s${EMOJI_RANGES}]+$`, 'u');

function isEmojiOnlyString(str: string): boolean {
  if (!str || !str.trim()) return false; // Empty or whitespace-only is not emoji-only
  const hasNonWhitespace = /\S/.test(str);
  if (!hasNonWhitespace) return false;
  
  return emojiOnlyRegex.test(str);
}


const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  person,
  currentUser,
  messages,
  onSendMessage,
  onReactToMessage,
  onDeleteMessage,
}) => {
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageMessageContent[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPickerFor, setShowReactionPickerFor] = useState<string | null>(null);
  const [hoveredMessageIdForReactionButton, setHoveredMessageIdForReactionButton] = useState<string | null>(null);
  const [hoveredMessageIdForDeleteButton, setHoveredMessageIdForDeleteButton] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob, url: string, duration: number } | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<number | null>(null);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImageDetails, setViewingImageDetails] = useState<{ url: string; name?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(0);
  const prevImagePreviewCountRef = useRef(0);
  const prevRecordedAudioRef = useRef(false);
  const prevIsRecordingRef = useRef(false);


  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom('auto'), 50); // Initial scroll
      setTimeout(() => inputRef.current?.focus(), 100);
      prevMessagesCountRef.current = messages.filter(msg => !msg.isDeleted).length;
      prevImagePreviewCountRef.current = imagePreviewUrls.length;
      prevRecordedAudioRef.current = !!recordedAudio;
      prevIsRecordingRef.current = isRecording;

    } else {
      setNewMessageContent('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setShowEmojiPicker(false);
      setShowReactionPickerFor(null);
      setHoveredMessageIdForReactionButton(null);
      setHoveredMessageIdForDeleteButton(null);
      setIsImageViewerOpen(false);
      setViewingImageDetails(null);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setMediaRecorder(null);
      setIsRecording(false);
      setRecordedAudio(null);
      audioChunksRef.current = [];
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingDuration(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const currentVisibleMessagesCount = messages.filter(msg => !msg.isDeleted).length;
      const currentImagePreviewCount = imagePreviewUrls.length;
      const currentRecordedAudioPresent = !!recordedAudio;
      const currentIsRecording = isRecording;

      const messagesChanged = currentVisibleMessagesCount > prevMessagesCountRef.current;
      const imagePreviewChanged = currentImagePreviewCount !== prevImagePreviewCountRef.current;
      const audioPreviewChanged = currentRecordedAudioPresent !== prevRecordedAudioRef.current;
      const recordingStateChanged = currentIsRecording !== prevIsRecordingRef.current;

      if (messagesChanged || imagePreviewChanged || audioPreviewChanged || recordingStateChanged || (prevMessagesCountRef.current === 0 && currentVisibleMessagesCount > 0) ) {
        scrollToBottom('smooth');
      }
      
      prevMessagesCountRef.current = currentVisibleMessagesCount;
      prevImagePreviewCountRef.current = currentImagePreviewCount;
      prevRecordedAudioRef.current = currentRecordedAudioPresent;
      prevIsRecordingRef.current = currentIsRecording;
    }
  }, [isOpen, messages, imagePreviewUrls.length, recordedAudio, isRecording]);


  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 112; 
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [newMessageContent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        const emojiButton = document.getElementById('emoji-picker-button');
        if (emojiButton && emojiButton.contains(event.target as Node)) return;
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        const reactionTriggers = document.querySelectorAll('.add-reaction-trigger');
        let clickedOnTrigger = false;
        reactionTriggers.forEach(trigger => {
            if (trigger.contains(event.target as Node)) {
                clickedOnTrigger = true;
            }
        });
        if(!clickedOnTrigger) {
            setShowReactionPickerFor(null);
        }
      }
    };
    if (showEmojiPicker || showReactionPickerFor) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showReactionPickerFor]);

  const startRecording = async () => {
    if (recordedAudio) {
      removeRecordedAudio();
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addNotification(BN_UI_TEXT.ERROR_AUDIO_RECORDING + " (Media API not supported)", 'error');
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: PREFERRED_AUDIO_MIME_TYPE };
      let newMediaRecorder;
      try {
          newMediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
          console.warn(`Failed to create MediaRecorder with ${PREFERRED_AUDIO_MIME_TYPE}, trying default.`);
          newMediaRecorder = new MediaRecorder(stream);
      }

      setMediaRecorder(newMediaRecorder);
      audioChunksRef.current = [];

      newMediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      newMediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: newMediaRecorder?.mimeType || PREFERRED_AUDIO_MIME_TYPE });
        const audioUrl = URL.createObjectURL(audioBlob);
        const finalDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0;
        setRecordedAudio({ blob: audioBlob, url: audioUrl, duration: finalDuration });
        stream.getTracks().forEach(track => track.stop());
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
        recordingStartTimeRef.current = null;
      };

      newMediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        addNotification(BN_UI_TEXT.ERROR_AUDIO_RECORDING, 'error');
        stopRecordingCleanup();
      };

      newMediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();
      recordingIntervalRef.current = window.setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Date.now() - recordingStartTimeRef.current;
          setRecordingDuration(elapsed);
          if (elapsed >= CHAT_AUDIO_MAX_DURATION_MS) {
            stopRecording();
            addNotification(BN_UI_TEXT.MAX_RECORDING_DURATION_REACHED, 'info');
          }
        }
      }, 1000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      let errMsg = BN_UI_TEXT.ERROR_AUDIO_RECORDING;
      if(err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "মাইক্রোফোন ব্যবহারের অনুমতি প্রয়োজন।";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "কোনো মাইক্রোফোন খুঁজে পাওয়া যায়নি।";
      }
      addNotification(errMsg, 'error');
      stopRecordingCleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setMediaRecorder(null);
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = null;
    recordingStartTimeRef.current = null;
    audioChunksRef.current = [];
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const removeRecordedAudio = () => {
    if (recordedAudio) URL.revokeObjectURL(recordedAudio.url);
    setRecordedAudio(null);
    setRecordingDuration(0);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageProcessingPromises: Promise<{ imageContent: ImageMessageContent; previewUrl: string } | null>[] = [];

    Array.from(files).forEach(file => {
      if (!ALLOWED_CHAT_IMAGE_TYPES.includes(file.type)) {
        addNotification(BN_UI_TEXT.INVALID_IMAGE_FILE + ` (${file.name})`, 'error');
        imageProcessingPromises.push(Promise.resolve(null));
        return;
      }
      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        addNotification(BN_UI_TEXT.IMAGE_TOO_LARGE_CHAT + ` (${file.name})`, 'error');
        imageProcessingPromises.push(Promise.resolve(null));
        return;
      }

      const promise = new Promise<{ imageContent: ImageMessageContent; previewUrl: string } | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            imageContent: {
              type: 'image',
              base64Data: reader.result as string,
              mimeType: file.type,
              fileName: file.name,
            },
            previewUrl: reader.result as string,
          });
        };
        reader.onerror = () => {
            addNotification(`"${file.name}" ফাইলটি পড়তে সমস্যা হয়েছে।`, 'error');
            resolve(null);
        };
        reader.readAsDataURL(file);
      });
      imageProcessingPromises.push(promise);
    });

    try {
        const results = await Promise.all(imageProcessingPromises);
        const validNewImages = results.filter(result => result !== null) as { imageContent: ImageMessageContent; previewUrl: string }[];
        
        if (validNewImages.length > 0) {
            setSelectedImages(prev => [...prev, ...validNewImages.map(item => item.imageContent)]);
            setImagePreviewUrls(prev => [...prev, ...validNewImages.map(item => item.previewUrl)]);
        }
    } catch (error) {
        console.error("Error processing images:", error);
        addNotification("ছবি প্রসেস করতে সমস্যা হয়েছে।", "error");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const removeSelectedImageAtIndex = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviewUrls(prev => {
        const newUrls = prev.filter((_, index) => index !== indexToRemove);
        return newUrls;
    });
    if (selectedImages.length === 1) {
         if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearAllSelectedImages = () => {
    setImagePreviewUrls([]);
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleEmojiSelect = (emoji: string) => {
    setNewMessageContent(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReactionSelect = (messageId: string, emoji: string) => {
    onReactToMessage(messageId, emoji);
    setShowReactionPickerFor(null);
  };

  const handleSend = async () => {
    const trimmedContent = newMessageContent.trim();
    let contentForCurrentMessage = trimmedContent;
    let textSent = false;

    if (recordedAudio) {
        let audioContentToSend: AudioMessageContent | undefined = undefined;
        const reader = new FileReader();
        reader.readAsDataURL(recordedAudio.blob);
        try {
            await new Promise<void>((resolve, reject) => {
                reader.onloadend = () => {
                    audioContentToSend = {
                        type: 'audio',
                        base64Data: reader.result as string,
                        mimeType: recordedAudio.blob.type,
                        duration: Math.round(recordedAudio.duration / 1000),
                    };
                    resolve();
                };
                reader.onerror = (error) => {
                    console.error("Error converting audio blob to base64:", error);
                    addNotification(BN_UI_TEXT.AUDIO_SEND_ERROR, 'error');
                    reject(error);
                };
            });

            if (audioContentToSend) {
                onSendMessage(contentForCurrentMessage, person, undefined, audioContentToSend);
                textSent = true;
                contentForCurrentMessage = '';
            }
        } catch (error) {
            removeRecordedAudio();
            return;
        }
        removeRecordedAudio();
    }

    if (selectedImages.length > 0) {
        const textForFirstImage = textSent ? "" : contentForCurrentMessage;
        onSendMessage(textForFirstImage, person, selectedImages[0]);
        textSent = true;
        contentForCurrentMessage = '';


        for (let i = 1; i < selectedImages.length; i++) {
            onSendMessage("", person, selectedImages[i]);
        }
        clearAllSelectedImages();
    }

    if (contentForCurrentMessage && !textSent) {
        onSendMessage(contentForCurrentMessage, person);
        textSent = true;
    }

    if (textSent || selectedImages.length > 0 || recordedAudio) {
      setNewMessageContent('');
    }
    setShowEmojiPicker(false);
  };

  const handleImageClick = (imgContent?: ImageMessageContent) => {
    if (imgContent?.base64Data) {
      setViewingImageDetails({ url: imgContent.base64Data, name: imgContent.fileName });
      setIsImageViewerOpen(true);
    }
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString('bn-BD', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) { return 'ত্রুটিপূর্ণ সময়'; }
  };

  const modalTitle = BN_UI_TEXT.CHAT_WITH_PERSON_TITLE.replace('{personName}', person.customAlias || person.name);

  return (
    <>
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-2 sm:p-4 z-[101]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-md md:max-w-lg h-[85vh] sm:h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScaleUp 0.2s ease-out forwards' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white rounded-t-xl sticky top-0 z-10">
          <h2 id="chat-modal-title" className="text-lg font-semibold text-slate-700 truncate">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            aria-label={BN_UI_TEXT.CLOSE_BTN}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar-chat">
          {messages.length === 0 && selectedImages.length === 0 && !recordedAudio ? (
            <p className="text-center text-slate-500 py-10">
              {BN_UI_TEXT.NO_MESSAGES_YET.replace('{personName}', person.customAlias || person.name)}
            </p>
          ) : (
            messages.map((msg) => {
              const isSentByCurrentUser = msg.actualSenderId === currentUser.id;
              const isOnlyEmoji = msg.content ? isEmojiOnlyString(msg.content) : false;
              
              let bubbleOuterClasses = "rounded-lg mb-0.5";
              let contentPClasses = "whitespace-pre-wrap break-words";
              let textColor = "";

              if (isOnlyEmoji) {
                bubbleOuterClasses += " bg-transparent p-0 w-auto inline-block"; // No background, no padding for emoji-only
                contentPClasses += " text-5xl"; // Larger emoji
              } else {
                bubbleOuterClasses += ` shadow-sm max-w-[75%] ${isSentByCurrentUser ? 'bg-teal-500 text-white rounded-br-none p-2.5' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none p-2.5'}`;
                contentPClasses += " text-lg";
                textColor = isSentByCurrentUser ? "text-white" : "text-slate-700";
              }
              if (msg.audioContent) { // Override width for audio
                 bubbleOuterClasses = bubbleOuterClasses.replace(/max-w-\[75%\]|w-auto inline-block/g, 'w-full');
                 if (isOnlyEmoji) { // if it was emoji-only, but now also has audio, revert padding
                    bubbleOuterClasses = bubbleOuterClasses.replace('p-0', isSentByCurrentUser ? 'p-2.5' : 'p-2.5');
                 }
              }
              
              const canDeleteThisMessage = isSentByCurrentUser && !msg.isDeleted; 

              if (msg.isDeleted) {
                return (
                  <div key={msg.id} className={`flex flex-col ${isSentByCurrentUser ? 'items-end' : 'items-start'} group relative py-1`}>
                    <div className={`max-w-[75%] p-2.5 rounded-lg shadow-sm mb-0.5 bg-slate-200 text-slate-500 italic ${isSentByCurrentUser ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                      <p className="text-base whitespace-pre-wrap break-words">
                        {isSentByCurrentUser ? BN_UI_TEXT.YOU_DELETED_A_MESSAGE : BN_UI_TEXT.MESSAGE_WAS_DELETED}
                      </p>
                      <p className={`text-xs mt-1 text-slate-400 ${isSentByCurrentUser ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(msg.deletedAt || msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                    key={msg.id}
                    className="group relative py-1"
                    onMouseEnter={() => {
                        if (canDeleteThisMessage && !msg.isDeleted) setHoveredMessageIdForDeleteButton(msg.id);
                        if (!isSentByCurrentUser && !msg.isDeleted) setHoveredMessageIdForReactionButton(msg.id);
                    }}
                    onMouseLeave={() => {
                        setHoveredMessageIdForDeleteButton(null);
                        if (!isSentByCurrentUser) setHoveredMessageIdForReactionButton(null);
                    }}
                >
                 <div className={`flex flex-col ${isSentByCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className={bubbleOuterClasses}>
                    {msg.imageContent && (
                      <img
                        src={msg.imageContent.base64Data}
                        alt={msg.imageContent.fileName || "Chat image"}
                        className="max-w-full h-auto rounded-md my-1 max-h-60 object-contain cursor-pointer"
                        onClick={() => handleImageClick(msg.imageContent)}
                        onKeyDown={(e) => e.key === 'Enter' && handleImageClick(msg.imageContent)}
                        tabIndex={0}
                        role="button"
                        aria-label="ছবিটি বড় করে দেখুন"
                      />
                    )}
                     {msg.audioContent && (
                        <div className="my-1">
                            <audio controls src={msg.audioContent.base64Data} className="w-full">
                                আপনার ব্রাউজার অডিও সমর্থন করে না।
                            </audio>
                        </div>
                    )}
                    {msg.content && (
                      <p className={`${contentPClasses} ${textColor}`}>
                        {msg.content}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isOnlyEmoji ? (isSentByCurrentUser ? 'text-slate-700' : 'text-slate-400') : (isSentByCurrentUser ? 'text-teal-100' : 'text-slate-400')
                      } ${isSentByCurrentUser ? 'text-right' : 'text-left'}`}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-0.5 px-1 ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) return null;
                        const currentUserReacted = userIds.includes(currentUser.id ?? '');
                        return (
                          <button
                            key={emoji}
                            onClick={() => !isSentByCurrentUser && handleReactionSelect(msg.id, emoji)}
                            className={`px-1.5 py-0.5 text-xs rounded-full border flex items-center space-x-1 transition-colors
                              ${currentUserReacted
                                ? 'bg-teal-100 border-teal-400 text-teal-700 hover:bg-teal-200'
                                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'}
                              ${isSentByCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
                            aria-label={`React with ${emoji}, currently ${userIds.length} ${currentUserReacted ? ', you reacted' : ''}`}
                            disabled={isSentByCurrentUser}
                          >
                            <span className="text-lg">{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                 </div>

                  {!isSentByCurrentUser && !msg.isDeleted && (hoveredMessageIdForReactionButton === msg.id || showReactionPickerFor === msg.id) && (
                    <div
                        className={`absolute left-0 z-20 flex flex-col items-start`}
                        style={{ bottom: '-8px' }}
                    >
                        {showReactionPickerFor === msg.id && (
                            <div
                                ref={reactionPickerRef}
                                className="mb-1 p-1.5 bg-white border border-slate-300 rounded-lg shadow-xl flex gap-1"
                                style={{ animation: 'fadeInScaleUp 0.1s ease-out forwards' }}
                            >
                            {REACTION_EMOJI_LIST.map(emoji => (
                                <button
                                key={emoji}
                                onClick={() => handleReactionSelect(msg.id, emoji)}
                                className="p-1.5 text-2xl rounded-md hover:bg-slate-100 focus:bg-slate-200 focus:outline-none"
                                aria-label={`React with ${emoji}`}
                                >
                                {emoji}
                                </button>
                            ))}
                            </div>
                        )}
                        <button
                            className="add-reaction-trigger p-1 bg-white border border-slate-300 rounded-full shadow-md focus:outline-none focus:ring-1 focus:ring-teal-500"
                            onClick={() => {
                                const newPickerState = showReactionPickerFor === msg.id ? null : msg.id;
                                setShowReactionPickerFor(newPickerState);
                            }}
                            title={BN_UI_TEXT.ADD_REACTION_TOOLTIP}
                            aria-label={BN_UI_TEXT.ADD_REACTION_TOOLTIP}
                        >
                        <FaceSmileIcon className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                  )}
                  {canDeleteThisMessage && !msg.isDeleted && hoveredMessageIdForDeleteButton === msg.id && (
                     <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className={`absolute z-20 p-1 bg-white border border-red-300 rounded-full shadow-md focus:outline-none focus:ring-1 focus:ring-red-500 hover:bg-red-50 text-red-500 hover:text-red-600`}
                        style={{
                            bottom: '-8px',
                            right: isSentByCurrentUser ? '0' : undefined, 
                        }}
                        title={BN_UI_TEXT.DELETE_MESSAGE_TOOLTIP}
                        aria-label={BN_UI_TEXT.DELETE_MESSAGE_TOOLTIP}
                     >
                        <TrashIcon className="w-4 h-4" />
                     </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {imagePreviewUrls.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-white overflow-x-auto custom-scrollbar-chat-horizontal z-15">
            <div className="flex space-x-2">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img src={url} alt={`${BN_UI_TEXT.IMAGE_PREVIEW_CHAT_ALT} ${index + 1}`} className="h-24 w-24 object-cover rounded-md border border-slate-300" />
                  <button
                    onClick={() => removeSelectedImageAtIndex(index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 leading-none hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-300"
                    aria-label={` ছবি ${index + 1} সরান`}
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {recordedAudio && (
            <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2 z-15">
                <audio controls src={recordedAudio.url} className="flex-grow">
                    {BN_UI_TEXT.AUDIO_PREVIEW_LABEL}
                </audio>
                <span className="text-xs text-slate-500">{formatDuration(recordedAudio.duration)}</span>
                <button
                    onClick={removeRecordedAudio}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                    title={BN_UI_TEXT.REMOVE_AUDIO_PREVIEW_TOOLTIP}
                    aria-label={BN_UI_TEXT.REMOVE_AUDIO_PREVIEW_TOOLTIP}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        {isRecording && (
            <div className="p-2 text-center text-sm text-red-600 bg-red-50 border-t border-red-200 z-15">
                {BN_UI_TEXT.RECORDING_LABEL} {formatDuration(recordingDuration)}
            </div>
        )}

        <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl sticky bottom-0 z-10">
           <div className="relative"> {/* Container for emoji picker positioning */}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef} 
                  className="absolute bottom-[calc(100%+0.5rem)] right-0 z-30 bg-white border border-slate-300 rounded-lg shadow-xl p-2 grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-48 overflow-y-auto custom-scrollbar-chat w-80 sm:w-96"
                  style={{ animation: 'fadeInScaleUp 0.1s ease-out forwards' }}
                >
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-1.5 text-3xl rounded-md hover:bg-slate-100 focus:bg-slate-200 focus:outline-none"
                      title={emoji}
                      aria-label={`ইমোজি ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-teal-600 rounded-full hover:bg-teal-50 transition-colors"
                  title={BN_UI_TEXT.ATTACH_IMAGE_TOOLTIP}
                  aria-label={BN_UI_TEXT.ATTACH_IMAGE_TOOLTIP}
                  disabled={isRecording}
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept={ALLOWED_CHAT_IMAGE_TYPES.join(',')}
                  className="hidden"
                  multiple
                  disabled={isRecording}
                />
                <button
                  id="emoji-picker-button"
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className={`p-2.5 rounded-full transition-colors ${showEmojiPicker ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:text-yellow-600 hover:bg-yellow-50'}`}
                  title={BN_UI_TEXT.EMOJI_PICKER_TOOLTIP}
                  aria-label={BN_UI_TEXT.EMOJI_PICKER_TOOLTIP}
                  aria-expanded={showEmojiPicker}
                  disabled={isRecording}
                >
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`p-2.5 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
                  title={isRecording ? BN_UI_TEXT.STOP_RECORDING_TOOLTIP : BN_UI_TEXT.RECORD_VOICE_TOOLTIP}
                  aria-label={isRecording ? BN_UI_TEXT.STOP_RECORDING_TOOLTIP : BN_UI_TEXT.RECORD_VOICE_TOOLTIP}
                >
                  {isRecording ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                </button>
                <textarea
                  ref={inputRef}
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={BN_UI_TEXT.TYPE_YOUR_MESSAGE}
                  className="flex-grow p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm min-h-[44px] max-h-28 custom-scrollbar-chat"
                  rows={1}
                  aria-label={BN_UI_TEXT.TYPE_YOUR_MESSAGE}
                  disabled={isRecording}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  title={BN_UI_TEXT.SEND_MESSAGE_BTN}
                  aria-label={BN_UI_TEXT.SEND_MESSAGE_BTN}
                  disabled={(!newMessageContent.trim() && selectedImages.length === 0 && !recordedAudio) || isRecording}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
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
        .custom-scrollbar-chat-horizontal::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar-chat-horizontal::-webkit-scrollbar-track { background: #f1f5f9; border-radius:3px; }
        .custom-scrollbar-chat-horizontal::-webkit-scrollbar-thumb { background: #94a3b8; border-radius:3px; }
        .custom-scrollbar-chat-horizontal::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
    {isImageViewerOpen && viewingImageDetails && (
        <ImageViewerModal
            isOpen={isImageViewerOpen}
            onClose={() => { setIsImageViewerOpen(false); setViewingImageDetails(null); }}
            imageUrl={viewingImageDetails.url}
            imageName={viewingImageDetails.name}
        />
    )}
    </>
  );
};

export default ChatModal;
