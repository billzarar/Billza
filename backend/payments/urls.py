from django.urls import path
from . import views

urlpatterns = [
    path('prepare/', views.payment_prepare, name='payment-prepare'),
    path('verify/', views.payment_submit_verify, name='payment-verify'),
    path('history/', views.payment_history_list, name='payment-history-list'),
    path('history/export-csv/', views.payment_history_export_csv, name='payment-history-export-csv'),
    path('wallet/balances/', views.stellar_wallet_balances, name='wallet-balances'),
    path('wallet/faucet/', views.fund_wallet_faucet, name='wallet-faucet'),
]
