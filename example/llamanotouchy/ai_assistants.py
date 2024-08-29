import json

from django.contrib.auth.models import User

from django_ai_assistant import AIAssistant, method_tool
from issue_tracker.models import Issue

from django_ai_assistant import AIAssistant
from langchain_ollama import ChatOllama

class WeatherAIAssistant(AIAssistant):
    id = "weather_assistant"
    name = "Weather Assistant"
    instructions = "You are a weather bot."
    model = "llama3.1"

    def get_llm(self):
        model = self.get_model()
        temperature = self.get_temperature()
        model_kwargs = self.get_model_kwargs()
        return ChatOllama(
            model_name=model,
            temperature=temperature,
            model_kwargs=model_kwargs,
            timeout=None,
            max_retries=2,
        )