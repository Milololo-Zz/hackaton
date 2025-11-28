from django.contrib.gis.db import models
from django.contrib.auth.models import User  # <--- IMPORT NECESARIO PARA EL USUARIO

class Reporte(models.Model):
    # Opciones (Tal cual las definieron ustedes)
    TIPOS_PROBLEMA = [
        ('FUGA', 'Fuga de Agua'),
        ('ESCASEZ', 'Escasez / No hay agua'),
        ('CALIDAD', 'Mala Calidad / Agua Sucia'),
        ('OTRO', 'Otro'),
    ]

    STATUS_OPCIONES = [
        ('PENDIENTE', 'Pendiente'),
        ('REVISADO', 'Revisado'),
        ('RESUELTO', 'Resuelto'),
    ]

    # --- Campos Originales (GeoDjango) ---
    ubicacion = models.PointField(srid=4326)
    tipo_problema = models.CharField(max_length=20, choices=TIPOS_PROBLEMA)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='reportes/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_OPCIONES, default='PENDIENTE')
    fecha_hora = models.DateTimeField(auto_now_add=True)

    # --- CAMPOS NUEVOS (AGREGADOS PARA LÓGICA ANTI-BUZÓN) ---
    # 1. Relación con Usuario: Para que aparezca en "Mi Perfil"
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reportes')
    
    # 2. Inteligencia: Para calcular urgencia automática
    validaciones = models.IntegerField(default=0, help_text="Vecinos que confirman")
    prioridad = models.IntegerField(default=0, help_text="Nivel de urgencia calculado")

    # Configuración visual
    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"
        # Ordenamos por prioridad (lo más urgente arriba)
        ordering = ['-prioridad', '-fecha_hora']

    def __str__(self):
        return f"[{self.prioridad}] {self.tipo_problema} - {self.status}"


# --- NUEVO MODELO: VALIDACIÓN (Botón Confirmar) ---
class Validacion(models.Model):
    reporte = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name='votos')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_voto = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Regla de Oro: Un usuario solo puede votar 1 vez por reporte
        unique_together = ('reporte', 'usuario')
        verbose_name = "Validación Vecinal"
        verbose_name_plural = "Validaciones Vecinales"

    def __str__(self):
        return f"{self.usuario.username} validó reporte {self.reporte.id}"

    # AUTOMATIZACIÓN: Al guardar, subimos la prioridad del reporte
    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None
        super().save(*args, **kwargs)
        
        if es_nuevo:
            # Aumentamos contador y prioridad
            self.reporte.validaciones += 1
            self.reporte.prioridad += 10  # Cada vecino suma 10 puntos de urgencia
            
            # Si tiene 5 votos, cambia a REVISADO solo
            if self.reporte.validaciones >= 5 and self.reporte.status == 'PENDIENTE':
                self.reporte.status = 'REVISADO'
            
            self.reporte.save()

class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    imagen = models.ImageField(upload_to='noticias/', blank=True, null=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Noticia"
        verbose_name_plural = "Noticias"
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.titulo