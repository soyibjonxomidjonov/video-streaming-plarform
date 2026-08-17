from django.contrib.postgres.indexes import GinIndex
from django.db import models




class Genre(models.Model):
    name = models.CharField(max_length=250, null=False, blank=False)

    class Meta:
        indexes = [
            GinIndex(fields=['name'], name='genre_name_trgm', opclasses=['gin_trgm_ops']),
        ]

    def __str__(self):
        return self.name

