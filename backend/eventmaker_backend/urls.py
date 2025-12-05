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

    <h3>События</h3>
    <ul>
        <li>GET /api/events/ — список событий</li>
        <li>POST /api/events/ — создать событие</li>
        <li>GET /api/events/&lt;id&gt;/ — детальная информация</li>
        <li>PUT /api/events/&lt;id&gt;/ — обновить</li>
        <li>DELETE /api/events/&lt;id&gt;/ — удалить</li>
        <li>GET /api/events/my_events/ — только события пользователя</li>
        <li>GET /api/events/&lt;id&gt;/tasks/ — задачи события</li>
        <li>GET /api/events/&lt;id&gt;/finance/ — финансы события</li>
    </ul>

    <h3>Задачи</h3>
    <ul>
        <li>GET /api/tasks/ — список задач</li>
        <li>POST /api/tasks/ — создать</li>
        <li>GET /api/tasks/&lt;id&gt;/ — детальная</li>
        <li>PUT /api/tasks/&lt;id&gt;/ — обновить</li>
        <li>DELETE /api/tasks/&lt;id&gt;/ — удалить</li>
    </ul>

    <h3>Финансовые записи</h3>
    <ul>
        <li>GET /api/finance-items/ — список</li>
        <li>POST /api/finance-items/ — создать</li>
        <li>GET /api/finance-items/&lt;id&gt;/ — детальная</li>
        <li>PUT /api/finance-items/&lt;id&gt;/ — обновить</li>
        <li>DELETE /api/finance-items/&lt;id&gt;/ — удалить</li>

        <li><strong>GET /api/finance/summary/ — агрегированные финансовые данные</strong></li>
    </ul>

    <h3>Заметки</h3>
    <ul>
        <li>GET /api/notes/ — список заметок</li>
        <li>POST /api/notes/ — создать заметку</li>
        <li>GET /api/notes/&lt;id&gt;/ — детальная</li>
        <li>PUT /api/notes/&lt;id&gt;/ — обновить</li>
        <li>DELETE /api/notes/&lt;id&gt;/ — удалить</li>
    </ul>

    <h3>Сортировка событий</h3>
    <p>Поддерживается серверная сортировка по типу и по статусу события.</p>
    <ul>
        <li>GET /api/events/?type=conference — фильтр по типу</li>
        <li>GET /api/events/?type=webinar — фильтр по типу</li>
        <li>GET /api/events/?type=teambuilding — фильтр по типу</li>

        <li>GET /api/events/?status=planned — фильтр по статусу</li>
        <li>GET /api/events/?status=active — фильтр по статусу</li>
        <li>GET /api/events/?status=completed — фильтр по статусу</li>
        <li>GET /api/events/?status=cancelled — фильтр по статусу</li>

        <li>GET /api/events/?type=webinar&status=active — комбинированная сортировка</li>
    </ul>

    <p>Фронт может просто добавлять параметры в URL, и бэк вернёт уже отсортированные данные.</p>

    <p><strong>API работает на:</strong> http://127.0.0.1:8000/api/</p>
    """)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('events.urls')),
    path('', home, name='home'),
]
