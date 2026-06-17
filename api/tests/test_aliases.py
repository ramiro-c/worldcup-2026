"""Tests for team name alias resolution."""

from providers.aliases import TEAM_ALIASES, resolve_team_name


class TestKnownAliases:
    """Known historical/variant names resolve to their canonical form."""

    def test_west_germany_to_germany(self):
        assert resolve_team_name("West Germany") == "Germany"

    def test_w_germany_to_germany(self):
        assert resolve_team_name("W. Germany") == "Germany"

    def test_ussr_to_russia(self):
        assert resolve_team_name("USSR") == "Russia"

    def test_soviet_union_to_russia(self):
        assert resolve_team_name("Soviet Union") == "Russia"

    def test_russian_federation_to_russia(self):
        assert resolve_team_name("Russian Federation") == "Russia"

    def test_czechoslovakia_to_czech_republic(self):
        assert resolve_team_name("Czechoslovakia") == "Czech Republic"

    def test_czechia_to_czech_republic(self):
        assert resolve_team_name("Czechia") == "Czech Republic"

    def test_yugoslavia_to_serbia(self):
        assert resolve_team_name("Yugoslavia") == "Serbia"

    def test_serbia_and_montenegro_to_serbia(self):
        assert resolve_team_name("Serbia and Montenegro") == "Serbia"

    def test_serbia_and_montenegro_ampersand_to_serbia(self):
        assert resolve_team_name("Serbia & Montenegro") == "Serbia"

    def test_usa_to_united_states(self):
        assert resolve_team_name("USA") == "United States"

    def test_usa_periods_to_united_states(self):
        assert resolve_team_name("U.S.A.") == "United States"

    def test_united_states_of_america_to_united_states(self):
        assert resolve_team_name("United States of America") == "United States"

    def test_korea_republic_to_south_korea(self):
        assert resolve_team_name("Korea Republic") == "South Korea"

    def test_republic_of_korea_to_south_korea(self):
        assert resolve_team_name("Republic of Korea") == "South Korea"

    def test_ivory_coast_to_cote_divoire(self):
        assert resolve_team_name("Ivory Coast") == "Côte d'Ivoire"

    def test_ir_iran_to_iran(self):
        assert resolve_team_name("IR Iran") == "Iran"

    def test_holland_to_netherlands(self):
        assert resolve_team_name("Holland") == "Netherlands"


class TestCanonicalNamesPassThrough:
    """Canonical names return unchanged."""

    def test_germany_stays_germany(self):
        assert resolve_team_name("Germany") == "Germany"

    def test_russia_stays_russia(self):
        assert resolve_team_name("Russia") == "Russia"

    def test_czech_republic_stays_czech_republic(self):
        assert resolve_team_name("Czech Republic") == "Czech Republic"

    def test_serbia_stays_serbia(self):
        assert resolve_team_name("Serbia") == "Serbia"

    def test_united_states_stays_united_states(self):
        assert resolve_team_name("United States") == "United States"

    def test_south_korea_stays_south_korea(self):
        assert resolve_team_name("South Korea") == "South Korea"

    def test_iran_stays_iran(self):
        assert resolve_team_name("Iran") == "Iran"

    def test_netherlands_stays_netherlands(self):
        assert resolve_team_name("Netherlands") == "Netherlands"

    def test_cote_divoire_stays_cote_divoire(self):
        assert resolve_team_name("Côte d'Ivoire") == "Côte d'Ivoire"


class TestCaseInsensitive:
    """Matching is case-insensitive."""

    def test_west_germany_uppercase(self):
        assert resolve_team_name("WEST GERMANY") == "Germany"

    def test_west_germany_mixed_case(self):
        assert resolve_team_name("WeSt GeRmAnY") == "Germany"

    def test_ussr_lowercase(self):
        assert resolve_team_name("ussr") == "Russia"

    def test_camel_case_alias(self):
        assert resolve_team_name("Ivory Coast".upper()) == "Côte d'Ivoire"


class TestWhitespaceStripping:
    """Leading/trailing whitespace is stripped before matching."""

    def test_leading_space(self):
        assert resolve_team_name("  West Germany") == "Germany"

    def test_trailing_space(self):
        assert resolve_team_name("West Germany  ") == "Germany"

    def test_surrounding_spaces(self):
        assert resolve_team_name("  West Germany  ") == "Germany"

    def test_tabs_and_newlines(self):
        assert resolve_team_name("\tWest Germany\n") == "Germany"


class TestUnknownNames:
    """Unknown names pass through unchanged with original casing."""

    def test_unknown_single_word(self):
        assert resolve_team_name("Atlantis") == "Atlantis"

    def test_unknown_multi_word(self):
        assert resolve_team_name("Narnia FC") == "Narnia FC"

    def test_preserves_original_casing(self):
        assert resolve_team_name("ATLANTIS") == "ATLANTIS"

    def test_known_alias_but_case_preserved_for_unknown(self):
        """Names that are not in TEAM_ALIASES keep their original casing."""
        assert resolve_team_name("W Germany") == "W Germany"


class TestEmptyAndEdgeCases:
    """Edge cases around empty/falsy input."""

    def test_empty_string_returns_empty(self):
        assert resolve_team_name("") == ""

    def test_whitespace_only_returns_empty(self):
        assert resolve_team_name("   ") == ""

    def test_aliases_are_all_lowercase(self):
        """Sanity: every key in TEAM_ALIASES is already lowercase."""
        for key in TEAM_ALIASES:
            assert key == key.lower(), f"Alias key {key!r} is not lowercase"

    def test_aliases_are_stripped(self):
        """Sanity: no alias key has leading/trailing whitespace."""
        for key in TEAM_ALIASES:
            assert key == key.strip(), f"Alias key {key!r} has whitespace"
