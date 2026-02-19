import { useState, useRef } from 'react';
import { Form, Button, Alert, Image, Spinner } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../app/firebase/firebase';

interface Props {
  onUploadSuccess: (url: string) => void;
  currentReceiptUrl?: string;
}

export function CustomerReceiptUploader({ onUploadSuccess, currentReceiptUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentReceiptUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar 5MB');
      return;
    }

    try {
      setError('');
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `receipts/clp_${timestamp}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      onUploadSuccess(url);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError('Error al subir el comprobante. Intenta nuevamente.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>
          <strong>Comprobante de Transferencia CLP</strong>
        </Form.Label>
        
        {preview ? (
          <div>
            <div className="mb-3 position-relative">
              <Image 
                src={preview} 
                alt="Comprobante" 
                fluid 
                rounded 
                style={{ 
                  maxHeight: '200px', 
                  objectFit: 'contain', 
                  width: '100%', 
                  background: '#f8f9fa' 
                }}
              />
              <Button
                variant="danger"
                size="sm"
                className="position-absolute top-0 end-0 m-2"
                onClick={handleRemove}
                disabled={uploading}
              >
                ✕ Quitar
              </Button>
            </div>
            <Alert variant="success" className="mb-0">
              <small>✓ Comprobante cargado</small>
            </Alert>
          </div>
        ) : (
          <>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Form.Text className="text-muted">
              Formatos: JPG, PNG. Máximo 5MB.
            </Form.Text>
          </>
        )}

        {error && (
          <Alert variant="danger" className="mt-2 mb-0">
            {error}
          </Alert>
        )}

        {uploading && (
          <div className="text-center mt-3">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Subiendo comprobante...</span>
          </div>
        )}
      </Form.Group>
    </div>
  );
}
