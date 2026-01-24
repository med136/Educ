import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export type GalleryAssetType = 'ARTICLE_THUMBNAIL'

export interface GalleryAsset {
  id: string
  type: GalleryAssetType
  url: string
  createdAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  assetType?: GalleryAssetType
}

const CoverImageGalleryModal: React.FC<Props> = ({ open, onClose, onSelect, assetType = 'ARTICLE_THUMBNAIL' }) => {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [assets, setAssets] = useState<GalleryAsset[]>([])

  const canPrev = page > 1
  const canNext = page < totalPages

  const fetchAssets = async (nextPage = page) => {
    try {
      setLoading(true)
      const res = await api.get('/media/assets', {
        params: {
          type: assetType,
          page: nextPage,
          limit: 24,
        },
      })
      setAssets(res.data?.data || [])
      setTotalPages(res.data?.pagination?.pages || 1)
      setPage(res.data?.pagination?.page || nextPage)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Impossible de charger la galerie')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setPage(1)
      void fetchAssets(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const sortedAssets = useMemo(() => assets, [assets])

  const onUploadFile = async (file: File) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', assetType)

      await api.post('/media/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Image ajoutée à la galerie')
      void fetchAssets(1)
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Upload échoué")
    } finally {
      setUploading(false)
    }
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.delete(`/media/assets/${id}`)
      toast.success('Image supprimée')
      void fetchAssets(page)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Suppression impossible')
    } finally {
      setDeletingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Galerie d’images</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload, sélection, suppression</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
              <span>{uploading ? 'Upload…' : 'Uploader une image'}</span>
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  void onUploadFile(file)
                  e.currentTarget.value = ''
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => void fetchAssets(page)}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Actualiser
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => void fetchAssets(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Précédent
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => void fetchAssets(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Suivant
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Chargement…
            </div>
          ) : sortedAssets.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Aucune image dans la galerie.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sortedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(asset.url)}
                    className="block w-full"
                    title="Choisir"
                  >
                    <img
                      src={asset.url}
                      alt=""
                      className="h-28 w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.opacity = '0.25'
                      }}
                    />
                  </button>

                  <div className="flex items-center justify-between gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => onSelect(asset.url)}
                      className="rounded-lg bg-indigo-600 px-2 py-1 text-[11px] text-white hover:bg-indigo-700"
                    >
                      Sélectionner
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                      title="Supprimer"
                    >
                      {deletingId === asset.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoverImageGalleryModal
