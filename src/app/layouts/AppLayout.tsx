import { Outlet } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { Navbar } from '../../shared/components'

export function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <Container className="py-4">
        <Outlet />
      </Container>
    </div>
  )
}
