import { useEffect, useState } from 'react'
import { 
  Box, Flex, Heading, Text, Button, SimpleGrid, 
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  useColorModeValue, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
  FormControl, FormLabel, Select, Textarea, useDisclosure, Input, HStack, Icon
} from '@chakra-ui/react'
import { CheckCircleIcon, TimeIcon, WarningIcon } from '@chakra-ui/icons'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { servicios } from '../api/services'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// Configuración visual de estatus
const STATUS_BADGES = {
  'PENDIENTE': 'red',
  'ASIGNADO': 'blue',
  'EN_PROCESO': 'orange',
  'RESUELTO': 'green',
  'CANCELADO': 'gray'
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [grafica, setGrafica] = useState([])
  const [listaReportes, setListaReportes] = useState([]) // La lista para la tabla
  const [listaPipas, setListaPipas] = useState([])       // Catálogo de Pipas
  
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const bgCard = useColorModeValue('white', 'gray.700')

  // --- ESTADOS PARA GESTIÓN (MODAL) ---
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedReporte, setSelectedReporte] = useState(null)
  const [formGestion, setFormGestion] = useState({
    status: '',
    nota_seguimiento: '',
    pipa_asignada: '',
    foto_solucion: null
  })
  const [saving, setSaving] = useState(false)

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      const [resKpi, resGraf, resRep, resPipas] = await Promise.all([
        servicios.admin.getEstadisticas(),
        servicios.admin.getGraficaSemanal(),
        servicios.reportes.getAll(), // Traemos todos los reportes para la tabla
        servicios.pipas.getAll()     // Traemos las pipas para el select
      ])
      
      setDashboardData(resKpi.data)
      setGrafica(resGraf.data)
      setListaReportes(resRep.data)
      setListaPipas(resPipas.data)

    } catch (error) {
      console.error("Error admin:", error)
      toast.error("Error cargando panel de control")
    } finally {
      setLoading(false)
    }
  }

  // --- ABRIR MODAL DE GESTIÓN ---
  const handleGestionar = (reporte) => {
    setSelectedReporte(reporte)
    // Pre-llenar el formulario con lo que ya tiene el reporte
    setFormGestion({
      status: reporte.status,
      nota_seguimiento: reporte.nota_seguimiento || '',
      pipa_asignada: reporte.pipa_asignada || '', // Si el backend manda ID, esto funciona
      foto_solucion: null
    })
    onOpen()
  }

  // --- GUARDAR CAMBIOS (PATCH) ---
  const handleGuardarGestion = async () => {
    setSaving(true)
    const data = new FormData()
    data.append('status', formGestion.status)
    data.append('nota_seguimiento', formGestion.nota_seguimiento)
    if (formGestion.pipa_asignada) data.append('pipa_asignada', formGestion.pipa_asignada)
    if (formGestion.foto_solucion) data.append('foto_solucion', formGestion.foto_solucion)

    try {
      await servicios.reportes.gestionar(selectedReporte.id, data)
      toast.success(`Folio ${selectedReporte.folio} actualizado correctamente`)
      onClose()
      cargarTodo() // Recargar tabla y gráficas
    } catch (error) {
      toast.error("Error al actualizar el expediente")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !dashboardData) {
    return (
      <Center h="100vh" bg="gray.100">
        <Spinner size="xl" color="blue.800" thickness="4px" />
        <Text ml={4} fontWeight="bold" color="blue.800">Cargando Sistema de Gestión...</Text>
      </Center>
    )
  }

  const stats = dashboardData.kpis
  const topProblema = dashboardData.moda_problema

  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={8} bg="white" p={4} borderRadius="lg" boxShadow="sm">
        <Box>
          <Heading size="lg" color="#691C32">Mesa de Control Operativa</Heading>
          <Text fontSize="sm" color="gray.500">Sistema de Aguas - Gobierno Municipal</Text>
        </Box>
        <Flex gap={4}>
          <Button colorScheme="gray" onClick={() => navigate('/inicio')}>Ir al Mapa Público</Button>
          <Button as="a" href={servicios.admin.urlExportar} bg="#BC955C" color="white" _hover={{ bg: '#9c7b4a' }}>
            📥 Reporte Ejecutivo
          </Button>
        </Flex>
      </Flex>

      {/* 1. KPIs */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mb={8}>
        <StatCard title="Total Expedientes" stat={stats.total_historico} icon="📂" />
        <StatCard title="Pendientes" stat={stats.pendientes_urgentes} icon="🚨" color="red.500" />
        <StatCard title="Concluidos" stat={stats.resueltos} icon="✅" color="green.500" />
        <StatCard title="Falla Recurrente" stat={topProblema.tipo} icon="⚠️" />
      </SimpleGrid>

      {/* 2. TABLA DE GESTIÓN (MESA DE CONTROL) */}
      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden" mb={8}>
        <Flex p={5} borderBottom="1px solid #eee" justify="space-between">
            <Heading size="md" color="gray.700">Bitácora de Solicitudes</Heading>
            <Badge colorScheme="blue" p={1}>EN TIEMPO REAL</Badge>
        </Flex>
        <Box overflowX="auto">
            <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Folio</Th>
                        <Th>Tipo</Th>
                        <Th>Dirección / Ref</Th>
                        <Th>Estatus</Th>
                        <Th>Prioridad</Th>
                        <Th>Acción</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {listaReportes.map(repo => (
                        <Tr key={repo.id} _hover={{ bg: "gray.50" }}>
                            <Td fontWeight="bold">{repo.folio || repo.id}</Td>
                            <Td>{repo.tipo_problema}</Td>
                            <Td maxW="200px" isTruncated>{repo.direccion_texto || 'GPS'}</Td>
                            <Td>
                                <Badge colorScheme={STATUS_BADGES[repo.status]}>{repo.status}</Badge>
                            </Td>
                            <Td>
                                {/* Barra de prioridad visual */}
                                <HStack spacing={1}>
                                    <Box w="30px" h="6px" bg={repo.prioridad > 50 ? 'red.500' : 'green.300'} borderRadius="full" />
                                    <Text fontSize="xs">{repo.prioridad} pts</Text>
                                </HStack>
                            </Td>
                            <Td>
                                <Button size="xs" colorScheme="blue" onClick={() => handleGestionar(repo)}>
                                    Gestionar
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
      </Box>

      {/* 3. GRÁFICAS */}
      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>Tendencia Semanal</Heading>
          <Box h="250px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafica}>
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#691C32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
      </Box>

      {/* === MODAL DE GESTIÓN (LO IMPORTANTE) === */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
            <ModalHeader bg="gray.50">Gestión de Folio: {selectedReporte?.folio}</ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
                <SimpleGrid columns={2} spacing={4} mb={4}>
                    <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">PROBLEMA</Text>
                        <Text>{selectedReporte?.tipo_problema}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">UBICACIÓN</Text>
                        <Text fontSize="sm">{selectedReporte?.direccion_texto || 'Solo GPS'}</Text>
                    </Box>
                    <Box gridColumn="span 2">
                        <Text fontWeight="bold" fontSize="sm" color="gray.500">DESCRIPCIÓN CIUDADANA</Text>
                        <Text p={2} bg="gray.50" borderRadius="md" fontSize="sm">"{selectedReporte?.descripcion}"</Text>
                    </Box>
                </SimpleGrid>

                <hr style={{ margin: '15px 0' }} />

                <FormControl mb={4}>
                    <FormLabel fontWeight="bold" color="#691C32">Nuevo Estatus</FormLabel>
                    <Select 
                        value={formGestion.status} 
                        onChange={(e) => setFormGestion({...formGestion, status: e.target.value})}
                        bg="white" borderColor="gray.300"
                    >
                        <option value="PENDIENTE">Pendiente (Recibido)</option>
                        <option value="ASIGNADO">Asignado a Cuadrilla</option>
                        <option value="EN_PROCESO">En Reparación</option>
                        <option value="RESUELTO">Resuelto (Concluido)</option>
                        <option value="CANCELADO">Improcedente</option>
                    </Select>
                </FormControl>

                <FormControl mb={4}>
                    <FormLabel fontWeight="bold" color="#691C32">Asignar Unidad / Pipa</FormLabel>
                    <Select 
                        placeholder="Seleccione unidad..."
                        value={formGestion.pipa_asignada}
                        onChange={(e) => setFormGestion({...formGestion, pipa_asignada: e.target.value})}
                    >
                        {listaPipas.map(pipa => (
                            <option key={pipa.id} value={pipa.id}>
                                {pipa.numero_economico} - {pipa.chofer || 'Sin Chofer'} ({pipa.estado})
                            </option>
                        ))}
                    </Select>
                    <Text fontSize="xs" color="gray.500">Solo unidades disponibles en sistema.</Text>
                </FormControl>

                <FormControl mb={4}>
                    <FormLabel fontWeight="bold" color="#691C32">Nota de Seguimiento (Bitácora)</FormLabel>
                    <Textarea 
                        placeholder="Escriba la respuesta oficial para el ciudadano..."
                        value={formGestion.nota_seguimiento}
                        onChange={(e) => setFormGestion({...formGestion, nota_seguimiento: e.target.value})}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel fontWeight="bold">Evidencia de Solución (Foto)</FormLabel>
                    <Input type="file" p={1} onChange={(e) => setFormGestion({...formGestion, foto_solucion: e.target.files[0]})} />
                </FormControl>

            </ModalBody>
            <ModalFooter bg="gray.50">
                <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                <Button colorScheme="blue" onClick={handleGuardarGestion} isLoading={saving}>
                    Guardar Cambios
                </Button>
            </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  )
}

// Componente simple para tarjetas
function StatCard({ title, stat, icon, color }) {
  return (
    <Box bg="white" p={5} borderRadius="lg" boxShadow="sm" borderLeft="4px solid" borderColor={color || 'gray.300'}>
      <Flex justify="space-between">
        <Box>
          <Text fontSize="sm" color="gray.500" fontWeight="bold" textTransform="uppercase">{title}</Text>
          <Heading size="lg" color="gray.700">{stat ?? '-'}</Heading>
        </Box>
        <Text fontSize="3xl">{icon}</Text>
      </Flex>
    </Box>
  )
}