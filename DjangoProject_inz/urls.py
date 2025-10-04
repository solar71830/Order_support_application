from django.urls import path, include

urlpatterns = [
    path('', include('inz.urls')),
    path('',include('AuthJWT.urls')),
]