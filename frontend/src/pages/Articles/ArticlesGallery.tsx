import React, { useState, useEffect, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  PhotoIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CalendarIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'
import ImageLightbox from '../../components/common/ImageLightbox'

interface GalleryAsset {
  id: string
  type: string
  url: string
  filename?: string
  fileSize?: number
  mimeType?: string
  width?: number
  height?: number
  createdAt: string
}

interface Stats {
  total: number
  totalSize: number
}

const ArticlesGallery: React.FC = () => {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<GalleryAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Stats>({ total: 0, totalSize: 0 })
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = async (nextPage = page) => {
    try {
      setLoading(true)
      const res = await api.get('/media/assets', {
        params: {
          type: 'ARTICLE_THUMBNAIL',
          page: nextPage,
          limit: 24,
        },
      })
      setAssets(res.data?.data || [])
      setTotalPages(res.data?.pagination?.pages || 1)
      setPage(res.data?.pagination?.page || nextPage)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/media/assets/stats', {
        params: { type: 'ARTICLE_THUMBNAIL' },
      })
      setStats(res.data?.data || { total: 0, totalSize: 0 })
    } catch {
      // Silencieux
    }
  }

  useEffect(() => {
    void fetchAssets(1)
    void fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredAssets = useMemo(() => {
    let filtered = [...assets]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.filename?.toLowerCase().includes(term) ||
          a.url.toLowerCase().includes(term)
      )
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''))
    } else if (sortBy === 'size') {
      filtered.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
    }

    return filtered
  }, [assets, searchTerm, sortBy])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'ARTICLE_THUMBNAIL')

      await api.post('/media/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Image uploadée avec succès')
      void fetchAssets(1)
      void fetchStats()
      setSelectedIds(new Set())
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette image ?')) return

    try {
      await api.delete(`/media/assets/${id}`)
      toast.success('Image supprimée')
      void fetchAssets(page)
      void fetchStats()
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Supprimer ${selectedIds.size} image(s) ?`)) return

    const promises = Array.from(selectedIds).map((id) => api.delete(`/media/assets/${id}`))

    try {
      await Promise.all(promises)
      toast.success(`${selectedIds.size} image(s) supprimée(s)`)
      void fetchAssets(page)
      void fetchStats()
      setSelectedIds(new Set())
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copiée')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUpload(e.dataTransfer.files)
    }
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    const mb = kb / 1024
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    return `${kb.toFixed(2)} KB`
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('articles.gallery.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('articles.gallery.desc')}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <PhotoIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.total}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('articles.gallery.total_images')}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <ArrowUpTrayIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatBytes(stats.totalSize)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('articles.gallery.used_space')}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <PhotoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedIds.size}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('articles.gallery.selected')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowUpTrayIcon className="h-4 w-4" />
          {uploading ? t('articles.gallery.uploading') : t('articles.gallery.upload')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />

        {/* Bulk delete */}
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => void handleBulkDelete()}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:hover:bg-red-950/30"
          >
            <TrashIcon className="h-4 w-4" />
            Supprimer ({selectedIds.size})
          </button>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="date">Trier par date</option>
          <option value="name">Trier par nom</option>
          <option value="size">Trier par taille</option>
        </select>
      </div>

      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          Glissez-déposez une image ici
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ou cliquez sur le bouton "Uploader" ci-dessus
        </p>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded dark:bg-slate-800" />
                <div className="h-2 bg-slate-200 rounded w-2/3 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
          <PhotoIcon className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">
            Aucune image
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Commencez par uploader votre première image
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.has(asset.id)
            return (
              <div
                key={asset.id}
                className={`group relative overflow-hidden rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                } bg-white dark:bg-slate-950`}
              >
                {/* Selection checkbox */}
                <div className="absolute left-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(asset.id)}
                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Image */}
                <div
                  className="relative aspect-video cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-900"
                  onClick={() => setLightboxUrl(asset.url)}
                >
                  <img
                    src={asset.url}
                    alt={asset.filename || 'Image'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <ArrowsPointingOutIcon className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                        {asset.filename || 'Sans nom'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        {asset.width && asset.height && (
                          <span>
                            {asset.width} × {asset.height}
                          </span>
                        )}
                        {asset.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatBytes(asset.fileSize)}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(asset.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl(asset.url)}
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                      title="Copier l'URL"
                    >
                      <ClipboardDocumentIcon className="mx-auto h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(asset.url)}
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                      title="Preview"
                    >
                      <ArrowsPointingOutIcon className="mx-auto h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(asset.id)}
                      className="flex-1 rounded-lg border border-red-200 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20"
                      title="Supprimer"
                    >
                      <TrashIcon className="mx-auto h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void fetchAssets(page - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Précédent
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => void fetchAssets(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}

export default ArticlesGallery
