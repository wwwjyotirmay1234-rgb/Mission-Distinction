export type QuizQuestion = {
  q: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
};

export type StructureLabel = {
  id: string;
  name: string;
  pos: [number, number, number];
  description: string;
  clinicalNote?: string;
};

export type AnatomyStructure = {
  id: string;
  name: string;
  description: string;
  clinicalPoints: string[];
  studyNotes: string;
  quiz: QuizQuestion[];
  labels: StructureLabel[];
};

export type AnatomySystem = {
  id: string;
  name: string;
  color: string;
  darkColor: string;
  modelCount: number;
  icon: string;
  structures: AnatomyStructure[];
  cadavericTitle: string;
  cadavericSide: string;
  cadavericDescription: string;
  cadavericImageUrl: string;
  cadavericAnnotations: { label: string; x: number; y: number; line?: string }[];
  crossSectionTitle: string;
  crossSectionLevel: string;
  crossSectionDescription: string;
  ctNote: string;
  mriNote: string;
};

export const ANATOMY_SYSTEMS: AnatomySystem[] = [
  {
    id: "cardiovascular",
    name: "Cardiovascular System",
    color: "#ef4444",
    darkColor: "#7f1d1d",
    modelCount: 112,
    icon: "🫀",
    cadavericTitle: "Heart – Anterior View",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric dissection showing the anterior surface of the heart with great vessels. Note the right ventricle forming most of the anterior surface, the coronary sulcus separating atria from ventricles, and the anterior interventricular groove containing the LAD artery.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Heart_diagram-en.svg/640px-Heart_diagram-en.svg.png",
    cadavericAnnotations: [
      { label: "Aorta", x: 48, y: 10 },
      { label: "Pulmonary Trunk", x: 32, y: 14 },
      { label: "Right Atrium", x: 72, y: 35 },
      { label: "Left Atrium", x: 28, y: 28 },
      { label: "Right Ventricle", x: 62, y: 60 },
      { label: "Left Ventricle", x: 38, y: 65 },
      { label: "Apex", x: 48, y: 82 },
    ],
    crossSectionTitle: "Thorax – CT Section",
    crossSectionLevel: "T5",
    crossSectionDescription: "Axial CT section through the thorax at T5 level showing the four chambers of the heart, great vessels, and surrounding mediastinal structures.",
    ctNote: "CT angiography preferred for coronary artery assessment. Requires IV contrast.",
    mriNote: "Cardiac MRI (CMR) is gold standard for myocardial viability, cardiomyopathy workup, and congenital heart disease.",
    structures: [
      {
        id: "left-ventricle",
        name: "Left Ventricle",
        description: "The left ventricle (LV) is the most muscular chamber of the heart, with a wall thickness of 8–12 mm. It ejects oxygenated blood into the systemic circulation via the aorta.",
        clinicalPoints: [
          "Wall thickness >12mm on echo → left ventricular hypertrophy (LVH)",
          "LV ejection fraction (LVEF) <40% defines systolic heart failure",
          "LV aneurysm: complication of anterior STEMI (LAD territory)",
          "Dressler's syndrome: pericarditis weeks after MI",
          "LVEDP elevated in LV failure → pulmonary oedema",
        ],
        studyNotes: "LV has 3× thicker wall than RV. Receives blood from LA via mitral valve. Outflow via aortic valve. Normal EF: 55–70%. LV is ellipsoidal (sausage-shaped) not spherical.",
        quiz: [
          {
            q: "Which coronary artery supplies the anterior wall of the left ventricle?",
            options: ["Right coronary artery", "Left anterior descending (LAD)", "Left circumflex artery", "Posterior descending artery"],
            correct: 1,
            explanation: "The LAD (anterior interventricular artery) supplies the anterior wall of LV, anterior 2/3 of interventricular septum, and apex — called the 'widow maker' for causing large anterior MIs.",
          },
          {
            q: "Which valve separates the left atrium from the left ventricle?",
            options: ["Tricuspid valve", "Aortic valve", "Pulmonary valve", "Mitral (bicuspid) valve"],
            correct: 3,
            explanation: "The mitral valve (bicuspid) has two leaflets — anterior and posterior. It is supported by two papillary muscles (anterolateral and posteromedial) via chordae tendineae. Rheumatic fever is the commonest cause of mitral stenosis.",
          },
          {
            q: "Normal left ventricular ejection fraction (LVEF) is:",
            options: ["25–35%", "35–45%", "55–70%", "75–85%"],
            correct: 2,
            explanation: "Normal LVEF is 55–70%. LVEF < 40% = reduced EF (HFrEF). LVEF 40–50% = mildly reduced (HFmrEF). LVEF ≥ 50% = preserved EF (HFpEF).",
          },
        ],
        labels: [
          { id: "lv-body", name: "Left Ventricle", pos: [-0.28, -0.15, 0.5], description: "Thick-walled muscular chamber pumping oxygenated blood to systemic circulation via the aorta." },
          { id: "rv-body", name: "Right Ventricle", pos: [0.45, -0.22, 0.5], description: "Thin-walled crescent-shaped chamber pumping deoxygenated blood to lungs via pulmonary trunk." },
          { id: "la-body", name: "Left Atrium", pos: [-0.35, 0.55, 0.5], description: "Receives oxygenated blood from pulmonary veins and pumps it to the left ventricle." },
          { id: "ra-body", name: "Right Atrium", pos: [0.48, 0.48, 0.5], description: "Receives deoxygenated blood from SVC, IVC, and coronary sinus." },
          { id: "aorta", name: "Ascending Aorta", pos: [-0.05, 1.0, 0.5], description: "First part of aorta. Gives rise to right and left coronary arteries from the aortic sinuses.", clinicalNote: "Site of aortic root dilation in Marfan syndrome (>4cm = significant)" },
          { id: "pa", name: "Pulmonary Trunk", pos: [0.3, 0.9, 0.5], description: "Arises from the right ventricle, bifurcates into right and left pulmonary arteries.", clinicalNote: "Saddle embolus at bifurcation = massive PE → haemodynamic compromise" },
        ],
      },
      {
        id: "coronary-arteries",
        name: "Coronary Arteries",
        description: "The coronary arteries arise from the aortic sinuses (sinuses of Valsalva) just above the aortic valve cusps. They supply the myocardium during diastole when coronary perfusion pressure is highest.",
        clinicalPoints: [
          "LAD: anterior wall LV + anterior septum (most common site of MI)",
          "RCA: SA node (55%), AV node (90%), inferior wall LV, RV, posterior septum",
          "LCx: lateral and posterior wall of LV (in left-dominant systems)",
          "Right dominant circulation (85%): RCA gives posterior descending artery (PDA)",
          "Left dominant (8%): LCx gives PDA",
          "CABG: internal mammary artery (IMA) preferred conduit for LAD",
        ],
        studyNotes: "Remember: coronary arteries fill during diastole. Tachycardia reduces diastolic time → reduces coronary filling → ischaemia. Prinzmetal angina: coronary vasospasm, ST elevation at rest, relieved by nitrates.",
        quiz: [
          {
            q: "The sinoatrial (SA) node is supplied by which artery in 55% of people?",
            options: ["Left anterior descending", "Left circumflex", "Right coronary artery", "Posterior descending artery"],
            correct: 2,
            explanation: "The SA nodal artery arises from the RCA in 55% and from the LCx in 45%. This is why inferior MI (RCA territory) can cause sinus bradycardia or SA node dysfunction.",
          },
        ],
        labels: [],
      },
    ],
  },
  {
    id: "skeletal",
    name: "Skeletal System",
    color: "#f59e0b",
    darkColor: "#78350f",
    modelCount: 126,
    icon: "🦴",
    cadavericTitle: "Skull – Lateral View",
    cadavericSide: "Lateral",
    cadavericDescription: "Lateral view of the human skull showing the cranial bones, sutures, and foramina. The pterion (H-shaped junction of frontal, parietal, temporal, and sphenoid bones) is a vulnerable point — the middle meningeal artery lies deep to it.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gray188-en.svg/500px-Gray188-en.svg.png",
    cadavericAnnotations: [
      { label: "Frontal Bone", x: 25, y: 25 },
      { label: "Parietal Bone", x: 55, y: 20 },
      { label: "Temporal Bone", x: 72, y: 45 },
      { label: "Occipital Bone", x: 82, y: 35 },
      { label: "Zygomatic Arch", x: 68, y: 62 },
      { label: "Mandible", x: 52, y: 78 },
      { label: "External Acoustic Meatus", x: 75, y: 55 },
    ],
    crossSectionTitle: "Skull Base – Axial CT",
    crossSectionLevel: "Base of Skull",
    crossSectionDescription: "Axial CT at the skull base showing the three cranial fossae (anterior, middle, posterior), foramina, and bony landmarks important for neurosurgery and ENT.",
    ctNote: "CT is investigation of choice for bone detail, fractures, calcification, and haematoma (blood appears hyperdense 40–80 HU).",
    mriNote: "MRI superior for soft tissue (brain, meninges, CSF, cranial nerves). T1: fat bright, CSF dark. T2: CSF bright, good for oedema.",
    structures: [
      {
        id: "humerus",
        name: "Humerus",
        description: "The humerus is the long bone of the arm, articulating with the scapula (glenoid) proximally and the radius and ulna distally at the elbow. The shaft is cylindrical in cross-section and contains the radial groove posteriorly.",
        clinicalPoints: [
          "Surgical neck fracture → axillary nerve injury (paralysis of deltoid, loss of sensation over 'regimental badge' area)",
          "Midshaft fracture → radial nerve injury (wrist drop, loss of finger/thumb extension)",
          "Supracondylar fracture (children) → anterior interosseous nerve (AIN) injury → loss of FPL + FDP to index",
          "Medial epicondyle avulsion → ulnar nerve injury",
          "Greater tubercle fracture → rotator cuff attachment (supraspinatus, infraspinatus, teres minor)",
          "Lesser tubercle fracture → subscapularis attachment",
        ],
        studyNotes: "Pneumonic for rotator cuff muscles: SITS (Supraspinatus, Infraspinatus, Teres minor, Subscapularis). Supraspinatus initiates first 15° of abduction. Deltoid takes over 15–90°. Trapezius above 90°.",
        quiz: [
          {
            q: "A fracture of the surgical neck of the humerus is most likely to injure which nerve?",
            options: ["Radial nerve", "Ulnar nerve", "Axillary nerve", "Musculocutaneous nerve"],
            correct: 2,
            explanation: "The axillary nerve winds around the surgical neck of the humerus. Injury causes paralysis of deltoid (loss of abduction) and loss of sensation over the lateral shoulder ('regimental badge' area).",
          },
          {
            q: "Which structure lies in the radial groove (spiral groove) of the humerus?",
            options: ["Brachial artery", "Radial nerve", "Ulnar nerve", "Median nerve"],
            correct: 1,
            explanation: "The radial nerve lies in the spiral (radial) groove on the posterior aspect of the humerus mid-shaft. Midshaft fractures can cause radial nerve palsy → wrist drop.",
          },
          {
            q: "The greater tubercle of the humerus is the attachment for all of the following EXCEPT:",
            options: ["Supraspinatus", "Infraspinatus", "Teres minor", "Subscapularis"],
            correct: 3,
            explanation: "Subscapularis attaches to the lesser tubercle. The greater tubercle has three facets: superior (supraspinatus), middle (infraspinatus), inferior (teres minor). Remember: SIT on the greater tubercle; Sub on the lesser.",
          },
        ],
        labels: [
          { id: "head", name: "Head", pos: [-0.1, 1.3, 0.5], description: "Articulates with glenoid cavity of scapula. Covered by hyaline cartilage. Retroversion of 30° relative to shaft." },
          { id: "greater-tubercle", name: "Greater Tubercle", pos: [0.75, 1.0, 0.5], description: "Lateral projection. Attachment: supraspinatus (superior facet), infraspinatus (middle), teres minor (inferior).", clinicalNote: "Avulsion fracture of greater tubercle = suspected rotator cuff avulsion" },
          { id: "lesser-tubercle", name: "Lesser Tubercle", pos: [-0.65, 1.0, 0.5], description: "Anterior projection. Attachment: subscapularis. Palpable anteriorly when shoulder in external rotation." },
          { id: "surgical-neck", name: "Surgical Neck", pos: [0.8, 0.6, 0.5], description: "Narrow area below the tubercles. Common fracture site, especially in osteoporotic elderly.", clinicalNote: "Axillary nerve injury risk at surgical neck" },
          { id: "radial-groove", name: "Radial Groove", pos: [0.8, -0.1, 0.5], description: "Spiral groove on posterior humerus for radial nerve and profunda brachii artery." },
          { id: "medial-epicondyle", name: "Medial Epicondyle", pos: [-0.7, -1.2, 0.5], description: "Origin of flexor-pronator mass. Ulnar nerve passes posterior to it in the cubital tunnel.", clinicalNote: "Avulsion in children; ulnar nerve palsy risk ('funny bone')" },
          { id: "lateral-epicondyle", name: "Lateral Epicondyle", pos: [0.7, -1.2, 0.5], description: "Origin of extensor-supinator muscles. Lateral epicondylitis (tennis elbow) = ECRB tendinopathy." },
          { id: "trochlea", name: "Trochlea", pos: [-0.3, -1.5, 0.5], description: "Spool-shaped articular surface for trochlear notch of ulna. Forms the elbow hinge." },
          { id: "capitulum", name: "Capitulum", pos: [0.3, -1.5, 0.5], description: "Rounded articular surface for the head of radius. Site of Panner disease in children." },
        ],
      },
    ],
  },
  {
    id: "nervous",
    name: "Nervous System",
    color: "#a855f7",
    darkColor: "#3b0764",
    modelCount: 98,
    icon: "🧠",
    cadavericTitle: "Brain – Superolateral View",
    cadavericSide: "Superolateral",
    cadavericDescription: "Cadaveric specimen of the brain from a superolateral view, showing the gyri and sulci of the cerebral cortex, lateral sulcus (Sylvian fissure) separating temporal from frontal/parietal lobes, and the central sulcus (Rolandic fissure).",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-brzegi-half.jpg/500px-24701-brzegi-half.jpg",
    cadavericAnnotations: [
      { label: "Frontal Lobe", x: 25, y: 35 },
      { label: "Central Sulcus", x: 48, y: 22 },
      { label: "Parietal Lobe", x: 62, y: 28 },
      { label: "Occipital Lobe", x: 82, y: 38 },
      { label: "Temporal Lobe", x: 38, y: 65 },
      { label: "Lateral Sulcus", x: 50, y: 55 },
      { label: "Cerebellum", x: 72, y: 72 },
    ],
    crossSectionTitle: "Brain – Axial MRI",
    crossSectionLevel: "Basal Ganglia Level",
    crossSectionDescription: "T2-weighted MRI axial section at the level of basal ganglia showing caudate, putamen, globus pallidus, internal capsule, thalamus, and surrounding structures.",
    ctNote: "Non-contrast CT: blood is hyperdense (white). Choice for acute stroke (haemorrhagic), head trauma, hydrocephalus, fractures.",
    mriNote: "MRI: T1 good anatomy, T2 shows oedema/infarction (bright). DWI for acute ischaemic stroke (bright within minutes). FLAIR suppresses CSF signal.",
    structures: [
      {
        id: "cerebral-cortex",
        name: "Cerebral Cortex",
        description: "The cerebral cortex is the outer layer of grey matter (1.5–4 mm thick) containing billions of neurons arranged in 6 layers (neocortex). It is folded into gyri (ridges) and sulci (grooves) to increase surface area.",
        clinicalPoints: [
          "Broca's area (44, 45): inferior frontal gyrus, dominant hemisphere → expressive/motor aphasia if damaged",
          "Wernicke's area (22): superior temporal gyrus → receptive/sensory aphasia (fluent but nonsensical)",
          "Motor cortex: precentral gyrus — homunculus with leg at top (parasagittal), hand in middle, face inferior",
          "Somatosensory: postcentral gyrus",
          "Visual cortex: occipital lobe (calcarine sulcus) — contralateral homonymous hemianopia if damaged",
          "Middle cerebral artery territory: face + arm area of cortex → contralateral face + arm weakness",
        ],
        studyNotes: "Brodmann areas important for MCQs: Area 4 (primary motor), Area 3,1,2 (somatosensory), Area 17 (primary visual), Area 41,42 (primary auditory), Area 44,45 (Broca's), Area 22 (Wernicke's).",
        quiz: [
          {
            q: "A patient has difficulty understanding speech but can speak fluently (though nonsensically). Which area is damaged?",
            options: ["Broca's area", "Wernicke's area", "Motor cortex", "Prefrontal cortex"],
            correct: 1,
            explanation: "Wernicke's aphasia: fluent speech but poor comprehension. Lesion in Wernicke's area (area 22, posterior superior temporal gyrus). Broca's aphasia = non-fluent (effortful) speech with intact comprehension.",
          },
          {
            q: "The primary motor cortex is located in which gyrus?",
            options: ["Postcentral gyrus", "Superior frontal gyrus", "Precentral gyrus", "Angular gyrus"],
            correct: 2,
            explanation: "Primary motor cortex (Brodmann area 4) = precentral gyrus. The homunculus is inverted: toes/foot at medial surface (parasagittal), then leg, trunk, arm, hand (large representation), face at lateral surface.",
          },
        ],
        labels: [
          { id: "frontal", name: "Frontal Lobe", pos: [-0.1, 0.45, 1.05], description: "Executive function, voluntary movement (precentral), Broca's area, personality, judgment." },
          { id: "parietal", name: "Parietal Lobe", pos: [0.0, 0.9, 0.3], description: "Somatosensory cortex (postcentral gyrus), spatial awareness, reading comprehension." },
          { id: "temporal", name: "Temporal Lobe", pos: [-1.05, 0.05, 0.2], description: "Auditory cortex, Wernicke's area (dominant), memory (hippocampus), emotion (amygdala)." },
          { id: "occipital", name: "Occipital Lobe", pos: [0.0, 0.35, -1.05], description: "Primary visual cortex (calcarine sulcus). Lesion → contralateral homonymous hemianopia with macular sparing." },
          { id: "cerebellum", name: "Cerebellum", pos: [0.0, -0.9, -0.7], description: "Coordination, balance, fine motor movements, motor learning. DASHED: Dysdiadochokinesis, Ataxia, Slurred speech, Hypotonia, Eye nystagmus, Dysmetria." },
          { id: "brainstem", name: "Brainstem", pos: [0.0, -1.15, -0.1], description: "Midbrain, Pons, Medulla. Cranial nerve nuclei (III–XII). Vital centres (respiratory, cardiovascular)." },
        ],
      },
    ],
  },
  {
    id: "respiratory",
    name: "Respiratory System",
    color: "#06b6d4",
    darkColor: "#164e63",
    modelCount: 65,
    icon: "🫁",
    cadavericTitle: "Lungs – Anterior View",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric lungs in situ showing the right (3 lobes) and left (2 lobes) lungs, cardiac notch of the left lung, and the relation to the pericardium. The hilum contains the bronchi, pulmonary vessels, and lymphatics.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    cadavericAnnotations: [
      { label: "Trachea", x: 50, y: 8 },
      { label: "Right Upper Lobe", x: 72, y: 28 },
      { label: "Right Middle Lobe", x: 74, y: 52 },
      { label: "Right Lower Lobe", x: 70, y: 72 },
      { label: "Left Upper Lobe", x: 28, y: 28 },
      { label: "Left Lower Lobe", x: 30, y: 65 },
      { label: "Cardiac Notch", x: 40, y: 50 },
    ],
    crossSectionTitle: "Chest – CT Section",
    crossSectionLevel: "T4–T6",
    crossSectionDescription: "Axial HRCT (High Resolution CT) at the level of the carina showing lung parenchyma, major airways, and mediastinal structures. Window width 1500 HU, level −600 HU for optimal lung visualisation.",
    ctNote: "HRCT: window for lung parenchyma (W:1500, L:−600). Ground glass opacity (GGO): partial filling of alveoli. Consolidation: complete filling. Honeycombing: end-stage fibrosis.",
    mriNote: "MRI lung: limited by respiratory/cardiac motion and low proton density. Used for chest wall/mediastinal soft tissue characterisation, cardiac MRI.",
    structures: [
      {
        id: "right-lung",
        name: "Right Lung",
        description: "The right lung has three lobes (upper, middle, lower) separated by the oblique fissure (between upper+middle and lower) and horizontal fissure (between upper and middle). It is shorter and wider than the left lung due to the liver below.",
        clinicalPoints: [
          "Right lung aspiration pneumonia: more common as right main bronchus is more vertical (25° vs 45° left)",
          "Right middle lobe syndrome: collapse due to hilar lymph nodes compressing middle lobe bronchus",
          "Primary TB: classically upper lobe (Ghon focus → Ghon complex with lymph node)",
          "Pulmonary embolism: right lower lobe most common site (gravity dependent)",
          "Pleural effusion: blunting of costophrenic angle on CXR, requires >200ml",
          "Right phrenic nerve: passes through IVC hiatus at T8",
        ],
        studyNotes: "Right lung has 10 bronchopulmonary segments (3+2+5 = upper+middle+lower). Left has 8-10 segments (4+6 = upper+lower). Each segment is independent with its own segmental bronchus, artery, and vein — surgical resectability.",
        quiz: [
          {
            q: "Which lobe of the lung is most commonly affected by aspiration pneumonia in a supine patient?",
            options: ["Right upper lobe", "Right middle lobe", "Right lower lobe, posterior segment", "Left lower lobe"],
            correct: 2,
            explanation: "In a supine patient, the posterior segment of the right lower lobe (and apical segment) is most dependent and most commonly affected by aspiration. This is because the right main bronchus is more vertical and the posterior segments are dependent when supine.",
          },
        ],
        labels: [
          { id: "rul", name: "Right Upper Lobe", pos: [0.8, 0.8, 0.5], description: "Superior lobe. Contains segments: apical, anterior, posterior. Site of primary TB and aspiration in upright position." },
          { id: "rml", name: "Right Middle Lobe", pos: [1.0, 0.1, 0.5], description: "Smallest lobe. Medial and lateral segments. Most medial position — prone to compression by enlarged hilar nodes." },
          { id: "rll", name: "Right Lower Lobe", pos: [0.8, -0.7, 0.5], description: "Largest lobe (5 segments). Basal segments dependent in supine — aspiration site." },
          { id: "lul", name: "Left Upper Lobe", pos: [-0.8, 0.7, 0.5], description: "Includes lingula (equivalent of right middle lobe). Contains cardiac notch on anterior medial surface." },
          { id: "lll", name: "Left Lower Lobe", pos: [-0.8, -0.5, 0.5], description: "4 segments. Common site of pneumonia." },
          { id: "trachea", name: "Trachea", pos: [0.0, 1.5, 0.5], description: "16–20 C-shaped cartilage rings. 10–15cm long. Bifurcates at carina (T4, angle of Louis).", clinicalNote: "Carina angle >70° on CXR → left atrial enlargement (mitral stenosis)" },
        ],
      },
    ],
  },
  {
    id: "muscular",
    name: "Muscular System",
    color: "#f97316",
    darkColor: "#7c2d12",
    modelCount: 187,
    icon: "💪",
    cadavericTitle: "Brachial Plexus Dissection",
    cadavericSide: "Right Side",
    cadavericDescription: "Dissection showing the brachial plexus in the right axillary region. The plexus arises from C5-T1 ventral rami, forms roots, trunks, divisions, cords, and terminal branches — the five major terminal nerves of the upper limb.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Brachial_plexus_color.svg/640px-Brachial_plexus_color.svg.png",
    cadavericAnnotations: [
      { label: "Lateral Cord", x: 28, y: 35 },
      { label: "Medial Cord", x: 72, y: 38 },
      { label: "Posterior Cord", x: 50, y: 28 },
      { label: "Musculocutaneous N.", x: 18, y: 55 },
      { label: "Median Nerve", x: 48, y: 55 },
      { label: "Ulnar Nerve", x: 75, y: 60 },
      { label: "Radial Nerve", x: 55, y: 75 },
      { label: "Axillary Artery", x: 50, y: 45 },
    ],
    crossSectionTitle: "Shoulder – MRI",
    crossSectionLevel: "Coronal",
    crossSectionDescription: "Coronal fat-saturated MRI of the shoulder showing the rotator cuff tendons, supraspinatus tendon passing under the subacromial arch, and the glenohumeral joint space.",
    ctNote: "CT shoulder: bone detail, fractures, AC joint separation. CT arthrogram: labral tears (inject contrast into joint).",
    mriNote: "MRI shoulder: investigation of choice for rotator cuff tears, labral tears (SLAP, Bankart), and bursitis. Fat saturation sequences highlight oedema and tears.",
    structures: [
      {
        id: "deltoid",
        name: "Deltoid Muscle",
        description: "The deltoid is a multipennate muscle covering the shoulder joint, giving the shoulder its rounded contour. It has three parts: anterior (clavicular), middle (acromial), and posterior (spinal).",
        clinicalPoints: [
          "Intramuscular injection site — middle deltoid is safe injection site (no major vessels/nerves if given in upper-outer quadrant)",
          "Axillary nerve palsy → deltoid paralysis → loss of shoulder abduction (0–90°), numbness over 'regimental badge'",
          "Deltoid wasting: sign of long-standing axillary nerve damage",
          "Action: Anterior = flexion/medial rotation; Middle = abduction; Posterior = extension/lateral rotation",
          "All three parts converge on deltoid tuberosity of humerus",
        ],
        studyNotes: "Deltoid: axillary nerve (C5,C6). Abducts arm 15–90°. Supraspinatus initiates first 15°. Above 90°, trapezius takes over. Deltoid nerve supply = same as teres minor (both from posterior cord via axillary nerve).",
        quiz: [
          {
            q: "The deltoid muscle is supplied by which nerve?",
            options: ["Radial nerve", "Axillary nerve", "Suprascapular nerve", "Musculocutaneous nerve"],
            correct: 1,
            explanation: "The deltoid is supplied by the axillary nerve (C5, C6), which arises from the posterior cord of the brachial plexus. It also supplies teres minor and gives the upper lateral cutaneous nerve of arm.",
          },
          {
            q: "Which is the safest quadrant for intramuscular injection in the deltoid?",
            options: ["Upper inner", "Upper outer", "Lower inner", "Lower outer"],
            correct: 1,
            explanation: "The upper outer quadrant of the deltoid is the safest IM injection site, avoiding the axillary nerve and posterior circumflex humeral vessels that lie in the lower portion.",
          },
        ],
        labels: [
          { id: "ant-deltoid", name: "Anterior Deltoid", pos: [-0.9, 0.5, 0.5], description: "Clavicular head. Flexion + medial rotation of shoulder." },
          { id: "mid-deltoid", name: "Middle Deltoid", pos: [-1.1, 0.0, 0.5], description: "Acromial head. Primary abductor (15°–90°). Site of IM injection." },
          { id: "post-deltoid", name: "Posterior Deltoid", pos: [-0.85, -0.4, 0.5], description: "Spinal head. Extension + lateral rotation of shoulder." },
          { id: "biceps", name: "Biceps Brachii", pos: [-0.55, -0.7, 0.5], description: "Two heads (short: coracoid, long: supraglenoid tubercle). Flexion + supination. Musculocutaneous nerve." },
          { id: "triceps", name: "Triceps Brachii", pos: [0.9, -0.2, 0.5], description: "Three heads. Elbow extension. Radial nerve. Long head from infraglenoid tubercle." },
        ],
      },
    ],
  },
  {
    id: "digestive",
    name: "Digestive System",
    color: "#22c55e",
    darkColor: "#14532d",
    modelCount: 69,
    icon: "🫃",
    cadavericTitle: "Abdominal Organs – Anterior View",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric dissection of the abdomen showing the gastrointestinal tract in situ. The greater omentum (apron of fat) has been reflected to reveal the stomach, transverse colon, and small intestines.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Digestive_system_diagram_en.svg/450px-Digestive_system_diagram_en.svg.png",
    cadavericAnnotations: [
      { label: "Oesophagus", x: 50, y: 12 },
      { label: "Stomach", x: 38, y: 32 },
      { label: "Liver", x: 70, y: 25 },
      { label: "Duodenum", x: 62, y: 42 },
      { label: "Jejunum", x: 45, y: 58 },
      { label: "Ascending Colon", x: 75, y: 62 },
      { label: "Sigmoid Colon", x: 42, y: 78 },
    ],
    crossSectionTitle: "Abdomen – CT Section",
    crossSectionLevel: "L1 Level",
    crossSectionDescription: "Axial CT at L1 level (portal venous phase) showing the liver, portal vein, IVC, aorta, and surrounding bowel. Portal venous phase (60–80s post-contrast) is optimal for liver parenchyma and bowel.",
    ctNote: "CT triple phase liver: arterial (HCC, hypervascular mets), portal venous (metastases, lymphoma), delayed (cholangiocarcinoma, haemangioma washout).",
    mriNote: "MRI liver: superior soft tissue contrast. MRCP (MR cholangiopancreatography) for biliary and pancreatic ducts — non-invasive alternative to ERCP for diagnosis.",
    structures: [
      {
        id: "stomach",
        name: "Stomach",
        description: "The stomach is a J-shaped muscular organ in the left upper quadrant, capable of expanding to hold ~1L. It has 4 regions: cardia, fundus, body, and pylorus (antrum → canal → sphincter).",
        clinicalPoints: [
          "Peptic ulcer disease: H. pylori (80% duodenal, 60% gastric ulcers) — urea breath test for diagnosis",
          "Gastric cancer: signet ring cells (poorly differentiated adenocarcinoma) — poor prognosis",
          "Virchow's node (left supraclavicular): gastric cancer metastasis",
          "Sister Mary Joseph nodule: umbilical metastasis from gastric (or pancreatic/ovarian) cancer",
          "Zollinger-Ellison syndrome: gastrinoma → hypersecretion → multiple peptic ulcers + diarrhoea",
          "Blood supply: Left gastric artery (coeliac trunk) supplies lesser curvature — bleeds from posterior duodenal ulcer → gastroduodenal artery",
        ],
        studyNotes: "Stomach blood supply mnemonic: Right side = Right gastric + Right gastroepiploic. Left side = Left gastric + Left gastroepiploic. All anastomose — rarely ischaemic. Pyloric sphincter: 2cm thick, palpable in pyloric stenosis (olive-shaped mass).",
        quiz: [
          {
            q: "A posterior duodenal ulcer is most likely to cause haemorrhage from which artery?",
            options: ["Left gastric artery", "Right gastric artery", "Gastroduodenal artery", "Superior mesenteric artery"],
            correct: 2,
            explanation: "A posterior duodenal ulcer erodes into the gastroduodenal artery (GDA) — the first branch of the common hepatic artery. This causes massive upper GI haemorrhage presenting as haematemesis and melaena.",
          },
          {
            q: "Which lymph node is classically associated with gastric carcinoma metastasis?",
            options: ["Epitrochlear node", "Virchow's node (left supraclavicular)", "Para-aortic node", "Axillary node"],
            correct: 1,
            explanation: "Virchow's node (Troisier's sign): left supraclavicular lymphadenopathy = metastasis from gastric (most common), pancreatic, or any intra-abdominal malignancy via the thoracic duct.",
          },
        ],
        labels: [
          { id: "fundus", name: "Fundus", pos: [-0.7, 0.75, 0.5], description: "Dome-shaped superior part of stomach. Contains swallowed air (gastric bubble on CXR/CT). Above the cardia." },
          { id: "body", name: "Body", pos: [-0.3, 0.2, 0.5], description: "Largest part. Contains rugae (mucosal folds) for distension." },
          { id: "antrum", name: "Pyloric Antrum", pos: [0.5, -0.1, 0.5], description: "Contains G-cells (gastrin), D-cells (somatostatin). Site of H. pylori ulcers and gastric carcinoma." },
          { id: "liver", name: "Liver", pos: [1.2, 0.6, 0.5], description: "Largest solid organ. Right lobe > left lobe. Dual blood supply: portal vein (75%) + hepatic artery (25%).", clinicalNote: "Liver span >14cm = hepatomegaly. Caudate lobe drains directly to IVC." },
          { id: "duodenum", name: "Duodenum", pos: [1.1, -0.3, 0.5], description: "C-shaped, retroperitoneal (except 1st part). 4 parts. Opens into jejunum at duodenojejunal flexure (ligament of Treitz, L2 level)." },
        ],
      },
    ],
  },
];

export function getSystem(id: string): AnatomySystem | undefined {
  return ANATOMY_SYSTEMS.find(s => s.id === id);
}

export function getStructure(systemId: string, structureId: string): AnatomyStructure | undefined {
  return getSystem(systemId)?.structures.find(s => s.id === structureId);
}
