import React, { useEffect } from 'react'
import { XMarkIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Props {
  imageUrl: string
  onClose: () => void
}

const ImageLightbox: React.FC<Props> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      toast.success('URL copiée dans le presse-papier')
    } catch {
      toast.error('Impossible de copier l\'URL')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageUrl.split('/').pop() || 'image.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Actions bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-4 z-10">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              title="Copier l'URL"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Copier URL</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              title="Télécharger"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            title="Fermer (ESC)"
          >
            <XMarkIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        {/* Image */}
        <img
          src={imageUrl}
          alt="Preview"
          className="max-h-[90vh] w-full object-contain rounded-lg"
          onClick={onClose}
        />
      </div>
    </div>
  )
}

export default ImageLightbox
