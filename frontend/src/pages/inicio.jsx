import { useState, useEffect } from 'react'
import { 
  Box, Flex, Heading, Text, VStack, HStack, Button,
  useColorModeValue, Avatar, Spinner,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  FormControl, FormLabel, Input, Select, Textarea, useDisclosure,
  Table, Thead, Tbody, Tr, Th, Td, Badge, Tabs, TabList, TabPanels, Tab, TabPanel,
  Container, SimpleGrid, Card, CardBody, CardHeader,
  Menu, MenuButton, MenuList, MenuItem, MenuDivider
} from '@chakra-ui/react'
import { AddIcon, TimeIcon, CheckCircleIcon, WarningIcon, ChevronDownIcon, EditIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { servicios } from '../api/services'

// --- ESTILO INSTITUCIONAL ---
const COLORS = {
  primary: '#691C32', // Guinda Gobierno
  secondary: '#BC955C', // Dorado
  bg: '#F9FAFB'
}

const STATUS_CONFIG = {
  'PENDIENTE': { color: 'yellow', label: 'Recibido' },
  'ASIGNADO': { color: 'blue', label: 'En Asignación' },
  'EN_PROCESO': { color: 'orange', label: 'Trabajando' },
  'RESUELTO': { color: 'green', label: 'Concluido' },
  'CANCELADO': { color: 'red', label: 'Cancelado' },
}

export default function VentanillaUnica() {
  const [user, setUser] = useState(null)
  const [reportes, setReportes] = useState([])
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Estados para Formulario de Solicitud
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formData, setFormData] = useState({
    titulo: '', tipo: 'FUGA', desc: '', direccion: '', foto: null
  })
  const [coords, setCoords] = useState(null)

  // Estados para Edición de Perfil
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [editData, setEditData] = useState({ first_name: '', colonia: '', telefono: '' })

  const navigate = useNavigate()

  // --- CARGA INICIAL ---
  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [perfilRes, reportesRes, noticiasRes] = await Promise.all([
        servicios.auth.getPerfil(),
        servicios.reportes.getMisReportes(),
        servicios.publico.getNoticias()
      ])
      setUser(perfilRes.data)
      setReportes(reportesRes.data)
      setNoticias(noticiasRes.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión con Ventanilla Única')
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE SOLICITUDES ---
  const obtenerUbicacion = () => {
    toast.info('Localizando predio...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Coordenadas capturadas')
      },
      () => toast.error('Active el GPS para continuar')
    )
  }

  const handleSubmit = async () => {
    if (!coords) return toast.warning('La ubicación GPS es obligatoria para el trámite')
    
    setSubmitting(true)
    const data = new FormData()
    data.append('descripcion', formData.desc)
    data.append('tipo_problema', formData.tipo)
    data.append('direccion_texto', formData.direccion)
    data.append('ubicacion', `POINT(${coords.lng} ${coords.lat})`)
    if (formData.foto) data.append('foto', formData.foto)

    try {
      await servicios.reportes.crear(data)
      toast.success('Solicitud registrada con éxito. Se generó su Folio.')
      onClose()
      cargarDatos()
      setFormData({ titulo: '', tipo: 'FUGA', desc: '', direccion: '', foto: null })
      setCoords(null)
    } catch (e) {
      toast.error('Error al registrar solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  // --- LÓGICA DE EDICIÓN DE PERFIL ---
  const handleOpenEdit = () => {
    setEditData({
      first_name: user?.first_name || '',
      colonia: user?.perfil?.colonia || '', 
      telefono: user?.perfil?.telefono || ''
    })
    onEditOpen()
  }

  const handleSaveProfile = async () => {
    setSubmitting(true)
    try {
      await servicios.auth.updatePerfil(editData)
      toast.success('Datos actualizados correctamente')
      cargarDatos() 
      onEditClose()
    } catch (error) {
      toast.error('Error al actualizar perfil')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper para imágenes
  const getImgUrl = (url) => url ? (url.startsWith('http') ? url : `http://localhost:8000${url}`) : null

  return (
    <Flex h="100vh" w="100vw" bg={COLORS.bg} direction="column" overflow="hidden">
      
      {/* 1. HEADER GUBERNAMENTAL */}
      <Flex h="70px" bg={COLORS.primary} align="center" justify="space-between" px={8} boxShadow="md" zIndex="10">
        <HStack spacing={4}>
            <Box>
                <Heading size="md" color="white" fontFamily="serif">GOBIERNO DIGITAL</Heading>
                <Text fontSize="xs" color={COLORS.secondary}>VENTANILLA ÚNICA DE GESTIÓN HIDRÁULICA</Text>
            </Box>
        </HStack>
        
        {/* MENÚ DE USUARIO DESPLEGABLE */}
        <HStack spacing={4} color="white">
            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<ChevronDownIcon />} 
                variant="ghost" 
                color="white" 
                _hover={{ bg: 'whiteAlpha.200' }} 
                _active={{ bg: 'whiteAlpha.300' }}
                p={2}
              >
                <HStack>
                  <Avatar size="sm" name={user?.username} bg={COLORS.secondary} />
                  <VStack spacing={0} align="start" display={{base:'none', md:'flex'}}>
                      <Text fontWeight="bold" fontSize="sm">{user?.username}</Text>
                      <Text fontSize="xs" opacity={0.8}>Ciudadano</Text>
                  </VStack>
                </HStack>
              </MenuButton>
              <MenuList color="gray.800" zIndex="popover">
                <Box px={3} py={2}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.500">CORREO REGISTRADO</Text>
                  <Text fontSize="sm">{user?.email}</Text>
                </Box>
                <MenuDivider />
                <MenuItem icon={<EditIcon />} onClick={handleOpenEdit}>
                  Editar mis datos
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<WarningIcon />} color="red.500" onClick={() => {servicios.auth.logout(); navigate('/')}}>
                  Cerrar Sesión
                </MenuItem>
              </MenuList>
            </Menu>
        </HStack>
      </Flex>

      {/* 2. CUERPO PRINCIPAL (TABS) */}
      <Box flex="1" overflow="hidden">
        <Tabs isLazy colorScheme="red" h="100%" display="flex" flexDirection="column">
            
            <TabList px={8} bg="white" boxShadow="sm">
                <Tab py={4} fontWeight="bold">📂 Mis Expedientes</Tab>
                <Tab py={4} fontWeight="bold">🗺️ Mapa de Servicio</Tab>
                <Tab py={4} fontWeight="bold">📰 Comunicados</Tab>
            </TabList>

            <TabPanels flex="1" overflowY="auto" bg={COLORS.bg}>
                
                {/* TAB 1: LISTA DE EXPEDIENTES (TABLA) */}
                <TabPanel p={8}>
                    <Container maxW="container.xl">
                        <Flex justify="space-between" mb={6}>
                            <Heading size="lg" color="gray.700">Mis Solicitudes</Heading>
                            <Button leftIcon={<AddIcon />} bg={COLORS.primary} color="white" _hover={{ bg: '#4a1223' }} onClick={onOpen}>
                                Nueva Solicitud
                            </Button>
                        </Flex>

                        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
                            <Table variant="simple">
                                <Thead bg="gray.50">
                                    <Tr>
                                        <Th>Folio</Th>
                                        <Th>Tipo de Trámite</Th>
                                        <Th>Fecha</Th>
                                        <Th>Estatus</Th>
                                        <Th>Seguimiento</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {loading ? <Tr><Td colSpan={5}><Spinner/></Td></Tr> : 
                                     reportes.length === 0 ? <Tr><Td colSpan={5} textAlign="center">No hay expedientes activos.</Td></Tr> :
                                     reportes.map(repo => (
                                        <Tr key={repo.id}>
                                            <Td fontWeight="bold">{repo.folio || `SOL-${repo.id}`}</Td>
                                            <Td>
                                                <Badge variant="subtle" colorScheme="gray">{repo.tipo_problema}</Badge>
                                                <Text fontSize="xs" color="gray.500">{repo.direccion_texto || 'Ubicación GPS'}</Text>
                                            </Td>
                                            <Td fontSize="sm">{repo.fecha_formato}</Td>
                                            <Td>
                                                <Badge colorScheme={STATUS_CONFIG[repo.status]?.color || 'gray'}>
                                                    {STATUS_CONFIG[repo.status]?.label || repo.status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                {repo.nota_seguimiento ? (
                                                    <Text fontSize="xs" color="blue.600" fontStyle="italic">"{repo.nota_seguimiento}"</Text>
                                                ) : (
                                                    <Text fontSize="xs" color="gray.400">Sin novedades</Text>
                                                )}
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Container>
                </TabPanel>

                {/* TAB 2: MAPA (SOLO LECTURA) */}
                <TabPanel p={0} h="100%">
                    <Box w="100%" h="100%" position="relative">
                        <MapContainer center={[19.31, -98.88]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {reportes.map((repo) => (
                                (repo.latitud && repo.longitud) && (
                                    <Marker key={repo.id} position={[repo.latitud, repo.longitud]}>
                                        <Popup>
                                            <Text fontWeight="bold">Folio: {repo.folio}</Text>
                                            <Text fontSize="sm">{repo.tipo_problema}</Text>
                                            <Badge colorScheme={STATUS_CONFIG[repo.status]?.color}>{repo.status}</Badge>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                        <Button position="absolute" bottom="30px" right="30px" zIndex="1000" onClick={onOpen}
                            bg={COLORS.primary} color="white" borderRadius="full" w="60px" h="60px" fontSize="2xl" boxShadow="xl">
                            +
                        </Button>
                    </Box>
                </TabPanel>

                {/* TAB 3: NOTICIAS OFICIALES */}
                <TabPanel>
                    <Container maxW="container.xl">
                        <Heading size="md" mb={6} color="gray.600">Comunicados Oficiales</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            {noticias.map(noticia => (
                                <Card key={noticia.id} boxShadow="md">
                                    <CardHeader pb={0}>
                                        <Heading size="sm" color={COLORS.primary}>{noticia.titulo}</Heading>
                                        <Text fontSize="xs" color="gray.400">{new Date(noticia.fecha_publicacion).toLocaleDateString()}</Text>
                                    </CardHeader>
                                    <CardBody>
                                        <Text fontSize="sm" noOfLines={4}>{noticia.contenido}</Text>
                                        <Button mt={4} size="sm" variant="link" color={COLORS.secondary}>Leer comunicado completo</Button>
                                    </CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Container>
                </TabPanel>

            </TabPanels>
        </Tabs>
      </Box>

      {/* === MODAL DE TRÁMITE (SOLICITUD) === */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottom="1px solid #eee">Nueva Solicitud de Servicio</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel>Tipo de Incidencia</FormLabel>
                    <Select value={formData.tipo} onChange={(e)=>setFormData({...formData, tipo: e.target.value})}>
                        <option value="FUGA">Fuga de Agua Potable</option>
                        <option value="ESCASEZ">Falta de Suministro</option>
                        <option value="CALIDAD">Mala Calidad del Agua</option>
                        <option value="ALCANTARILLADO">Falla en Drenaje/Alcantarilla</option>
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Dirección / Referencias</FormLabel>
                    <Input placeholder="Calle, Número, Colonia..." value={formData.direccion} 
                        onChange={(e)=>setFormData({...formData, direccion: e.target.value})} />
                </FormControl>

                <FormControl>
                    <FormLabel>Descripción Detallada</FormLabel>
                    <Textarea placeholder="Describa el problema..." value={formData.desc}
                        onChange={(e)=>setFormData({...formData, desc: e.target.value})} />
                </FormControl>

                <FormControl>
                    <FormLabel>Evidencia Fotográfica</FormLabel>
                    <Input type="file" p={1} onChange={(e)=>setFormData({...formData, foto: e.target.files[0]})} />
                </FormControl>

                <Box w="full" p={4} bg="gray.50" borderRadius="md" border="1px dashed gray">
                    <Text fontSize="sm" mb={2} fontWeight="bold">Ubicación Geográfica (Obligatorio)</Text>
                    <Button size="sm" w="full" colorScheme={coords ? "green" : "blue"} onClick={obtenerUbicacion} leftIcon={coords ? <CheckCircleIcon/> : <WarningIcon/>}>
                        {coords ? "Coordenadas Agregadas" : "Capturar Ubicación GPS"}
                    </Button>
                    <Text fontSize="xs" mt={1} color="gray.500">Se requiere permiso de ubicación del navegador.</Text>
                </Box>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50">
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button bg={COLORS.primary} color="white" _hover={{ bg: '#4a1223' }} onClick={handleSubmit} isLoading={submitting}>
                Registrar Solicitud
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* === MODAL DE EDICIÓN DE PERFIL === */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Actualizar Datos de Contacto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nombre Completo</FormLabel>
                <Input 
                  value={editData.first_name} 
                  onChange={(e) => setEditData({...editData, first_name: e.target.value})} 
                  placeholder="Nombre real para trámites"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Colonia de Residencia</FormLabel>
                <Input 
                  value={editData.colonia} 
                  onChange={(e) => setEditData({...editData, colonia: e.target.value})} 
                  placeholder="Ej. Centro, Ayotla..."
                />
              </FormControl>
              <FormControl>
                <FormLabel>Teléfono de Contacto</FormLabel>
                <Input 
                  value={editData.telefono} 
                  onChange={(e) => setEditData({...editData, telefono: e.target.value})} 
                  placeholder="Para notificaciones de servicio"
                  type="tel"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSaveProfile} isLoading={submitting}>
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Flex>
  )
}