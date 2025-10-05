

from django.urls import path
from .views import login,register,logout,account_info


urlpatterns = [
    path('login/',login,name='login'),
    path('register/',register,name='register'),
    path('logout/',logout,name='logout'),
    path('account-info/',account_info,name='logout'),

]