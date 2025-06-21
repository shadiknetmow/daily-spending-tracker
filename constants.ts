
import { BN_UI_TEXT as AllBnUiTexts } from './i18n/bn'; // Import the aggregated texts

export const BN_UI_TEXT = AllBnUiTexts; // Re-export for existing imports

export const GEMINI_MODEL_TEXT = "gemini-2.5-flash-preview-04-17"; // Default, will be overridden by user settings
export const GEMINI_PROMPT_LANG = "Bengali";
export const APP_TITLE_FOR_EMAIL = BN_UI_TEXT.APP_TITLE;
export const ADMIN_EMAIL = 'shadik.netmow@gmail.com'; // Admin email

export const DEFAULT_GEMINI_SETTINGS = {
  model: 'gemini-2.5-flash-preview-04-17',
  temperature: 1,
  topK: 64,
  topP: 0.95,
};

export const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'transactions_v5_api_backed', 
  DEBTS: 'debts_v6_api_backed', 
  PERSONS: 'persons_v1_api_backed', 
  USER: 'currentUser_v3_api_backed', 
  PERSON_LEDGER_ENTRIES: 'person_ledger_entries_v1_api_backed', 
  USER_TRANSACTION_SUGGESTIONS: 'user_transaction_suggestions_v2_api_backed',
  BUDGET_CATEGORIES: 'budget_categories_v1_api_backed',
  BUDGETS: 'budgets_v1_api_backed',
  MESSAGES: 'messages_v2_api_backed',
  INVOICES: 'invoices_v1_api_backed',
  PRODUCTS: 'products_v1_api_backed',
  COMPANY_PROFILES: 'company_profiles_v1_api_backed', 
  BANK_ACCOUNTS: 'bank_accounts_v1_api_backed', // New key for Bank Accounts
  REMEMBER_USER: 'rememberUserPreference_v1',
  REMEMBERED_EMAIL_OR_MOBILE: 'rememberedEmailOrMobile_v1',
  REMEMBERED_PASSWORD: 'rememberedPassword_v1', // New key for remembered password
  EXPENSE_FIELD_REQUIREMENTS: 'expense_field_requirements_v1',
  GLOBAL_PHONETIC_MODE: 'global_phonetic_mode_v1',
  INVOICE_GLOBAL_PRICE_TYPE: 'invoice_global_price_type_v1',
  GEMINI_SETTINGS: 'gemini_settings_v1', // New key for Gemini settings
  AI_ASSISTANT_LOGS: 'aiAssistantLogs_v1', // New key for AI Assistant logs
  AI_VOICE_REPLAY_ENABLED: 'aiVoiceReplayEnabled_v1', // New key for AI voice replay setting
  AI_ASSISTANT_SCOPE: 'aiAssistantScope_v1', // New key for AI assistant scope
  DEFAULT_BANK_ACCOUNT_ID: 'defaultBankAccountId_v1', // New key for Default Bank Account ID
  
  // Pin keys for Sales Invoice
  PIN_SALES_INVOICE_PAYMENT_STATUS: 'pin_sales_invoice_payment_status_v1',
  PIN_SALES_INVOICE_DATE: 'pin_sales_invoice_date_v1',
  PIN_SALES_DUE_DATE: 'pin_sales_due_date_v1',
  PIN_SALES_COMPANY_PROFILE: 'pin_sales_company_profile_v1',
  PIN_SALES_DISCOUNT_TYPE: 'pin_sales_discount_type_v1',
  PIN_SALES_TAX_TYPE: 'pin_sales_tax_type_v1',
  PIN_SALES_PAYMENT_METHOD: 'pin_sales_payment_method_v1',
  PIN_SALES_PAYMENT_NOTES: 'pin_sales_payment_notes_v1',
  PIN_SALES_INVOICE_NOTES: 'pin_sales_invoice_notes_v1',

  // Pin keys for Purchase Bill
  PIN_PURCHASE_BILL_DATE: 'pin_purchase_bill_date_v1',
  PIN_PURCHASE_DUE_DATE: 'pin_purchase_due_date_v1',
  PIN_PURCHASE_COMPANY_PROFILE: 'pin_purchase_company_profile_v1',
  PIN_PURCHASE_DISCOUNT_TYPE: 'pin_purchase_discount_type_v1',
  PIN_PURCHASE_TAX_TYPE: 'pin_purchase_tax_type_v1',

  // Column visibility keys
  INVOICE_COLUMN_VISIBILITY_SALES_V1: 'invoiceColumnVisibility_sales_v1',
  INVOICE_COLUMN_VISIBILITY_PURCHASE_V1: 'invoiceColumnVisibility_purchase_v1',

  // Item section font size keys
  INVOICE_ITEM_FONT_SIZE_SALES_V1: 'invoiceItemFontSize_sales_v1',
  INVOICE_ITEM_FONT_SIZE_PURCHASE_V1: 'invoiceItemFontSize_purchase_v1',
};

