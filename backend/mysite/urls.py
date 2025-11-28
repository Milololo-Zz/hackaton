from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from api.views import ReporteViewSet, NoticiaViewSet, PozoViewSet, PerfilViewSet

# Router para tus ViewSets (Aquí irán tus futuros endpoints)
router = DefaultRouter()
router.register(r'reportes', ReporteViewSet)
router.register(r'noticias', NoticiaViewSet)
router.register(r'pozos', PozoViewSet)
router.register(r'perfil', PerfilViewSet, basename='perfil')
# router.register(r'ejemplo', EjemploViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rutas de la API (Tus ViewSets)
    path('api/', include(router.urls)),
    
    # Rutas de Autenticación (Djoser)
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    
    # --- DOCUMENTACIÓN (Swagger) ---
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
