import { useState } from 'react'
import { Login } from './pages/LoginPage'
import { Toaster, toast } from 'sonner'
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  Stack, 
  Badge,
  Center
} from '@chakra-ui/react'

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    toast.info('Sesión cerrada correctamente')
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      
      {!token ? (
        <Login onLoginSuccess={setToken} />
      ) : (
        <Container maxW={'3xl'} py={12}>
          <Stack spacing={8}>
            <Heading as="h1" size="2xl" textAlign="center" color="teal.500">
              Hackatón 2025
            </Heading>
            
            <Box p={6} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
              <Stack direction="row" alignItems="center" mb={4}>
                <Heading fontSize="xl">Estado del Sistema</Heading>
                <Badge colorScheme="green">En línea</Badge>
              </Stack>
              <Text mt={2} color="gray.600">
                ¡Bienvenido! Has iniciado sesión correctamente. Tu token JWT está seguro.
                Aquí es donde tu equipo construirá el Dashboard mañana.
              </Text>
              
              <Center mt={8}>
                <Button colorScheme="red" variant="outline" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </Center>
            </Box>
          </Stack>
        </Container>
      )}
    </>
  )
}

export default App
