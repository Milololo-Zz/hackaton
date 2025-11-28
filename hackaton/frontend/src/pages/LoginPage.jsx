import { useState } from 'react'
import { toast } from 'sonner'
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

export function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const bg = useColorModeValue('gray.50', 'gray.800')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const toastId = toast.loading('Verificando credenciales...')

    try {
      const response = await fetch('http://localhost:8000/auth/jwt/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      
      toast.success('¡Bienvenido de nuevo!', { id: toastId })
      onLoginSuccess(data.access)

    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={bg}>
      <Box
        rounded={'lg'}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={'lg'}
        p={8}
        maxW={'md'}
        w={'full'}>
        <VStack spacing={4}>
          <Heading fontSize={'2xl'}>Iniciar Sesión</Heading>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl id="username">
                <FormLabel>Usuario</FormLabel>
                <Input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>Contraseña</FormLabel>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </FormControl>
              <Button
                type="submit"
                bg={'blue.400'}
                color={'white'}
                _hover={{ bg: 'blue.500' }}
                w="full">
                Entrar
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Flex>
  )
}
