import requests
import logging
from . import models


logger = logging.getLogger(__name__)


class ClientError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class FineCollectionClient:
    def __init__(self, base_address: str):
        self.base_address = base_address

    def collect_fine(self, violation: models.SpeedingViolation):
        request_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        response = requests.post(
            f"{self.base_address}/collectfine",
            data=violation.json(),
            headers=request_headers
        )

        if not response.ok:
            logger.error(
                "Received status %i from finecollection service: %s",
                response.status_code,
                str(response.content)
            )

            raise ClientError(f"Can't collect fine. Got status {response.status_code}")
