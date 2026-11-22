import React from "react";

const LanguageSelector = () => {
  const languages = [
    { code: "en", name: "English" },
    { code: "kn", name: "Kannada" },
    { code: "hi", name: "Hindi" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-medium transition-colors hover:bg-blue-50"
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;