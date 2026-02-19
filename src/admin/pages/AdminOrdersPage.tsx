import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Badge, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { orderService } from '../../orders/services/orderService'
import { Order } from '../../orders/types/order'
import '../../shared/styles/mobile-tables.css'

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    created: { bg: 'secondary', text: 'Creado' },
    clp_receipt_uploaded: { bg: 'info', text: 'Comprobante Subido' },
    clp_verified: { bg: 'primary', text: 'Verificado' },
    processing: { bg: 'warning', text: 'Procesando' },
    paid_out: { bg: 'success', text: 'Pagado' },
    completed: { bg: 'success', text: 'Completado' },
    rejected: { bg: 'danger', text: 'Rechazado' },
    cancelled: { bg: 'dark', text: 'Cancelado' },
  }
  
  const statusInfo = statusMap[status] || { bg: 'secondary', text: status }
  
  return (
    <Badge bg={statusInfo.bg}>
      {statusInfo.text}
    </Badge>
  )
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [processingBulk, setProcessingBulk] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const allOrders = await orderService.getAllOrders(statusFilter)
      setOrders(allOrders)
      setSelectedOrders(new Set()) // Clear selection when reloading
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para ver los pedidos')
      } else {
        setError('Error al cargar los pedidos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelection = new Set(selectedOrders)
    if (checked) {
      newSelection.add(orderId)
    } else {
      newSelection.delete(orderId)
    }
    setSelectedOrders(newSelection)
  }

  const handleBulkAction = async () => {
    if (selectedOrders.size === 0 || !bulkAction) return

    const confirmed = window.confirm(
      `¿Estás seguro de ${bulkAction === 'delete' ? 'eliminar' : 'cambiar el estado de'} ${selectedOrders.size} pedido(s)?`
    )
    if (!confirmed) return

    try {
      setProcessingBulk(true)
      const orderIds = Array.from(selectedOrders)

      if (bulkAction === 'delete') {
        const result = await orderService.bulkDeleteOrders(orderIds)
        if (result.success > 0) {
          setError('')
          alert(`✅ ${result.success} pedido(s) eliminado(s) correctamente`)
          await loadOrders()
        }
        if (result.failed > 0) {
          setError(`⚠️ ${result.failed} pedido(s) no pudieron ser eliminados`)
        }
      } else {
        // Bulk status update
        const result = await orderService.bulkUpdateStatus(orderIds, bulkAction)
        if (result.success > 0) {
          setError('')
          alert(`✅ ${result.success} pedido(s) actualizados correctamente`)
          await loadOrders()
        }
      }

      setBulkAction('')
    } catch (error: any) {
      setError('Error al procesar la acción en lote')
      console.error('Bulk action error:', error)
    } finally {
      setProcessingBulk(false)
    }
  }

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'created' || o.status === 'clp_receipt_uploaded').length,
      processing: orders.filter(o => o.status === 'clp_verified' || o.status === 'processing' || o.status === 'paid_out').length,
      completed: orders.filter(o => o.status === 'completed').length,
    }
  }

  const stats = getOrderStats()

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4">Gestión de Pedidos</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Total Pedidos</Card.Title>
              <h3 className="mb-0">{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-warning">
            <Card.Body>
              <Card.Title className="text-muted small">Pendientes</Card.Title>
              <h3 className="mb-0 text-warning">{stats.pending}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-info">
            <Card.Body>
              <Card.Title className="text-muted small">Procesando</Card.Title>
              <h3 className="mb-0 text-info">{stats.processing}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-success">
            <Card.Body>
              <Card.Title className="text-muted small">Completados</Card.Title>
              <h3 className="mb-0 text-success">{stats.completed}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrar por estado</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="created">Creados</option>
                  <option value="clp_receipt_uploaded">Con Comprobante CLP</option>
                  <option value="clp_verified">CLP Verificado</option>
                  <option value="processing">Procesando</option>
                  <option value="paid_out">VES Pagado</option>
                  <option value="completed">Completados</option>
                  <option value="rejected">Rechazados</option>
                  <option value="cancelled">Cancelados</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={9} className="text-end d-flex gap-2 justify-content-end align-items-end">
              {selectedOrders.size > 0 && (
                <>
                  <Form.Select 
                    value={bulkAction} 
                    onChange={(e) => setBulkAction(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="">Acciones en lote ({selectedOrders.size})</option>
                    <option value="delete">🗑️ Eliminar</option>
                    <option value="clp_verified">✅ Marcar como CLP Verificado</option>
                    <option value="processing">⚙️ Marcar como Procesando</option>
                    <option value="paid_out">💸 Marcar como VES Pagado</option>
                    <option value="completed">✔️ Marcar como Completado</option>
                    <option value="cancelled">❌ Marcar como Cancelado</option>
                  </Form.Select>
                  <Button 
                    variant="primary" 
                    onClick={handleBulkAction}
                    disabled={!bulkAction || processingBulk}
                  >
                    {processingBulk ? 'Procesando...' : 'Aplicar'}
                  </Button>
                </>
              )}
              <Button variant="outline-secondary" onClick={loadOrders}>
                🔄 Actualizar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {orders.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">No hay pedidos</h5>
            <p className="text-muted mb-0">
              {statusFilter !== 'all' 
                ? `No hay pedidos con estado "${statusFilter}"`
                : 'Aún no se han creado pedidos'
              }
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              {/* Desktop Table View */}
              <Table responsive hover className="desktop-table-view">
                <thead>
                  <tr>
                    <th>
                      <Form.Check
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>CLP</th>
                    <th>VES</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Comprobante</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order.id}
                      className={selectedOrders.has(order.id) ? 'table-active' : ''}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                        />
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <div>{order.customerName}</div>
                        <small className="text-muted">{order.customerEmail}</small>
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        {order.amountClp?.toLocaleString('es-CL') || '0'} CLP
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        {order.amountVesExpected?.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) || '0.00'} VES
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        {getStatusBadge(order.status)}
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        {order.clpReceiptUrl ? (
                          <Badge bg="success">✓ CLP</Badge>
                        ) : (
                          <Badge bg="secondary">Pendiente</Badge>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/orders/${order.id}`)
                          }}
                        >
                          Ver Detalle →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Mobile Card View */}
              <div className="mobile-card-view">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className={`order-card-mobile ${selectedOrders.has(order.id) ? 'selected' : ''}`}
                  >
                    <div className="order-card-header">
                      <Form.Check
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <strong className="d-block">{order.orderNumber}</strong>
                        <small className="text-muted d-block">{order.customerName}</small>
                        <small className="text-muted">{order.customerEmail}</small>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="order-card-body">
                      <div className="order-card-row">
                        <span className="order-card-label">Monto CLP</span>
                        <span className="order-card-value text-primary">
                          ${order.amountClp?.toLocaleString('es-CL') || '0'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Monto VES</span>
                        <span className="order-card-value text-success">
                          {order.amountVesExpected?.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) || '0.00'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Fecha</span>
                        <span className="order-card-value">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Comprobante</span>
                        <span className="order-card-value">
                          {order.clpReceiptUrl ? (
                            <Badge bg="success">✓ CLP</Badge>
                          ) : (
                            <Badge bg="secondary">Pendiente</Badge>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="order-card-footer">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        Ver Detalle →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
