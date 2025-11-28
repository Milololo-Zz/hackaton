import { useEffect, useState } from 'react'
import { 
  Box, Flex, Heading, Text, Button, SimpleGrid, 
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  useColorModeValue, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  FormControl, FormLabel, Select, Textarea, useDisclosure, Input, HStack, Icon,
  Tabs, TabList, TabPanels, Tab, TabPanel, Tag, Avatar, Image
} from '@chakra-ui/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { servicios } from '../api/services'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// Configuración visual
const STATUS_BADGES = {
  'PENDIENTE': 'red',
  'ASIGNADO': 'blue',
  'EN_PROCESO': 'orange',
  'RESUELTO': 'green',
  'CANCELADO': 'gray'
}

const PIPA_STATUS = {
  'DISPONIBLE': { color: 'green', label: 'Disponible' },
  'EN_RUTA': { color: 'blue', label: 'En Ruta / Trabajando' },
  'TALLER': { color: 'red', label: 'Mantenimiento' },
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [grafica, setGrafica] = useState([])
  const [listaReportes, setListaReportes] = useState([]) 
  const [listaPipas, setListaPipas] = useState([])       
  
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  // --- ESTADOS PARA GESTIÓN ---
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedReporte, setSelectedReporte] = useState(null)
  const [formGestion, setFormGestion] = useState({
    status: '', nota_seguimiento: '', pipa_asignada: '', foto_solucion: null
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    try {
      const [resKpi, resGraf, resRep, resPipas] = await Promise.all([
        servicios.admin.getEstadisticas(),
        servicios.admin.getGraficaSemanal(),
        servicios.reportes.getAll(), 
        servicios.pipas.getAll()     
      ])
      setDashboardData(resKpi.data)
      setGrafica(resGraf.data)
      setListaReportes(resRep.data)
      setListaPipas(resPipas.data)
    } catch (error) {
      toast.error("Error cargando panel")
    } finally {
      setLoading(false)
    }
  }

  const handleGestionar = (reporte) => {
    setSelectedReporte(reporte)
    setFormGestion({
      status: reporte.status,
      nota_seguimiento: reporte.nota_seguimiento || '',
      pipa_asignada: reporte.pipa_asignada || '', 
      foto_solucion: null
    })
    onOpen()
  }

  const handleGuardarGestion = async () => {
    setSaving(true)
    const data = new FormData()
    data.append('status', formGestion.status)
    data.append('nota_seguimiento', formGestion.nota_seguimiento)
    if (formGestion.pipa_asignada) data.append('pipa_asignada', formGestion.pipa_asignada)
    if (formGestion.foto_solucion) data.append('foto_solucion', formGestion.foto_solucion)

    try {
      await servicios.reportes.gestionar(selectedReporte.id, data)
      toast.success(`Folio ${selectedReporte.folio} actualizado`)
      onClose()
      cargarTodo() 
    } catch (error) {
      toast.error("Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  // Helper para imágenes
  const getImgUrl = (url) => url ? (url.startsWith('http') ? url : `http://localhost:8000${url}`) : null

  if (loading || !dashboardData) {
    return (
      <Center h="100vh" bg="gray.100"><Spinner size="xl" color="blue.800" /><Text ml={4}>Cargando...</Text></Center>
    )
  }

  const stats = dashboardData.kpis

  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={8} bg="white" p={4} borderRadius="lg" boxShadow="sm">
        <Box>
          <Heading size="lg" color="#691C32">Mesa de Control Operativa</Heading>
          <Text fontSize="sm" color="gray.500">Sistema de Aguas - Gobierno Municipal</Text>
        </Box>
        <Flex gap={4}>
          <Button colorScheme="gray" onClick={() => navigate('/inicio')}>Ir a Vista Ciudadana</Button>
          <Button as="a" href={servicios.admin.urlExportar} bg="#BC955C" color="white" _hover={{ bg: '#9c7b4a' }}>📥 Reporte Ejecutivo</Button>
        </Flex>
      </Flex>

      {/* KPIS */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mb={8}>
        <StatCard title="Total Expedientes" stat={stats.total_historico} icon="📂" />
        <StatCard title="Pendientes" stat={stats.pendientes_urgentes} icon="🚨" color="red.500" />
        <StatCard title="Concluidos" stat={stats.resueltos} icon="✅" color="green.500" />
        <StatCard title="Falla Recurrente" stat={dashboardData.moda_problema.tipo} icon="⚠️" />
      </SimpleGrid>

      {/* TABS DE GESTIÓN */}
      <Tabs variant="enclosed" colorScheme="blue" bg="white" borderRadius="lg" boxShadow="sm">
        <TabList px={4} pt={4}>
            <Tab fontWeight="bold">🗺️ Mapa Táctico</Tab>
            <Tab fontWeight="bold">📋 Lista de Solicitudes</Tab>
            <Tab fontWeight="bold">🚚 Parque Vehicular</Tab>
            <Tab fontWeight="bold">📊 Estadísticas</Tab>
        </TabList>

        <TabPanels>
            {/* PANEL 1: MAPA TÁCTICO (NUEVO) */}
            <TabPanel p={0} h="500px">
                <MapContainer center={[19.31, -98.88]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {listaReportes.map((repo) => (
                        (repo.latitud && repo.longitud) && (
                            <Marker key={repo.id} position={[repo.latitud, repo.longitud]}>
                                <Popup>
                                    <Box minW="200px">
                                        <Badge colorScheme={STATUS_BADGES[repo.status]} mb={2}>{repo.status}</Badge>
                                        <Text fontWeight="bold" fontSize="sm">Folio: {repo.folio}</Text>
                                        <Text fontSize="xs">{repo.tipo_problema}</Text>
                                        <Text fontSize="xs" color="gray.500" mb={2}>{repo.direccion_texto}</Text>
                                        <Button size="xs" colorScheme="blue" w="full" onClick={() => handleGestionar(repo)}>
                                            Gestionar / Asignar
                                        </Button>
                                    </Box>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>
            </TabPanel>

            {/* PANEL 2: TABLA */}
            <TabPanel>
                <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50"><Tr><Th>Folio</Th><Th>Tipo</Th><Th>Estatus</Th><Th>Pipa</Th><Th>Acción</Th></Tr></Thead>
                        <Tbody>
                            {listaReportes.map(repo => (
                                <Tr key={repo.id}>
                                    <Td fontWeight="bold">{repo.folio}</Td>
                                    <Td>{repo.tipo_problema}</Td>
                                    <Td><Badge colorScheme={STATUS_BADGES[repo.status]}>{repo.status}</Badge></Td>
                                    <Td>{repo.pipa_asignada ? <Tag size="sm" colorScheme="purple">🚛 Asignada</Tag> : '-'}</Td>
                                    <Td><Button size="xs" colorScheme="blue" onClick={() => handleGestionar(repo)}>Gestionar</Button></Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </TabPanel>

            {/* PANEL 3: PIPAS */}
            <TabPanel>
                <Table variant="striped" size="sm">
                    <Thead><Tr><Th>Unidad</Th><Th>Chofer</Th><Th>Estado</Th></Tr></Thead>
                    <Tbody>
                        {listaPipas.map(pipa => (
                            <Tr key={pipa.id}>
                                <Td fontWeight="bold">{pipa.numero_economico}</Td>
                                <Td>{pipa.chofer || 'Sin Chofer'}</Td>
                                <Td><Badge colorScheme={PIPA_STATUS[pipa.estado]?.color}>{pipa.estado}</Badge></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TabPanel>

            {/* PANEL 4: GRÁFICAS */}
            <TabPanel>
                <Box h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={grafica}><XAxis dataKey="fecha" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#691C32" /></BarChart>
                    </ResponsiveContainer>
                </Box>
            </TabPanel>
        </TabPanels>
      </Tabs>

      {/* MODAL GESTION */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>Gestión de Folio: {selectedReporte?.folio}</ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
                <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Box><Text fontWeight="bold" fontSize="xs" color="gray.500">PROBLEMA</Text><Text>{selectedReporte?.tipo_problema}</Text></Box>
                    <Box><Text fontWeight="bold" fontSize="xs" color="gray.500">UBICACIÓN</Text><Text fontSize="sm">{selectedReporte?.direccion_texto}</Text></Box>
                </SimpleGrid>
                <FormControl mb={4}>
                    <FormLabel>Nuevo Estatus</FormLabel>
                    <Select value={formGestion.status} onChange={(e) => setFormGestion({...formGestion, status: e.target.value})}>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="ASIGNADO">Asignado a Cuadrilla</option>
                        <option value="EN_PROCESO">En Reparación</option>
                        <option value="RESUELTO">Resuelto</option>
                        <option value="CANCELADO">Improcedente</option>
                    </Select>
                </FormControl>
                <FormControl mb={4}>
                    <FormLabel>Asignar Pipa</FormLabel>
                    <Select placeholder="Sin asignación..." value={formGestion.pipa_asignada} onChange={(e) => setFormGestion({...formGestion, pipa_asignada: e.target.value})}>
                        {listaPipas.map(pipa => <option key={pipa.id} value={pipa.id}>{pipa.numero_economico} ({pipa.estado})</option>)}
                    </Select>
                </FormControl>
                <FormControl mb={4}>
                    <FormLabel>Nota de Seguimiento</FormLabel>
                    <Textarea value={formGestion.nota_seguimiento} onChange={(e) => setFormGestion({...formGestion, nota_seguimiento: e.target.value})} />
                </FormControl>
                <FormControl>
                    <FormLabel>Evidencia Solución</FormLabel>
                    <Input type="file" p={1} onChange={(e) => setFormGestion({...formGestion, foto_solucion: e.target.files[0]})} />
                </FormControl>
            </ModalBody>
            <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                <Button colorScheme="blue" onClick={handleGuardarGestion} isLoading={saving}>Guardar</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

function StatCard({ title, stat, icon, color }) {
  return (
    <Box bg="white" p={5} borderRadius="lg" boxShadow="sm" borderLeft="4px solid" borderColor={color || 'gray.300'}>
      <Flex justify="space-between">
        <Box><Text fontSize="sm" color="gray.500" fontWeight="bold">{title}</Text><Heading size="lg" color="gray.700">{stat ?? '-'}</Heading></Box>
        <Text fontSize="3xl">{icon}</Text>
      </Flex>
    </Box>
  )
}