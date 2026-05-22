from sqlalchemy.orm import Session

from app.models import Course, Flashcard, Lesson, User, VocabularyTerm

SEED_COURSES = [
    {
        "slug": "mandarin-foundations",
        "title": "Mandarin Foundations: Tone, Greeting, Memory",
        "era": "Modern",
        "level": "Beginner",
        "category": "Mandarin",
        "description": "Build a practical base in tones, pinyin, greetings, and high-frequency classroom language.",
        "subscription_tier": "free",
        "lessons": [
            {
                "title": "Tones as Meaning",
                "summary": "A first lesson on why tones are part of the word, not decoration.",
                "body_simplified": "你好。中文的声调会改变意思。妈、麻、马、骂都是不同的词。",
                "body_traditional": "你好。中文的聲調會改變意思。媽、麻、馬、罵都是不同的詞。",
                "pinyin": "Nǐ hǎo. Zhōngwén de shēngdiào huì gǎibiàn yìsi.",
                "audio_url": "https://example.com/media/tones.mp3",
                "video_url": "https://example.com/media/tones.mp4",
                "vocabulary": [
                    ("你好", "你好", "nǐ hǎo", "hello"),
                    ("声调", "聲調", "shēngdiào", "tone"),
                    ("意思", "意思", "yìsi", "meaning"),
                ],
                "flashcards": [
                    ("What does 你好 mean?", "hello", "nǐ hǎo"),
                    ("Which word means tone?", "声调 / 聲調", "shēngdiào"),
                ],
            }
        ],
    },
    {
        "slug": "tang-poetry-moonlight",
        "title": "Tang Poetry: Moonlight, Distance, Home",
        "era": "Tang",
        "level": "Intermediate",
        "category": "Literature",
        "description": "Read compact Tang poems through imagery, parallelism, and historical feeling.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Li Bai and Quiet Night Thought",
                "summary": "Explore 静夜思 as a miniature of memory, travel, and home.",
                "body_simplified": "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
                "body_traditional": "床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。",
                "pinyin": "Chuáng qián míng yuè guāng, yí shì dì shàng shuāng.",
                "audio_url": "https://example.com/media/jingyesi.mp3",
                "video_url": None,
                "vocabulary": [
                    ("明月", "明月", "míngyuè", "bright moon"),
                    ("故乡", "故鄉", "gùxiāng", "hometown"),
                    ("霜", "霜", "shuāng", "frost"),
                ],
                "flashcards": [
                    ("Who wrote 静夜思?", "Li Bai / 李白", "Lǐ Bái"),
                    ("What does 故乡 mean?", "hometown", "gùxiāng"),
                ],
            }
        ],
    },
    {
        "slug": "song-painting-looking",
        "title": "Song Painting: Looking Slowly",
        "era": "Song",
        "level": "Intermediate",
        "category": "Art",
        "description": "Learn how Song landscapes use scale, emptiness, brushwork, and attention.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Mountain, Water, and Human Scale",
                "summary": "A vocabulary-rich introduction to 山水 painting and composition.",
                "body_simplified": "宋代山水画常用高远、深远、平远来安排观看的路径。",
                "body_traditional": "宋代山水畫常用高遠、深遠、平遠來安排觀看的路徑。",
                "pinyin": "Sòngdài shānshuǐhuà cháng yòng gāoyuǎn, shēnyuǎn, píngyuǎn.",
                "audio_url": None,
                "video_url": "https://example.com/media/song-landscape.mp4",
                "vocabulary": [
                    ("山水画", "山水畫", "shānshuǐhuà", "landscape painting"),
                    ("观看", "觀看", "guānkàn", "to observe"),
                    ("路径", "路徑", "lùjìng", "path"),
                ],
                "flashcards": [
                    ("What does 山水画 mean?", "landscape painting", "shānshuǐhuà"),
                    ("Name one Song landscape distance mode.", "高远 / 深远 / 平远", "gāoyuǎn / shēnyuǎn / píngyuǎn"),
                ],
            }
        ],
    },
    {
        "slug": "dream-red-chamber",
        "title": "Classical Fiction: Dream of the Red Chamber",
        "era": "Qing",
        "level": "Advanced",
        "category": "Literature",
        "description": "A guided entry into family, memory, poetry, and social observation in 红楼梦.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Reading Character Through Objects",
                "summary": "How names, rooms, stones, and poems carry meaning in the novel.",
                "body_simplified": "《红楼梦》通过人物、器物、诗词和空间描写一个家族的兴衰。",
                "body_traditional": "《紅樓夢》通過人物、器物、詩詞和空間描寫一個家族的興衰。",
                "pinyin": "Hónglóumèng tōngguò rénwù, qìwù, shīcí hé kōngjiān miáoxiě.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("人物", "人物", "rénwù", "character"),
                    ("诗词", "詩詞", "shīcí", "poetry"),
                    ("兴衰", "興衰", "xīngshuāi", "rise and decline"),
                ],
                "flashcards": [
                    ("What is 红楼梦 often translated as?", "Dream of the Red Chamber", "Hónglóumèng"),
                    ("What does 兴衰 mean?", "rise and decline", "xīngshuāi"),
                ],
            }
        ],
    },
    {
        "slug": "modern-culture-city",
        "title": "Modern Chinese Culture: Cities, Screens, Everyday Life",
        "era": "Modern",
        "level": "Beginner",
        "category": "Culture",
        "description": "Practice modern Mandarin through metro signs, food delivery, short video, and urban routines.",
        "subscription_tier": "free",
        "lessons": [
            {
                "title": "Ordering Coffee in Shanghai",
                "summary": "Useful phrases for ordering, paying, and asking for less sugar.",
                "body_simplified": "我想要一杯拿铁，少糖，冰的。可以用手机支付吗？",
                "body_traditional": "我想要一杯拿鐵，少糖，冰的。可以用手機支付嗎？",
                "pinyin": "Wǒ xiǎng yào yì bēi nátiě, shǎo táng, bīng de.",
                "audio_url": "https://example.com/media/coffee.mp3",
                "video_url": None,
                "vocabulary": [
                    ("少糖", "少糖", "shǎo táng", "less sugar"),
                    ("手机支付", "手機支付", "shǒujī zhīfù", "mobile payment"),
                    ("拿铁", "拿鐵", "nátiě", "latte"),
                ],
                "flashcards": [
                    ("How do you say less sugar?", "少糖", "shǎo táng"),
                    ("What does 手机支付 mean?", "mobile payment", "shǒujī zhīfù"),
                ],
            }
        ],
    },
]


def seed_database(db: Session) -> None:
    if db.query(Course).first():
        return

    db.add(User(id="demo-user", display_name="Demo Learner", subscription_status="mock_active"))
    for course_data in SEED_COURSES:
        lessons = course_data.pop("lessons")
        course = Course(**course_data)
        db.add(course)
        db.flush()
        for index, lesson_data in enumerate(lessons, start=1):
            vocab = lesson_data.pop("vocabulary")
            cards = lesson_data.pop("flashcards")
            lesson = Lesson(course_id=course.id, sequence=index, **lesson_data)
            db.add(lesson)
            db.flush()
            for simplified, traditional, pinyin, definition in vocab:
                db.add(
                    VocabularyTerm(
                        lesson_id=lesson.id,
                        simplified=simplified,
                        traditional=traditional,
                        pinyin=pinyin,
                        definition=definition,
                    )
                )
            for prompt, answer, pinyin in cards:
                db.add(Flashcard(lesson_id=lesson.id, prompt=prompt, answer=answer, pinyin=pinyin))
    db.commit()
