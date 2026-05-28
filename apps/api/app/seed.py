from copy import deepcopy

from sqlalchemy.orm import Session

from app.models import CharacterMetadata, Course, Flashcard, Lesson, User, VocabularyTerm
from app.platform_content import PLATFORM_COURSES

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
            },
            {
                "title": "Metro Signs and Dates",
                "summary": "Read practical signs for stations, exits, numbers, and dates.",
                "body_simplified": "地铁站有入口、出口、换乘和售票机。今天是五月二十二日。",
                "body_traditional": "地鐵站有入口、出口、換乘和售票機。今天是五月二十二日。",
                "pinyin": "Dìtiě zhàn yǒu rùkǒu, chūkǒu, huànchéng hé shòupiào jī.",
                "audio_url": "https://example.com/media/metro-signs.mp3",
                "video_url": None,
                "vocabulary": [
                    ("地铁站", "地鐵站", "dìtiě zhàn", "metro station"),
                    ("出口", "出口", "chūkǒu", "exit"),
                    ("换乘", "換乘", "huànchéng", "transfer"),
                    ("今天", "今天", "jīntiān", "today"),
                ],
                "flashcards": [
                    ("What does 出口 mean?", "exit", "chūkǒu"),
                    ("How do you say metro station?", "地铁站 / 地鐵站", "dìtiě zhàn"),
                ],
            },
            {
                "title": "Family and Directions",
                "summary": "HSK 1-2 foundations for family members and everyday directions.",
                "body_simplified": "我家有四口人。银行在学校的左边，咖啡店在右边。",
                "body_traditional": "我家有四口人。銀行在學校的左邊，咖啡店在右邊。",
                "pinyin": "Wǒ jiā yǒu sì kǒu rén. Yínháng zài xuéxiào de zuǒbian.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("家", "家", "jiā", "family; home"),
                    ("左边", "左邊", "zuǒbian", "left side"),
                    ("右边", "右邊", "yòubian", "right side"),
                    ("银行", "銀行", "yínháng", "bank"),
                ],
                "flashcards": [
                    ("What does 左边 mean?", "left side", "zuǒbian"),
                    ("How do you say family or home?", "家", "jiā"),
                ],
            }
        ],
    },
    {
        "slug": "character-building-blocks",
        "title": "Character Building Blocks: Radicals and Memory",
        "era": "Classical to Modern",
        "level": "Beginner",
        "category": "Characters",
        "description": "Use radicals, stroke counts, and visual mnemonics to read core characters and compounds.",
        "subscription_tier": "free",
        "lessons": [
            {
                "title": "Person, Tree, Forest",
                "summary": "See how 人, 木, and 林 become building blocks for meaning.",
                "body_simplified": "人表示人。木像一棵树。两个木成为林，表示树林。",
                "body_traditional": "人表示人。木像一棵樹。兩個木成為林，表示樹林。",
                "pinyin": "Rén biǎoshì rén. Mù xiàng yì kē shù. Liǎng ge mù chéngwéi lín.",
                "audio_url": None,
                "video_url": "https://example.com/media/character-building.mp4",
                "vocabulary": [
                    ("人", "人", "rén", "person"),
                    ("木", "木", "mù", "tree; wood"),
                    ("林", "林", "lín", "woods"),
                    ("树林", "樹林", "shùlín", "forest"),
                ],
                "flashcards": [
                    ("Which character means person?", "人", "rén"),
                    ("What do two 木 characters form?", "林", "lín"),
                ],
            },
            {
                "title": "Sun, Moon, Bright",
                "summary": "Combine 日 and 月 to remember 明 as brightness.",
                "body_simplified": "日是太阳，月是月亮。日月在一起成为明，表示明亮。",
                "body_traditional": "日是太陽，月是月亮。日月在一起成為明，表示明亮。",
                "pinyin": "Rì shì tàiyáng, yuè shì yuèliang. Rì yuè zài yìqǐ chéngwéi míng.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("日", "日", "rì", "sun; day"),
                    ("月", "月", "yuè", "moon; month"),
                    ("明", "明", "míng", "bright"),
                    ("明亮", "明亮", "míngliàng", "bright; clear"),
                ],
                "flashcards": [
                    ("What does 明 mean?", "bright", "míng"),
                    ("Which character can mean moon or month?", "月", "yuè"),
                ],
            },
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
            },
            {
                "title": "Wang Wei and Autumn Mountain Dwelling",
                "summary": "Read landscape poetry through emptiness, rain, moonlight, and sound.",
                "body_simplified": "空山新雨后，天气晚来秋。明月松间照，清泉石上流。",
                "body_traditional": "空山新雨後，天氣晚來秋。明月松間照，清泉石上流。",
                "pinyin": "Kōng shān xīn yǔ hòu, tiānqì wǎn lái qiū.",
                "audio_url": "https://example.com/media/wangwei-autumn.mp3",
                "video_url": None,
                "vocabulary": [
                    ("空山", "空山", "kōng shān", "empty mountain"),
                    ("清泉", "清泉", "qīngquán", "clear spring"),
                    ("松间", "松間", "sōng jiān", "among pines"),
                ],
                "flashcards": [
                    ("Who wrote 山居秋暝?", "Wang Wei / 王维", "Wáng Wéi"),
                    ("What does 清泉 mean?", "clear spring", "qīngquán"),
                ],
            },
            {
                "title": "Du Fu and Spring View",
                "summary": "A brief look at public history and private grief in 春望.",
                "body_simplified": "国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。",
                "body_traditional": "國破山河在，城春草木深。感時花濺淚，恨別鳥驚心。",
                "pinyin": "Guó pò shān hé zài, chéng chūn cǎo mù shēn.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("山河", "山河", "shānhé", "mountains and rivers; the land"),
                    ("草木", "草木", "cǎomù", "grass and trees"),
                    ("惊心", "驚心", "jīngxīn", "to startle the heart"),
                ],
                "flashcards": [
                    ("Who wrote 春望?", "Du Fu / 杜甫", "Dù Fǔ"),
                    ("What does 山河 mean?", "mountains and rivers; the land", "shānhé"),
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
            },
            {
                "title": "Fan Kuan, Guo Xi, and Three Distances",
                "summary": "Compare monumental mountains, mist, and moving viewpoints in Northern Song painting.",
                "body_simplified": "范宽强调山的重量。郭熙讨论高远、深远、平远，让观者在画中移动。",
                "body_traditional": "范寬強調山的重量。郭熙討論高遠、深遠、平遠，讓觀者在畫中移動。",
                "pinyin": "Fàn Kuān qiángdiào shān de zhòngliàng. Guō Xī tǎolùn sān yuǎn.",
                "audio_url": None,
                "video_url": "https://example.com/media/three-distances.mp4",
                "vocabulary": [
                    ("范宽", "范寬", "Fàn Kuān", "Fan Kuan"),
                    ("郭熙", "郭熙", "Guō Xī", "Guo Xi"),
                    ("移动", "移動", "yídòng", "to move"),
                ],
                "flashcards": [
                    ("Which painter is associated with monumental mountains?", "Fan Kuan / 范宽", "Fàn Kuān"),
                    ("What are the three distances?", "高远、深远、平远", "gāoyuǎn, shēnyuǎn, píngyuǎn"),
                ],
            }
        ],
    },
    {
        "slug": "calligraphy-orchid-pavilion",
        "title": "Calligraphy: Wang Xizhi and Script Styles",
        "era": "Eastern Jin",
        "level": "Intermediate",
        "category": "Art",
        "description": "Connect regular, running, and cursive scripts with Wang Xizhi and the Orchid Pavilion tradition.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Regular, Running, Cursive",
                "summary": "Identify script styles by rhythm, legibility, and brush continuity.",
                "body_simplified": "楷书端正，行书流动，草书变化最快。王羲之的《兰亭集序》以行书著名。",
                "body_traditional": "楷書端正，行書流動，草書變化最快。王羲之的《蘭亭集序》以行書著名。",
                "pinyin": "Kǎishū duānzhèng, xíngshū liúdòng, cǎoshū biànhuà zuì kuài.",
                "audio_url": None,
                "video_url": "https://example.com/media/script-styles.mp4",
                "vocabulary": [
                    ("楷书", "楷書", "kǎishū", "regular script"),
                    ("行书", "行書", "xíngshū", "running script"),
                    ("草书", "草書", "cǎoshū", "cursive script"),
                    ("王羲之", "王羲之", "Wáng Xīzhī", "Wang Xizhi"),
                ],
                "flashcards": [
                    ("Which script is 行书?", "running script", "xíngshū"),
                    ("Who is linked to 兰亭集序?", "Wang Xizhi / 王羲之", "Wáng Xīzhī"),
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
            },
            {
                "title": "Journey to the West as Learning Journey",
                "summary": "Use 西游记 to discuss travel, discipline, humor, and transformation.",
                "body_simplified": "《西游记》把取经路写成修行、友情和想象力的故事。",
                "body_traditional": "《西遊記》把取經路寫成修行、友情和想像力的故事。",
                "pinyin": "Xīyóujì bǎ qǔjīng lù xiě chéng xiūxíng, yǒuqíng hé xiǎngxiànglì de gùshi.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("西游记", "西遊記", "Xīyóujì", "Journey to the West"),
                    ("修行", "修行", "xiūxíng", "spiritual practice"),
                    ("想象力", "想像力", "xiǎngxiànglì", "imagination"),
                ],
                "flashcards": [
                    ("What is 西游记 translated as?", "Journey to the West", "Xīyóujì"),
                    ("What does 修行 mean?", "spiritual practice", "xiūxíng"),
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
            },
            {
                "title": "Lu Xun, Eileen Chang, and Urban Modernity",
                "summary": "A concise culture card on modern writers and city language.",
                "body_simplified": "鲁迅常写社会观察。张爱玲常写城市、家庭和微妙的人情。",
                "body_traditional": "魯迅常寫社會觀察。張愛玲常寫城市、家庭和微妙的人情。",
                "pinyin": "Lǔ Xùn cháng xiě shèhuì guānchá. Zhāng Àilíng cháng xiě chéngshì.",
                "audio_url": None,
                "video_url": None,
                "vocabulary": [
                    ("鲁迅", "魯迅", "Lǔ Xùn", "Lu Xun"),
                    ("张爱玲", "張愛玲", "Zhāng Àilíng", "Eileen Chang"),
                    ("微妙", "微妙", "wēimiào", "subtle"),
                ],
                "flashcards": [
                    ("Who is 张爱玲?", "Eileen Chang", "Zhāng Àilíng"),
                    ("What does 微妙 mean?", "subtle", "wēimiào"),
                ],
            }
        ],
    },
]

