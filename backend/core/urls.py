from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.auth_register, name='auth-register'),
    path('login/', views.auth_login, name='auth-login'),
    path('wallet/nonce/', views.auth_wallet_nonce, name='auth-wallet-nonce'),
    path('wallet/verify/', views.auth_wallet_verify, name='auth-wallet-verify'),
    path('profile/', views.user_profile, name='user-profile'),
    path('audit-logs/', views.audit_logs, name='audit-logs'),
    path('health/', views.health_check, name='health-check'),
    path('populate-bills/', views.populate_user_bills_view, name='populate-bills'),
]
