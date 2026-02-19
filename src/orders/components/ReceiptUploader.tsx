import { useState, useRef } from 'react'
import { Button, Alert, ProgressBar, Image } from 'react-bootstrap'
import { storageService } from '../../shared/services/storageService'
import { orderService } from '../services/orderService'

interface ReceiptUploaderProps {
  orderId: string
  userId: string
  currentReceiptUrl?: string
  onUploadSuccess: (url: string) => void
}

export function ReceiptUploader({ 
  orderId, 
  userId, 
  currentReceiptUrl,
  onUploadSuccess 
}: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(currentReceiptUrl || null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setError('')
    setSuccess('')

    // Validate file
    const validation = storageService.validateReceiptFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido')
      return
    }

    setFile(selectedFile)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    try {
      setUploading(true)
      setProgress(20)
      setError('')
      setSuccess('')

      // Upload to Storage
      const result = await storageService.uploadClpReceipt(userId, orderId, file)
      setProgress(60)

      // Update order in Firestore
      await orderService.updateOrderWithClpReceipt(orderId, result.url)
      setProgress(100)

      setSuccess('¡Comprobante subido exitosamente!')
      setPreview(result.url)
      onUploadSuccess(result.url)

      // Reset file input
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        setProgress(0)
      }, 2000)
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.code === 'storage/unauthorized') {
        setError('No tienes permisos para subir archivos')
      } else if (error.code === 'permission-denied') {
        setError('No tienes permisos para actualizar este pedido')
      } else {
        setError('Error al subir el comprobante. Intenta nuevamente.')
      }
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {preview && (
        <div className="mb-3">
          <label className="text-muted small d-block mb-2">Vista Previa:</label>
          <Image 
            src={preview} 
            alt="Vista previa" 
            fluid 
            rounded 
            className="mb-2"
            style={{ 
              maxHeight: '200px', 
              objectFit: 'contain', 
              width: '100%', 
              background: '#f8f9fa' 
            }}
          />
        </div>
      )}

      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          className="form-control"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <small className="text-muted">
          Formatos: JPG, PNG, PDF • Tamaño máximo: 10MB
        </small>
      </div>

      {uploading && (
        <ProgressBar 
          now={progress} 
          label={`${progress}%`} 
          animated 
          className="mb-3"
        />
      )}

      <div className="d-grid gap-2">
        <Button 
          variant="primary" 
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Subiendo...' : 'Subir Comprobante'}
        </Button>
        
        {currentReceiptUrl && (
          <Button 
            variant="outline-secondary" 
            href={currentReceiptUrl} 
            target="_blank"
            size="sm"
          >
            Ver Comprobante Actual
          </Button>
        )}
      </div>

      <Alert variant="info" className="mt-3 mb-0">
        <small>
          <strong>Importante:</strong> Sube una foto clara de tu comprobante de transferencia CLP.
          Una vez subido, el equipo administrativo procesará tu pedido.
        </small>
      </Alert>
    </div>
  )
}
