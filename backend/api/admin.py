from django.contrib import admin
from .models import Tarea

# Registrar el modelo para que aparezca en el panel
admin.site.register(Tarea)