from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
# IMPORTANTE: Importamos los 4 modelos aquí
from .models import Reporte, PerfilCiudadano, Noticia, Pozo

# 1. Configuración del Mapa de Reportes
@admin.register(Reporte)
class ReporteAdmin(GISModelAdmin):
    list_display = ('tipo_problema', 'status', 'fecha_hora')
    list_filter = ('status', 'tipo_problema')
    search_fields = ('descripcion',)
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }

# 2. Configuración del Perfil dentro del Usuario
class PerfilInline(admin.StackedInline):
    model = PerfilCiudadano
    can_delete = False
    verbose_name_plural = 'Perfil Ciudadano'

# Des-registramos el usuario base y ponemos el nuestro modificado
admin.site.unregister(User)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (PerfilInline,)

# 3. Configuración de Noticias
@admin.register(Noticia)
class NoticiaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fecha_publicacion', 'activa')
    list_filter = ('activa', 'fecha_publicacion')
    search_fields = ('titulo', 'contenido')

# 4. Configuración de Pozos (Infraestructura)
@admin.register(Pozo)
class PozoAdmin(GISModelAdmin):
    list_display = ('nombre', 'estado', 'profundidad')
    list_filter = ('estado',)
    search_fields = ('nombre', 'notas')
    
    # Mapa centrado en Ixtapaluca
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }