import { useState, useEffect } from 'react'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { rateService } from '../../rates/services/rateService'
import { orderService } from '../services/orderService'
import { Rate } from '../../rates/types/rate'
import { VenezuelanBankDetails } from '../types/order'
import { VenezuelanBankDetailsForm, CustomerReceiptUploader } from '../components'
import { AdminBankDetailsCard } from '../../shared/components/AdminBankDetailsCard'
import {
  validateCedula,
  validateRif,
  validateVenezuelanPhone,
  validateAccountNumber,
} from '../../shared/utils/venezuelanValidation'

export function NewOrderPage() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  
  const [currentRate, setCurrentRate] = useState<Rate | null>(null)
  const [amountClp, setAmountClp] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bankDetails, setBankDetails] = useState<VenezuelanBankDetails>({
    beneficiaryName: '',
    beneficiaryId: '',
    bank: '',
    accountType: 'ahorro',
    accountNumber: '',
    phone: '',
    email: '',
  })
  const [bankDetailsErrors, setBankDetailsErrors] = useState<Partial<Record<keyof VenezuelanBankDetails, string>>>({})
  const [clpReceiptUrl, setClpReceiptUrl] = useState('')

  useEffect(() => {
    loadRate()
  }, [])

  const loadRate = async () => {
    try {
      const rate = await rateService.getCurrentRate()
      if (!rate) {
        setError('No hay tasa de cambio configurada. Contacta con el administrador.')
      }
      setCurrentRate(rate)
    } catch (error) {
      setError('Error al cargar la tasa de cambio')
    } finally {
      setLoading(false)
    }
  }

  const calculateVesAmount = (): number => {
    const clp = parseFloat(amountClp)
    if (isNaN(clp) || !currentRate) return 0
    return clp * currentRate.clpToVes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !userProfile) {
      setError('No hay sesión activa')
      return
    }

    if (!currentRate) {
      setError('No hay tasa de cambio disponible')
      return
    }

    const clp = parseFloat(amountClp)
    
    if (isNaN(clp) || clp <= 0) {
      setError('El monto debe ser un número positivo')
      return
    }

    if (clp < 1000) {
      setError('El monto mínimo es 1,000 CLP')
      return
    }

    // Validate Venezuelan bank details
    const errors: Partial<Record<keyof VenezuelanBankDetails, string>> = {}
    
    if (!bankDetails.beneficiaryName.trim()) {
      errors.beneficiaryName = 'El nombre del beneficiario es requerido'
    }
    
    if (!bankDetails.beneficiaryId.trim()) {
      errors.beneficiaryId = 'La cédula o RIF es requerida'
    } else if (!validateCedula(bankDetails.beneficiaryId) && !validateRif(bankDetails.beneficiaryId)) {
      errors.beneficiaryId = 'Formato inválido. Usa V-12345678 o J-12345678-9'
    }
    
    if (!bankDetails.bank) {
      errors.bank = 'Selecciona un banco'
    }
    
    if (!bankDetails.accountNumber.trim()) {
      errors.accountNumber = 'El número de cuenta es requerido'
    } else if (!validateAccountNumber(bankDetails.accountNumber)) {
      errors.accountNumber = 'Debe tener 20 dígitos'
    }
    
    if (!bankDetails.phone.trim()) {
      errors.phone = 'El teléfono es requerido'
    } else if (!validateVenezuelanPhone(bankDetails.phone)) {
      errors.phone = 'Formato inválido. Usa 0424-123-4567'
    }
    
    if (Object.keys(errors).length > 0) {
      setBankDetailsErrors(errors)
      setError('Por favor completa todos los datos bancarios correctamente')
      return
    }
    
    setBankDetailsErrors({})

    try {
      setError('')
      setSubmitting(true)
      
      await orderService.createOrder(
        user.uid,
        userProfile.fullName,
        userProfile.email,
        { 
          amountClp: clp,
          vesBankDetails: bankDetails,
          clpReceiptUrl: clpReceiptUrl || undefined,
        }
      )
      
      navigate('/app/orders', { 
        state: { message: 'Pedido creado exitosamente' } 
      })
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para crear pedidos')
      } else {
        setError('Error al crear el pedido. Intenta nuevamente.')
      }
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  const vesAmount = calculateVesAmount()

  return (
    <div>
      <h2 className="mb-4">Nuevo Pedido de Remesa</h2>
      
      <Row>
        <Col md={8} lg={6} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              
              {currentRate && (
                <Alert variant="info" className="mb-4">
                  <strong>Tasa actual:</strong> 1 CLP = {currentRate.clpToVes.toFixed(4)} VES
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Monto en Pesos Chilenos (CLP)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Ej: 50000"
                    value={amountClp}
                    onChange={(e) => setAmountClp(e.target.value)}
                    required
                    disabled={submitting || !currentRate}
                    min="1000"
                    step="1000"
                  />
                  <Form.Text className="text-muted">
                    Monto mínimo: 1,000 CLP
                  </Form.Text>
                </Form.Group>

                {amountClp && !isNaN(parseFloat(amountClp)) && currentRate && (
                  <div className="mb-4 p-4 bg-light rounded">
                    <h5 className="mb-3">Resumen de la operación</h5>
                    <Row>
                      <Col xs={6}>
                        <p className="mb-2 text-muted">Envías:</p>
                        <h4 className="mb-0 text-primary">
                          {parseFloat(amountClp).toLocaleString('es-CL')} CLP
                        </h4>
                      </Col>
                      <Col xs={6}>
                        <p className="mb-2 text-muted">Recibes (aprox):</p>
                        <h4 className="mb-0 text-success">
                          {vesAmount.toLocaleString('es-VE', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })} VES
                        </h4>
                      </Col>
                    </Row>
                    <hr className="my-3" />
                    <small className="text-muted">
                      <strong>Tasa aplicada:</strong> {currentRate.clpToVes.toFixed(4)} VES por CLP
                    </small>
                  </div>
                )}

                <hr className="my-4" />

                <VenezuelanBankDetailsForm
                  bankDetails={bankDetails}
                  onChange={setBankDetails}
                  errors={bankDetailsErrors}
                />

                <hr className="my-4" />

                <div className="mb-4">
                  <h5 className="mb-3">💳 Paso 2: Transferir CLP</h5>
                  <AdminBankDetailsCard showCopyAll={true} />
                </div>

                <hr className="my-4" />

                <div className="mb-4">
                  <h5 className="mb-3">📸 Paso 3: Subir Comprobante</h5>
                  <CustomerReceiptUploader
                    onUploadSuccess={setClpReceiptUrl}
                    currentReceiptUrl={clpReceiptUrl}
                  />
                  <Alert variant="info" className="mt-3">
                    <small>
                      <strong>💡 Tip:</strong> Puedes crear el pedido sin comprobante y subirlo después, 
                      pero recomendamos hacerlo ahora para agilizar el proceso.
                    </small>
                  </Alert>
                </div>

                <Alert variant="warning" className="mb-4">
                  <small>
                    <strong>Importante:</strong> La tasa de cambio queda fijada al momento de crear el pedido.
                  </small>
                </Alert>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    disabled={submitting || !currentRate || !amountClp}
                  >
                    {submitting ? 'Creando pedido...' : 'Crear Pedido'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/app')}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
