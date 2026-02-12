import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import CoverImageGalleryModal from '../../components/articles/CoverImageGalleryModal'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  BookmarkIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon,
  TagIcon,
  FolderIcon,
  GlobeAltIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

interface ClassroomOption {
  id: string
  name: string
}

interface ArticleCategoryOption {
  id: string
  name: string
}

interface ArticleTagOption {
  id: string
  name: string
}

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type ArticleVisibility = 'PUBLIC' | 'LOGGED_IN' | 'CLASS_ONLY'

type AxiosErrorLike = {
  response?: {
    data?: {
      message?: string
    }
  }
}

type ArticleFullPayload = {
  id: string
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  content?: string | null
  status?: ArticleStatus | string | null
  visibility?: ArticleVisibility | string | null
  categoryId?: string | null
  coverImage?: string | null
  classrooms?: Array<{
    classroomId?: string | null
    classroom?: { id?: string | null } | null
  }> | null
  tags?: Array<{
    tagId?: string | null
    tag?: { id?: string | null } | null
  }> | null
}

interface ArticleForm {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: ArticleStatus
  visibility: ArticleVisibility
  classroomIds: string[]
  categoryId?: string
  coverImage: string
}

const emptyForm: ArticleForm = {
  id: undefined,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'DRAFT',
  visibility: 'PUBLIC',
  classroomIds: [],
  categoryId: undefined,
  coverImage: '',
}

