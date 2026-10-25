import os
import sys
import time

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))
import main

def test_is_retryable_error():
    print("Testing is_retryable_error classification...")
    # Simulated errors
    err_503 = Exception("503 UNAVAILABLE. {'error': {'message': 'This model is currently experiencing high demand.'}}")
    err_429 = Exception("429 RESOURCE_EXHAUSTED. {'error': {'message': 'Quota exceeded'}}")
    err_500 = Exception("500 Internal Server Error")
    err_400 = Exception("400 Bad Request: Invalid argument")
    err_401 = Exception("401 Unauthorized: Invalid API key")

    assert main.is_retryable_error(err_503) is True, "503 must be retryable"
    assert main.is_retryable_error(err_429) is True, "429 must be retryable"
    assert main.is_retryable_error(err_500) is True, "500 must be retryable"
    assert main.is_retryable_error(err_400) is False, "400 must NOT be retryable"
    assert main.is_retryable_error(err_401) is False, "401 must NOT be retryable"
    print("[PASS] Error classification correctly identifies 503/429/500 as retryable and 400/401 as non-retryable.")

def test_simulated_retry_backoff():
    print("Testing exponential backoff execution...")
    call_counts = {"count": 0}

    class MockClient:
        class models:
            @staticmethod
            def generate_content(*args, **kwargs):
                call_counts["count"] += 1
                if call_counts["count"] < 3:
                    # Fail first 2 attempts with 503 high demand
                    raise Exception("503 UNAVAILABLE. Spikes in demand are usually temporary.")
                # Succeed on 3rd attempt
                class MockResponse:
                    text = '{"match_score": 80, "summary": "Success after backoff"}'
                return MockResponse()

    start_time = time.time()
    resp, model = main.execute_ai_with_backoff(
        client=MockClient(),
        candidate_models=["mock-model"],
        user_prompt="test",
        system_instruction="test",
        max_retries_per_model=3,
        initial_delay=0.2,
        backoff_multiplier=2.0
    )
    elapsed = time.time() - start_time

    assert call_counts["count"] == 3, f"Expected 3 calls, got {call_counts['count']}"
    assert "80" in resp.text
    # Expected delay: ~0.2s + ~0.4s + jitter ~= 0.6s - 1.2s
    assert elapsed >= 0.5, f"Backoff delay too short: {elapsed}s"
    print(f"[PASS] Simulated 503 retried 2 times with backoff ({elapsed:.2f}s total) and succeeded on attempt 3.")

def test_live_ai_request():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key in ["your_actual_api_key", "your_gemini_api_key_here"]:
        print("[SKIP] GEMINI_API_KEY not set. Skipping live test.")
        return

    print("Executing real live AI analysis with backoff resilience...")
    import io
    from fastapi import UploadFile

    with open(os.path.join(os.path.dirname(__file__), "sample_resume.pdf"), "rb") as f:
        pdf_bytes = f.read()

    mock_upload = UploadFile(filename="sample_resume.pdf", file=io.BytesIO(pdf_bytes))

    job_desc = """
    Job Title: Junior Data Scientist
    Requirements:
    - Strong proficiency in Python and SQL for data analysis.
    - Experience with NumPy, Pandas, and data visualization (Matplotlib/Seaborn).
    - Foundational understanding of Machine Learning algorithms (regression, classification).
    - Solid grasp of statistics and probability.
    - Familiarity with A/B testing and Docker is a plus.
    """

    res = main.analyze_match(resume=mock_upload, job_description=job_desc)
    assert res.match_score > 0, "Match score must be positive"
    assert len(res.matching_skills) > 0, "Matching skills must not be empty"
    assert res.is_demo is False, "Live request must have is_demo=False"
    print(f"[PASS] Real live AI request succeeded! Score: {res.match_score}/100, is_demo: {res.is_demo}")

if __name__ == "__main__":
    test_is_retryable_error()
    test_simulated_retry_backoff()
    test_live_ai_request()
    print("\n>>> ALL RETRY AND BACKOFF VALIDATION TESTS PASSED! <<<")
