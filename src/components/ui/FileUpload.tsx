import { useRef, useState, useEffect } from 'react'
import { Paperclip, X, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadApi, type EntityType } from '../../api/upload'
import Button from './Button'

interface Props {
  fileId?: string | null
  entityType?: EntityType
  entityId?: number
  label?: string
  accept?: string
  onUploaded?: (fileId: string, fileName: string) => void
  onDeleted?: () => void
  readOnly?: boolean
}

export default function FileUpload({
  fileId,
  entityType,
  entityId,
  label = 'فایل پیوست',
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx',
  onUploaded,
  onDeleted,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<{ id: string; name: string } | null>(
    fileId ? { id: fileId, name: 'فایل پیوست' } : null,
  )

  useEffect(() => {
    setCurrentFile(fileId ? { id: fileId, name: 'فایل پیوست' } : null)
  }, [fileId])

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حداکثر حجم فایل ۱۰ مگابایت است')
      return
    }

    setUploading(true)
    setProgress(0)
    try {
      const res = await uploadApi.upload(file, entityType, entityId, setProgress)
      if (res.code === 200 && res.result) {
        const uploaded = res.result as any
        setCurrentFile({ id: uploaded.fileId, name: uploaded.originalName })
        onUploaded?.(uploaded.fileId, uploaded.originalName)
        toast.success('فایل با موفقیت آپلود شد')
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در آپلود فایل')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!currentFile) return
    try {
      await uploadApi.delete(currentFile.id)
      setCurrentFile(null)
      onDeleted?.()
      toast.success('فایل حذف شد')
    } catch {
      toast.error('خطا در حذف فایل')
    }
  }

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      )}

      {currentFile ? (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-primary-600" />
          <span className="flex-1 truncate text-sm text-gray-700">{currentFile.name}</span>
          <button
            onClick={() => uploadApi.download(currentFile.id, currentFile.name).catch(() => toast.error('خطا در دانلود'))}
            title="دانلود"
            className="rounded p-1 text-gray-400 hover:text-primary-600"
          >
            <Download className="h-4 w-4" />
          </button>
          {!readOnly && (
            <button
              onClick={handleDelete}
              title="حذف فایل"
              className="rounded p-1 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : readOnly ? (
        <p className="text-sm text-gray-400">فایلی پیوست نشده</p>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleSelect}
          />
          <Button
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <span>آپلود... {progress}%</span>
            ) : (
              <>
                <Paperclip className="h-4 w-4" />
                انتخاب فایل
              </>
            )}
          </Button>
          <p className="mt-1 text-xs text-gray-400">
            PDF، Word، Excel، تصویر — حداکثر ۱۰ مگابایت
          </p>
        </div>
      )}
    </div>
  )
}
