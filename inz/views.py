from django.shortcuts import render, redirect, get_object_or_404
from .models import Zlecenia, Comments
from django.http import HttpResponse
from datetime import datetime, date
import numpy as np  # Upewnij się, że numpy jest zainstalowany

def index(request):
    today = datetime.now()

    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    osoba = request.GET.get('osoba')

    query = Zlecenia.objects.all()

    if start_date:
        query = query.filter(data_potwierdzona__gte=start_date)
    if end_date:
        query = query.filter(data_potwierdzona__lte=end_date)
    if osoba:
        query = query.filter(osoba=osoba)

    zamowienia_data = []
    for z in query:
        time_diff = (z.data_potwierdzona - today.date()).days if z.data_potwierdzona else None
        is_completed = z.data_zamkniecia is not None
        is_overdue = z.data_potwierdzona and z.data_potwierdzona < today.date() and not is_completed
        timeline_progress = np.log1p(time_diff) if time_diff and time_diff > 0 else 0
        timeline_progress_scaled = timeline_progress * 20  # Obliczenie wartości skalowanej
        comments = Comments.objects.filter(zamowienie_id=z)
        comments_count = comments.count()
        deadlines = [comment.deadline for comment in comments if comment.deadline]
        next_deadline = min(deadlines) if deadlines else None

        zamowienia_data.append({
            'id': z.id,
            'numer': z.numer,
            'data_potwierdzona': z.data_potwierdzona,
            'time_diff': time_diff if time_diff is not None else 0,
            'is_overdue': is_overdue,
            'is_completed': is_completed,
            'timeline_progress': timeline_progress,
            'timeline_progress_scaled': timeline_progress_scaled,  # Dodanie do kontekstu
            'wartosc': f"{round(z.cena * z.ilosc, 2) if z.cena and z.ilosc else 0:.2f}",
            'osoba': z.osoba,
            'comments_count': comments_count,
            'next_deadline': next_deadline.strftime('%Y-%m-%d') if next_deadline else "Brak",
            'status': z.status
        })

    unique_people = Zlecenia.objects.values_list('osoba', flat=True).distinct()
    return render(request, 'index.html', {'zamowienia': zamowienia_data, 'unique_people': unique_people})

def update_status(request, zamowienie_id):
    if request.method == 'POST':
        zamowienie = get_object_or_404(Zlecenia, id=zamowienie_id)
        new_status = request.POST.get('status')
        if new_status:
            zamowienie.status = new_status
            zamowienie.save()
            return redirect('index')  # Przekierowanie na stronę główną
    return HttpResponse("Nieprawidłowe żądanie", status=400)

def comments(request, zamowienie_id):
    zamowienie = get_object_or_404(Zlecenia, id=zamowienie_id)
    if request.method == 'POST':
        text = request.POST.get('comment')
        deadline = request.POST.get('deadline')
        if text:
            Comments.objects.create(
                zamowienie=zamowienie,
                text=text,
                deadline=deadline if deadline else None
            )
            return redirect('comments', zamowienie_id=zamowienie_id)
    comments_list = Comments.objects.filter(zamowienie=zamowienie)
    return render(request, 'comments.html', {
        'zamowienie_numer': zamowienie.numer,
        'comments': comments_list
    })