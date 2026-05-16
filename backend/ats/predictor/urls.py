from django.urls import path
from .views import PredictATS

urlpatterns = [
    path('ats/score', PredictATS.as_view(), name='ats-score'),
]
