from celery import shared_task
from apps.llm.models import SearchIndex
from apps.llm.services.embeddings import embed_text


@shared_task
def index_content_task(content_type, object_id, title, description):
    text = f"{title}. {description}"
    vector = embed_text(text)
    SearchIndex.objects.update_or_create(
        content_type=content_type, object_id=object_id,
        defaults={'title': title, 'description': description, 'embedding': vector}
    )



@shared_task
def unindex_content_task(content_type, object_id):
    SearchIndex.objects.filter(content_type=content_type, object_id=object_id).delete()










