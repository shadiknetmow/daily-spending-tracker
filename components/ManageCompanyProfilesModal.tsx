
import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { BN_UI_TEXT } from '../constants';
import Modal from './Modal';
import CompanyProfileForm from './CompanyProfileForm'; // Placeholder for now
import PlusCircleIcon from './icons/PlusCircleIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';


interface ManageCompanyProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfiles: CompanyProfile[];
  onAddProfile: (profileData: Omit<CompanyProfile, 'id' | 'userId' | 'createdAt' | 'lastModified'>) => Promise<CompanyProfile | null>;
  onUpdateProfile: (profileId: string, updates: Partial<CompanyProfile>) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}

const ManageCompanyProfilesModal: React.FC<ManageCompanyProfilesModalProps> = ({
  isOpen,
  onClose,
  companyProfiles,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CompanyProfile | null>(null);

  const handleOpenForm = (profile?: CompanyProfile) => {
    setEditingProfile(profile || null);
    setIsFormOpen(true);
  };

  const handleFormSave = async (profileData: Omit<CompanyProfile, 'id' | 'userId' | 'createdAt' | 'lastModified'>, existingId?: string) => {
    if (existingId) {
      await onUpdateProfile(existingId, profileData);
    } else {
      await onAddProfile(profileData);
    }
    setIsFormOpen(false);
    setEditingProfile(null);
  };
  
  const handleSetDefault = async (profileId: string) => {
    // Logic to unset other defaults and set this one
    // This will involve multiple onUpdateProfile calls or a dedicated backend endpoint
    console.log("Set default profile:", profileId);
     const currentDefault = companyProfiles.find(p => p.isDefault);
     if (currentDefault && currentDefault.id !== profileId) {
         await onUpdateProfile(currentDefault.id, { isDefault: false });
     }
     await onUpdateProfile(profileId, { isDefault: true });
  };


  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={BN_UI_TEXT.MANAGE_COMPANY_PROFILES_MODAL_TITLE} size="xl">
      <div className="p-1">
        {isFormOpen ? (
          <CompanyProfileForm
            initialData={editingProfile}
            onSave={handleFormSave}
            onCancel={() => { setIsFormOpen(false); setEditingProfile(null); }}
          />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => handleOpenForm()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm flex items-center space-x-2 text-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span>নতুন কোম্পানির প্রোফাইল যোগ করুন</span>
              </button>
            </div>
            {companyProfiles.length === 0 ? (
              <p className="text-slate-500 text-center py-6">কোনো কোম্পানির প্রোফাইল এখনো যোগ করা হয়নি।</p>
            ) : (
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar-modal pr-2">
                {companyProfiles.map(profile => (
                  <li key={profile.id} className="p-3 bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md group">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <div className="flex-grow mb-2 sm:mb-0">
                        <h3 className="text-md font-semibold text-slate-700 flex items-center">
                          {profile.companyName}
                          {profile.isDefault && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              ডিফল্ট
                            </span>
                          )}
                        </h3>
                        {profile.address && <p className="text-xs text-slate-500">{profile.address}</p>}
                        {profile.phone && <p className="text-xs text-slate-500">ফোন: {profile.phone}</p>}
                        {profile.email && <p className="text-xs text-slate-500">ইমেইল: {profile.email}</p>}
                      </div>
                      <div className="flex space-x-1.5 self-start sm:self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {!profile.isDefault && (
                           <button
                            onClick={() => handleSetDefault(profile.id)}
                            className="p-1.5 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50 text-xs flex items-center"
                            title="ডিফল্ট হিসেবে সেট করুন"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1"/> সেট ডিফল্ট
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenForm(profile)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                          title="সম্পাদনা করুন"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProfile(profile.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                          title="মুছে ফেলুন"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ManageCompanyProfilesModal;
