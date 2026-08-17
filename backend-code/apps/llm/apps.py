from django.apps import AppConfig


class LlmConfig(AppConfig):
    name = 'apps.llm'


    def ready(self):
        import apps.llm.signals
