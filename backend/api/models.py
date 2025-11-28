import uuid
from django.contrib.gis.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

# ---------------------------------------------------------------------
# MODELO NUEVO: PIPA / UNIDAD (Para gestión de recursos)
# ---------------------------------------------------------------------
class Pipa(models.Model):
    ESTADOS_PIPA = [
        ('DISPONIBLE', '🟢 Disponible'),
        ('EN_RUTA', '🚚 En Ruta / Trabajando'),
        ('TALLER', '🔴 En Mantenimiento'),
    ]
    
    numero_economico = models.CharField(max_length=50, unique=True, help_text="Ej. PIPA-04")
    capacidad_litros = models.IntegerField(default=10000)
    chofer = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_PIPA, default='DISPONIBLE')
    ubicacion_actual = models.PointField(srid=4326, null=True, blank=True) # Para rastreo GPS futuro

    def __str__(self):
        return f"{self.numero_economico} ({self.get_estado_display()})"

# ---------------------------------------------------------------------
# MODELO: REPORTE (Actualizado con Pipa)
# ---------------------------------------------------------------------
class Reporte(models.Model):
    folio = models.CharField(max_length=10, unique=True, editable=False, null=True)
    
    TIPOS_PROBLEMA = [
        ('FUGA', 'Fuga de Agua'),
        ('ESCASEZ', 'Escasez / No hay agua'),
        ('CALIDAD', 'Mala Calidad / Agua Sucia'),
        ('ALCANTARILLADO', 'Falla en Drenaje/Alcantarilla'),
        ('TRAMITE', 'Solicitud de Trámite'),
    ]

    STATUS_OPCIONES = [
        ('PENDIENTE', 'Recibido / Pendiente'),
        ('ASIGNADO', 'Asignado a Cuadrilla'),
        ('EN_PROCESO', 'En Reparación'),
        ('RESUELTO', 'Concluido'),
        ('CANCELADO', 'Improcedente'),
    ]

    # Geometría
    ubicacion = models.PointField(srid=4326)
    direccion_texto = models.CharField(max_length=255, blank=True, help_text="Calle y Número")
    
    # Datos Ciudadano
    tipo_problema = models.CharField(max_length=20, choices=TIPOS_PROBLEMA)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='reportes/', null=True, blank=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reportes')
    
    # Datos Gestión Interna
    status = models.CharField(max_length=20, choices=STATUS_OPCIONES, default='PENDIENTE')
    fecha_hora = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # Seguimiento y Asignación (Solo Admin)
    nota_seguimiento = models.TextField(blank=True, help_text="Respuesta oficial")
    foto_solucion = models.ImageField(upload_to='soluciones/', null=True, blank=True)
    pipa_asignada = models.ForeignKey(Pipa, on_delete=models.SET_NULL, null=True, blank=True, related_name='servicios')

    # Inteligencia
    validaciones = models.IntegerField(default=0)
    prioridad = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Solicitud ciudadana"
        verbose_name_plural = "Ventanilla unica"
        ordering = ['-fecha_hora']

    def save(self, *args, **kwargs):
        if not self.folio:
            self.folio = 'IXT-' + str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)   

    def __str__(self):
        return f"{self.folio} - {self.tipo_problema}"

# ---------------------------------------------------------------------
# MODELO: VALIDACIÓN
# ---------------------------------------------------------------------
class Validacion(models.Model):
    reporte = models.ForeignKey(Reporte, on_delete=models.CASCADE, related_name='votos')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha_voto = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reporte', 'usuario')

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None
        super().save(*args, **kwargs)
        if es_nuevo:
            self.reporte.validaciones += 1
            self.reporte.prioridad += 10
            if self.reporte.validaciones >= 5 and self.reporte.status == 'PENDIENTE':
                self.reporte.status = 'ASIGNADO' # Cambio lógico a Asignado/Revisado
            self.reporte.save()

# ---------------------------------------------------------------------
# MODELO: PERFIL
# ---------------------------------------------------------------------
class PerfilCiudadano(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    colonia = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.colonia}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        PerfilCiudadano.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.perfil.save()
    except:
        pass

# ---------------------------------------------------------------------
# MODELOS INFORMATIVOS
# ---------------------------------------------------------------------
class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    imagen = models.ImageField(upload_to='noticias/', null=True, blank=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['-fecha_publicacion']

class Pozo(models.Model):
    nombre = models.CharField(max_length=100)
    ubicacion = models.PointField(srid=4326)
    estado = models.CharField(max_length=20, default='OPERATIVO')
    profundidad = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    notas = models.TextField(blank=True)