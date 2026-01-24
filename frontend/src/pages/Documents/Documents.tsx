import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

interface DocumentItem {
  id: string
  title: string
  type: string
  size: string
  date: string
  icon: string
  shared: boolean
  fileUrl?: string
  ownerName?: string
  commentCount?: number
  shareCount?: number
}

const Documents: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('all')
   const [search, setSearch] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)

  const formatSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes <= 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const value = bytes / Math.pow(1024, i)
    return `${value.toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    const locale = i18n?.language === 'ar' ? 'ar-SA' : 'fr-FR'
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getIconForType = (type: string): string => {
    switch (type) {
      case 'PDF':
        return '📄'
      case 'DOCX':
        return '📝'
      case 'PPTX':
        return '📊'
      case 'IMAGE':
        return '🖼️'
      case 'VIDEO':
        return '🎥'
      default:
        return '📁'
    }
  }

  const fetchDocuments = async (params?: { page?: number; search?: string; filter?: string }) => {
    try {
      setLoading(true)
      const currentPage = params?.page ?? page
      const currentSearch = params?.search ?? search
      const currentFilter = params?.filter ?? filter

      const apiParams: any = { page: currentPage, limit: 20 }
      if (currentSearch.trim()) {
        apiParams.search = currentSearch.trim()
      }
      if (currentFilter !== 'all') {
        if (currentFilter === 'pdf') apiParams.type = 'PDF'
        else if (currentFilter === 'docx') apiParams.type = 'DOCX'
        else if (currentFilter === 'images') apiParams.type = 'IMAGE'
      }

      const response = await api.get('/documents', { params: apiParams })
      const data = response.data?.data || []
      const pagination = response.data?.pagination

      const mapped: DocumentItem[] = data.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        type: doc.fileType,
        size: formatSize(doc.fileSize),
        date: formatDate(doc.createdAt),
        icon: getIconForType(doc.fileType),
        shared: (doc._count?.shares ?? 0) > 0,
        fileUrl: doc.fileUrl,
        ownerName: doc.owner ? `${doc.owner.firstName} ${doc.owner.lastName}` : undefined,
        commentCount: doc._count?.comments ?? 0,
        shareCount: doc._count?.shares ?? 0,
      }))

      setDocuments(mapped)
      if (pagination) {
        setPage(pagination.page)
        setTotalPages(pagination.pages)
        setTotalDocuments(pagination.total)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('documents.load_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDocuments({ page: 1 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)

    try {
      setUploading(true)
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(t('documents.upload_success'))
      setShowUploadModal(false)
      await fetchDocuments({ page: 1 })
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('documents.upload_error'))
    } finally {
      setUploading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    // Le filtrage par type est maintenant géré côté API, mais on garde une
    // dernière couche de sécurité au cas où.
    if (filter === 'all') return true
    if (filter === 'pdf') return doc.type === 'PDF'
    if (filter === 'docx') return doc.type === 'DOCX'
    if (filter === 'images') return doc.type === 'IMAGE'
    return true
  })

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const url = doc.fileUrl
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
      }

      const response = await api.get(`/documents/${doc.id}`)
      const fileUrl = response.data?.data?.fileUrl
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('URL de fichier introuvable pour ce document')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du téléchargement du document')
    }
  }

  const handleShareLink = (doc: DocumentItem) => {
    const link = doc.fileUrl || window.location.href
    if (navigator.clipboard && link) {
      navigator.clipboard
        .writeText(link)
        .then(() => toast.success('Lien du document copié dans le presse-papiers'))
        .catch(() => toast.error('Impossible de copier le lien'))
    } else {
      toast.error('Partage non disponible dans ce navigateur')
    }
  }

  const handleDelete = async (doc: DocumentItem) => {
    const confirmed = window.confirm(`Supprimer le document "${doc.title}" ? Cette action est définitive.`)
    if (!confirmed) return

    try {
      await api.delete(`/documents/${doc.id}`)
      toast.success('Document supprimé')
      await fetchDocuments({ page })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du document')
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">📄 {t('documents.title')}</h1>
          <p className="text-gray-500 mt-1">{t('documents.desc')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowUploadModal(true)}
          type="button"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
        >
          <span>📤</span> {t('documents.upload')}
        </motion.button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-2">
          {['all', 'pdf', 'docx', 'images'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(1)
                void fetchDocuments({ page: 1, filter: f })
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === f
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? t('documents.filter.all') : t(`documents.filter.${f}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => {
                const value = e.target.value
                setSearch(value)
                setPage(1)
                void fetchDocuments({ page: 1, search: value })
              }}
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all w-48"
            />
          </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={view === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
        }
      >
        {loading && documents.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500">
            {t('documents.loading')}
          </div>
        )}
        {!loading && filteredDocuments.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-gray-500">
            <span className="text-4xl mb-2">📁</span>
            <p className="font-medium text-gray-700">{t('documents.empty.title')}</p>
            <p className="text-gray-500 text-xs max-w-sm">
              {t('documents.empty.desc')}
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
            >
              📤 {t('documents.upload_document')}
            </button>
          </div>
        )}
        {filteredDocuments.map((doc) => (
          <motion.div
            key={doc.id}
            variants={item}
            whileHover={{ y: -4 }}
            className={`bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer group ${
              view === 'list' ? 'flex items-center p-4 gap-4' : 'p-5'
            }`}
          >
            {view === 'grid' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                    {doc.icon}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDownload(doc)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      📥
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShareLink(doc)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(doc)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      ⋮
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {doc.title}
                </h3>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>{doc.type} • {doc.size}</span>
                  {doc.shared && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Partagé
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {doc.date}
                  {doc.ownerName && ` • ${doc.ownerName}`}
                  {typeof doc.commentCount === 'number' && doc.commentCount > 0 && ` • 💬 ${doc.commentCount}`}
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                  <p className="text-xs text-gray-400">
                    {doc.date}
                    {doc.ownerName && ` • ${doc.ownerName}`}
                    {typeof doc.commentCount === 'number' && doc.commentCount > 0 && ` • 💬 ${doc.commentCount}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {doc.shared && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Partagé
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDownload(doc)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      📥
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShareLink(doc)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      🔗
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <p>
            {totalDocuments} {t('documents.items_label', { count: totalDocuments })} • Page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                if (page <= 1) return
                const newPage = page - 1
                setPage(newPage)
                void fetchDocuments({ page: newPage })
              }}
              className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs bg-white hover:bg-gray-50"
            >
              {t('pagination.prev')}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                if (page >= totalPages) return
                const newPage = page + 1
                setPage(newPage)
                void fetchDocuments({ page: newPage })
              }}
              className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs bg-white hover:bg-gray-50"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">📤 {t('documents.upload_modal_title')}</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
                  <span className="text-5xl mb-4 block">📁</span>
                  <p className="font-semibold text-gray-900">{t('documents.upload_drop')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('documents.upload_formats')}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                />
              </label>

              {uploading && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">{t('documents.uploading')}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Documents
