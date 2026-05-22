import os

os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""

from worker import run_job


def test_run_job_records_success():
    called = {"value": False}

    def work():
        called["value"] = True
        return 1

    run_job("unit_test_job", work)
    assert called["value"] is True
