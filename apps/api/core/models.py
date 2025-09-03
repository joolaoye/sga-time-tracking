from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
import ipaddress
import random


class User(models.Model):
    """Users with access codes for simple authentication"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('chair', 'Chair'),
        ('member', 'Member'),
    ]
    
    id = models.AutoField(primary_key=True)
    access_code = models.CharField(
        max_length=6, 
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{6}$',
                message='Access code must be exactly 6 digits'
            )
        ],
        help_text='6-digit access code for user authentication'
    )
    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(
        max_length=50, 
        choices=ROLE_CHOICES,
        default='member'
    )
    target_hours_per_week = models.IntegerField(
        default=2,
        help_text='Target hours per week for this member'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.access_code})"

    def save(self, *args, **kwargs):
        # Generate access code if not provided
        if not self.access_code:
            while True:
                # Generate a random 6-digit number
                access_code = str(random.randint(100000, 999999))
                # Check if it's unique
                if not User.objects.filter(access_code=access_code).exists():
                    self.access_code = access_code
                    break
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'users'


class Committee(models.Model):
    """Committees that users can belong to"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    chair = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='chaired_committees'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'committees'


class UserCommittee(models.Model):
    """Many-to-many relationship between users and committees"""
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    committee = models.ForeignKey(Committee, on_delete=models.CASCADE)

    class Meta:
        db_table = 'user_committees'
        unique_together = ('user', 'committee')


class AllowedIP(models.Model):
    """IP addresses allowed to access the clock app"""
    id = models.AutoField(primary_key=True)
    ip_address = models.GenericIPAddressField(
        unique=True,
        help_text='IP address allowed to access the clock app'
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Optional label for the IP address (e.g., "Office Computer A")'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='created_by',
        help_text='User who added this IP address'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """Validate IP address format"""
        try:
            ipaddress.ip_address(self.ip_address)
        except ValueError:
            raise ValidationError('Invalid IP address format')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ip_address} ({self.label or 'No label'})"

    class Meta:
        db_table = 'allowed_ips'
        verbose_name = 'Allowed IP'
        verbose_name_plural = 'Allowed IPs'


class TimeLog(models.Model):
    """Tracks clock in/out per user"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_logs')
    clock_in = models.DateTimeField()
    clock_out = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'time_logs'
        ordering = ['-clock_in']

    def __str__(self):
        return f"{self.user.full_name} - {self.clock_in}"

    @property
    def duration(self):
        """Calculate duration if clocked out"""
        if self.clock_out:
            return self.clock_out - self.clock_in
        return None

    @property
    def is_active(self):
        """Check if user is currently clocked in"""
        return self.clock_out is None 