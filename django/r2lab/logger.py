import logging
import logging.config

def init_logger():

    logging_config = {
        'version' : 1,
        'disable_existing_loggers' : True,
        'formatters': {
            'standard': {
                'format': '%(asctime)s %(levelname)s %(filename)s:%(lineno)d %(message)s',
                'datefmt': '%m-%d %H:%M:%S'
            },
            'shorter': {
                'format': '%(asctime)s %(levelname)s %(message)s',
                'datefmt': '%d %H:%M:%S'
            },
        },
        'handlers': {
            'stdout': {
                'level': 'INFO',
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "standard",
            }
        },
        'loggers': {
            'r2lab': {
                'handlers': ['stdout'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }

    logging.config.dictConfig(logging_config)

    return logging.getLogger('r2lab')
