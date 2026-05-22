import { Brush, Languages } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { CharacterMetadata } from "../types";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [traditional, setTraditional] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.characters()
      .then((items) => {
        setCharacters(items);
        setSelectedId(items[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const selected = useMemo(
    () => characters.find((character) => character.id === selectedId) ?? characters[0],
    [characters, selectedId]
  );

  if (error) return <EmptyState message={`Character practice unavailable: ${error}`} />;
  if (!selected) return <EmptyState message="Loading character practice..." />;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Character and radical practice</p>
          <h1>Visual building blocks for Chinese characters</h1>
          <p className="lead">Practice simplified/traditional forms with radicals, stroke counts, mnemonics, and cultural notes.</p>
        </div>
        <button className="icon-button" onClick={() => setTraditional((value) => !value)} title="Toggle simplified/traditional">
          <Languages aria-hidden="true" />
          <span>{traditional ? "Traditional" : "Simplified"}</span>
        </button>
      </header>

      <div className="character-layout">
        <div className="character-picker" aria-label="Character picker">
          {characters.map((character) => (
            <button
              className={character.id === selected.id ? "selected" : ""}
              key={character.id}
              onClick={() => setSelectedId(character.id)}
            >
              {traditional ? character.traditional : character.simplified}
            </button>
          ))}
        </div>

        <article className="character-practice">
          <div className="character-glyph">{traditional ? selected.traditional : selected.simplified}</div>
          <div className="character-details">
            <p className="eyebrow">{selected.pinyin} / {selected.meaning}</p>
            <h2>Radical {selected.radical} / {selected.strokes} strokes</h2>
            <p>{selected.mnemonic}</p>
            <div className="note-row">
              <Brush aria-hidden="true" />
              <span>{selected.cultural_note}</span>
            </div>
            <div className="word-list">
              {selected.example_words.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
