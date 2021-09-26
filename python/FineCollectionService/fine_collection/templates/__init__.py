from typing import Dict
from os import path
from jinja2 import Environment, FileSystemLoader, select_autoescape


def render(name: str, **data) -> str:
    absolute_path = path.abspath(path.dirname(__file__))

    env = Environment(
        loader=FileSystemLoader(absolute_path),
        autoescape=select_autoescape()
    )

    template = env.get_template(name)
    rendered_content = template.render(**data)

    return rendered_content
    