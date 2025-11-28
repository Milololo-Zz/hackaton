// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChakraProvider, Box } from '@chakra-ui/react' // Agregamos Box para el layout
import { Toaster } from 'sonner' // Agregamos las notificaciones bonitas

// Tus importaciones de páginas
import { Login } from './pages/LoginPage'
import Inicio from './pages/inicio'

function App() {
  return (
    <ChakraProvider>
      {/* 1. Agregamos el Toaster globalmente para que las notificaciones funcionen en todas las páginas */}
      <Toaster position="top-right" richColors />

      <BrowserRouter>
        {/* 2. Envolvemos las rutas en el Box con padding (p={4}) del segundo código para mantener el estilo */}
        <Box p={4} minH="100vh" bg="gray.50"> 
          <Routes>
            {/* Ruta Raíz (Login) */}
            <Route path="/" element={<Login />} />
            
            {/* Ruta Inicio (Dashboard) */}
            <Route path="/inicio" element={<Inicio />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </ChakraProvider>
  )
}

export default App