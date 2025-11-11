import logging
from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from geocraft_api.models.project import ProjectItem

logger = logging.getLogger(__name__)


def project_owner_required():
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user

            if not user or not user.is_authenticated:
                return Response({
                    "data": "",
                    "success": False,
                    "message": "Wymagane uwierzytelnienie"
                }, status=status.HTTP_401_UNAUTHORIZED)

            project_name = request.data.get("project") or request.POST.get("project") or request.query_params.get("project")

            if not project_name:
                return Response({
                    "data": "",
                    "success": False,
                    "message": "Brak nazwy projektu"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                project_item = ProjectItem.objects.filter(project_name=project_name).first()

                if not project_item:
                    return Response({
                        "data": "",
                        "success": False,
                        "message": "Projekt nie istnieje"
                    }, status=status.HTTP_404_NOT_FOUND)

                if project_item.user != user:
                    return Response({
                        "data": "",
                        "success": False,
                        "message": "Akcja niedozwolona dla podużytkowników"
                    }, status=status.HTTP_403_FORBIDDEN)

                return view_func(request, *args, **kwargs)

            except Exception as error:
                logger.error("Error checking project owner: %s", str(error))
                return Response({
                    "data": "",
                    "success": False,
                    "message": "Błąd podczas sprawdzania uprawnień"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return wrapper

    return decorator
