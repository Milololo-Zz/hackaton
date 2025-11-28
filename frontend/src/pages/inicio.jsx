import { useState, useEffect } from 'react'
import { 
  Box, Flex, Heading, Text, VStack, HStack, Badge, Button,
  useColorModeValue, Avatar, Spinner,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  FormControl, FormLabel, Input, Select, Textarea, useDisclosure,
  IconButton, Tooltip, Image
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons' // Asegúrate de tener iconos o usa texto "+"
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css' // OBLIGATORIO PARA QUE EL MAPA SE VEA

// Importar tu servicio de API
import { servicios } from '../api/services' 

// --- CONFIGURACIÓN VISUAL ---
const STATUS_COLORS = {
  'PENDIENTE': 'red',
  'REVISADO': 'orange',
  'RESUELTO': 'green',
}

export default function Inicio() {
  // --- ESTADOS ---
  const [user, setUser] = useState(null)
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // --- ESTADOS DEL FORMULARIO ---
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [newTitulo, setNewTitulo] = useState('')
  const [newTipo, setNewTipo] = useState('FUGA')
  const [newDesc, setNewDesc] = useState('')
  const [newFoto, setNewFoto] = useState(null)
  const [coords, setCoords] = useState(null)

  const navigate = useNavigate()

  // --- 1. CARGAR DATOS INICIALES ---
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // 1. Quién soy
      const perfilRes = await servicios.auth.getPerfil()
      setUser(perfilRes.data)

      // 2. Datos del Mapa (Todos los reportes)
      // OJO: Usamos getAll para ver el mapa global, no solo mis reportes
      const reportesRes = await servicios.reportes.getAll()
      setReportes(reportesRes.data)
      
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast.error('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // --- 2. OBTENER GPS ---
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error('Navegador incompatible con GPS')
      return
    }
    toast.info('Localizando...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
        toast.success('Ubicación capturada')
      },
      (err) => toast.error('No se pudo obtener ubicación')
    )
  }

  // --- 3. ENVIAR REPORTE (CORREGIDO CON FORMDATA) ---
  const handleCrearReporte = async () => {
    if (!newTitulo || !newDesc) return toast.warning('Faltan datos obligatorios')
    if (!coords) return toast.warning('Falta la ubicación GPS')

    setSubmitting(true)
    
    // USAMOS FORMDATA PORQUE LLEVA FOTO
    const formData = new FormData()
    formData.append('titulo', newTitulo)
    formData.append('tipo_problema', newTipo)
    formData.append('descripcion', newDesc)
    // El formato exacto que pide GeoDjango: POINT(long lat)
    formData.append('ubicacion', `POINT(${coords.lng} ${coords.lat})`)
    
    if (newFoto) {
      formData.append('foto', newFoto)
    }

    try {
      await servicios.reportes.crear(formData)
      toast.success('¡Reporte enviado exitosamente!')
      onClose()
      cargarDatos() // Recargar mapa
      // Limpiar
      setNewTitulo('')
      setNewDesc('')
      setNewFoto(null)
      setCoords(null)
    } catch (error) {
      console.error(error)
      toast.error('Error al enviar reporte')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    servicios.auth.logout()
    navigate('/')
  }


  const getImageUrl = (url) => {
    if (!url) return null;
    // Si la URL ya tiene "http", la dejamos igual.
    // Si empieza con "/", le pegamos el dominio del backend.
    if (url.startsWith('/')) {
        return `http://localhost:8000${url}`;
    }
    return url;
  }

  

  // --- RENDERIZADO ---
  return (
    <Flex h="100vh" w="100vw" overflow="hidden">
      
      {/* === 1. SIDEBAR IZQUIERDA (PANEL DE CONTROL) === */}
      <Box 
        w={{ base: "0px", md: "350px" }} 
        h="100%" 
        bg="white" 
        boxShadow="xl" 
        zIndex="1000" 
        display={{ base: "none", md: "block" }} // Oculto en móvil por ahora
        borderRight="1px solid #e2e8f0"
      >
        <VStack h="100%" spacing={0} align="stretch">
          
          {/* Header del Sidebar */}
          <Box p={5} bg="blue.600" color="white">
            <Heading size="md" mb={1}>💧 Hydro-Red</Heading>
            <Text fontSize="xs" opacity={0.8}>Sistema de Monitoreo Hídrico</Text>
          </Box>

          {/* Perfil Mini */}
          <Box p={4} borderBottom="1px solid #eee">
            <HStack>
              <Avatar size="sm" name={user?.username} bg="blue.500" color="white" />
              <Box>
                <Text fontWeight="bold" fontSize="sm">{user?.username || 'Cargando...'}</Text>
                <Text fontSize="xs" color="gray.500">{user?.email}</Text>
              </Box>
            </HStack>
          </Box>

          {/* Lista de Reportes (Scrollable) */}
          <Box flex="1" overflowY="auto" p={2} bg="gray.50">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} px={2}>
              REPORTES EN TU ZONA ({reportes.length})
            </Text>
            
            <VStack spacing={2} align="stretch">
              {loading ? <Spinner alignSelf="center" mt={4}/> : reportes.map(repo => (
                <Box 
                  key={repo.id} 
                  p={3} 
                  bg="white" 
                  borderRadius="md" 
                  boxShadow="sm" 
                  borderLeft="4px solid"
                  borderColor={STATUS_COLORS[repo.status] || 'gray.400'}
                  cursor="pointer"
                  _hover={{ bg: "blue.50" }}
                >
                  <HStack justify="space-between" mb={1}>
                    <Badge colorScheme={STATUS_COLORS[repo.status]}>{repo.status}</Badge>
                    <Text fontSize="xs" color="gray.400">
                      {new Date(repo.fecha_hora).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{repo.titulo}</Text>
                  <Text fontSize="xs" color="gray.600" noOfLines={2}>{repo.descripcion}</Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Footer Sidebar */}
          <Box p={4} borderTop="1px solid #eee">
            <Button w="full" size="sm" colorScheme="red" variant="ghost" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>
        </VStack>
      </Box>

      {/* === 2. MAPA PRINCIPAL (OCUPA EL RESTO) === */}
      <Box flex="1" position="relative" bg="gray.200">
        
        {/* El Mapa */}
        <MapContainer 
          center={[19.31, -98.88]} // Coordenadas Ixtapaluca
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pines en el mapa */}
          {reportes.map((repo) => (
            // Solo renderizamos si tiene coordenadas válidas
            (repo.latitud && repo.longitud) && (
              <Marker key={repo.id} position={[repo.latitud, repo.longitud]}>
                <Popup>
                  <Box minW="150px">
                    <Badge mb={1} colorScheme={STATUS_COLORS[repo.status]}>{repo.tipo_problema}</Badge>
                    <Text fontWeight="bold">{repo.titulo}</Text>
                    <Text fontSize="sm" mb={2}>{repo.descripcion}</Text>
                    {repo.foto && (
                      <Image 
                        src={getImageUrl(repo.foto)} 
                        alt="Evidencia" 
                        borderRadius="md" 
                        boxSize="100px" 
                        objectFit="cover" 
                        mb={2}
  // 2. Esto evita el pantallazo gris si la imagen falla
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <Text fontSize="xs" color="gray.500">Reportado por: {repo.usuario_nombre}</Text>
                  </Box>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>

        {/* Botón Flotante (FAB) para crear reporte */}
        <Tooltip label="Nuevo Reporte" placement="left">
          <IconButton
            icon={<AddIcon />} // O usa un texto "+"
            position="absolute"
            bottom="40px"
            right="40px"
            colorScheme="blue"
            size="lg"
            isRound
            boxShadow="dark-lg"
            zIndex="1000"
            onClick={onOpen}
            w="60px" h="60px" fontSize="24px"
          />
        </Tooltip>

      </Box>

      {/* === MODAL DE CREACIÓN === */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent>
          <ModalHeader>Nuevo Reporte Ciudadano</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Título</FormLabel>
                <Input value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} placeholder="Ej. Fuga masiva" />
              </FormControl>

              <FormControl>
                <FormLabel>Tipo</FormLabel>
                <Select value={newTipo} onChange={(e) => setNewTipo(e.target.value)}>
                  <option value="FUGA">Fuga de Agua</option>
                  <option value="ESCASEZ">Escasez /</option>
                  <option value="CALIDAD">Mala Calidad</option>
                  <option value="OTRO">Otro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Detalles de la ubicación..." />
              </FormControl>

              <FormControl>
                <FormLabel>Foto (Evidencia)</FormLabel>
                <Input type="file" accept="image/*" pt={1} onChange={(e) => setNewFoto(e.target.files[0])} />
              </FormControl>

              <Button 
                w="full" 
                colorScheme={coords ? "green" : "gray"} 
                onClick={obtenerUbicacion}
                leftIcon={<span>📍</span>}
              >
                {coords ? "Ubicación GPS Guardada" : "Capturar mi Ubicación"}
              </Button>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleCrearReporte} isLoading={submitting} isDisabled={!coords}>
              Enviar Reporte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Flex>
  )
}