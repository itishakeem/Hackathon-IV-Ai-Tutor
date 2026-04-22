"""Unit tests for prompt building logic.

These tests verify that prompt files exist and contain required elements.
They FAIL until the prompt .md files and build_*_prompt() functions are implemented.
NO database, NO Anthropic SDK required.
"""
import pytest


class TestAssessmentPrompt:
    """T014: Assessment prompt file validation."""

    def test_assessment_prompt_contains_chapter_content_placeholder(self):
        """The assessment prompt must include a {chapter_content} placeholder."""
        from app.premium.services.assessment_service import build_assessment_prompt

        prompt = build_assessment_prompt(
            chapter_id="chapter-01",
            chapter_content="Some chapter text about AI agents.",
            question="What is an agent?",
        )
        assert "Some chapter text about AI agents." in prompt

    def test_assessment_prompt_contains_chapter_id(self):
        """The built system prompt must embed the chapter_id for grounding context."""
        from app.premium.services.assessment_service import build_assessment_prompt

        prompt = build_assessment_prompt(
            chapter_id="chapter-01",
            chapter_content="Chapter content here.",
            question="Explain the difference between an AI Agent and a Chatbot",
        )
        assert "chapter-01" in prompt

    def test_assessment_prompt_uses_chapter_content_xml_wrapper(self):
        """Chapter content must be wrapped in <chapter_content> XML tags."""
        from app.premium.services.assessment_service import build_assessment_prompt

        prompt = build_assessment_prompt(
            chapter_id="chapter-01",
            chapter_content="The content inside.",
            question="Any question?",
        )
        assert "<chapter_content>" in prompt
        assert "</chapter_content>" in prompt
        # Content must sit between the tags
        start = prompt.index("<chapter_content>") + len("<chapter_content>")
        end = prompt.index("</chapter_content>")
        assert "The content inside." in prompt[start:end]


class TestSynthesisPrompt:
    """T022: Synthesis prompt file validation."""

    def test_synthesis_prompt_contains_all_chapter_contents(self):
        """The built synthesis prompt must include every chapter's content."""
        from app.premium.services.synthesis_service import build_synthesis_prompt

        chapters = {
            "chapter-01": "Content about AI Agents.",
            "chapter-02": "Content about Claude SDK.",
            "chapter-03": "Content about MCP.",
        }
        prompt = build_synthesis_prompt(
            chapter_contents=chapters,
            focus_topic="How MCP connects agents to the real world",
        )
        assert "Content about AI Agents." in prompt
        assert "Content about Claude SDK." in prompt
        assert "Content about MCP." in prompt

    def test_synthesis_prompt_contains_focus_topic(self):
        """The built prompt must embed the focus_topic text."""
        from app.premium.services.synthesis_service import build_synthesis_prompt

        prompt = build_synthesis_prompt(
            chapter_contents={"chapter-01": "Some content."},
            focus_topic="How MCP connects agents to the real world",
        )
        assert "How MCP connects agents to the real world" in prompt

    def test_synthesis_prompt_uses_default_focus_topic_when_omitted(self):
        """When focus_topic is the default, the prompt still includes it."""
        from app.premium.services.synthesis_service import build_synthesis_prompt

        default_topic = "General synthesis across selected chapters"
        prompt = build_synthesis_prompt(
            chapter_contents={"chapter-01": "Some content."},
            focus_topic=default_topic,
        )
        assert default_topic in prompt
