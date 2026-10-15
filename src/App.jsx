import { BrowserRouter } from 'react-router-dom'
import { SesionProvider } from './context/SesionContext'
import AppRoutes from './AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <AppRoutes />
      </SesionProvider>
    </BrowserRouter>
  )
}

export default App
