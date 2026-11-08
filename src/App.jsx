import { BrowserRouter } from 'react-router-dom'
import { SesionProvider } from './context/SesionContext'
import { CarritoProvider } from './context/CarritoContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <CarritoProvider>
          <AppRoutes />
        </CarritoProvider>
      </SesionProvider>
    </BrowserRouter>
  )
}

export default App
