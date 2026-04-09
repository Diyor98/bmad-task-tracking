import { useRef, useState } from 'react'
import { Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../hooks/useAttachments'
import { ConfirmDialog } from '@/features/projects/components/ConfirmDialog'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  taskId: string
  projectId: string
}

export function AttachmentSection({ taskId, projectId }: Props) {
  const { data: attachments, isLoading } = useAttachments(taskId)
  const uploadMutation = useUploadAttachment(taskId, projectId)
  const deleteMutation = useDeleteAttachment(taskId, projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    uploadMutation.mutate(file, {
      onError: (err) => {
        const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Upload failed'
        setError(message)
      },
    })
    e.target.value = ''
  }

  function handleDelete() {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    })
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-500">Attachments</label>

      {isLoading && (
        <div className="space-y-2">
          <div className="h-8 animate-pulse rounded bg-zinc-100" />
        </div>
      )}

      {attachments && attachments.length > 0 && (
        <div className="mb-2 space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-zinc-50">
              <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
              <a
                href={`/api/attachments/${att.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-indigo-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {att.filename}
              </a>
              <span className="flex-shrink-0 text-xs text-zinc-400">{formatFileSize(att.fileSize)}</span>
              <span className="flex-shrink-0 text-xs text-zinc-400">{formatDate(att.createdAt)}</span>
              <button
                className="flex-shrink-0 text-zinc-400 hover:text-red-500"
                onClick={() => setDeleteId(att.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="sm"
        className="text-zinc-500 hover:text-zinc-700"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        <Paperclip className="mr-1 h-3.5 w-3.5" />
        {uploadMutation.isPending ? 'Uploading...' : 'Attach file'}
      </Button>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete attachment?"
        description="This cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
