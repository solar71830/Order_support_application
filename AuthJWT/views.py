from django.shortcuts import render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from .models import User
import datetime
import os
import jwt

def login(request):
    if request.method == 'POST':
        username_req = request.POST.get('username')
        password_req = request.POST.get('password')
        try:
            user_req = User.objects.get(username = username_req)
            if (user_req.password == password_req):
                payload = {
                    "id": str(user_req.id),
                    "username": user_req.username,
                    "exp": datetime.datetime.now() + datetime.timedelta(minutes=30)

                }
                private_key =os.environ.get("SECRET_KEY")
                jwt_key = jwt.encode(payload,key=private_key,algorithm="HS256")
            else:
                return HttpResponse("Nieprawidłowe hasło",status=400)
        except User.DoesNotExist:
            return HttpResponse("Nie znaleziono użytkownika",status=400)
        
        
        return JsonResponse(jwt_key,status=200)
    else:

        return HttpResponse("Nieprawidłowe żądanie", status=200)

def register(request):
    if request.method =='POST':
        username_new = request.POST.get('username')
        password_new = request.POST.get('password')
        email_new = request.POST.get('email')
        
        if len(username_new) < 150 and len(password_new) < 150 and is_email_valid(email_new):
            User.objects.create(username=username_new, password=password_new,email=email_new,position='user')

        return HttpResponse("Utworzono nowego użytkownika",status=200)
    else:
        return HttpResponse("Nieprawidłowe żądanie", status=400)

def logout(request):
    return HttpResponse("Nieprawidłowe żądanie", status=400)
# dodać blacklist dla zużytych tokenów który cyklicznie się czyści

def account_info(request):
    return HttpResponse("Nieprawidłowe żądanie", status=400)
# dodać request dla użytkownika dla informacji o swoim koncie

def is_email_valid(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


# Create your views here.
