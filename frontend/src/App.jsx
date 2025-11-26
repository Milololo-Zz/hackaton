import { useState, useEffect } from 'react'
import { Login } from './Login'

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hackatón 2025 - Portal</h1>
      
      {!token ? (
        <Login onLoginSuccess={setToken} />
      ) : (
        <div>
          <h3 style={{ color: 'green' }}>¡Bienvenido! Estás autenticado.</h3>
          <p>Tu Token JWT está guardado y listo para usarse en peticiones.</p>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      )}
    </div>
  )
}

export default App