

from django.urls import path
from .views import login,register,logout,account_info,account_edit,account_delete


urlpatterns = [
    path('login/',login,name='login'),
    path('register/',register,name='register'),
    path('logout/',logout,name='logout'),
    path('account-info/',account_info,name='info'),
    path('account-edit/',account_edit,name='edit'),
    path('account-delete/',account_delete,name='delete'),

]