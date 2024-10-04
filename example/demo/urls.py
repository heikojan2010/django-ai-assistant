from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from demo import views


urlpatterns = [
    path("ai-assistant/", include("django_ai_assistant.urls")),
    path("htmx/", views.AIAssistantChatHomeView.as_view(), name="chat_home"),
    path(
        "htmx/thread/<int:thread_id>/",
        views.AIAssistantChatThreadView.as_view(),
        name="chat_thread",
    ),
    # Catch all for react app:
    path("", views.react_index, {"resource": ""}),
    path("<path:resource>", views.react_index),

    #path('sse/embedding/', views.sse_streaming_embedding_view, name='sse_embedding') #for the embeddigns 'stream' visualization
]


# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)




