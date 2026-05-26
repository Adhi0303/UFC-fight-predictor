import logging
import logging.config
import yaml
import os

def setup_logger():
    # Resolve the absolute path to the project root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    config_path = os.path.join(project_root, "configs", "logging.yaml")

    with open(config_path, "r") as file:
        config = yaml.safe_load(file)

    logging.config.dictConfig(config)

    logger = logging.getLogger()

    return logger