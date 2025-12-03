from django.test import TestCase
from AuthJWT.models import User
import pytest

@pytest.mark.django_db
def test_login(client):
    # tworzenie domyślnego użytkownika typu admin w celu uzyskania możliwości tworzenia innych użytkowników
    user, created = User.objects.get_or_create(
        username="testadmin",
        defaults={
            "password": "admin123",
            "email": "testadmin@example.com",
            "position": "admin",
            "role": "admin"
        }
    )
    # test logowania do użytkownika
    response = client.post(
        "/login/",
        {"username": "testadmin", "password": "admin123"}
    )
    print("\nLogin",response.json()["token"])
    assert response.status_code == 200


    token = response.json()["token"]

    # test tworzenia nowego użytkownika
    create_user = client.post("/register/", data={"username": "test_user", "password": "Zaq12wsx", "email": "testuser@example.com", "position": "user", "role": "user"}, headers={
        "Authorization": f"Bearer {token}"
    },)
    print("\nCreate-User",create_user)
    assert create_user.status_code == 200

    # test uzyskania informacji o użytkowniku
    user_info = client.get("/account-info/?username=test_user", headers={
        "Authorization": f"Bearer {token}"
    },)
    print("\nUser-info", user_info.json())
    assert user_info.status_code == 200

    #test zmienienia danych użytkownika, w tym wypadku z typu user na admin
    edit_user = client.post("/account-edit/", data={"username": "test_user","password":"a113","position":"admin","role":"admin"}, headers={
        "Authorization": f"Bearer {token}"
    },)
    print("\nEdit", edit_user)
    assert edit_user.status_code == 200

    logout_message = client.post("/logout/", headers={
        "Authorization": f"Bearer {token}"
    },)
    print("\nLogout", logout_message)
    assert logout_message.status_code == 200

    # testowanie użytkownika user

    response2 = client.post(
        "/login/",
        {"username": "test_user", "password": "a113"}
    )
    print("\nLogin", response2.json()["token"])
    assert response2.status_code == 200

    token2 = response2.json()["token"]

    # uzyskiwanie dostępu do listy użytkowników
    user_list = client.get("/users-list/", headers={"Authorization": f"Bearer {token2}"})
    print("\nUser-list", user_list.json())
    assert user_list.status_code == 200

    #usuwanie użytkownika
    user_delete_message = client.post("/account-delete/",data={"username":"testadmin"}, headers={"Authorization": f"Bearer {token2}"})
    print("\nDelete", user_delete_message)
    assert user_delete_message.status_code == 200



    
