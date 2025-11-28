import { useState, useEffect } from 'react'
import { 
  Box, Flex, Button, Input, Stack, Heading, Text, 
  FormControl, FormLabel, Link, Divider, Container, SimpleGrid
} from '@chakra-ui/react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { servicios } from '../api/services'

// --- COLORES INSTITUCIONALES ---
const GOB = {
  header: '#0B231E', // Verde Oscuro Gobierno Federal
  primary: '#691C32', // Guinda
  secondary: '#BC955C', // Dorado
  text: '#333333'
}

export function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Estados del Formulario
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', re_password: ''
  })

  // Limpieza de tokens al entrar para evitar conflictos
  useEffect(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        // --- CASO 1: LOGIN NORMAL ---
        const data = await servicios.auth.login(formData.username, formData.password)
        
        // Guardar tokens
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        
        toast.success('Bienvenido al Sistema')
        
        // Redirección Inteligente
        if (formData.username === 'admin' || formData.username.includes('gob')) {
            navigate('/admin-panel')
        } else {
            navigate('/inicio')
        }

      } else {
        // --- CASO 2: REGISTRO + LOGIN AUTOMÁTICO ---
        if (formData.password !== formData.re_password) throw new Error("Las contraseñas no coinciden")
        
        // 1. Crear la cuenta
        await servicios.auth.register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            re_password: formData.re_password
        })
        
        toast.success('Cuenta creada. Iniciando sesión...')

        // 2. Iniciar sesión automáticamente (Login implícito)
        const loginData = await servicios.auth.login(formData.username, formData.password)
        
        // 3. Guardar tokens
        localStorage.setItem('access_token', loginData.access)
        localStorage.setItem('refresh_token', loginData.refresh)
        
        // 4. Redirigir directo al mapa (Asumimos que un registro nuevo siempre es ciudadano)
        navigate('/inicio')
      }

    } catch (error) {
      console.error(error)
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Error en la operación'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" minH="100vh" w="100vw" bg="white">
      
      {/* 1. BARRA DE GOBIERNO FEDERAL */}
      <Flex bg={GOB.header} h="60px" w="100%" align="center" px={{ base: 4, md: 8 }}>
        <Text color="white" fontWeight="bold" fontSize="lg" letterSpacing="widest">GOBIERNO DE MÉXICO</Text>
      </Flex>

      {/* 2. BARRA INSTITUCIONAL LOCAL */}
      <Flex bg="white" h="80px" w="100%" align="center" px={{ base: 4, md: 8 }} borderBottom={`4px solid ${GOB.secondary}`}>
        <Heading size="md" color={GOB.text} mr={4}>IXTAPALUCA</Heading>
        <Divider orientation="vertical" h="40px" borderColor="gray.300" />
        <Text ml={4} color="gray.600" fontSize="sm" fontWeight="bold">SISTEMA DE AGUAS <br/> OPD Municipal</Text>
        
        <Flex ml="auto" gap={4}>
            <Button size="sm" variant="outline" colorScheme="gray" onClick={() => setIsLogin(false)}>Crear Cuenta</Button>
            <Button size="sm" bg={GOB.primary} color="white" _hover={{ bg: '#4a1223' }} onClick={() => setIsLogin(true)}>Iniciar Sesión</Button>
        </Flex>
      </Flex>

      {/* 3. CONTENIDO PRINCIPAL */}
      <Container maxW="container.xl" flex="1" py={10}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="start">
            
            {/* COLUMNA IZQUIERDA: TEXTO Y FORMULARIO */}
            <Box>
                <Text color={GOB.secondary} fontWeight="bold" fontSize="sm" mb={2}>TRÁMITES Y SERVICIOS DIGITALES</Text>
                <Heading color={GOB.text} mb={4} lineHeight="shorter">
                    Ventanilla Única de <br/>
                    <Text as="span" color={GOB.primary}>Gestión Hidráulica</Text>
                </Heading>
                <Text color="gray.600" mb={8} textAlign="justify">
                    Plataforma oficial para el reporte ciudadano de incidencias hídricas y consulta de estatus en tiempo real.
                </Text>

                <Flex gap={8} mb={8}>
                    <Box borderLeft={`4px solid ${GOB.primary}`} pl={4}>
                        <Text fontWeight="bold">Atención 24/7</Text>
                        <Text fontSize="xs" color="gray.500">Reportes de emergencia</Text>
                    </Box>
                    <Box borderLeft={`4px solid ${GOB.secondary}`} pl={4}>
                        <Text fontWeight="bold">Transparencia</Text>
                        <Text fontSize="xs" color="gray.500">Seguimiento con Folio</Text>
                    </Box>
                </Flex>

                {/* FORMULARIO INTEGRADO */}
                <Box bg="gray.50" p={6} borderRadius="md" border="1px solid #eee">
                    <Heading size="sm" mb={4} color="gray.700">{isLogin ? 'Acceso al Sistema' : 'Registro Ciudadano'}</Heading>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            
                            <FormControl>
                                <FormLabel fontSize="sm">Nombre de Usuario</FormLabel>
                                <Input name="username" bg="white" onChange={handleChange} value={formData.username} placeholder="Ej. juanperez" />
                            </FormControl>
                            
                            {!isLogin && (
                                <FormControl>
                                    <FormLabel fontSize="sm">Correo Electrónico</FormLabel>
                                    <Input name="email" type="email" bg="white" onChange={handleChange} value={formData.email} />
                                </FormControl>
                            )}

                            <FormControl>
                                <FormLabel fontSize="sm">Contraseña</FormLabel>
                                <Input name="password" type="password" bg="white" onChange={handleChange} value={formData.password} />
                            </FormControl>

                            {!isLogin && (
                                <FormControl>
                                    <FormLabel fontSize="sm">Confirmar Contraseña</FormLabel>
                                    <Input name="re_password" type="password" bg="white" onChange={handleChange} value={formData.re_password} />
                                </FormControl>
                            )}

                            <Button type="submit" w="full" bg={GOB.primary} color="white" _hover={{ bg: '#4a1223' }} isLoading={loading}>
                                {isLogin ? 'Ingresar al Portal' : 'Registrar Cuenta'}
                            </Button>
                        </Stack>
                    </form>
                </Box>
            </Box>

            {/* COLUMNA DERECHA: EL MAPA EN EL RECUADRO */}
            <Box h="500px" bg="gray.200" borderRadius="lg" overflow="hidden" boxShadow="lg" position="relative">
                <Box position="absolute" top={4} left={4} zIndex={1000} bg="white" px={3} py={1} borderRadius="md" boxShadow="md">
                    <Text fontSize="xs" fontWeight="bold" color={GOB.primary}>MONITOREO EN VIVO</Text>
                </Box>
                <MapContainer 
                    center={[19.31, -98.88]} 
                    zoom={13} 
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                </MapContainer>
                {/* Franja decorativa roja arriba del mapa */}
                <Box h="8px" w="100%" bg={GOB.primary} position="absolute" top={0} left={0} zIndex={1001} />
            </Box>

        </SimpleGrid>
      </Container>

      {/* 4. FOOTER */}
      <Box bg={GOB.primary} py={6} color="white" mt="auto">
        <Container maxW="container.xl">
            <Flex justify="space-between" align="center" fontSize="sm">
                <Text>© 2025 Gobierno de Ixtapaluca. Todos los derechos reservados.</Text>
                <Flex gap={4}>
                    <Link>Política de Privacidad</Link>
                    <Link>Términos y Condiciones</Link>
                    <Link>Contacto</Link>
                </Flex>
            </Flex>
        </Container>
      </Box>

    </Flex>
  )
}