"""Tests for the Annex C 495-combination R32 resolution table."""

import pytest
from providers.r32_combinations import ANNEX_C, SlotPattern, get_slot_pattern


class TestAnnexC:
    """Validate the Annex C combination table."""

    def test_all_495_keys_present(self):
        """Every valid combination of 8 groups out of 12 has an entry."""
        assert len(ANNEX_C) == 495

        # Every key must be a frozenset of exactly 8 uppercase letters A–L
        valid_letters = set("ABCDEFGHIJKL")
        for key in ANNEX_C:
            assert isinstance(key, frozenset)
            assert len(key) == 8
            assert key.issubset(valid_letters), f"Invalid group letters in {key}"

    def test_every_value_has_16_slots(self):
        """Every combination maps to exactly 16 SlotPattern entries."""
        for key, slots in ANNEX_C.items():
            assert len(slots) == 16, f"Key {key} has {len(slots)} slots, expected 16"
            for slot in slots:
                assert isinstance(slot, tuple)
                assert len(slot) == 2

    def test_no_duplicate_keys(self):
        """No two frozenset keys are identical (impossible by definition, but verify)."""
        assert len(set(ANNEX_C.keys())) == len(ANNEX_C)

    def test_invalid_combination_raises(self):
        """Querying an invalid combination raises KeyError or returns None."""
        invalid = frozenset({"A", "B", "C"})  # Only 3 groups
        with pytest.raises(KeyError):
            ANNEX_C[invalid]

    def test_known_combination_67(self):
        """Combination #67 matches the published Wikipedia example."""
        key = frozenset({"B", "D", "E", "F", "I", "J", "K", "L"})
        slots = ANNEX_C[key]
        assert len(slots) == 16

        # Row 67: 3E 3J 3B 3D 3I 3F 3L 3K
        # Column order: 1A 1B 1D 1E 1G 1I 1K 1L
        # M79 (slot 6): 1A vs 3E
        assert slots[6][1] == ("third", frozenset({"E"}))
        # M85 (slot 12): 1B vs 3J
        assert slots[12][1] == ("third", frozenset({"J"}))
        # M81 (slot 8): 1D vs 3B
        assert slots[8][1] == ("third", frozenset({"B"}))
        # M74 (slot 1): 1E vs 3D
        assert slots[1][1] == ("third", frozenset({"D"}))
        # M82 (slot 9): 1G vs 3I
        assert slots[9][1] == ("third", frozenset({"I"}))
        # M77 (slot 4): 1I vs 3F
        assert slots[4][1] == ("third", frozenset({"F"}))
        # M87 (slot 14): 1K vs 3L
        assert slots[14][1] == ("third", frozenset({"L"}))
        # M80 (slot 7): 1L vs 3K
        assert slots[7][1] == ("third", frozenset({"K"}))

    def test_known_combination_494(self):
        """Combination #494: all from A-I except H, exclude JKL."""
        key = frozenset({"A", "B", "C", "D", "E", "F", "G", "I"})
        slots = ANNEX_C[key]
        # Row 494: 3C 3G 3B 3D 3A 3F 3E 3I
        # 1A→3C, 1B→3G, 1D→3B, 1E→3D, 1G→3A, 1I→3F, 1K→3E, 1L→3I
        assert slots[6][1] == ("third", frozenset({"C"}))  # M79 1A
        assert slots[12][1] == ("third", frozenset({"G"}))  # M85 1B
        assert slots[8][1] == ("third", frozenset({"B"}))  # M81 1D
        assert slots[1][1] == ("third", frozenset({"D"}))  # M74 1E
        assert slots[9][1] == ("third", frozenset({"A"}))  # M82 1G
        assert slots[4][1] == ("third", frozenset({"F"}))  # M77 1I
        assert slots[14][1] == ("third", frozenset({"E"}))  # M87 1K
        assert slots[7][1] == ("third", frozenset({"I"}))  # M80 1L

    def test_all_slots_have_correct_source_types(self):
        """Fixed slots (winner/runner-up) are correct; third slots vary."""
        for key, slots in ANNEX_C.items():
            # M73 (slot 0): 2A vs 2B
            assert slots[0] == (("runner_up", "A"), ("runner_up", "B"))
            # M75 (slot 2): 1F vs 2C
            assert slots[2] == (("winner", "F"), ("runner_up", "C"))
            # M76 (slot 3): 1C vs 2F
            assert slots[3] == (("winner", "C"), ("runner_up", "F"))
            # M78 (slot 5): 2E vs 2I
            assert slots[5] == (("runner_up", "E"), ("runner_up", "I"))
            # M83 (slot 10): 2K vs 2L
            assert slots[10] == (("runner_up", "K"), ("runner_up", "L"))
            # M84 (slot 11): 1H vs 2J
            assert slots[11] == (("winner", "H"), ("runner_up", "J"))
            # M86 (slot 13): 1J vs 2H
            assert slots[13] == (("winner", "J"), ("runner_up", "H"))
            # M88 (slot 15): 2D vs 2G
            assert slots[15] == (("runner_up", "D"), ("runner_up", "G"))


class TestGetSlotPattern:
    """Test the helper that looks up a combination."""

    def test_returns_16_slots_for_valid_key(self):
        key = frozenset({"B", "D", "E", "F", "I", "J", "K", "L"})
        result = get_slot_pattern(key)
        assert result is not None
        assert len(result) == 16

    def test_returns_none_for_invalid_key(self):
        key = frozenset({"A", "B", "C"})
        result = get_slot_pattern(key)
        assert result is None
