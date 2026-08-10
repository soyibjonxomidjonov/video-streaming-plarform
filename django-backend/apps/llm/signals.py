from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


from .tasks import index_content_task, unindex_content_task
from apps.main.models import Movie, Series


@receiver(post_save, sender=Movie)
def index_movie(sender, instance, **kwargs):
    index_content_task.delay('movie', instance.id, instance.title, instance.description)



@receiver(post_delete, sender=Movie)
def unindex_movie(sender, instance, **kwargs):
    unindex_content_task.delay("movie", instance.id)







@receiver(post_save, sender=Series)
def index_series(sender, instance, **kwargs):
    index_content_task.delay('series', instance.id, instance.title, instance.description)



@receiver(post_delete, sender=Series)
def unindex_series(sender, instance, **kwargs):
    unindex_content_task.delay("series", instance.id)