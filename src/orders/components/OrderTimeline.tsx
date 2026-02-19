import { useState, useEffect } from 'react'
import { Card, Alert, Badge } from 'react-bootstrap'
import { OrderEvent, OrderStatus } from '../types/order'
import { orderEventService } from '../services/orderEventService'

interface OrderTimelineProps {
  orderId: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Creado',
  clp_receipt_uploaded: 'Comprobante CLP Subido',
  clp_verified: 'CLP Verificado',
  processing: 'Procesando',
  paid_out: 'VES Pagado',
  completed: 'Completado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'secondary',
  clp_receipt_uploaded: 'info',
  clp_verified: 'primary',
  processing: 'warning',
  paid_out: 'success',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'dark',
}

const STATUS_ICONS: Record<OrderStatus, string> = {
  created: '📝',
  clp_receipt_uploaded: '📄',
  clp_verified: '✅',
  processing: '⚙️',
  paid_out: '💰',
  completed: '✓',
  rejected: '❌',
  cancelled: '🚫',
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [orderId])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const orderEvents = await orderEventService.getOrderEvents(orderId)
      setEvents(orderEvents)
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para ver el historial')
      } else {
        setError('Error al cargar el historial')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }

  if (events.length === 0) {
    return (
      <Alert variant="info">
        <small>No hay eventos en el historial aún</small>
      </Alert>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header>
        <h6 className="mb-0">Historial del Pedido</h6>
      </Card.Header>
      <Card.Body>
        <div className="timeline">
          {events.map((event, index) => {
            const isLast = index === events.length - 1
            const statusIcon = STATUS_ICONS[event.toStatus] || '•'
            const statusLabel = STATUS_LABELS[event.toStatus] || event.toStatus
            const statusColor = STATUS_COLORS[event.toStatus] || 'secondary'
            const fromLabel = event.fromStatus ? STATUS_LABELS[event.fromStatus] : null

            return (
              <div key={event.id} className="timeline-item position-relative mb-4 pb-3" style={{ 
                borderLeft: isLast ? 'none' : '2px solid #dee2e6',
                paddingLeft: '2rem'
              }}>
                <div 
                  className={`position-absolute bg-${statusColor} text-white rounded-circle d-flex align-items-center justify-content-center`}
                  style={{
                    left: '-16px',
                    top: '0',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px'
                  }}
                >
                  {statusIcon}
                </div>
                
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <Badge bg={statusColor} className="me-2">
                      {statusLabel}
                    </Badge>
                    <small className="text-muted">
                      {new Date(event.createdAt).toLocaleString('es-CL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                  
                  {fromLabel && (
                    <p className="mb-1 small text-muted">
                      De: <strong>{fromLabel}</strong> → <strong>{statusLabel}</strong>
                    </p>
                  )}
                  
                  <p className="mb-1 small">
                    <strong>Por:</strong> {event.changedByName}
                  </p>
                  
                  {event.note && (
                    <div className="alert alert-light py-2 px-3 mb-0 small">
                      <strong>Nota:</strong> {event.note}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card.Body>
    </Card>
  )
}
