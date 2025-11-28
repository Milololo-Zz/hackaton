from django.contrib.gis.db import models


class Reporte(models.Model):
    # Opciones
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

    # Campos
    ubicacion = models.PointField(srid=4326)
    tipo_problema = models.CharField(max_length=20, choices=TIPOS_PROBLEMA)
    descripcion = models.TextField()
    foto = models.ImageField(upload_to='reportes/', null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_OPCIONES, default='PENDIENTE')
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"

    def __str__(self):
        return f"{self.tipo_problema} - {self.status}"


class Noticia(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título")
    contenido = models.TextField(verbose_name="Contenido del aviso")
    imagen = models.ImageField(
        upload_to='noticias/', null=True, blank=True, verbose_name="Imagen")
    fecha_publicacion = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de publicación")

    class Meta:
        verbose_name = "Noticia"
        verbose_name_plural = "Noticias"
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return str(self.titulo)
