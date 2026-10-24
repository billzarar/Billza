from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from stellar_sdk import Keypair
from core.models import UserProfile, WalletNonce, AuditLog

class CoreAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.keypair = Keypair.random()

    def test_user_registration_and_login(self):
        # 1. Registration
        reg_payload = {
            'email': 'alice@example.com',
            'password': 'StrongPassword123!',
            'full_name': 'Alice Wonder',
        }
        resp = self.client.post('/api/auth/register/', reg_payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', resp.data)
        self.assertEqual(resp.data['user']['full_name'], 'Alice Wonder')

        # 2. Login
        login_payload = {
            'email': 'alice@example.com',
            'password': 'StrongPassword123!',
        }
        login_resp = self.client.post('/api/auth/login/', login_payload, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', login_resp.data)

        # 3. Authenticated Profile access
        token = login_resp.data['access_token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        prof_resp = self.client.get('/api/auth/profile/')
        self.assertEqual(prof_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(prof_resp.data['email'], 'alice@example.com')

    def test_wallet_nonce_and_signature_authentication(self):
        # 1. Request nonce
        nonce_resp = self.client.post('/api/auth/wallet/nonce/', {'wallet_address': self.keypair.public_key}, format='json')
        self.assertEqual(nonce_resp.status_code, status.HTTP_200_OK)
        nonce = nonce_resp.data['nonce']

        # 2. Sign challenge message
        msg = f"Sign this message to authenticate with Billza: {nonce}".encode('utf-8')
        signature = self.keypair.sign(msg).hex()

        # 3. Verify
        verify_resp = self.client.post('/api/auth/wallet/verify/', {
            'wallet_address': self.keypair.public_key,
            'nonce': nonce,
            'signature': signature,
        }, format='json')
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', verify_resp.data)
        self.assertEqual(verify_resp.data['user']['wallet_address'], self.keypair.public_key)

    def test_health_check(self):
        resp = self.client.get('/api/auth/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'healthy')
        self.assertIn('contract_id', resp.data)
