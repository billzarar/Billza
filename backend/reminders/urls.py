from django.urls import path
from . import views

urlpatterns = [
    path('', views.reminder_list, name='reminder-list'),
    path('<int:pk>/read/', views.reminder_mark_read, name='reminder-mark-read'),
    path('read-all/', views.reminder_mark_all_read, name='reminder-mark-all-read'),
    path('preferences/', views.reminder_preferences_view, name='reminder-preferences'),
    path('worker/run/', views.trigger_reminder_worker, name='reminder-worker-run'),
]
