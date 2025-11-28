import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { Toaster } from 'sonner'

// Importaciones
import { Login } from './pages/LoginPage'
import Inicio from './pages/inicio'
import AdminDashboard from './pages/AdminDashboard' // <--- NUEVA PÁGINA

function App() {
  return (
    <ChakraProvider>
      <Toaster position="top-right" richColors />

      <BrowserRouter>
        {/* ELIMINAMOS EL BOX CON PADDING PARA QUE EL MAPA SEA FULL SCREEN */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/inicio" element={<Inicio />} />
          {/* RUTA NUEVA PARA EL GOBIERNO */}
          <Route path="/admin-panel" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App