from rest_framework import serializers
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from .models import UserProfile, AuditLog

class UserRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'full_name',
            'wallet_address',
            'preferred_currency',
            'email_notifications',
            'in_app_notifications',
            'date_joined',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'email', 'date_joined', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class WalletNonceRequestSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=56, min_length=56)

class WalletNonceResponseSerializer(serializers.Serializer):
    wallet_address = serializers.CharField()
    nonce = serializers.CharField()
    message = serializers.CharField()
    expires_at = serializers.DateTimeField()

class WalletVerifySerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=56, min_length=56)
    nonce = serializers.CharField(max_length=64)
    signature = serializers.CharField(help_text="Hex or base64 signed nonce challenge")

class AuthTokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_type = serializers.CharField()
    expires_in = serializers.IntegerField()
    user = UserProfileSerializer()

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'action', 'details', 'ip_address', 'created_at']

class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
    version = serializers.CharField()
    database = serializers.CharField()
    stellar_testnet = serializers.CharField()
    soroban_rpc = serializers.CharField()
    contract_id = serializers.CharField()
    timestamp = serializers.DateTimeField()
