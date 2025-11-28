from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
# Importamos TODOS los modelos nuevos
from .models import Reporte, PerfilCiudadano, Noticia, Pozo, Pipa, Validacion

# 1. Configuración de PIPAS (Nuevo)
@admin.register(Pipa)
class PipaAdmin(GISModelAdmin):
    list_display = ('numero_economico', 'estado', 'chofer', 'capacidad_litros')
    list_filter = ('estado',)
    search_fields = ('numero_economico', 'chofer')
    # Mapa para ver ubicación de la pipa (si tuviera GPS real)
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }

# 2. Configuración de REPORTES (Actualizado con Folio y Pipas)
@admin.register(Reporte)
class ReporteAdmin(GISModelAdmin):
    # Columnas que se ven en la lista
    list_display = ('folio', 'tipo_problema', 'status', 'prioridad', 'pipa_asignada', 'fecha_hora')
    
    # Filtros laterales
    list_filter = ('status', 'tipo_problema', 'prioridad')
    
    # Barra de búsqueda (Busca por folio o descripción)
    search_fields = ('folio', 'descripcion', 'direccion_texto')
    
    # Orden
    ordering = ('-fecha_hora',)
    
    # Configuración del Mapa
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }

# 3. Configuración del PERFIL dentro del Usuario
class PerfilInline(admin.StackedInline):
    model = PerfilCiudadano
    can_delete = False
    verbose_name_plural = 'Perfil Ciudadano'

# Re-registramos el User para que muestre el perfil ahí mismo
admin.site.unregister(User)
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (PerfilInline,)
    list_display = ('username', 'email', 'is_staff', 'get_colonia')

    # Truco para ver la colonia en la lista de usuarios
    def get_colonia(self, instance):
        return instance.perfil.colonia
    get_colonia.short_description = 'Colonia'

# 4. Configuración de NOTICIAS
@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fecha_publicacion', 'activa')
    list_filter = ('activa', 'fecha_publicacion')
    search_fields = ('titulo', 'contenido')

# 5. Configuración de POZOS
@admin.register(Pozo)
class PozoAdmin(GISModelAdmin):
    list_display = ('nombre', 'estado', 'profundidad')
    list_filter = ('estado',)
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }

# 6. Configuración de VALIDACIONES (Solo lectura recomendada)
@admin.register(Validacion)
class ValidacionAdmin(admin.ModelAdmin):
    list_display = ('reporte', 'usuario', 'fecha_voto')