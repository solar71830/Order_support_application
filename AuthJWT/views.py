from django.shortcuts import render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
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
                    "iat": datetime.datetime.now(),
                    "exp": datetime.datetime.now() - datetime.timedelta(minutes=30),
                    "alg": "HS256"

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

@csrf_exempt
def register(request):
    if request.method =='POST':
        try:
            username_new = request.POST.get('username')
            password_new = request.POST.get('password')
            email_new = request.POST.get('email')
            position_new =request.POST.get('position')
            #print(f'{username_new}\n{password_new}\n{email_new}\n{position_new}')
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

def account_info(request):
    return HttpResponse("Nieprawidłowe żądanie", status=400)
# dodać request dla użytkownika dla informacji o swoim koncie

def jwt_required(func): # wrapper dla zabezpieczenia urli
    def wrapper(request, *args,**kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Authorization"):
            return JsonResponse({"error": "Brak nagłówka autoryzacji"})
        token = auth_header.split(" ")[1]
        try:
            private_key =os.environ.get("SECRET_KEY")
            payload = jwt.decode(token,private_key,algorithm="HS256")
            user_id = payload["id"]
            try:
                user_data = User.objects.get(id=user_id)
                
            except Exception:
                return JsonResponse({"error":"błąd autoryzacji"})
        except jwt.ExpiredSignatureError:
            return JsonResponse({"error":"Przedawniony token"})
        except jwt.InvalidTokenError:
            return JsonResponse({"error":"Nieprawidłowy token"})
        if user_data:
            return func(request,*args,**kwargs)
    return wrapper




def is_email_valid(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


# Create your views here.
