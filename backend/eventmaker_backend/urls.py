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
    
    <h2>📋 Доступные endpoints и методы:</h2>
    <ul>
        <li>/api/events/
            <ul>
                <li>GET — получить все события</li>
                <li>POST — создать новое событие (тело запроса: title, description, date, time)</li>
            </ul>
        </li>
        <li>/api/events/&lt;id&gt;/
            <ul>
                <li>GET — получить событие по ID</li>
                <li>PUT — полностью обновить событие</li>
                <li>PATCH — частично обновить событие</li>
                <li>DELETE — удалить событие</li>
            </ul>
        </li>
        <li>/api/events/&lt;id&gt;/tasks/
            <ul>
                <li>GET — получить задачи события</li>
                <li>POST — создать новую задачу для события (тело запроса: title, content)</li>
            </ul>
        </li>
        <li>/api/events/&lt;id&gt;/finance/
            <ul>
                <li>GET — получить финансовые записи события</li>
                <li>POST — добавить запись (тело запроса: title, amount, type)</li>
            </ul>
        </li>
        <li>/api/tasks/
            <ul>
                <li>GET — получить все задачи</li>
                <li>POST — создать задачу</li>
            </ul>
        </li>
        <li>/api/tasks/&lt;id&gt;/
            <ul>
                <li>GET — получить задачу по ID</li>
                <li>PUT — полностью обновить задачу</li>
                <li>PATCH — частично обновить задачу</li>
                <li>DELETE — удалить задачу</li>
            </ul>
        </li>
        <li>/api/finance-items/
            <ul>
                <li>GET — получить все финансовые записи</li>
                <li>POST — создать запись</li>
            </ul>
        </li>
        <li>/api/finance-items/&lt;id&gt;/
            <ul>
                <li>GET — получить запись по ID</li>
                <li>PUT — полностью обновить запись</li>
                <li>PATCH — частично обновить запись</li>
                <li>DELETE — удалить запись</li>
            </ul>
        </li>
        <li>/api/notes/
            <ul>
                <li>GET — получить все заметки</li>
                <li>POST — создать заметку (тело запроса: event, title, content, tags)</li>
            </ul>
        </li>
        <li>/api/notes/&lt;id&gt;/
            <ul>
                <li>GET — получить заметку по ID</li>
                <li>PUT — полностью обновить заметку</li>
                <li>PATCH — частично обновить заметку</li>
                <li>DELETE — удалить заметку</li>
            </ul>
        </li>
        <li>/api/events/test/
            <ul>
                <li>GET — тест API</li>
            </ul>
        </li>
        <li>/admin/ — Django Admin панель</li>
    </ul>
    
    <p><strong>API работает на:</strong> http://127.0.0.1:8000/api/</p>
    """)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('events.urls')),
    path('', home, name='home'),
]
