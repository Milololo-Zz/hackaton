import csv
from django.http import HttpResponse
from django.db.models.functions import TruncDate
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from datetime import timedelta
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiTypes

from .models import Reporte, Noticia, Pozo, Validacion, Pipa
from .serializers import (
    ReporteCiudadanoSerializer, 
    ReporteAdminSerializer, # Importante
    NoticiaSerializer, 
    PozoSerializer, 
    UserSerializer,
    PipaSerializer
)

# PERMISO CUSTOM
class EsDueñoOAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: return True
        if request.method == 'POST': return request.user.is_authenticated
        # Solo staff puede editar/borrar
        return request.user.is_staff

# ---------------------------------------------------------------------
# VIEWSET REPORTE (DINÁMICO)
# ---------------------------------------------------------------------
class ReporteViewSet(viewsets.ModelViewSet):
    queryset = Reporte.objects.all().order_by('-prioridad', '-fecha_hora')
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [EsDueñoOAdmin]
    
    # Filtros
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_problema', 'usuario__username', 'folio']
    search_fields = ['descripcion', 'folio', 'direccion_texto']
    ordering_fields = ['prioridad', 'fecha_hora', 'validaciones']

    # --- AQUÍ ESTÁ EL TRUCO: CAMBIO DE SERIALIZADOR ---
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update'] and self.request.user.is_staff:
            return ReporteAdminSerializer
        return ReporteCiudadanoSerializer

    def perform_create(self, serializer):
        user = self.request.user
        # Lógica Anti-Spam
        ultimo = Reporte.objects.filter(usuario=user).order_by('-fecha_hora').first()
        if ultimo:
            delta = timezone.now() - ultimo.fecha_hora
            if delta.total_seconds() < 300: # 5 minutos
                raise serializers.ValidationError("Espera 5 minutos para reportar de nuevo.")
        
        if user.is_authenticated:
            serializer.save(usuario=user)
        else:
            serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        # Si es ciudadano normal, filtramos cosas viejas/resueltas del mapa público
        if self.action == 'list' and not self.request.user.is_staff:
            limite = timezone.now() - timedelta(days=30)
            qs = qs.filter(Q(fecha_hora__gte=limite) | ~Q(status='RESUELTO'))
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def validar(self, request, pk=None):
        reporte = self.get_object()
        user = request.user
        if Validacion.objects.filter(reporte=reporte, usuario=user).exists():
            return Response({'error': 'Ya validado'}, status=400)
        Validacion.objects.create(reporte=reporte, usuario=user)
        return Response({'status': 'Validado'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mis_reportes(self, request):
        reportes = Reporte.objects.filter(usuario=request.user)
        serializer = self.get_serializer(reportes, many=True)
        return Response(serializer.data)

# ---------------------------------------------------------------------
# VIEWSETS INFORMATIVOS
# ---------------------------------------------------------------------
class NoticiaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Noticia.objects.filter(activa=True)
    serializer_class = NoticiaSerializer
    permission_classes = [permissions.AllowAny]

class PozoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pozo.objects.all()
    serializer_class = PozoSerializer
    permission_classes = [permissions.AllowAny]

class PipaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pipa.objects.all()
    serializer_class = PipaSerializer
    permission_classes = [permissions.IsAdminUser] # Solo admin ve las pipas por ahora

# ---------------------------------------------------------------------
# PERFIL
# ---------------------------------------------------------------------
class PerfilViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            return Response(UserSerializer(user).data)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# ---------------------------------------------------------------------
# DASHBOARD ADMIN (GOBIERNO)
# ---------------------------------------------------------------------
class DashboardAdminViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        total = Reporte.objects.count()
        pendientes = Reporte.objects.filter(status='PENDIENTE').count()
        resueltos = Reporte.objects.filter(status='RESUELTO').count()
        moda = Reporte.objects.values('tipo_problema').annotate(t=Count('tipo_problema')).order_by('-t').first()
        
        return Response({
            "kpis": { "total_historico": total, "pendientes_urgentes": pendientes, "resueltos": resueltos },
            "moda_problema": { "tipo": moda['tipo_problema'] if moda else "N/A" }
        })

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=['get'])
    def reporte_semanal(self, request):
        sem = timezone.now() - timedelta(days=7)
        data = Reporte.objects.filter(fecha_hora__gte=sem)\
            .annotate(fecha=TruncDate('fecha_hora')).values('fecha')\
            .annotate(total=Count('id')).order_by('fecha')
        return Response(data)

    @action(detail=False, methods=['get'])
    def exportar_reportes(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reporte.csv"'
        writer = csv.writer(response)
        writer.writerow(['Folio', 'Tipo', 'Estatus', 'Dirección'])
        for r in Reporte.objects.all():
            writer.writerow([r.folio, r.tipo_problema, r.status, r.direccion_texto])
        return response