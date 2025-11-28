from django.contrib.gis.db import models
feature/backend-geo-setup
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.contrib.auth.models import User  # <--- IMPORT NECESARIO PARA EL USUARIO
main

# ---------------------------------------------------------------------
# MODELO 1: REPORTE (El problema del agua)
# ---------------------------------------------------------------------
class Reporte(models.Model):
feature/backend-geo-setup
=======
    # Opciones (Tal cual las definieron ustedes)
 main
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

 feature/backend-geo-setup

    # --- Campos Originales (GeoDjango) ---
main
    ubicacion = models.PointField(srid=4326)
    tipo_problema = models.CharField(max_length=20, choices=TIPOS_PROBLEMA)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='reportes/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_OPCIONES, default='PENDIENTE')
    fecha_hora = models.DateTimeField(auto_now_add=True)

feature/backend-geo-setup

    # --- CAMPOS NUEVOS (AGREGADOS PARA LÓGICA ANTI-BUZÓN) ---
    # 1. Relación con Usuario: Para que aparezca en "Mi Perfil"
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reportes')
    
    # 2. Inteligencia: Para calcular urgencia automática
    validaciones = models.IntegerField(default=0, help_text="Vecinos que confirman")
    prioridad = models.IntegerField(default=0, help_text="Nivel de urgencia calculado")

    # Configuración visual
main
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
 feature/backend-geo-setup
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

        return self.titulo
 main
