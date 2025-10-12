from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role")

# Register your models here.

user = User.objects.get(username="admin")
user.set_password("admin123")  # Zaszyfrowanie hasła
user.role = "admin"
user.save()
