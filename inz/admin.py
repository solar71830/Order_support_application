# Python: inz/admin.py
from django.contrib import admin
from .models import Zlecenia, Comments

@admin.register(Zlecenia)
class ZleceniaAdmin(admin.ModelAdmin):
    list_display = ('numer', 'status', 'data_zamowienia', 'firma', 'cena')
    list_filter = ('status', 'firma', 'data_zamowienia')
    search_fields = ('numer', 'status', 'firma')
    ordering = ('data_zamowienia',)
    date_hierarchy = 'data_zamowienia'

@admin.register(Comments)
class CommentsAdmin(admin.ModelAdmin):
    list_display = ('zamowienie_id', 'date', 'deadline', 'text')
    list_filter = ('date', 'deadline')
    search_fields = ('text',)
    ordering = ('date',)