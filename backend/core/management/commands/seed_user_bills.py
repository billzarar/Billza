import sys
from django.core.management.base import BaseCommand
from bills.seeder import seed_bills_for_user

class Command(BaseCommand):
    help = 'Populates realistic recurring bills, occurrences, payment history, and reminders for a user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='GBDF5GHLWU@stellar.billza.local',
            help='Target user email (e.g. GBDF5GHLWU@stellar.billza.local)',
        )
        parser.add_argument(
            '--wallet',
            type=str,
            default=None,
            help='Optional full Stellar public key',
        )

    def handle(self, *args, **options):
        email = options['email']
        wallet = options.get('wallet')

        self.stdout.write(f"Populating bills and payment history for: {email}...")
        try:
            result = seed_bills_for_user(target_email=email, target_wallet=wallet)
            self.stdout.write(self.style.SUCCESS(
                f"Successfully seeded data for user '{result['username']}' ({result['email']})!\n"
                f"  - Active Bills: {result['bills_count']}\n"
                f"  - Occurrences:  {result['occurrences_count']}\n"
                f"  - History Logs: {result['payments_count']}\n"
                f"  - Reminders:    {result['reminders_count']}"
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to seed user bills: {e}"))
            sys.exit(1)
