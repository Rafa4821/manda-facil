import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Row, Col, Alert } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'
import { orderService } from '../services/orderService'
import { Order } from '../types/order'
import { ReceiptUploader, OrderTimeline } from '../components'

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    created: { bg: 'secondary', text: 'Creado' },
    clp_receipt_uploaded: { bg: 'info', text: 'Comprobante CLP Subido' },
    clp_verified: { bg: 'primary', text: 'CLP Verificado' },
    processing: { bg: 'warning', text: 'Procesando' },
    paid_out: { bg: 'success', text: 'VES Pagado' },
    completed: { bg: 'success', text: 'Completado' },
    rejected: { bg: 'danger', text: 'Rechazado' },
    cancelled: { bg: 'dark', text: 'Cancelado' },
  }
  
  const statusInfo = statusMap[status] || { bg: 'secondary', text: status }
  
  return (
    <Badge bg={statusInfo.bg} className="fs-6">
      {statusInfo.text}
    </Badge>
  )
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId && user) {
      loadOrder()
    }
  }, [orderId, user])

  const loadOrder = async () => {
    if (!orderId) return
    
    try {
      setLoading(true)
      const orderData = await orderService.getOrderById(orderId)
      
      if (!orderData) {
        setError('Pedido no encontrado')
      } else if (orderData.customerId !== user?.uid) {
        setError('No tienes permisos para ver este pedido')
      } else {
        setOrder(orderData)
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para ver este pedido')
      } else {
        setError('Error al cargar el pedido')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = (_url: string) => {
    // Reload order to show updated receipt
    loadOrder()
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

  if (error || !order) {
    return (
      <div>
        <Alert variant="danger">{error || 'Pedido no encontrado'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/app/orders')}>
          Volver a Mis Pedidos
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalle del Pedido</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/app/orders')}>
          ← Volver
        </Button>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pedido #{order.orderNumber}</h5>
                {getStatusBadge(order.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted">Información del Cliente</h6>
                  <p className="mb-1"><strong>Nombre:</strong> {order.customerName}</p>
                  <p className="mb-1"><strong>Email:</strong> {order.customerEmail}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted">Fechas</h6>
                  <p className="mb-1">
                    <strong>Creado:</strong>{' '}
                    {new Date(order.createdAt).toLocaleString('es-CL')}
                  </p>
                  <p className="mb-1">
                    <strong>Actualizado:</strong>{' '}
                    {new Date(order.updatedAt).toLocaleString('es-CL')}
                  </p>
                  {order.completedAt && (
                    <p className="mb-1">
                      <strong>Completado:</strong>{' '}
                      {new Date(order.completedAt).toLocaleString('es-CL')}
                    </p>
                  )}
                </Col>
              </Row>

              <hr />

              <h6 className="text-muted mb-3">Detalles de la Transacción</h6>
              <Row>
                <Col md={4}>
                  <Card className="bg-light mb-3">
                    <Card.Body>
                      <small className="text-muted">Monto a Enviar</small>
                      <h4 className="mb-0 text-primary">
                        {order.amountClp.toLocaleString('es-CL')} CLP
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light mb-3">
                    <Card.Body>
                      <small className="text-muted">Tasa de Cambio</small>
                      <h4 className="mb-0 text-info">
                        {order.rateSnapshot.toFixed(4)}
                      </h4>
                      <small className="text-muted">VES por CLP</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light mb-3">
                    <Card.Body>
                      <small className="text-muted">Monto a Recibir</small>
                      <h4 className="mb-0 text-success">
                        {order.amountVesExpected.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} VES
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Alert variant="info" className="mt-3">
                <small>
                  <strong>Nota:</strong> La tasa de cambio quedó fijada al momento de crear el pedido
                  y no se verá afectada por cambios posteriores en la tasa.
                </small>
              </Alert>
            </Card.Body>
          </Card>

          {(order.status === 'created' || order.status === 'clp_receipt_uploaded') && (
            <Card className="shadow-sm mb-4 border-warning">
              <Card.Body>
                <h6 className="text-warning">⏳ Próximos Pasos</h6>
                <p className="mb-2">
                  1. Realiza la transferencia de <strong>{order.amountClp.toLocaleString('es-CL')} CLP</strong> a la cuenta indicada
                </p>
                <p className="mb-2">
                  2. Sube el comprobante de pago
                </p>
                <p className="mb-0">
                  3. Espera la confirmación del administrador
                </p>
              </Card.Body>
            </Card>
          )}

          {(order.status === 'clp_verified' || order.status === 'processing' || order.status === 'paid_out') && (
            <Alert variant="info">
              <strong>⚙️ En Proceso:</strong> Tu pedido está siendo procesado. 
              Te notificaremos cuando esté completado.
            </Alert>
          )}

          {order.status === 'completed' && (
            <Alert variant="success">
              <strong>✅ Completado:</strong> Tu pedido ha sido completado exitosamente.
            </Alert>
          )}

          <OrderTimeline orderId={order.id} />
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Comprobantes</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="text-muted small mb-2 d-block">Comprobante CLP (Cliente)</label>
                {order.clpReceiptUrl ? (
                  <div>
                    <Badge bg="success" className="mb-2">✓ Subido</Badge>
                  </div>
                ) : (
                  <Badge bg="secondary" className="mb-2">Pendiente</Badge>
                )}
                
                {(order.status === 'created' || order.status === 'clp_receipt_uploaded') && user && (
                  <div className="mt-3">
                    <ReceiptUploader
                      orderId={order.id}
                      userId={user.uid}
                      currentReceiptUrl={order.clpReceiptUrl}
                      onUploadSuccess={handleUploadSuccess}
                    />
                  </div>
                )}
                
                {order.status !== 'created' && order.status !== 'clp_receipt_uploaded' && order.clpReceiptUrl && (
                  <div className="mt-2">
                    <a 
                      href={order.clpReceiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-outline-primary w-100"
                    >
                      Ver Comprobante
                    </a>
                  </div>
                )}
              </div>

              <hr />

              <div>
                <label className="text-muted small mb-2 d-block">Comprobante VES (Admin)</label>
                {order.vesReceiptUrl ? (
                  <div>
                    <Badge bg="success" className="mb-3">✓ Disponible</Badge>
                    <div className="mb-3">
                      <img 
                        src={order.vesReceiptUrl} 
                        alt="Comprobante VES" 
                        className="img-fluid rounded mb-2"
                        style={{ 
                          maxHeight: '200px', 
                          objectFit: 'contain', 
                          width: '100%', 
                          background: '#f8f9fa' 
                        }}
                      />
                    </div>
                    <a 
                      href={order.vesReceiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-outline-success w-100"
                    >
                      Ver Tamaño Completo
                    </a>
                  </div>
                ) : (
                  <div>
                    <Badge bg="secondary" className="mb-2">Pendiente</Badge>
                    <p className="small text-muted mt-2 mb-0">
                      El comprobante VES estará disponible cuando el admin procese tu pedido
                    </p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {(order.status === 'created' || order.status === 'clp_receipt_uploaded') && (
            <Card className="shadow-sm mt-3 bg-light">
              <Card.Body>
                <h6 className="mb-3">Información de Pago</h6>
                <p className="small mb-1"><strong>Banco:</strong> Banco Estado</p>
                <p className="small mb-1"><strong>Cuenta:</strong> 1234567890</p>
                <p className="small mb-1"><strong>RUT:</strong> 12.345.678-9</p>
                <p className="small mb-0"><strong>Nombre:</strong> Mandafácil SpA</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
