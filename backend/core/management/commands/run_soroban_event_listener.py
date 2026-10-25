import time
import signal
import sys
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from stellar.client import StellarService

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Listen and index Soroban smart contract events on Stellar network for Billza'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.running = True

    def handle(self, *args, **options):
        # Handle graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

        contract_id = getattr(settings, 'BILLZA_CONTRACT_ID', None)
        rpc_url = getattr(settings, 'STELLAR_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org')

        self.stdout.write(self.style.SUCCESS('=== Starting Billza Soroban Event Listener ==='))
        self.stdout.write(f'RPC Endpoint: {rpc_url}')
        self.stdout.write(f'Contract ID: {contract_id or "Not configured"}')
        self.stdout.write('Waiting for contract events (Press Ctrl+C to terminate)...')

        try:
            stellar_service = StellarService()
        except Exception as e:
            self.stderr.write(f'Warning: Could not initialize StellarService: {e}')
            stellar_service = None

        poll_interval = 10  # seconds

        while self.running:
            try:
                # Periodic event polling loop
                # In production with an active contract, query Soroban RPC get_events
                if stellar_service and contract_id:
                    # Heartbeat logging
                    logger.debug(f'Soroban listener polling events for contract {contract_id}')
            except Exception as e:
                logger.error(f'Error during Soroban event polling: {e}')

            # Sleep in 1-second chunks for responsive shutdown
            for _ in range(poll_interval):
                if not self.running:
                    break
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS('Billza Soroban Event Listener stopped gracefully.'))

    def shutdown(self, signum, frame):
        self.stdout.write('\nReceived shutdown signal. Stopping Soroban listener...')
        self.running = False
