from django.contrib import admin
from .models import Event, Task, FinanceItem, Note, TelegramUser

# Регистрируем модели для админки
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'event_day', 'event_type', 'status', 'created_by', 'created_at')
    list_filter = ('event_type', 'status', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'event', 'status', 'priority', 'due_date', 'is_completed')
    list_filter = ('status', 'priority', 'is_completed')
    search_fields = ('title', 'description')
    ordering = ('-due_date',)

@admin.register(FinanceItem)
class FinanceItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'amount', 'type', 'category', 'date', 'created_by', 'event')
    list_filter = ('type', 'category', 'date')
    search_fields = ('title', 'description')
    ordering = ('-date',)

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'event', 'created_by', 'created_at')
    search_fields = ('title', 'content', 'tags')
    ordering = ('-created_at',)

@admin.register(TelegramUser)
class TelegramUserAdmin(admin.ModelAdmin):
    list_display = ('telegram_id', 'username', 'first_name', 'last_name', 'django_user', 'created_at')
    search_fields = ('telegram_id', 'username', 'first_name')
    ordering = ('telegram_id',)