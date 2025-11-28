import { useState } from 'react'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Badge,
  Button,
  useColorModeValue,
  Avatar,
  Divider,
  Container
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

// --- DATOS SIMULADOS ---
const TIPO_PROBLEMA_LABELS = {
  'FUGA': 'Fuga de Agua',
  'ESCASEZ': 'Escasez / No hay agua',
  'CALIDAD': 'Mala Calidad / Agua Sucia',
  'OTRO': 'Otro',
}

const STATUS_COLORS = {
  'PENDIENTE': 'yellow',
  'REVISADO': 'blue',
  'RESUELTO': 'green',
}

const mockReportes = [
  { id: 1, tipo_problema: 'FUGA', descripcion: 'Fuga en banqueta.', status: 'PENDIENTE', fecha_hora: '2025-11-27 10:30' },
  { id: 2, tipo_problema: 'ESCASEZ', descripcion: 'Sin agua hace 3 días.', status: 'REVISADO', fecha_hora: '2025-11-26 14:15' },
]

const mockActualizaciones = [
  { id: 101, reporte_id: 2, mensaje: 'Tu reporte de Escasez ha sido revisado.', fecha: 'Hace 2 horas' },
  { id: 102, reporte_id: 1, mensaje: 'Recibimos tu reporte de Fuga.', fecha: 'Ayer' },
]

