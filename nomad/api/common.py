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
Common data, variables, decorators, models used throughout the API.
"""

from flask_restplus import fields

from .app import api


pagination_model = api.model('Pagination', {
    'total': fields.Integer,
    'page': fields.Integer,
    'per_page': fields.Integer,
})
""" Model used in responsed with pagination. """


pagination_request_parser = api.parser()
""" Parser used for requests with pagination. """

pagination_request_parser.add_argument(
    'page', type=int, help='The page, starting with 1.', location='args')
pagination_request_parser.add_argument(
    'per_page', type=int, help='Desired calcs per page.', location='args')
pagination_request_parser.add_argument(
    'order_by', type=str, help='The field to sort by.', location='args')


def calc_route(ns, prefix: str = ''):
    """ A resource decorator for /<upload>/<calc> based routes. """
    def decorator(func):
        ns.route('%s/<string:upload_hash>/<string:calc_hash>' % prefix)(
            api.doc(params={
                'upload_hash': 'The unique hash for the requested upload.',
                'path': 'The path to a file or directory.'
            })(func)
        )
    return decorator