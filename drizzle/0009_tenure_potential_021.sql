UPDATE assessment_tests
SET version = '2.0.1-pilot',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'test_tenure_potential';