export const INCOME_DESCRIPTION_SUGGESTIONS_BN = [
  "বেতন প্রাপ্তি | Salary Received",
  "ব্যবসা থেকে আয় | Business Income",
  "ফ্রিল্যান্সিং আয় | Freelancing Income",
  "ভাড়াটিয়া থেকে প্রাপ্তি | Rent Received",
  "বোনাস প্রাপ্তি | Bonus Received",
  "কমিশন প্রাপ্তি | Commission Received",
  "উপহার প্রাপ্তি (অর্থ) | Gift Received (Money)",
  "পুরস্কার প্রাপ্তি | Award/Prize Money",
  "শেয়ার বাজার থেকে লাভ | Stock Market Profit",
  "পুরানো জিনিস বিক্রয় | Sale of Old Items",
  "বিকাশ/নগদ/রকেট ক্যাশইন | bKash/Nagad/Rocket Cash In",
  "ব্যাংক থেকে উত্তোলন | Bank Withdrawal",
  "পাওনা টাকা ফেরত | Dues Recovered",
  "বিনিয়োগ থেকে লাভ | Investment Profit",
  "শিক্ষাবৃত্তি | Scholarship",
  "পরামর্শ ফি | Consultancy Fee",
  "ትርፍ | Dividend",
  "সরকারি অনুদান | Government Grant",
  "জমানো টাকা থেকে প্রাপ্তি | Savings Withdrawal",
  "অন্যান্য আয় | Other Income",
];

