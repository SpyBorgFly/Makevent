"""
URL configuration for eventmaker_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home(request):
    return HttpResponse("""
    <h1>🚀 EventMaker API</h1>
    <p>Django REST API для управления событиями</p>
    <h2>📋 Доступные endpoints:</h2>
    <ul>
        <li><a href="/api/events/">GET /api/events/</a> - Получить все события</li>
        <li><a href="/api/events/test/">GET /api/events/test/</a> - Тест API</li>
        <li><a href="/admin/">Django Admin</a> - Админ панель</li>
    </ul>
    <p><strong>API работает на:</strong> http://127.0.0.1:8000/api/events/</p>
    """)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('events.urls')),
    path('', home, name='home'),
]
