
import React, { useState, useEffect, useRef } from 'react';
import { CompanyProfile } from '../types';
import { BN_UI_TEXT } from '../constants';
import CameraIcon from './icons/CameraIcon';
import TrashIcon from './icons/TrashIcon';

interface CompanyProfileFormProps {
  initialData?: CompanyProfile | null;
  onSave: (profileData: Omit<CompanyProfile, 'id' | 'userId' | 'createdAt' | 'lastModified'>, existingId?: string) => Promise<void>;
  onCancel: () => void;
}

const MAX_LOGO_SIZE_BYTES = 512 * 1024; // 512KB

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [isDefault, setIsDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName);
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setTaxId(initialData.taxId || '');
      setLogoBase64(initialData.logoBase64);
      setIsDefault(initialData.isDefault || false);
    } else {
      // Reset form for new entry
      setCompanyName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setTaxId('');
      setLogoBase64(undefined);
      setIsDefault(false);
    }
  }, [initialData]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        alert(`লোগো ফাইলের আকার ${MAX_LOGO_SIZE_BYTES / 1024}KB এর বেশি হতে পারবে না।`);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert("কোম্পানির নাম আবশ্যক।");
      return;
    }
    await onSave({
      companyName,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      taxId: taxId || undefined,
      logoBase64: logoBase64,
      isDefault: isDefault,
    }, initialData?.id);
  };
  
  const inputClass = "w-full px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div>
        <label htmlFor="companyName" className="block text-xs font-medium text-slate-600 mb-0.5">কোম্পানির নাম <span className="text-red-500">*</span></label>
        <input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} required />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="companyPhone" className="block text-xs font-medium text-slate-600 mb-0.5">ফোন নম্বর</label>
          <input type="tel" id="companyPhone" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="companyEmail" className="block text-xs font-medium text-slate-600 mb-0.5">ইমেইল</label>
          <input type="email" id="companyEmail" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>
      </div>
      
      <div>
        <label htmlFor="companyAddress" className="block text-xs font-medium text-slate-600 mb-0.5">ঠিকানা</label>
        <textarea id="companyAddress" value={address} onChange={e => setAddress(e.target.value)} rows={2} className={inputClass}></textarea>
      </div>
      
      <div>
        <label htmlFor="companyTaxId" className="block text-xs font-medium text-slate-600 mb-0.5">ট্যাক্স আইডি / BIN</label>
        <input type="text" id="companyTaxId" value={taxId} onChange={e => setTaxId(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">কোম্পানির লোগো (ঐচ্ছিক)</label>
        <div className="mt-1 flex items-center space-x-3">
          <span className="inline-block h-16 w-16 rounded-md overflow-hidden bg-slate-100 ring-1 ring-slate-200">
            {logoBase64 ? (
              <img src={logoBase64} alt="লোগো প্রিভিউ" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 6h-15A2.5 2.5 0 002 8.5v7A2.5 2.5 0 004.5 18h15a2.5 2.5 0 002.5-2.5v-7A2.5 2.5 0 0019.5 6zM4 8.5H20v7H4v-7zm6 5.5l-2-2.5h8l-2.5 3-1.5-1.5z" /></svg>
              </div>
            )}
          </span>
          <div className="flex flex-col space-y-1.5">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-2.5 py-1 border border-slate-300 text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
              <CameraIcon className="w-4 h-4 mr-1.5 text-slate-500" />
              {logoBase64 ? "লোগো পরিবর্তন করুন" : "লোগো আপলোড করুন"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden" />
            {logoBase64 && (
              <button type="button" onClick={handleRemoveLogo}
                className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200">
                <TrashIcon className="w-4 h-4 mr-1.5" />
                লোগো সরান
              </button>
            )}
          </div>
        </div>
      </div>
       <div className="pt-2">
        <label htmlFor="isDefaultCompany" className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" id="isDefaultCompany" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} 
                 className="form-checkbox h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500" />
          <span className="text-sm text-slate-700">ডিফল্ট কোম্পানির প্রোফাইল হিসেবে সেট করুন</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
          {BN_UI_TEXT.CANCEL}
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">
          {initialData ? BN_UI_TEXT.SAVE_CHANGES : "প্রোফাইল সংরক্ষণ করুন"}
        </button>
      </div>
    </form>
  );
};

export default CompanyProfileForm;
