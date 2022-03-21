#
# Copyright The NOMAD Authors.
#
# This file is part of NOMAD. See https://nomad-lab.eu for further info.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import json
import os

from nomad import config
from nomad.parsing.parser import ArchiveParser
from nomad.datamodel import EntryArchive, Context


def test_archive_parser(raw_files):
    archive_data = {
        "definitions": {
            "section_definitions": [
                {
                    "name": "TestSection",
                    "base_sections": [
                        "nomad.datamodel.data.EntryData"
                    ],
                    "quantities": [
                        {
                            "name": "test_quantity",
                            "type": "str"
                        }
                    ]
                }
            ]
        },
        "data": {
            "m_def": "#/definitions/section_definitions/0",
            "test_quantity": "test_value"
        }
    }

    mainfile = os.path.join(config.fs.tmp, 'test_mainfile.archive.json')
    with open(mainfile, 'wt') as f:
        json.dump(archive_data, f)

    archive = EntryArchive()
    archive.m_context = Context()
    ArchiveParser().parse(mainfile, archive)

    assert archive.data.m_to_dict() == archive_data['data']
