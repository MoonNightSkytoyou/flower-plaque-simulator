import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const savedLanguage = localStorage.getItem("flower-plaque-language");
i18n.use(initReactI18next).init({ resources: { zh: { translation: zh }, en: { translation: en } }, lng: savedLanguage === "en" ? "en" : "zh", fallbackLng: "zh", interpolation: { escapeValue: false } });
i18n.on("languageChanged", (language) => localStorage.setItem("flower-plaque-language", language));
export default i18n;
