"""Unit tests for cost calculation logic in cost_tracker.py.

These tests require NO database and NO Anthropic SDK.
They verify the pure math of the cost formula.
"""
import pytest

from app.premium.services.cost_tracker import (
    SONNET_INPUT_COST,
    SONNET_OUTPUT_COST,
    calculate_cost,
)


class FakeUsage:
    """Minimal stand-in for anthropic.types.Usage."""

    def __init__(self, input_tokens: int, output_tokens: int):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


class TestCalculateCost:
    def test_zero_tokens_returns_zero(self):
        usage = FakeUsage(input_tokens=0, output_tokens=0)
        assert calculate_cost(usage) == 0.0

    def test_typical_assessment_cost(self):
        # 500 input + 300 output — representative assessment call
        usage = FakeUsage(input_tokens=500, output_tokens=300)
        expected = round(500 * SONNET_INPUT_COST + 300 * SONNET_OUTPUT_COST, 6)
        assert calculate_cost(usage) == expected
        # Verify absolute value: $0.0015 + $0.0045 = $0.006
        assert calculate_cost(usage) == pytest.approx(0.006, abs=1e-9)

    def test_typical_synthesis_cost(self):
        # 1000 input + 2000 output — representative synthesis call
        usage = FakeUsage(input_tokens=1000, output_tokens=2000)
        expected = round(1000 * SONNET_INPUT_COST + 2000 * SONNET_OUTPUT_COST, 6)
        assert calculate_cost(usage) == expected
        # Verify absolute value: $0.003 + $0.03 = $0.033
        assert calculate_cost(usage) == pytest.approx(0.033, abs=1e-9)

    def test_cost_rounded_to_6_decimal_places(self):
        # Use token counts that produce a non-terminating decimal
        usage = FakeUsage(input_tokens=1, output_tokens=1)
        cost = calculate_cost(usage)
        # Result must have at most 6 decimal places
        as_str = f"{cost:.10f}".rstrip("0")
        decimal_places = len(as_str.split(".")[1]) if "." in as_str else 0
        assert decimal_places <= 6
        # Verify the actual rounded value
        expected = round(1 * SONNET_INPUT_COST + 1 * SONNET_OUTPUT_COST, 6)
        assert cost == expected
