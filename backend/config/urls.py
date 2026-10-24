"""
URL configuration for Billza backend project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
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
