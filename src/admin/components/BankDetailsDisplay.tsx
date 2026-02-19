import { useState, useRef } from 'react';
import { Card, Row, Col, Button, Badge, Form, Alert, Image, ProgressBar } from 'react-bootstrap';
import { VenezuelanBankDetails } from '../../orders/types/order';
import { storageService } from '../../shared/services/storageService';

interface Props {
  bankDetails: VenezuelanBankDetails;
  transferReference?: string;
  transferredAt?: Date;
  vesReceiptUrl?: string;
  orderId: string;
  onMarkTransferred?: (reference: string, receiptUrl: string) => Promise<void>;
  showTransferControls?: boolean;
}

export function BankDetailsDisplay({ 
  bankDetails, 
  transferReference, 
  transferredAt,
  vesReceiptUrl,
  orderId,
  onMarkTransferred,
  showTransferControls = false,
}: Props) {
  const [reference, setReference] = useState(transferReference || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(vesReceiptUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyAllDetails = async () => {
    const allDetails = `
DATOS BANCARIOS PARA TRANSFERENCIA VES

Beneficiario: ${bankDetails.beneficiaryName}
Cédula/RIF: ${bankDetails.beneficiaryId}
Banco: ${bankDetails.bank}
Tipo de Cuenta: ${bankDetails.accountType === 'ahorro' ? 'Ahorro' : 'Corriente'}
Número de Cuenta: ${bankDetails.accountNumber}
Teléfono: ${bankDetails.phone}
${bankDetails.email ? `Email: ${bankDetails.email}` : ''}
    `.trim();

    await copyToClipboard(allDetails, 'todos');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError('');

    const validation = storageService.validateReceiptFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!reference.trim()) {
      setError('Debes ingresar el número de referencia');
      return;
    }

    if (!file && !vesReceiptUrl) {
      setError('Debes subir el comprobante de transferencia VES');
      return;
    }

    if (!onMarkTransferred) return;

    try {
      setSubmitting(true);
      setError('');
      
      let receiptUrl = vesReceiptUrl || '';

      // Upload receipt if new file selected
      if (file) {
        setUploading(true);
        setUploadProgress(30);
        const result = await storageService.uploadVesReceipt(orderId, file);
        receiptUrl = result.url;
        setUploadProgress(100);
      }

      // Mark as transferred with reference and receipt
      await onMarkTransferred(reference, receiptUrl);
      
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error al procesar la transferencia. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <strong>💰 Datos Bancarios VES</strong>
          {transferredAt && (
            <Badge bg="success" className="ms-2">
              ✓ Transferido
            </Badge>
          )}
        </div>
        <Button 
          size="sm" 
          variant="light"
          onClick={copyAllDetails}
        >
          {copySuccess === 'todos' ? '✓ Copiado' : '📋 Copiar Todo'}
        </Button>
      </Card.Header>
      <Card.Body>
        {transferredAt && transferReference && (
          <Alert variant="success" className="mb-3">
            <strong>✓ Transferencia Realizada</strong>
            <div className="mt-2">
              <small>
                <strong>Referencia:</strong> {transferReference}<br />
                <strong>Fecha:</strong> {new Date(transferredAt).toLocaleString('es-CL')}
              </small>
            </div>
          </Alert>
        )}

        <Row className="g-3">
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Beneficiario</small>
                <strong>{bankDetails.beneficiaryName}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(bankDetails.beneficiaryName, 'beneficiario')}
              >
                {copySuccess === 'beneficiario' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Cédula/RIF</small>
                <strong>{bankDetails.beneficiaryId}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(bankDetails.beneficiaryId, 'cedula')}
              >
                {copySuccess === 'cedula' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={12}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Banco</small>
                <strong>{bankDetails.bank}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(bankDetails.bank, 'banco')}
              >
                {copySuccess === 'banco' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <small className="text-muted d-block">Tipo de Cuenta</small>
            <strong>{bankDetails.accountType === 'ahorro' ? 'Ahorro' : 'Corriente'}</strong>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Número de Cuenta</small>
                <strong className="font-monospace">{bankDetails.accountNumber}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(bankDetails.accountNumber, 'cuenta')}
              >
                {copySuccess === 'cuenta' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Teléfono</small>
                <strong>{bankDetails.phone}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(bankDetails.phone, 'telefono')}
              >
                {copySuccess === 'telefono' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          {bankDetails.email && (
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <small className="text-muted d-block">Email</small>
                  <strong>{bankDetails.email}</strong>
                </div>
                <Button 
                  size="sm" 
                  variant="outline-secondary"
                  onClick={() => copyToClipboard(bankDetails.email!, 'email')}
                >
                  {copySuccess === 'email' ? '✓' : '📋'}
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {showTransferControls && !transferredAt && (
          <>
            <hr className="my-4" />
            <div>
              <h6 className="mb-3">📤 Marcar como Transferido</h6>
              
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-3">
                  {error}
                </Alert>
              )}

              {/* Receipt Upload */}
              <Form.Group className="mb-3">
                <Form.Label>Comprobante de Transferencia VES *</Form.Label>
                {preview && (
                  <div className="mb-2">
                    <Image 
                      src={preview} 
                      alt="Comprobante" 
                      fluid 
                      rounded 
                      style={{ maxHeight: '150px', objectFit: 'contain', width: '100%', background: '#f8f9fa' }}
                    />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  disabled={submitting || uploading}
                />
                <Form.Text className="text-muted">
                  JPG, PNG o PDF • Máximo 10MB
                </Form.Text>
              </Form.Group>

              {/* Reference Number */}
              <Form.Group className="mb-3">
                <Form.Label>Número de Referencia *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: 123456789"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={submitting || uploading}
                />
                <Form.Text className="text-muted">
                  Número de referencia de la transferencia bancaria
                </Form.Text>
              </Form.Group>

              {uploading && (
                <ProgressBar 
                  now={uploadProgress} 
                  label={`${uploadProgress}%`} 
                  animated 
                  className="mb-3"
                />
              )}

              <div className="d-grid">
                <Button 
                  variant="success"
                  size="lg"
                  onClick={handleSubmitTransfer}
                  disabled={submitting || uploading || !reference.trim() || (!file && !vesReceiptUrl)}
                >
                  {submitting ? 'Procesando...' : uploading ? 'Subiendo...' : '✓ Confirmar Transferencia'}
                </Button>
              </div>

              <Alert variant="info" className="mt-3 mb-0">
                <small>
                  <strong>📧 Notificación automática:</strong> El cliente recibirá un email cuando confirmes la transferencia.
                </small>
              </Alert>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
