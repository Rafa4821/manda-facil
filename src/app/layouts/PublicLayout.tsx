import { Outlet } from 'react-router-dom'
import { Container } from 'react-bootstrap'

export function PublicLayout() {
  return (
    <div className="public-layout">
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
        <Container className="py-5">
          <div className="text-center mb-4">
            <h1 className="fw-bold text-dark mb-2">Mandafácil</h1>
            <p className="text-muted">Remesas CLP → VES rápidas y seguras</p>
          </div>
          <Outlet />
        </Container>
      </div>
    </div>
  )
}
