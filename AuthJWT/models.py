from django.db import models
import uuid
import time


class User (models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150,unique=True, null=False)
    email = models.EmailField(max_length=150,unique=True)
    password = models.CharField(max_length=150)
    position = models.CharField(max_length=150,null = True,blank=True)
    role = models.CharField(max_length=20, default='user')
    class Meta:
        db_table = 'authjwt_user'

def current_unix_t():
    return time.time()

class Blacklisted_jwt(models.Model):
    id =  models.BigAutoField(primary_key=True)
    jwt_token= models.TextField(max_length=512, unique=True,null=False)
    iat = models.BigIntegerField(default=current_unix_t())
    class Meta:
        db_table = 'authjwt_blacklisted'





# Create your models here.
