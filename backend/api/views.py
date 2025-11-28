from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Reporte, Noticia, Pozo, Validacion
from .serializers import ReporteSerializer, NoticiaSerializer, PozoSerializer, UserSerializer

# Vista de Reportes (Con lógica Anti-Buzón)
class ReporteViewSet(viewsets.ModelViewSet):
    queryset = Reporte.objects.all().order_by('-prioridad', '-fecha_hora')
    serializer_class = ReporteSerializer
    parser_classes = [MultiPartParser, FormParser] # Para subir fotos
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Asigna el usuario logueado automáticamente
        if self.request.user.is_authenticated:
            serializer.save(usuario=self.request.user)
        else:
            serializer.save()

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

# Vista de Pozos (Pública)
class PozoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pozo.objects.all()
    serializer_class = PozoSerializer

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