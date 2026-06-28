import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, FileText, Image as ImageIcon, File, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadApi } from '../../api/upload'
import type { FileInfo } from '../../api/upload'

interface ButtonProps {
  fileId: string | null
  label?: string
  className?: string
  style?: React.CSSProperties
  iconOnly?: boolean
}

export default function PreviewDownloadButton({
  fileId,
  label = 'پیش‌نمایش',
  className,
  style,
  iconOnly = false,
}: ButtonProps) {
  const [open, setOpen] = useState(false)
  if (!fileId) return null

  const defaultCls = 'inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors'
  const iconCls    = 'rounded p-1 text-gray-400 hover:text-primary-600 transition-colors'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? (iconOnly ? iconCls : defaultCls)}
        style={style}
      >
        <Eye className={iconOnly ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        {!iconOnly && label}
      </button>
      {open && <FilePreviewModal fileId={fileId} onClose={() => setOpen(false)} />}
    </>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePreviewModal({ fileId, onClose }: { fileId: string; onClose: () => void }) {
  const [info, setInfo]       = useState<FileInfo | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const urlRef                = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    setBlobUrl(null)
    setInfo(null)

    Promise.all([
      uploadApi.info(fileId),
      uploadApi.blob(fileId),
    ])
      .then(([infoRes, blob]) => {
        if (!alive) return
        if (infoRes.code === 200 && infoRes.result) setInfo(infoRes.result)
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setBlobUrl(url)
      })
      .catch(() => { if (alive) setError(true) })
      .finally(() => { if (alive) setLoading(false) })

    return () => {
      alive = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [fileId])

  const handleDownload = async () => {
    try { await uploadApi.download(fileId, info?.originalName) }
    catch { toast.error('خطا در دانلود فایل') }
  }

  const isImage = info?.mimeType?.startsWith('image/')
  const isPdf   = info?.mimeType === 'application/pdf'

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            {isImage
              ? <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
              : isPdf
                ? <FileText className="h-4 w-4 shrink-0 text-red-500" />
                : <File className="h-4 w-4 shrink-0 text-gray-400" />}
            <span className="truncate text-sm font-semibold text-gray-800">
              {info?.originalName ?? 'فایل پیوست'}
            </span>
            {info && (
              <span className="shrink-0 text-xs text-gray-400">
                ({formatSize(info.sizeBytes)})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="ms-3 shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview body */}
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-gray-100">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
              <span className="text-sm">در حال بارگذاری...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
              <File className="h-12 w-12" />
              <span className="text-sm">پیش‌نمایش در دسترس نیست</span>
              <span className="text-xs text-gray-300">برای مشاهده فایل را دانلود کنید</span>
            </div>
          )}

          {!loading && !error && blobUrl && isImage && (
            <img
              src={blobUrl}
              alt={info?.originalName ?? ''}
              className="max-h-[70vh] max-w-full object-contain p-2"
            />
          )}

          {!loading && !error && blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              title={info?.originalName ?? 'PDF'}
              className="h-[70vh] w-full border-0"
            />
          )}

          {!loading && !error && blobUrl && !isImage && !isPdf && (
            <div className="flex flex-col items-center gap-4 py-12 text-gray-400">
              <FileText className="h-16 w-16 text-gray-300" />
              <div className="text-center">
                <p className="text-base font-semibold text-gray-700">{info?.originalName}</p>
                {info && <p className="mt-1 text-sm text-gray-400">{formatSize(info.sizeBytes)}</p>}
                {info?.mimeType && <p className="mt-1 text-xs text-gray-300">{info.mimeType}</p>}
                <p className="mt-3 text-xs text-gray-400">این نوع فایل قابل پیش‌نمایش نیست</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            بستن
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            دانلود
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
