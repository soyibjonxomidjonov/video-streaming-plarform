# from django.db import models
# from pgvector.django import VectorField, HnswIndex
#
# CONTENT_TYPE_CHOICES = [("movie", "Movie"), ("series", "Series")]
#
#
# class SearchIndex(models.Model):
#     content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
#     object_id = models.IntegerField()
#     title = models.CharField(max_length=140)
#     description = models.TextField()
#     embedding = VectorField(dimensions=768)
#
#     class Meta:
#         unique_together = ("content_type", "object_id")
#         indexes = [
#             models.Index(fields=["content_type", "object_id"]),
#             HnswIndex(
#                 name="search_embedding_hnsw_idx",
#                 fields=["embedding"],
#                 m=16,
#                 ef_construction=64,
#                 opclasses=["vector_cosine_ops"]
#             )
#         ]
#




