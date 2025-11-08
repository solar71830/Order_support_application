from django.shortcuts import render
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse, QueryDict
from django.views.decorators.csrf import csrf_exempt
from .models import User,Blacklisted_jwt
import datetime
import time
#import os
import jwt
#import base64
from django.contrib.auth import authenticate
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from inz.models import Zlecenia, Comments
from datetime import datetime


@csrf_exempt
def login(request):
    if request.method == 'POST':
        username_req = request.POST.get('username')
        password_req = request.POST.get('password')
        try:
            user_req = User.objects.get(username = username_req)
            if (str(user_req.password) == str(password_req)):
                timestamp_new = int(time.time())
                private_key ="django-insecure-14g0@on!f@q-cr%&rvnd%v1vy*-jpt5dy-wx8(qlm5urg)nrm_"
                temp_id = str(user_req.id)
                temp_username = str(user_req.username)
                print(user_req)
                headers_jwt = {
                    "alg":"HS256",
                    "typ":"JWT"
                }
                
                if(user_req.role == "admin"):
                    is_admin = True
                else:
                    is_admin = False

                jwt_payload = {
                    "sub": temp_id,
                    "name": temp_username,
                    "iat":timestamp_new,
                    "exp": timestamp_new + 3600,
                    "admin": is_admin

                }
                jwt_token = jwt.encode(payload=jwt_payload,key=private_key,algorithm="HS256",headers=headers_jwt )
                
            else:
                return HttpResponse("Nieprawidłowe hasło",status=400)
        except User.DoesNotExist:
            return HttpResponse("Nie znaleziono użytkownika",status=400)
        
        
        return JsonResponse({"token":jwt_token},status=200)
    else:

        return HttpResponse("Nieprawidłowe żądanie", status=200)
    

def jwt_required(func): # wrapper dla zabezpieczenia urli
    def wrapper(request, *args,**kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JsonResponse({"error": "Brak nagłówka autoryzacji"})
        check_token = Blacklisted_jwt.objects.filter(jwt_token=auth_header).exists()
        if check_token:
            return JsonResponse({"error":"Przedawniony token"})
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
def register(request):
    # SUPERUSER - do sprawdzenia czy uzytkoiwnik moze korzystac z opcji tworzenia konta
    jwt_payload = getattr(request,"jwt_payload",None)
    role_req = jwt_payload.get("admin")
    if role_req!= True:
        return HttpResponse("Brak uprawnień", status=403)
    username_req =  request.POST.get("username")
    user_exists = User.objects.filter(username=username_req).exists()
    if(user_exists):
        return HttpResponse("Użytkownik o podanej nazwie już istnieje, wprowadź inną nazwę użytkownika",status=400)
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

@csrf_exempt
@jwt_required
def account_info(request):
    if request.method =='GET':
         jwt_payload = getattr(request, 'jwt_payload', None)
         role_req = jwt_payload.get("admin")
         if role_req!= True:
            return HttpResponse("Brak uprawnień", status=403)
         username_req = request.POST.get("username")
         user = User.objects.get(username=username_req)
         return JsonResponse({
            "info": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "position": user.position,
                "role": user.role
            }
        }, status=200)
    else:
         return HttpResponse("Nieprawidłowe żądanie", status=400)
    
@csrf_exempt
@jwt_required
def account_edit(request):
    if request.method=='POST':
        jwt_payload = getattr(request,"jwt_payload",None)
        role_req = jwt_payload.get("admin")
        if role_req!= True:
            return HttpResponse("Brak uprawnień", status=403)

        #dane dot. roli
        token_data = getattr(request,'jwt_payload',None)
        is_admin = token_data.get("admin")

        #nowe dane do wyedytowania
        username_data = request.POST.get("username")
        email_new = request.POST.get("email")
        password_new = request.POST.get("password")
        position_new= request.POST.get("password")
        role_new = request.POST.get("role")
        data = {}
        if User.objects.filter(username=username_data).exists():
            if email_new:
                data["email"] = email_new
            if password_new:
                data["password"] = password_new
            if position_new:
                data["position"] = position_new
            if role_new and is_admin: # tylko admin może tworzyć nowych adminów lub zmieniać role
                data["role"] = role_new
            if data:
                User.objects.filter(username=username_data).update(**data)
                return HttpResponse("Zaktualizowano dane użytkownika",status=200)
            else:
                return HttpResponse("Brak danych do zaktualizowania", status=400)
        else:
            return HttpResponse("Nie znaleziono użytkownika", status=401)
            
    else:
        return HttpResponse("Błąd", status=400)