const MyArticles: React.FC = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoSaveFailed, setAutoSaveFailed] = useState(false)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [categories, setCategories] = useState<ArticleCategoryOption[]>([])
  const [tags, setTags] = useState<ArticleTagOption[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [creatingMeta, setCreatingMeta] = useState(false)
  const [showCoverGallery, setShowCoverGallery] = useState(false)
  const [fullscreenEditor, setFullscreenEditor] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const coverFileInputRef = useRef<HTMLInputElement | null>(null)
  const metaErrorToastShownRef = useRef(false)
  const classroomErrorToastShownRef = useRef(false)
  const autoSaveErrorToastShownRef = useRef(false)

  const presetClassroomId = searchParams.get('classroomId') || ''
  const skipNextLoadRef = useRef<string | null>(null)
  const canManage = user && (user.role === 'TEACHER' || user.role === 'ADMIN')

  const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

  const formatTime = (dateValue: Date) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(dateValue)
    } catch {
      return dateValue.toLocaleTimeString()
    }
  }

  // Quill modules avec toolbar enrichie
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    }),
    []
  )

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('/classrooms')
      const data = response.data?.data
      if (Array.isArray(data)) {
        setClassrooms(
          data
            .map((item: unknown) => {
              const candidate = item as Partial<ClassroomOption> | null
              if (!candidate?.id || !candidate?.name) return null
              return { id: String(candidate.id), name: String(candidate.name) }
            })
            .filter((c): c is ClassroomOption => Boolean(c))
        )
      }
    } catch {
      if (!classroomErrorToastShownRef.current) {
        classroomErrorToastShownRef.current = true
        toast.error(t('articles.new.classrooms_load_error', 'Impossible de charger les classes'))
      }
    }
  }

  const fetchMeta = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/article-meta/categories'),
        api.get('/article-meta/tags'),
      ])
      setCategories(catRes.data?.data || [])
      setTags(tagRes.data?.data || [])
    } catch {
      if (!metaErrorToastShownRef.current) {
        metaErrorToastShownRef.current = true
        toast.error(t('articles.new.meta_load_error', 'Impossible de charger les catégories et tags'))
      }
    }
  }

  useEffect(() => {
    if (canManage) {
      void fetchClassrooms()
      void fetchMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage])

  useEffect(() => {
    if (presetClassroomId) {
      setForm((prev) => ({ ...prev, classroomIds: [presetClassroomId] }))
    }
  }, [presetClassroomId])

  const resetForm = () => {
    setForm((prev) => ({ ...emptyForm, classroomIds: prev.classroomIds }))
    setSelectedTagIds([])
  }

  const startCreate = () => {
    resetForm()
    setLastAutoSavedAt(null)
    setHasUnsavedChanges(false)
  }

  const slugify = (input: string): string => {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const loadArticle = async (articleSlug: string) => {
    try {
      setLoadingCurrent(true)
      setActiveTab('edit')
      const response = await api.get(`/articles/${articleSlug}`)
      const full = response.data?.data as ArticleFullPayload

      const existingClassroomIds =
        full?.classrooms && Array.isArray(full.classrooms)
          ? full.classrooms
              .map((c) => c.classroomId ?? c.classroom?.id)
              .filter(isNonEmptyString)
          : []

      const existingTagIds =
        full?.tags && Array.isArray(full.tags)
          ? full.tags.map((tag) => tag.tagId ?? tag.tag?.id).filter(isNonEmptyString)
          : []

      setForm({
        id: full.id,
        title: full.title || '',
        slug: full.slug || '',
        excerpt: full.excerpt || '',
        content: full.content || '',
        status: (full.status || 'DRAFT') as ArticleStatus,
        visibility: (full.visibility || 'PUBLIC') as ArticleVisibility,
        classroomIds: existingClassroomIds,
        categoryId: full.categoryId || undefined,
        coverImage: full.coverImage || '',
      })
      setSelectedTagIds(existingTagIds)
      setHasUnsavedChanges(false)
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.load_error'))
    } finally {
      setLoadingCurrent(false)
    }
  }

  useEffect(() => {
    if (routeSlug) {
      if (skipNextLoadRef.current && routeSlug === skipNextLoadRef.current) {
        skipNextLoadRef.current = null
        return
      }
      void loadArticle(routeSlug)
    } else {
      startCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSlug])

  const buildDraftPayload = (): Record<string, unknown> => {
    const plainText = form.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()
    const words = plainText ? plainText.split(/\s+/).length : 0
    const estimatedReadingTime = Math.max(1, Math.round(words / 200))

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      content: form.content.trim(),
      status: 'DRAFT',
      visibility: form.visibility,
      readingTime: estimatedReadingTime,
      categoryId: form.categoryId || undefined,
      coverImage: form.coverImage.trim() || undefined,
    }

    if (form.classroomIds.length > 0) payload.classroomIds = form.classroomIds
    if (selectedTagIds.length > 0) payload.tagIds = selectedTagIds

    return payload
  }

  const autoSaveDraft = async () => {
    if (!canManage) return
    if (!hasUnsavedChanges) return
    if (saving || autoSaving || loadingCurrent) return
    if (form.status !== 'DRAFT') return
    if (!form.title.trim() || !form.content.trim()) return
    if (form.visibility === 'CLASS_ONLY' && form.classroomIds.length === 0) return

    try {
      setAutoSaving(true)
      setAutoSaveFailed(false)
      const payload = buildDraftPayload()

      if (form.id) {
        const res = await api.put(`/articles/${form.id}`, payload)
        const updated = res.data?.data
        if (updated?.slug && updated.slug !== routeSlug) {
          skipNextLoadRef.current = updated.slug
          navigate(`/dashboard/articles/${updated.slug}/edit`, { replace: true })
        }
      } else {
        const res = await api.post('/articles', payload)
        const created = res.data?.data

        if (created?.id) {
          setForm((prev) => ({
            ...prev,
            id: created.id,
            slug: created.slug || prev.slug,
          }))
        }

        if (created?.slug) {
          skipNextLoadRef.current = created.slug
          navigate(`/dashboard/articles/${created.slug}/edit`, { replace: true })
        }
      }

      setHasUnsavedChanges(false)
      setLastAutoSavedAt(new Date())
    } catch {
      setAutoSaveFailed(true)
      if (!autoSaveErrorToastShownRef.current) {
        autoSaveErrorToastShownRef.current = true
        toast.error(t('articles.new.auto_save_failed', "Échec de l'auto‑sauvegarde"))
      }
    } finally {
      setAutoSaving(false)
    }
  }

  const classroomIdsKey = form.classroomIds.join(',')
  const selectedTagIdsKey = selectedTagIds.join(',')

  useEffect(() => {
    if (!canManage) return
    if (!hasUnsavedChanges) return

    const timer = window.setTimeout(() => {
      void autoSaveDraft()
    }, 2500)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canManage,
    hasUnsavedChanges,
    form.id,
    form.title,
    form.slug,
    form.excerpt,
    form.content,
    form.status,
    form.visibility,
    form.coverImage,
    form.categoryId,
    classroomIdsKey,
    selectedTagIdsKey,
  ])

  const saveArticle = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(t('articles.new.title_and_content_required'))
      return
    }

    if (form.visibility === 'CLASS_ONLY' && form.classroomIds.length === 0) {
      toast.error(t('articles.new.select_at_least_one_class'))
      return
    }

    try {
      setSaving(true)
      const plainText = form.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim()
      const words = plainText ? plainText.split(/\s+/).length : 0
      const estimatedReadingTime = Math.max(1, Math.round(words / 200))

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim(),
        status: form.status,
        visibility: form.visibility,
        readingTime: estimatedReadingTime,
        categoryId: form.categoryId || undefined,
        coverImage: form.coverImage.trim() || undefined,
      }

      if (form.classroomIds.length > 0) payload.classroomIds = form.classroomIds
      if (selectedTagIds.length > 0) payload.tagIds = selectedTagIds

      if (form.id) {
        await api.put(`/articles/${form.id}`, payload)
        toast.success(t('articles.new.updated'))
      } else {
        await api.post('/articles', payload)
        toast.success(t('articles.new.created'))
      }

      setLastAutoSavedAt(null)
      setHasUnsavedChanges(false)
      navigate('/dashboard/articles')
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.save_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (updater: (prev: typeof form) => typeof form) => {
    setForm((prev) => {
      const next = updater(prev)
      setHasUnsavedChanges(true)
      return next
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void saveArticle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, selectedTagIds])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const stats = useMemo(() => {
    const plainText = form.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()
    const words = plainText ? plainText.split(/\s+/).length : 0
    const chars = plainText.length
    const minutes = Math.max(1, Math.round(words / 200))
    return { words, chars, minutes }
  }, [form.content])

  const seoScore = useMemo(() => {
    let score = 0
    if (form.title.length >= 30 && form.title.length <= 60) score += 25
    if (form.excerpt.length >= 120 && form.excerpt.length <= 160) score += 25
    if (form.coverImage.trim()) score += 20
    if (form.categoryId) score += 15
    if (selectedTagIds.length > 0) score += 15
    return score
  }, [form.title, form.excerpt, form.coverImage, form.categoryId, selectedTagIds])

  const publishChecklist = useMemo(() => {
    return [
      { label: t('articles.new.checklist.title_provided'), done: form.title.trim().length > 0 },
      { label: t('articles.new.checklist.content_written'), done: form.content.trim().length > 0 },
      { label: t('articles.new.checklist.cover_image'), done: form.coverImage.trim().length > 0 },
      { label: t('articles.new.checklist.excerpt_added'), done: form.excerpt.trim().length > 0 },
      { label: t('articles.new.checklist.category_selected'), done: !!form.categoryId },
      { label: t('articles.new.checklist.at_least_one_tag'), done: selectedTagIds.length > 0 },
    ]
  }, [form, selectedTagIds, t])

  const completionRate = Math.round(
    (publishChecklist.filter((c) => c.done).length / publishChecklist.length) * 100
  )

  const addClassroom = (id: string) => {
    if (!id) return
    setForm((prev) => {
      if (prev.classroomIds.includes(id)) return prev
      setHasUnsavedChanges(true)
      return { ...prev, classroomIds: [...prev.classroomIds, id] }
    })
  }

  const removeClassroom = (id: string) => {
    setForm((prev) => {
      setHasUnsavedChanges(true)
      return { ...prev, classroomIds: prev.classroomIds.filter((c) => c !== id) }
    })
  }

  const duplicateArticle = async () => {
    if (!form.id) return
    if (!window.confirm(t('articles.new.confirm_duplicate'))) return

    try {
      setSaving(true)
      const payload: Record<string, unknown> = {
        title: `${form.title.trim() || t('article.default', 'Article')} ${t('articles.new.copy_suffix', '(copie)')}`,
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim(),
        status: 'DRAFT' as ArticleStatus,
        visibility: form.visibility,
        readingTime: stats.minutes,
        categoryId: form.categoryId || undefined,
        coverImage: form.coverImage.trim() || undefined,
      }

      if (form.classroomIds.length > 0) payload.classroomIds = form.classroomIds
      if (selectedTagIds.length > 0) payload.tagIds = selectedTagIds

      const res = await api.post('/articles', payload)
      const created = res.data?.data
      toast.success(t('articles.new.duplicated'))
      if (created?.slug) {
        navigate(`/dashboard/articles/${created.slug}/edit`)
      } else {
        navigate('/dashboard/articles')
      }
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.duplicate_error'))
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
    setHasUnsavedChanges(true)
  }

  const filteredTags = useMemo(
    () =>
      tags.filter((t) =>
        t.name.toLowerCase().includes(tagSearch.trim().toLowerCase())
      ),
    [tags, tagSearch]
  )

  const createCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      setCreatingMeta(true)
      const res = await api.post('/article-meta/categories', { name })
      const created = res.data?.data
      setCategories((prev) => [...prev, created])
      setNewCategoryName('')
      toast.success(t('articles.new.category_created', 'Catégorie créée'))
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.generic_error', 'Erreur'))
    } finally {
      setCreatingMeta(false)
    }
  }

  const createTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    try {
      setCreatingMeta(true)
      const res = await api.post('/article-meta/tags', { name })
      const created = res.data?.data
      setTags((prev) => [...prev, created])
      setNewTagName('')
      toast.success(t('articles.new.tag_created', 'Tag créé'))
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.generic_error', 'Erreur'))
    } finally {
      setCreatingMeta(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const uploadCoverFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('articles.new.upload_image_only'))
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'ARTICLE_THUMBNAIL')

      const res = await api.post('/media/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploaded = res.data?.data
      if (uploaded?.url) {
        handleFieldChange((prev) => ({ ...prev, coverImage: uploaded.url }))
        toast.success(t('articles.new.image_uploaded'))
      }
    } catch (error: unknown) {
      const message = (error as AxiosErrorLike)?.response?.data?.message
      toast.error(message || t('articles.new.upload_error', "Erreur lors de l'upload"))
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    await uploadCoverFile(file)
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('articles.new.my_articles')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('articles.new.only_teachers_admins')}
        </p>
      </div>
    )
  }

  return (
    <div className={`${fullscreenEditor ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950' : ''}`}>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/articles')}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label={t('articles.new.back_to_articles', 'Retour à la liste')}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {routeSlug ? t('articles.new.edit_title') : t('articles.new.create_title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {autoSaving && t('articles.new.auto_saving')}
                {lastAutoSavedAt && !autoSaving && t('articles.new.auto_saved_at', { time: formatTime(lastAutoSavedAt) })}
                {hasUnsavedChanges && !autoSaving && !lastAutoSavedAt && t('articles.new.unsaved_changes')}
                {!hasUnsavedChanges && !autoSaving && t('articles.new.all_saved')}
                {autoSaveFailed && !autoSaving && (
                  <span className="text-red-600 dark:text-red-400"> {t('articles.new.auto_save_failed_short', '(auto‑sauvegarde en échec)')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {form.id && (
              <button
                type="button"
                onClick={() => void duplicateArticle()}
                disabled={saving || autoSaving}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                {t('articles.new.duplicate')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void saveArticle()}
              disabled={saving || autoSaving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <BookmarkIcon className="h-4 w-4" />
              {saving ? t('articles.new.saving') : t('articles.new.save')}
            </button>
          </div>
        </div>

        {/* Layout 3 colonnes */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Colonne principale - Éditeur */}
          <div className="lg:col-span-8 space-y-4">
            {/* Titre */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t('articles.new.title_label', 'Titre')}
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('articles.new.title_help', 'Idéalement entre 30 et 60 caractères.')}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    form.title.length === 0
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      : form.title.length < 30
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                        : form.title.length <= 60
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                  }`}
                >
                  {t('articles.new.length_hint', { count: form.title.length, max: 60, defaultValue: '{{count}}/{{max}} caractères' })}
                </span>
              </div>

              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFieldChange((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={t('articles.new.title_placeholder')}
                aria-label={t('articles.new.title_label', 'Titre')}
              />

              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      form.title.length === 0
                        ? 'bg-slate-300 dark:bg-slate-700'
                        : form.title.length < 30
                          ? 'bg-amber-500'
                          : form.title.length <= 60
                            ? 'bg-green-600'
                            : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((form.title.length / 60) * 100))}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {form.title.length > 0 && form.title.length < 30 && (
                    <span className="text-amber-700 dark:text-amber-300">
                      {t('articles.new.title_too_short')}
                    </span>
                  )}
                  {form.title.length > 60 && (
                    <span className="text-red-700 dark:text-red-300">
                      {t('articles.new.title_too_long')}
                    </span>
                  )}
                  {form.title.length >= 30 && form.title.length <= 60 && (
                    <span className="text-green-700 dark:text-green-300">
                      {t('articles.new.title_ok', 'Longueur recommandée')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slug */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('articles.new.url_label', 'URL')}</label>
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange((prev) => ({
                      ...prev,
                      slug: slugify(prev.title || ''),
                    }))
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  {t('articles.new.generate_from_title')}
                </button>
              </div>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                className="mt-1 w-full border-0 bg-transparent px-0 text-sm text-slate-900 focus:outline-none focus:ring-0 dark:text-slate-100"
                placeholder={t('articles.new.slug_placeholder')}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                /articles/{form.slug || '...'}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('articles.new.excerpt_label')}</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => handleFieldChange((prev) => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={t('articles.new.excerpt_placeholder')}
              />
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={`${form.excerpt.length >= 120 && form.excerpt.length <= 160 ? 'text-green-600' : 'text-amber-600'}`}>
                  {t('articles.new.length_hint', { count: form.excerpt.length, max: 160, defaultValue: '{{count}}/{{max}} caractères' })}
                </span>
                {form.excerpt.length > 0 && form.excerpt.length < 120 && (
                  <span className="text-amber-600">• {t('articles.new.excerpt_too_short')}</span>
                )}
                {form.excerpt.length > 160 && (
                  <span className="text-red-600">• {t('articles.new.excerpt_too_long')}</span>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('articles.new.cover_image')}</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadCoverFile(file)
                      e.currentTarget.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    {t('articles.new.upload_cover', 'Uploader')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCoverGallery(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <PhotoIcon className="h-4 w-4" />
                    {t('articles.new.gallery')}
                  </button>
                </div>
              </div>
              {form.coverImage.trim() ? (
                <div className="mt-2 group relative overflow-hidden rounded-lg">
                  <img
                    src={form.coverImage}
                    alt={t('articles.new.cover_image')}
                    className="h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs text-white opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label={t('articles.new.remove', 'Supprimer')}
                  >
                    {t('articles.new.remove')}
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col items-center justify-center py-8 text-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t('articles.new.drag_drop_image_here')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('articles.new.or_click_gallery')}
                  </p>
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    {t('articles.new.choose_file', 'Choisir un fichier')}
                  </button>
                </div>
              )}
            </div>

            {/* Editor Tabs */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === 'edit'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    {t('articles.new.tab.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    <EyeIcon className="h-4 w-4" />
                    {t('articles.new.tab.preview')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFullscreenEditor(!fullscreenEditor)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {fullscreenEditor ? t('articles.new.exit_fullscreen') : t('articles.new.fullscreen')}
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'edit' ? (
                  <ReactQuill
                    theme="snow"
                    value={form.content}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({ ...prev, content: value }))
                    }
                    modules={quillModules}
                    className="min-h-[400px]"
                  />
                ) : (
                  <div className="min-h-[400px] rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                    {form.content.trim() ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: form.content }}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">Aucun contenu à prévisualiser</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar droite - Métadonnées */}
          <div className="lg:col-span-4 space-y-4">
            {/* Stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <ChartBarIcon className="h-4 w-4" />
                Statistiques
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Mots</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{stats.words}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Caractères</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{stats.chars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Temps lecture</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{stats.minutes} min</span>
                </div>
              </div>
            </div>

            {/* SEO Score */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Score SEO</h3>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Optimisation</span>
                  <span className={`font-bold ${seoScore >= 80 ? 'text-green-600' : seoScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {seoScore}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      seoScore >= 80 ? 'bg-green-600' : seoScore >= 50 ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${seoScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist publication */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t('articles.new.checklist_title', 'Checklist')}
                </h3>
                <span className="text-xs text-slate-500">{completionRate}%</span>
              </div>
              <div className="mt-3 space-y-2">
                {publishChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    )}
                    <span className={item.done ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statut & Visibilité */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <GlobeAltIcon className="h-4 w-4" />
                {t('articles.new.publication_title', 'Publication')}
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('articles.new.status_label', 'Statut')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleFieldChange((prev) => ({ ...prev, status: e.target.value as ArticleStatus }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="DRAFT">{t('articles.new.status.draft', 'Brouillon')}</option>
                    <option value="PUBLISHED">{t('articles.new.status.published', 'Publié')}</option>
                    <option value="ARCHIVED">{t('articles.new.status.archived', 'Archivé')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('articles.new.visibility_label', 'Visibilité')}
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        visibility: e.target.value as ArticleVisibility,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="PUBLIC">{t('articles.new.visibility.public', 'Public')}</option>
                    <option value="LOGGED_IN">{t('articles.new.visibility.logged_in', 'Connectés')}</option>
                    <option value="CLASS_ONLY">{t('articles.new.visibility.class_only', 'Classe uniquement')}</option>
                  </select>
                  {form.visibility === 'CLASS_ONLY' && form.classroomIds.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      {t('articles.new.visibility_class_warning', 'Choisissez au moins une classe pour cette visibilité.')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Classes */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <UserGroupIcon className="h-4 w-4" />
                {t('articles.new.classrooms_title', 'Classes liées')}
              </h3>
              <select
                value=""
                onChange={(e) => {
                  addClassroom(e.target.value)
                  e.currentTarget.value = ''
                }}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">{t('articles.new.add_classroom_placeholder', 'Ajouter une classe...')}</option>
                {classrooms
                  .filter((c) => !form.classroomIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.classroomIds.length === 0 ? (
                  <span className="text-xs text-slate-500">{t('articles.new.no_classroom', 'Aucune classe')}</span>
                ) : (
                  form.classroomIds.map((id) => {
                    const c = classrooms.find((x) => x.id === id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => removeClassroom(id)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-red-50 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        aria-label={t('articles.new.remove_classroom', { name: c?.name || t('articles.new.classroom', 'Classe'), defaultValue: 'Retirer {{name}}' })}
                      >
                        {c?.name || t('articles.new.classroom', 'Classe')} ×
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Catégorie */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <FolderIcon className="h-4 w-4" />
                {t('articles.new.category_title', 'Catégorie')}
              </h3>
              <select
                value={form.categoryId || ''}
                onChange={(e) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    ...(e.target.value ? { categoryId: e.target.value } : { categoryId: undefined }),
                  }))
                }
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">{t('articles.new.none', 'Aucune')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('articles.new.new_category_placeholder', 'Nouvelle...')}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void createCategory()}
                  disabled={creatingMeta || !newCategoryName.trim()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  aria-label={t('articles.new.add_category', 'Ajouter une catégorie')}
                >
                  +
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <TagIcon className="h-4 w-4" />
                {t('articles.new.tags_title', 'Tags')}
              </h3>
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder={t('articles.new.filter_tags_placeholder', 'Filtrer...')}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-2 py-1 text-xs transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={t('articles.new.new_tag_placeholder', 'Nouveau tag...')}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void createTag()}
                  disabled={creatingMeta || !newTagName.trim()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  aria-label={t('articles.new.add_tag', 'Ajouter un tag')}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CoverImageGalleryModal
        open={showCoverGallery}
        onClose={() => setShowCoverGallery(false)}
        onSelect={(url) => {
          handleFieldChange((prev) => ({ ...prev, coverImage: url }))
          setShowCoverGallery(false)
        }}
      />
    </div>
  )
}

export default MyArticles
