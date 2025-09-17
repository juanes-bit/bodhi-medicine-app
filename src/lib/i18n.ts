import Constants from "expo-constants"

const DEFAULT_LOCALE = Constants.expoConfig?.extra?.locale || "es"

type Translations = {
  [key: string]: {
    [locale: string]: string
  }
}

const translations: Translations = {
  // Navigation
  "nav.home": {
    es: "Inicio",
    en: "Home",
  },
  "nav.courses": {
    es: "Cursos",
    en: "Courses",
  },
  "nav.membership": {
    es: "Membresía",
    en: "Membership",
  },
  "nav.community": {
    es: "Comunidad",
    en: "Community",
  },
  "nav.profile": {
    es: "Perfil",
    en: "Profile",
  },

  // Auth
  "auth.login": {
    es: "Iniciar Sesión",
    en: "Login",
  },
  "auth.register": {
    es: "Registrarse",
    en: "Register",
  },
  "auth.email": {
    es: "Correo electrónico",
    en: "Email",
  },
  "auth.password": {
    es: "Contraseña",
    en: "Password",
  },
  "auth.forgot_password": {
    es: "¿Olvidaste tu contraseña?",
    en: "Forgot your password?",
  },

  // Courses
  "courses.continue_watching": {
    es: "Continuar viendo",
    en: "Continue watching",
  },
  "courses.enroll": {
    es: "Inscribirse",
    en: "Enroll",
  },
  "courses.continue": {
    es: "Continuar",
    en: "Continue",
  },
  "courses.locked": {
    es: "Bloqueado",
    en: "Locked",
  },
  "courses.free_preview": {
    es: "Vista previa gratuita",
    en: "Free preview",
  },

  // Common
  "common.loading": {
    es: "Cargando...",
    en: "Loading...",
  },
  "common.error": {
    es: "Error",
    en: "Error",
  },
  "common.retry": {
    es: "Reintentar",
    en: "Retry",
  },
  "common.save": {
    es: "Guardar",
    en: "Save",
  },
  "common.cancel": {
    es: "Cancelar",
    en: "Cancel",
  },
}

let currentLocale = DEFAULT_LOCALE

export function setLocale(locale: string) {
  currentLocale = locale
}

export function getLocale(): string {
  return currentLocale
}

export function t(key: string, locale?: string): string {
  const targetLocale = locale || currentLocale
  return translations[key]?.[targetLocale] || translations[key]?.["es"] || key
}
