from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.engine import Dialect
from sqlalchemy.types import Text, TypeDecorator

from app.core.config import settings


class EncryptedToken(TypeDecorator[str]):
    impl = Text
    cache_ok = True

    def __init__(self) -> None:
        super().__init__()
        self._fernet = Fernet(settings.google_token_encryption_key.encode("ascii"))

    def process_bind_param(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return self._fernet.encrypt(value.encode("utf-8")).decode("ascii")

    def process_result_value(self, value: str | None, dialect: Dialect) -> str | None:
        if value is None:
            return None
        try:
            return self._fernet.decrypt(value.encode("ascii")).decode("utf-8")
        except (InvalidToken, UnicodeError) as exc:
            raise ValueError(
                "Unable to decrypt a Google Calendar token; verify "
                "GOOGLE_TOKEN_ENCRYPTION_KEY and database contents"
            ) from exc
