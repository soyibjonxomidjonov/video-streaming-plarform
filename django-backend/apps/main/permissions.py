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
        return obj.owner == request.user

class IsStaffOrReadOnly(permissions.BasePermission):
    """
     Agar zabros tashagan odam bo'lsa productlarni edit va delete qila oladi aks xolda uni faqat oqiy oladi
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff





















