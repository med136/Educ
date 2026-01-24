export type TabType = 'general' | 'users' | 'notifications' | 'security' | 'appearance' | 'storage'

export interface GeneralSettings {
  siteName: string
  siteDescription: string
  siteUrl: string
  adminEmail: string
  language: string
  timezone: string
  itemsPerPage: number
  enableRegistration: boolean
  enableComments: boolean
  requireEmailVerification: boolean
}

export interface NotificationSettings {
  emailNotifications: boolean
  newUserNotification: boolean
  newCommentNotification: boolean
  newArticleNotification: boolean
  systemAlerts: boolean
  weeklyReport: boolean
}

export interface SecuritySettings {
  passwordMinLength: number
  requireSpecialChar: boolean
  requireNumber: boolean
  requireUppercase: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  enableTwoFactor: boolean
  ipWhitelist: string
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  enableAnimations: boolean
  compactMode: boolean
}

export interface StorageSettings {
  provider: 'local' | 's3' | 'minio'
  maxFileSize: number
  allowedExtensions: string
  s3Bucket?: string
  s3Region?: string
  s3AccessKey?: string
}

export interface SettingsPayload {
  general: GeneralSettings
  notifications: NotificationSettings
  security: SecuritySettings
  appearance: AppearanceSettings
  storage: StorageSettings
}

export type PublicSettings = Pick<SettingsPayload, 'general' | 'appearance'> & {
  storage: Pick<StorageSettings, 'provider' | 'maxFileSize' | 'allowedExtensions' | 's3Bucket' | 's3Region'>
}

export const defaultSettings: SettingsPayload = {
  general: {
    siteName: 'EduShare',
    siteDescription: 'Plateforme éducative collaborative',
    siteUrl: 'http://localhost:5173',
    adminEmail: 'admin@edushare.com',
    language: 'fr',
    timezone: 'Europe/Paris',
    itemsPerPage: 20,
    enableRegistration: true,
    enableComments: true,
    requireEmailVerification: false,
  },
  notifications: {
    emailNotifications: true,
    newUserNotification: true,
    newCommentNotification: true,
    newArticleNotification: false,
    systemAlerts: true,
    weeklyReport: false,
  },
  security: {
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    requireUppercase: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    ipWhitelist: '',
  },
  appearance: {
    theme: 'auto',
    primaryColor: '#3B82F6',
    accentColor: '#9333EA',
    enableAnimations: true,
    compactMode: false,
  },
  storage: {
    provider: 'local',
    maxFileSize: 10,
    allowedExtensions: 'jpg,jpeg,png,gif,pdf,doc,docx,ppt,pptx',
    s3Bucket: '',
    s3Region: 'eu-west-1',
    s3AccessKey: '',
  },
}
