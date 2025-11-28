from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Reporte, PerfilCiudadano, Noticia, Pozo, Validacion

# 1. Serializador del Perfil (Para incrustarlo en el usuario)
class PerfilCiudadanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilCiudadano
        fields = ['colonia', 'telefono', 'rango', 'puntos_confianza']
        read_only_fields = ['rango', 'puntos_confianza']

# 2. Serializador de Usuario (Con Perfil Incluido)
class UserSerializer(serializers.ModelSerializer):
    perfil = PerfilCiudadanoSerializer() # Nested Serializer

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'perfil']
    
    # Lógica para actualizar Usuario y Perfil al mismo tiempo
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

# 3. Serializador de Reporte (Con Lat/Lon separados para el Mapa)
class ReporteSerializer(serializers.ModelSerializer):
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Reporte
        fields = [
            'id', 'titulo', 'descripcion', 'tipo_problema', 
            'latitud', 'longitud', 'ubicacion', # Enviamos ambos formatos
            'foto', 'status', 'fecha_hora', 
            'usuario', 'usuario_nombre', 'validaciones', 'prioridad'
        ]
        read_only_fields = ['status', 'fecha_hora', 'validaciones', 'prioridad', 'ubicacion']

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

# 4. Serializadores Simples
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