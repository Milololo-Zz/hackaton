import { useEffect, useState } from 'react'
import { 
  Box, Grid, Heading, Text, Flex, Button, SimpleGrid, 
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  useColorModeValue, Spinner, Center
} from '@chakra-ui/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { servicios } from '../api/services'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  // Renombramos 'kpis' a 'dashboardData' para evitar confusión
  const [dashboardData, setDashboardData] = useState(null)
  const [grafica, setGrafica] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const bgCard = useColorModeValue('white', 'gray.700')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const resKpi = await servicios.admin.getEstadisticas()
      console.log("Datos recibidos del Admin:", resKpi.data) // Para depurar
      setDashboardData(resKpi.data)
      
      const resGraf = await servicios.admin.getGraficaSemanal()
      setGrafica(resGraf.data)
    } catch (error) {
      console.error("Error cargando admin:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- PROTECCIÓN CONTRA PANTALLAZO GRIS ---
  if (loading || !dashboardData) {
    return (
      <Center h="100vh" bg="gray.100">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} color="gray.500">Cargando Inteligencia Operativa...</Text>
      </Center>
    )
  }

  // CORRECCIÓN: Aquí es donde fallaba.
  // Tu backend devuelve un objeto { kpis: {...}, moda_problema: {...} }
  // Antes buscábamos "resumen", ahora buscamos "kpis".
  const stats = dashboardData.kpis; 
  const topProblema = dashboardData.moda_problema;

  return (
    <Box minH="100vh" bg="gray.100" p={8}>
      
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading color="blue.700">Panel de Control Gubernamental</Heading>
          <Text color="gray.500">Inteligencia Operativa en Tiempo Real</Text>
        </Box>
        <Flex gap={4}>
          <Button colorScheme="gray" onClick={() => navigate('/inicio')}>Ver Mapa Operativo</Button>
          <Button as="a" href={servicios.admin.urlExportar} colorScheme="green">
            📥 Descargar Excel Semanal
          </Button>
        </Flex>
      </Flex>

      {/* 1. KPIs (USANDO LA VARIABLE CORRECTA 'stats') */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={5} mb={8}>
        <StatCard title="Total Histórico" stat={stats.total_historico} icon="📂" />
        <StatCard title="Fugas Activas" stat={stats.pendientes_urgentes} icon="🚨" color="red.500" />
        <StatCard title="Resueltos" stat={stats.resueltos} icon="✅" color="green.500" />
        <StatCard title="Problema Top" stat={topProblema.tipo} icon="⚠️" />
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={8}>
        <Box bg={bgCard} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>Tendencia de Reportes (7 Días)</Heading>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafica}>
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3182ce" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box bg={bgCard} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>Eficiencia Operativa</Heading>
          <Stat>
            <StatLabel>Tasa de Resolución</StatLabel>
            <StatNumber fontSize="4xl">{stats.tasa_resolucion}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              Calculado en tiempo real
            </StatHelpText>
          </Stat>
          <Text mt={4} fontSize="sm" color="gray.500">
            Datos basados en validaciones vecinales y cierres de tickets.
          </Text>
        </Box>
      </Grid>
    </Box>
  )
}

function StatCard({ title, stat, icon, color }) {
  return (
    <Box bg="white" p={5} borderRadius="lg" boxShadow="sm">
      <Flex justify="space-between">
        <Box>
          <Text fontSize="sm" color="gray.500">{title}</Text>
          <Heading size="lg" color={color || 'gray.800'}>{stat ?? '-'}</Heading>
        </Box>
        <Text fontSize="3xl">{icon}</Text>
      </Flex>
    </Box>
  )
}