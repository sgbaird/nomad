import unittest
import time
from minio import ResponseError
import logging
from unittest import TestCase
from threading import Thread
import subprocess
import shlex
import logging

import nomad.files as files
import nomad.config as config

LOGGER = logging.getLogger(__name__)

test_upload_id = '__test_upload_id'


def upload_test_file():
    example_file = './data/examples_vasp.zip'
    upload_url = files.get_presigned_upload_url(test_upload_id)
    cmd = files.create_curl_upload_cmd(upload_url).replace('<ZIPFILE>', example_file)
    LOGGER.debug('Initiate upload of example file %s with command %s' % (example_file, cmd))
    subprocess.call(shlex.split(cmd))


class FilesTests(TestCase):

    def tearDown(self):
        try:
            files._client.remove_object(config.s3.uploads_bucket, test_upload_id)
        except ResponseError:
            pass

    def test_presigned_url(self):
        url = files.get_presigned_upload_url(test_upload_id)

        self.assertIsNotNone(url)
        self.assertIsInstance(url, str)

    def test_upload(self):
        upload_test_file()

        with files.upload(test_upload_id) as upload:
            self.assertEqual(106, len(upload.filelist))
            # now just try to open the first file (not directory), without error
            for filename in upload.filelist:
                if filename.endswith('.xml'):
                    upload.open_file(filename).close()
                    break

    def test_upload_notification(self):
        @files.upload_put_handler
        def handle_upload_put(upload_id):
            self.assertEqual(test_upload_id, upload_id)
            raise StopIteration

        def handle_uploads():
            handle_upload_put(upload_id='provided by decorator')

        handle_uploads_thread = Thread(target=handle_uploads)
        handle_uploads_thread.start()

        time.sleep(1)
        upload_test_file()

        handle_uploads_thread.join()


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    unittest.main()
