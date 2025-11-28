import {
  Box,
  Flex,
  Button,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useColorModeValue,
  Text,
  useDisclosure
} from '@chakra-ui/react'

// IMPORTANTE: Ruta ajustada según tu imagen
import { Login } from '../pages/LoginPage' 
import { Register } from './Register'

export const Navbar = ({ token, onLoginSuccess, onLogout }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200')
  const popoverBg = useColorModeValue('white', 'gray.800')

  const { onClose: onCloseLogin, isOpen: isOpenLogin, onOpen: onOpenLogin } = useDisclosure()
  const { onClose: onCloseReg, isOpen: isOpenReg, onOpen: onOpenReg } = useDisclosure()

  // Estilo para forzar que el Login (que es pantalla completa) quepa en la cajita
  const formWrapperStyle = {
    "& > div": { 
      minHeight: "auto !important", 
      background: "transparent !important",
      padding: "0 !important"
    },
    "& > div > div": {
      boxShadow: "none !important", 
      width: "100%"
    }
  }

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        justify={'space-between'}>

        <Text fontWeight="bold" fontSize="xl" color="teal.500">
          Mi App
        </Text>

        <Stack direction={'row'} spacing={4}>
          {token ? (
            <Button size="sm" onClick={onLogout} colorScheme="red" variant="ghost">
              Cerrar Sesión
            </Button>
          ) : (
            <>
              {/* BOTÓN LOGIN */}
              <Popover placement="bottom-end" isOpen={isOpenLogin} onClose={onCloseLogin} onOpen={onOpenLogin}>
                <PopoverTrigger>
                  <Button size="sm" variant="ghost" color={linkColor}>
                    Iniciar Sesión
                  </Button>
                </PopoverTrigger>
                <PopoverContent bg={popoverBg} w="350px" boxShadow="xl">
                  <PopoverArrow />
                  <PopoverCloseButton zIndex={10} />
                  <PopoverBody p={0}>
                    <Box sx={formWrapperStyle} p={4}>
                      <Login onLoginSuccess={(t) => { onLoginSuccess(t); onCloseLogin(); }} />
                    </Box>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              {/* BOTÓN REGISTRO */}
              <Popover placement="bottom-end" isOpen={isOpenReg} onClose={onCloseReg} onOpen={onOpenReg}>
                <PopoverTrigger>
                  <Button size="sm" bg="teal.400" color="white" _hover={{ bg: 'teal.500' }}>
                    Registro
                  </Button>
                </PopoverTrigger>
                <PopoverContent bg={popoverBg} w="350px" boxShadow="xl">
                  <PopoverArrow />
                  <PopoverCloseButton zIndex={10} />
                  <PopoverBody p={0}>
                    <Box sx={formWrapperStyle} p={4}>
                      <Register onRegisterSuccess={() => { onCloseReg(); onOpenLogin(); }} />
                    </Box>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </>
          )}
        </Stack>
      </Flex>
    </Box>
  )
}