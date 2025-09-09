from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from core.models import User
import random
import os


class Command(BaseCommand):
    help = 'Create an admin user for production deployment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            help='Full name of the admin user (required)',
        )
        parser.add_argument(
            '--access-code',
            type=str,
            help='6-digit access code (optional - will be generated if not provided)',
        )
        parser.add_argument(
            '--target-hours',
            type=int,
            default=5,
            help='Target hours per week (default: 5)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if admin user already exists',
        )

    def handle(self, *args, **options):
        # Check if admin user already exists
        existing_admin = User.objects.filter(role='admin').first()
        if existing_admin and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    f'Admin user already exists: {existing_admin.full_name} '
                    f'(Access Code: {existing_admin.access_code})'
                )
            )
            self.stdout.write(
                self.style.NOTICE('Use --force to create another admin user')
            )
            return

        # Get admin name from command line or environment
        admin_name = options['name']
        if not admin_name:
            admin_name = os.getenv('ADMIN_NAME')
        
        if not admin_name:
            raise CommandError(
                'Admin name is required. Provide it via --name argument or ADMIN_NAME environment variable.'
            )

        # Get or generate access code
        access_code = options['access_code']
        if not access_code:
            access_code = os.getenv('ADMIN_ACCESS_CODE')
        
        if not access_code:
            # Generate a random 6-digit access code
            while True:
                access_code = str(random.randint(100000, 999999))
                if not User.objects.filter(access_code=access_code).exists():
                    break

        # Validate access code format
        if len(access_code) != 6 or not access_code.isdigit():
            raise CommandError('Access code must be exactly 6 digits')

        # Check if access code is already taken
        if User.objects.filter(access_code=access_code).exists():
            raise CommandError(f'Access code {access_code} is already in use')

        try:
            # Create the admin user
            admin_user = User.objects.create(
                full_name=admin_name,
                access_code=access_code,
                role='admin',
                target_hours_per_week=options['target_hours']
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created admin user: {admin_user.full_name}'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Access Code: {admin_user.access_code}'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    'IMPORTANT: Save the access code securely. It cannot be recovered.'
                )
            )

        except ValidationError as e:
            raise CommandError(f'Validation error: {e}')
        except Exception as e:
            raise CommandError(f'Error creating admin user: {e}')
