import { pool } from "@workspace/db";

export async function runStartupMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE community_groups
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS created_by INTEGER,
        ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN DEFAULT FALSE;

      ALTER TABLE community_messages
        ADD COLUMN IF NOT EXISTS sender_id INTEGER,
        ADD COLUMN IF NOT EXISTS file_url TEXT,
        ADD COLUMN IF NOT EXISTS file_type TEXT,
        ADD COLUMN IF NOT EXISTS file_name TEXT;

      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS group_members_unique
        ON group_members(group_id, user_id);

      CREATE TABLE IF NOT EXISTS flashcard_decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        card_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        next_review TIMESTAMP NOT NULL DEFAULT NOW(),
        ease REAL NOT NULL DEFAULT 2.5,
        interval INTEGER NOT NULL DEFAULT 1,
        repetitions INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mnemonics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        mnemonic TEXT NOT NULL,
        description TEXT,
        upvotes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS mnemonic_upvotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        mnemonic_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS mnemonic_upvotes_unique
        ON mnemonic_upvotes(user_id, mnemonic_id);

      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL DEFAULT 'General',
        duration_minutes INTEGER NOT NULL,
        session_type TEXT NOT NULL DEFAULT 'pomodoro',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        exam_date TIMESTAMP NOT NULL,
        description TEXT,
        is_global BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS confessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS confession_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        confession_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS confession_likes_unique
        ON confession_likes(user_id, confession_id);

      CREATE TABLE IF NOT EXISTS study_rooms (
        id SERIAL PRIMARY KEY,
        host_id INTEGER NOT NULL,
        host_name TEXT NOT NULL,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        timer_minutes INTEGER NOT NULL DEFAULT 25,
        status TEXT NOT NULL DEFAULT 'waiting',
        started_at TIMESTAMP,
        ends_at TIMESTAMP,
        member_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS study_room_members (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS study_room_members_unique
        ON study_room_members(room_id, user_id);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        admin_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_warnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        issued_by INTEGER NOT NULL,
        issued_by_name TEXT NOT NULL,
        reason TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'warning',
        seen_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS content_reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        content_preview TEXT,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS content_reports_unique
        ON content_reports(reporter_id, content_type, content_id);

      CREATE TABLE IF NOT EXISTS pinned_notices (
        id SERIAL PRIMARY KEY,
        created_by INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
        ADD COLUMN IF NOT EXISTS delivered_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'all';

      ALTER TABLE mnemonics
        ADD COLUMN IF NOT EXISTS is_admin_shared BOOLEAN DEFAULT FALSE;

      ALTER TABLE flashcard_decks
        ADD COLUMN IF NOT EXISTS is_admin_shared BOOLEAN DEFAULT FALSE;

      ALTER TABLE questions
        ADD COLUMN IF NOT EXISTS max_marks INTEGER DEFAULT 5,
        ADD COLUMN IF NOT EXISTS model_answer TEXT;

      ALTER TABLE quiz_attempts
        ADD COLUMN IF NOT EXISTS has_pending BOOLEAN DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        attempt_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer_text TEXT,
        answer_image_url TEXT,
        max_marks INTEGER NOT NULL DEFAULT 5,
        ai_marks INTEGER,
        ai_feedback TEXT,
        admin_marks INTEGER,
        admin_feedback TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        graded_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS quiz_submissions_user_id
        ON quiz_submissions(user_id);
      CREATE INDEX IF NOT EXISTS quiz_submissions_status
        ON quiz_submissions(status);

      ALTER TABLE quiz_submissions
        ADD COLUMN IF NOT EXISTS ai_lacking TEXT,
        ADD COLUMN IF NOT EXISTS admin_lacking TEXT;

      ALTER TABLE quizzes
        ADD COLUMN IF NOT EXISTS is_proctored BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE quiz_attempts
        ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS proctoring_session_id TEXT,
        ADD COLUMN IF NOT EXISTS proctoring_flagged_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS proctoring_logs (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        attempt_id INTEGER,
        event_type TEXT NOT NULL,
        details JSONB,
        ai_analysis TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS proctoring_logs_session_id
        ON proctoring_logs(session_id);
      CREATE INDEX IF NOT EXISTS proctoring_logs_attempt_id
        ON proctoring_logs(attempt_id);

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS current_rank INTEGER NOT NULL DEFAULT 1;

      CREATE TABLE IF NOT EXISTS xp_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS xp_transactions_user_id
        ON xp_transactions(user_id);

      CREATE TABLE IF NOT EXISTS rank_unlocks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        rank_name TEXT NOT NULL,
        level INTEGER NOT NULL,
        xp_at_unlock INTEGER NOT NULL,
        unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS rank_unlocks_user_level
        ON rank_unlocks(user_id, level);

      CREATE TABLE IF NOT EXISTS group_invites (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        inviter_id INTEGER NOT NULL,
        inviter_name TEXT NOT NULL,
        invitee_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS group_invites_pending_unique
        ON group_invites(group_id, invitee_id)
        WHERE status = 'pending';

      ALTER TABLE community_messages
        ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS deleted_by TEXT DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS seen_by TEXT DEFAULT '[]';

      CREATE TABLE IF NOT EXISTS pyqs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        year TEXT NOT NULL,
        url TEXT NOT NULL,
        download_count INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE pyqs ADD COLUMN IF NOT EXISTS college TEXT NOT NULL DEFAULT 'VIMSAR';

      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL DEFAULT '❤️',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );

      ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '❤️';

      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        author_avatar_url TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_college TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        year TEXT,
        url TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_by_name TEXT,
        rejection_reason TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS attachment_url TEXT,
        ADD COLUMN IF NOT EXISTS attachment_name TEXT,
        ADD COLUMN IF NOT EXISTS attachment_type TEXT;

      CREATE TABLE IF NOT EXISTS app_updates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_seen_app_update_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS weekly_digest_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        attempt_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        question_type TEXT NOT NULL,
        correct BOOLEAN,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS quiz_answers_user_idx ON quiz_answers(user_id);
      CREATE INDEX IF NOT EXISTS quiz_answers_user_subject_idx ON quiz_answers(user_id, subject);

      CREATE TABLE IF NOT EXISTS study_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        target_date TEXT,
        plan_json JSONB NOT NULL,
        weak_subjects JSONB,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS study_plans_user_idx ON study_plans(user_id);

      CREATE TABLE IF NOT EXISTS daily_questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date_key TEXT NOT NULL,
        subject TEXT NOT NULL,
        question_json JSONB NOT NULL,
        answered BOOLEAN NOT NULL DEFAULT FALSE,
        was_correct BOOLEAN,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS daily_questions_user_date_unique ON daily_questions(user_id, date_key);

      CREATE TABLE IF NOT EXISTS clinical_cases (
        id SERIAL PRIMARY KEY,
        scenario TEXT NOT NULL,
        subject TEXT NOT NULL,
        model_answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        date_assigned TEXT,
        created_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clinical_case_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        answer_text TEXT NOT NULL,
        ai_feedback JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE clinical_case_attempts
        ADD COLUMN IF NOT EXISTS date_key TEXT NOT NULL DEFAULT '';

      DROP INDEX IF EXISTS clinical_case_attempts_user_case;

      CREATE UNIQUE INDEX IF NOT EXISTS clinical_case_attempts_user_case_date
        ON clinical_case_attempts(user_id, case_id, date_key);

      ALTER TABLE doubt_answers
        ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

      INSERT INTO clinical_cases (scenario, subject, model_answer, explanation)
      SELECT * FROM (VALUES
        (
          'A 45-year-old man presents with sudden onset of right-sided weakness and slurred speech lasting 2 hours, which resolved completely. He has a history of hypertension and atrial fibrillation. Examination is now normal. What is the most likely diagnosis and your immediate management?',
          'Medicine',
          'TIA (Transient Ischaemic Attack) due to cardioembolic source. Immediate hospital admission, ABCD2 score assessment, CT head (to exclude haemorrhage), ECG/Holter, start anticoagulation (LMWH/warfarin for AF), aspirin 300mg stat, statin therapy, blood pressure control.',
          'TIA is a neurological emergency — 10% risk of stroke within 48 hours. ABCD2 score guides urgency. AF is the most common cardioembolic source. Early intervention reduces stroke risk by 80%.'
        ),
        (
          'A 60-year-old woman with known diabetes presents with painless loss of vision in her right eye over 6 weeks. She describes it like "a curtain coming down." Fundoscopy shows flame-shaped haemorrhages and disc oedema. What is the diagnosis and pathophysiology?',
          'Ophthalmology',
          'Central Retinal Vein Occlusion (CRVO). The central retinal vein is compressed at the lamina cribrosa, causing raised venous pressure, ischaemia, haemorrhages in all 4 quadrants (flame-shaped), disc oedema, and macular oedema. Risk factors: diabetes, hypertension, hyperlipidaemia.',
          'CRVO classic presentation: sudden painless vision loss, "blood and thunder" fundus. Management: Anti-VEGF injections for macular oedema, treat systemic risk factors, screen for glaucoma (neovascular).'
        ),
        (
          'A 3-year-old child presents with fever for 5 days, maculopapular rash starting from behind the ears, koplik spots on buccal mucosa, and conjunctivitis. What is the causative agent, complications you must watch for, and vaccination schedule in India?',
          'Paediatrics',
          'Measles (Rubeola virus — Paramyxovirus). Complications: otitis media (most common), pneumonia (most dangerous), encephalitis (SSPE — late fatal complication), vitamin A deficiency. Indian vaccination: MR at 9-12 months and 16-24 months under NIS.',
          'The 3 Cs of measles: Cough, Coryza, Conjunctivitis. Koplik spots are pathognomonic and appear 1-2 days before rash. Vitamin A supplementation reduces mortality. Notifiable disease.'
        ),
        (
          'A 25-year-old woman presents with amenorrhoea for 3 months, galactorrhoea, and bitemporal hemianopia. Her serum prolactin is 450 ng/mL. MRI pituitary shows a 12 mm lesion. What is the diagnosis and treatment?',
          'Medicine',
          'Prolactinoma (pituitary macroadenoma) causing hyperprolactinaemia. Treatment: Dopamine agonist — Cabergoline (first line) or Bromocriptine. Surgery (transsphenoidal) reserved for resistance/intolerance. Visual field monitoring. Prolactin normalises and tumour shrinks in most cases.',
          'Prolactin inhibits GnRH → amenorrhoea, infertility. Bitemporal hemianopia due to optic chiasm compression. Macro = >10mm, Micro = <10mm. Cabergoline preferred over bromocriptine (better tolerability, once weekly dosing).'
        ),
        (
          'A 55-year-old smoker presents with haemoptysis, weight loss, and a cavitating lesion in the right upper lobe on X-ray. Sputum AFB smear is negative. What is your differential diagnosis and next investigation?',
          'Medicine',
          'Differential: (1) Carcinoma of lung (squamous cell — most common to cavitate), (2) Pulmonary tuberculosis (smear-negative does not exclude TB), (3) Lung abscess, (4) Aspergilloma. Next: CT chest with contrast + sputum for culture, CBNAAT, bronchoscopy with BAL and biopsy, PET-CT if malignancy suspected.',
          'Cavitating lung lesion + smoker → carcinoma until proven otherwise. Squamous cell carcinoma is most likely to cavitate. CBNAAT is more sensitive than smear for TB. Bronchoscopy allows histological diagnosis and culture.'
        ),
        (
          'A 30-year-old woman develops facial rash in a butterfly distribution, joint pain, oral ulcers, and is found to have proteinuria 3+. ANA is positive with anti-dsDNA antibody titre elevated. What is the diagnosis, and how do you classify severity?',
          'Medicine',
          'Systemic Lupus Erythematosus (SLE). SLICC criteria (≥4 of 11). Renal involvement (lupus nephritis) indicates severe disease. WHO Class III/IV nephritis requires cyclophosphamide or mycophenolate + hydroxychloroquine + prednisolone. Monitor with urine protein:creatinine ratio, C3/C4 complement levels.',
          'Anti-dsDNA is highly specific for SLE and correlates with disease activity. Hydroxychloroquine is the backbone of all SLE treatment. Lupus nephritis is the major cause of morbidity — biopsy guides immunosuppression choice.'
        ),
        (
          'A 70-year-old man presents with progressive lower limb weakness, hyperreflexia, extensor plantar response, and sensory level at T10. MRI shows posterior disc herniation at T9-T10 compressing the cord. What is the diagnosis and urgency of management?',
          'Surgery',
          'Thoracic disc herniation causing Anterior Cord Syndrome / Compressive Myelopathy. Surgical emergency — urgent decompressive laminectomy/discectomy. Pre-operative IV methylprednisolone (controversial but widely used in India). Complete vs incomplete injury assessed by ASIA scale.',
          'Spinal cord injury: upper motor neurone signs below the level. Sensory level at T10 localises the lesion. Golden period for surgery is within 6-8 hours. Long-term: physiotherapy, bladder/bowel rehabilitation, prevention of pressure sores.'
        ),
        (
          'A 2-day-old neonate presents with jaundice noticed at birth. Baby is blood group A positive, mother is O positive. The baby appears lethargic with poor feeding. Direct Coombs test is positive. What is the diagnosis and your management?',
          'Paediatrics',
          'ABO Haemolytic Disease of Newborn (HDN). IgG anti-A/anti-B maternal antibodies cross placenta and haemolyse fetal RBCs. Management: Serum bilirubin levels, phototherapy if above treatment threshold (Bhutani nomogram), exchange transfusion if rising rapidly or approaching kernicterus range, IV immunoglobulin to reduce haemolysis.',
          'Jaundice in first 24 hours is always pathological. ABO incompatibility is most common cause of HDN. Distinguish from physiological jaundice (day 2-3). Kernicterus risk: unconjugated bilirubin crosses BBB in neonates. Direct Coombs+ confirms immune-mediated haemolysis.'
        ),
        (
          'A 40-year-old woman presents with dysphagia to solids and liquids equally, regurgitation of undigested food, and weight loss. Barium swallow shows rat-tail narrowing at the lower oesophagus with proximal dilatation. Manometry shows failure of LOS relaxation. What is the diagnosis and treatment?',
          'Medicine',
          'Achalasia Cardia. Failure of LOS relaxation + absence of oesophageal peristalsis due to loss of myenteric plexus ganglionic cells (Auerbach plexus). Treatment options: Pneumatic balloon dilatation (most effective non-surgical), Heller myotomy (laparoscopic), Botulinum toxin injection (elderly/poor surgical risk), Nifedipine/nitrates (medical — least effective).',
          'Key differentiator: dysphagia to both solids AND liquids from onset = motility disorder (vs solids only early → mechanical obstruction). Bird-beak/rat-tail sign on barium. Manometry is gold standard. Risk of oesophageal carcinoma long-term — surveillance needed.'
        ),
        (
          'A 28-year-old pregnant woman at 34 weeks gestation presents with sudden onset severe headache, blurred vision, and BP of 170/110 mmHg. Urine shows proteinuria 3+. She has a generalized tonic-clonic seizure in the ED. What is the diagnosis and immediate management?',
          'Obstetrics',
          'Eclampsia (Pre-eclampsia + seizure). Immediate: MgSO4 (Pritchard regime or Zuspan regime) to prevent further seizures, control BP (IV labetalol or hydralazine — target <160/110), left lateral position, O2, IV access, monitor fetal heart rate. Definitive treatment is DELIVERY after stabilisation.',
          'Pre-eclampsia triad: hypertension + proteinuria + oedema after 20 weeks. Eclampsia = seizure added. MgSO4 is the drug of choice for seizure prophylaxis and treatment in eclampsia. Peripartum cardiomyopathy, HELLP syndrome, and renal failure are life-threatening complications.'
        ),
        (
          'A 65-year-old man with poorly controlled diabetes presents with fever, severe right ear pain, and pus discharge. On examination there is granulation tissue at the bony-cartilaginous junction of the external auditory canal. CT shows bone erosion. What is the diagnosis?',
          'ENT',
          'Malignant (Necrotising) Otitis Externa. Pseudomonas aeruginosa is the causative organism in >95% of cases. The infection spreads from EAC to surrounding structures — skull base osteomyelitis (dangerous). Treatment: IV antipseudomonal antibiotics (piperacillin-tazobactam or ciprofloxacin), debridement, glycaemic control, long course (6-8 weeks). CT/MRI for staging.',
          'Keyword: Diabetic + granulation tissue at bony-cartilaginous junction of EAC = Malignant OE. Can cause cranial nerve palsies (VII most common). Differentiate from benign OE by absence of bone erosion and diabetes association. High mortality if untreated.'
        ),
        (
          'A 50-year-old man presents with episodic hypertension, sweating, palpitations and headache. 24-hour urinary VMA and metanephrines are elevated. CT abdomen shows a 4 cm right adrenal mass. What is the diagnosis and pre-operative preparation?',
          'Surgery',
          'Phaeochromocytoma (PPGL — paraganglioma if extra-adrenal). Pre-operative preparation: Alpha-blockade FIRST (phenoxybenzamine 2-4 weeks) to block the effects of catecholamines, then beta-blockade (never start beta-blocker first — causes unopposed alpha vasoconstriction and hypertensive crisis). Adequate hydration. Laparoscopic adrenalectomy.',
          'Rule of 10s: 10% malignant, 10% bilateral, 10% extra-adrenal, 10% in children. Alpha-BEFORE-Beta rule is critical — exam favourite. Screen for MEN2 (RET mutation), VHL, NF-1. Post-op: monitor glucose (insulin from tumour released on handling). Check 24h urinary catecholamines 6 weeks post-op.'
        ),
        (
          'A 22-year-old student presents with fever, severe sore throat, and cervical lymphadenopathy. Paul-Bunnell test (Monospot) is positive. On examination there is tonsillar exudate and tender hepatosplenomegaly. What is the diagnosis, and what drugs should be avoided?',
          'Medicine',
          'Infectious Mononucleosis (Glandular Fever) caused by EBV (Epstein-Barr Virus). AVOID AMPICILLIN/AMOXICILLIN — causes maculopapular rash in ~90% of IM patients (ampicillin rash). Also avoid contact sports (splenomegaly → splenic rupture risk). Treatment: supportive — fluids, analgesics, antipyretics. Corticosteroids for airway obstruction or severe thrombocytopaenia.',
          'Atypical lymphocytes (Downey cells) on blood smear. Paul-Bunnell/Monospot detects heterophile antibodies. EBV associated with Burkitt lymphoma (in Africa) and nasopharyngeal carcinoma. Splenic rupture is the most dangerous complication. Ampicillin rash is a classic exam scenario.'
        ),
        (
          'A 35-year-old woman presents with heat intolerance, weight loss despite good appetite, palpitations, tremors, and lid lag. TSH is undetectable with elevated free T4 and T3. A diffuse goitre and exophthalmos are present. What is the diagnosis and treatment options?',
          'Medicine',
          'Graves Disease (autoimmune hyperthyroidism) — TSH receptor stimulating antibodies (TRAb). Treatment options: (1) Antithyroid drugs — Carbimazole (preferred in India) or PTU (pregnancy) — titrate and wean 12-18 months; (2) Radioiodine (¹³¹I) — not in pregnancy, preferred in relapse; (3) Thyroidectomy — in large goitre, compression, or choice. Beta-blockers for symptom control.',
          'Lid lag = Dalrymple sign. Exophthalmos (proptosis) is specific to Graves (not seen in other causes of hyperthyroidism). PTU crosses placenta less than carbimazole — preferred in first trimester. Thyroid storm: life-threatening emergency — cool, PTU, Lugol iodine, propranolol, steroids.'
        ),
        (
          'A 12-year-old boy presents to the casualty after a road traffic accident with BP 80/50, HR 130, GCS 13. On examination there is bruising over the left flank and left lower rib fractures. FAST ultrasound shows free fluid in the abdomen. What is the immediate management?',
          'Surgery',
          'Haemorrhagic shock secondary to solid organ (likely splenic) injury. Follow ATLS protocol: A (airway), B (breathing — two large IV cannulas), C (circulation — 2 large bore IV access, crystalloid/blood transfusion, massive transfusion protocol), D (disability — GCS), E (exposure). CT abdomen if haemodynamically stable. Exploratory laparotomy if unstable.',
          'In paediatric trauma, spleen is most commonly injured organ. Damage control surgery: laparotomy for haemorrhage control — do minimum to save life. In stable patients, non-operative management with CT grading of injury is preferred for splenic injuries in children. ATLS sequence is a high-yield topic.'
        )
      ) AS v(scenario, subject, model_answer, explanation)
      WHERE NOT EXISTS (SELECT 1 FROM clinical_cases LIMIT 1);

      ALTER TABLE pyqs
        ADD COLUMN IF NOT EXISTS topic_tags TEXT[] NOT NULL DEFAULT '{}';

      ALTER TABLE questions
        ADD COLUMN IF NOT EXISTS topic_tags TEXT[];

      CREATE TABLE IF NOT EXISTS pyq_insights_cache (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        insights_json JSONB NOT NULL DEFAULT '[]',
        generated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teach_back_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        subject TEXT NOT NULL,
        transcript TEXT,
        score INTEGER,
        feedback_json JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT 'gpt-4o',
        messages_json JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_updated
        ON ai_chat_sessions (user_id, updated_at DESC);

      CREATE TABLE IF NOT EXISTS ai_revision_items (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_revision_items_subject_type
        ON ai_revision_items (subject, type);
      CREATE INDEX IF NOT EXISTS idx_ai_revision_items_book_id
        ON ai_revision_items (book_id);

      -- Grand Test Series
      CREATE TABLE IF NOT EXISTS grand_tests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL DEFAULT 180,
        available_from TIMESTAMP,
        available_until TIMESTAMP,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_by INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grand_test_questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES grand_tests(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'long',
        max_marks INTEGER NOT NULL DEFAULT 10,
        order_index INTEGER NOT NULL DEFAULT 0,
        model_answer TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gtq_test_id ON grand_test_questions(test_id, order_index);

      CREATE TABLE IF NOT EXISTS grand_test_submissions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES grand_tests(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        submitted_at TIMESTAMP,
        total_marks_obtained INTEGER,
        total_marks_possible INTEGER,
        status TEXT NOT NULL DEFAULT 'in_progress',
        ai_overall_feedback TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gts_test_user ON grand_test_submissions(test_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_gts_user ON grand_test_submissions(user_id);

      CREATE TABLE IF NOT EXISTS grand_test_answers (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES grand_test_submissions(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES grand_test_questions(id) ON DELETE CASCADE,
        answer_text TEXT NOT NULL DEFAULT '',
        ai_marks INTEGER,
        ai_feedback TEXT,
        ai_key_points_covered TEXT,
        ai_key_points_missed TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gta_submission ON grand_test_answers(submission_id);

      -- Add image support to grand test answers (idempotent)
      ALTER TABLE grand_test_answers ADD COLUMN IF NOT EXISTS answer_image_url TEXT;
      ALTER TABLE grand_tests ADD COLUMN IF NOT EXISTS answers_released BOOLEAN NOT NULL DEFAULT false;

      -- Link admin account to personal student account
      ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_student_id INTEGER REFERENCES users(id);
      UPDATE users SET linked_student_id = (SELECT id FROM users WHERE email = 'www.jyotirmay1234@gmail.com' LIMIT 1)
        WHERE email = 'missiondistinction108@gmail.com' AND linked_student_id IS NULL;

      -- ── Notes Marketplace ─────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS student_note_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL DEFAULT 'pdf',
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sns_user ON student_note_submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sns_status ON student_note_submissions(status);

      -- ── Photo Doubts ──────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS photo_doubts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        question TEXT,
        ai_explanation TEXT NOT NULL,
        subject TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pd_user ON photo_doubts(user_id);

      -- ── Grand Round columns on clinical_cases ─────────────────────────────────
      ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS is_grand_round BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS grand_round_week TEXT;
      ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS featured_attempt_id INTEGER;
      ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS winner_announced_at TIMESTAMP;

      -- ── AI-generated doubt answers: nullable user_id for proper attribution ──
      ALTER TABLE doubt_answers ALTER COLUMN user_id DROP NOT NULL;

      -- ── Video feature ──────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        cloudinary_public_id TEXT,
        video_url TEXT,
        thumbnail_url TEXT,
        duration_seconds INTEGER,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS video_concepts (
        id SERIAL PRIMARY KEY,
        video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        heading TEXT NOT NULL,
        content TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS video_questions (
        id SERIAL PRIMARY KEY,
        video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INTEGER NOT NULL,
        explanation TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS video_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        watched_percent INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        quiz_score INTEGER,
        quiz_total INTEGER,
        xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS video_progress_unique ON video_progress(user_id, video_id);
    `);
  } finally {
    client.release();
  }
}
