from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Reporte

@admin.register(Reporte)
class ReporteAdmin(GISModelAdmin):
    # Columnas de la tabla
    list_display = ('tipo_problema', 'status', 'fecha_hora')
    
    # Filtros y búsqueda
    list_filter = ('status', 'tipo_problema')
    search_fields = ('descripcion',)

    # Configuración del mapa (OpenLayers)
    # Centrado en Ixtapaluca
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -98.88,
            'default_lat': 19.31,
            'default_zoom': 12,
        },
    }