from django.test import TestCase
from AuthJWT.models import User
import pytest

@pytest.mark.django_db
def test_login(client):
    user, created = User.objects.get_or_create(
        username="testadmin",
        defaults={
            "password": "admin123",
            "email": "testadmin@example.com",
            "position": "admin",
            "role": "admin"
        }
    )
    response = client.post(
        "/login/",
        {"username": "testadmin", "password": "admin123"}
    )
    assert response.status_code == 200
    print(response.json()["token"])