export const EXPENSE_DESCRIPTION_SUGGESTIONS_BN = [
  // Household & Groceries (বাসস্থান ও মুদি)
  "বাজার খরচ | Groceries", "চাল | Rice", "ডাল | Lentils", "আটা/ময়দা | Flour/Wheat", "তেল (সয়াবিন/সরিষা) | Oil (Soybean/Mustard)", "লবণ | Salt", "চিনি | Sugar", "পেঁয়াজ | Onion", "রসুন | Garlic", "আদা | Ginger", "আলু | Potato", "টমেটো | Tomato", "বেগুন | Eggplant/Brinjal", "লাউ | Bottle Gourd", "কুমড়া | Pumpkin", "কাঁচামরিচ | Green Chili", "ধনে পাতা | Coriander Leaves", "অন্যান্য সবজি | Other Vegetables", "মাছ | Fish", "মুরগির মাংস | Chicken", "গরুর মাংস | Beef", "খাসির মাংস | Mutton", "ডিম | Eggs", "দুধ | Milk", "দই | Yogurt", "পনির | Cheese", "ঘি | Ghee", "হলুদ গুঁড়া | Turmeric Powder", "মরিচ গুঁড়া | Chili Powder", "জিরা গুঁড়া | Cumin Powder", "ধনিয়া গুঁড়া | Coriander Powder", "গরম মসলা | Garam Masala", "অন্যান্য মসলা | Other Spices", "সস (টমেটো/চিলি) | Sauce (Tomato/Chili)", "আচার | Pickle", "বিস্কুট | Biscuits", "চানাচুর | Chanachur/Bombay Mix", "কেক/পেস্ট্রি | Cake/Pastry", "পাউরুটি | Bread", "নুডলস/পাস্তা | Noodles/Pasta", "চিপস | Chips", "চা পাতা/কফি | Tea Leaves/Coffee", "কোকাকোলা/পেপসি | Coca-Cola/Pepsi", "জুস | Juice", "মিনারেল ওয়াটার | Mineral Water", "শিশুখাদ্য | Baby Food", "বাসা ভাড়া | House Rent", "বিদ্যুৎ বিল | Electricity Bill", "গ্যাস বিল | Gas Bill", "পানি বিল | Water Bill", "ইন্টারনেট বিল | Internet Bill", "ডিশ/ক্যাবল টিভি বিল | Dish/Cable TV Bill", "ময়লা বিল | Trash/Waste Bill", "কাজের লোকের বেতন | Domestic Help Salary", "দারোয়ান বিল | Security Guard Bill", "বাসা মেরামত | House Repair", "প্লাম্বিং খরচ | Plumbing Cost", "ইলেকট্রিক কাজ | Electrical Work", "রং করা | Painting", "আসবাবপত্র ক্রয় | Furniture Purchase", "ফ্রিজ | Refrigerator", "টিভি | Television", "ওয়াশিং মেশিন | Washing Machine", "এসি | Air Conditioner", "ব্লেন্ডার/মিক্সার | Blender/Mixer", "ওভেন/মাইক্রোওয়েভ | Oven/Microwave", "অন্যান্য গৃহস্থালী যন্ত্রপাতি | Other Home Appliances", "床上用品 (বিছানাপত্র) | Beddings (Bed Sheet, Pillow)", " পর্দা | Curtains", "থালা-বাসন | Kitchenware/Utensils", "ঘর পরিষ্কারের সামগ্রী | House Cleaning Supplies (Detergent, Soap)", "এয়ার ফ্রেশনার | Air Freshener", "মশা তাড়ানোর কয়েল/স্প্রে | Mosquito Repellent Coil/Spray", "বাগান পরিচর্যা | Gardening Expense",
  // Personal Care & Clothing (ব্যক্তিগত পরিচর্যা ও পোশাক)
  "সাবান (শরীর/মুখ) | Soap (Body/Face)", "শ্যাম্পু | Shampoo", "কন্ডিশনার | Conditioner", "টুথপেস্ট | Toothpaste", "টুথব্রাশ | Toothbrush", "ডিওডোরেন্ট/বডি স্প্রে | Deodorant/Body Spray", "পারফিউম/সুগন্ধি | Perfume", "মেকআপ সামগ্রী | Makeup Items", "স্কিন কেয়ার | Skin Care Products", "হেয়ার অয়েল/সিরাম | Hair Oil/Serum", "শেভিং কিট | Shaving Kit", "স্যানিটারি ন্যাপকিন/ট্যাম্পন | Sanitary Napkin/Tampon", "সেলুন/বিউটি পার্লার | Salon/Beauty Parlor", "নাপিতের দোকান | Barber Shop", "শার্ট | Shirt", "প্যান্ট/ট্রাউজার | Pants/Trousers", "টি-শার্ট | T-Shirt", "পাঞ্জাবি | Panjabi", "শাড়ি | Saree", "সালোয়ার কামিজ | Salwar Kameez", "জুতা | Shoes", "স্যান্ডেল/চপ্পল | Sandals/Slippers", "মোজা | Socks", "আন্ডারওয়্যার | Underwear", "ঘড়ি | Watch", "ব্যাগ/পার্স | Bag/Purse", "গয়না | Jewelry", "চশমা/কন্টাক্ট লেন্স | Eyeglasses/Contact Lens", "দর্জি খরচ | Tailoring Cost", "লন্ড্রি/ইস্ত্রি | Laundry/Ironing",
  // Transportation (যাতায়াত)
  "রিকশা ভাড়া | Rickshaw Fare", "বাস ভাড়া | Bus Fare", "সিএনজি/অটোরিকশা ভাড়া | CNG/Auto Rickshaw Fare", "ট্রেন টিকেট | Train Ticket", "লঞ্চ/স্টিমার টিকেট | Launch/Steamer Ticket", "বিমান টিকেট | Air Ticket", "গাড়ির তেল/পেট্রোল/ডিজেল | Car Fuel (Petrol/Diesel)", "গাড়ির সিএনজি/এলপিজি | Car CNG/LPG", "মোটরসাইকেল তেল | Motorcycle Fuel", "গাড়ির সার্ভিসিং | Car Servicing", "গাড়ির মেরামত | Car Repair", "টায়ার পরিবর্তন/মেরামত | Tire Change/Repair", "ইঞ্জিন ওয়েল পরিবর্তন | Engine Oil Change", "গাড়ির বীমা | Car Insurance", "পার্কিং ফি | Parking Fee", "টোল প্রদান | Toll Payment", "ড্রাইভারের বেতন | Driver's Salary", "উবার/পাঠাও ভাড়া | Uber/Pathao Fare", "সাইকেল/মোটরসাইকেল মেরামত | Bicycle/Motorcycle Repair",
  // Health & Medical (স্বাস্থ্য ও চিকিৎসা)
  "ডাক্তারের ফি | Doctor's Fee", "ঔষধ ক্রয় | Medicine Purchase", "হাসপাতাল/ক্লিনিক বিল | Hospital/Clinic Bill", "ডায়াগনস্টিক টেস্ট | Diagnostic Test (Blood Test, X-Ray, Ultrasound)", "প্যাথলজি টেস্ট | Pathology Test", "স্বাস্থ্য বীমা প্রিমিয়াম | Health Insurance Premium", "দাঁতের ডাক্তার | Dentist Fee", "চোখের ডাক্তার | Eye Specialist Fee", "চশমা ক্রয়/মেরামত | Eyeglasses Purchase/Repair", "ভিটামিন/ঔষধি সম্পূরক | Vitamins/Supplements", "ফার্স্ট এইড কীট | First Aid Kit", "ফিজিওথেরাপি | Physiotherapy", "অ্যাম্বুলেন্স ভাড়া | Ambulance Fare",
  // Education & Children (শিক্ষা ও সন্তান)
  "স্কুল/কলেজ বেতন | School/College Fees", "বিশ্ববিদ্যালয় বেতন | University Fees", "টিউশন/কোচিং ফি | Tuition/Coaching Fees", "বইপত্র | Books", "খাতা-কলম | Notebooks & Pens", "পেন্সিল/রং পেন্সিল | Pencils/Color Pencils", "অন্যান্য শিক্ষা সামগ্রী | Other Stationery", "স্কুল ইউনিফর্ম | School Uniform", "জুতা (স্কুল) | Shoes (School)", "স্কুল ব্যাগ | School Bag", "টিফিন বক্স/পানির বোতল | Tiffin Box/Water Bottle", "সন্তানের পোশাক | Children's Clothing", "সন্তানের খেলনা | Children's Toys", "ডায়াপার | Diapers", "শিশুদের জন্য ওয়াইপস | Baby Wipes", "স্কুল টিফিন খরচ | School Tiffin Cost", "শিক্ষা সফর খরচ | Excursion/Study Tour Cost", "অনলাইন কোর্স ফি | Online Course Fee", "লাইব্রেরি ফি | Library Fee", "পরীক্ষার ফি | Exam Fee", "হোস্টেল/আবাসিক ফি | Hostel/Residential Fee",
  // Entertainment & Leisure (বিনোদন ও অবসর)
  "সিনেমা/চলচ্চিত্র টিকেট | Movie Ticket", "কনসার্ট/নাটক টিকেট | Concert/Drama Ticket", "খেলাধুলার টিকেট | Sports Event Ticket", "থিম পার্ক/বিনোদন কেন্দ্র | Theme Park/Amusement Center", "স্ট্রিমিং সার্ভিস (নেটফ্লিক্স, হইচই) | Streaming Service (Netflix, Hoichoi)", "বই ক্রয় (বিনোদনমূলক) | Book Purchase (Recreational)", "ম্যাগাজিন/কমিকস | Magazine/Comics", "গান/মিউজিক অ্যাপ সাবস্ক্রিপশন | Music/Music App Subscription", "ভিডিও গেম | Video Game Purchase/Subscription", "শখের সরঞ্জাম (ছবি আঁকা, গান) | Hobby Supplies (Painting, Music)", "ভ্রমণ খরচ (দেশের ভিতর/বিদেশ) | Travel/Vacation Cost (Local/International)", "হোটেল/রিসোর্ট বিল | Hotel/Resort Bill", "দর্শনীয় স্থানের টিকেট | Tourist Spot Ticket", "জিম/ফিটনেস সেন্টার সদস্যতা | Gym/Fitness Center Membership", "খেলাধুলার সরঞ্জাম | Sports Equipment", "ক্লাব সদস্যতা ফি | Club Membership Fee", "বন্ধুদের সাথে আড্ডা/খাবার | Outing/Food with Friends", "পারিবারিক ভ্রমণ | Family Outing", "ক্যাফে/কফি শপ | Cafe/Coffee Shop",
  // Financial & Official (আর্থিক ও দাপ্তরিক)
  "ব্যাংক চার্জ/ফি | Bank Charges/Fees", "এটিএম উত্তোলন চার্জ | ATM Withdrawal Charge", "ব্যক্তিগত ঋণ ইএমআই | Personal Loan EMI", "গাড়ির ঋণ ইএমআই | Car Loan EMI", "ক্রেডিট কার্ড বিল পরিশোধ | Credit Card Bill Payment", "জীবন বীমা প্রিমিয়াম | Life Insurance Premium", "সাধারণ বীমা প্রিমিয়াম | General Insurance Premium", "ডিপিএস/সঞ্চয়পত্র কিস্তি | DPS/Sanchayapatra Installment", "শেয়ার বাজারে বিনিয়োগ | Stock Market Investment", "মিউচুয়াল ফান্ডে বিনিয়োগ | Mutual Fund Investment", "আয়কর প্রদান | Income Tax Payment", "ভ্যাট প্রদান | VAT Payment", "পাসপোর্ট ফি | Passport Fee", "ড্রাইভিং লাইসেন্স ফি | Driving License Fee", "ট্রেড লাইসেন্স ফি | Trade License Fee", "অন্যান্য সরকারি ফি | Other Government Fees", "আইনজীবী ফি | Lawyer Fee", "দলিলপত্র তৈরি খরচ | Document Preparation Cost", "সামাজিক চাঁদা | Social Contribution/Subscription", "মসজিদ/মন্দির/গির্জা দান | Donation to Mosque/Temple/Church", "দাতব্য প্রতিষ্ঠানে দান | Charity Donation", "অন্যান্য দান | Other Donations", "বিকাশ/নগদ/রকেট সেন্ড মানি/ক্যাশ আউট | bKash/Nagad/Rocket Send Money/Cash Out", "মোবাইল ব্যাংকিং চার্জ | Mobile Banking Charge",
  // Gifts & Occasions (উপহার ও অনুষ্ঠান)
  "জন্মদিনের উপহার | Birthday Gift", "বিয়ের উপহার | Wedding Gift", "বার্ষিকী উপহার | Anniversary Gift", "অন্যান্য উপহার | Other Gifts", "ঈদ সালামি/উপহার | Eid Salami/Gift", "পূজার খরচ/উপহার | Puja Expense/Gift", "বড়দিনের খরচ/উপহার | Christmas Expense/Gift", "পহেলা বৈশাখ খরচ | Pohela Boishakh Expense", "পারিবারিক অনুষ্ঠান আয়োজন | Family Event Hosting", "বন্ধুদের জন্য পার্টি | Party for Friends", "ফুল ক্রয় (উপহার/সাজসজ্জা) | Flower Purchase (Gift/Decoration)", "শুভেচ্ছা কার্ড | Greeting Card", "মিষ্টি ক্রয় (উপলক্ষ্যে) | Sweets Purchase (Occasional)",
  // Pets (পোষা প্রাণী)
  "পোষা প্রাণীর খাবার | Pet Food", "পোষা প্রাণীর খেলনা | Pet Toys", "পোষা প্রাণীর সাজসজ্জা/গ্রুমিং | Pet Grooming", "পশুচিকিৎসক ফি | Vet Fees", "পোষা প্রাণীর ঔষধ | Pet Medicine", "পোষা প্রাণীর বিছানা/খাঁচা | Pet Bed/Cage", "পোষা প্রাণীর টিকা | Pet Vaccination",
  // Miscellaneous (বিবিধ)
  "মোবাইল রিচার্জ | Mobile Recharge", "মোবাইল ফোন বিল (পোস্টপেইড) | Mobile Phone Bill (Postpaid)", "স্টেশনারি সামগ্রী (অফিস/বাসা) | Stationery Items (Office/Home)", "খবরের কাগজ/পত্রিকা | Newspaper/Magazine", "ইলেকট্রনিক গ্যাজেট মেরামত | Electronic Gadget Repair", "জুতা/ব্যাগ মেরামত | Shoe/Bag Repair", "সফটওয়্যার/অ্যাপ ক্রয়/সাবস্ক্রিপশন | Software/App Purchase/Subscription", "অনলাইন কেনাকাটা (সাধারণ) | Online Shopping (General)", "কুরিয়ার/ডাক খরচ | Courier/Postage Fee", "বকশিশ/টিপস | Tips", "জরিমানা/শাস্তি | Fines/Penalties", "হারানো জিনিসপত্রের ক্ষতিপূরণ | Compensation for Lost Items", "জরুরী/অপ্রত্যাশিত খরচ | Emergency/Unexpected Expense", "ফটোকপি/প্রিন্ট | Photocopy/Print", "ব্যাটারি ক্রয় | Battery Purchase", "সিম কার্ড ক্রয় | SIM Card Purchase", "পেনড্রাইভ/মেমরি কার্ড | Pendrive/Memory Card", "ওয়েবসাইট ডোমেইন/হোস্টিং | Website Domain/Hosting", "সাবস্ক্রিপশন (অন্যান্য) | Subscription (Other)", "সদস্যতা ফি (অন্যান্য) | Membership Fee (Other)", "বিবিধ ট্যাক্সি/ভাড়া | Miscellaneous Taxi/Fare", "অন্যান্য মেরামত | Other Repairs", "বিবিধ পানীয় | Miscellaneous Drinks", "বিবিধ খাবার | Miscellaneous Food", "অন্যান্য ব্যক্তিগত খরচ | Other Personal Expenses", "অন্যান্য যাতায়াত খরচ | Other Transportation Costs", "অন্যান্য বাসা খরচ | Other Household Costs", "অন্যান্য শিক্ষা খরচ | Other Educational Costs", "অন্যান্য অফিস খরচ | Other Office Expenses", "বিবিধ আনুষ্ঠানিক খরচ | Miscellaneous Official Expenses", "বিবিধ ইলেকট্রনিক্স | Miscellaneous Electronics", "বিবিধ উপহার | Miscellaneous Gifts", "অন্যান্য | Others",
];

