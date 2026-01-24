import { Prisma } from '@prisma/client'
import prisma from './database'

export const SETTINGS_ID = 'global-settings'

export type GeneralSettings = {
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

export type NotificationSettings = {
  emailNotifications: boolean
  newUserNotification: boolean
  newCommentNotification: boolean
  newArticleNotification: boolean
  systemAlerts: boolean
  weeklyReport: boolean
}

export type SecuritySettings = {
  passwordMinLength: number
  requireSpecialChar: boolean
  requireNumber: boolean
  requireUppercase: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  enableTwoFactor: boolean
  ipWhitelist: string
}

export type AppearanceSettings = {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  enableAnimations: boolean
  compactMode: boolean
}

export type StorageSettings = {
  provider: 'local' | 's3' | 'minio'
  maxFileSize: number
  allowedExtensions: string
  s3Bucket?: string
  s3Region?: string
  s3AccessKey?: string
}

export type SettingsPayload = {
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

export const mergeSection = <T extends Record<string, unknown>>(
  defaults: T,
  current?: Partial<T>,
  incoming?: Partial<T>
): T => ({
  ...defaults,
  ...(current ?? {}),
  ...(incoming ?? {}),
})

export const sanitizePublicSettings = (payload: SettingsPayload): PublicSettings => ({
  general: payload.general,
  appearance: payload.appearance,
  storage: {
    provider: payload.storage.provider,
    maxFileSize: payload.storage.maxFileSize,
    allowedExtensions: payload.storage.allowedExtensions,
    s3Bucket: payload.storage.provider === 'local' ? '' : payload.storage.s3Bucket ?? '',
    s3Region: payload.storage.provider === 'local' ? '' : payload.storage.s3Region ?? '',
  },
})

export const getSettings = async (): Promise<SettingsPayload> => {
  const record = await prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } })
  const data = record?.data as Partial<SettingsPayload> | undefined

  return {
    general: mergeSection(defaultSettings.general, data?.general),
    notifications: mergeSection(defaultSettings.notifications, data?.notifications),
    security: mergeSection(defaultSettings.security, data?.security),
    appearance: mergeSection(defaultSettings.appearance, data?.appearance),
    storage: mergeSection(defaultSettings.storage, data?.storage),
  }
}

export const toJsonValue = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue
