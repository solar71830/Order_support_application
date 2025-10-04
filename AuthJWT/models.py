from django.db import models
import uuid


class User (models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150,unique=True, null=False)
    email = models.EmailField(max_length=150,unique=True)
    password = models.CharField(max_length=150)
    position = models.CharField(max_length=150,null = True,blank=True)

class Meta (models.Model):
    db_table = 'authjwt_user'
    



# Create your models here.