export const TRANSACTION_DESCRIPTION_SUGGESTIONS_BN = [
  ...INCOME_DESCRIPTION_SUGGESTIONS_BN,
  ...EXPENSE_DESCRIPTION_SUGGESTIONS_BN,
].filter((value, index, self) => self.indexOf(value) === index) 
 .sort((a, b) => a.localeCompare(b, 'bn-BD'));


export const CHAT_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024; 
export const ALLOWED_CHAT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
export const CHAT_AUDIO_MAX_DURATION_MS = 60 * 1000; 
export const PREFERRED_AUDIO_MIME_TYPE = 'audio/webm'; 
export const EMOJI_LIST = ['😀', '😂', '😊', '😍', '🤔', '👍', '🙏', '❤️', '🎉', '🥳', '😢', '😠', '🔥', '💡', '☀️', '🌙', '🍕', '✈️', '🎈', '⚽'];
export const REACTION_EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '😠'];
export const PRODUCT_IMAGE_MAX_SIZE_BYTES = 512 * 1024; // 512KB for product images

export const COMMON_UNITS_BN = [
  "পিস", "কেজি", "গ্রাম", "লিটার", "এমএল", "মিটার", "ফুট", "ইঞ্চি", "বর্গফুট", "বর্গমিটার",
  "ঘনফুট", "ঘনমিটার", "ডজন", "হালি", "জোড়া", "সেট", "ব্যাগ", "বস্তা", "বোতল", "ক্যান",
  "প্যাকেট", "কার্টুন", "রিম", "পাতা", "ট্রাক", "গাড়ি", "দিন", "ঘন্টা", "মাস", "বছর", "বার"
].sort((a, b) => a.localeCompare(b, 'bn-BD'));

