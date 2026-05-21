import logging
import logging.config
import yaml


def setup_logger():

    with open("configs/logging.yaml", "r") as file:
        config = yaml.safe_load(file)

    logging.config.dictConfig(config)

    logger = logging.getLogger()

    return logger