import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Row, Col, Alert, Image, ButtonGroup, Dropdown } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'
import { orderService } from '../../orders/services/orderService'
import { Order } from '../../orders/types/order'
import { StatusChanger, AdminReceiptUploader, BankDetailsDisplay } from '../components'
import { OrderTimeline } from '../../orders/components'
import '../styles/admin-order-detail.css'

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

  const handleMarkTransferred = async (reference: string, receiptUrl: string) => {
    if (!orderId) return
    
    try {
      await orderService.markVesTransferred(orderId, reference, receiptUrl)
      await loadOrder()
    } catch (error) {
      console.error('Error marking as transferred:', error)
      throw error
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderId) return
    
    const confirmed = window.confirm(
      '¿Estás seguro de eliminar este pedido?\n\nEsta acción eliminará:\n- El pedido de Firestore\n- Todos los comprobantes de Storage\n- El historial de eventos\n\n⚠️ Esta acción no se puede deshacer.'
    )
    if (!confirmed) return

    try {
      await orderService.deleteOrder(orderId)
      alert('✅ Pedido eliminado correctamente')
      navigate('/admin/orders')
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('Error al eliminar el pedido')
    }
  }

  const needsVesReceipt = () => {
    return (order?.status === 'processing' || order?.status === 'paid_out') && !order?.vesReceiptUrl
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
      {/* Header with actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-1">Detalle del Pedido</h2>
          <small className="text-muted">#{order.orderNumber}</small>
        </div>
        <ButtonGroup className="w-100 w-md-auto">
          <Button variant="outline-secondary" onClick={() => navigate('/admin/orders')}>
            ← Volver
          </Button>
          <Dropdown as={ButtonGroup}>
            <Dropdown.Toggle variant="outline-danger" id="dropdown-actions">
              Acciones
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => window.print()}>🖨️ Imprimir</Dropdown.Item>
              <Dropdown.Item onClick={() => navigator.clipboard.writeText(order.orderNumber)}>📋 Copiar #Pedido</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleDeleteOrder} className="text-danger">🗑️ Eliminar Pedido</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </ButtonGroup>
      </div>

      {/* Alert for VES receipt needed */}
      {needsVesReceipt() && (
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div className="flex-grow-1">
              <strong>Acción Requerida:</strong> Debes subir el comprobante de transferencia VES para completar este pedido.
            </div>
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {/* Main content - Order info */}
        <Col lg={8} className="order-2 order-lg-1">
          {/* Order Summary Card */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-dark text-white">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <h5 className="mb-0">Información del Pedido</h5>
                {getStatusBadge(order.status)}
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4 g-3">
                <Col xs={12} md={6}>
                  <h6 className="text-muted mb-3">👤 Cliente</h6>
                  <div className="mb-2">
                    <small className="text-muted d-block">Nombre</small>
                    <strong>{order.customerName}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Email</small>
                    <strong className="text-break">{order.customerEmail}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">ID Cliente</small>
                    <code className="small">{order.customerId.substring(0, 8)}...</code>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <h6 className="text-muted mb-3">📅 Fechas</h6>
                  <div className="mb-2">
                    <small className="text-muted d-block">Creado</small>
                    <strong>{new Date(order.createdAt).toLocaleString('es-CL')}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Actualizado</small>
                    <strong>{new Date(order.updatedAt).toLocaleString('es-CL')}</strong>
                  </div>
                  {order.completedAt && (
                    <div>
                      <small className="text-muted d-block">Completado</small>
                      <strong className="text-success">{new Date(order.completedAt).toLocaleString('es-CL')}</strong>
                    </div>
                  )}
                </Col>
              </Row>

              <hr />

              <h6 className="text-muted mb-3">💰 Detalles de la Transacción</h6>
              <Row className="g-3">
                <Col xs={12} sm={6} md={4}>
                  <Card className="bg-light mb-3">
                    <Card.Body>
                      <small className="text-muted">Monto CLP</small>
                      <h4 className="mb-0 text-primary">
                        {order.amountClp.toLocaleString('es-CL')} CLP
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4}>
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
                <Col xs={12} sm={12} md={4}>
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

        {/* Sidebar - Actions and receipts */}
        <Col lg={4} className="order-1 order-lg-2">
          {/* VES Receipt Upload - PROMINENT if needed */}
          {needsVesReceipt() && (
            <Card className="shadow-sm mb-4 border-warning" style={{ borderWidth: '2px' }}>
              <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">⚡ Acción Requerida</h6>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-3">
                  <small>
                    <strong>Paso Final:</strong> Sube el comprobante de la transferencia VES que realizaste al cliente.
                  </small>
                </Alert>
                <AdminReceiptUploader
                  orderId={order.id}
                  currentReceiptUrl={order.vesReceiptUrl}
                  onUploadSuccess={(_url) => loadOrder()}
                  onStatusChange={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
              </Card.Body>
            </Card>
          )}

          {/* Bank Details */}
          <div className="mb-4">
            <BankDetailsDisplay
              bankDetails={order.vesBankDetails}
              transferReference={order.vesTransferReference}
              transferredAt={order.vesTransferredAt}
              vesReceiptUrl={order.vesReceiptUrl}
              orderId={order.id}
              onMarkTransferred={handleMarkTransferred}
              showTransferControls={true}
            />
          </div>

          {/* CLP Receipt */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h6 className="mb-0">📸 Comprobante CLP (Cliente)</h6>
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
                  <Button 
                    variant="primary" 
                    href={order.clpReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-100"
                  >
                    🔍 Ver en Tamaño Completo
                  </Button>
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

          {/* VES Receipt - show if already uploaded */}
          {order.vesReceiptUrl && (
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">✅ Comprobante VES (Enviado)</h6>
              </Card.Header>
              <Card.Body>
                <Badge bg="success" className="mb-3">✓ Comprobante Subido</Badge>
                <div className="mb-3">
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
                  className="w-100"
                >
                  🔍 Ver en Tamaño Completo
                </Button>
                <div className="mt-3">
                  <AdminReceiptUploader
                    orderId={order.id}
                    currentReceiptUrl={order.vesReceiptUrl}
                    onUploadSuccess={(_url) => loadOrder()}
                    onStatusChange={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  />
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
