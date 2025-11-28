import csv
from drf_spectacular.utils import extend_schema, OpenApiTypes
from django.http import HttpResponse
from django.db.models.functions import TruncDate
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from datetime import timedelta
from django.utils import timezone
from .models import Reporte, Noticia, Pozo, Validacion
from .serializers import ReporteSerializer, NoticiaSerializer, PozoSerializer, UserSerializer

class EsDueñoOAdmin(permissions.BasePermission):
   
    def has_permission(self, request, view):
        # Si es GET, HEAD, OPTIONS (Lectura) -> OK
        if request.method in permissions.SAFE_METHODS:
            return True
        # Si es POST (Crear) -> Debe estar logueado
        if request.method == 'POST':
            return request.user.is_authenticated
        # Si es PUT, PATCH, DELETE -> Solo Admin
        return request.user.is_staff
    
class DashboardAdminViewSet(viewsets.ViewSet):
    """
    Vista exclusiva para el Gobierno. Devuelve estadísticas y datos agregados.
    Solo accesible por Admins (IsStaff).
    """
    permission_classes = [permissions.IsAdminUser]

    # --- DOCUMENTACIÓN PARA KPI'S ---
    @extend_schema(
        summary="Obtener Estadísticas Generales (KPIs)",
        description="Devuelve totales históricos, pendientes y el problema más común.",
        responses={200: OpenApiTypes.OBJECT}, # Le decimos que devuelve un objeto JSON genérico
    )
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        # ... (TU CÓDIGO SIGUE IGUAL AQUÍ) ...
        total_reportes = Reporte.objects.count()
        pendientes = Reporte.objects.filter(status='PENDIENTE').count()
        en_proceso = Reporte.objects.filter(status='REVISADO').count()
        resueltos = Reporte.objects.filter(status='RESUELTO').count()
        
        problema_comun = Reporte.objects.values('tipo_problema').annotate(
            total=Count('tipo_problema')
        ).order_by('-total').first()

        return Response({
            "kpis": {
                "total_historico": total_reportes,
                "pendientes_urgentes": pendientes,
                "en_reparacion": en_proceso,
                "resueltos": resueltos,
            },
            "moda_problema": {
                "tipo": problema_comun['tipo_problema'] if problema_comun else "N/A",
                "cantidad": problema_comun['total'] if problema_comun else 0
            }
        })

    # --- DOCUMENTACIÓN PARA GRÁFICA ---
    @extend_schema(
        summary="Datos para Gráfica Semanal",
        description="Devuelve el conteo de reportes por día de los últimos 7 días.",
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=['get'])
    def reporte_semanal(self, request):
        # ... (TU CÓDIGO SIGUE IGUAL AQUÍ) ...
        hace_una_semana = timezone.now() - timedelta(days=7)
        datos = Reporte.objects.filter(fecha_hora__gte=hace_una_semana)\
            .annotate(fecha=TruncDate('fecha_hora'))\
            .values('fecha')\
            .annotate(total=Count('id'))\
            .order_by('fecha')
        return Response(datos)

    # --- DOCUMENTACIÓN PARA EXCEL ---
    @extend_schema(
        summary="Descargar Reporte Excel (CSV)",
        description="Genera y descarga un archivo CSV con todos los reportes del sistema.",
        responses={200: OpenApiTypes.BINARY}, # Le decimos que devuelve un archivo
    )
    @action(detail=False, methods=['get'])
    def exportar_reportes(self, request):
        # ... (TU CÓDIGO SIGUE IGUAL AQUÍ) ...
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reporte_hydro_red.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Tipo', 'Estatus', 'Prioridad', 'Fecha', 'Colonia', 'Descripción'])

        reportes = Reporte.objects.all().select_related('usuario__perfil')
        for r in reportes:
            # Manejo de error si el usuario no tiene perfil
            try:
                colonia = r.usuario.perfil.colonia
            except:
                colonia = "N/A"
                
            writer.writerow([
                r.id, 
                r.tipo_problema, 
                r.status, 
                r.prioridad, 
                r.fecha_hora.strftime("%Y-%m-%d %H:%M"),
                colonia,
                r.descripcion
            ])

        return response
    

# Vista de Reportes (Con lógica Anti-Buzón)
class ReporteViewSet(viewsets.ModelViewSet):
    queryset = Reporte.objects.all().order_by('-prioridad', '-fecha_hora')
    serializer_class = ReporteSerializer
    parser_classes = [MultiPartParser, FormParser] # Para subir fotos
    permission_classes = [EsDueñoOAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_problema', 'usuario__username']
    search_fields = ['descripcion', 'titulo', 'usuario__perfil__colonia']
    ordering_fields = ['prioridad', 'fecha_hora', 'validaciones']

    def perform_create(self, serializer):
        user = self.request.user
        
        # 1. Lógica Anti-Spam: Buscar el último reporte de este usuario
        ultimo_reporte = Reporte.objects.filter(usuario=user).order_by('-fecha_hora').first()
        
        if ultimo_reporte:
            tiempo_pasado = timezone.now() - ultimo_reporte.fecha_hora
            # Si pasaron menos de 10 minutos (600 segundos), bloqueamos
            if tiempo_pasado.total_seconds() < 600:
                raise serializers.ValidationError(
                    f"Debes esperar {int((600 - tiempo_pasado.total_seconds())/60)} minutos para reportar de nuevo."
                )

        # 2. Guardar si pasó la validación
        if user.is_authenticated:
            serializer.save(usuario=user)
        else:
            serializer.save()

    def get_queryset(self):
        # Lógica de Ciclo de Vida
        # 1. Obtenemos todo
        queryset = Reporte.objects.all().order_by('-prioridad', '-fecha_hora')
        
        # 2. Filtramos para el Mapa Público (GET normal)
        # Solo mostramos lo "Activo" (últimos 30 días O que no esté resuelto hace mucho)
        if self.action == 'list':
            limite_fecha = timezone.now() - timedelta(days=30)
            
            # Mostramos:
            # a) Reportes recientes (menos de 30 días)
            # b) Reportes que NO estén resueltos (aunque sean viejos, siguen siendo un problema)
            queryset = queryset.filter(
                Q(fecha_hora__gte=limite_fecha) | 
                ~Q(status='RESUELTO')
            )
            
        return queryset        

    # Acción Personalizada: Validar Reporte (Botón Confirmar)
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def validar(self, request, pk=None):
        reporte = self.get_object()
        user = request.user
        
        if Validacion.objects.filter(reporte=reporte, usuario=user).exists():
            return Response({'error': 'Ya validaste este reporte'}, status=400)
        
        Validacion.objects.create(reporte=reporte, usuario=user)
        return Response({'status': 'Validado', 'prioridad': reporte.prioridad + 10})

    # Acción: Mis Reportes
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mis_reportes(self, request):
        reportes = Reporte.objects.filter(usuario=request.user)
        serializer = self.get_serializer(reportes, many=True)
        return Response(serializer.data)

# Vista de Noticias (Pública)
class NoticiaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Noticia.objects.filter(activa=True)
    serializer_class = NoticiaSerializer
    permission_classes = [permissions.AllowAny]

# Vista de Pozos (Pública)
class PozoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pozo.objects.all()
    serializer_class = PozoSerializer
    permission_classes = [permissions.AllowAny]

# Vista de Perfil (Ver y Editar)
class PerfilViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)