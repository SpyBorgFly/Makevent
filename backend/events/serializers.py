from rest_framework import serializers
from .models import Event, Task, FinanceItem, Note

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
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

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
            'date', 'description', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = [
            'id',
            'event',
            'title',
            'content',
            'tags',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


