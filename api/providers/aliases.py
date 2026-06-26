"""
Team name alias resolution for historical World Cup data.

OpenFootball uses varying naming conventions across different tournament
editions. For example, "West Germany" in pre-1990 data vs "Germany" in
post-1990 data. This module maps historical/variant names to their
canonical form so queries like head-to-head or team matches return
results across all name variants.

Usage:
    from providers.aliases import resolve_team_name

    canonical = resolve_team_name("West Germany")  # "Germany"
    canonical = resolve_team_name("Germany")         # "Germany" (pass-through)
    canonical = resolve_team_name("USA")             # "United States" (alias)
"""

# Maps historical/variant team names (lowercased) to their canonical
# display name as used by the OpenFootball dataset.
#
# Only non-canonical variants go here. Canonical names are NOT entries
# (they pass through resolve_team_name unchanged).
TEAM_ALIASES: dict[str, str] = {
    # Germany — "West Germany" used in 1954–1990 tournaments
    "west germany": "Germany",
    "w. germany": "Germany",
    # Russia — "Soviet Union" / "USSR" used in 1958–1990 tournaments
    "ussr": "Russia",
    "soviet union": "Russia",
    "russian federation": "Russia",
    # Czech Republic — "Czechoslovakia" used in 1934–1990 tournaments
    "czechoslovakia": "Czech Republic",
    "czechia": "Czech Republic",
    # Serbia — "Yugoslavia" used in 1930–1998, "Serbia and Montenegro" in 2006
    "yugoslavia": "Serbia",
    "serbia and montenegro": "Serbia",
    "serbia & montenegro": "Serbia",
    # United States — "USA" used in most modern tournaments (1994+),
    # "United States" used in 1934, 1950, 1990
    "usa": "United States",
    "u.s.a.": "United States",
    "united states of america": "United States",
    # South Korea — "Korea Republic" is the FIFA designation
    "korea republic": "South Korea",
    "republic of korea": "South Korea",
    # Côte d'Ivoire — English variant
    "ivory coast": "Côte d'Ivoire",
    # Iran — FIFA designation "IR Iran"
    "ir iran": "Iran",
    # Netherlands — informal variant
    "holland": "Netherlands",
    # Cape Verde — "Cape Verde Islands" is the official name; "Cape Verde" used in openfootball
    "cape verde islands": "Cape Verde",
    # Curaçao — "Curaçao" used in openfootball; "Curacao" (without diacritic) is a common variant
    "curacao": "Curaçao",
}


def resolve_team_name(name: str) -> str:
    """Resolve a team name to its canonical form.

    Case-insensitive. Strips surrounding whitespace.
    If the name has no alias mapping, it is returned unchanged
    (safe pass-through for canonical names).

    Args:
        name: Team name to resolve — either user input or a team name
              from stored match data.

    Returns:
        Canonical team name if an alias is found, otherwise the input
        name with its original casing preserved.
    """
    stripped = name.strip()
    normalized = stripped.lower()
    return TEAM_ALIASES.get(normalized, stripped)


# Maps (lowercase_player_name, lowercase_canonical_team) → canonical player name.
# Only non-canonical variants go here (variants openfootball uses across editions).
PLAYER_ALIASES: dict[tuple[str, str], str] = {
    # Messi: "Messi" (2018) vs "Lionel Messi" (2014, 2022)
    ("messi", "argentina"): "Lionel Messi",
    ("lionel messi", "argentina"): "Lionel Messi",
    # Cristiano Ronaldo: "Ronaldo" / "C. Ronaldo" in older editions
    ("c. ronaldo", "portugal"): "Cristiano Ronaldo",
    ("ronaldo", "portugal"): "Cristiano Ronaldo",
    ("cristiano ronaldo", "portugal"): "Cristiano Ronaldo",
    # Mbappé: "Mbappé" (2018 groups, 2022 R16) vs "Kylian Mbappé" (2018 R16, 2022 groups/final, 2026)
    ("mbappé", "france"): "Kylian Mbappé",
    ("kylian mbappé", "france"): "Kylian Mbappé",
}


def resolve_player_name(player: str, team: str) -> str:
    """Resolve a player name to its canonical form.

    Case-insensitive on both player and team. Safe pass-through when no alias found.
    Pass team already resolved via resolve_team_name.
    """
    key = (player.strip().lower(), team.strip().lower())
    return PLAYER_ALIASES.get(key, player.strip())
