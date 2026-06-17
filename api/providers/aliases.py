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
