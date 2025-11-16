from django.urls import path
from . import views
from .views import comments


urlpatterns = [
    path('update_status/<int:zamowienie_id>/', views.update_status, name='update_status'),
    path('', views.index, name='index'),
    path('comments/<int:zamowienie_id>/', views.comments, name='comments'),
    path('api/orders/', views.orders_api, name='orders_api'),  # <-- DODAJ TO
    path("api/comments/", comments, name="comments"),
    path('api/order/<int:zamowienie_id>/', views.order_detail, name='order_detail'),
]
