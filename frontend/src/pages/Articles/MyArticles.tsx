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
  const navigate = useNavigate()
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
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

  const presetClassroomId = searchParams.get('classroomId') || ''
  const skipNextLoadRef = useRef<string | null>(null)
  const canManage = user && (user.role === 'TEACHER' || user.role === 'ADMIN')

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
      const data = response.data?.data || []
      setClassrooms(data.map((c: any) => ({ id: c.id, name: c.name })))
    } catch {
      // silencieux
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
      // silencieux
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
      const full = response.data?.data

      const existingClassroomIds =
        full?.classrooms && Array.isArray(full.classrooms)
          ? full.classrooms
              .map((c: any) => c.classroomId ?? c.classroom?.id)
              .filter(Boolean)
          : []

      const existingTagIds =
        full?.tags && Array.isArray(full.tags)
          ? full.tags.map((t: any) => t.tagId ?? t.tag?.id).filter(Boolean)
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Impossible de charger l'article")
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

  const buildDraftPayload = (): any => {
    const plainText = form.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()
    const words = plainText ? plainText.split(/\s+/).length : 0
    const estimatedReadingTime = Math.max(1, Math.round(words / 200))

    const payload: any = {
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
      // Silencieux
    } finally {
      setAutoSaving(false)
    }
  }

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
    form.classroomIds.join(','),
    selectedTagIds.join(','),
  ])

  const saveArticle = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Titre et contenu sont requis')
      return
    }

    if (form.visibility === 'CLASS_ONLY' && form.classroomIds.length === 0) {
      toast.error('Sélectionnez au moins une classe (visibilité: classe uniquement).')
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

      const payload: any = {
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
        toast.success('Article mis à jour')
      } else {
        await api.post('/articles', payload)
        toast.success('Article créé')
      }

      setLastAutoSavedAt(null)
      setHasUnsavedChanges(false)
      navigate('/dashboard/articles')
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement")
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
      { label: 'Titre renseigné', done: form.title.trim().length > 0 },
      { label: 'Contenu rédigé', done: form.content.trim().length > 0 },
      { label: 'Image de couverture', done: form.coverImage.trim().length > 0 },
      { label: 'Résumé ajouté', done: form.excerpt.trim().length > 0 },
      { label: 'Catégorie sélectionnée', done: !!form.categoryId },
      { label: 'Au moins 1 tag', done: selectedTagIds.length > 0 },
    ]
  }, [form, selectedTagIds])

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
    if (!window.confirm('Dupliquer cet article en nouveau brouillon ?')) return

    try {
      setSaving(true)
      const payload: any = {
        title: `${form.title.trim() || 'Article'} (copie)`,
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
      toast.success('Article dupliqué')
      if (created?.slug) {
        navigate(`/dashboard/articles/${created.slug}/edit`)
      } else {
        navigate('/dashboard/articles')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication')
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
      toast.success('Catégorie créée')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
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
      toast.success('Tag créé')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées')
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
        toast.success('Image uploadée')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur upload')
    }
  }

  if (!canManage) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mes articles</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Seuls les enseignants et administrateurs peuvent créer des articles.
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
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {routeSlug ? 'Éditer l\'article' : 'Nouvel article'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {autoSaving && 'Auto-sauvegarde...'}
                {lastAutoSavedAt && !autoSaving && `Auto-sauvegardé à ${lastAutoSavedAt.toLocaleTimeString('fr-FR')}`}
                {hasUnsavedChanges && !autoSaving && !lastAutoSavedAt && 'Modifications non sauvegardées'}
                {!hasUnsavedChanges && !autoSaving && 'Tout est sauvegardé'}
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
                Dupliquer
              </button>
            )}
            <button
              type="button"
              onClick={() => void saveArticle()}
              disabled={saving || autoSaving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <BookmarkIcon className="h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Layout 3 colonnes */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Colonne principale - Éditeur */}
          <div className="lg:col-span-8 space-y-4">
            {/* Titre */}
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFieldChange((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full border-0 bg-transparent px-0 text-3xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
                placeholder="Titre de votre article..."
              />
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={`${form.title.length >= 30 && form.title.length <= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                  {form.title.length}/60 caractères
                </span>
                {form.title.length > 0 && form.title.length < 30 && (
                  <span className="text-amber-600">• Titre trop court pour le SEO</span>
                )}
                {form.title.length > 60 && (
                  <span className="text-red-600">• Titre trop long pour le SEO</span>
                )}
              </div>
            </div>

            {/* Slug */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">URL</label>
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
                  Générer depuis le titre
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
                placeholder="mon-article-url"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                /articles/{form.slug || '...'}
              </p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Résumé</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => handleFieldChange((prev) => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Un court résumé pour présenter l'article (apparaît dans les listes et sur les moteurs de recherche)..."
              />
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className={`${form.excerpt.length >= 120 && form.excerpt.length <= 160 ? 'text-green-600' : 'text-amber-600'}`}>
                  {form.excerpt.length}/160 caractères
                </span>
                {form.excerpt.length > 0 && form.excerpt.length < 120 && (
                  <span className="text-amber-600">• Trop court pour le SEO</span>
                )}
                {form.excerpt.length > 160 && (
                  <span className="text-red-600">• Trop long pour le SEO</span>
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
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Image de couverture</label>
                <button
                  type="button"
                  onClick={() => setShowCoverGallery(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <PhotoIcon className="h-4 w-4" />
                  Galerie
                </button>
              </div>
              {form.coverImage.trim() ? (
                <div className="mt-2 group relative overflow-hidden rounded-lg">
                  <img
                    src={form.coverImage}
                    alt="Couverture"
                    className="h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col items-center justify-center py-8 text-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Glissez-déposez une image ici
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ou cliquez sur "Galerie" pour choisir
                  </p>
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
                    Édition
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
                    Aperçu
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFullscreenEditor(!fullscreenEditor)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {fullscreenEditor ? 'Quitter plein écran' : 'Plein écran'}
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
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Checklist</h3>
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
                Publication
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleFieldChange((prev) => ({ ...prev, status: e.target.value as ArticleStatus }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publié</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Visibilité</label>
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
                    <option value="PUBLIC">Public</option>
                    <option value="LOGGED_IN">Connectés</option>
                    <option value="CLASS_ONLY">Classe uniquement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Classes */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <UserGroupIcon className="h-4 w-4" />
                Classes liées
              </h3>
              <select
                value=""
                onChange={(e) => {
                  addClassroom(e.target.value)
                  e.currentTarget.value = ''
                }}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Ajouter une classe...</option>
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
                  <span className="text-xs text-slate-500">Aucune classe</span>
                ) : (
                  form.classroomIds.map((id) => {
                    const c = classrooms.find((x) => x.id === id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => removeClassroom(id)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-red-50 hover:border-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {c?.name || 'Classe'} ×
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
                Catégorie
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
                <option value="">Aucune</option>
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
                  placeholder="Nouvelle..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void createCategory()}
                  disabled={creatingMeta || !newCategoryName.trim()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                <TagIcon className="h-4 w-4" />
                Tags
              </h3>
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Filtrer..."
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
                  placeholder="Nouveau tag..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void createTag()}
                  disabled={creatingMeta || !newTagName.trim()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
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
