import googlemaps
from django.conf import settings
from django.contrib.gis.geos import Point
from rest_framework.exceptions import APIException


def obtener_coordenadas_google(calle_num, cp):
    """
    Convierte dirección en un objeto Point(x, y) usando Google Maps Geocoding API.
    """
    gmaps = googlemaps.Client(key=settings.GOOGLE_API_KEY)

    # Construcción de la dirección.
    # NOTA: Se recomienda concatenar País/Ciudad si el proyecto es local para mayor precisión.
    direccion_completa = f"{calle_num}, {cp}"

    try:
        geocode_result = gmaps.geocode(direccion_completa)

        if geocode_result:
            location = geocode_result[0]['geometry']['location']
            lat = location['lat']
            lng = location['lng']

            # ATENCIÓN: Point recibe (longitud, latitud) -> (x, y)
            return Point(lng, lat, srid=4326)
        else:
            return None
    except Exception as e:
        # Manejo básico de errores
        raise APIException(f"Error conectando con Google Maps: {str(e)}")
