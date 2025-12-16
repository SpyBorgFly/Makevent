from rest_framework import serializers
from .models import Event, Task, FinanceItem, Note, TelegramUser
from django.contrib.auth.models import User


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'event_day',
            'event_time',
            'event_type',
            'status',
            # 'created_by' — УБРАНО! Заполняется автоматически на сервере
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'event', 'title', 'description', 'status', 'priority',
            'start_date', 'due_date', 'is_completed', 'assignees',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    # assignees как список id
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['assignees'] = [user.id for user in instance.assignees.all()]
        return data


class FinanceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceItem
        fields = [
            'id', 'event', 'title', 'amount', 'type', 'category',
            'date', 'description',
            # 'created_by' — УБРАНО! Заполняется автоматически
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            'id',
            'event',
            'title',
            'content',
            'tags',
            # 'created_by' — УБРАНО! Заполняется автоматически
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TelegramUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramUser
        fields = ['telegram_id', 'username', 'first_name', 'last_name', 'language_code', 'is_premium']


class TelegramAuthSerializer(serializers.Serializer):
    """Сериализатор для данных аутентификации Telegram"""
    initData = serializers.CharField(required=True)
    
    def validate(self, data):
        init_data = data.get('initData')
        if not init_data:
            raise serializers.ValidationError("initData is required")
        return data


class UserSerializer(serializers.ModelSerializer):
    telegram_profile = TelegramUserSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'telegram_profile']