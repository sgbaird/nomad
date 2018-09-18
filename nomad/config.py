# Copyright 2018 Markus Scheidgen
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an"AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
This module is used to store all configuration values. It makes use of
*namedtuples* to create key sensitive configuration objects.
"""

import os
import logging
from collections import namedtuple

FilesConfig = namedtuple(
    'FilesConfig', ['uploads_bucket', 'repository_bucket', 'archive_bucket', 'compress_archive'])
""" API independent configuration for the object storage. """

CeleryConfig = namedtuple('Celery', ['broker_url'])
""" Used to configure the RabbitMQ and Redis backends for celery. """

MinioConfig = namedtuple('Minio', ['host', 'port', 'accesskey', 'secret'])
""" Used to configure the minio object storage API. """

FSConfig = namedtuple('FSConfig', ['tmp'])
""" Used to configure file stystem access. """

ElasticConfig = namedtuple('ElasticConfig', ['host', 'calc_index'])
""" Used to configure elastic search. """

MongoConfig = namedtuple('MongoConfig', ['host', 'port', 'users_db'])
""" Used to configure mongo db. """

LogstashConfig = namedtuple('LogstashConfig', ['enabled', 'host', 'tcp_port', 'level'])
""" Used to configure and enable/disable the ELK based centralized logging. """

NomadServicesConfig = namedtuple('NomadServicesConfig', ['api_base_path', 'objects_host', 'objects_port', 'objects_base_path', 'api_secret'])
""" Used to configure nomad services: worker, handler, api """

files = FilesConfig(
    uploads_bucket='uploads',
    repository_bucket='repository',
    archive_bucket='archive',
    compress_archive=False
)

rabbit_host = os.environ.get('NOMAD_RABBITMQ_HOST', 'localhost')
rabbit_port = os.environ.get('NOMAD_RABBITMQ_PORT', None)
rabbit_user = 'rabbitmq'
rabbit_password = 'rabbitmq'
redis_host = os.environ.get('NOMAD_REDIS_HOST', 'localhost')

rabbit_url = 'pyamqp://%s:%s@%s//' % (rabbit_user, rabbit_password, rabbit_host)
redis_url = 'redis://%s/0' % redis_host

celery = CeleryConfig(
    broker_url=rabbit_url
)

minio = MinioConfig(
    host=os.environ.get('NOMAD_MINIO_HOST', 'localhost'),
    port=int(os.environ.get('NOMAD_MINIO_PORT', '9007')),
    accesskey='AKIAIOSFODNN7EXAMPLE',
    secret='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
)
fs = FSConfig(
    tmp='.volumes/fs'
)
elastic = ElasticConfig(
    host=os.environ.get('NOMAD_ELASTIC_HOST', 'localhost'),
    calc_index='calcs'
)
mongo = MongoConfig(
    host=os.environ.get('NOMAD_MONGO_HOST', 'localhost'),
    port=int(os.environ.get('NOMAD_MONGO_PORT', 27017)),
    users_db='users'
)
logstash = LogstashConfig(
    enabled=True,
    host=os.environ.get('NOMAD_LOGSTASH_HOST', 'localhost'),
    tcp_port=int(os.environ.get('NOMAD_LOGSTASH_TCPPORT', '5000')),
    level=int(os.environ.get('NOMAD_LOGSTASH_LEVEL', logging.DEBUG))
)
services = NomadServicesConfig(
    api_base_path=os.environ.get('NOMAD_API_BASE_PATH', '/nomad/api'),
    objects_host=os.environ.get('NOMAD_OBJECTS_HOST', 'localhost'),
    objects_port=int(os.environ.get('NOMAD_OBJECTS_PORT', minio.port)),
    objects_base_path=os.environ.get('NOMAD_OBJECTS_BASE_PATH', ''),
    api_secret='the quick fox jumps over something'
)
