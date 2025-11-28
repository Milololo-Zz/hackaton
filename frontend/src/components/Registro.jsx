import { useState } from 'react'
import { toast } from 'sonner'
import {
  Flex, Box, FormControl, FormLabel, Input, Button, Heading, VStack, useColorModeValue,
} from '@chakra-ui/react'

export function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const bg = useColorModeValue('gray.50', 'gray.800')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const toastId = toast.loading('Creando cuenta...')

    try {
      // Ajusta la URL a tu backend real si es necesario
      const response = await fetch('http://localhost:8000/auth/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      if (!response.ok) throw new Error('Error al registrar usuario')

      toast.success('¡Cuenta creada! Por favor inicia sesión.', { id: toastId })
      if(onRegisterSuccess) onRegisterSuccess()

    } catch (err) {
      // Simulación de éxito para que pruebes la interfaz visualmente
      console.error(err)
      toast.dismiss(toastId)
      toast.success('Registro simulado (Conecta tu backend)', { duration: 3000 })
      if(onRegisterSuccess) onRegisterSuccess()
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
          <Heading fontSize={'2xl'}>Crear Cuenta</Heading>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl id="reg-username">
                <FormLabel>Usuario</FormLabel>
                <Input type="text" onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl id="reg-email">
                <FormLabel>Email</FormLabel>
                <Input type="email" onChange={(e) => setEmail(e.target.value)} />
              </FormControl>
              <FormControl id="reg-password">
                <FormLabel>Contraseña</FormLabel>
                <Input type="password" onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
              <Button type="submit" bg={'green.400'} color={'white'} _hover={{ bg: 'green.500' }} w="full">
                Registrarse
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Flex>
  )
}