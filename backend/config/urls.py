"""
URL configuration for Billza backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

def api_health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Billza Stellar Utility & Recurring Bill Management API',
        'docs': '/api/docs/',
        'version': '1.0.0',
    })

urlpatterns = [
    path('', api_health_check, name='api-root'),
    path('api/', api_health_check, name='api-index'),
    path('api/health/', api_health_check, name='api-health'),

    path('admin/', admin.site.urls),

    # OpenAPI 3.0 / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular API Endpoints (Function-Based Views)
    path('api/auth/', include('core.urls')),
    path('api/bills/', include('bills.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reminders/', include('reminders.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
