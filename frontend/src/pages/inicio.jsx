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
import { AddIcon, WarningIcon, ChevronDownIcon, EditIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { servicios } from '../api/services'

// --- ESTILO INSTITUCIONAL ---
const COLORS = {
  primary: '#691C32', // Guinda
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
  
  // --- SEPARAMOS LOS DATOS ---
  const [misSolicitudes, setMisSolicitudes] = useState([]) // Para la Tabla
  const [puntosMapa, setPuntosMapa] = useState([])         // Para el Mapa
  const [noticias, setNoticias] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Formularios
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [formData, setFormData] = useState({ titulo: '', tipo: 'FUGA', desc: '', direccion: '', foto: null })
  const [editData, setEditData] = useState({ first_name: '', colonia: '', telefono: '' })
  const [coords, setCoords] = useState(null)

  const navigate = useNavigate()

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      // Pedimos TODO al mismo tiempo
      const [perfilRes, misRepRes, todoRepRes, noticiasRes] = await Promise.all([
        servicios.auth.getPerfil(),
        servicios.reportes.getMisReportes(), // Solo los míos
        servicios.reportes.getAll(),         // TODOS (Públicos) para el mapa
        servicios.publico.getNoticias()
      ])
      
      setUser(perfilRes.data)
      setMisSolicitudes(misRepRes.data)
      setPuntosMapa(todoRepRes.data) // Llenamos el mapa con todo
      setNoticias(noticiasRes.data || [])
      
    } catch (error) {
      console.error(error)
      // Si falla, no bloqueamos la app, solo avisamos
      // toast.error('Error de conexión parcial')
    } finally {
      setLoading(false)
    }
  }

  // --- GPS ---
  const obtenerUbicacion = () => {
    toast.info('Localizando...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Ubicación agregada')
      },
      () => toast.error('Active el GPS')
    )
  }

  // --- ENVIAR REPORTE ---
  const handleSubmit = async () => {
    if (!coords) return toast.warning('Ubicación obligatoria')
    setSubmitting(true)
    const data = new FormData()
    data.append('descripcion', formData.desc)
    data.append('tipo_problema', formData.tipo)
    data.append('direccion_texto', formData.direccion)
    data.append('ubicacion', `POINT(${coords.lng} ${coords.lat})`)
    if (formData.foto) data.append('foto', formData.foto)

    try {
      await servicios.reportes.crear(data)
      toast.success('Solicitud enviada con éxito')
      onClose()
      cargarDatos()
      setFormData({ titulo: '', tipo: 'FUGA', desc: '', direccion: '', foto: null })
      setCoords(null)
    } catch (e) {
        // Manejo de error de tiempo (Spam)
        let msg = 'Error al enviar'
        if (e.response?.data && Array.isArray(e.response.data)) msg = e.response.data[0]
        toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // --- PERFIL ---
  const handleSaveProfile = async () => {
    setSubmitting(true)
    try {
      await servicios.auth.updatePerfil(editData)
      toast.success('Perfil actualizado')
      cargarDatos()
      onEditClose()
    } catch { toast.error('Error al actualizar') } 
    finally { setSubmitting(false) }
  }

  const handleOpenEdit = () => {
    setEditData({
      first_name: user?.first_name || '',
      colonia: user?.perfil?.colonia || '',
      telefono: user?.perfil?.telefono || ''
    })
    onEditOpen()
  }

  const getImgUrl = (url) => url ? (url.startsWith('http') ? url : `http://localhost:8000${url}`) : null

  return (
    <Flex h="100vh" w="100vw" bg={COLORS.bg} direction="column" overflow="hidden">
      
      {/* HEADER */}
      <Flex h="70px" bg={COLORS.primary} align="center" justify="space-between" px={8} boxShadow="md" zIndex="10">
        <Box>
            <Heading size="md" color="white" fontFamily="serif">GOBIERNO DIGITAL</Heading>
            <Text fontSize="xs" color={COLORS.secondary}>VENTANILLA ÚNICA</Text>
        </Box>
        <HStack spacing={4}>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon/>} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }}>
                <HStack>
                  <Avatar size="sm" name={user?.username} bg={COLORS.secondary} />
                  <Text display={{base:'none', md:'block'}} fontSize="sm">{user?.username}</Text>
                </HStack>
              </MenuButton>
              <MenuList color="gray.800">
                <MenuItem icon={<EditIcon/>} onClick={handleOpenEdit}>Mis Datos</MenuItem>
                <MenuDivider/>
                <MenuItem icon={<WarningIcon/>} color="red.500" onClick={()=>{servicios.auth.logout(); navigate('/')}}>Salir</MenuItem>
              </MenuList>
            </Menu>
        </HStack>
      </Flex>

      {/* CUERPO */}
      <Box flex="1" overflow="hidden">
        <Tabs isLazy colorScheme="red" h="100%" display="flex" flexDirection="column">
            <TabList px={8} bg="white" boxShadow="sm">
                <Tab py={4} fontWeight="bold">📂 Mis Expedientes</Tab>
                <Tab py={4} fontWeight="bold">🗺️ Mapa de Servicio</Tab>
                <Tab py={4} fontWeight="bold">📰 Avisos</Tab>
            </TabList>

            <TabPanels flex="1" overflowY="auto" bg={COLORS.bg}>
                
                {/* TAB 1: MIS SOLICITUDES (Usa misSolicitudes) */}
                <TabPanel p={8}>
                    <Container maxW="container.xl">
                        <Flex justify="space-between" mb={6}>
                            <Heading size="lg" color="gray.700">Mis Solicitudes</Heading>
                            <Button leftIcon={<AddIcon />} bg={COLORS.primary} color="white" _hover={{ bg: '#4a1223' }} onClick={onOpen}>
                                Nueva Solicitud
                            </Button>
                        </Flex>
                        <Box bg="white" borderRadius="lg" boxShadow="sm" overflowX="auto">
                            <Table variant="simple">
                                <Thead bg="gray.50">
                                    <Tr><Th>Folio</Th><Th>Trámite</Th><Th>Fecha</Th><Th>Estatus</Th><Th>Seguimiento</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {misSolicitudes.length === 0 ? <Tr><Td colSpan={5} textAlign="center">Sin registros.</Td></Tr> :
                                     misSolicitudes.map(repo => (
                                        <Tr key={repo.id}>
                                            <Td fontWeight="bold">{repo.folio || repo.id}</Td>
                                            <Td>
                                                <Badge variant="subtle">{repo.tipo_problema}</Badge>
                                                <Text fontSize="xs" color="gray.500">{repo.direccion_texto}</Text>
                                            </Td>
                                            <Td fontSize="sm">{repo.fecha_formato}</Td>
                                            <Td><Badge colorScheme={STATUS_CONFIG[repo.status]?.color}>{STATUS_CONFIG[repo.status]?.label}</Badge></Td>
                                            <Td>
                                                <VStack align="start" spacing={1}>
                                                    <Text fontSize="xs" fontStyle="italic">{repo.nota_seguimiento || "En espera..."}</Text>
                                                    {repo.foto_solucion && (
                                                        <Button size="xs" colorScheme="green" variant="outline" onClick={() => window.open(getImgUrl(repo.foto_solucion), '_blank')}>
                                                            Ver Evidencia
                                                        </Button>
                                                    )}
                                                </VStack>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Container>
                </TabPanel>

                {/* TAB 2: MAPA GLOBAL (Usa puntosMapa) */}
                <TabPanel p={0} h="100%">
                    <Box w="100%" h="100%" position="relative">
                        <MapContainer center={[19.31, -98.88]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {puntosMapa.map((repo) => (
                                (repo.latitud && repo.longitud) && (
                                    <Marker key={repo.id} position={[repo.latitud, repo.longitud]}>
                                        <Popup>
                                            <Text fontWeight="bold">{repo.tipo_problema}</Text>
                                            <Text fontSize="xs">Folio: {repo.folio}</Text>
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

                {/* TAB 3: NOTICIAS */}
                <TabPanel>
                    <Container maxW="container.xl">
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            {noticias.map(n => (
                                <Card key={n.id}>
                                    <CardHeader pb={0}><Heading size="sm" color={COLORS.primary}>{n.titulo}</Heading></CardHeader>
                                    <CardBody><Text fontSize="sm" noOfLines={4}>{n.contenido}</Text></CardBody>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Container>
                </TabPanel>

            </TabPanels>
        </Tabs>
      </Box>

      {/* MODAL SOLICITUD */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva Solicitud</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
                <FormControl><FormLabel>Tipo</FormLabel>
                    <Select value={formData.tipo} onChange={(e)=>setFormData({...formData, tipo: e.target.value})}>
                        <option value="FUGA">Fuga de Agua</option>
                        <option value="ESCASEZ">Falta de Suministro</option>
                        <option value="ALCANTARILLADO">Drenaje/Alcantarilla</option>
                        <option value="CALIDAD">Mala Calidad</option>
                    </Select>
                </FormControl>
                <FormControl><FormLabel>Dirección</FormLabel><Input value={formData.direccion} onChange={(e)=>setFormData({...formData, direccion: e.target.value})} /></FormControl>
                <FormControl><FormLabel>Descripción</FormLabel><Textarea value={formData.desc} onChange={(e)=>setFormData({...formData, desc: e.target.value})} /></FormControl>
                <Box w="full" p={4} bg="gray.50" borderRadius="md" border="1px dashed gray">
                    <Button size="sm" w="full" colorScheme={coords ? "green" : "blue"} onClick={obtenerUbicacion}>
                        {coords ? "Ubicación Guardada" : "Capturar GPS"}
                    </Button>
                </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={submitting}>Registrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* MODAL PERFIL */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mis Datos</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
                <Input placeholder="Nombre" value={editData.first_name} onChange={(e)=>setEditData({...editData, first_name: e.target.value})} />
                <Input placeholder="Colonia" value={editData.colonia} onChange={(e)=>setEditData({...editData, colonia: e.target.value})} />
                <Input placeholder="Teléfono" value={editData.telefono} onChange={(e)=>setEditData({...editData, telefono: e.target.value})} />
            </VStack>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={handleSaveProfile} isLoading={submitting}>Guardar</Button></ModalFooter>
        </ModalContent>
      </Modal>

    </Flex>
  )
}