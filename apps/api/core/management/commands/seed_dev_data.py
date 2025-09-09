from django.core.management.base import BaseCommand
from core.models import User, Committee, UserCommittee, AllowedIP


class Command(BaseCommand):
    help = 'Seed development data for local testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            UserCommittee.objects.all().delete()
            Committee.objects.all().delete()
            AllowedIP.objects.all().delete()
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared'))

        # Create development users with access codes
        self.stdout.write('Creating development users...')
        
        alice = User.objects.create(
            full_name='Alice Johnson',
            access_code='123456',
            role='admin',
            target_hours_per_week=5
        )
        
        bob = User.objects.create(
            full_name='Bob Smith',
            access_code='234567',
            role='chair',
            target_hours_per_week=10
        )
        
        carol = User.objects.create(
            full_name='Carol Lee',
            access_code='345678',
            role='member',
            target_hours_per_week=8
        )

        # Create committee with Bob as chair
        self.stdout.write('Creating development committee...')
        tech_committee = Committee.objects.create(
            name='Technology Fee Committee',
            chair=bob
        )

        # Assign members to committee
        UserCommittee.objects.create(user=bob, committee=tech_committee)
        UserCommittee.objects.create(user=carol, committee=tech_committee)

        # Create allowlist entries for IP addresses
        self.stdout.write('Creating development IP allowlist...')
        AllowedIP.objects.create(
            ip_address='172.19.0.1',
            label='Docker Gateway (Development)',
            created_by=alice
        )

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded development data!')
        )
        self.stdout.write('')
        self.stdout.write('Development Users Created:')
        self.stdout.write(f'  Admin: {alice.full_name} (Access Code: {alice.access_code})')
        self.stdout.write(f'  Chair: {bob.full_name} (Access Code: {bob.access_code})')
        self.stdout.write(f'  Member: {carol.full_name} (Access Code: {carol.access_code})')
        self.stdout.write('')
        self.stdout.write(f'Committee: {tech_committee.name}')
        self.stdout.write('IP Allowlist: 172.19.0.1 (Docker Gateway)')
