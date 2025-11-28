import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  Spacer,
  Button,
  Input,
  Stack,
  Text,
  Heading,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  FormControl,
  FormLabel,
  Portal 
} from '@chakra-ui/react'

// AÑADIDO: Ahora aceptamos también 'onRegisterSuccess' como prop
export function Login({ onLoginSuccess, onRegisterSuccess }) {
  
  // --- ESTADOS DE LOGIN ---
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // --- ESTADOS DE REGISTRO ---
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const navigate = useNavigate()
  const cardBg = useColorModeValue('white', 'gray.700')

  // --- LÓGICA DE LOGIN (Se mantiene igual) ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    const toastId = toast.loading('Verificando credenciales...')

    try {
      const response = await fetch('http://localhost:8000/auth/jwt/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) throw new Error('Usuario o contraseña incorrectos')

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      
      toast.success('¡Bienvenido!', { id: toastId })
      
      if (onLoginSuccess) onLoginSuccess(data.access)
      navigate('/inicio') 

    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  // --- LÓGICA DE REGISTRO (TRAÍDA DEL SEGUNDO CÓDIGO) ---
  const handleRegister = async (e) => {
    e.preventDefault()
    const toastId = toast.loading('Creando cuenta...')

    try {
        // Petición al backend
        const response = await fetch('http://localhost:8000/auth/users/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Usamos las variables de estado 'reg...' que definimos arriba
            body: JSON.stringify({ 
                username: regUsername, 
                email: regEmail, 
                password: regPassword 
            })
        })

        if (!response.ok) throw new Error('Error al registrar usuario')

        // Éxito real
        toast.success('¡Cuenta creada! Por favor inicia sesión.', { id: toastId })
        
        // Limpiar campos
        setRegUsername('')
        setRegEmail('')
        setRegPassword('')

        // Ejecutar callback si existe
        if(onRegisterSuccess) onRegisterSuccess()

    } catch (err) {
        // --- SIMULACIÓN DEL SEGUNDO CÓDIGO ---
        // Si falla (ej. backend apagado), mostramos éxito simulado como pediste
        console.error(err)
        toast.dismiss(toastId)
        toast.success('Registro simulado (Conecta tu backend)', { duration: 3000 })
        
        if(onRegisterSuccess) onRegisterSuccess()
    }
  }

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, blue.400, cyan.300)" 
    >
      
      {/* BARRA DE NAVEGACIÓN */}
      <Flex 
        as="nav" 
        align="center" 
        justify="space-between" 
        wrap="wrap" 
        padding="1rem"
        bg="whiteAlpha.200" 
        backdropFilter="blur(10px)" 
        color="white"
        boxShadow="sm"
      >
        {/* LOGO */}
        <Flex align="center" mr={5} cursor="pointer" onClick={() => navigate('/')}>
            <Text fontSize="2xl" mr={2}>💧</Text>
            <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
              Ixtapaluca Water
            </Heading>
        </Flex>

        <Spacer />

        <Stack direction={'row'} spacing={4}>
            
          {/* --- LOGIN DROPDOWN --- */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button 
                variant={'solid'} 
                bg="white"
                color="blue.500"
                _hover={{ bg: 'gray.100' }}
              >
                Iniciar Sesión
              </Button>
            </PopoverTrigger>
            
            <Portal>
                <PopoverContent bg={cardBg} color="gray.800" minW={{ base: "100%", md: "350px" }} boxShadow="xl">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="bold" borderBottomWidth="1px">Acceso Administrativo</PopoverHeader>
                <PopoverBody p={6}>
                    
                    <form onSubmit={handleSubmit}>
                    <Stack spacing={4}>
                        <FormControl id="username">
                        <FormLabel>Usuario</FormLabel>
                        <Input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="Ej. admin"
                        />
                        </FormControl>
                        
                        <FormControl id="password">
                        <FormLabel>Contraseña</FormLabel>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                        />
                        </FormControl>
                        
                        <Button
                        type="submit"
                        bg={'blue.500'}
                        color={'white'}
                        _hover={{ bg: 'blue.600' }}
                        w="full"
                        >
                        Entrar
                        </Button>
                    </Stack>
                    </form>

                </PopoverBody>
                </PopoverContent>
            </Portal>
          </Popover>

          {/* --- REGISTRO DROPDOWN --- */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button 
                variant={'ghost'} 
                color="white"
                _hover={{ bg: 'whiteAlpha.300' }}
              >
                Registrarse
              </Button>
            </PopoverTrigger>
            <Portal>
                <PopoverContent bg={cardBg} color="gray.800" minW={{ base: "100%", md: "350px" }} boxShadow="xl">
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader fontWeight="bold">Nuevo Usuario</PopoverHeader>
                    <PopoverBody p={6}>
                        
                        <form onSubmit={handleRegister}>
                            <Stack spacing={4}>
                                <FormControl id="reg-username" isRequired>
                                    <FormLabel>Usuario</FormLabel>
                                    <Input 
                                        type="text" 
                                        value={regUsername}
                                        onChange={(e) => setRegUsername(e.target.value)} 
                                    />
                                </FormControl>

                                <FormControl id="reg-email" isRequired>
                                    <FormLabel>Email</FormLabel>
                                    <Input 
                                        type="email" 
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)} 
                                    />
                                </FormControl>

                                <FormControl id="reg-password" isRequired>
                                    <FormLabel>Contraseña</FormLabel>
                                    <Input 
                                        type="password" 
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)} 
                                    />
                                </FormControl>

                                <Button 
                                    type="submit" 
                                    bg={'green.400'} 
                                    color={'white'} 
                                    _hover={{ bg: 'green.500' }} 
                                    w="full"
                                >
                                    Registrarse
                                </Button>
                            </Stack>
                        </form>

                    </PopoverBody>
                </PopoverContent>
            </Portal>
          </Popover>

        </Stack>
      </Flex>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <Box p={4} color="white">
        <Text fontSize="xl" fontWeight="bold">Bienvenido al sistema de reportes de agua.</Text>
        <Text>Usa el menú superior para acceder.</Text>
      </Box>

    </Box>
  )
}