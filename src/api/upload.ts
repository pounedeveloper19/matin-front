import client from './client'
import type { ExecutionResult } from '../types'

export type EntityType = 'Contract' | 'Payment' | 'Warranty' | 'Ticket' | 'Profile' | 'Bill'

export interface FileInfo {
  fileId: string
  originalName: string
  sizeBytes: number
  mimeType: string
  uploadedAt: string
  entityType: string | null
  entityId: number | null
}

export interface UploadResult {
  fileId: string
  originalName: string
  sizeBytes: number
  mimeType: string
}

export const uploadApi = {
  /** Upload a file and link it to an entity */
  upload: (
    file: File,
    entityType?: EntityType,
    entityId?: number,
    onProgress?: (pct: number) => void,
  ): Promise<ExecutionResult<UploadResult>> => {
    const form = new FormData()
    form.append('file', file)

    const params = new URLSearchParams()
    if (entityType) params.set('entityType', entityType)
    if (entityId != null) params.set('entityId', String(entityId))

    return client
      .post<ExecutionResult<UploadResult>>(`/File/Upload?${params}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
        },
      })
      .then((r) => r.data)
  },

  /** Get file metadata */
  info: (fileId: string): Promise<ExecutionResult<FileInfo>> =>
    client.get<ExecutionResult<FileInfo>>(`/File/Info/${fileId}`).then((r) => r.data),

  /** Download URL (open in browser or anchor tag) */
  downloadUrl: (fileId: string): string => `/api/File/Download/${fileId}`,

  /** Soft-delete a file */
  delete: (fileId: string): Promise<ExecutionResult> =>
    client.delete<ExecutionResult>(`/File/Delete/${fileId}`).then((r) => r.data),
}