export default function Inicio() {
  const [activeSection, setActiveSection] = useState(null)
  const navigate = useNavigate()

  const toggleSection = (section) => {
    if (activeSection === section) setActiveSection(null) 
    else setActiveSection(section)
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const headerBg = useColorModeValue('white', 'gray.900')
  const newsBg = 'blue.500'
  const demandsBg = 'red.500'
  const profileBg = 'green.500' // Color para la nueva sección

  return (
    <Box h="100vh" w="100vw" overflow="hidden" bg="gray.100">
      
      {/* HEADER */}
      <Flex as="header" h="60px" w="100%" bg={headerBg} align="center" justify="center" px={4} boxShadow="md" zIndex="10" position="relative">
        <Heading size="md" color="blue.600">💧 Ixtapaluca Water</Heading>
      </Flex>

      {/* CUERPO DIVIDIDO EN 3 PARTES */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        h="calc(100vh - 60px)" 
        w="100%" 
      >
        
        {/* === 1. SECCIÓN NOTICIAS === */}
        <Box
          flex={activeSection === 'noticias' ? 7 : 1}
          bg={newsBg} color="white" cursor="pointer"
          onClick={() => toggleSection('noticias')}
          transition="all 0.5s ease-in-out" overflow="hidden" position="relative"
          w={{ base: "100%", md: "auto" }} borderRight="1px solid white"
        >
          <Flex h="100%" direction="column" p={4}>
            <Flex align="center" justify="space-between" mb={activeSection === 'noticias' ? 4 : 0}>
              <Heading size={activeSection === 'noticias' ? 'xl' : 'md'} noOfLines={1}>📰 Noticias</Heading>
              {/* Icono simple para indicar estado */}
              <Text fontSize="xl" fontWeight="bold">{activeSection === 'noticias' ? '−' : '+'}</Text>
            </Flex>
            
            {/* Contenido Noticias */}
            <Box display={activeSection === 'noticias' ? 'block' : 'none'} flex="1" overflowY="auto" mt={4}>
                <VStack align="start" spacing={4}>
                  <Box bg="whiteAlpha.300" p={4} borderRadius="md" w="full">
                    <Text fontWeight="bold">Corte Programado</Text>
                    <Text fontSize="sm">Zona Centro: Mañana sin servicio.</Text>
                  </Box>
                  <Box bg="whiteAlpha.300" p={4} borderRadius="md" w="full">
                    <Text fontWeight="bold">Nueva Planta</Text>
                    <Text fontSize="sm">Se inaugura el pozo #4.</Text>
                  </Box>
                </VStack>
            </Box>
          </Flex>
        </Box>

        {/* === 2. SECCIÓN DEMANDAS === */}
        <Box
          flex={activeSection === 'demandas' ? 7 : 1}
          bg={demandsBg} color="white" cursor="pointer"
          onClick={() => toggleSection('demandas')}
          transition="all 0.5s ease-in-out" overflow="hidden" position="relative"
          w={{ base: "100%", md: "auto" }} borderRight="1px solid white"
        >
          <Flex h="100%" direction="column" p={4}>
             <Flex align="center" justify="space-between" mb={activeSection === 'demandas' ? 4 : 0}>
              <Heading size={activeSection === 'demandas' ? 'xl' : 'md'} noOfLines={1}>⚠️ Demandas</Heading>
              <Text fontSize="xl" fontWeight="bold">{activeSection === 'demandas' ? '−' : '+'}</Text>
            </Flex>

            {/* Contenido Demandas */}
            <Box display={activeSection === 'demandas' ? 'block' : 'none'} flex="1" overflowY="auto" mt={4}>
                 <VStack align="stretch" spacing={4}>
                  <Button colorScheme="whiteAlpha" variant="solid" color="red.600" bg="white">
                    + Nuevo Reporte
                  </Button>
                  {mockReportes.map((reporte) => (
                    <Box key={reporte.id} bg="white" p={4} borderRadius="md" boxShadow="sm" color="gray.800">
                      <HStack justify="space-between" mb={2}>
                        <Badge colorScheme="red" fontSize="0.8em">{TIPO_PROBLEMA_LABELS[reporte.tipo_problema]}</Badge>
                        <Badge colorScheme={STATUS_COLORS[reporte.status]}>{reporte.status}</Badge>
                      </HStack>
                      <Text fontSize="md" fontWeight="medium">{reporte.descripcion}</Text>
                    </Box>
                  ))}
                </VStack>
            </Box>
          </Flex>
        </Box>

        {/* === 3. SECCIÓN PERFIL (NUEVA) === */}
        <Box
          flex={activeSection === 'perfil' ? 7 : 1}
          bg={profileBg} color="white" cursor="pointer"
          onClick={() => toggleSection('perfil')}
          transition="all 0.5s ease-in-out" overflow="hidden" position="relative"
          w={{ base: "100%", md: "auto" }}
        >
          <Flex h="100%" direction="column" p={4}>
             <Flex align="center" justify="space-between" mb={activeSection === 'perfil' ? 4 : 0}>
              <Heading size={activeSection === 'perfil' ? 'xl' : 'md'} noOfLines={1}>👤 Perfil</Heading>
              <Text fontSize="xl" fontWeight="bold">{activeSection === 'perfil' ? '−' : '+'}</Text>
            </Flex>

            {/* Contenido Perfil */}
            <Box display={activeSection === 'perfil' ? 'block' : 'none'} flex="1" overflowY="auto" mt={4}>
              <VStack spacing={6} align="stretch">
                 
                 {/* Tarjeta de Usuario */}
                 <Flex bg="whiteAlpha.300" p={4} borderRadius="lg" align="center" gap={4}>
                    <Avatar size="lg" name="Usuario Demo" src="https://bit.ly/broken-link" bg="white" color="green.600" />
                    <Box>
                      <Heading size="md">Usuario Ciudadano</Heading>
                      <Text fontSize="sm" opacity={0.9}>Ixtapaluca, Centro</Text>
                      <Badge mt={1} colorScheme="whiteAlpha" variant="solid">Cuenta Verificada</Badge>
                    </Box>
                 </Flex>

                 <Divider borderColor="whiteAlpha.600" />

                 <Heading size="md">🔔 Actualizaciones</Heading>
                 <VStack spacing={3} align="stretch">
                    {mockActualizaciones.map((act) => (
                      <Box key={act.id} bg="white" p={3} borderRadius="md" color="gray.800">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="sm" color="green.600">Reporte #{act.reporte_id}</Text>
                          <Text fontSize="xs" color="gray.500">{act.fecha}</Text>
                        </HStack>
                        <Text fontSize="sm">{act.mensaje}</Text>
                      </Box>
                    ))}
                 </VStack>

                 <Button mt={4} colorScheme="red" variant="solid" onClick={handleLogout}>
                    Cerrar Sesión
                 </Button>

              </VStack>
            </Box>
          </Flex>
        </Box>

      </Flex>
    </Box>
  )
}