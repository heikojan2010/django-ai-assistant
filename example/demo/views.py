# views.py
import time
from django.http import StreamingHttpResponse
from llama_index.embeddings.ollama import OllamaEmbedding
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.generic.base import TemplateView

from pydantic import ValidationError
from weather.ai_assistants import WeatherAIAssistant

from django_ai_assistant.api.schemas import (
    ThreadIn,
    ThreadMessageIn,
)
from django_ai_assistant.helpers.use_cases import (
    create_message,
    create_thread,
    get_thread_messages,
    get_threads,
)
from django_ai_assistant.models import Thread


def react_index(request, **kwargs):
    return render(request, "demo/react_index.html")



class BaseAIAssistantView(TemplateView):
    def get_assistant_id(self, **kwargs):
        """Returns the WeatherAIAssistant. Replace this with your own logic."""
        return WeatherAIAssistant.id

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        threads = list(get_threads(user=self.request.user))
        context.update(
            {
                "assistant_id": self.get_assistant_id(**kwargs),
                "threads": threads,
            }
        )
        return context


class AIAssistantChatHomeView(BaseAIAssistantView):
    template_name = "demo/chat_home.html"

    # POST to create thread:
    def post(self, request, *args, **kwargs):
        try:
            thread_data = ThreadIn(**request.POST)
        except ValidationError:
            messages.error(request, "Invalid thread data")
            return redirect("chat_home")

        thread = create_thread(
            name=thread_data.name,
            user=request.user,
            request=request,
        )
        return redirect("chat_thread", thread_id=thread.id)


class AIAssistantChatThreadView(BaseAIAssistantView):
    template_name = "demo/chat_thread.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        thread_id = self.kwargs["thread_id"]
        thread = get_object_or_404(Thread, id=thread_id)

        thread_messages = get_thread_messages(
            thread=thread,
            user=self.request.user,
            request=self.request,
        )
        context.update(
            {
                "thread_id": self.kwargs["thread_id"],
                "thread_messages": thread_messages,
            }
        )
        return context

    # POST to create message:
    def post(self, request, *args, **kwargs):
        assistant_id = self.get_assistant_id()
        thread_id = self.kwargs["thread_id"]
        thread = get_object_or_404(Thread, id=thread_id)

        try:
            message = ThreadMessageIn(
                assistant_id=assistant_id,
                content=request.POST.get("content") or None,
            )
        except ValidationError:
            messages.error(request, "Invalid message data")
            return redirect("chat_thread", thread_id=thread_id)

        create_message(
            assistant_id=assistant_id,
            thread=thread,
            user=request.user,
            content=message.content,
            request=request,
        )


        """
        def sse_streaming_embedding_view(self, request, *args, **kwargs):
            #Streams embeddings in real-time using Server-Sent Events.
            assistant_id = self.get_assistant_id()
            thread_id = self.kwargs["thread_id"]
            thread = get_object_or_404(Thread, id=thread_id)

            # Create an OllamaEmbedding instance
            ollama_embedding = OllamaEmbedding(
                model_name="llama3.1",
                base_url="http://localhost:11434",
                ollama_additional_kwargs={"mirostat": 0},
            )

            # Get the query from the POST request content
            query = request.POST.get("content", '')  # Use content from POST request

            def stream_embeddings():
                #Generator function to yield streaming embeddings.
                yield "event: message\n"
                yield f"data: Starting embedding stream for query: {query}\n\n"

                def send_token_to_frontend(token):
                    yield f"data: {token}\n\n"

                # Fetch the query embeddings and stream them
                ollama_embedding.get_query_embedding(query, streaming_callback=send_token_to_frontend)

                # End of stream
                yield "event: end\n"
                yield "data: [DONE]\n\n"

            # Return a streaming response with the generator
            return StreamingHttpResponse(stream_embeddings(), content_type='text/event-stream')

        return redirect("chat_thread", thread_id=thread_id)


    """