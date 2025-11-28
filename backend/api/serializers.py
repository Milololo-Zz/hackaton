from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Reporte, PerfilCiudadano, Noticia, Pozo, Validacion, Pipa

# --- SERIALIZADORES AUXILIARES ---
class PerfilCiudadanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilCiudadano
        fields = ['colonia', 'telefono']

class UserSerializer(serializers.ModelSerializer):
    perfil = PerfilCiudadanoSerializer()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'perfil']
    
    def update(self, instance, validated_data):
        perfil_data = validated_data.pop('perfil', {})
        perfil = instance.perfil
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        perfil.colonia = perfil_data.get('colonia', perfil.colonia)
        perfil.telefono = perfil_data.get('telefono', perfil.telefono)
        perfil.save()
        return instance

class PipaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pipa
        fields = '__all__'

# --- SERIALIZADOR CIUDADANO (Restringido) ---
class ReporteCiudadanoSerializer(serializers.ModelSerializer):
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    fecha_formato = serializers.DateTimeField(source='fecha_hora', format="%d/%m/%Y %H:%M", read_only=True)
    ubicacion = serializers.CharField() 

    class Meta:
        model = Reporte
        fields = [
            'id', 'folio', 'tipo_problema', 'descripcion', 'direccion_texto',
            'latitud', 'longitud', 'ubicacion', 
            'foto', 'status', 'fecha_formato', 
            'usuario', 'usuario_nombre', 
            'nota_seguimiento', 'foto_solucion', 'validaciones', 'prioridad'
        ]
        # EL CIUDADANO NO PUEDE EDITAR ESTO:
        read_only_fields = [
            'id', 'folio', 'status', 'fecha_formato', 'usuario', 'usuario_nombre',
            'nota_seguimiento', 'foto_solucion', 'validaciones', 'prioridad',
            'pipa_asignada'
        ]

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None
    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

# --- SERIALIZADOR ADMIN (Poder Total) ---
class ReporteAdminSerializer(ReporteCiudadanoSerializer):
    # Hereda todo del ciudadano, pero sobreescribe los read_only
    class Meta(ReporteCiudadanoSerializer.Meta):
        # El Admin SÍ puede editar status, notas y asignar pipas
        read_only_fields = [
            'id', 'folio', 'fecha_formato', 'usuario', 'usuario_nombre', 'validaciones'
        ]

# --- OTROS ---
class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = '__all__'

class PozoSerializer(serializers.ModelSerializer):
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()
    class Meta:
        model = Pozo
        fields = '__all__'
    def get_latitud(self, obj):
        return obj.ubicacion.y
    def get_longitud(self, obj):
        return obj.ubicacion.x