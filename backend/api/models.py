from django.contrib.gis.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# ---------------------------------------------------------------------
# MODELO 1: REPORTE (El problema del agua)
# ---------------------------------------------------------------------
class Reporte(models.Model):
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

    ubicacion = models.PointField(srid=4326)
    tipo_problema = models.CharField(max_length=20, choices=TIPOS_PROBLEMA)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='reportes/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_OPCIONES, default='PENDIENTE')
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"

    def __str__(self):
        return f"{self.tipo_problema} - {self.status}"

# ---------------------------------------------------------------------
# MODELO 2: PERFIL CIUDADANO (La Identidad)
# ---------------------------------------------------------------------
class PerfilCiudadano(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    colonia = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    
    RANGOS = [
        ('NOVATO', 'Novato (Solo reporta)'),
        ('GUARDIAN', 'Guardián (Sus reportes valen doble)'),
        ('MASTER', 'Máster (Validador oficial)'),
    ]
    rango = models.CharField(max_length=20, choices=RANGOS, default='NOVATO')
    puntos_confianza = models.IntegerField(default=10)

    def __str__(self):
        return f"{self.user.username} - {self.rango}"

# SEÑALES (Creación automática del perfil)
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
# MODELO 3: NOTICIAS (Comunicación Oficial)
# ---------------------------------------------------------------------
class Noticia(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    imagen = models.ImageField(upload_to='noticias/', null=True, blank=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Noticia Oficial"
        verbose_name_plural = "Noticias Oficiales"
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.titulo

# ---------------------------------------------------------------------
# MODELO 4: INFRAESTRUCTURA (POZOS)
# ---------------------------------------------------------------------
class Pozo(models.Model):
    ESTADO_POZO = [
        ('OPERATIVO', '🟢 Operando con normalidad'),
        ('MANTENIMIENTO', '🟡 En mantenimiento'),
        ('FALLA_BOMBA', '🔴 Falla en Bomba'),
        ('SIN_LUZ', '⚫ Sin Energía Eléctrica'),
    ]

    nombre = models.CharField(max_length=100, help_text="Ej: Pozo 3 - Los Héroes")
    ubicacion = models.PointField(srid=4326)
    estado = models.CharField(max_length=20, choices=ESTADO_POZO, default='OPERATIVO')
    profundidad = models.DecimalField(max_digits=6, decimal_places=2, help_text="Metros de profundidad", null=True, blank=True)
    notas = models.TextField(blank=True, help_text="Detalles técnicos o bitácora rápida")

    class Meta:
        verbose_name = "Pozo de Agua"
        verbose_name_plural = "Pozos e Infraestructura"

    def __str__(self):
        return f"{self.nombre} ({self.get_estado_display()})"