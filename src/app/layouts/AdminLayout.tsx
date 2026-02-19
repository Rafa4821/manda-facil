import { Outlet } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { Navbar } from '../../shared/components'

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <Navbar />
      <Container className="py-4">
        <Outlet />
      </Container>
    </div>
  )
}
