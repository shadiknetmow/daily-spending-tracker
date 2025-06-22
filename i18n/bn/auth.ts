
export const authTexts = {
  LOGIN: "লগইন",
  SIGNUP: "সাইনআপ",
  LOGOUT: "লগআউট",
  EMAIL: "ইমেইল",
  EMAIL_OR_MOBILE: "ইমেইল অথবা মোবাইল নম্বর",
  PASSWORD: "পাসওয়ার্ড",
  NAME: "নাম",
  NAME_PLACEHOLDER: "আপনার নাম",
  EMAIL_PLACEHOLDER: "user@example.com অথবা 01XXXXXXXXX",
  PASSWORD_PLACEHOLDER: "********",
  DONT_HAVE_ACCOUNT: "অ্যাকাউন্ট নেই?",
  ALREADY_HAVE_ACCOUNT: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
  LOGIN_SUCCESS: "সফলভাবে লগইন করেছেন।",
  SIGNUP_SUCCESS: "সাইনআপ সফল হয়েছে।",
  LOGOUT_SUCCESS: "সফলভাবে লগআউট করেছেন।",
  AUTH_ERROR_GENERAL: "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
  AUTH_ERROR_INVALID_CREDENTIALS: "ইমেইল/মোবাইল অথবা পাসওয়ার্ড সঠিক নয়।",
  AUTH_ERROR_EMAIL_EXISTS: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা আছে।",
  WELCOME_EMAIL_SUBJECT: "আয়-ব্যয় ট্র্যাকারে স্বাগতম!",
  MOCKED_AUTH_WARNING_TITLE: "সিমুলেটেড অথেনটিকেশন:",
  MOCKED_AUTH_WARNING_DESC: "এই অ্যাপটি পূর্বে সিমুলেটেড লগইন/সাইনআপ ব্যবহার করতো। বর্তমানে এটি ব্যাকএন্ডের সাথে সংযুক্ত হওয়ার চেষ্টা করছে।",
  PLEASE_CONFIGURE_APIS: "অনুগ্রহ করে প্রথমে API কনফিগার করুন।",
  USER_NOT_LOGGED_IN_DATA: "লেনদেন ও দেনা-পাওনা দেখতে অনুগ্রহ করে লগইন করুন অথবা সাইনআপ করুন।",
  WELCOME_TO_APP: "অ্যাপে স্বাগতম",
  PLEASE_LOGIN_SIGNUP_TO_PROCEED: "চালিয়ে যেতে অনুগ্রহ করে লগইন অথবা সাইনআপ করুন।",
  PLEASE_CONFIGURE_APIS_FIRST_IF_PROBLEM: "যদি কোনো সমস্যা হয়, প্রথমে অনুগ্রহ করে API গুলি কনফিগার করুন।",
  FORGOT_PASSWORD_LINK: "পাসওয়ার্ড ভুলে গেছেন?",
  FORGOT_PASSWORD_TITLE: "পাসওয়ার্ড পুনরুদ্ধার",
  FORGOT_PASSWORD_INSTRUCTIONS: "আপনার অ্যাকাউন্টের সাথে যুক্ত ইমেইলটি লিখুন। আমরা আপনাকে পাসওয়ার্ড পুনরায় সেট করার জন্য একটি কোড পাঠাব।",
  SEND_RESET_CODE_BTN: "রিসেট কোড পাঠান",
  RESET_CODE_SENT_SUCCESS: "যদি আপনার ইমেইলটি আমাদের সিস্টেমে থাকে, তাহলে একটি রিসেট কোড পাঠানো হয়েছে। কোডটি আপনার ইমেইলে দেখুন।",
  RESET_CODE_SENT_FAIL: "রিসেট কোড পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
  RESET_CODE_LABEL: "রিসেট কোড",
  RESET_CODE_PLACEHOLDER: "ইমেইল থেকে প্রাপ্ত কোড",
  NEW_PASSWORD_LABEL: "নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)",
  CONFIRM_NEW_PASSWORD_LABEL: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  RESET_PASSWORD_BTN: "পাসওয়ার্ড পরিবর্তন করুন",
  PASSWORD_RESET_SUCCESS_AUTO_LOGIN: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে এবং আপনি এখন লগইন অবস্থায় আছেন।",
  PASSWORDS_DONT_MATCH: "নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।",
  INVALID_RESET_CODE: "রিসেট কোডটি সঠিক নয় অথবা মেয়াদ উত্তীর্ণ হয়ে গেছে।",
  EMAIL_NOT_FOUND_ALERT: "এই ইমেইল ঠিকানাটি আমাদের সিস্টেমে খুঁজে পাওয়া যায়নি।",
  RESET_CODE_EMAIL_SUBJECT: "পাসওয়ার্ড রিসেট কোড",
  RESET_CODE_EMAIL_MESSAGE_HTML: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <p>প্রিয় ব্যবহারকারী,</p>
      <p>আপনার পাসওয়ার্ড রিসেট করার জন্য অনুরোধ করা হয়েছে। আপনার এককালীন রিসেট কোড হলো:</p>
      <p style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px; border: 1px dashed #007bff; padding: 10px; display: inline-block;">
        {CODE}
      </p>
      <p>এই কোডটি অল্প সময়ের জন্য সক্রিয় থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন।</p>
      <p>ধন্যবাদ,<br/>{APP_TITLE} টিম</p>
    </div>
  `.trim(),
  PASSWORD_CHANGED_EMAIL_SUBJECT: "আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তিত হয়েছে",
  PASSWORD_CHANGED_EMAIL_MESSAGE_HTML: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <p>প্রিয় {USER_NAME},</p>
      <p>আপনার {APP_TITLE} অ্যাকাউন্টের পাসওয়ার্ড সম্প্রতি পরিবর্তন করা হয়েছে।</p>
      <p>আপনি যদি এই পরিবর্তন না করে থাকেন, অনুগ্রহ করে অবিলম্বে আমাদের সাথে যোগাযোগ করুন।</p>
      <p>ধন্যবাদ,<br/>{APP_TITLE} টিম</p>
    </div>
  `.trim(),
  RESET_CODE_EMAIL_BODY_INTRO: "প্রিয় {userName},",
  RESET_CODE_EMAIL_BODY_REQUEST_INFO: "আপনি আপনার {appName} অ্যাকাউন্টের জন্য পাসওয়ার্ড রিসেট করার অনুরোধ করেছেন।",
  RESET_CODE_EMAIL_BODY_CODE_INFO: "আপনার পাসওয়ার্ড রিসেট কোড হলো: ",
  RESET_CODE_EMAIL_BODY_EXPIRY_INFO: "এই কোডটি ১০ মিনিটের জন্য সক্রিয় থাকবে।",
  RESET_CODE_EMAIL_BODY_IGNORE_INFO: "আপনি যদি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন।",
  RESET_CODE_EMAIL_BODY_THANKS: "ধন্যবাদ,",
  RESET_CODE_EMAIL_BODY_TEAM_NAME: "{appName} টিম",
  BACK_TO_LOGIN_LINK: "লগইনে ফিরে যান",
  REMEMBER_ME: "আমা‌কে ম‌নে রে‌খো",
  CHANGE_PASSWORD_MODAL_TITLE: "পাসওয়ার্ড পরিবর্তন করুন",
  CURRENT_PASSWORD_LABEL: "বর্তমান পাসওয়ার্ড",
  ERROR_CURRENT_PASSWORD_INCORRECT: "আপনার বর্তমান পাসওয়ার্ড সঠিক নয়।",
  PASSWORD_CHANGE_SUCCESS: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।",
  EDIT_PROFILE_MODAL_TITLE: "প্রোফাইল সম্পাদনা করুন",
  EDIT_PROFILE_NAV_BTN_TEXT: "প্রোফাইল",
  EMAIL_NOT_EDITABLE: "ইমেইল (পরিবর্তনযোগ্য নয়)",
  PROFILE_UPDATE_SUCCESS: "আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।",
  MOBILE_NUMBER_ALREADY_IN_USE: "এই মোবাইল নম্বরটি ({mobileNumber}) অন্য কোনো ব্যবহারকারী ব্যবহার করছেন। অনুগ্রহ করে একটি ভিন্ন মোবাইল নম্বর দিন।",
  FACEBOOK_PROFILE_URL: "ফেসবুক প্রোফাইল ইউআরএল (ঐচ্ছিক)",
  FACEBOOK_PROFILE_URL_PLACEHOLDER: "https://facebook.com/yourprofile",
  INVALID_FACEBOOK_URL: "অনুগ্রহ করে একটি সঠিক ফেসবুক প্রোফাইল ইউআরএল দিন।",
  WELCOME_TO_APP_MAIN_TITLE: "অ্যাপে স্বাগতম!",
  WELCOME_TO_APP_SUBTITLE: "আজই শুরু করুন আপনার আয় ও ব্যয় নিয়ন্ত্রণের যাত্রা — হোন আর্থিকভাবে সুসংগঠিত ও আত্মনির্ভরশীল!",
  KEY_FEATURES_TITLE: "আমাদের প্রধান বৈশিষ্ট্যসমূহ:",
  FEATURE_TRANSACTION_TRACKING_TITLE: "দৈনিক আয়-ব্যয় ট্র্যাকিং",
  FEATURE_TRANSACTION_TRACKING_DESC: "সহজেই আপনার প্রতিদিনের আয় এবং ব্যয় রেকর্ড করুন।",
  FEATURE_DEBT_MANAGEMENT_TITLE: "ধার-দেনা ব্যবস্থাপনা",
  FEATURE_DEBT_MANAGEMENT_DESC: "কার কাছে কত পাবেন বা কাকে কত দিতে হবে, তার হিসাব রাখুন।",
  FEATURE_PERSON_LEDGER_TITLE: "ব্যক্তিভিত্তিক খতিয়ান",
  FEATURE_PERSON_LEDGER_DESC: "প্রতি ব্যক্তির সাথে আপনার লেনদেনের বিস্তারিত হিসাব দেখুন।",
  FEATURE_BUDGETING_TITLE: "বাজেট তৈরি ও ট্র্যাকিং",
  FEATURE_BUDGETING_DESC: "মাসিক বা কাস্টম বাজেট তৈরি করুন এবং খরচ ট্র্যাক করুন।",
  FEATURE_REPORTS_TITLE: "বিস্তারিত রিপোর্ট", 
  FEATURE_REPORTS_DESC: "নির্দিষ্ট সময়সীমার জন্য আয়-ব্যয়ের রিপোর্ট দেখুন।",
  FEATURE_AI_ADVICE_TITLE: "AI আর্থিক পরামর্শ",
  FEATURE_AI_ADVICE_DESC: "আপনার আর্থিক অবস্থার উপর ভিত্তি করে Gemini AI থেকে পরামর্শ পান।" ,
};
