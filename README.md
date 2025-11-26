# 🚀 Hackatón 2025 - Proyecto Base (Full Stack)

## 📋 Requisitos Previos
1. **Docker Desktop** (Instalado y abierto).
2. **Git** (Instalado).
3. **VS Code** (Recomendado).

## ⚡ Inicio Rápido (Para todos)
1. **Clona el repositorio:**
   ```bash
   git clone <URL_DEL_REPO>
   cd hackaton
   ```
2. **Enciende la fábrica (Levanta todo):**
   ```bash
   docker compose up --build
   ```
   *(La primera vez tardará unos minutos. Espera a que termine).*

3. **Accede a los sitios:**
   - 🎨 **Frontend (React):** http://localhost:5173
   - ⚙️ **Backend API:** http://localhost:8000/api/
   - 🛡️ **Admin Panel:** http://localhost:8000/admin/
   - 🔑 **Login JWT:** http://localhost:8000/auth/jwt/create/

## 🔐 Credenciales Maestras
- **Superusuario (Admin):**
  - User: `admin`
  - Pass: `admin`

---

## 🛠️ Guía de Comandos (Copia y Pega)

### 🌍 Comandos Generales (DevOps)
| Acción | Comando |
| :--- | :--- |
| **Encender todo** | `docker compose up` |
| **Encender en segundo plano** | `docker compose up -d` |
| **Apagar todo** | `docker compose down` |
| **Borrar todo (Reset BD)** | `docker compose down -v` (¡Cuidado! Borra datos) |

### 🐍 Equipo Backend (Django)
| Acción | Comando |
| :--- | :--- |
| **Crear Migración** | `docker compose exec backend python manage.py makemigrations` |
| **Aplicar Migración** | `docker compose exec backend python manage.py migrate` |
| **Crear Superusuario** | `docker compose exec backend python manage.py createsuperuser` |
| **Ver Logs (Errores)** | `docker compose logs -f backend` |
| **Instalar Librería** | 1. Agregala a `requirements.txt` <br> 2. `docker compose up -d --build backend` |

### ⚛️ Equipo Frontend (React)
| Acción | Comando |
| :--- | :--- |
| **Instalar Librería** | `docker compose exec frontend npm install nombre_libreria` <br> *(Ej: axios, framer-motion, react-icons)* |
| **Ver Logs (Consola)** | `docker compose logs -f frontend` |
| **Reiniciar (Si falla)** | `docker compose restart frontend` |
| **Error "Network/CORS"** | Revisa que el Backend esté corriendo en el puerto 8000. |

## 🆘 Solución de Problemas Comunes
1. **"No veo mis cambios en React":**
   - Asegúrate de haber guardado el archivo en VS Code (`Ctrl + S`).
2. **"La base de datos da error":**
   - Si acabas de clonar, ejecuta: `docker compose exec backend python manage.py migrate`.
3. **"No puedo instalar paquetes npm":**
   - Usa siempre el comando de docker (`exec frontend npm install`), no uses `npm install` directo en tu Windows/Mac.
