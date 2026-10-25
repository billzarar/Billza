"""
Function-based views for Reminder management and preferences.
"""

from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import Reminder, NotificationPreference, ReminderStatus
from .serializers import (
    ReminderSerializer,
    NotificationPreferenceSerializer,
    TriggerWorkerResponseSerializer,
)
from .services import process_scheduled_reminders

@extend_schema(
    tags=['Reminders'],
    summary='List user payment alerts and reminders',
    description='Returns all reminders for the authenticated user with status filtering (SCHEDULED, SENT, READ).',
    parameters=[
        OpenApiParameter(name='status', type=str, description='Filter by status: SCHEDULED, SENT, READ'),
        OpenApiParameter(name='unread_only', type=bool, description='If true, returns only unread reminders'),
    ],
    responses={200: ReminderSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reminder_list(request):
    # Dynamically evaluate and ensure live reminders exist for user's active occurrences
    process_scheduled_reminders(user=request.user)

    queryset = Reminder.objects.filter(user=request.user).select_related('bill', 'occurrence')

    unread_only = request.query_params.get('unread_only')
    if unread_only and unread_only.lower() in ('true', '1'):
        queryset = queryset.filter(read_at__isnull=True)

    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status__iexact=status_filter)

    serializer = ReminderSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Reminders'],
    summary='Mark reminder as read',
    description='Marks an in-app reminder notification as read.',
    request=None,
    responses={200: ReminderSerializer, 404: OpenApiResponse(description='Reminder not found')}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reminder_mark_read(request, pk):
    reminder = get_object_or_404(Reminder, pk=pk, user=request.user)
    reminder.status = ReminderStatus.READ
    reminder.read_at = timezone.now()
    reminder.save(update_fields=['status', 'read_at'])
    return Response(ReminderSerializer(reminder).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Reminders'],
    summary='Mark all reminders as read',
    description='Marks all unread reminders for the authenticated user as read.',
    request=None,
    responses={200: OpenApiResponse(description='Count of marked reminders')}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reminder_mark_all_read(request):
    count = Reminder.objects.filter(user=request.user, read_at__isnull=True).update(
        status=ReminderStatus.READ,
        read_at=timezone.now(),
    )
    return Response({'message': f'Marked {count} reminders as read.', 'count': count}, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Reminders'],
    summary='Retrieve or update reminder preferences',
    description='Gets or updates notification preferences (email/in-app toggles, timing options: 7d, 3d, 1d, due date, overdue).',
    request=NotificationPreferenceSerializer,
    responses={200: NotificationPreferenceSerializer}
)
@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def reminder_preferences_view(request):
    prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(NotificationPreferenceSerializer(prefs).data, status=status.HTTP_200_OK)

    serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(NotificationPreferenceSerializer(prefs).data, status=status.HTTP_200_OK)

@extend_schema(
    tags=['Reminders'],
    summary='Trigger reminder evaluation worker',
    description='Executes the background reminder scheduler worker. Can be invoked manually by user or by cron tasks.',
    parameters=[
        OpenApiParameter(name='secret', type=str, description='Cron secret key (optional for authenticated users)'),
    ],
    request=None,
    responses={200: TriggerWorkerResponseSerializer}
)
@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_reminder_worker(request):
    cron_secret = request.query_params.get('secret') or request.data.get('secret')
    # Allow if user is authenticated OR valid cron secret provided
    if not (request.user and request.user.is_authenticated):
        if cron_secret != settings.REMINDER_CRON_SECRET:
            return Response({'error': 'Unauthorized. Valid cron secret or authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    stats = process_scheduled_reminders()
    data = {
        'status': 'completed',
        'evaluated': stats['evaluated'],
        'created': stats['created'],
        'dispatched': stats['dispatched'],
        'failed': stats['failed'],
    }
    return Response(data, status=status.HTTP_200_OK)
