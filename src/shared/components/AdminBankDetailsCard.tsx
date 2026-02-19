import { useState } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { ADMIN_BANK_ACCOUNT, formatAdminBankDetailsForCopy } from '../constants/adminBankAccount';

interface Props {
  showCopyAll?: boolean;
}

export function AdminBankDetailsCard({ showCopyAll = true }: Props) {
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
    const allDetails = formatAdminBankDetailsForCopy();
    await copyToClipboard(allDetails, 'todos');
  };

  return (
    <Card className="border-primary shadow-sm">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <strong>💳 Datos para Transferencia CLP</strong>
        </div>
        {showCopyAll && (
          <Button 
            size="sm" 
            variant="light"
            onClick={copyAllDetails}
          >
            {copySuccess === 'todos' ? '✓ Copiado' : '📋 Copiar Todo'}
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          <small>Transfiere a esta cuenta y luego sube tu comprobante abajo:</small>
        </p>

        <Row className="g-3">
          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Banco</small>
                <strong>{ADMIN_BANK_ACCOUNT.bankName}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.bankName, 'banco')}
              >
                {copySuccess === 'banco' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Tipo de Cuenta</small>
                <strong>{ADMIN_BANK_ACCOUNT.accountType}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.accountType, 'tipo')}
              >
                {copySuccess === 'tipo' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Número de Cuenta</small>
                <strong className="font-monospace">{ADMIN_BANK_ACCOUNT.accountNumber}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.accountNumber, 'cuenta')}
              >
                {copySuccess === 'cuenta' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">RUT Titular</small>
                <strong>{ADMIN_BANK_ACCOUNT.rut}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.rut, 'rut')}
              >
                {copySuccess === 'rut' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={12}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Titular</small>
                <strong>{ADMIN_BANK_ACCOUNT.ownerName}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.ownerName, 'titular')}
              >
                {copySuccess === 'titular' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>

          <Col md={12}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted d-block">Email</small>
                <strong>{ADMIN_BANK_ACCOUNT.email}</strong>
              </div>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => copyToClipboard(ADMIN_BANK_ACCOUNT.email, 'email')}
              >
                {copySuccess === 'email' ? '✓' : '📋'}
              </Button>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
