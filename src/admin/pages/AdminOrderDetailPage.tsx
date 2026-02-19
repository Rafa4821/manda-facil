import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Row, Col, Alert, Image } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'
import { orderService } from '../../orders/services/orderService'
import { Order } from '../../orders/types/order'
import { StatusChanger, AdminReceiptUploader, BankDetailsDisplay } from '../components'
import { OrderTimeline } from '../../orders/components'

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'warning', text: 'Pendiente' },
    processing: { bg: 'info', text: 'Procesando' },
    completed: { bg: 'success', text: 'Completado' },
    cancelled: { bg: 'danger', text: 'Cancelado' },
  }
  
  const statusInfo = statusMap[status] || { bg: 'secondary', text: status }
  
  return (
    <Badge bg={statusInfo.bg} className="fs-6">
      {statusInfo.text}
    </Badge>
  )
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return
    
    try {
      setLoading(true)
      const orderData = await orderService.getOrderById(orderId)
      
      if (!orderData) {
        setError('Pedido no encontrado')
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

  const handleMarkTransferred = async (reference: string) => {
    if (!orderId) return
    
    try {
      await orderService.markVesTransferred(orderId, reference)
      await loadOrder() // Reload order to show updated data
    } catch (error) {
      console.error('Error marking as transferred:', error)
      throw error
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

  if (error || !order) {
    return (
      <div>
        <Alert variant="danger">{error || 'Pedido no encontrado'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/admin/orders')}>
          Volver a Pedidos
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalle del Pedido (Admin)</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/admin/orders')}>
          ← Volver a Pedidos
        </Button>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pedido #{order.orderNumber}</h5>
                {getStatusBadge(order.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted">Información del Cliente</h6>
                  <p className="mb-1"><strong>ID:</strong> {order.customerId}</p>
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
                      <small className="text-muted">Monto CLP</small>
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
                      <small className="text-muted">Monto VES</small>
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
            </Card.Body>
          </Card>

          {user && userProfile && (
            <div className="mb-4">
              <StatusChanger
                orderId={order.id}
                currentStatus={order.status}
                adminId={user.uid}
                adminName={userProfile.fullName}
                onStatusChanged={loadOrder}
              />
            </div>
          )}

          <OrderTimeline orderId={order.id} />
        </Col>

        <Col lg={4}>
          <div className="mb-4">
            <BankDetailsDisplay
              bankDetails={order.vesBankDetails}
              transferReference={order.vesTransferReference}
              transferredAt={order.vesTransferredAt}
              onMarkTransferred={handleMarkTransferred}
              showTransferControls={true}
            />
          </div>

          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Comprobante CLP (Cliente)</h6>
            </Card.Header>
            <Card.Body>
              {order.clpReceiptUrl ? (
                <div>
                  <Badge bg="success" className="mb-3">✓ Comprobante Subido</Badge>
                  <div className="mb-3">
                    <Image 
                      src={order.clpReceiptUrl} 
                      alt="Comprobante CLP" 
                      fluid 
                      rounded 
                      className="mb-2"
                      style={{ maxHeight: '300px', objectFit: 'contain', width: '100%', background: '#f8f9fa' }}
                    />
                  </div>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      href={order.clpReceiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Ver Tamaño Completo
                    </Button>
                    <Button variant="outline-secondary" onClick={() => window.open(order.clpReceiptUrl, '_blank')}>
                      Descargar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge bg="secondary" className="mb-2">Pendiente</Badge>
                  <p className="text-muted small mb-0">
                    El cliente aún no ha subido el comprobante de pago CLP
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Comprobante VES (Admin)</h6>
            </Card.Header>
            <Card.Body>
              {order.vesReceiptUrl ? (
                <div className="mb-3">
                  <Badge bg="success" className="mb-2">✓ Subido</Badge>
                  <div className="mt-3">
                    <Image 
                      src={order.vesReceiptUrl} 
                      alt="Comprobante VES" 
                      fluid 
                      rounded 
                      className="mb-2"
                      style={{ maxHeight: '300px', objectFit: 'contain', width: '100%', background: '#f8f9fa' }}
                    />
                  </div>
                  <Button 
                    variant="success" 
                    href={order.vesReceiptUrl} 
                    target="_blank" 
                    className="w-100 mt-2"
                  >
                    Ver Tamaño Completo
                  </Button>
                </div>
              ) : (
                <div>
                  <Badge bg="secondary" className="mb-3">Pendiente</Badge>
                </div>
              )}
              
              {(order.status === 'processing' || order.status === 'paid_out') && (
                <div className="mt-3">
                  <AdminReceiptUploader
                    orderId={order.id}
                    currentReceiptUrl={order.vesReceiptUrl}
                    onUploadSuccess={(_url) => loadOrder()}
                    onStatusChange={() => {
                      // Scroll to status changer
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
