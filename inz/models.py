from django.db import models


class Comments(models.Model):
    zamowienie = models.ForeignKey('Zlecenia', on_delete=models.CASCADE, db_column='zamowienie_id')
    text = models.TextField()
    date = models.DateField(auto_now_add=True)
    deadline = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'comments'

class Zlecenia(models.Model):
    id = models.BigAutoField(primary_key=True)
    numer = models.CharField(max_length=100)
    zlecenie = models.CharField(max_length=100, blank=True, null=True)
    towar = models.CharField(max_length=555)
    ilosc = models.FloatField(blank=True, null=True)
    cena = models.FloatField(blank=True, null=True)
    osoba = models.CharField(max_length=100, blank=True, null=True)
    data_zamowienia = models.DateField()
    firma = models.CharField(max_length=200, blank=True, null=True)
    data_przewodnika = models.DateField(blank=True, null=True)
    data_oczekiwana = models.DateField(blank=True, null=True)
    data_wprowadzenia = models.DateField(blank=True, null=True)
    data_potwierdzona = models.DateField(blank=True, null=True)
    data_otwarcia = models.DateField(blank=True, null=True)
    data_zamkniecia = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=12, blank=True, null=True)

    class Meta:
        db_table = 'zlecenia'

from django.db import models

class Order(models.Model):
    numer = models.CharField(max_length=100)
    osoba = models.CharField(max_length=100, blank=True, null=True)
    cena = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    data_zamowienia = models.DateField(blank=True, null=True)
    data_oczekiwana = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, default="Brak")

    def __str__(self):
        return str(self.numer)