export const EXPENSE_TO_UNIT_MAP_BN: { [key: string]: string } = {
  "চাল": "কেজি", "চাউল": "কেজি",
  "ডাল": "কেজি",
  "আটা": "কেজি", "ময়দা": "কেজি",
  "তেল": "লিটার", "পেট্রোল": "লিটার", "ডিজেল": "লিটার", "অকটেন": "লিটার",
  "দুধ": "লিটার", "পানি": "লিটার", "জুস": "লিটার",
  "কাপড়": "মিটার", "শার্ট": "পিস", "প্যান্ট": "পিস", "শাড়ি": "পিস", "পাঞ্জাবি": "পিস",
  "পর্দা": "পিস", // Or "মিটার" if buying fabric
  "ডিম": "পিস", // Also "হালি" or "ডজন" possible
  "কলা": "পিস", // Also "হালি" or "ডজন"
  "মাছ": "কেজি",
  "মাংস": "কেজি", "মুরগি": "পিস", // Could be "কেজি" if whole chicken weight
  "আলু": "কেজি", "পেঁয়াজ": "কেজি", "রসুন": "কেজি", "আদা": "কেজি",
  "বই": "পিস", "খাতা": "পিস", "কলম": "পিস", "পেন্সিল": "পিস",
  "ইট": "পিস", "টালি": "পিস", "টাইলস": "পিস", // Also "বর্গফুট"
  "কাঠ": "সিএফটি", // ঘনফুট
  "ঔষধ": "পাতা", // Or "পিস", "বোতল"
  "সাবান": "পিস", "শ্যাম্পু": "বোতল",
  "সিগারেট": "পিস", // Corrected from "सिগरेट" - Kept the "পিস" version
  "মোবাইল রিচার্জ": "টাকা", // This is more of a category than item with unit
  "বিদ্যুৎ": "ইউনিট", // kilowatt-hour
  "গ্যাস": "ঘনমিটার", // Or "সিলিন্ডার" (পিস)
};