@csrf_exempt
@jwt_required
def account_delete(request):
        if request.method=='POST':
            username_data = request.POST.get("username")
            if User.objects.filter(username=username_data).exists():
                User.objects.filter(username= username_data).delete()
                return HttpResponse("Pomyślnie usunięto użytkownika", status=200)
            else:
                return HttpResponse("Nie znaleziono użytkownika", status=404)
        else:
            return HttpResponse("Błąd",status=400)

    

@csrf_exempt
@jwt_required
def logout(request):
    if request.method == "POST":
        auth_header = request.headers.get("Authorization")
        token = Blacklisted_jwt.objects.filter(jwt_token=auth_header).exists()
        if not token:
            Blacklisted_jwt.objects.create(jwt_token=auth_header)
            return HttpResponse("Pomyślnie wylogowano", status=200)
        else:
            return HttpResponse("Błąd: Token znajduje się w bazie przedawnionych tokenów",status=400)


def is_email_valid(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False


# Create your views here.

#lista uzytkiownikow
@csrf_exempt
@jwt_required
def users_list(request):
    if request.method == 'GET':
        jwt_payload = getattr(request,"jwt_payload",None)
        role_req = jwt_payload.get("admin")
        if role_req!= True:
            return HttpResponse("Brak uprawnień", status=403)
        users = User.objects.all().values("username")
        return JsonResponse({"users": list(users)}, status=200)
    else:
        return HttpResponse("Nieprawidłowe żądanie", status=400)

@csrf_exempt
def login_view(request): #???
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(username=username, password=password)
        if user:
            return JsonResponse({"message": "Login successful"})
        else:
            return JsonResponse({"error": "Invalid credentials"}, status=401)
    return JsonResponse({"error": "Invalid request method"}, status=405)




#raporty
@csrf_exempt
@jwt_required
def user_report(request):
    # Pobierz parametry z GET
    osoba = request.GET.get("user_id")  # W rzeczywistości jest to nazwa osoby
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    # Sprawdź, czy podano wymagane dane
    if not osoba or not start_date or not end_date:
        return HttpResponse("Brak wymaganych danych", status=400)

    # Pobierz zlecenia dla osoby w podanym okresie
    try:
        zlecenia = Zlecenia.objects.filter(
            osoba=osoba,
            data_zamowienia__range=[start_date, end_date]
        )
    except Exception as e:
        return HttpResponse(f"Błąd pobierania danych: {str(e)}", status=500)

    # Przygotuj odpowiedź PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="raport_pracownika_{osoba}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    # Nagłówek
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(width / 2, height - 60, "RAPORT PRACOWNIKA")

    # Firma i data
    p.setFont("Helvetica", 12)
    p.drawString(40, height - 100, "Nazwa firmy/logo")
    p.drawRightString(width - 40, height - 100, f"Data dokumentu: {datetime.now().strftime('%Y-%m-%d')}")

    # Dane pracownika
    p.drawString(40, height - 140, f"Pracownik: {osoba}")
    p.drawString(40, height - 160, f"Okres raportu: od {start_date} do {end_date}")

    # Tabela zleceń
    p.drawString(40, height - 200, "Lp.")
    p.drawString(80, height - 200, "Numer zamówienia")
    p.drawString(200, height - 200, "Wartość zamówienia")
    p.drawString(320, height - 200, "Termin")
    p.drawString(400, height - 200, "Firma")

    y = height - 220
    font_name = "Helvetica"
    font_size = 12
    max_width_firma = 200  # Maksymalna szerokość tekstu w punktach dla "Firma"

    for idx, zlecenie in enumerate(zlecenia, start=1):
        p.drawString(40, y, str(idx))
        p.drawString(80, y, zlecenie.numer)
        p.drawString(200, y, str(zlecenie.cena))
        p.drawString(320, y, zlecenie.data_zamowienia.strftime('%Y-%m-%d'))

        # Formatowanie "Firma"
        firma = zlecenie.firma
        if p.stringWidth(firma, font_name, font_size) > max_width_firma:
            words = firma.split(" ")
            current_line = ""
            for word in words:
                if p.stringWidth(current_line + word, font_name, font_size) <= max_width_firma:
                    current_line += word + " "
                else:
                    p.drawString(400, y, current_line.strip())
                    y -= 20
                    current_line = word + " "
            if current_line:  # Rysuj ostatnią linię
                p.drawString(400, y, current_line.strip())
                y -= 20
        else:
            p.drawString(400, y, firma)

        y -= 20
        if y < 50:  # Przejście na nową stronę
            p.showPage()
            y = height - 50

    # Podpis
    p.setFont("Helvetica", 12)
    p.drawString(40, y - 40, "Wykonał:")
    p.drawString(40, y - 60, osoba)
    p.drawString(40, y - 80, datetime.now().strftime('%Y-%m-%d'))

    p.showPage()
    p.save()
    return response


@csrf_exempt
@jwt_required
def order_report(request):
    # Pobierz parametry z GET
    numer = request.GET.get("order_id")  # Numer zamówienia

    # Sprawdź, czy podano wymagane dane
    if not numer:
        return HttpResponse("Brak numeru zamówienia", status=400)

    # Pobierz zamówienie na podstawie numeru
    try:
        zlecenie = Zlecenia.objects.get(numer=numer)
    except Zlecenia.DoesNotExist:
        return HttpResponse("Nie znaleziono zamówienia", status=404)

    # Pobierz komentarze powiązane z zamówieniem
    try:
        komentarze = Comments.objects.filter(zamowienie=zlecenie)  # Poprawione filtrowanie
    except Exception as e:
        komentarze = []

    # Przygotuj odpowiedź PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="raport_zamowienia_{numer}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    # Nagłówek
    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(width / 2, height - 60, "RAPORT ZAMÓWIENIA")

    # Firma i data
    p.setFont("Helvetica", 12)
    p.drawString(40, height - 100, "Nazwa firmy/logo")
    p.drawRightString(width - 40, height - 100, f"Data dokumentu: {datetime.now().strftime('%Y-%m-%d')}")

    # Dane zamówienia
    p.drawString(40, height - 140, f"Numer zamówienia: {zlecenie.numer}")
    p.drawString(40, height - 160, f"Wartość zamówienia: {zlecenie.cena}")
    p.drawString(40, height - 180, f"Osoba odpowiedzialna: {zlecenie.osoba}")
    p.drawString(40, height - 200, f"Termin: {zlecenie.data_zamowienia.strftime('%Y-%m-%d')}")
    p.drawString(40, height - 220, f"Status: {zlecenie.status}")
    p.drawString(40, height - 240, f"Data zmiany statusu na 'Zrealizowany': {zlecenie.data_oczekiwana.strftime('%Y-%m-%d')}")

    # Zawartość zamówienia
    p.drawString(40, height - 280, "Lp.")
    p.drawString(80, height - 280, "Towar")
    p.drawString(400, height - 280, "Ilość")
    p.drawString(470, height - 280, "Cena")

    y = height - 300
    p.drawString(40, y, "1")  # Przykład dla jednego towaru

    # Obsługa długiego tekstu w polu "Towar"
    towar = zlecenie.towar
    max_width = 300  # Maksymalna szerokość tekstu w punktach
    font_size = 12
    font_name = "Helvetica"

    # Ustaw czcionkę
    p.setFont(font_name, font_size)

    # Sprawdź szerokość tekstu
    if p.stringWidth(towar, font_name, font_size) > max_width:
        words = towar.split(" ")
        current_line = ""
        for word in words:
            if p.stringWidth(current_line + word, font_name, font_size) <= max_width:
                current_line += word + " "
            else:
                p.drawString(80, y, current_line.strip())
                y -= 20
                current_line = word + " "
        if current_line:  # Rysuj ostatnią linię
            p.drawString(80, y, current_line.strip())
            y -= 20
    else:
        p.drawString(80, y, towar)

    p.drawString(400, height - 300, str(zlecenie.ilosc))
    p.drawString(470, height - 300, str(zlecenie.cena))
    y -= 40

    # Komentarze do zamówienia
    p.drawString(40, y, "Komentarze do zamówienia:")
    y -= 20
    p.drawString(40, y, "Lp.")
    p.drawString(80, y, "Komentarz")
    p.drawString(320, y, "Data powstania")  # Usunięto autora

    y -= 20
    for idx, komentarz in enumerate(komentarze, start=1):
        p.drawString(40, y, str(idx))
        p.drawString(80, y, komentarz.text)
        p.drawString(320, y, komentarz.date.strftime('%Y-%m-%d'))
        y -= 20
        if y < 50:  # Przejście na nową stronę
            p.showPage()
            y = height - 50

    # Podpis
    p.setFont("Helvetica", 12)
    p.drawString(40, y - 40, "Wykonał:")
    p.drawString(40, y - 60, zlecenie.osoba)
    p.drawString(40, y - 80, datetime.now().strftime('%Y-%m-%d'))

    p.showPage()
    p.save()
    return response
