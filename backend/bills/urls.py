from django.urls import path
from . import views

urlpatterns = [
    path('', views.bill_list_create, name='bill-list-create'),
    path('<int:pk>/', views.bill_detail, name='bill-detail'),
    path('occurrences/', views.occurrence_list, name='occurrence-list'),
    path('occurrences/<int:pk>/', views.occurrence_detail, name='occurrence-detail'),
    path('occurrences/<int:pk>/mark-paid/', views.occurrence_mark_manual_paid, name='occurrence-mark-paid'),
    path('occurrences/<int:pk>/snooze/', views.occurrence_snooze, name='occurrence-snooze'),
]