export const PHONETIC_MAP_BN: { [key: string]: string } = {
  'k': 'ক', 'kh': 'খ', 'g': 'গ', 'gh': 'ঘ', 'ng': 'ঙ',
  'c': 'চ', 'ch': 'চ', 
  'Ch': 'ছ', 'chh': 'ছ', 
  'j': 'জ', 'jh': 'ঝ', 'z': 'ঝ', 
  'NG': 'ঞ', 
  'T': 'ট', 'Th': 'ঠ', 'D': 'ড', 'Dh': 'ঢ', 'N': 'ণ',
  't': 'ত', 'th': 'থ', 'd': 'দ', 'dh': 'ধ', 'n': 'ন',
  'p': 'প', 'f': 'ফ', 'ph': 'ফ', 
  'b': 'ব', 'bh': 'ভ', 'v': 'ভ', 
  'm': 'ম',
  'y': 'য়', 'Y': 'য়', 
  'J': 'য', 
  'r': 'র', 'R': 'র', 
  'l': 'ল',
  's': 'স', 
  'S': 'স', 'sh': 'শ',  
  'Sh': 'ষ', 
  'h': 'হ',
  'DD': 'ড়', 
  'DH': 'ঢ়', 
  'tt': 'ৎ', 
  'NN': 'ং', 
  'HH': 'ঃ', 
  'CN': 'ঁ', 
  'rN': 'র্ণ', 

  'o': 'অ', 
  'a': 'আ', 
  'aa': 'আ', 'A': 'আ',
  'i': 'ই', 'ee': 'ঈ', 'I': 'ঈ',
  'u': 'উ', 'oo': 'ঊ', 'U': 'ঊ',
  'rri': 'ঋ', 
  'e': 'এ', 'E': 'এ',
  'oi': 'ঐ', 'OI': 'ঐ',
  'O': 'ও', 
  'ou': 'ঔ', 'OU': 'ঔ',

  // Placeholder for some common combined words for better feel
  "amar": "আমার",
  "bangla": "বাংলা",
  "desh": "দেশ",
  "taka": "টাকা",
  "kemon": "কেমন",
  "acchen": "আছেন",
  "bhalo": "ভালো",
  "dhonnobad": "ধন্যবাদ",
  "groceries": "মুদিখানার সামগ্রী",
  "salary": "বেতন",
  "bajar": "বাজার",
  "khoroch": "খরচ",
  "barir": "বাড়ির",
  "bhara": "ভাড়া",
  "pani": "পানি",
  "bill": "বিল",
  "internet": "ইন্টারনেট",
  "mobile": "মোবাইল",
  "recharge": "রিচার্জ",
  "jatayat": "যাতায়াত",
  "shikkha": "শিক্ষা",
  "khabar": "খাবার",
  "oshudh": "ঔষধ",
  "biddut": "বিদ্যুৎ",
  "poriman": "পরিমাণ",
  "electric": "ইলেকট্রিক", 

  '.': '।', 
  '?': '?',
  '!': '!',
};

export const BANK_ACCOUNT_TYPES_BN: { [key: string]: string } = {
  SAVINGS: "সেভিংস অ্যাকাউন্ট",
  CURRENT: "কারেন্ট অ্যাকাউন্ট",
  MOBILE_BANKING: "মোবাইল ব্যাংকিং",
  CARD: "কার্ড (ক্রেডিট/ডেবিট)",
  CASH_IN_HAND: "হাতে নগদ",
  OTHER: "অন্যান্য",
};

export const BANK_ACCOUNT_CURRENCIES_BN: { [key: string]: string } = {
  BDT: "BDT - বাংলাদেশী টাকা",
  // Add other currencies if needed later
};
