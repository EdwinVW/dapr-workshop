from pydantic import BaseSettings


class ApplicationSettings(BaseSettings):
    traffic_control_address: str

    class Config:
        env_file = ".env"
