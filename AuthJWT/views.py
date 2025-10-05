from django.shortcuts import render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User
import datetime
import time
#import os
import jwt
#import base64


@csrf_exempt
def login(request):
    if request.method == 'POST':
        username_req = request.POST.get('username')
        password_req = request.POST.get('password')
        try:
            timestamp_new = int(time.time())
            user_req = User.objects.get(username = username_req)
            private_key ="django-insecure-14g0@on!f@q-cr%&rvnd%v1vy*-jpt5dy-wx8(qlm5urg)nrm_"
            if (str(user_req.password) == str(password_req)):
                temp_id = str(user_req.id)
                temp_username = str(user_req.username)
                headers_jwt = {
                    "alg":"HS256",
                    "typ":"JWT"


                }
                jwt_payload = {
                    "sub": temp_id,
                    "name": temp_username,
                    "iat":timestamp_new,
                    "exp": timestamp_new + 3600

                }
                jwt_token = jwt.encode(payload=jwt_payload,key=private_key,algorithm="HS256",headers=headers_jwt )
                
            else:
                return HttpResponse("Nieprawidłowe hasło",status=400)
        except User.DoesNotExist:
            return HttpResponse("Nie znaleziono użytkownika",status=400)
        
        
        return JsonResponse({"token":jwt_token},status=200)
    else:

        return HttpResponse("Nieprawidłowe żądanie", status=200)

@csrf_exempt
def register(request):
    if request.method =='POST':
        try:
            username_new = request.POST.get('username')
            password_new = request.POST.get('password')
            email_new = request.POST.get('email')
            position_new =request.POST.get('position')
        except:
            return HttpResponse("Nieprawidłowe dane rejestracji", status=400)
        if username_new  and password_new  and is_email_valid(email_new):
            if position_new:
                User.objects.create(username=username_new, password=password_new,email=email_new,position=position_new)
            else:
                User.objects.create(username=username_new, password=password_new,email=email_new,position='user')
            return HttpResponse("Utworzono nowego użytkownika",status=200)
        else:
            return HttpResponse("Wprowadzono nieprawidłowe dane", status=400)
    else:
        return HttpResponse("Nieprawidłowe żądanie", status=400)

def logout(request):
    return HttpResponse("Nieprawidłowe żądanie", status=400)
# dodać blacklist dla zużytych tokenów który cyklicznie się czyści

def jwt_required(func): # wrapper dla zabezpieczenia urli
    def wrapper(request, *args,**kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JsonResponse({"error": "Brak nagłówka autoryzacji"})
        if(auth_header.startswith("Bearer")):
            token = auth_header.split(" ")[1] #dla Bearer ...token...
        else:
            token = auth_header
        try:
            private_key = "django-insecure-14g0@on!f@q-cr%&rvnd%v1vy*-jpt5dy-wx8(qlm5urg)nrm_"
            payload = jwt.decode(token,private_key,algorithms="HS256")
            request.jwt_payload = payload
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error":"Przedawniony token"})
        except jwt.InvalidTokenError:
            return JsonResponse({"error":"Nieprawidłowy token"})
        except Exception:
            return JsonResponse({"error":"Błąd"})
    
        return func(request,*args,**kwargs)
    return wrapper

@csrf_exempt
@jwt_required
def account_info(request):
    if request.method =='GET':
         jwt_payload = getattr(request, 'jwt_payload', None)
         username_req = jwt_payload.get("name")
         data = User.objects.get(username =username_req)
         return JsonResponse({"info":str(data)},status = 200)
    else:
         return HttpResponse("Nieprawidłowe żądanie", status=400)


def is_email_valid(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


# Create your views here.
