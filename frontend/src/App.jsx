import { useEffect, useState } from 'react'

function App() {
  const [tareas, setTareas] = useState([])

  useEffect(() => {
    // Peticion al Backend (Django)
    fetch('http://localhost:8000/api/tareas/')
      .then(response => response.json())
      .then(data => setTareas(data))
      .catch(error => console.error('Error fetching data:', error));
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Tareas (Desde Django)</h1>
      
      {tareas.length === 0 ? (
        <p>Cargando tareas...</p>
      ) : (
        <ul>
          {tareas.map(tarea => (
            <li key={tarea.id}>
              <strong>{tarea.titulo}</strong>
              <p>{tarea.descripcion}</p>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App