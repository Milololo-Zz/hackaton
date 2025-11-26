# 🚀 Hackatón 2025 - Proyecto Base

## 📋 Requisitos Previos
1. **Docker Desktop** (Instalado y abierto).
2. **Git** (Instalado).
3. **VS Code**.

## ⚡ Inicio Rápido (Solo la primera vez)
1. Clona el repositorio:
   ```bash
   git clone <URL_DEL_REPO>
   cd hackaton
   ```
2. Levanta el entorno (Backend + Frontend + DB):
   ```bash
   docker compose up --build
   ```
3. Accede a los sitios:
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000/api/
   - **Admin Panel:** http://localhost:8000/admin/
   - **Login JWT:** http://localhost:8000/auth/jwt/create/

## 🔐 Credenciales
- **Superusuario (Admin):**
  - User: `admin`
  - Pass: `admin`

## 🛠️ Comandos Frecuentes

| Acción | Comando |
| :--- | :--- |
| **Encender todo** | `docker compose up` |
| **Apagar todo** | `docker compose down` |
| **Ver logs (Backend)** | `docker compose logs -f backend` |
| **Crear migración** | `docker compose exec backend python manage.py makemigrations` |
| **Aplicar migración** | `docker compose exec backend python manage.py migrate` |
| **Instalar librería (Front)** | `docker compose exec frontend npm install nombre_libreria` |

## ⚠️ Solución de Problemas
- Si la BD falla: `docker compose down -v` (Borra todo) y vuelve a subir.
- Si no hay cambios en Front: Guarda el archivo en VS Code para forzar recarga.
