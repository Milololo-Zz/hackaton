
import { useState, useEffect } from 'react'
import { 
  Box, Flex, Button, Input, Stack, Heading, Text, 
  FormControl, FormLabel, useColorModeValue, Link
} from '@chakra-ui/react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { servicios } from '../api/services' // Tu archivo de conexión

export function Login() {
  const [isLogin, setIsLogin] = useState(true) // Switch entre Login/Registro
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Estados del Formulario
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    re_password: ''
  })

  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log("Tokens limpiados para evitar conflictos.");
  }, []);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Lógica de Envío
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // --- PROCESO DE LOGIN ---
        const data = await servicios.auth.login(formData.username, formData.password)
        
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
  
        toast.success('¡Bienvenido!')
        
        // Redirección Inteligente
        if (formData.username === 'admin' || formData.username.includes('gob')) {
            navigate('/admin-panel')
        } else {
            navigate('/inicio')
        }

      } else {
        // --- PROCESO DE REGISTRO ---
        if (formData.password !== formData.re_password) {
            throw new Error("Las contraseñas no coinciden")
        }
        
        await servicios.auth.register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            re_password: formData.re_password
        })
        
        toast.success('Cuenta creada. Ahora inicia sesión.')
        setIsLogin(true) // Cambiar a vista de login
        setFormData({ username: '', email: '', password: '', re_password: '' })
      }

    } catch (error) {
      console.error(error)
      // Capturamos error si el backend manda detalles
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Error de credenciales'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex h="100vh" w="100vw" overflow="hidden" position="relative">
      
      {/* 1. FONDO DE MAPA (La propuesta de valor) */}
      <Box position="absolute" top="0" left="0" w="100%" h="100%" zIndex="0">
        <MapContainer 
            center={[19.31, -98.88]} 
            zoom={13} 
            zoomControl={false} // Sin botones para que sea solo visual
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
        {/* Capa oscura para que resalte el formulario */}
        <Box position="absolute" top="0" left="0" w="100%" h="100%" bg="blackAlpha.400" zIndex="1" />
      </Box>

      {/* 2. TARJETA FLOTANTE (Glassmorphism) */}
      <Flex w="100%" h="100%" align="center" justify={{ base: 'center', md: 'flex-end' }} zIndex="2" px={{ base: 4, md: 20 }}>
        
        <Box 
            bg="whiteAlpha.900" 
            backdropFilter="blur(10px)" 
            p={8} 
            borderRadius="xl" 
            boxShadow="2xl" 
            w="400px"
            maxW="100%"
        >
            <Stack spacing={4}>
                <Heading fontSize="2xl" color="blue.600" textAlign="center">
                    {isLogin ? 'Acceso a Vecto-Red' : 'Únete a la Red'}
                </Heading>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                    {isLogin ? 'Monitoreo Hídrico y Sanitario' : 'Ayuda a mejorar tu comunidad'}
                </Text>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={4}>
                        
                        {/* Campo Usuario (Siempre visible) */}
                        <FormControl id="username">
                            <FormLabel>Usuario</FormLabel>
                            <Input 
                                name="username"
                                type="text" 
                                value={formData.username} 
                                onChange={handleChange}
                                placeholder="Ej. vecino123"
                                bg="white"
                            />
                        </FormControl>

                        {/* Campo Email (Solo en Registro) */}
                        {!isLogin && (
                            <FormControl id="email">
                                <FormLabel>Correo Electrónico</FormLabel>
                                <Input 
                                    name="email"
                                    type="email" 
                                    value={formData.email} 
                                    onChange={handleChange}
                                    bg="white"
                                />
                            </FormControl>
                        )}

                        <FormControl id="password">
                            <FormLabel>Contraseña</FormLabel>
                            <Input 
                                name="password"
                                type="password" 
                                value={formData.password} 
                                onChange={handleChange}
                                bg="white"
                            />
                        </FormControl>

                        {/* Confirmar Pass (Solo en Registro) */}
                        {!isLogin && (
                            <FormControl id="re_password">
                                <FormLabel>Confirmar Contraseña</FormLabel>
                                <Input 
                                    name="re_password"
                                    type="password" 
                                    value={formData.re_password} 
                                    onChange={handleChange}
                                    bg="white"
                                />
                            </FormControl>
                        )}

                        <Button
                            type="submit"
                            bg={isLogin ? 'blue.500' : 'green.500'}
                            color="white"
                            _hover={{ bg: isLogin ? 'blue.600' : 'green.600' }}
                            isLoading={loading}
                            mt={2}
                        >
                            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </Button>
                    </Stack>
                </form>

                <Flex justify="center" mt={4}>
                    <Text fontSize="sm">
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <Link 
                            color="blue.500" 
                            fontWeight="bold" 
                            ml={1}
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
                        </Link>
                    </Text>
                </Flex>

            </Stack>
        </Box>
      </Flex>

    </Flex>
  )
}