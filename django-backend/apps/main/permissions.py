from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Agar get request yuborilsa hamma o'qiy oladi,
    Agar post, put, patch, delete bo'lsa faqatgina o'z egasigina qila oladi

    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the snippet.
        user_attr = getattr(obj, 'user', None) or getattr(obj, 'owner', None)
        return user_attr == request.user

class IsStaffOrReadOnly(permissions.BasePermission):
    """
     Agar zabros tashagan odam bo'lsa productlarni edit va delete qila oladi aks xolda uni faqat oqiy oladi
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff






class IsSuperuserOrReadOnly(permissions.BasePermission):
    """
    Agar so'rov yuborgan foydalanuvchi superuser bo'lsa, productlarni
    yaratish/edit/delete qila oladi. Aks holda faqat o'qiy oladi (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        # SAFE_METHODS = GET, HEAD, OPTIONS — bularga hammaga ruxsat
        if request.method in permissions.SAFE_METHODS:
            return True

        # Qolgan metodlar (POST, PUT, PATCH, DELETE) — faqat superuser
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
















