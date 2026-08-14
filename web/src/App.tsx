import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type StoredFile = {
  key: string
  size: number
  lastModified: string | null
  type?: string
}

type ApiPayload = {
  files: StoredFile[]
  bucket: string
  region?: string
}

type Toast = {
  id: number
  message: string
  tone: 'success' | 'error' | 'neutral'
}

const MAX_FILE_SIZE = 100 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function shortType(file: StoredFile) {
  const extension = file.key.split('.').pop()?.toLowerCase()
  if (!extension || extension === file.key.toLowerCase()) return 'FILE'
  return extension.slice(0, 4).toUpperCase()
}

function App() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [bucket, setBucket] = useState('checking bucket…')
  const [region, setRegion] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const notify = useCallback((message: string, tone: Toast['tone'] = 'neutral') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3400)
  }, [])

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files')
      if (!response.ok) throw new Error('Could not read the bucket')
      const data = (await response.json()) as ApiPayload
      setFiles(data.files ?? [])
      setBucket(data.bucket || 'S3 bucket')
      setRegion(data.region || '')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load files', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key.toLowerCase() === 'u') inputRef.current?.click()
      if (event.key.toLowerCase() === 'r') loadFiles()
      if (event.key === '/') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('[data-search]')?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [loadFiles])

  const visibleFiles = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return files
    return files.filter((file) => file.key.toLowerCase().includes(needle))
  }, [files, query])

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files])

  const upload = useCallback(async (fileList: FileList | File[]) => {
    const selected = Array.from(fileList)
    if (!selected.length) return

    const tooLarge = selected.find((file) => file.size > MAX_FILE_SIZE)
    if (tooLarge) {
      notify(`${tooLarge.name} is over the 100 MB limit`, 'error')
      return
    }

    setUploading(true)
    try {
      for (const file of selected) {
        const signResponse = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        })
        const signData = await signResponse.json().catch(() => ({})) as { url?: string; error?: string }
        if (!signResponse.ok || !signData.url) {
          throw new Error(signData.error || `Could not prepare ${file.name}`)
        }

        const uploadResponse = await fetch(signData.url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })
        if (!uploadResponse.ok) {
          throw new Error(`Could not upload ${file.name} to S3`)
        }
      }
      notify(`${selected.length} ${selected.length === 1 ? 'file' : 'files'} uploaded`, 'success')
      await loadFiles()
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [loadFiles, notify])

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) upload(event.target.files)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    upload(event.dataTransfer.files)
  }

  const removeFile = async (key: string) => {
    const confirmed = window.confirm(`Delete “${key}”? This cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete file')
      setFiles((current) => current.filter((file) => file.key !== key))
      notify(`${key} deleted`, 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Delete failed', 'error')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <div>
            <strong>Bucketroom</strong>
            <small>S3 STORAGE TOOL</small>
          </div>
        </div>

        <div className="bucket-status" title={bucket}>
          <span className="status-dot" />
          <span>{bucket}</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="rail">
          <div className="rail-index">01 / INTERFACE</div>
          <p>Same storage.<br />Two ways in.</p>
          <div className="rail-spacer" />
          <div className="shortcut"><kbd>U</kbd><span>Upload</span></div>
          <div className="shortcut"><kbd>R</kbd><span>Refresh</span></div>
          <div className="shortcut"><kbd>/</kbd><span>Search</span></div>
        </aside>

        <div className="content">
          <section className="hero">
            <div>
              <p className="eyebrow">AWS S3 · WEB CLIENT</p>
              <h1>Storage without<br />living in the console.</h1>
            </div>
            <div className="summary-card">
              <span>IN THIS BUCKET</span>
              <strong>{files.length.toString().padStart(2, '0')}</strong>
              <p>{formatBytes(totalSize)} across {files.length === 1 ? '1 object' : `${files.length} objects`}</p>
            </div>
          </section>

          <section
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" multiple hidden onChange={handleInput} />
            <div className="drop-icon" aria-hidden="true">↗</div>
            <div>
              <strong>{uploading ? 'Sending…' : dragging ? 'Drop it here.' : 'Drop files anywhere in this box.'}</strong>
              <span>{uploading ? 'Hold on while the upload finishes.' : 'or click to choose · up to 100 MB each'}</span>
            </div>
            <button type="button" disabled={uploading} onClick={(event) => { event.stopPropagation(); inputRef.current?.click() }}>
              {uploading ? 'Uploading' : 'Choose files'}
            </button>
          </section>

          <section className="file-section">
            <div className="section-head">
              <div>
                <span className="section-number">02</span>
                <h2>Objects</h2>
              </div>
              <label className="search">
                <span>⌕</span>
                <input data-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files" aria-label="Search files" />
              </label>
            </div>

            <div className="table-head" aria-hidden="true">
              <span>NAME</span><span>SIZE</span><span>MODIFIED</span><span />
            </div>

            <div className="file-list">
              {loading ? (
                <div className="empty-state"><span className="spinner" /> Reading the bucket…</div>
              ) : visibleFiles.length === 0 ? (
                <div className="empty-state">
                  <strong>{query ? 'Nothing matched.' : 'The bucket is empty.'}</strong>
                  <span>{query ? 'Try a different search.' : 'Drop your first file above.'}</span>
                </div>
              ) : visibleFiles.map((file, index) => (
                <article className="file-row" key={file.key}>
                  <div className="file-name">
                    <span className="file-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="file-badge">{shortType(file)}</span>
                    <strong title={file.key}>{file.key}</strong>
                  </div>
                  <span className="file-size">{formatBytes(file.size)}</span>
                  <span className="file-date">{formatDate(file.lastModified)}</span>
                  <div className="file-actions">
                    <a href={`/api/download?key=${encodeURIComponent(file.key)}`}>Download</a>
                    <button type="button" onClick={() => removeFile(file.key)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <footer>
        <span>BUCKETROOM / {new Date().getFullYear()}</span>
        <span>{region || 'AWS'} · S3 · VERCEL</span>
      </footer>

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <div key={toast.id} className={`toast ${toast.tone}`}>{toast.message}</div>)}
      </div>
    </main>
  )
}

export default App
