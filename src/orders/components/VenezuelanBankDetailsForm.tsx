import { Form, Row, Col, InputGroup } from 'react-bootstrap';
import { VenezuelanBankDetails } from '../types/order';
import { VENEZUELAN_BANKS, ACCOUNT_TYPES } from '../../shared/constants/venezuelanBanks';
import {
  validateCedula,
  validateRif,
  validateVenezuelanPhone,
  validateAccountNumber,
  formatCedula,
  formatVenezuelanPhone,
  formatAccountNumber,
} from '../../shared/utils/venezuelanValidation';

interface Props {
  bankDetails: VenezuelanBankDetails;
  onChange: (details: VenezuelanBankDetails) => void;
  errors?: Partial<Record<keyof VenezuelanBankDetails, string>>;
}

export function VenezuelanBankDetailsForm({ bankDetails, onChange, errors = {} }: Props) {
  const handleChange = (field: keyof VenezuelanBankDetails, value: string) => {
    onChange({
      ...bankDetails,
      [field]: value,
    });
  };

  const handleBlur = (field: keyof VenezuelanBankDetails) => {
    // Auto-format on blur
    const value = bankDetails[field];
    if (!value || typeof value !== 'string') return;
    
    let formatted = value;
    
    switch (field) {
      case 'beneficiaryId':
        if (validateCedula(formatted) || validateRif(formatted)) {
          formatted = formatted.includes('J') || formatted.includes('V') || formatted.includes('G')
            ? formatted // Already has prefix, user might have entered RIF
            : formatCedula(formatted);
          onChange({ ...bankDetails, [field]: formatted });
        }
        break;
      case 'phone':
        if (validateVenezuelanPhone(formatted)) {
          formatted = formatVenezuelanPhone(formatted);
          onChange({ ...bankDetails, [field]: formatted });
        }
        break;
      case 'accountNumber':
        if (validateAccountNumber(formatted)) {
          formatted = formatAccountNumber(formatted);
          onChange({ ...bankDetails, [field]: formatted });
        }
        break;
    }
  };

  return (
    <div>
      <h5 className="mb-3">📋 Datos Bancarios en Venezuela</h5>
      <p className="text-muted small mb-3">
        Ingresa los datos de la cuenta donde recibirás los bolívares en Venezuela
      </p>

      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Nombre del Beneficiario <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Nombre completo"
              value={bankDetails.beneficiaryName}
              onChange={(e) => handleChange('beneficiaryName', e.target.value)}
              isInvalid={!!errors.beneficiaryName}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.beneficiaryName}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Debe coincidir con el titular de la cuenta
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Cédula o RIF <span className="text-danger">*</span>
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="V-12345678 o J-12345678-9"
                value={bankDetails.beneficiaryId}
                onChange={(e) => handleChange('beneficiaryId', e.target.value)}
                onBlur={() => handleBlur('beneficiaryId')}
                isInvalid={!!errors.beneficiaryId}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.beneficiaryId}
              </Form.Control.Feedback>
            </InputGroup>
            <Form.Text className="text-muted">
              Formato: V-12345678 o J-12345678-9
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Banco <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={bankDetails.bank}
              onChange={(e) => handleChange('bank', e.target.value)}
              isInvalid={!!errors.bank}
              required
            >
              <option value="">Selecciona un banco...</option>
              {VENEZUELAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.bank}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Tipo de Cuenta <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={bankDetails.accountType}
              onChange={(e) => handleChange('accountType', e.target.value as 'corriente' | 'ahorro')}
              isInvalid={!!errors.accountType}
              required
            >
              <option value="">Selecciona tipo...</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.accountType}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={12}>
          <Form.Group>
            <Form.Label>
              Número de Cuenta <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="0102-0123-45-6789012345 (20 dígitos)"
              value={bankDetails.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              onBlur={() => handleBlur('accountNumber')}
              isInvalid={!!errors.accountNumber}
              maxLength={24} // 20 digits + 4 hyphens
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.accountNumber}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              20 dígitos. Formato: 0102-0123-45-6789012345
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>
              Teléfono en Venezuela <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="tel"
              placeholder="0424-123-4567"
              value={bankDetails.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              isInvalid={!!errors.phone}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.phone}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Celular venezolano (04XX-XXX-XXXX)
            </Form.Text>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Email (Opcional)</Form.Label>
            <Form.Control
              type="email"
              placeholder="correo@ejemplo.com"
              value={bankDetails.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
            <Form.Text className="text-muted">
              Para confirmación de transferencia
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
}
