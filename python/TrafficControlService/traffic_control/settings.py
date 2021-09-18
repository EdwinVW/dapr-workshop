from pydantic import BaseSettings


class ApplicationSettings(BaseSettings):
    fine_collection_address: str

    class Config:
        env_file = ".env"
