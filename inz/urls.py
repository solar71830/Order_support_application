from django.urls import path
from . import views

urlpatterns = [
    path('update_status/<int:zamowienie_id>/', views.update_status, name='update_status'),
    path('', views.index, name='index'),
    path('comments/<int:zamowienie_id>/', views.comments, name='comments'),
    path('api/orders/', views.orders_api, name='orders_api'),  # <-- DODAJ TO
]