SEED_COURSES.extend(PLATFORM_COURSES)


CHARACTER_METADATA = [
    {
        "simplified": "月",
        "traditional": "月",
        "pinyin": "yuè",
        "meaning": "moon; month",
        "radical": "月",
        "strokes": 4,
        "mnemonic": "A crescent moon with two inner strokes becomes a calendar month.",
        "cultural_note": "Moon imagery anchors Mid-Autumn Festival, homesickness, and Tang poetry.",
        "example_words": ["明月", "月亮", "五月"],
    },
    {
        "simplified": "山",
        "traditional": "山",
        "pinyin": "shān",
        "meaning": "mountain",
        "radical": "山",
        "strokes": 3,
        "mnemonic": "Three peaks rise from the baseline.",
        "cultural_note": "山 pairs with 水 to name landscape painting: 山水.",
        "example_words": ["山水", "高山", "空山"],
    },
    {
        "simplified": "水",
        "traditional": "水",
        "pinyin": "shuǐ",
        "meaning": "water",
        "radical": "水",
        "strokes": 4,
        "mnemonic": "A central stream with splashing drops on both sides.",
        "cultural_note": "Water suggests movement, humility, and the flow of brush ink.",
        "example_words": ["山水", "水墨", "清水"],
    },
    {
        "simplified": "人",
        "traditional": "人",
        "pinyin": "rén",
        "meaning": "person",
        "radical": "人",
        "strokes": 2,
        "mnemonic": "Two legs make a walking person.",
        "cultural_note": "The person radical appears in words about people and actions.",
        "example_words": ["人民", "人物", "家人"],
    },
    {
        "simplified": "木",
        "traditional": "木",
        "pinyin": "mù",
        "meaning": "tree; wood",
        "radical": "木",
        "strokes": 4,
        "mnemonic": "A trunk, branches, and roots form a tree.",
        "cultural_note": "Wood is one of the five phases and a common semantic radical.",
        "example_words": ["木头", "草木", "树木"],
    },
    {
        "simplified": "明",
        "traditional": "明",
        "pinyin": "míng",
        "meaning": "bright",
        "radical": "日",
        "strokes": 8,
        "mnemonic": "Sun plus moon makes brightness.",
        "cultural_note": "明 appears in 明月, a core image in poetry and festival language.",
        "example_words": ["明月", "明亮", "文明"],
    },
    {
        "simplified": "林",
        "traditional": "林",
        "pinyin": "lín",
        "meaning": "woods",
        "radical": "木",
        "strokes": 8,
        "mnemonic": "Two trees together make woods.",
        "cultural_note": "Doubling components is a visual way Chinese characters build meaning.",
        "example_words": ["树林", "竹林", "林间"],
    },
    {
        "simplified": "书",
        "traditional": "書",
        "pinyin": "shū",
        "meaning": "book; writing",
        "radical": "乛",
        "strokes": 4,
        "mnemonic": "A compact sign for bound writing and study.",
        "cultural_note": "书 connects books, letters, calligraphy, and literati culture.",
        "example_words": ["书法", "书店", "读书"],
    },
    {
        "simplified": "诗",
        "traditional": "詩",
        "pinyin": "shī",
        "meaning": "poetry",
        "radical": "讠",
        "strokes": 8,
        "mnemonic": "Speech radical plus temple-like sound component points to crafted language.",
        "cultural_note": "诗 is central to elite education and everyday cultural memory.",
        "example_words": ["唐诗", "诗词", "诗人"],
    },
    {
        "simplified": "画",
        "traditional": "畫",
        "pinyin": "huà",
        "meaning": "painting; to draw",
        "radical": "田",
        "strokes": 8,
        "mnemonic": "A framed field suggests arranging marks inside a picture space.",
        "cultural_note": "画 pairs with 书 in the literati arts of painting and calligraphy.",
        "example_words": ["山水画", "画家", "书画"],
    },
]


def seed_database(db: Session) -> None:
    if not db.get(User, "demo-user"):
        db.add(User(id="demo-user", display_name="Demo Learner", subscription_status="mock_active"))
    for character_data in CHARACTER_METADATA:
        if not db.query(CharacterMetadata).filter(CharacterMetadata.simplified == character_data["simplified"]).first():
            db.add(CharacterMetadata(**character_data))
    for course_data in deepcopy(SEED_COURSES):
        if db.query(Course).filter(Course.slug == course_data["slug"]).first():
            continue
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
