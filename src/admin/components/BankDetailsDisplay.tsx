import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import { VenezuelanBankDetails } from '../../orders/types/order';

interface Props {
  bankDetails: VenezuelanBankDetails;
  transferReference?: string;
  transferredAt?: Date;
  onMarkTransferred?: (reference: string) => Promise<void>;
  showTransferControls?: boolean;
}

export function BankDetailsDisplay({ 
  bankDetails, 
  transferReference, 
  transferredAt,
  onMarkTransferred,
  showTransferControls = false,
}: Props) {
  const [reference, setReference] = useState(transferReference || '');
  const [submitting, setSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

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

  const handleSubmitReference = async () => {
    if (!reference.trim() || !onMarkTransferred) return;

    try {
      setSubmitting(true);
      await onMarkTransferred(reference);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
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
              <h6 className="mb-3">Marcar como Transferido</h6>
              <Form.Group className="mb-3">
                <Form.Label>Número de Referencia</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Ej: 123456789"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={submitting}
                  />
                  <Button 
                    variant="success"
                    onClick={handleSubmitReference}
                    disabled={!reference.trim() || submitting}
                  >
                    {submitting ? 'Guardando...' : '✓ Marcar'}
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Ingresa el número de referencia de la transferencia VES
                </Form.Text>
              </Form.Group>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
