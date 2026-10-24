"""
Django settings for Billza project.
"""

from pathlib import Path
import os
from datetime import timedelta
import sys

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add BASE_DIR to sys.path so apps can be imported directly
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env file from project root or backend
try:
    from dotenv import load_dotenv
    root_env = BASE_DIR.parent / '.env'
    if root_env.exists():
        load_dotenv(root_env)
    else:
        load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'billza-insecure-secret-key-change-in-production-64char')
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() in ('true', '1', 't')

ALLOWED_HOSTS = [host.strip() for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,web').split(',') if host.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'corsheaders',
    'rest_framework',
    'drf_spectacular',

    # Local apps
    'core.apps.CoreConfig',
    'bills.apps.BillsConfig',
    'payments.apps.PaymentsConfig',
    'reminders.apps.RemindersConfig',
    'dashboard.apps.DashboardConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database Configuration
USE_POSTGRES = os.getenv('USE_POSTGRES', 'False').lower() in ('true', '1', 't')
DATABASE_URL = os.getenv('DATABASE_URL', '')

if USE_POSTGRES and DATABASE_URL:
    import urllib.parse as urlparse
    url = urlparse.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
        }
    }
elif USE_POSTGRES:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'billza_db'),
            'USER': os.getenv('POSTGRES_USER', 'billza_user'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'billza_secure_password_2026'),
            'HOST': os.getenv('POSTGRES_HOST', 'db'),
            'PORT': int(os.getenv('POSTGRES_PORT', '5432')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS and CSRF
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True').lower() in ('true', '1', 't')
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000'
    ).split(',') if origin.strip()
]

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',
}

# DRF Spectacular OpenAPI / Swagger configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'Billza Stellar Utility & Recurring Bill Management API',
    'DESCRIPTION': (
        'Robust, production-ready REST API for Billza platform. '
        'Supports recurring bill schedules, automated reminder alerts, '
        'Stellar Testnet XLM and USDC verified payments, and on-chain Soroban contract settlement.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Authentication', 'description': 'User registration, JWT login, and Stellar wallet signature auth'},
        {'name': 'Bills', 'description': 'Parent bill CRUD, recurrence configuration, and category organization'},
        {'name': 'Occurrences', 'description': 'Individual scheduled bill occurrences, status tracking, and manual payment marking'},
        {'name': 'Payments', 'description': 'Stellar payment preparation, transaction verification, history, and CSV export'},
        {'name': 'Reminders', 'description': 'Automated notification alerts, preferences, and scheduler worker'},
        {'name': 'Dashboard', 'description': 'Financial expense metrics, overdue counts, and category breakdown'},
        {'name': 'System', 'description': 'System health check and blockchain network status'},
    ],
}

# Stellar Network & Soroban Configuration
STELLAR_NETWORK = os.getenv('STELLAR_NETWORK', 'TESTNET')
STELLAR_NETWORK_PASSPHRASE = os.getenv('STELLAR_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015')
STELLAR_HORIZON_URL = os.getenv('STELLAR_HORIZON_URL', 'https://horizon-testnet.stellar.org')
STELLAR_SOROBAN_RPC_URL = os.getenv('STELLAR_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org')
STELLAR_FRIENDBOT_URL = os.getenv('STELLAR_FRIENDBOT_URL', 'https://friendbot.stellar.org')

# Testnet Asset SACs
STELLAR_USDC_ISSUER = os.getenv('STELLAR_USDC_ISSUER', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
STELLAR_USDC_CONTRACT_ID = os.getenv('STELLAR_USDC_CONTRACT_ID', 'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXNGB4BEVUNWZ3CWXB57BA2O3QI')

# Billza Soroban Contract ID
BILLZA_CONTRACT_ID = os.getenv('BILLZA_CONTRACT_ID', 'CCOSNSVHGLYFMO72ICZY2Y7KZYQLZ77AADT4LIU6VL4XDRT2IY6IQMOG')
BILLZA_PLATFORM_FEE_RECIPIENT = os.getenv('BILLZA_PLATFORM_FEE_RECIPIENT', 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q')
BILLZA_PLATFORM_FEE_BPS = int(os.getenv('BILLZA_PLATFORM_FEE_BPS', '0'))

# JWT Secret & Lifespans
JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '72'))

# Celery Configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Email Settings
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'notifications@billza.app')
REMINDER_CRON_SECRET = os.getenv('REMINDER_CRON_SECRET', 'billza-cron-secret-key-2026')
