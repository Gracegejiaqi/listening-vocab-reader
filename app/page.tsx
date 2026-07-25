"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import vocabData from "./vocab-data.json";

type WordEntry = {
  id: string;
  word: string;
  translation: string;
  ipa: string;
  cefr: string;
  category: string;
  page: number;
};

const words = vocabData as WordEntry[];
const categories = Array.from(new Set(words.map((item) => item.category)));
const PAGE_SIZE = 36;

function speakWord(word: string, rate: number, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang === "en-GB") ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [rate, setRate] = useState(0.85);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [hideMeaning, setHideMeaning] = useState(false);
  const [focusWord, setFocusWord] = useState<WordEntry | null>(null);
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("listening-vocab-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved) as string[]));
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, showFavorites]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return words.filter((item) => {
      const matchesCategory = category === "全部" || item.category === category;
      const matchesFavorite = !showFavorites || favorites.has(item.id);
      const matchesSearch =
        !normalized ||
        item.word.toLowerCase().includes(normalized) ||
        item.translation.includes(query.trim());
      return matchesCategory && matchesFavorite && matchesSearch;
    });
  }, [query, category, showFavorites, favorites]);

  const visibleWords = filtered.slice(0, visibleCount);

  function play(item: WordEntry) {
    setActiveId(item.id);
    if (activeTimer.current) clearTimeout(activeTimer.current);
    activeTimer.current = setTimeout(() => setActiveId(null), 1300);
    speakWord(item.word, rate, () => setActiveId(null));
  }

  function toggleFavorite(id: string) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    window.localStorage.setItem(
      "listening-vocab-favorites",
      JSON.stringify(Array.from(next)),
    );
  }

  function openRandom() {
    const pool = filtered.length ? filtered : words;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setFocusWord(next);
    play(next);
  }

  function nextFocus() {
    if (!focusWord) return openRandom();
    const pool = filtered.length ? filtered : words;
    const current = pool.findIndex((item) => item.id === focusWord.id);
    const next = pool[(current + 1 + pool.length) % pool.length];
    setFocusWord(next);
    play(next);
  }

  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <a className="brand" href="#top" aria-label="返回顶部">
            <span className="brand-mark">声</span>
            <span>雅思听力场景词汇</span>
          </a>
          <div className="nav-actions">
            <button
              className={`nav-button ${showFavorites ? "selected" : ""}`}
              onClick={() => setShowFavorites((value) => !value)}
            >
              <span aria-hidden="true">♥</span>
              我的收藏
              {favorites.size > 0 && <b>{favorites.size}</b>}
            </button>
            <button className="nav-button primary" onClick={openRandom}>
              <span aria-hidden="true">↝</span>
              随机练习
            </button>
          </div>
        </nav>

        <div className="hero-content" id="top">
          <div className="eyebrow"><span /> 雅思听力高频场景 · 点击即读</div>
          <h1>听见每一个词，<br /><em>记住每一个场景。</em></h1>
          <p>
            点击任意单词即可听标准英语发音。按住宿、旅游、课程、讲座等雅思听力
            高频场景学习，让词汇从纸上走进耳朵里。
          </p>
          <div className="hero-stats">
            <div><strong>{words.length}</strong><span>个场景词汇</span></div>
            <i />
            <div><strong>{categories.length}</strong><span>雅思听力场景</span></div>
            <i />
            <div><strong>42</strong><span>页原始词表</span></div>
          </div>
        </div>
        <div className="sound-orbit" aria-hidden="true">
          <span className="ring ring-one" />
          <span className="ring ring-two" />
          <span className="ring ring-three" />
          <span className="sound-core">▶</span>
          <span className="wave wave-one" />
          <span className="wave wave-two" />
          <span className="wave wave-three" />
        </div>
      </section>

      <section className="workspace" aria-label="词汇学习区">
        <div className="toolbar">
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索英文或中文释义…"
              aria-label="搜索词汇"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="清空搜索">×</button>
            )}
          </label>
          <div className="speed" aria-label="朗读速度">
            <span>语速</span>
            {[0.7, 0.85, 1].map((value, index) => (
              <button
                key={value}
                className={rate === value ? "active" : ""}
                onClick={() => setRate(value)}
              >
                {["慢", "中", "快"][index]}
              </button>
            ))}
          </div>
          <label className="meaning-toggle">
            <input
              type="checkbox"
              checked={hideMeaning}
              onChange={(event) => setHideMeaning(event.target.checked)}
            />
            <span />
            隐藏释义
          </label>
        </div>

        <div className="category-row" aria-label="场景筛选">
          {["全部", ...categories].map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
              <span>
                {item === "全部"
                  ? words.length
                  : words.filter((word) => word.category === item).length}
              </span>
            </button>
          ))}
        </div>

        <div className="section-heading">
          <div>
            <p>{showFavorites ? "YOUR COLLECTION" : "IELTS LISTENING VOCABULARY"}</p>
            <h2>{showFavorites ? "我的收藏" : category === "全部" ? "全部场景词汇" : `${category}场景`}</h2>
          </div>
          <span>找到 {filtered.length} 个词 · 点击卡片播放</span>
        </div>

        {visibleWords.length ? (
          <>
            <div className="word-grid">
              {visibleWords.map((item) => (
                <article
                  key={item.id}
                  className={`word-card ${activeId === item.id ? "playing" : ""}`}
                  onClick={() => play(item)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      play(item);
                    }
                  }}
                  aria-label={`朗读 ${item.word}`}
                >
                  <div className="card-topline">
                    <span>{item.category}</span>
                    <button
                      className={favorites.has(item.id) ? "favorite active" : "favorite"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      aria-label={favorites.has(item.id) ? "取消收藏" : "收藏"}
                    >
                      {favorites.has(item.id) ? "♥" : "♡"}
                    </button>
                  </div>
                  <h3>{item.word}</h3>
                  <div className={`meaning ${hideMeaning ? "hidden" : ""}`}>
                    {hideMeaning ? "点击显示答案" : item.translation}
                  </div>
                  <div className="card-footer">
                    <span className="play-icon" aria-hidden="true">
                      {activeId === item.id ? "▮▮" : "▶"}
                    </span>
                    <span className="ipa">{item.ipa || "点击听发音"}</span>
                    {item.cefr && <b className={`level level-${item.cefr[0].toLowerCase()}`}>{item.cefr}</b>}
                  </div>
                </article>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <button
                className="load-more"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                加载更多词汇
                <span>{visibleCount} / {filtered.length}</span>
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span>⌕</span>
            <h3>还没有找到匹配的词</h3>
            <p>换个关键词或场景试试。</p>
            <button onClick={() => { setQuery(""); setShowFavorites(false); setCategory("全部"); }}>
              查看全部词汇
            </button>
          </div>
        )}
      </section>

      <footer>
        <span className="brand-mark">声</span>
        <p>雅思听力场景词汇 · 由原始词表整理 · 发音由你的浏览器实时生成</p>
        <button onClick={openRandom}>开始随机练习 ↗</button>
      </footer>

      {focusWord && (
        <div className="practice-backdrop" onClick={() => setFocusWord(null)}>
          <section
            className="practice-card"
            role="dialog"
            aria-modal="true"
            aria-label="随机练习"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close" onClick={() => setFocusWord(null)} aria-label="关闭">×</button>
            <p className="practice-label">{focusWord.category} · 第 {focusWord.page} 页</p>
            <button className="practice-sound" onClick={() => play(focusWord)} aria-label="再次朗读">▶</button>
            <h2>{focusWord.word}</h2>
            <p className="practice-ipa">{focusWord.ipa || "点击上方按钮听发音"}</p>
            <div className="practice-meaning">{focusWord.translation}</div>
            <div className="practice-actions">
              <button onClick={() => toggleFavorite(focusWord.id)}>
                {favorites.has(focusWord.id) ? "♥ 已收藏" : "♡ 收藏"}
              </button>
              <button className="next" onClick={nextFocus}>下一个词 →</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
