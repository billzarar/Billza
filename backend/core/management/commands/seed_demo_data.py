import os
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from bills.models import Bill, BillOccurrence, BillCategory, BillFrequency, AssetType, OccurrenceStatus
from bills.services import create_initial_occurrence
from payments.models import PaymentRecord, PaymentMethod, VerificationStatus
from reminders.models import Reminder, NotificationPreference, ReminderType, ReminderStatus

class Command(BaseCommand):
    help = 'Seed demo users, recurring bills, occurrences, payment records, and reminders'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Billza demonstration data...")

        # 1. Create or update Demo User
        demo_user, created = User.objects.get_or_create(
            username='demo@billza.app',
            defaults={
                'email': 'demo@billza.app',
                'first_name': 'Demo',
                'last_name': 'User',
            }
        )
        demo_user.set_password('BillzaTestnet2026!')
        demo_user.is_staff = True
        demo_user.is_superuser = True
        demo_user.save()

        # Update profile
        profile = demo_user.profile
        profile.wallet_address = 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q'
        profile.preferred_currency = 'USDC'
        profile.save()

        NotificationPreference.objects.get_or_create(user=demo_user)

        today = timezone.now().date()

        # 2. Demo Bills
        bills_data = [
            {
                'name': 'City Power & Electric',
                'category': BillCategory.ELECTRICITY,
                'description': 'Monthly residential power grid utility bill',
                'amount': Decimal('85.5000000'),
                'currency': AssetType.USDC,
                'recipient_name': 'City Power Authority',
                'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
                'frequency': BillFrequency.MONTHLY,
                'due_date': today + timedelta(days=3),
            },
            {
                'name': 'Gigabit Fiber Internet',
                'category': BillCategory.INTERNET,
                'description': 'High-speed 1Gbps symmetrical home connection',
                'amount': Decimal('45.0000000'),
                'currency': AssetType.USDC,
                'recipient_name': 'Stellar Telecom Inc',
                'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
                'frequency': BillFrequency.MONTHLY,
                'due_date': today + timedelta(days=7),
            },
            {
                'name': 'Municipal Water Utility',
                'category': BillCategory.WATER,
                'description': 'Bi-monthly clean water and sewage charges',
                'amount': Decimal('32.0000000'),
                'currency': AssetType.XLM,
                'recipient_name': 'Municipal Water Board',
                'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
                'frequency': BillFrequency.MONTHLY,
                'due_date': today - timedelta(days=2), # Overdue demo
            },
            {
                'name': 'Cloud Infrastructure Node',
                'category': BillCategory.BUSINESS_UTILITIES,
                'description': 'Soroban RPC validator server hosting',
                'amount': Decimal('120.0000000'),
                'currency': AssetType.USDC,
                'recipient_name': 'CloudHost Networks',
                'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
                'frequency': BillFrequency.MONTHLY,
                'due_date': today + timedelta(days=14),
            },
            {
                'name': 'Office Workspace Rent',
                'category': BillCategory.RENT,
                'description': 'Coworking dedicated desk monthly membership',
                'amount': Decimal('250.0000000'),
                'currency': AssetType.USDC,
                'recipient_name': 'Apex Workspaces LLC',
                'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
                'frequency': BillFrequency.MONTHLY,
                'due_date': today + timedelta(days=20),
            },
        ]

        for b_data in bills_data:
            bill, b_created = Bill.objects.get_or_create(
                user=demo_user,
                name=b_data['name'],
                defaults=b_data
            )
            if b_created:
                occ = create_initial_occurrence(bill)
                if bill.due_date < today:
                    occ.status = OccurrenceStatus.OVERDUE
                    occ.save()

        # Create a paid occurrence with confirmed payment history
        electricity_bill = Bill.objects.filter(user=demo_user, category=BillCategory.ELECTRICITY).first()
        if electricity_bill:
            past_occ, _ = BillOccurrence.objects.get_or_create(
                bill=electricity_bill,
                occurrence_number=99,
                defaults={
                    'due_date': today - timedelta(days=28),
                    'amount': electricity_bill.amount,
                    'currency': electricity_bill.currency,
                    'status': OccurrenceStatus.PAID,
                    'is_manual_paid': False,
                    'paid_at': timezone.now() - timedelta(days=28),
                    'transaction_hash': '1bba78de3878efd69d75f3222fdca7527ff585f8134c2b490464af154a72c71d',
                }
            )
            PaymentRecord.objects.get_or_create(
                occurrence=past_occ,
                defaults={
                    'user': demo_user,
                    'bill': electricity_bill,
                    'amount': electricity_bill.amount,
                    'asset': electricity_bill.currency,
                    'payment_method': PaymentMethod.STELLAR_TESTNET,
                    'recipient_address': electricity_bill.recipient_stellar_address,
                    'payer_address': demo_user.profile.wallet_address,
                    'transaction_hash': past_occ.transaction_hash,
                    'payment_reference': past_occ.payment_reference,
                    'verification_status': VerificationStatus.CONFIRMED,
                    'ledger_sequence': 1234500,
                    'ledger_timestamp': timezone.now() - timedelta(days=28),
                }
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
        self.stdout.write("Credentials: demo@billza.app / BillzaTestnet2026!")
