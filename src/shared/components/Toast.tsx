import { Toast as BSToast, ToastContainer } from 'react-bootstrap'

interface ToastProps {
  message: string
  variant?: 'success' | 'danger' | 'warning' | 'info'
  show: boolean
  onClose: () => void
}

export function Toast({ message, variant = 'info', show, onClose }: ToastProps) {
  return (
    <ToastContainer position="top-end" className="p-3">
      <BSToast show={show} onClose={onClose} delay={3000} autohide bg={variant}>
        <BSToast.Header>
          <strong className="me-auto">Mandafácil</strong>
        </BSToast.Header>
        <BSToast.Body className={variant === 'danger' || variant === 'success' ? 'text-white' : ''}>
          {message}
        </BSToast.Body>
      </BSToast>
    </ToastContainer>
  )
}
