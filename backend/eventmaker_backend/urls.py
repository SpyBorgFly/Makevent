"""
URL configuration for eventmaker_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    # Перенаправление корневого URL на API документацию
    path('', RedirectView.as_view(url='/api/', permanent=False)),
    
    # Админка Django
    path('admin/', admin.site.urls),
    
    # API версия 1 (основная)
    path('api/', include('events.urls')),
]

# Добавляем маршруты для статики и медиа в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Кастомные обработчики ошибок
handler400 = 'events.views.bad_request'
handler403 = 'events.views.permission_denied'
handler404 = 'events.views.page_not_found'
handler500 = 'events.views.server_error'