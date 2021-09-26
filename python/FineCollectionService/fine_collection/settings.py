from pydantic import BaseSettings


class ApplicationSettings(BaseSettings):
    vehicle_registration_address: str
    license_key: str
    
    class Config:
        env_file = ".env"