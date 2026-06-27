// ─────────────────────────────────────────────────────────────────────────────
// Mission Distinction — Anatomy Data
// Covers all 10 body systems for MBBS 1st Year (Odisha University syllabus)
// ─────────────────────────────────────────────────────────────────────────────

export type QuizQuestion = {
  q: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
};

export type StructureLabel = {
  id: string;
  name: string;
  /** Latin anatomical name shown below the structure name in the OIIA card */
  latinName?: string;
  pos: [number, number, number];
  description: string;
  clinicalNote?: string;
  layer?: "bone" | "muscle" | "vessel" | "nerve" | "organ";
  /** Muscle origin — shown with red dot in OIIA card */
  origin?: string;
  /** Muscle insertion — shown with blue dot in OIIA card */
  insertion?: string;
  /** Nerve supply — shown with yellow dot in OIIA card */
  innervation?: string;
  /** Muscle action — shown with green dot in OIIA card */
  action?: string;
};

export type Mnemonic = {
  mnemonic: string;
  meaning: string;
  tip?: string;
};

export type AnatomyStructure = {
  id: string;
  name: string;
  description: string;
  clinicalPoints: string[];
  studyNotes: string;
  quiz: QuizQuestion[];
  labels: StructureLabel[];
  mnemonics?: Mnemonic[];
  relations?: string[];
  bloodSupply?: string;
  nerveSupply?: string;
  lymphDrainage?: string;
  origin?: string;
  insertion?: string;
  /** Nerve supply / innervation for this structure */
  innervation?: string;
  action?: string;
  /** Optional per-structure GLB override (takes precedence over system glbPath) */
  glbPath?: string;
  /** Which body regions this structure belongs to — used to filter cards per region tab */
  regions?: string[];
  /** Bold uppercase label shown on the catalog card (e.g. "SKULL", "BRAIN", "EYE") */
  cardLabel?: string;
  /** Subtitle shown below the card label (e.g. "Arteries & Veins", "Cranial Nerves") */
  cardSubtitle?: string;
  /** Emoji icon override for this structure's catalog card */
  icon?: string;
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
  cadavericAnnotations: { label: string; x: number; y: number }[];
  crossSectionTitle: string;
  crossSectionLevel: string;
  crossSectionDescription: string;
  ctNote: string;
  mriNote: string;
  sketchfabId?: string;
  /** Path to a GLB file in /public/models/ e.g. "/models/heart.glb" */
  glbPath?: string;
  /** Mesh-name → layer mapping overrides for this system's GLB */
  glbLayers?: Record<string, "bone" | "muscle" | "vessel" | "nerve" | "organ">;
};

export const ANATOMY_SYSTEMS: AnatomySystem[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. CARDIOVASCULAR
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "cardiovascular",
    name: "Cardiovascular System",
    color: "#ef4444",
    darkColor: "#7f1d1d",
    modelCount: 112,
    icon: "🫀",
    cadavericTitle: "Heart – Anterior View",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric dissection showing the anterior surface of the heart with great vessels. The right ventricle forms most of the anterior surface. Note the coronary sulcus separating atria from ventricles, and the anterior interventricular groove containing the LAD artery.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Heart_diagram-en.svg/640px-Heart_diagram-en.svg.png",
    cadavericAnnotations: [
      { label: "Aorta", x: 48, y: 10 }, { label: "Pulmonary Trunk", x: 32, y: 14 },
      { label: "Right Atrium", x: 72, y: 35 }, { label: "Left Atrium", x: 28, y: 28 },
      { label: "Right Ventricle", x: 62, y: 60 }, { label: "Left Ventricle", x: 38, y: 65 },
      { label: "Apex", x: 48, y: 82 },
    ],
    crossSectionTitle: "Thorax – CT at T5",
    crossSectionLevel: "T5",
    crossSectionDescription: "Axial CT section through the thorax at T5 level showing the four chambers, great vessels, and surrounding mediastinal structures.",
    ctNote: "CT angiography: coronary artery assessment. Requires IV contrast. Calcium score for CAD risk.",
    mriNote: "Cardiac MRI (CMR): gold standard for myocardial viability, cardiomyopathy, and congenital heart disease.",
    glbPath: "/models/heart.glb",
    glbLayers: {
      "right_atrium": "organ", "left_atrium": "organ",
      "right_ventricle": "organ", "left_ventricle": "organ",
      "pericardium": "organ", "epicardium": "organ", "myocardium": "organ",
      "aorta": "vessel", "ascending_aorta": "vessel", "aortic_arch": "vessel",
      "pulmonary_trunk": "vessel", "pulmonary_artery": "vessel",
      "svc": "vessel", "ivc": "vessel", "superior_vena_cava": "vessel", "inferior_vena_cava": "vessel",
      "coronary": "vessel", "lad": "vessel", "rca": "vessel", "lcx": "vessel",
      "cardiac_vein": "vessel", "coronary_sinus": "vessel",
    },
    structures: [
      {
        id: "left-ventricle",
        name: "Left Ventricle",
        regions: ["trunk"],
        cardLabel: "HEART",
        cardSubtitle: "External view",
        icon: "🫀",
        description: "The left ventricle (LV) is the most muscular chamber of the heart, with a wall thickness of 8–12 mm. It ejects oxygenated blood into the systemic circulation via the aorta. Its shape is ellipsoidal (not spherical) and contains the papillary muscles and chordae tendineae.",
        clinicalPoints: [
          "Wall thickness >12mm on echo → left ventricular hypertrophy (LVH): caused by hypertension, aortic stenosis",
          "LV ejection fraction (LVEF) <40% defines systolic heart failure (HFrEF)",
          "LV aneurysm: complication of anterior STEMI (LAD territory) — paradoxical bulge on systole",
          "Dressler's syndrome: pericarditis 2–10 weeks post-MI (autoimmune)",
          "LVEDP elevated in LV failure → back-pressure → pulmonary oedema",
          "Ventricular remodelling: LV dilates post-MI; ACE inhibitors prevent/reverse this",
        ],
        studyNotes: "LV wall is 3× thicker than RV. Receives blood from LA via mitral valve; outflow via aortic valve. Normal EF: 55–70%. LVEF is systolic function marker — not load independent.",
        quiz: [
          { q: "Which coronary artery supplies the anterior wall of the left ventricle?", options: ["Right coronary artery", "Left anterior descending (LAD)", "Left circumflex artery", "Posterior descending artery"], correct: 1, explanation: "The LAD (anterior interventricular artery) supplies the anterior wall of LV, anterior 2/3 of interventricular septum, and apex. Called the 'widow maker' for causing large anterior MIs." },
          { q: "Which valve separates the left atrium from the left ventricle?", options: ["Tricuspid valve", "Aortic valve", "Pulmonary valve", "Mitral (bicuspid) valve"], correct: 3, explanation: "The mitral valve (bicuspid) has two leaflets: anterior and posterior. Supported by two papillary muscles (anterolateral and posteromedial) via chordae tendineae. Rheumatic fever is the commonest cause of mitral stenosis." },
          { q: "Normal left ventricular ejection fraction (LVEF) is:", options: ["25–35%", "35–45%", "55–70%", "75–85%"], correct: 2, explanation: "Normal LVEF is 55–70%. LVEF <40% = HFrEF; 40–50% = HFmrEF; ≥50% = HFpEF." },
        ],
        labels: [
          { id: "lv-body", name: "Left Ventricle", pos: [-0.28, -0.15, 0.5], description: "Thick-walled (8–12mm) muscular chamber pumping oxygenated blood to systemic circulation via the aorta.", layer: "organ" },
          { id: "rv-body", name: "Right Ventricle", pos: [0.45, -0.22, 0.5], description: "Thin-walled (3–5mm) crescent-shaped chamber pumping deoxygenated blood to lungs via pulmonary trunk.", layer: "organ" },
          { id: "la-body", name: "Left Atrium", pos: [-0.35, 0.55, 0.5], description: "Receives oxygenated blood from 4 pulmonary veins and pumps it to the left ventricle via mitral valve.", layer: "organ" },
          { id: "ra-body", name: "Right Atrium", pos: [0.48, 0.48, 0.5], description: "Receives deoxygenated blood from SVC, IVC, and coronary sinus. SA node is in its upper posterior wall.", layer: "organ" },
          { id: "aorta", name: "Ascending Aorta", pos: [-0.05, 1.0, 0.5], description: "First part of aorta. Gives right and left coronary arteries from the aortic sinuses (sinuses of Valsalva).", clinicalNote: "Site of aortic root dilation in Marfan syndrome (>4cm = significant)", layer: "vessel" },
          { id: "pa", name: "Pulmonary Trunk", pos: [0.3, 0.9, 0.5], description: "Arises from the right ventricle, bifurcates into right and left pulmonary arteries at the angle of Louis (T4).", clinicalNote: "Saddle embolus at bifurcation = massive PE → haemodynamic compromise", layer: "vessel" },
        ],
        mnemonics: [
          { mnemonic: "LAD = Left Anterior Descending = Leaves A Dead man", meaning: "LAD occlusion is the 'widow maker' — causes massive anterior MI with worst prognosis", tip: "RCA → inferior MI (II, III, aVF); LCx → lateral MI (I, aVL, V5-6)" },
          { mnemonic: "CHADS2-VASc", meaning: "Cardiac failure, Hypertension, Age≥75(×2), Diabetes, Stroke(×2) - Vascular, Age65-74, Sex=female", tip: "Score ≥2 in males (≥3 in females) → anticoagulation for AF" },
        ],
        relations: [
          "Anterior: right ventricle (overlies most of LV anteriorly)",
          "Posterior: oesophagus and descending thoracic aorta",
          "Inferior: diaphragm (the apex — 5th ICS, MCL)",
          "Right: right atrium and IVC",
          "Left: left lung (cardiac notch), left phrenic nerve",
        ],
        bloodSupply: "LAD (dominant in 90%): anterior wall + septum. LCx: lateral wall. Posterior wall: PDA (from RCA in right-dominant circulation, 85%).",
        nerveSupply: "SA node: RCA branch (55%) or LCx (45%). AV node: RCA (90%). Cardiac plexus: T1–T5 sympathetics + vagus parasympathetics.",
      },
      {
        id: "head-vasculature",
        name: "Head & Neck Vasculature",
        regions: ["trunk"],
        cardLabel: "HEAD & NECK",
        cardSubtitle: "Arteries & Veins",
        icon: "🩸",
        description: "The head and neck receive their arterial supply primarily from the common carotid arteries (internal and external branches) and the vertebral arteries. The venous drainage is via the internal and external jugular veins. This rich vascular network supplies the brain, face, scalp, and neck structures.",
        clinicalPoints: [
          "Internal carotid artery (ICA): no branches in neck; enters carotid canal → cavernous sinus → gives ophthalmic, anterior choroidal, PComm, then divides into ACA + MCA",
          "External carotid artery (ECA): 8 branches — Superior Thyroid, Ascending pharyngeal, Lingual, Facial, Occipital, Posterior auricular, Superficial temporal, Maxillary (SALFOPSMM or 'Some Anatomists Like Freaking Out Poor Medical Students')",
          "Vertebral artery: branch of subclavian; ascends through C6-C1 transverse foramina → foramen magnum → joins contralateral to form basilar artery → gives PICA, AICA, SCA, then PCA",
          "Carotid sinus: at bifurcation of CCA — baroreceptors → CN IX (carotid sinus nerve) → nucleus tractus solitarius → regulate BP",
          "Carotid body: chemoreceptor (O2, CO2, pH) at bifurcation → CN IX → responds to hypoxia",
          "Circle of Willis: anastomotic ring — ACA + AComm + ICA + PComm + PCA; provides collateral flow; berry aneurysm at junctions (AComm most common)",
        ],
        studyNotes: "ECA branches mnemonic: 'Some Anatomists Like Freaking Out Poor Medical Students' — Superior thyroid, Ascending pharyngeal, Lingual, Facial, Occipital, Posterior auricular, Maxillary, Superficial temporal. Circle of Willis: complete in only ~20% — incomplete predisposes to ischaemic stroke if one vessel occludes.",
        quiz: [
          { q: "Which artery supplies the anterior 2/3 of brain in the territory most commonly affected by stroke?", options: ["Posterior cerebral artery", "Middle cerebral artery", "Anterior cerebral artery", "Basilar artery"], correct: 1, explanation: "The middle cerebral artery (MCA) supplies the lateral cortex — including primary motor and sensory cortex for the face and upper limb, Broca's area, and Wernicke's area. MCA stroke causes contralateral hemiplegia (arm > leg), hemisensory loss, and aphasia (dominant hemisphere)." },
          { q: "The vertebral arteries are branches of which vessels?", options: ["Common carotid arteries", "External carotid arteries", "Subclavian arteries", "Axillary arteries"], correct: 2, explanation: "Vertebral arteries arise as the first branch of the subclavian artery. They ascend through the transverse foramina of C6-C1, enter the skull through the foramen magnum, and unite to form the basilar artery at the pontomedullary junction." },
        ],
        labels: [
          { id: "ica", name: "Internal Carotid Artery", pos: [0.4, 0.2, 0.5], description: "No branches in neck. Enters skull via carotid canal in petrous temporal bone. Supplies brain and orbit.", clinicalNote: "Atherosclerosis at ICA origin = most common cause of embolic stroke", layer: "vessel" },
          { id: "eca", name: "External Carotid Artery", pos: [0.6, 0.1, 0.5], description: "Supplies face, scalp, mouth, and most head and neck structures. 8 named branches (SALFOPSM).", layer: "vessel" },
          { id: "vertebral", name: "Vertebral Artery", pos: [-0.3, -0.2, 0.5], description: "Branch of subclavian. Ascends through C6-C1 transverse foramina. Forms basilar artery at foramen magnum.", clinicalNote: "Vertebrobasilar insufficiency: dizziness, diplopia, dysphagia, dysarthria, drop attacks", layer: "vessel" },
          { id: "facial-a", name: "Facial Artery", pos: [0.7, 0.0, 0.7], description: "Branch of ECA. Passes over body of mandible at anterior border of masseter (palpable pulse). Supplies face.", layer: "vessel" },
          { id: "superficial-temporal", name: "Superficial Temporal Artery", pos: [0.9, 0.5, 0.4], description: "Terminal branch of ECA. Palpable in front of tragus. Temporal arteritis affects this vessel.", clinicalNote: "Giant cell (temporal) arteritis: >50yrs, headache, jaw claudication, ESR↑, risk of blindness", layer: "vessel" },
        ],
        relations: [
          "CCA bifurcates at C3/4 level (upper border of thyroid cartilage)",
          "ICA and ECA: ICA is postero-medial, ECA is antero-lateral initially",
          "IJV lies lateral to ICA/ECA in carotid sheath",
          "Vagus nerve (CN X) runs posterior within carotid sheath",
          "Sympathetic chain: behind carotid sheath, anterior to prevertebral fascia",
        ],
        bloodSupply: "Self — these are the supplying arteries of the head.",
        nerveSupply: "Carotid sinus/body: CN IX (glossopharyngeal). Vasomotor control via cervical sympathetic chain.",
      },
      {
        id: "coronary-arteries",
        name: "Coronary Arteries",
        regions: ["trunk"],
        cardLabel: "HEART",
        cardSubtitle: "Arteries",
        icon: "🫀",
        description: "The coronary arteries arise from the aortic sinuses (sinuses of Valsalva) just above the aortic valve cusps. They supply the myocardium during diastole when coronary perfusion pressure is highest.",
        clinicalPoints: [
          "LAD: anterior wall LV + anterior septum — most common site of MI ('widow maker')",
          "RCA: SA node (55%), AV node (90%), inferior wall LV, RV, posterior septum",
          "LCx: lateral and posterior wall of LV (in left-dominant systems)",
          "Right dominant circulation (85%): RCA gives posterior descending artery (PDA)",
          "Tachycardia reduces diastolic time → reduces coronary filling → ischaemia",
          "CABG: internal mammary artery (IMA) preferred conduit for LAD — 10-year patency 90%+",
        ],
        studyNotes: "Coronary arteries fill during DIASTOLE. This is why: diastolic pressure maintains coronary flow; aortic regurgitation (wide pulse pressure, low diastolic) reduces coronary perfusion. Prinzmetal angina: coronary vasospasm, ST elevation at rest, relieved by nitrates/CCB.",
        quiz: [
          { q: "The sinoatrial (SA) node is supplied by which artery in 55% of people?", options: ["Left anterior descending", "Left circumflex", "Right coronary artery", "Posterior descending artery"], correct: 2, explanation: "The SA nodal artery arises from the RCA in 55% and from the LCx in 45%. This is why inferior MI (RCA territory) can cause sinus bradycardia or SA node dysfunction." },
          { q: "In coronary artery anatomy, what does 'right dominant' mean?", options: ["Right coronary artery is larger", "RCA supplies the right ventricle", "RCA gives the posterior descending artery (PDA)", "RCA has more branches"], correct: 2, explanation: "Dominance in coronary anatomy refers to which artery gives the posterior descending artery (PDA). Right dominant (85%): RCA gives PDA. Left dominant (8%): LCx gives PDA. Co-dominant (7%): both contribute." },
        ],
        labels: [],
        mnemonics: [
          { mnemonic: "RCA = Right Coronary Artery → Right side of heart + AV node (90%) + SA node (55%)", meaning: "RCA territory: inferior (II,III,aVF), RV, SA + AV nodes → inferior MI often causes bradycardia", tip: "Atropine or temporary pacing for inferior MI with bradycardia" },
        ],
        relations: ["LAD descends in anterior interventricular groove", "LCx runs in coronary sulcus (AV groove) laterally", "RCA runs in right coronary sulcus, then posterior"],
        bloodSupply: "Self-supplied via ostia in aortic sinuses.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SKELETAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "skeletal",
    name: "Skeletal System",
    color: "#f59e0b",
    darkColor: "#78350f",
    modelCount: 126,
    icon: "💀",
    cadavericTitle: "Skull – Lateral View",
    cadavericSide: "Lateral",
    cadavericDescription: "Lateral view of the human skull showing the cranial bones, sutures, and foramina. The pterion (H-shaped junction of frontal, parietal, temporal, and sphenoid bones) is a vulnerable point — the middle meningeal artery lies deep to it.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gray188-en.svg/500px-Gray188-en.svg.png",
    cadavericAnnotations: [
      { label: "Frontal Bone", x: 25, y: 25 }, { label: "Parietal Bone", x: 55, y: 20 },
      { label: "Temporal Bone", x: 72, y: 45 }, { label: "Occipital Bone", x: 82, y: 35 },
      { label: "Zygomatic Arch", x: 68, y: 62 }, { label: "Mandible", x: 52, y: 78 },
      { label: "External Acoustic Meatus", x: 75, y: 55 },
    ],
    crossSectionTitle: "Skull Base – Axial CT",
    crossSectionLevel: "Base of Skull",
    crossSectionDescription: "Axial CT at the skull base showing the three cranial fossae (anterior, middle, posterior), foramina, and bony landmarks important for neurosurgery and ENT.",
    ctNote: "CT: investigation of choice for bone detail, fractures, calcification, and haematoma (blood hyperdense: 40–80 HU).",
    mriNote: "MRI: superior for soft tissue (brain, meninges, CSF, cranial nerves). T1: fat bright, CSF dark. T2: CSF bright.",
    structures: [
      {
        id: "skull",
        name: "Skull",
        glbPath: "/models/skull.glb",
        regions: ["head"],
        description: "The skull is a bony structure that forms the head in vertebrates, protecting the brain and supporting the face. It consists of 22 bones — 8 cranial bones forming the neurocranium (protecting the brain) and 14 facial bones forming the viscerocranium.",
        clinicalPoints: [
          "Pterion: H-shaped junction of frontal, parietal, temporal, and sphenoid bones — thinnest part of skull; middle meningeal artery lies deep to it; blow → extradural haematoma",
          "Fracture of petrous temporal bone → CSF otorrhoea, Battle's sign (bruising behind ear), haemotympanum",
          "Anterior cranial fossa fracture → CSF rhinorrhoea (cribriform plate), 'raccoon eyes' (periorbital ecchymosis), anosmia (olfactory nerve shear)",
          "Depressed skull fracture → risks dural tear, intracranial infection, focal neurological deficit",
          "Sagittal suture early fusion (scaphocephaly) → narrow elongated head; coronal craniosynostosis → plagiocephaly",
          "Fontanelles: anterior (bregma, closes 18 months); posterior (lambda, closes 3 months). Bulging = raised ICP; sunken = dehydration",
        ],
        studyNotes: "Cranial bones (8): Frontal (1), Parietal (2), Temporal (2), Occipital (1), Sphenoid (1), Ethmoid (1). Mnemonic: 'PEST OF 6' → Parietal×2, Ethmoid, Sphenoid, Temporal×2, Occipital, Frontal. Sutures: Coronal (frontal–parietal), Sagittal (parietal–parietal), Lambdoid (parietal–occipital), Squamosal (temporal–parietal).",
        quiz: [
          { q: "Which area of the skull is thinnest and overlies the middle meningeal artery?", options: ["Bregma", "Pterion", "Asterion", "Inion"], correct: 1, explanation: "The pterion is the H-shaped junction of the frontal, parietal, temporal, and sphenoid bones — the thinnest and weakest part of the skull. A blow here can rupture the anterior division of the middle meningeal artery, causing an extradural haematoma (lens-shaped on CT)." },
          { q: "A patient has CSF rhinorrhoea and periorbital haematomas after a head injury. Which cranial fossa is fractured?", options: ["Middle cranial fossa", "Posterior cranial fossa", "Anterior cranial fossa", "Petrous temporal"], correct: 2, explanation: "Anterior cranial fossa fractures involve the cribriform plate → CSF rhinorrhoea (CSF in nose). 'Raccoon eyes' (periorbital ecchymosis) result from blood tracking into the periorbital region. Posterior fossa → Battle's sign (mastoid bruising)." },
          { q: "At what age does the anterior fontanelle normally close?", options: ["3 months", "6 months", "12 months", "18 months"], correct: 3, explanation: "The anterior fontanelle (at the bregma — junction of coronal and sagittal sutures) normally closes by 18 months. The posterior fontanelle (at lambda) closes by 3 months. A bulging fontanelle suggests raised intracranial pressure; sunken = dehydration." },
        ],
        labels: [
          { id: "frontal-bone", name: "Frontal Bone", pos: [-0.05, 0.9, 0.7], description: "Forms the forehead and roof of the orbits. Contains the frontal sinuses. Unites with the parietal bones at the coronal suture.", layer: "bone" },
          { id: "parietal-bone", name: "Parietal Bone", pos: [0.75, 0.6, 0.1], description: "Paired bones forming the roof and sides of the skull. Separated by the sagittal suture in the midline.", layer: "bone" },
          { id: "temporal-bone", name: "Temporal Bone", pos: [1.05, 0.1, 0.1], description: "Contains the external acoustic meatus, middle ear, inner ear (cochlea and semicircular canals), and mastoid air cells. The petrous part forms part of the skull base.", clinicalNote: "Fracture → haemotympanum, Battle's sign, facial nerve palsy", layer: "bone" },
          { id: "occipital-bone", name: "Occipital Bone", pos: [0.0, 0.3, -1.0], description: "Forms the posterior and inferior cranial fossa. Contains the foramen magnum (transmits brainstem, vertebral arteries, accessory nerve). External occipital protuberance (inion) is a palpable landmark.", layer: "bone" },
          { id: "sphenoid", name: "Sphenoid Bone", pos: [0.7, 0.0, 0.4], description: "Butterfly-shaped bone at the skull base. Greater and lesser wings, sella turcica (houses pituitary), pterygoid plates, and numerous foramina (superior orbital fissure, foramen rotundum, foramen ovale).", layer: "bone" },
          { id: "zygomatic", name: "Zygomatic Bone", pos: [0.95, 0.0, 0.7], description: "Forms the cheekbone and part of the orbital wall. The zygomatic arch (with temporal bone) is a key facial landmark. 'Tripod' or 'malar' fracture = detachment at three sutures.", clinicalNote: "Malar fracture: flattened cheek, trismus, enophthalmos", layer: "bone" },
          { id: "mandible", name: "Mandible", pos: [0.0, -0.7, 0.8], description: "Only movable bone of the skull. Has a body, two rami, condylar processes (TMJ), and coronoid processes. Mental foramen: exit of mental nerve (V3). Inferior alveolar nerve runs within the mandibular canal.", clinicalNote: "Dental block targets inferior alveolar nerve at mandibular foramen", layer: "bone" },
          { id: "pterion", name: "Pterion", pos: [1.0, 0.35, 0.5], description: "H-shaped junction of 4 bones: frontal, parietal, temporal (squamous), and sphenoid (greater wing). Thinnest part of skull vault. Middle meningeal artery anterior division lies deep here.", clinicalNote: "Blow → extradural haematoma; lens-shaped (biconvex) on CT", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "PEST OF 6", meaning: "Parietal×2, Ethmoid, Sphenoid, Temporal×2, Occipital, Frontal — the 8 cranial bones", tip: "'PEST' = 4 distinct bones, 'OF' bridge, then Occipital + Frontal; pairs count as one each in the mnemonic" },
          { mnemonic: "Cranial fossae foramina: 'Oh, Osama Really Ousted Fanatic Jihadis Verily Heeding Salient Goals'", meaning: "Olfactory (cribriform), Optic canal, Superior orbital fissure, Foramen rotundum, Foramen ovale, Foramen spinosum, Jugular foramen, Vertebral artery (foramen magnum), Hypoglossal canal, Stylomastoid, Groove for sigmoid sinus", tip: "Follow the path from ACF → MCF → PCF" },
        ],
        relations: [
          "Superiorly: scalp (5 layers: Skin, subCutaneous tissue, Aponeurosis, loose connective tissue, Pericranium — SCALP)",
          "Inferiorly: dura mater, venous sinuses, then brain",
          "Anteriorly: orbital plates of frontal bone, ethmoid",
          "Posteriorly: external occipital protuberance, superior nuchal lines, trapezius and sternocleidomastoid attachments",
          "Laterally: temporalis muscle and fascia, pterion region, parotid gland and duct below zygomatic arch",
        ],
        bloodSupply: "Skull vault: middle meningeal artery (from maxillary a., branch of ECA) — grooves the inner table of temporal bone. Scalp: 5 arteries each side — STA (superficial temporal), OA (occipital), PA (posterior auricular), SuOA (supraorbital), SupraTrochlear — rich anastomosis so scalp lacerations bleed profusely.",
        nerveSupply: "Scalp sensory: V1 (ophthalmic — supraorbital, supratrochlear), V2 (zygomatic), V3 (auriculotemporal), C2 (greater occipital), C2/3 (lesser occipital, great auricular). No sensory nerves in bone itself.",
      },
      {
        id: "mandible-bone",
        name: "Mandible",
        regions: ["head"],
        cardLabel: "MANDIBLE",
        cardSubtitle: "",
        icon: "🦷",
        glbPath: "/models/mandible.glb",
        description: "The mandible is the only movable bone of the skull and the strongest bone of the face. It forms the lower jaw and holds the lower teeth. It consists of a body (horizontal part) and two rami (vertical parts) that articulate with the temporal bone at the temporomandibular joint (TMJ).",
        clinicalPoints: [
          "Inferior alveolar nerve (branch of V3) runs in the mandibular canal and exits at the mental foramen — targeted in dental blocks",
          "Condylar process articulates at TMJ — subcondylar fracture is the most common mandibular fracture",
          "Symphysis menti: midline fusion site; fracture here → bilateral posterior displacement of tongue → airway obstruction",
          "Mental foramen: at the level of 2nd premolar, halfway between upper and lower borders — marks exit of mental nerve (sensation to chin and lower lip)",
          "Le Fort fractures involve maxilla; isolated mandible fracture classified by site: condylar, subcondylar, coronoid, ramus, angle, body, symphysis, parasymphysis",
          "TMJ disorders: clicking, pain, limited mouth opening — common cause of facial pain",
        ],
        studyNotes: "Muscles of mastication (all CN V3 motor): Masseter (elevation), Temporalis (elevation + retraction), Medial pterygoid (elevation + protrusion), Lateral pterygoid (depression + protrusion, only muscle that opens mouth). 'My Teeth Meet Properly' mnemonic.",
        quiz: [
          { q: "Which nerve provides sensation to the chin and lower lip and exits at the mental foramen?", options: ["Inferior alveolar nerve", "Mental nerve", "Lingual nerve", "Buccal nerve"], correct: 1, explanation: "The mental nerve is the terminal branch of the inferior alveolar nerve (branch of V3). It exits through the mental foramen (at the level of the 2nd premolar) and supplies sensory innervation to the chin, lower lip, and adjacent skin." },
          { q: "The temporomandibular joint (TMJ) is formed between which bones?", options: ["Mandible and maxilla", "Mandible and zygomatic", "Condyle of mandible and mandibular fossa of temporal bone", "Mandible and sphenoid"], correct: 2, explanation: "The TMJ is formed between the condylar process (head) of the mandible and the mandibular fossa + articular tubercle of the temporal bone. It is a synovial joint with an intra-articular disc dividing it into upper (gliding) and lower (rotation) compartments." },
        ],
        labels: [
          { id: "body-mandible", name: "Body of Mandible", pos: [0.0, -0.5, 0.9], description: "Horizontal part. Contains mental symphysis (midline fusion), mental protuberance (chin), alveolar part (holds teeth).", layer: "bone" },
          { id: "ramus", name: "Ramus", pos: [0.7, 0.0, 0.6], description: "Vertical part. Connects body to condyle and coronoid process. Gives attachment to masseter (lateral) and medial pterygoid (medial).", layer: "bone" },
          { id: "condyle", name: "Condylar Process", pos: [0.7, 0.6, 0.3], description: "Articulates with temporal bone at TMJ. Has a head and neck. Subcondylar fractures are most common.", clinicalNote: "Fracture in children → growth disturbance → facial asymmetry", layer: "bone" },
          { id: "coronoid", name: "Coronoid Process", pos: [0.5, 0.5, 0.5], description: "Anterior projection above ramus. Gives attachment to temporalis muscle. Non-articular.", layer: "bone" },
          { id: "mental-foramen", name: "Mental Foramen", pos: [0.35, -0.4, 0.9], description: "Exit point of mental nerve and vessels (terminal of inferior alveolar). At level of 2nd premolar, midway between upper and lower borders.", clinicalNote: "Dental block: inferior alveolar nerve anaesthesia at mandibular foramen", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "My Teeth Meet Properly — Muscles of Mastication", meaning: "Masseter, Temporalis, Medial pterygoid, lateral Pterygoid — all V3 motor", tip: "Only the LATERAL pterygoid depresses/opens the jaw; all others elevate/close" },
        ],
        bloodSupply: "Inferior alveolar artery (from maxillary artery, branch of ECA) runs in mandibular canal. Mental artery exits at mental foramen. Facial artery crosses the lower border of mandible at anterior border of masseter (palpable pulse).",
        nerveSupply: "V3 (mandibular division of trigeminal): inferior alveolar nerve (teeth, chin), lingual nerve (tongue sensation), mental nerve (chin/lip), buccal nerve (cheek mucosa). Motor: all muscles of mastication via V3.",
      },
      {
        id: "humerus",
        name: "Humerus",
        regions: ["upper_limb"],
        description: "The humerus is the long bone of the arm, articulating with the scapula (glenoid) proximally and the radius and ulna distally at the elbow. The shaft is cylindrical in cross-section and contains the radial groove posteriorly for the radial nerve.",
        clinicalPoints: [
          "Surgical neck fracture → axillary nerve injury (paralysis of deltoid, loss of 'regimental badge' sensation)",
          "Midshaft fracture → radial nerve injury in radial groove (wrist drop, loss of finger/thumb extension)",
          "Supracondylar fracture (children) → anterior interosseous nerve (AIN) injury → loss of FPL + FDP index",
          "Medial epicondyle avulsion → ulnar nerve injury ('funny bone') → claw hand, Froment's sign",
          "Greater tubercle fracture → rotator cuff avulsion (supraspinatus, infraspinatus, teres minor)",
          "Surgical neck fracture most common in elderly with osteoporosis; midshaft in MVAs",
        ],
        studyNotes: "Rotator cuff mnemonic: SITS (Supraspinatus initiates abduction 0–15°; Infraspinatus + teres minor = lateral rotation; Subscapularis = medial rotation). Deltoid takes over 15–90°. Trapezius above 90°.",
        quiz: [
          { q: "A fracture of the surgical neck of the humerus is most likely to injure which nerve?", options: ["Radial nerve", "Ulnar nerve", "Axillary nerve", "Musculocutaneous nerve"], correct: 2, explanation: "The axillary nerve winds around the surgical neck of the humerus. Injury causes paralysis of deltoid (loss of abduction 15–90°) and loss of sensation over the lateral shoulder ('regimental badge' area)." },
          { q: "Which structure lies in the radial groove (spiral groove) of the humerus?", options: ["Brachial artery", "Radial nerve", "Ulnar nerve", "Median nerve"], correct: 1, explanation: "The radial nerve lies in the spiral (radial) groove on the posterior humerus mid-shaft. Midshaft fractures cause radial nerve palsy → wrist drop." },
          { q: "The greater tubercle of the humerus is the attachment for all EXCEPT:", options: ["Supraspinatus", "Infraspinatus", "Teres minor", "Subscapularis"], correct: 3, explanation: "Subscapularis attaches to the lesser tubercle. Greater tubercle: superior = supraspinatus, middle = infraspinatus, inferior = teres minor. Mnemonic: SIT on the greater tubercle; Sub on the lesser." },
        ],
        labels: [
          { id: "head", name: "Humeral Head", pos: [-0.1, 1.3, 0.5], description: "Articulates with glenoid cavity of scapula. 30° retroversion relative to shaft.", layer: "bone" },
          { id: "greater-tubercle", name: "Greater Tubercle", pos: [0.75, 1.0, 0.5], description: "Lateral projection. Attachment: supraspinatus (superior), infraspinatus (middle), teres minor (inferior).", clinicalNote: "Avulsion = suspected rotator cuff tear", layer: "bone" },
          { id: "lesser-tubercle", name: "Lesser Tubercle", pos: [-0.65, 1.0, 0.5], description: "Anterior projection. Attachment: subscapularis. Palpable when shoulder in external rotation.", layer: "bone" },
          { id: "surgical-neck", name: "Surgical Neck", pos: [0.8, 0.6, 0.5], description: "Narrow area below the tubercles. Common fracture site in osteoporotic elderly.", clinicalNote: "Axillary nerve runs here", layer: "bone" },
          { id: "radial-groove", name: "Radial Groove", pos: [0.8, -0.1, 0.5], description: "Spiral groove on posterior humerus for radial nerve and profunda brachii artery.", clinicalNote: "Midshaft # → wrist drop (radial nerve)", layer: "bone" },
          { id: "medial-epicondyle", name: "Medial Epicondyle", pos: [-0.7, -1.2, 0.5], description: "Origin of flexor-pronator mass. Ulnar nerve passes posterior to it in the cubital tunnel.", clinicalNote: "Avulsion in children; ulnar nerve palsy risk", layer: "bone" },
          { id: "lateral-epicondyle", name: "Lateral Epicondyle", pos: [0.7, -1.2, 0.5], description: "Origin of extensor-supinator muscles. Lateral epicondylitis (tennis elbow) = ECRB tendinopathy.", layer: "bone" },
          { id: "capitulum", name: "Capitulum", pos: [0.3, -1.5, 0.5], description: "Rounded articular surface for head of radius. Site of Panner disease in children.", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "SITS", meaning: "Supraspinatus, Infraspinatus, Teres minor, Subscapularis — the four rotator cuff muscles", tip: "SITS on the glenoid rim keeping the head in the socket" },
          { mnemonic: "My ARMS Do Reach (Medial/Axillary, Radial-midshaft, Medial epicondyle, Distal radial) — nerve injuries from humerus fractures top to bottom", meaning: "Surgical neck = Axillary nerve; Midshaft = Radial nerve; Medial epicondyle = Ulnar nerve; Supracondylar = AIN (branch of median)", tip: "Match the level of fracture to the nerve at risk" },
        ],
        relations: [
          "Proximal: deltoid (surrounds), axillary nerve (surgical neck), brachial plexus cords",
          "Anterior shaft: biceps brachii (short head + long head), brachialis",
          "Posterior shaft: radial nerve + profunda brachii in spiral groove, triceps",
          "Medial: ulnar nerve at medial epicondyle, brachial artery + median nerve at cubital fossa",
          "Lateral: radial nerve and ECRB/ECRL at lateral epicondyle",
        ],
        bloodSupply: "Anterior circumflex humeral artery (arcuate artery: main supply to humeral head) + posterior circumflex humeral artery (both from axillary artery). Shaft: profunda brachii (deep brachial artery).",
        nerveSupply: "Not a nerve organ — but muscles attached are: deltoid/teres minor (axillary C5,6), biceps/brachialis (musculocutaneous C5,6), triceps (radial C6,7,8), flexors (median C6–T1), extensors (radial C6–8).",
      },
      {
        id: "rib-cage",
        name: "Rib Cage",
        regions: ["trunk"],
        cardLabel: "TRUNK",
        cardSubtitle: "Bones",
        icon: "🦴",
        glbPath: "/models/sternum.glb",
        description: "The thoracic cage consists of 12 pairs of ribs, 12 thoracic vertebrae, and the sternum. Ribs 1–7 are true ribs (direct sternal attachment); ribs 8–10 are false ribs (attach via rib 7 cartilage); ribs 11–12 are floating ribs (no anterior attachment). The intercostal neurovascular bundle (VAN: vein, artery, nerve) runs in the costal groove on the inferior border of each rib.",
        clinicalPoints: [
          "Flail chest: ≥3 consecutive ribs broken in ≥2 places → paradoxical respiration (segment sucks in on inspiration)",
          "Rib 1 & 2 fractures indicate massive force — associated with aortic injury and brachial plexus damage",
          "Rib notching on CXR (inferior rib borders): coarctation of aorta — collateral flow via intercostal arteries erodes ribs",
          "Cervical rib (from C7): compresses lower brachial plexus (T1 root) or subclavian artery → thoracic outlet syndrome",
          "Costochondritis (Tietze's syndrome): tender swelling at costal cartilage junction — reproduces chest pain on palpation, distinguishing from cardiac cause",
          "Sternal fracture: seatbelt injury; always perform ECG + troponin to exclude blunt cardiac injury",
        ],
        studyNotes: "VAN rule: neurovascular bundle runs Vein–Artery–Nerve from superior to inferior in the costal groove. Insert chest drain / thoracocentesis needle OVER the upper border of the rib below to avoid VAN. Safe triangle for chest drain: 4th–5th ICS, mid-axillary line, anterior to latissimus dorsi.",
        quiz: [
          { q: "When performing thoracocentesis, where should the needle enter relative to the rib?", options: ["Below the upper rib (superior margin)", "Over the upper border of the lower rib", "Through the middle of the intercostal space", "Below the lower rib (inferior margin)"], correct: 1, explanation: "Insert over the upper border of the lower rib to avoid the VAN bundle (Vein, Artery, Nerve) that lies in the costal groove on the inferior aspect of each rib." },
          { q: "Which ribs are classified as floating ribs?", options: ["1–7", "8–10", "11–12", "7–10"], correct: 2, explanation: "Ribs 11 and 12 are floating (vertebral) ribs — no anterior attachment. Ribs 1–7: true ribs (direct costal cartilage to sternum). Ribs 8–10: false ribs (share costal cartilage of rib 7)." },
          { q: "Rib notching on a chest X-ray is a classic sign of:", options: ["Pulmonary hypertension", "Coarctation of the aorta", "Marfan syndrome", "Rheumatoid arthritis"], correct: 1, explanation: "In coarctation of the aorta, collateral blood flows via the intercostal arteries (which enlarge), eroding the inferior borders of ribs 3–8. This produces the classic 'rib notching' on CXR (bilateral, posterior, ribs 3–8)." },
        ],
        labels: [
          { id: "manubrium", name: "Manubrium", pos: [0.0, 1.1, 0.9], description: "Superior part of sternum. Sternal angle (angle of Louis) = manubrio-sternal junction = T4 level = carina, aortic arch, 2nd rib.", layer: "bone" },
          { id: "true-ribs", name: "True Ribs (1–7)", pos: [0.8, 0.6, 0.4], description: "Directly attached to sternum via individual costal cartilage. Rib 1 articulates with manubrium.", layer: "bone" },
          { id: "false-ribs", name: "False Ribs (8–10)", pos: [0.9, -0.1, 0.3], description: "Attach to sternum indirectly via the cartilage of rib 7.", layer: "bone" },
          { id: "floating-ribs", name: "Floating Ribs (11–12)", pos: [0.85, -0.8, 0.1], description: "No anterior attachment. Posterior attachment only to T11–T12 vertebrae.", layer: "bone" },
          { id: "xiphisternum", name: "Xiphisternum", pos: [0.0, -0.2, 0.9], description: "Inferior part of sternum. Ossifies ~40 years. T9 level. Origin of diaphragm.", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "VAN — Vein, Artery, Nerve (superior to inferior in costal groove)", meaning: "Order of intercostal neurovascular bundle under each rib", tip: "Go OVER the upper border of the rib below — 'V-A-N runs away from you if you go below'" },
          { mnemonic: "True 7, False 3, Floating 2", meaning: "7 true ribs (1–7), 3 false ribs (8–10), 2 floating ribs (11–12)", tip: "Total = 12 pairs. All attach posteriorly to thoracic vertebrae." },
        ],
        relations: [
          "Superiorly: thoracic inlet — trachea, oesophagus, subclavian vessels, brachial plexus roots",
          "Inferiorly: diaphragm (muscular dome, T8/T10/T12 openings for IVC/oesophagus/aorta)",
          "Internal: parietal pleura lines thoracic wall; visceral pleura covers lung surface",
          "Intercostal spaces: external, internal, innermost intercostal muscles + VAN bundle",
        ],
        bloodSupply: "Posterior intercostal arteries (branches of thoracic aorta, T3–T11); anterior intercostal arteries (internal thoracic artery). Internal thoracic → superior epigastric → inferior epigastric (continuous anterior chain).",
        nerveSupply: "Intercostal nerves T1–T11 (anterior rami of thoracic spinal nerves) in costal grooves. Dermatomal levels: T4 = nipple; T10 = umbilicus.",
      },
      {
        id: "vertebral-column",
        name: "Vertebral Column",
        regions: ["trunk"],
        cardLabel: "VERTEBRAL COLUMN",
        icon: "🦴",
        glbPath: "/models/sacrum.glb",
        description: "The vertebral column consists of 33 vertebrae: 7 cervical, 12 thoracic, 5 lumbar, 5 fused sacral (sacrum), and 4 coccygeal. Primary curvatures (kyphosis): thoracic + sacral (concave anteriorly — present at birth). Secondary curvatures (lordosis): cervical + lumbar (convex anteriorly — develop after birth with head control and walking).",
        clinicalPoints: [
          "Lumbar disc prolapse: L4-L5 most common (L5 root: great toe extension via EHL, dorsum of foot sensation); L5-S1 (S1: plantar flexion via gastrocnemius, absent ankle reflex, lateral foot sensation)",
          "Spinal stenosis: degenerative narrowing → neurogenic claudication (bilateral leg pain on walking, relieved by forward flexion/sitting)",
          "Cauda equina syndrome: bilateral root compression (L2-S5) → saddle anaesthesia, urinary retention, faecal incontinence — surgical emergency",
          "Vertebral compression fracture: osteoporotic, wedge-shaped, T12-L1 junction most common → acute kyphosis",
          "Scoliosis: lateral curvature >10°; idiopathic (80%, adolescent girls); structural vs postural; Adam's forward bend test reveals rib hump",
          "Ankylosing spondylitis: HLA-B27 (90%+); sacroiliitis → ascending bamboo spine; Schober test <5 cm increase; uveitis + aortic regurgitation",
        ],
        studyNotes: "Vertebral level landmarks: C6 = cricoid cartilage + larynx begins; T4 = sternal angle + carina + aortic arch; T10 = oesophageal hiatus; T12 = aortic hiatus; L1 = transpyloric plane; L4 = iliac crest + aortic bifurcation; S2 = end of subarachnoid space (LP safe at L3-4 or L4-5, below conus medullaris at L1-2).",
        quiz: [
          { q: "Lumbar puncture is performed between which vertebral levels to safely avoid the spinal cord?", options: ["T12–L1", "L1–L2", "L3–L4 or L4–L5", "L5–S1"], correct: 2, explanation: "The spinal cord (conus medullaris) ends at L1–L2. The subarachnoid space extends to S2. LP at L3–4 or L4–5 enters the subarachnoid space below the cord — only cauda equina nerve roots are present, which are pushed aside rather than pierced." },
          { q: "A patient with L5 nerve root compression will most likely show:", options: ["Absent ankle jerk reflex", "Weakness of plantar flexion", "Weakness of great toe extension", "Medial calf numbness"], correct: 2, explanation: "L5 root: extensor hallucis longus (great toe extension, MOST specific), dorsiflexion (tibialis anterior, L4+L5 overlap), sensation on dorsum of foot. No single reflex is L5-specific (ankle reflex = S1; knee jerk = L3-4)." },
          { q: "The aorta bifurcates into common iliac arteries at which vertebral level?", options: ["L1", "L2", "L4", "L5"], correct: 2, explanation: "The aorta bifurcates at L4 (approximately at the level of the iliac crest — used for LP landmark). Clinically, a pulsatile midline abdominal mass that bifurcates at L4 = AAA until proven otherwise." },
        ],
        labels: [
          { id: "cervical", name: "Cervical (C1–C7)", pos: [0.0, 1.8, 0.0], description: "7 vertebrae. C1 (atlas) — ring bone, no body, rotates with skull. C2 (axis) — dens/odontoid process. C7 — vertebra prominens (longest spinous process, palpable). Cervical lordosis.", layer: "bone" },
          { id: "thoracic", name: "Thoracic (T1–T12)", pos: [0.0, 0.5, 0.0], description: "12 vertebrae. Articulate with ribs via costovertebral joints. Heart-shaped bodies. Thoracic kyphosis.", layer: "bone" },
          { id: "lumbar", name: "Lumbar (L1–L5)", pos: [0.0, -0.8, 0.0], description: "5 largest vertebrae (bear most axial load). Kidney-shaped bodies. Lumbar lordosis. L4-5 most common disc prolapse.", layer: "bone" },
          { id: "sacrum", name: "Sacrum (S1–S5)", pos: [0.0, -1.6, 0.0], description: "5 fused vertebrae. Articulates with L5 above, ilium laterally (SI joints). Sacral canal: cauda equina. Subarachnoid space ends at S2.", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "7 Cervical, 12 Thoracic, 5 Lumbar (C7H12L5 — like a padlock combination)", meaning: "Vertebral column segments: 7-12-5, then sacrum (5 fused) + coccyx (4 fused) = 33 total", tip: "Curvatures: primary = thoracic + sacral (kyphosis); secondary = cervical + lumbar (lordosis — develop postnatally)" },
          { mnemonic: "I 2 Leave School At 4: Intercostal (T2), Lateral cutaneous (T4) — dermatomal landmarks", meaning: "T4 = nipple; T10 = umbilicus; T12 = inguinal ligament", tip: "Shingles (herpes zoster) follows dermatomal distribution — rash does not cross midline" },
        ],
        relations: [
          "Anteriorly: prevertebral fascia, cervical viscera (C), thoracic aorta/oesophagus (T), abdominal aorta/IVC (L)",
          "Posteriorly: erector spinae, multifidus, semispinalis",
          "Spinal cord: cervical and thoracic. Conus medullaris at L1–L2. Cauda equina: L2–S5 roots in subarachnoid space",
          "IVDs (intervertebral discs): nucleus pulposus (gelatinous centre) + annulus fibrosus (fibrocartilage rings); posterolateral herniation most common",
        ],
        bloodSupply: "Segmental arteries (posterior intercostal + lumbar from aorta). Spinal cord: anterior spinal artery (1 vessel from vertebrals) + 2 posterior spinal arteries. Artery of Adamkiewicz (T9–T12, left 80%): largest radicular feeder to lower cord — at risk in thoracoabdominal aortic aneurysm repair.",
        nerveSupply: "Sinuvertebral nerve (recurrent meningeal branch of spinal nerve): innervates posterior annulus fibrosus, PLL, periosteum — source of discogenic back pain. Facet joints: medial branches of posterior rami.",
      },
      {
        id: "pelvis-bones",
        name: "Pelvis",
        regions: ["trunk"],
        cardLabel: "PELVIS",
        icon: "🦴",
        description: "The bony pelvis consists of two hip bones (os coxae: ilium + ischium + pubis fused at the triradiate cartilage by ~16 years) joined to the sacrum. Divided into greater pelvis (false pelvis, above pelvic brim) and lesser pelvis (true pelvis, below pelvic brim). Pelvic inlet (brim): promontory of sacrum → arcuate line → pubic symphysis.",
        clinicalPoints: [
          "Female gynecoid pelvis: wide round inlet, sub-pubic angle >90°, allows vaginal delivery — vs android (male-type, angle <70°, obstructed labour risk)",
          "Pelvic fractures: high-energy; open book injury (symphysis pubis diastasis) → massive haemorrhage from presacral venous plexus",
          "Urethral injury in pelvic fracture: blood at meatus = do NOT catheterise — perform retrograde urethrogram, then suprapubic catheter",
          "Acetabular fracture: Judet-Letournel classification; CT essential; risk of post-traumatic OA and sciatic nerve injury",
          "Obstetric conjugate: S1 promontory to posterior superior pubic symphysis = minimum 10 cm for vaginal delivery",
          "Hip dislocation: posterior (90%) — limb in flexion, adduction, internal rotation; associated sciatic nerve injury",
        ],
        studyNotes: "Contents of the TRUE pelvis (below pelvic brim): bladder, uterus/prostate, rectum, pelvic vessels and nerves. Internal iliac artery divides into anterior (obturator, inferior vesical, uterine, internal pudendal) and posterior (superior gluteal, lateral sacral, iliolumbar) divisions. Pudendal nerve (S2,3,4) exits via greater sciatic foramen, re-enters via lesser foramen.",
        quiz: [
          { q: "Blood at the urethral meatus after pelvic trauma indicates:", options: ["Bladder rupture", "Rectal injury", "Urethral injury — do NOT catheterise", "Scrotal haematoma only"], correct: 2, explanation: "Blood at the urethral meatus is a sign of urethral injury. Blind urethral catheterisation can convert a partial tear into a complete one. Perform a retrograde urethrogram first; if confirmed, insert a suprapubic catheter." },
          { q: "The sub-pubic angle is widest in which pelvic type?", options: ["Android", "Anthropoid", "Platypelloid", "Gynecoid"], correct: 3, explanation: "Gynecoid pelvis (commonest female type): wide round inlet, sub-pubic angle >90°, transverse diameter > AP diameter. Favourable for vaginal delivery. Android (male-type): narrow, heart-shaped, angle <70° — most common cause of obstructed labour." },
        ],
        labels: [
          { id: "ilium", name: "Ilium", pos: [0.8, 0.5, 0.0], description: "Superior 2/5 of acetabulum. Iliac crest = L4 level. ASIS: attachment of inguinal ligament + sartorius. PSIS: dimples of Venus, S2 level.", layer: "bone" },
          { id: "ischium", name: "Ischium", pos: [0.7, -0.5, -0.1], description: "Posterior-inferior 2/5 of acetabulum. Ischial tuberosity: weight-bearing in sitting; hamstring origin. Ischial spine: sacrospinous ligament; pudendal nerve landmark.", layer: "bone" },
          { id: "pubis", name: "Pubis", pos: [0.3, -0.2, 0.8], description: "Anterior 1/5 of acetabulum. Pubic symphysis: secondary cartilaginous joint; widens in pregnancy. Pubic tubercle: attachment of inguinal ligament medially.", layer: "bone" },
          { id: "sacrum-pelvis", name: "Sacrum", pos: [0.0, 0.0, -0.9], description: "Fused S1–S5 vertebrae. S1 promontory = posterior limit of pelvic inlet. Sacroiliac joints: strongest in body (interlocking surfaces + powerful ligaments).", layer: "bone" },
        ],
        mnemonics: [
          { mnemonic: "IIP — Ilium, Ischium, Pubis fuse at the acetabulum", meaning: "Three bones of hip fuse at triradiate cartilage by ~16 years. Proportions: Ilium 2/5, Ischium 2/5, Pubis 1/5 of acetabulum.", tip: "'I Sit in Puberty' — Ilium (top), Ischium (sit on), Pubis (front)" },
          { mnemonic: "S2,3,4 keeps the erection off the floor (pelvic splanchnic nerves)", meaning: "Pelvic parasympathetics arise from S2, S3, S4 anterior rami — motor to detrusor, erectile tissue, distal bowel", tip: "Same nerve roots as pudendal (S2,3,4) — sensory to perineum, motor to external sphincters" },
        ],
        relations: [
          "Anteriorly: pubic symphysis, bladder/urethra, prostate (male) or uterus/vagina (female)",
          "Posteriorly: sacrum, coccyx, rectum and anal canal",
          "Laterally: hip joints (femoral head in acetabulum)",
          "Floor: pelvic diaphragm — levator ani (pubococcygeus, iliococcygeus, puborectalis) + coccygeus",
        ],
        bloodSupply: "Internal iliac artery (hypogastric). Anterior division: superior + inferior vesical, uterine/deferential, middle rectal, obturator, internal pudendal. Posterior division: iliolumbar, lateral sacral, superior gluteal.",
        nerveSupply: "Lumbosacral plexus (L1–S4). Pudendal nerve (S2,3,4): perineum + external sphincters. Pelvic splanchnics (S2,3,4): parasympathetics to bladder (detrusor), rectum, erectile tissue. Presacral nerve (superior hypogastric plexus): sympathetics.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. NERVOUS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "nervous",
    name: "Nervous System",
    color: "#a855f7",
    darkColor: "#3b0764",
    modelCount: 98,
    icon: "🧠",
    cadavericTitle: "Brain – Superolateral View",
    cadavericSide: "Superolateral",
    cadavericDescription: "Cadaveric specimen of the brain showing gyri and sulci of the cerebral cortex, lateral sulcus (Sylvian fissure) separating temporal from frontal/parietal lobes, and the central sulcus (Rolandic fissure).",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-brzegi-half.jpg/500px-24701-brzegi-half.jpg",
    cadavericAnnotations: [
      { label: "Frontal Lobe", x: 25, y: 35 }, { label: "Central Sulcus", x: 48, y: 22 },
      { label: "Parietal Lobe", x: 62, y: 28 }, { label: "Occipital Lobe", x: 82, y: 38 },
      { label: "Temporal Lobe", x: 38, y: 65 }, { label: "Lateral Sulcus", x: 50, y: 55 },
      { label: "Cerebellum", x: 72, y: 72 },
    ],
    crossSectionTitle: "Brain – Axial MRI at Basal Ganglia",
    crossSectionLevel: "Basal Ganglia Level",
    crossSectionDescription: "T2-weighted MRI axial section at the level of basal ganglia showing caudate, putamen, globus pallidus, internal capsule, thalamus, and surrounding structures.",
    ctNote: "Non-contrast CT: blood is hyperdense (white). Choice for acute stroke (haemorrhagic), head trauma, hydrocephalus.",
    mriNote: "MRI: T1 good anatomy, T2 shows oedema/infarction (bright). DWI for acute ischaemic stroke. FLAIR suppresses CSF signal.",
    structures: [
      {
        id: "cerebral-cortex",
        name: "Cerebral Cortex",
        regions: ["head"],
        cardLabel: "BRAIN",
        cardSubtitle: "Cerebral Cortex",
        icon: "🧠",
        description: "The cerebral cortex is the outer layer of grey matter (1.5–4 mm thick) containing billions of neurons arranged in 6 layers (neocortex). It is folded into gyri (ridges) and sulci (grooves) to increase surface area to ~2500cm².",
        clinicalPoints: [
          "Broca's area (44, 45): inferior frontal gyrus, dominant hemisphere → expressive/motor aphasia if damaged",
          "Wernicke's area (22): superior temporal gyrus → receptive/sensory aphasia (fluent but nonsensical)",
          "Motor cortex: precentral gyrus — homunculus inverted with leg medial (parasagittal), face lateral",
          "Visual cortex (area 17): occipital lobe — calcarine sulcus; damage → contralateral hemianopia with macular sparing",
          "Middle cerebral artery territory: face + arm area → contralateral face + arm weakness (common ischaemic stroke)",
          "ACA territory: leg area (parasagittal) → contralateral leg weakness; urinary incontinence",
        ],
        studyNotes: "Brodmann areas for MCQs: 4 (primary motor), 3,1,2 (somatosensory), 17 (primary visual), 41,42 (primary auditory), 44,45 (Broca's), 22 (Wernicke's). DLPFC (area 46): working memory, executive function. Damage = frontal lobe syndrome.",
        quiz: [
          { q: "A patient has difficulty understanding speech but can speak fluently (though nonsensically). Which area is damaged?", options: ["Broca's area", "Wernicke's area", "Motor cortex", "Prefrontal cortex"], correct: 1, explanation: "Wernicke's aphasia: fluent speech but poor comprehension. Lesion in Wernicke's area (area 22, posterior superior temporal gyrus). Broca's aphasia = non-fluent (effortful) speech with intact comprehension." },
          { q: "The primary motor cortex is located in which gyrus?", options: ["Postcentral gyrus", "Superior frontal gyrus", "Precentral gyrus", "Angular gyrus"], correct: 2, explanation: "Primary motor cortex (Brodmann area 4) = precentral gyrus. Homunculus is inverted: toes/foot medially (parasagittal), arm in middle, face laterally." },
        ],
        labels: [
          { id: "frontal", name: "Frontal Lobe", pos: [-0.1, 0.45, 1.05], description: "Executive function, voluntary movement (precentral gyrus, area 4), Broca's area (44,45), personality.", layer: "organ" },
          { id: "parietal", name: "Parietal Lobe", pos: [0.0, 0.9, 0.3], description: "Somatosensory cortex (postcentral gyrus, areas 3,1,2), spatial awareness, reading comprehension, constructional praxis.", layer: "organ" },
          { id: "temporal", name: "Temporal Lobe", pos: [-1.05, 0.05, 0.2], description: "Auditory cortex (41,42), Wernicke's area (22, dominant), memory (hippocampus), emotion (amygdala).", layer: "organ" },
          { id: "occipital", name: "Occipital Lobe", pos: [0.0, 0.35, -1.05], description: "Primary visual cortex (area 17, calcarine sulcus). Lesion → contralateral homonymous hemianopia with macular sparing.", layer: "organ" },
          { id: "cerebellum", name: "Cerebellum", pos: [0.0, -0.9, -0.7], description: "Coordination, balance, fine motor movements, motor learning. 3 lobes: anterior, posterior, flocculonodular.", layer: "organ" },
          { id: "brainstem", name: "Brainstem", pos: [0.0, -1.15, -0.1], description: "Midbrain, Pons, Medulla. Contains cranial nerve nuclei (III–XII). Vital centres (respiratory, cardiovascular, vomiting).", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "DASHED", meaning: "Dysdiadochokinesis, Ataxia, Slurred speech (dysarthria), Hypotonia, Eye nystagmus, Dysmetria — cerebellar signs", tip: "All ipsilateral to lesion (cerebellum has already decussated)" },
          { mnemonic: "Some Say Marry Money But My Brother Says Big Brains Matter Most", meaning: "Brodmann areas: Somatosensory=3,1,2; Motor=4; Broca=44,45; Auditory=41,42; Visual=17; Wernicke=22", tip: "First letter of each word maps to areas in order" },
        ],
        relations: [
          "Frontal lobe: anterior cranial fossa, olfactory bulb and tract on inferior surface",
          "Temporal lobe: middle cranial fossa, parahippocampal gyrus, uncus (can herniate through tentorium)",
          "Cerebellum: posterior cranial fossa, separated from cerebrum by tentorium cerebelli",
          "Brainstem: continues as spinal cord at foramen magnum",
          "Meninges: dura, arachnoid, pia — CSF in subarachnoid space",
        ],
        bloodSupply: "Internal carotid → MCA (largest: lateral cortex, capsule) + ACA (medial: frontal/parietal leg area). Vertebral → Basilar → PCA (occipital, thalamus, midbrain). Circle of Willis connects all.",
        nerveSupply: "Not innervated (no nociceptors in brain parenchyma — no headache from brain itself). Meninges, blood vessels, and cranial nerves are pain-sensitive.",
      },
      {
        id: "cranial-nerves",
        name: "Cranial Nerves",
        regions: ["head"],
        cardLabel: "HEAD",
        cardSubtitle: "Cranial Nerves",
        icon: "⚡",
        description: "The 12 pairs of cranial nerves arise from the brain and brainstem and supply the head, neck, and thoracoabdominal viscera. They are numbered I–XII in craniocaudal order of their origin. Each may be sensory, motor, or both, and may carry somatic and/or autonomic fibres.",
        clinicalPoints: [
          "CN I (Olfactory): sensory only — anosmia from cribriform plate fracture or viral infection (COVID-19)",
          "CN II (Optic): sensory only — papilloedema (raised ICP), optic neuritis (MS), visual field defects map to the lesion site",
          "CN III (Oculomotor): motor (SR, MR, IR, IO, LPS) + parasympathetic (pupil constriction, accommodation) — palsy: 'down and out' eye + dilated pupil (posterior communicating artery aneurysm)",
          "CN V (Trigeminal): largest cranial nerve — 3 divisions V1 (ophthalmic), V2 (maxillary), V3 (mandibular, only motor); trigeminal neuralgia = lancinating unilateral facial pain",
          "CN VII (Facial): UMN palsy (stroke) spares forehead; LMN palsy (Bell's) = complete ipsilateral facial weakness including forehead",
          "CN VIII (Vestibulocochlear): sensorineural hearing loss (cochlear); vestibular = nystagmus, vertigo; acoustic neuroma at CP angle",
          "CN X (Vagus): longest cranial nerve; most important parasympathetic nerve; recurrent laryngeal nerve palsy → hoarse voice",
          "CN XII (Hypoglossal): tongue motor — palsy → tongue deviates TOWARD the lesion side",
        ],
        studyNotes: "Cranial nerve types mnemonic: 'Some Say Marry Money But My Brother Says Big Brains Matter Most' — S=Sensory, M=Motor, B=Both. CNXI−XII always motor. Parasympathetic: CN III, VII, IX, X ('the dirty 4'). For exam: always know clinical deficits of each nerve.",
        quiz: [
          { q: "A patient with a posterior communicating artery aneurysm presents with a dilated pupil and 'down and out' eye. Which cranial nerve is compressed?", options: ["CN IV", "CN VI", "CN III", "CN II"], correct: 2, explanation: "CN III (oculomotor nerve) carries parasympathetic fibres on its outer surface (pupillary constriction). External compression (e.g., PCom aneurysm, uncal herniation) affects parasympathetics first → dilated pupil + complete CN III palsy ('down and out' due to unopposed SO/LR). This is a surgical emergency." },
          { q: "Bell's palsy (LMN CN VII palsy) differs from a cortical (UMN) lesion because:", options: ["Bell's causes taste loss", "Bell's spares the forehead", "UMN lesion causes complete ipsilateral weakness", "Bell's causes complete ipsilateral facial weakness including forehead"], correct: 3, explanation: "In LMN (Bell's) palsy, ALL ipsilateral facial muscles are affected including the forehead. In UMN (cortical/subcortical) lesion, the upper face (forehead) is SPARED because the upper facial nucleus receives bilateral cortical innervation. Bell's also affects taste (chorda tympani, CN VII) and stapedius (hyperacusis)." },
        ],
        labels: [
          { id: "cn1", name: "CN I — Olfactory", pos: [0.0, 1.1, 0.7], description: "Smell. 20 bundles through cribriform plate. Only CN that doesn't relay in thalamus first (goes directly to olfactory cortex).", layer: "nerve" },
          { id: "cn2", name: "CN II — Optic", pos: [-0.1, 0.7, 1.0], description: "Vision. Optic chiasm: nasal fibres cross, temporal fibres stay. Lesions map to specific visual field defects.", clinicalNote: "Papilloedema = raised ICP; optic neuritis = MS; RAPD = afferent pupil defect", layer: "nerve" },
          { id: "cn3", name: "CN III — Oculomotor", pos: [0.2, 0.3, 0.8], description: "Moves eye (SR, MR, IR, IO); elevates eyelid (LPS); pupil constriction + accommodation (parasympathetic).", clinicalNote: "Complete palsy: ptosis, dilated pupil, eye deviated down and out", layer: "nerve" },
          { id: "cn5", name: "CN V — Trigeminal", pos: [0.6, 0.2, 0.5], description: "Largest cranial nerve. V1: forehead/orbit; V2: cheek/upper lip; V3: jaw/tongue (motor to mastication).", clinicalNote: "Trigeminal neuralgia: lancinating pain in V2/V3 territory", layer: "nerve" },
          { id: "cn7", name: "CN VII — Facial", pos: [0.8, -0.1, 0.3], description: "Motor: all muscles of facial expression. Sensory: taste (anterior 2/3 tongue via chorda tympani). Parasympathetic: lacrimal, submandibular, sublingual glands.", clinicalNote: "Bell's palsy: LMN lesion → complete ipsilateral facial weakness", layer: "nerve" },
          { id: "cn10", name: "CN X — Vagus", pos: [0.3, -0.5, 0.2], description: "Longest CN. Motor: pharynx, larynx, soft palate. Parasympathetic: heart, lungs, GI to splenic flexure. Sensory: larynx, pharynx, thoracoabdominal viscera.", clinicalNote: "Recurrent laryngeal nerve palsy: hoarse voice; left RLN longer, more vulnerable", layer: "nerve" },
        ],
        mnemonics: [
          { mnemonic: "On Old Olympus Towering Top, A Fin And German Viewed A Hop — Cranial Nerve Names", meaning: "Olfactory, Optic, Oculomotor, Trochlear, Trigeminal, Abducens, Facial, Auditory/Vestibulocochlear, Glossopharyngeal, Vagus, Accessory, Hypoglossal", tip: "For type: 'Some Say Marry Money But My Brother Says Big Brains Matter Most' (S/M/B for I through XII)" },
          { mnemonic: "The Dirty Four (Parasympathetics): CN III, VII, IX, X", meaning: "CN III → ciliary ganglion (pupil constriction); VII → pterygopalatine + submandibular ganglia (lacrimal, salivary); IX → otic ganglion (parotid); X → intramural ganglia (heart, lungs, GI)", tip: "Remember 3,7,9,10 carry parasympathetics; all other CNs are somatic only" },
        ],
        bloodSupply: "Cranial nerves supplied by adjacent arteries: CN III by PCom aneurysm territory; CN VII by AICA in internal acoustic meatus; CN VIII by labyrinthine artery.",
        nerveSupply: "These ARE the nerves.",
      },
      {
        id: "spinal-cord",
        name: "Spinal Cord",
        regions: ["trunk"],
        cardLabel: "TRUNK",
        cardSubtitle: "Nerves",
        icon: "⚡",
        description: "The spinal cord extends from the medulla oblongata (foramen magnum) to the conus medullaris at L1–L2. It is enveloped by three meninges (pia mater directly covering cord, arachnoid mater, dura mater). 31 pairs of spinal nerves arise from it: 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal. Below L2, the spinal canal contains only the cauda equina (L2–S5 nerve roots) floating in CSF.",
        clinicalPoints: [
          "Brown-Séquard syndrome (hemisection): ipsilateral motor loss + vibration/proprioception loss; contralateral pain/temperature loss (spinothalamic crosses 2 segments above)",
          "Anterior cord syndrome (anterior spinal artery infarct): bilateral motor paralysis + pain/temperature loss; vibration/proprioception PRESERVED (posterior columns spared)",
          "Central cord syndrome: arms > legs weakness (cervical spondylosis, hyperextension injury); bladder dysfunction; commonest incomplete SCI",
          "Subacute combined degeneration (B12 deficiency): posterior columns + lateral corticospinal tracts; ataxia + spasticity + peripheral neuropathy",
          "Syringomyelia: central canal cyst; cape distribution sensory loss (pain/temp) + LMN signs at level; associated with Arnold-Chiari malformation",
          "Tabes dorsalis (tertiary syphilis): posterior column degeneration; Romberg's sign +ve; Charcot joints; lightning pains; Argyll Robertson pupil",
        ],
        studyNotes: "Spinal cord tracts: Dorsal columns (posterior): ipsilateral vibration, proprioception, fine touch (crosses in medulla). Spinothalamic (anterolateral): contralateral pain + temperature (crosses 2 segments above in cord). Corticospinal (lateral): ipsilateral motor (crosses in medullary decussation). Mnemonic: 'DCML goes up the same side and crosses at medulla; spinothalamic crosses in cord 2 segments up.'",
        quiz: [
          { q: "In Brown-Séquard syndrome (right hemisection at T6), which finding is expected?", options: ["Right-sided loss of pain/temperature below T6", "Left-sided motor paralysis below T6", "Right-sided motor weakness + left-sided pain/temperature loss below T6", "Bilateral loss of all modalities"], correct: 2, explanation: "Right cord hemisection: (1) Right ipsilateral motor paralysis (corticospinal tract, already crossed above) + right vibration/proprioception loss (dorsal columns, cross at medulla). (2) Left contralateral pain/temperature loss (spinothalamic, crossed 2 segments above in cord). Classic incomplete spinal cord injury pattern." },
          { q: "Which spinal cord syndrome is associated with cervical hyperextension injury in elderly patients with spondylosis?", options: ["Anterior cord syndrome", "Posterior cord syndrome", "Central cord syndrome", "Brown-Séquard syndrome"], correct: 2, explanation: "Central cord syndrome: most common incomplete SCI. Hyperextension in cervical spondylosis compresses central cord (contains cervical arm fibres). Pattern: disproportionate arm > leg weakness (central = arm, peripheral = leg in somatotopic map). Bladder dysfunction (urinary retention) is common." },
          { q: "The conus medullaris (end of spinal cord) lies at approximately which vertebral level in adults?", options: ["T10–T11", "T12–L1", "L1–L2", "L3–L4"], correct: 2, explanation: "In adults, the spinal cord ends at L1–L2 (conus medullaris). At birth it is at L3. This is why LP is performed at L3–4 or L4–5 (below cord terminus). Below L2, only cauda equina nerve roots are present in the subarachnoid space." },
        ],
        labels: [
          { id: "cervical-enlargement", name: "Cervical Enlargement (C5–T1)", pos: [0.0, 1.2, 0.0], description: "Supplies upper limbs via brachial plexus. Larger grey matter (more motor neurons). Level of shoulder, arm, forearm, hand.", layer: "nerve" },
          { id: "thoracic-cord", name: "Thoracic Cord (T2–T12)", pos: [0.0, 0.3, 0.0], description: "Smallest diameter cord. Supplies intercostals, thoracic muscles, upper abdominal muscles. Preganglionic sympathetics (intermediolateral column).", layer: "nerve" },
          { id: "lumbar-enlargement", name: "Lumbar Enlargement (L1–S3)", pos: [0.0, -0.5, 0.0], description: "Supplies lower limbs via lumbar and sacral plexuses. Contains motor neurons for hip flexors, quadriceps, hamstrings, leg and foot muscles.", layer: "nerve" },
          { id: "conus-medullaris", name: "Conus Medullaris", pos: [0.0, -1.0, 0.0], description: "Tapered end of spinal cord at L1–L2. Below this, only cauda equina roots float in CSF. Lesions here cause mixed UMN + LMN signs.", layer: "nerve" },
          { id: "cauda-equina", name: "Cauda Equina", pos: [0.0, -1.5, 0.0], description: "L2–S5 nerve roots (horse's tail). Float in CSF below conus. Lesion → LMN signs: flaccid paralysis, areflexia, saddle anaesthesia, bladder/bowel incontinence.", layer: "nerve" },
        ],
        mnemonics: [
          { mnemonic: "DCML ipsilateral, crosses at medulla; STT contralateral, crosses 2 levels above in cord", meaning: "Dorsal column–medial lemniscus (vibration, proprioception, fine touch) vs spinothalamic tract (pain, temperature)", tip: "Brown-Séquard: motor + DCML = same side as lesion; STT = opposite side" },
          { mnemonic: "S2,3,4 keeps the gut, bladder, and sex off the floor (pelvic parasympathetics)", meaning: "Sacral parasympathetics from cord segments S2,3,4 → pelvic splanchnic nerves → bladder detrusor, rectum, erectile tissue", tip: "Cauda equina lesion at S2,3,4 → urinary retention, faecal incontinence, erectile dysfunction" },
        ],
        relations: [
          "Surrounded by: pia mater (inner) → subarachnoid space (CSF) → arachnoid mater → subdural space → dura mater → epidural space (fat + Batson's venous plexus)",
          "Filum terminale: fibrous strand from conus to coccyx (pia component = internal; dura/arachnoid = external/coccygeal ligament)",
          "Spinal nerve roots: dorsal (sensory) + ventral (motor) roots join at intervertebral foramen",
          "Clinically: lumbar puncture at L3–4 or L4–5; epidural at L3–4 or L4–5; myelogram contrast fills subarachnoid space",
        ],
        bloodSupply: "Anterior spinal artery (1 vessel, from bilateral vertebral arteries) — supplies anterior 2/3 of cord (motor tracts). 2 posterior spinal arteries (from PICA or vertebrals) — posterior 1/3 (sensory dorsal columns). Supplemented by radicular arteries; largest = Artery of Adamkiewicz (T9–L2, left side 80%) — critical for lower cord. Anterior spinal artery infarct → anterior cord syndrome.",
        nerveSupply: "Spinal cord itself is not innervated (no proprioception from the cord itself). Meninges and dura: sinuvertebral (recurrent meningeal) nerve.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. RESPIRATORY
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "respiratory",
    name: "Respiratory System",
    color: "#06b6d4",
    darkColor: "#164e63",
    modelCount: 65,
    icon: "🫁",
    glbPath: "/models/respiratory.glb",
    cadavericTitle: "Lungs – Anterior View In Situ",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric lungs in situ showing the right (3 lobes) and left (2 lobes) lungs, cardiac notch of the left lung, and the relation to the pericardium. The hilum contains the bronchi, pulmonary vessels, and lymphatics.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    cadavericAnnotations: [
      { label: "Trachea", x: 50, y: 8 }, { label: "Right Upper Lobe", x: 72, y: 28 },
      { label: "Right Middle Lobe", x: 74, y: 52 }, { label: "Right Lower Lobe", x: 70, y: 72 },
      { label: "Left Upper Lobe", x: 28, y: 28 }, { label: "Left Lower Lobe", x: 30, y: 65 },
      { label: "Cardiac Notch", x: 40, y: 50 },
    ],
    crossSectionTitle: "Chest HRCT at Carina",
    crossSectionLevel: "T4–T6",
    crossSectionDescription: "Axial HRCT at carina level showing lung parenchyma, major airways, and mediastinal structures. Window: W:1500, L:−600 for lung.",
    ctNote: "HRCT: GGO (partial alveolar filling), consolidation (complete filling), honeycombing (end-stage fibrosis).",
    mriNote: "MRI lung: limited by respiratory motion. Used for chest wall/mediastinal soft tissue, cardiac MRI.",
    structures: [
      {
        id: "right-lung",
        name: "Right Lung",
        cardLabel: "RESPIRATORY SYSTEM",
        icon: "🫁",
        description: "The right lung has three lobes (upper, middle, lower) separated by the oblique fissure (UL/ML from LL) and horizontal fissure (UL from ML). It is shorter and wider than the left lung due to the liver below. The right main bronchus is more vertical (25° from trachea vs 45° left).",
        clinicalPoints: [
          "Right lung aspiration pneumonia: more common as right main bronchus is more vertical — food/vomit preferentially enters",
          "Right middle lobe syndrome: collapse due to hilar lymph nodes compressing middle lobe bronchus (Brock's syndrome)",
          "Primary TB: upper lobe (oxygen-rich) — Ghon focus → Ghon complex (with lymph node + hilar calcification)",
          "Pulmonary embolism: right lower lobe most common (gravity-dependent, larger pulmonary artery)",
          "Pleural effusion: blunts costophrenic angle on CXR; requires >200ml to be visible",
          "Pneumothorax: apical and paramediastinal on erect CXR; needs intercostal drain if tension (trachea deviates away)",
        ],
        studyNotes: "Right lung: 10 bronchopulmonary segments (3 UL + 2 ML + 5 LL). Left: 8–10 segments (4+6). Each segment is surgically independent (own segmental bronchus, artery, vein). Bronchopulmonary segments = unit of resection.",
        quiz: [
          { q: "Which lobe of the lung is most commonly affected by aspiration pneumonia in a supine patient?", options: ["Right upper lobe", "Right middle lobe", "Right lower lobe, posterior segment", "Left lower lobe"], correct: 2, explanation: "In a supine patient, the posterior segment of the right lower lobe is most dependent. The right main bronchus is also more vertical, making right-side aspiration more common overall." },
          { q: "The carina (tracheal bifurcation) lies at which vertebral level?", options: ["T2", "T4", "T6", "T8"], correct: 1, explanation: "The carina lies at T4 (sternal angle/angle of Louis). T4 is a key anatomical landmark: also marks the bifurcation of the aortic arch, the junction of superior and inferior mediastinum." },
        ],
        labels: [
          { id: "rul", name: "Right Upper Lobe", pos: [0.8, 0.8, 0.5], description: "3 segments: apical, anterior, posterior. Site of primary TB (apical) and aspiration in upright position.", layer: "organ" },
          { id: "rml", name: "Right Middle Lobe", pos: [1.0, 0.1, 0.5], description: "2 segments: medial and lateral. Most prone to compression by enlarged hilar nodes (Brock's syndrome).", layer: "organ" },
          { id: "rll", name: "Right Lower Lobe", pos: [0.8, -0.7, 0.5], description: "5 segments. Basal segments dependent in supine — preferred aspiration site.", layer: "organ" },
          { id: "lul", name: "Left Upper Lobe", pos: [-0.8, 0.7, 0.5], description: "Includes lingula (equivalent of right middle lobe). Cardiac notch on anterior medial surface.", layer: "organ" },
          { id: "lll", name: "Left Lower Lobe", pos: [-0.8, -0.5, 0.5], description: "4 segments (no middle lobe). Common site of pneumonia.", layer: "organ" },
          { id: "trachea", name: "Trachea", pos: [0.0, 1.5, 0.5], description: "16–20 C-shaped cartilage rings. 10–15cm long. Bifurcates at carina (T4).", clinicalNote: "Carina angle >70° on CXR → left atrial enlargement (mitral stenosis)", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "RUL has 3, RML has 2, RLL has 5 → Total 10 right; Left has 8-10 (no middle lobe)", meaning: "Right lung segments: 3-2-5 = 10 total", tip: "Lingula = left middle lobe equivalent (part of LUL)" },
          { mnemonic: "AEIOU for pleural effusion causes: Albumin↓ (transudate), Empyema/Exudate causes, Inflammation, Obstruction/malignancy, Uraemia/CHF", meaning: "Transudate: CHF, cirrhosis, nephrotic. Exudate (Light's criteria): protein>3g/dL, LDH>200, ratio>0.6", tip: "Light's criteria: ANY ONE exudate criterion = exudate" },
        ],
        relations: [
          "Mediastinal surface: contains the hilum (root of lung): main bronchus, pulmonary artery + veins, lymphatics, bronchial vessels",
          "Hilum mnemonic: VAIN = Vein (anterior), Artery (above), bronchus (posterior), nerves",
          "Costal surface: ribs + intercostal muscles + parietal pleura",
          "Diaphragmatic surface: right lung → liver; left lung → stomach, spleen",
          "Apex: projects into neck 2.5cm above clavicle — site of Pancoast tumour (Horner's syndrome + brachial plexopathy)",
        ],
        bloodSupply: "Functional: pulmonary artery (deoxygenated blood, gas exchange). Nutritive: bronchial arteries (from aorta). Venous: pulmonary veins (oxygenated) to LA; bronchial veins → azygos system.",
      },
      {
        id: "trachea",
        name: "Trachea",
        cardLabel: "RESPIRATORY SYSTEM",
        cardSubtitle: "Airway",
        icon: "🫁",
        glbPath: "/models/trachea.glb",
        description: "The trachea is a 10–15 cm fibrocartilaginous tube extending from the larynx (C6) to the carina (T4–T5), where it bifurcates into the left and right main bronchi. It is held open by 16–20 C-shaped cartilaginous rings with a posterior membranous wall (trachealis muscle).",
        clinicalPoints: [
          "Carina at T4/sternal angle (angle of Louis): bifurcation point; right main bronchus more vertical (25° vs 45° left) → aspiration goes right",
          "Tracheotomy: performed at 2nd–3rd tracheal ring (emergency) or 3rd–4th (elective) — below thyroid isthmus",
          "Tracheal deviation on CXR: pushed away from tension pneumothorax/large effusion; pulled toward collapse/fibrosis",
          "Subglottic stenosis after prolonged intubation: cuff pressure >25 mmHg ischaemia → fibrosis",
          "Tracheomalacia: cartilage softening → dynamic collapse on expiration; 'scabbard' trachea in goitre (lateral compression)",
        ],
        studyNotes: "Anatomy of the right vs left main bronchus: Right = shorter (2.5cm), wider, more vertical (eparterial bronchus — pulmonary artery passes below it). Left = longer (5cm), narrower, more horizontal. Carina angle normally <70°; widening (>70°) indicates left atrial enlargement (mitral stenosis).",
        quiz: [
          { q: "At which vertebral level does the trachea bifurcate into the main bronchi?", options: ["T2", "T4", "T6", "T8"], correct: 1, explanation: "The carina lies at T4 (angle of Louis / sternal angle). This is also the level of the aortic arch, azygos vein junction with SVC, and the junction of superior and inferior mediastinum." },
          { q: "A foreign body is aspirated. Which bronchus is it most likely to enter?", options: ["Left main bronchus", "Right main bronchus", "Both equally", "Trachea only"], correct: 1, explanation: "The right main bronchus is shorter, wider, and more vertical (25° from trachea vs 45° on left). It is thus the preferred path for aspirated foreign bodies, especially in adults in upright position." },
        ],
        labels: [
          { id: "tracheal-rings", name: "Tracheal Rings", pos: [0.0, 0.5, 0.5], description: "16–20 C-shaped hyaline cartilage rings. Open posteriorly (membranous wall = trachealis smooth muscle).", layer: "organ" },
          { id: "carina", name: "Carina", pos: [0.0, -0.9, 0.5], description: "Internal ridge at bifurcation (T4). Highly sensitive to stimulation → cough reflex. Widening >70° = left atrial enlargement.", clinicalNote: "Key bronchoscopic landmark", layer: "organ" },
          { id: "right-main", name: "Right Main Bronchus", pos: [0.6, -1.2, 0.5], description: "2.5 cm long, 25° from midline. More vertical → more common site of aspiration. Eparterial to pulmonary artery.", layer: "organ" },
          { id: "left-main", name: "Left Main Bronchus", pos: [-0.6, -1.2, 0.5], description: "5 cm long, 45° from midline. Passes under aortic arch + anterior to oesophagus. Hyparterial to pulmonary artery.", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "Right is Right for Aspiration (shorter, wider, more vertical)", meaning: "Foreign bodies and aspiration go into right main bronchus preferentially", tip: "Right lower lobe most common site of aspiration pneumonia in upright patient" },
        ],
        bloodSupply: "Inferior thyroid arteries (superior trachea) + bronchial arteries from aorta (lower trachea). Venous: inferior thyroid veins.",
        nerveSupply: "Parasympathetic: vagus (X) → bronchoconstriction, mucus secretion. Sympathetic: T1–4 sympathetic chain → bronchodilation. Sensory: recurrent laryngeal nerve (cough reflex).",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. MUSCULAR
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "muscular",
    name: "Muscular System",
    color: "#f97316",
    darkColor: "#7c2d12",
    modelCount: 187,
    icon: "💪",
    glbPath: "/models/diaphragm.glb",
    sketchfabId: "c23ad54a770244a6a0067fe86c9c410b",
    cadavericTitle: "Brachial Plexus Dissection",
    cadavericSide: "Right Side",
    cadavericDescription: "Dissection showing the brachial plexus in the right axillary region. Arises from C5-T1 ventral rami, forms roots, trunks (R-M-L: mnemonic), divisions, cords, and terminal branches.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Brachial_plexus_color.svg/640px-Brachial_plexus_color.svg.png",
    cadavericAnnotations: [
      { label: "Lateral Cord", x: 28, y: 35 }, { label: "Medial Cord", x: 72, y: 38 },
      { label: "Posterior Cord", x: 50, y: 28 }, { label: "Musculocutaneous N.", x: 18, y: 55 },
      { label: "Median Nerve", x: 48, y: 55 }, { label: "Ulnar Nerve", x: 75, y: 60 },
      { label: "Radial Nerve", x: 55, y: 75 }, { label: "Axillary Artery", x: 50, y: 45 },
    ],
    crossSectionTitle: "Shoulder – Coronal MRI",
    crossSectionLevel: "Coronal",
    crossSectionDescription: "Coronal fat-saturated MRI of the shoulder showing the rotator cuff tendons, supraspinatus under the subacromial arch, and glenohumeral joint space.",
    ctNote: "CT shoulder: bone detail, fractures, AC joint separation. CT arthrogram: labral tears.",
    mriNote: "MRI shoulder: gold standard for rotator cuff tears, labral tears (SLAP, Bankart), and bursitis.",
    structures: [
      {
        id: "deltoid",
        name: "Deltoid Muscle",
        description: "The deltoid is a multipennate muscle covering the shoulder joint, giving the shoulder its rounded contour. It has three parts: anterior (clavicular head), middle (acromial head), and posterior (spinal head). All converge on the deltoid tuberosity of the humerus.",
        clinicalPoints: [
          "IM injection site — middle (acromial) deltoid: safe in upper-outer quadrant (avoids axillary nerve inferiorly)",
          "Axillary nerve palsy → deltoid paralysis → loss of shoulder abduction (15–90°), 'regimental badge' numbness",
          "Deltoid wasting: long-standing axillary nerve damage from shoulder dislocation or surgical neck fracture",
          "Anterior: flexion + medial rotation; Middle: abduction; Posterior: extension + lateral rotation",
          "Subacromial impingement: supraspinatus compressed under acromion → painful arc 60–120° abduction",
          "Rotator cuff tear (supraspinatus most common): painful weakness on abduction; drop arm sign",
        ],
        studyNotes: "Deltoid: axillary nerve (C5,C6). Abducts 15–90°. Supraspinatus initiates first 15°. Above 90°, trapezius takes over. Middle part has the most fibres and is most important for abduction.",
        quiz: [
          { q: "The deltoid muscle is supplied by which nerve?", options: ["Radial nerve", "Axillary nerve", "Suprascapular nerve", "Musculocutaneous nerve"], correct: 1, explanation: "Deltoid is supplied by the axillary nerve (C5, C6), arising from the posterior cord of the brachial plexus. It also supplies teres minor." },
          { q: "Which is the safest quadrant for intramuscular injection in the deltoid?", options: ["Upper inner", "Upper outer", "Lower inner", "Lower outer"], correct: 1, explanation: "Upper outer quadrant avoids the axillary nerve and posterior circumflex humeral vessels that lie in the lower portion of the deltoid." },
        ],
        labels: [
          {
            id: "ant-deltoid", name: "Anterior Deltoid", latinName: "Deltoideus (pars clavicularis)",
            pos: [-0.9, 0.5, 0.5], layer: "muscle",
            description: "Clavicular head. Flexion + medial rotation of shoulder.",
            origin: "Anterior border of the lateral 1/3 of the clavicle",
            insertion: "Deltoid tuberosity of humerus",
            innervation: "Axillary nerve (C5, C6) — posterior cord of brachial plexus",
            action: "Flexion and medial rotation of the shoulder joint",
          },
          {
            id: "mid-deltoid", name: "Middle Deltoid", latinName: "Deltoideus (pars acromialis)",
            pos: [-1.1, 0.0, 0.5], layer: "muscle",
            description: "Acromial head. Primary abductor (15°–90°). Site of safe IM injection.",
            origin: "Lateral margin and superior surface of the acromion",
            insertion: "Deltoid tuberosity of humerus",
            innervation: "Axillary nerve (C5, C6) — posterior cord of brachial plexus",
            action: "Abduction of the shoulder (15°–90°) — most powerful abductor",
          },
          {
            id: "post-deltoid", name: "Posterior Deltoid", latinName: "Deltoideus (pars spinalis)",
            pos: [-0.85, -0.4, 0.5], layer: "muscle",
            description: "Spinal head. Extension + lateral rotation of shoulder.",
            origin: "Lower lip of the posterior border of the spine of scapula",
            insertion: "Deltoid tuberosity of humerus",
            innervation: "Axillary nerve (C5, C6) — posterior cord of brachial plexus",
            action: "Extension and lateral rotation of the shoulder joint",
          },
          {
            id: "biceps", name: "Biceps Brachii", latinName: "Musculus biceps brachii",
            pos: [-0.55, -0.7, 0.5], layer: "muscle",
            description: "Two heads. Flexion + supination. Musculocutaneous nerve (C5,6). Biceps reflex = C5,6.",
            origin: "Long head: supraglenoid tubercle of scapula; Short head: coracoid process of scapula",
            insertion: "Radial tuberosity and bicipital aponeurosis (into deep fascia of forearm)",
            innervation: "Musculocutaneous nerve (C5, C6)",
            action: "Flexion of elbow; supination of forearm (most powerful supinator); weak shoulder flexion",
          },
          {
            id: "triceps", name: "Triceps Brachii", latinName: "Musculus triceps brachii",
            pos: [0.9, -0.2, 0.5], layer: "muscle",
            description: "Three heads. Elbow extension. Radial nerve (C6,7,8). Long head from infraglenoid tubercle.",
            origin: "Long head: infraglenoid tubercle of scapula; Lateral head: posterior humerus (above radial groove); Medial head: posterior humerus (below radial groove)",
            insertion: "Posterior surface of olecranon of ulna",
            innervation: "Radial nerve (C6, C7, C8)",
            action: "Extension of elbow (all heads); extension and adduction of shoulder (long head only)",
          },
        ],
        mnemonics: [
          { mnemonic: "SITS on the glenoid rim", meaning: "Supraspinatus, Infraspinatus, Teres minor, Subscapularis — rotator cuff muscles. S=abduction, I+T=lateral rotation, Sub=medial rotation", tip: "Supraspinatus: most commonly torn (impingement at subacromial arch)" },
          { mnemonic: "Robert Taylor Drinks Cold Beer (R-T-D-C-B)", meaning: "Roots, Trunks, Divisions, Cords, Branches — brachial plexus components in order", tip: "3 trunks: Upper (C5,6), Middle (C7), Lower (C8,T1). Posterior cord → Axillary + Radial" },
        ],
        origin: "Clavicle (anterior 1/3), acromion, spine of scapula",
        insertion: "Deltoid tuberosity of humerus",
        innervation: "Axillary nerve (C5, C6) — posterior cord of brachial plexus",
        action: "Anterior: flexion, medial rotation; Middle: abduction; Posterior: extension, lateral rotation",
        bloodSupply: "Posterior circumflex humeral artery (from axillary) + thoracoacromial artery (from axillary).",
        nerveSupply: "Axillary nerve (C5, C6) — posterior cord of brachial plexus.",
        relations: [
          "Superficial to: glenohumeral joint, rotator cuff muscles, subacromial bursa, axillary nerve, posterior circumflex humeral vessels",
          "Deep: subacromial bursa (risk of bursitis in impingement)",
          "The axillary nerve runs 6–7cm below the tip of the acromion — critical for safe IM injection site",
        ],
      },
      {
        id: "abdominal-muscles",
        name: "Abdominal Wall Muscles",
        cardLabel: "MUSCLES",
        cardSubtitle: "Abdominal wall",
        icon: "💪",
        regions: ["trunk"],
        description: "The anterolateral abdominal wall has three flat muscles (external oblique, internal oblique, transversus abdominis) and one vertical pair (rectus abdominis). They form the rectus sheath and protect abdominal viscera.",
        clinicalPoints: [
          "Inguinal ligament = lower free edge of external oblique aponeurosis (ASIS → pubic tubercle)",
          "Hesselbach's triangle (direct inguinal hernia): inferior epigastric vessels (lateral), rectus sheath (medial), inguinal ligament (inferior)",
          "Arcuate line (semicircular line of Douglas): posterior rectus sheath absent below this line (lower 1/4 of abdomen)",
          "McBurney's point: 2/3 way from umbilicus to ASIS — maximum tenderness in acute appendicitis",
          "Spigelian hernia: through linea semilunaris, lateral to rectus sheath, at or below arcuate line",
          "Paramedian incision: spares rectus muscle by retracting laterally; stronger than midline, but takes longer",
        ],
        studyNotes: "Inguinal canal (4cm oblique passage): Anterior wall = EO aponeurosis + IO (lateral half); Posterior wall = transversalis fascia + conjoint tendon (medial); Roof = arching fibres of IO + TA; Floor = inguinal ligament + lacunar ligament (medial).",
        quiz: [
          { q: "The 'hands in trouser pockets' direction describes fibres of which muscle?", options: ["Internal oblique", "Transversus abdominis", "External oblique", "Rectus abdominis"], correct: 2, explanation: "External oblique fibres run inferomedially — like hands slipping into front trouser pockets. Internal oblique: superomedially (perpendicular). Transversus abdominis: horizontal." },
          { q: "The inguinal ligament is the lower free border of which structure?", options: ["Internal oblique aponeurosis", "Transversus abdominis", "External oblique aponeurosis", "Conjoint tendon"], correct: 2, explanation: "Inguinal ligament = lower rolled-back edge of external oblique aponeurosis, stretching from ASIS to pubic tubercle." },
          { q: "Which nerve is at risk in a right iliac fossa (McBurney's) incision?", options: ["Genitofemoral nerve", "Femoral nerve", "Ilioinguinal nerve (L1)", "Obturator nerve"], correct: 2, explanation: "The ilioinguinal nerve (L1) runs between internal oblique and transversus abdominis and is commonly encountered and may be divided in a gridiron incision for appendicectomy." },
        ],
        labels: [
          {
            id: "ext-oblique", name: "External Oblique", latinName: "Musculus obliquus externus abdominis",
            pos: [-0.6, 0.05, 0.55], layer: "muscle",
            description: "Outermost flat muscle. Fibres run inferomedially (hands-in-pockets direction). Aponeurosis forms inguinal ligament inferiorly.",
            origin: "External surfaces of ribs 5–12 (by fleshy digitations interdigitating with serratus anterior and latissimus dorsi)",
            insertion: "Linea alba, pubic symphysis, pubic crest, pubic tubercle, anterior half of iliac crest; lower free border = inguinal ligament",
            innervation: "Ventral rami T7–T12 (intercostal nerves); Iliohypogastric nerve (L1); Ilioinguinal nerve (L1)",
            action: "Bilateral: trunk flexion, compresses/supports abdominal viscera; Unilateral: lateral flexion to same side, rotation to opposite side",
          },
          {
            id: "int-oblique", name: "Internal Oblique", latinName: "Musculus obliquus internus abdominis",
            pos: [0.6, 0.05, 0.45], layer: "muscle",
            description: "Middle flat muscle. Fibres run superomedially (perpendicular to external oblique). Forms conjoint tendon with transversus.",
            origin: "Thoracolumbar fascia, anterior 2/3 of iliac crest, lateral 2/3 of inguinal ligament",
            insertion: "Inferior borders of ribs 10–12; linea alba; pubic crest; conjoint tendon (with transversus abdominis)",
            innervation: "Ventral rami T7–T12; Iliohypogastric nerve (L1); Ilioinguinal nerve (L1)",
            action: "Bilateral: trunk flexion, compresses viscera; Unilateral: lateral flexion and rotation to same side",
          },
          {
            id: "transversus", name: "Transversus Abdominis", latinName: "Musculus transversus abdominis",
            pos: [0.0, -0.1, 0.38], layer: "muscle",
            description: "Deepest flat muscle ('corset muscle'). Horizontal fibres provide transverse tension — key to intra-abdominal pressure.",
            origin: "Lateral 1/3 of inguinal ligament, iliac crest, thoracolumbar fascia, costal cartilages 7–12 (deep surface)",
            insertion: "Linea alba, pubic crest, pubic symphysis; forms conjoint tendon with internal oblique",
            innervation: "Ventral rami T7–T12; Iliohypogastric nerve (L1); Ilioinguinal nerve (L1)",
            action: "Compresses and supports abdominal viscera; maintains intra-abdominal pressure; forced expiration",
          },
          {
            id: "rectus-abdominis", name: "Rectus Abdominis", latinName: "Musculus rectus abdominis",
            pos: [0.0, 0.35, 0.6], layer: "muscle",
            description: "Paired vertical strap muscle enclosed in rectus sheath. 3–4 tendinous intersections. The '6-pack' muscle.",
            origin: "Pubic symphysis and pubic crest",
            insertion: "Xiphoid process and costal cartilages 5, 6, and 7",
            innervation: "Ventral rami T7–T12 (segmental innervation along length of muscle)",
            action: "Flexion of lumbar vertebral column (trunk curl); depression of rib cage; compresses abdominal viscera; aids expiration",
          },
          {
            id: "pyramidalis", name: "Pyramidalis", latinName: "Musculus pyramidalis",
            pos: [0.25, -0.65, 0.6], layer: "muscle",
            description: "Small triangular muscle anterior to rectus abdominis. Absent in ~20% of individuals. Clinically unimportant.",
            origin: "Pubic symphysis and pubic crest (anterior surface)",
            insertion: "Linea alba (midway between pubic symphysis and umbilicus)",
            innervation: "Subcostal nerve (T12)",
            action: "Tenses the linea alba",
          },
        ],
        mnemonics: [
          { mnemonic: "EIT → External oblique: Opposite side rotation; Internal oblique: Ipsilateral rotation; Transversus: Tension (compresses)", meaning: "Remember the rotation directions: External = Opposite, Internal = Ipsilateral. Both work with contralateral external oblique.", tip: "Left internal oblique + Right external oblique → rotate trunk to the LEFT" },
          { mnemonic: "Rectus sheath above arcuate line: FRONT = EO + IO; BACK = IO + TA; Below = ALL THREE anterior (no posterior sheath)", meaning: "Above arcuate line: IO aponeurosis splits around rectus. Below arcuate line (lower 1/4): all aponeuroses pass anterior to rectus — posterior sheath absent (only transversalis fascia).", tip: "Arcuate line = semicircular line of Douglas — visible as curved line on posterior rectus sheath" },
        ],
        relations: [
          "Anterior to external oblique: skin, Camper's fascia (fatty), Scarpa's fascia (membranous)",
          "Posterior to transversus abdominis: transversalis fascia → extraperitoneal fat → parietal peritoneum",
          "Linea semilunaris: lateral border of rectus sheath — site of Spigelian hernia",
          "Linea alba: avascular midline raphe from xiphoid to pubic symphysis — incision site (no major vessels)",
        ],
        origin: "See individual muscle labels for specific origins",
        insertion: "See individual muscle labels for specific insertions",
        innervation: "T7–T12 intercostal nerves (segmental); Iliohypogastric nerve (L1); Ilioinguinal nerve (L1)",
        action: "Collectively: trunk flexion and rotation; compression of abdominal viscera; forced expiration",
        nerveSupply: "T7–T12 ventral rami (intercostal nerves) supply external oblique, internal oblique, transversus abdominis, and rectus abdominis in a segmental pattern. Iliohypogastric (L1) and ilioinguinal (L1) supply lower fibres.",
        bloodSupply: "Superior epigastric artery (terminal branch of internal thoracic) + inferior epigastric artery (from external iliac) anastomose within rectus sheath. Lateral muscles: lower posterior intercostal arteries + lumbar arteries.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. DIGESTIVE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "digestive",
    name: "Digestive System",
    color: "#22c55e",
    darkColor: "#14532d",
    modelCount: 69,
    icon: "🫃",
    glbPath: "/models/liver.glb",
    cadavericTitle: "Abdominal Organs – Anterior View",
    cadavericSide: "Anterior",
    cadavericDescription: "Cadaveric dissection of the abdomen showing the GI tract in situ. Greater omentum reflected to reveal the stomach, transverse colon, and small intestines.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Digestive_system_diagram_en.svg/450px-Digestive_system_diagram_en.svg.png",
    cadavericAnnotations: [
      { label: "Oesophagus", x: 50, y: 12 }, { label: "Stomach", x: 38, y: 32 },
      { label: "Liver", x: 70, y: 25 }, { label: "Duodenum", x: 62, y: 42 },
      { label: "Jejunum", x: 45, y: 58 }, { label: "Ascending Colon", x: 75, y: 62 },
      { label: "Sigmoid Colon", x: 42, y: 78 },
    ],
    crossSectionTitle: "Abdomen – CT at L1 (Portal Venous Phase)",
    crossSectionLevel: "L1 Level",
    crossSectionDescription: "Axial CT at L1 level (portal venous phase) showing liver, portal vein, IVC, aorta, and surrounding bowel.",
    ctNote: "CT triple phase liver: arterial (HCC), portal venous (metastases), delayed (cholangiocarcinoma).",
    mriNote: "MRI liver: MRCP for biliary/pancreatic ducts — non-invasive alternative to ERCP.",
    structures: [
      {
        id: "stomach",
        name: "Stomach",
        cardLabel: "DIGESTIVE SYSTEM",
        icon: "🫃",
        glbPath: "/models/stomach.glb",
        description: "The stomach is a J-shaped muscular organ in the left upper quadrant, capable of expanding to hold ~1L. Four regions: cardia (where oesophagus enters), fundus (dome above cardia), body, and pylorus (antrum → canal → sphincter).",
        clinicalPoints: [
          "Peptic ulcer disease: H. pylori (80% duodenal, 60% gastric ulcers) — CLO test/urea breath test for diagnosis",
          "Gastric cancer: signet ring cells (poorly differentiated adenocarcinoma) — poor prognosis; linitis plastica = diffuse infiltration",
          "Virchow's node (left supraclavicular): gastric cancer metastasis (Troisier's sign)",
          "Sister Mary Joseph nodule: umbilical metastasis from gastric/pancreatic/ovarian cancer",
          "Zollinger-Ellison: gastrinoma → hypersecretion → multiple peptic ulcers + diarrhoea; test: fasting serum gastrin",
          "Posterior duodenal ulcer → GDA erosion → haematemesis + melaena (surgical emergency)",
        ],
        studyNotes: "Stomach blood supply mnemonic: 'Lesser curvature gets Left gastric + Right gastric; Greater curvature gets Left gastroepiploic + Right gastroepiploic + short gastrics'. All anastomose — stomach rarely ischaemic. Pyloric stenosis (adult): annular pancreas/peptic ulcer/carcinoma; (infant): hypertrophic — projectile vomiting, olive mass.",
        quiz: [
          { q: "A posterior duodenal ulcer is most likely to cause haemorrhage from which artery?", options: ["Left gastric artery", "Right gastric artery", "Gastroduodenal artery", "Superior mesenteric artery"], correct: 2, explanation: "Posterior duodenal ulcer erodes into the gastroduodenal artery (GDA) — first branch of common hepatic artery. Causes massive UGIB." },
          { q: "Which lymph node is classically associated with gastric carcinoma metastasis?", options: ["Epitrochlear node", "Virchow's node (left supraclavicular)", "Para-aortic node", "Axillary node"], correct: 1, explanation: "Virchow's node (Troisier's sign): left supraclavicular lymphadenopathy = gastric (most common), pancreatic, or any intra-abdominal malignancy via thoracic duct." },
          { q: "Which cells in the gastric antrum secrete gastrin?", options: ["Chief cells", "Parietal cells", "G cells", "D cells"], correct: 2, explanation: "G cells (gastrin-secreting) are concentrated in the gastric antrum and duodenum. Chief cells: pepsinogen. Parietal cells: HCl + intrinsic factor. D cells: somatostatin (inhibits G cells)." },
        ],
        labels: [
          { id: "fundus", name: "Fundus", pos: [-0.7, 0.75, 0.5], description: "Dome-shaped superior part above cardia. Contains swallowed air (gastric bubble on CXR).", layer: "organ" },
          { id: "body", name: "Body (Corpus)", pos: [-0.3, 0.2, 0.5], description: "Largest part. Contains rugae (mucosal folds). Parietal cells here (HCl + intrinsic factor).", layer: "organ" },
          { id: "antrum", name: "Pyloric Antrum", pos: [0.5, -0.1, 0.5], description: "Contains G-cells (gastrin), D-cells (somatostatin). Common site of H. pylori and gastric carcinoma.", layer: "organ" },
          { id: "liver", name: "Liver", pos: [1.2, 0.6, 0.5], description: "Largest solid organ. Dual blood supply: portal vein (75%) + hepatic artery (25%).", clinicalNote: "Liver span >14cm = hepatomegaly. Couinaud segments I–VIII for surgical resection.", layer: "organ" },
          { id: "duodenum", name: "Duodenum", pos: [1.1, -0.3, 0.5], description: "C-shaped, retroperitoneal (except 1st part). 4 parts. DJ flexure = duodenojejunal junction (ligament of Treitz, L2).", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "Left Gastric artery = from Coeliac Trunk directly; Right Gastric = from proper Hepatic", meaning: "Coeliac trunk → Left gastric (direct), common hepatic (→ GDA + proper hepatic → right gastric), splenic (→ left gastroepiploic)", tip: "SMA = jejunum to 2/3 transverse colon; IMA = 1/3 transverse to rectum" },
          { mnemonic: "Virchow = Via thoracic duct from Visceral organs → left supraclavicular (Virchow = Vclavicular)", meaning: "Lymphatic drainage of stomach goes to coeliac nodes → para-aortic → cisterna chyli → thoracic duct → left subclavian junction → Virchow's node", tip: "Troisier's sign = Virchow's node enlargement (hard, fixed, painless)" },
        ],
        relations: [
          "Anterior: left lobe of liver (upper), anterior abdominal wall (lower)",
          "Posterior: stomach bed: pancreas, spleen, left kidney, left suprarenal, transverse mesocolon",
          "Lesser curvature: lesser omentum (hepatogastric ligament containing right + left gastric vessels)",
          "Greater curvature: greater omentum, gastrosplenic ligament (short gastric + left gastroepiploic vessels)",
          "Pylorus: first part of duodenum, gallbladder (Hartmann's pouch near pylorus)",
        ],
        bloodSupply: "Lesser curve: left gastric (from coeliac) + right gastric (from hepatic proper). Greater curve: left gastroepiploic (from splenic) + right gastroepiploic (from GDA). Fundus: short gastric arteries (from splenic).",
        nerveSupply: "Parasympathetic (vagus → stimulates motility + secretion): left vagus = anterior gastric, right vagus = posterior. Sympathetic (T6-T9 via coeliac plexus): inhibit motility, vasoconstriction.",
        lymphDrainage: "Left gastric (lesser curve) → coeliac nodes. Right gastroepiploic (greater curve) → pyloric nodes. All → para-aortic nodes → cisterna chyli.",
      },
      {
        id: "liver",
        name: "Liver",
        cardLabel: "DIGESTIVE SYSTEM",
        cardSubtitle: "Liver",
        icon: "🫀",
        glbPath: "/models/liver.glb",
        regions: ["trunk"],
        description: "The liver is the largest solid organ (1.2–1.5 kg) in the right upper quadrant, lying under the right hemidiaphragm. It has a dual blood supply: portal vein (75%, nutrient-rich from gut) and hepatic artery proper (25%, oxygenated). Venous drainage is via 3 hepatic veins into the IVC.",
        clinicalPoints: [
          "Hepatomegaly: liver span >14cm on percussion; causes — hepatitis, cirrhosis, CCF (nutmeg liver), malaria, leukaemia",
          "Couinaud segments (I–VIII): each has independent portal, hepatic artery, and hepatic vein — unit of surgical resection",
          "Cirrhosis: portal hypertension → oesophageal varices (haematemesis), splenomegaly, ascites, caput medusae, hepatic encephalopathy",
          "Child-Pugh score (A/B/C): bilirubin, albumin, PT, ascites, encephalopathy — predicts surgical risk in cirrhosis",
          "Liver abscess: amoebic (Entamoeba — right lobe, anchovy paste); pyogenic (Klebsiella in diabetics, E. coli)",
          "Primary biliary cholangitis (PBC): anti-mitochondrial antibody (AMA-M2); pruritis, jaundice; middle-aged women",
        ],
        studyNotes: "Liver lobes: Right (larger) + Left. Functionally divided by Cantlie's line (Rex-Cantlie). Ligamentum teres (round ligament) = obliterated umbilical vein in falciform ligament. Ligamentum venosum = obliterated ductus venosus. Portal triad = portal vein branch + hepatic artery branch + bile duct (bile flows against blood).",
        quiz: [
          { q: "The portal triad in the liver contains all EXCEPT:", options: ["Portal vein branch", "Hepatic artery branch", "Hepatic vein branch", "Bile ductule"], correct: 2, explanation: "The portal triad (at corners of hepatic lobules) contains: portal vein branch + hepatic artery branch + bile ductule. Hepatic veins drain centrally (central vein) and are NOT part of the portal triad." },
          { q: "A liver biopsy is best performed via which route to avoid the gallbladder?", options: ["Left mid-axillary line, 8th ICS", "Right mid-axillary line, 9th–10th ICS, during expiration", "Epigastric, midline", "Subcostal, right side, deep inspiration"], correct: 1, explanation: "Liver biopsy: right mid-axillary line, 9th or 10th intercostal space, during expiration (liver rises, pleura clears). Patient holds breath after expiration to avoid pneumothorax." },
        ],
        labels: [
          { id: "right-lobe", name: "Right Lobe", pos: [0.7, 0.2, 0.5], description: "Larger lobe. Contains segments V–VIII (Couinaud). Right hepatic vein drains to IVC.", layer: "organ" },
          { id: "left-lobe", name: "Left Lobe", pos: [-0.6, 0.3, 0.5], description: "Smaller lobe. Contains segments II–IV. Left hepatic vein drains to IVC. Contains ligamentum venosum (fissure).", layer: "organ" },
          { id: "gallbladder", name: "Gallbladder", pos: [0.5, -0.5, 0.7], description: "On visceral surface of liver at junction of right and left lobes. Murphy's point: gallbladder fundus — MCL + right costal margin.", clinicalNote: "Murphy's sign: arrest of inspiration on deep palpation of Murphy's point = acute cholecystitis", layer: "organ" },
          { id: "portal-vein", name: "Portal Vein", pos: [0.2, -0.8, 0.3], description: "Formed by SMV + splenic vein behind neck of pancreas (at L1). Normal portal pressure: 5–10 mmHg. HTN >12 mmHg.", layer: "vessel" },
        ],
        mnemonics: [
          { mnemonic: "Portal hypertension causes: ABCDE — Ascites, Bleeding varices, Caput medusae, splenomegaly + hypersplenism, Encephalopathy", meaning: "Consequences of portal hypertension in cirrhosis", tip: "Oesophageal varices: most dangerous (risk of torrential haemorrhage). Propranolol for primary prevention; banding/TIPSS for acute." },
        ],
        bloodSupply: "Portal vein (75%) + hepatic artery proper (25%) from coeliac trunk. Hepatic veins (right, middle, left) drain into IVC just below diaphragm.",
        nerveSupply: "Sympathetic + parasympathetic via hepatic plexus (coeliac plexus). Glisson's capsule: pain-sensitive (tenderness in hepatomegaly/stretching).",
        lymphDrainage: "Mainly hepatic nodes (along hepatic artery) → coeliac nodes → para-aortic → cisterna chyli. Some superficial lymph drains through diaphragm to mediastinal nodes.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ENDOCRINE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "endocrine",
    name: "Endocrine System",
    color: "#eab308",
    darkColor: "#713f12",
    modelCount: 42,
    icon: "🦋",
    cadavericTitle: "Endocrine Glands – Overview",
    cadavericSide: "Anterior",
    cadavericDescription: "Overview of the major endocrine glands: hypothalamic-pituitary axis (master control), thyroid (metabolism), parathyroid (calcium), adrenal (stress + salt), endocrine pancreas (glucose), and gonads (sex hormones).",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Endocrine_English.svg/480px-Endocrine_English.svg.png",
    cadavericAnnotations: [
      { label: "Hypothalamus", x: 50, y: 8 }, { label: "Pituitary", x: 50, y: 15 },
      { label: "Thyroid", x: 50, y: 30 }, { label: "Adrenal Glands", x: 50, y: 52 },
      { label: "Pancreas", x: 55, y: 60 }, { label: "Gonads", x: 50, y: 80 },
    ],
    crossSectionTitle: "Pituitary – Coronal MRI",
    crossSectionLevel: "Sella Turcica",
    crossSectionDescription: "Coronal T1 gadolinium-enhanced MRI through the sella turcica showing the pituitary gland, optic chiasm above, cavernous sinuses laterally, and sphenoid sinus below.",
    ctNote: "CT: bony sella assessment, calcification in craniopharyngioma. Not ideal for pituitary soft tissue.",
    mriNote: "MRI gadolinium: gold standard for pituitary adenomas. Microadenoma <10mm = hypointense on T1 post-gad. Macroadenoma >10mm may compress optic chiasm (bitemporal hemianopia).",
    structures: [
      {
        id: "pituitary",
        name: "Pituitary Gland",
        description: "The pituitary gland (0.5g) lies in the sella turcica of the sphenoid bone, connected to the hypothalamus by the pituitary stalk (infundibulum). Anterior lobe (adenohypophysis, 80%): derived from Rathke's pouch (oral ectoderm). Posterior lobe (neurohypophysis): from neuroectoderm.",
        clinicalPoints: [
          "Prolactinoma: most common pituitary adenoma; galactorrhoea + amenorrhoea in women; impotence + gynaecomastia in men → dopamine agonists (cabergoline) first line",
          "Acromegaly: GH-secreting macroadenoma in adults; gigantism in children (before epiphyseal fusion)",
          "Cushing's disease: ACTH-secreting adenoma → bilateral adrenal hyperplasia → hypercortisolism (moon face, buffalo hump, purple striae)",
          "Craniopharyngioma: derived from Rathke's pouch remnants; calcified ('crankshaft' pattern); suprasellar mass; bitemporal hemianopia",
          "Sheehan's syndrome: pituitary necrosis from massive post-partum haemorrhage (anterior lobe sensitive; posterior usually spared)",
          "Diabetes Insipidus: posterior pituitary failure or ADH resistance → large volumes dilute urine + hypernatraemia",
        ],
        studyNotes: "Anterior pituitary hormones: GH-FLAT-P (GH, FSH, LH, ACTH, TSH, Prolactin). All peptides except steroids from adrenal (regulated by ACTH). Portal blood supply carries hypothalamic releasing hormones. Posterior lobe stores (does not produce) ADH + Oxytocin — made in supraoptic and paraventricular nuclei of hypothalamus.",
        quiz: [
          { q: "The most common type of pituitary adenoma is:", options: ["GH-secreting adenoma", "ACTH-secreting adenoma", "Prolactinoma", "TSH-secreting adenoma"], correct: 2, explanation: "Prolactinoma (30–40% of all pituitary tumours). First-line treatment is medical: dopamine agonists (cabergoline), which shrink the tumour." },
          { q: "ADH (vasopressin) is PRODUCED by which structure?", options: ["Posterior pituitary", "Anterior pituitary", "Hypothalamic SON/PVN nuclei", "Adrenal cortex"], correct: 2, explanation: "ADH is produced in hypothalamic supraoptic (SON) and paraventricular (PVN) nuclei, stored and released from the posterior pituitary. Posterior pituitary damage causes central DI." },
          { q: "Bitemporal hemianopia in pituitary macroadenoma results from compression of:", options: ["Optic nerve", "Optic chiasm", "Optic tract", "Lateral geniculate body"], correct: 1, explanation: "The optic chiasm lies just above the pituitary fossa. A macroadenoma compresses the decussating nasal fibres → loss of temporal visual fields bilaterally = bitemporal hemianopia ('tunnel vision')." },
        ],
        labels: [
          { id: "ant-pituitary", name: "Anterior Lobe", pos: [0, 0.1, 0.5], description: "Adenohypophysis. Secretes GH, TSH, ACTH, FSH, LH, Prolactin. Rathke's pouch origin.", layer: "organ" },
          { id: "post-pituitary", name: "Posterior Lobe", pos: [0, -0.25, 0.5], description: "Neurohypophysis. Stores/releases ADH + Oxytocin. Appears bright on T1 MRI (phospholipids).", layer: "organ" },
          { id: "infundibulum", name: "Pituitary Stalk", pos: [0, 0.5, 0.5], description: "Connects hypothalamus to pituitary. Portal vessels carry hypothalamic hormones to anterior pituitary.", layer: "vessel" },
          { id: "optic-chiasm", name: "Optic Chiasm", pos: [0, 0.9, 0.5], description: "Lies superior to pituitary stalk. Compression → bitemporal hemianopia (nasal fibres decussate here).", clinicalNote: "First sign of enlarging pituitary mass", layer: "nerve" },
        ],
        mnemonics: [
          { mnemonic: "GH-FLAT-P", meaning: "Growth Hormone, FSH, LH, ACTH, TSH, Prolactin = 6 anterior pituitary hormones", tip: "Prolactin is unique: inhibited by dopamine (not stimulated). All others are stimulated by hypothalamic releasing hormones." },
          { mnemonic: "SODA ADH: Supraoptic = Osmoreceptors, Diuretic (ADH); PVN makes Oxytocin", meaning: "Supraoptic nucleus (SON): ADH production (osmoreceptors). Paraventricular nucleus (PVN): Oxytocin production", tip: "Both stored in posterior pituitary — but MADE in hypothalamus" },
        ],
        relations: [
          "Superior: optic chiasm → macroadenoma → bitemporal hemianopia",
          "Lateral: cavernous sinuses (CN III, IV, V1, V2, VI, + ICA)",
          "Inferior: sphenoid sinus — approach for trans-sphenoidal surgery",
          "Posterior: dorsum sellae + basilar artery",
          "Surrounded by: sella turcica (Turkish saddle) of sphenoid bone",
        ],
        bloodSupply: "Superior hypophyseal arteries (anterior lobe via portal system) + inferior hypophyseal arteries (posterior lobe). No BBB in anterior lobe. Pituitary apoplexy: haemorrhage/infarction — sudden severe headache.",
        nerveSupply: "Posterior lobe: hypothalamo-hypophyseal tract (axons of SON/PVN neurons). Autonomic fibres from sympathetic carotid plexus.",
      },
      {
        id: "thyroid",
        name: "Thyroid Gland",
        description: "The thyroid gland (25g) lies in the anterior neck at C5–T1, consisting of two lateral lobes connected by an isthmus (over tracheal rings 2–3). A pyramidal lobe (Lalouette's lobe) projects superiorly in 50% of people. It secretes T3, T4 (metabolic regulation), and Calcitonin (calcium homeostasis from parafollicular C cells).",
        clinicalPoints: [
          "Graves' disease: autoimmune (TSH receptor stimulating antibodies); exophthalmos, pretibial myxoedema, thyroid acropachy, bruit",
          "Hashimoto's thyroiditis: autoimmune destruction → hypothyroidism; anti-TPO + anti-thyroglobulin antibodies; goitre (rubbery)",
          "Thyroid cancer: Papillary (80%, psammoma bodies, lymphatic spread, best prognosis), Follicular (haematogenous), Medullary (calcitonin, MEN2A/2B), Anaplastic (worst)",
          "Thyroglossal cyst: midline neck, moves upward on tongue protrusion (attached to hyoid via thyroglossal duct remnant)",
          "Recurrent laryngeal nerve (RLN): at risk during thyroidectomy; lies in tracheoesophageal groove; damage → hoarseness",
          "Hypoparathyroidism after thyroidectomy: inadvertent removal of parathyroids → hypocalcaemia → tetany + Chvostek's + Trousseau's signs",
        ],
        studyNotes: "T4 is the prohormone (thyroxine); T3 is the active hormone (3× more potent). Peripheral conversion of T4→T3 by 5'-deiodinase. PTU blocks synthesis + conversion; carbimazole blocks synthesis only. Both inhibit thyroid peroxidase (TPO). Beta-blockers block peripheral effects of thyroid hormones (good for immediate symptom control).",
        quiz: [
          { q: "Which thyroid cancer has the BEST prognosis?", options: ["Anaplastic", "Medullary", "Follicular", "Papillary"], correct: 3, explanation: "Papillary thyroid carcinoma: 10-year survival >90%. Contains psammoma bodies. Spreads via lymphatics. Associated with previous radiation exposure. BRAF mutation (60%)." },
          { q: "Anti-TPO antibodies are characteristic of:", options: ["Graves' disease", "Hashimoto's thyroiditis", "Subacute thyroiditis", "Medullary thyroid cancer"], correct: 1, explanation: "Anti-thyroid peroxidase (anti-TPO) + anti-thyroglobulin = Hashimoto's. Graves' = TSH receptor antibodies (TRAB/TSI — stimulatory)." },
          { q: "The recurrent laryngeal nerve (RLN) is at most risk during which part of thyroidectomy?", options: ["Division of superior thyroid artery", "Division of isthmus", "Ligation of inferior thyroid artery near gland", "Division of middle thyroid vein"], correct: 2, explanation: "The RLN lies close to the inferior thyroid artery in the tracheoesophageal groove. Surgeons ligate the inferior thyroid artery close to the gland (not at the origin) to avoid damaging the RLN." },
        ],
        labels: [
          { id: "right-lobe", name: "Right Lobe", pos: [0.5, 0, 0.5], description: "Lies anterior to trachea, lateral to thyroid and cricoid cartilages.", layer: "organ" },
          { id: "left-lobe", name: "Left Lobe", pos: [-0.5, 0, 0.5], description: "Slightly smaller. RLN in tracheoesophageal groove posterior to left lobe.", layer: "organ" },
          { id: "isthmus", name: "Isthmus", pos: [0, -0.2, 0.5], description: "Connects lobes. Covers tracheal rings 2–3. Divided in thyroidectomy.", layer: "organ" },
          { id: "rln", name: "Recurrent Laryngeal Nerve", pos: [-0.6, -0.4, 0.5], description: "In tracheoesophageal groove. Supplies all laryngeal muscles except cricothyroid. Damage → hoarseness.", clinicalNote: "Most at risk during ligation of inferior thyroid artery", layer: "nerve" },
          { id: "parathyroids", name: "Parathyroid Glands", pos: [0.6, 0.1, 0.5], description: "4 glands (usually) on posterior thyroid capsule. Secrete PTH. At risk during thyroidectomy.", clinicalNote: "Inadvertent removal → hypocalcaemia → tetany", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "GFMT for thyroid cancer prognosis: Good→Fair→Medullary→Terrible", meaning: "Papillary (Good, >90% survival), Follicular (Fair, 70-80%), Medullary (50-60%), Anaplastic/Terrible (<1 year survival)", tip: "MEN2A/2B → Medullary thyroid cancer (calcitonin marker)" },
          { mnemonic: "Graves' GOitre = Go-GOG (Goitre, Ophthalmos, Graves = thyrotoxicosis)", meaning: "Graves' triad: Goitre (diffuse smooth) + Exophthalmos + Pretibial myxoedema; Thyroid acropachy is 4th classic sign", tip: "TSH receptor antibodies (TRAB) stimulate thyroid continuously" },
        ],
        relations: [
          "Anterior: sternothyroid, sternohyoid, strap muscles (infrahyoid), platysma, skin",
          "Posterior: trachea (medial), RLN in tracheoesophageal groove, parathyroids on posterior capsule",
          "Lateral: carotid sheath (common carotid artery, IJV, vagus nerve), sternocleidomastoid",
          "Superior: isthmus/pyramidal lobe → attached to hyoid by fibrous remnant of thyroglossal duct",
          "Inferior: lower lobes → left brachiocephalic vein, trachea enters thorax here",
        ],
        bloodSupply: "Superior thyroid artery (from ECA — first branch) + inferior thyroid artery (from thyrocervical trunk, subclavian). Venous: superior + middle thyroid veins → IJV; inferior thyroid vein → brachiocephalic vein.",
        nerveSupply: "Sympathetic (superior cervical ganglion via carotid plexus). Superior laryngeal nerve (external branch): cricothyroid only → pitch. RLN: all other laryngeal muscles.",
        lymphDrainage: "Upper pole → upper deep cervical nodes. Lower pole → pre/para-tracheal, lower deep cervical. Important for thyroid cancer staging.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. URINARY
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "urinary",
    name: "Urinary System",
    color: "#3b82f6",
    darkColor: "#1e3a8a",
    modelCount: 38,
    icon: "🫘",
    cadavericTitle: "Kidneys – Posterior Abdominal Wall",
    cadavericSide: "Posterior",
    cadavericDescription: "Retroperitoneal position of the kidneys on the posterior abdominal wall. The right kidney lies lower than the left (due to liver). Each kidney is surrounded by perinephric fat within Gerota's fascia.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Urinary_system.svg/500px-Urinary_system.svg.png",
    cadavericAnnotations: [
      { label: "Right Kidney", x: 70, y: 32 }, { label: "Left Kidney", x: 30, y: 28 },
      { label: "Renal Pelvis", x: 65, y: 42 }, { label: "Right Ureter", x: 68, y: 58 },
      { label: "Left Ureter", x: 32, y: 55 }, { label: "Urinary Bladder", x: 50, y: 72 },
      { label: "Urethra", x: 50, y: 85 },
    ],
    crossSectionTitle: "Kidneys – CT (Coronal)",
    crossSectionLevel: "Coronal T12-L3",
    crossSectionDescription: "Coronal CT (venous phase) showing both kidneys, renal pelves, and proximal ureters. The right kidney is slightly lower due to the liver.",
    ctNote: "CT KUB (non-contrast): investigation of choice for renal stones (calcium oxalate hyperdense). CT urogram: haematuria workup.",
    mriNote: "MRI: renal masses (characterise cysts vs solid), avoid in iodine allergy. MR urography for collecting system.",
    structures: [
      {
        id: "kidney",
        name: "Kidney",
        cardLabel: "KIDNEY",
        cardSubtitle: "Section",
        icon: "🫘",
        description: "Bean-shaped retroperitoneal organs (T12–L3). Right kidney is lower than the left (liver pushes it down). Each weighs 150g. The hilum faces anteromedially and contains (anterior to posterior): renal vein, renal artery, renal pelvis (VAP). The renal cortex (outer) contains glomeruli and proximal/distal tubules. The medulla (inner) contains loops of Henle and collecting ducts arranged in pyramids.",
        clinicalPoints: [
          "Renal calculi: calcium oxalate most common (80%), uric acid (radiolucent on plain X-ray, visible on CT), struvite (staghorn, infection-related)",
          "Three narrowings of ureter (sites of stone impaction): PUJ (pelviureteric junction), pelvic brim (where ureter crosses iliac vessels), VUJ (vesicoureteric junction — most common)",
          "Renal cell carcinoma (RCC): classic triad: haematuria + loin pain + loin mass; spreads via renal vein → IVC; paraneoplastic syndromes: polycythaemia (EPO), hypercalcaemia (PTHrP)",
          "Horseshoe kidney: fusion at lower poles; lies in front of L3-L5; increased risk of PUJ obstruction, stones, tumour",
          "Acute kidney injury (AKI): pre-renal (creatinine rises, BUN:creatinine >20:1), renal (intrinsic: ATN — muddy brown casts), post-renal (obstruction)",
          "Nephrotic syndrome: proteinuria >3.5g/day, hypoalbuminaemia, oedema, hyperlipidaemia; causes in children: minimal change disease",
        ],
        studyNotes: "Nephron anatomy: Glomerulus (filtration) → PCT (reabsorbs 65% Na, water, glucose, amino acids) → Loop of Henle (countercurrent multiplication) → DCT (aldosterone-sensitive: Na reabsorption, K secretion) → Collecting duct (ADH-sensitive: water reabsorption). GFR = 125ml/min. Normal creatinine: 60–110 μmol/L.",
        quiz: [
          { q: "Which is the most common site of ureteric stone impaction causing colic?", options: ["Pelviureteric junction (PUJ)", "Pelvic brim crossing iliac vessels", "Vesicoureteric junction (VUJ)", "Mid-ureter"], correct: 2, explanation: "The VUJ (vesicoureteric junction) is the narrowest part of the ureter and is the most common site of stone impaction. The PUJ is the most common site of PUJ obstruction (intrinsic). The pelvic brim is the second narrowing." },
          { q: "The classic triad of renal cell carcinoma is:", options: ["Haematuria + dysuria + frequency", "Haematuria + loin pain + loin mass", "Proteinuria + oedema + hypertension", "Flank pain + fever + pyuria"], correct: 1, explanation: "Classic RCC triad: haematuria + loin pain + loin mass (present together in only 10% of cases = advanced disease). RCC spreads via renal vein to IVC. Paraneoplastic: polycythaemia (EPO), hypercalcaemia (PTHrP)." },
          { q: "The hilum of the kidney contains structures in which order (anterior to posterior)?", options: ["Artery, Vein, Pelvis", "Vein, Artery, Pelvis", "Pelvis, Artery, Vein", "Artery, Pelvis, Vein"], correct: 1, explanation: "VAP = Vein (most anterior), Artery (middle), Pelvis (most posterior). Mnemonic: 'VAPour rises from front to back' at the hilum." },
        ],
        labels: [
          { id: "cortex", name: "Renal Cortex", pos: [0, 0.5, 0.5], description: "Outer region. Contains glomeruli, Bowman's capsule, PCT, DCT. Granular appearance on cut section.", layer: "organ" },
          { id: "medulla", name: "Renal Medulla", pos: [0, 0, 0.5], description: "Inner region. Contains loop of Henle, collecting ducts in pyramids. Striated appearance.", layer: "organ" },
          { id: "renal-pelvis", name: "Renal Pelvis", pos: [0.6, -0.1, 0.5], description: "Funnel-shaped expansion of upper ureter. Formed by major + minor calyces. PUJ = junction with ureter.", clinicalNote: "PUJ obstruction: hydronephrosis", layer: "organ" },
          { id: "renal-artery", name: "Renal Artery", pos: [0.8, 0.2, 0.5], description: "Branch of aorta at L1/L2. Right is longer (crosses IVC). Divides into segmental arteries (5) — end arteries, no anastomosis.", layer: "vessel" },
          { id: "renal-vein", name: "Renal Vein", pos: [0.8, 0.4, 0.5], description: "Drains to IVC. Left renal vein is longer and crosses anterior to aorta (receives left gonadal + suprarenal veins).", clinicalNote: "Left renal vein compression = 'nutcracker syndrome'", layer: "vessel" },
        ],
        mnemonics: [
          { mnemonic: "VAP at the hilum: Vein (anterior), Artery (middle), Pelvis (posterior)", meaning: "Structures at the renal hilum from front to back: Renal Vein, Renal Artery, renal Pelvis", tip: "Same for lymphatics and nerves (accompanying the artery)" },
          { mnemonic: "3 Narrowings of Ureter: PUJ, Pelvic brim, VUJ (= 3 P's: Pelviureteric, Pelvic brim, Pelvovesical)", meaning: "Stones get stuck at PUJ, where ureter crosses iliac vessels (pelvic brim), and VUJ (narrowest)", tip: "VUJ is narrowest = most common stone impaction site" },
        ],
        relations: [
          "Right kidney: liver (anterosuperior), descending duodenum (anteromedial), right colic flexure (anterior), right adrenal (superior)",
          "Left kidney: stomach (anterosuperior), tail of pancreas (anterior), spleen (lateral), descending colon (anterolateral), left adrenal (superior)",
          "Posterior: diaphragm, 12th rib, psoas major (medial), quadratus lumborum (lateral)",
          "Perinephric fat: enclosed in Gerota's (renal) fascia — important barrier for RCC containment",
          "Hilum: faces anteromedially at L1 (right) and L1/L2 (left). Left hilum higher than right.",
        ],
        bloodSupply: "Renal artery (from aorta at L1) → segmental arteries (5, end-arteries, no anastomosis) → lobar → interlobar → arcuate → cortical radiate → afferent arterioles → glomerulus → efferent arterioles → peritubular capillaries + vasa recta.",
        nerveSupply: "Sympathetic (T10-L1) via renal plexus (coeliac + aorticorenal ganglia). Controls blood flow + renin secretion. Afferent pain: T10-L2 → renal/ureteric colic refers to loin-to-groin/testes.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 9. LYMPHATIC
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "lymphatic",
    name: "Lymphatic System",
    color: "#10b981",
    darkColor: "#064e3b",
    modelCount: 29,
    icon: "🫐",
    cadavericTitle: "Spleen – Visceral Surface",
    cadavericSide: "Visceral (Medial)",
    cadavericDescription: "The spleen (200g) lies in the left hypochondrium between the 9th–11th ribs. Its visceral surface shows impressions from the stomach, left kidney, tail of pancreas, and left colic flexure. The splenic hilum transmits splenic vessels and the tail of the pancreas.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Blausen_0623_LymphaticSystem_Female.png/500px-Blausen_0623_LymphaticSystem_Female.png",
    cadavericAnnotations: [
      { label: "Cervical Nodes", x: 50, y: 12 }, { label: "Axillary Nodes", x: 25, y: 32 },
      { label: "Thoracic Duct", x: 52, y: 42 }, { label: "Spleen", x: 30, y: 48 },
      { label: "Inguinal Nodes", x: 42, y: 72 }, { label: "Popliteal Nodes", x: 45, y: 85 },
    ],
    crossSectionTitle: "Spleen – CT Axial",
    crossSectionLevel: "T11-L1",
    crossSectionDescription: "Axial CT (portal venous phase) showing the spleen, its relationship to the left kidney, stomach, and tail of pancreas. Normal spleen should be smaller than the left kidney on axial images.",
    ctNote: "CT: splenic laceration grading (AAST grade I–V). Active bleed = contrast extravasation. Non-contrast: splenic calcification in sickle cell (autosplenectomy).",
    mriNote: "MRI: characterise splenic masses (haemangioma: T2 bright; lymphoma: T2 intermediate). Diffusion-weighted imaging for splenic abscess.",
    structures: [
      {
        id: "spleen",
        name: "Spleen",
        cardLabel: "SPLEEN",
        icon: "🫐",
        description: "The spleen is the largest lymphoid organ (200g in adults, fist-sized). Located in the left hypochondrium (LHC) between the 9th–11th ribs, in the midaxillary line. Has two surfaces: diaphragmatic (smooth) and visceral (shows impressions of surrounding organs). Composed of red pulp (filters blood, destroys old RBCs, stores 1/3 of platelets) and white pulp (lymphoid tissue, immune responses).",
        clinicalPoints: [
          "Splenomegaly: massive (CML, malaria, kala-azar, Gaucher's), moderate (lymphoma, haemolytic anaemia, portal hypertension), mild (viral illness)",
          "Rupture: blunt abdominal trauma (most commonly seat-belt injury, LHC blow). Kaposi-type rupture: delayed (2 weeks) after initial haematoma",
          "Splenic notch: helps clinically distinguish splenomegaly from other LHC masses (palpable notch, moves toward RIF on inspiration)",
          "Hypersplenism: splenomegaly + destruction of blood cells → pancytopenia (splenectomy may be needed)",
          "Post-splenectomy: encapsulated organism sepsis risk (OPSI): Pneumococcus, Haemophilus, Meningococcus — vaccinate + lifelong penicillin prophylaxis",
          "Sickle cell disease: repeated infarctions → autosplenectomy; Howell-Jolly bodies on blood film (nuclear remnants not cleared)",
        ],
        studyNotes: "Splenic trauma is the most common cause of massive intraperitoneal haemorrhage. 1-3-5-7-9-11 rule: 1 inch thick, 3 inches wide, 5 inches long; normally not palpable below 9th rib; found between 9th–11th ribs in MCL; normal weight 7oz (200g).",
        quiz: [
          { q: "Which organisms are the most dangerous after splenectomy?", options: ["Gram-negative rods (E. coli, Klebsiella)", "Encapsulated bacteria (Pneumococcus, H. influenzae, Meningococcus)", "Mycobacteria", "Fungi (Candida, Aspergillus)"], correct: 1, explanation: "Encapsulated bacteria (Streptococcus pneumoniae, Haemophilus influenzae type B, Neisseria meningitidis) cannot be opsonised without splenic function. OPSI (Overwhelming Post-Splenectomy Infection) can be rapidly fatal. Vaccinate + penicillin V prophylaxis." },
          { q: "Howell-Jolly bodies seen on blood film indicate:", options: ["Iron deficiency anaemia", "Vitamin B12 deficiency", "Splenic hypofunction or absence", "Haemolytic anaemia"], correct: 2, explanation: "Howell-Jolly bodies (nuclear remnants in RBCs) are normally removed by the spleen. Their presence indicates splenic hypofunction (sickle cell autosplenectomy, post-splenectomy, coeliac disease with splenic atrophy)." },
        ],
        labels: [
          { id: "red-pulp", name: "Red Pulp", pos: [0.1, 0, 0.5], description: "Filters blood, destroys aged/abnormal RBCs, stores 1/3 of platelets and large numbers of monocytes.", layer: "organ" },
          { id: "white-pulp", name: "White Pulp", pos: [-0.1, 0.2, 0.5], description: "Lymphoid tissue (B and T cells). Immune surveillance and lymphocyte activation against blood-borne antigens.", layer: "organ" },
          { id: "splenic-artery", name: "Splenic Artery", pos: [0.7, 0.3, 0.5], description: "Largest branch of coeliac trunk. Tortuous. Runs along upper border of pancreas. Aneurysm risk (especially pregnancy).", layer: "vessel" },
          { id: "splenic-vein", name: "Splenic Vein", pos: [0.7, -0.1, 0.5], description: "Runs behind the body of pancreas. Joins SMV to form portal vein behind neck of pancreas.", clinicalNote: "Thrombosis → sinistral (left-sided) portal hypertension", layer: "vessel" },
          { id: "splenic-hilum", name: "Splenic Hilum", pos: [0.6, 0.1, 0.5], description: "Where splenic vessels and tail of pancreas enter. Site of lienorenal ligament (attached to left kidney).", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "1-3-5-7-9-11 Rule for Spleen", meaning: "1 inch thick, 3 inches wide, 5 inches long; 7 ounces (200g) weight; 9th–11th ribs in MCL; NOT normally palpable", tip: "Splenomegaly if palpable below left costal margin" },
          { mnemonic: "PHN Vaccine Post-Splenectomy: Pneumococcus, Haemophilus, Neisseria (meningococcus)", meaning: "Post-splenectomy vaccinations to prevent OPSI: pneumococcal, Hib, meningococcal (ABCWY)", tip: "Give 2 weeks BEFORE elective splenectomy. Lifelong penicillin V (250mg BD) prophylaxis." },
        ],
        relations: [
          "Diaphragmatic surface: lies against diaphragm + left pleura (8th–10th ribs laterally, 9th–11th ribs in MCL)",
          "Visceral surface: gastric impression (gastrosplenic ligament), left kidney + adrenal (lienorenal ligament), tail of pancreas (lienorenal lig.), left colic flexure",
          "Ligaments: gastrosplenic (short gastric + left gastroepiploic vessels), lienorenal (splenic vessels + tail of pancreas)",
          "Inferior: phrenicocolic ligament (sustentaculum lienis) supports spleen inferiorly",
          "Clinical: palpated from right iliac fossa toward left hypochondrium (diagonal direction)",
        ],
        bloodSupply: "Splenic artery (from coeliac trunk). Venous: splenic vein → joins SMV to form portal vein behind neck of pancreas at L1.",
        nerveSupply: "Sympathetic (T6-T10) via coeliac plexus. Parasympathetic: vagus nerve. Pain referred to left shoulder (Kehr's sign) if blood irritates left diaphragm.",
        lymphDrainage: "Hilar lymph nodes → coeliac nodes → cisterna chyli. Spleen drains lymph produced within itself → lymph nodes at hilum.",
      },
      {
        id: "head-lymphatics",
        name: "Head Lymphatics",
        regions: ["head"],
        cardLabel: "HEAD",
        cardSubtitle: "Lymphatic System",
        icon: "🫧",
        description: "The lymphatic drainage of the head and neck is clinically vital — it is the most common site of lymph node enlargement and cancer metastasis. Lymph from the head, face, and scalp drains through regional node groups arranged in a 'pericervical collar' and then into the deep cervical chain.",
        clinicalPoints: [
          "Pericervical collar (from anterior to posterior): submental → submandibular → preauricular (parotid) → postauricular (mastoid) → occipital nodes",
          "All lymph from head and neck ultimately drains into the deep cervical chain (along IJV) and then into the thoracic duct (left) or right lymphatic duct (right)",
          "Virchow's node (Troisier's sign): enlarged left supraclavicular node = metastasis from abdominal/thoracic malignancy (especially gastric cancer)",
          "Waldeyer's ring: lymphoid ring at oropharyngeal inlet — palatine tonsils, nasopharyngeal tonsil (adenoids), lingual tonsil, tubal tonsils; site of lymphoma",
          "Cervical lymphadenopathy: reactive (infection, EBV), TB (most common worldwide cause of cervical LAD), lymphoma, metastatic carcinoma (head/neck primary vs. below clavicle)",
          "Level classification (I–VII) used in oncology to map neck dissection: I (submental/submandibular), II-IV (deep cervical), V (posterior triangle), VI (central compartment)",
        ],
        studyNotes: "For MCQs: oral cavity → submandibular nodes; nasopharynx → retropharyngeal + upper deep cervical; thyroid → paratracheal + pretracheal (central compartment, level VI); scalp → pericervical collar. Sentinel node biopsy: first node in drainage path.",
        quiz: [
          { q: "Virchow's node (Troisier's sign) is located where and indicates metastasis from where?", options: ["Right supraclavicular, head and neck cancer", "Left supraclavicular, abdominal/thoracic malignancy", "Submental, oral cancer", "Axillary, breast cancer"], correct: 1, explanation: "Virchow's node (left supraclavicular node) receives lymphatic drainage from the thoracic duct. Enlargement suggests metastatic malignancy — classically gastric carcinoma, but also lung, oesophageal, or other abdominal cancers. This is Troisier's sign." },
          { q: "Which lymphoid ring guards the oropharyngeal inlet?", options: ["Peyer's patches", "Waldeyer's ring", "MALT (gut-associated)", "Mediastinal lymphoid tissue"], correct: 1, explanation: "Waldeyer's ring is the ring of lymphoid tissue surrounding the oro- and nasopharyngeal inlet: palatine tonsils (largest), pharyngeal tonsil (adenoids), lingual tonsil (base of tongue), and tubal tonsils (around Eustachian tube opening). It is the first line of defence against inhaled/ingested pathogens." },
        ],
        labels: [
          { id: "submandibular-nodes", name: "Submandibular Nodes", pos: [0.5, -0.2, 0.7], description: "Drain floor of mouth, anterior tongue, cheek, lower lip, and submandibular gland. Clinically palpable below lower border of mandible.", layer: "organ" },
          { id: "deep-cervical", name: "Deep Cervical Chain", pos: [0.6, -0.4, 0.3], description: "Along IJV. Final common pathway for all head/neck lymph. Upper (jugulodigastric — drains tonsil) and lower (jugulo-omohyoid — drains tongue) are key nodes.", clinicalNote: "Jugulodigastric node: most commonly enlarged in tonsillitis", layer: "organ" },
          { id: "parotid-nodes", name: "Parotid/Preauricular Nodes", pos: [0.8, 0.1, 0.5], description: "Drain scalp (anterior), eyelids, external acoustic meatus, and parotid gland itself. Superficial + deep.", layer: "organ" },
          { id: "occipital-nodes", name: "Occipital Nodes", pos: [-0.1, 0.2, -0.9], description: "At the apex of the posterior triangle, posterior scalp drainage. Enlarge in scalp infections (tinea capitis, pediculosis capitis).", layer: "organ" },
        ],
        bloodSupply: "Lymphatic capillaries and vessels have no separate blood supply — they derive nutrients from surrounding tissue.",
        nerveSupply: "Lymphatic vessels contain smooth muscle (autonomic tone). Lymph node capsule: somatic sensation via regional cutaneous nerves.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10. REPRODUCTIVE
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "reproductive",
    name: "Reproductive System",
    color: "#ec4899",
    darkColor: "#831843",
    modelCount: 55,
    icon: "🧬",
    cadavericTitle: "Female Pelvic Organs – Sagittal Section",
    cadavericSide: "Sagittal",
    cadavericDescription: "Sagittal section of the female pelvis showing the uterus (anteverted, anteflexed), cervix, vagina, bladder (anterior), and rectum (posterior). The pouch of Douglas (rectouterine pouch) is the most dependent part of the peritoneal cavity in females.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Female_reproductive_system_lateral_nolabels.svg/500px-Female_reproductive_system_lateral_nolabels.svg.png",
    cadavericAnnotations: [
      { label: "Uterus", x: 42, y: 38 }, { label: "Cervix", x: 45, y: 55 },
      { label: "Vagina", x: 48, y: 68 }, { label: "Bladder", x: 28, y: 42 },
      { label: "Rectum", x: 65, y: 52 }, { label: "Ovary", x: 28, y: 32 },
      { label: "Fallopian Tube", x: 22, y: 28 },
    ],
    crossSectionTitle: "Pelvis – MRI Sagittal (Female)",
    crossSectionLevel: "Midline Sagittal",
    crossSectionDescription: "T2-weighted sagittal MRI of female pelvis showing the uterus, cervix, vaginal vault, bladder, and rectum. T2 is ideal for uterine zonal anatomy: endometrium (hyperintense), junctional zone (dark), myometrium (intermediate).",
    ctNote: "CT: pelvic masses (ovarian cysts, fibroids), lymph node staging for gynaecological cancers.",
    mriNote: "MRI T2: gold standard for uterine anatomy, endometrial carcinoma staging, fibroid characterisation. Cervical cancer staging: MRI shows parametrial invasion.",
    structures: [
      {
        id: "uterus",
        name: "Uterus",
        cardLabel: "UROGENITAL SYSTEM",
        cardSubtitle: "Female",
        icon: "🧬",
        description: "The uterus is a thick-walled, pear-shaped muscular organ lying in the lesser pelvis between the bladder (anteriorly) and rectum (posteriorly). Normally anteverted (body tilted forward relative to vagina) and anteflexed (body bent forward on itself). Parts: fundus (above fallopian tube insertions), body (corpus, main part), isthmus (narrow junction between body and cervix), cervix (projects into vagina as the portio vaginalis/ectocervix).",
        clinicalPoints: [
          "Uterine artery crosses ABOVE the ureter ('water under the bridge') at the lateral fornix → risk of ureteric injury during hysterectomy",
          "Fibroids (leiomyomas): most common tumour in women; oestrogen-sensitive; types: submucosal (heaviest bleeding), intramural, subserosal",
          "Endometriosis: ectopic endometrium; 'chocolate cysts' (endometrioma) of ovary; CA-125 elevated; laparoscopy for diagnosis",
          "Endometrial carcinoma: most common gynaecological malignancy in developed countries; Type 1 (endometrioid, oestrogen-related); presents with postmenopausal bleeding",
          "Cervical cancer: HPV 16 (50%) + HPV 18 (20%) → squamous cell carcinoma at transformation zone; Pap smear screening",
          "Pouch of Douglas (rectouterine pouch): most dependent part of peritoneal cavity → first site of fluid/blood collection; drained via colpotomy",
        ],
        studyNotes: "Uterine ligaments: Broad ligament (contains uterine tube, round ligament, ovarian ligament, uterine vessels, ureter); Round ligament (keeps uterus anteverted); Cardinal (Mackenrodt's) ligament (most important support, prevents prolapse); Uterosacral ligament (pulls cervix posterosuperiorly). 'RUCM' for the four ligaments.",
        quiz: [
          { q: "The uterine artery crosses which structure at the base of the broad ligament?", options: ["Ovarian artery", "Ureter", "Uterine vein", "Pudendal nerve"], correct: 1, explanation: "'Water under the bridge' — the ureter runs under the uterine artery at the lateral fornix/parametrium. Critical during hysterectomy: if ureter not identified, it can be clamped or cut with the uterine artery, causing ureteric injury." },
          { q: "Which type of uterine fibroid causes the most severe menorrhagia?", options: ["Subserosal fibroid", "Intramural fibroid", "Submucosal fibroid", "Pedunculated fibroid"], correct: 2, explanation: "Submucosal fibroids distort the endometrial cavity and interfere with normal haemostasis during menstruation, causing the heaviest bleeding. They can also cause recurrent miscarriage." },
          { q: "The most common histological type of cervical cancer is:", options: ["Adenocarcinoma", "Squamous cell carcinoma", "Clear cell carcinoma", "Sarcoma"], correct: 1, explanation: "Squamous cell carcinoma (80%) arises at the transformation zone (squamocolumnar junction). Adenocarcinoma (15-20%) is increasing in incidence. HPV 16 and 18 are responsible for 70% of cervical cancers." },
        ],
        labels: [
          { id: "fundus-ut", name: "Fundus", pos: [0, 0.7, 0.5], description: "Dome-shaped top of uterus above the fallopian tube insertions. Palpable above symphysis pubis during pregnancy.", layer: "organ" },
          { id: "body-ut", name: "Body (Corpus)", pos: [0, 0.2, 0.5], description: "Main part. Three layers: endometrium (inner), myometrium (thick muscle), perimetrium (outer peritoneum).", layer: "organ" },
          { id: "cervix", name: "Cervix", pos: [0, -0.4, 0.5], description: "Lower cylindrical segment. Ectocervix (portio vaginalis): covered by squamous epithelium. Transformation zone (T-zone): junction — site of cervical cancer.", clinicalNote: "Pap smear samples the transformation zone", layer: "organ" },
          { id: "uterine-artery", name: "Uterine Artery", pos: [0.6, 0, 0.5], description: "Branch of internal iliac artery. Crosses ABOVE the ureter at lateral fornix. Main blood supply to uterus.", clinicalNote: "Key surgical landmark — 'water under the bridge'", layer: "vessel" },
          { id: "fallopian", name: "Fallopian Tube", pos: [0.8, 0.7, 0.5], description: "4 parts: isthmus (narrowest — ectopic pregnancy commonest here), ampulla (widest — fertilisation site), infundibulum (with fimbriae), interstitial.", clinicalNote: "Ectopic pregnancy: most common in ampulla; risk factors: PID, previous ectopic, IUD", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "Water under the bridge = Ureter under Uterine artery", meaning: "At the base of the broad ligament, the ureter (water) passes UNDER the uterine artery (bridge) — critical surgical anatomy", tip: "Risk: inadvertent ligation of ureter during hysterectomy → ureteric injury + urinoma" },
          { mnemonic: "RUCM ligaments: Round (anteverted), Uterosacral (pulls cervix back), Cardinal = main support, Mackenrodt (Cardinal)", meaning: "Uterine ligaments: Round ligament maintains anteversion; Cardinal (Mackenrodt's) = most important for preventing uterine prolapse; Uterosacral = pulls cervix posterosuperiorly", tip: "Defective cardinal ligament → uterine prolapse (descent through vaginal introitus)" },
        ],
        relations: [
          "Anterior: utero-vesical pouch + bladder; peritoneum folds at isthmus level",
          "Posterior: pouch of Douglas (rectouterine pouch — most dependent part), sigmoid colon, rectum",
          "Lateral: broad ligament (double peritoneal fold), uterine vessels, ureter (2cm lateral to cervix)",
          "Superior: loops of small intestine (when uterus normal size) or palpable abdominally (pregnant/fibroid)",
          "Inferior: cervix projects into vagina as portio vaginalis; surrounded by fornices (posterior fornix deepest)",
        ],
        bloodSupply: "Uterine artery (from internal iliac) — anastomoses with ovarian artery at the cornua. Cervix + vagina: vaginal artery (from internal iliac). Venous: uterine venous plexus → internal iliac vein.",
        nerveSupply: "Sympathetic (T10–L2) via uterovaginal plexus (Lee-Frankenhauser plexus) at uterosacral ligament. Parasympathetic (S2–S4). Pain from body of uterus: T10-T12; cervix: S2-S4.",
        lymphDrainage: "Body of uterus + cervix → external and internal iliac nodes → para-aortic nodes. Fundus → para-aortic nodes directly (via ovarian vessels) + superficial inguinal nodes (via round ligament).",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 11. SPECIAL SENSES (Sense Organs)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "sensory",
    name: "Sense Organs",
    color: "#14b8a6",
    darkColor: "#134e4a",
    modelCount: 12,
    icon: "👁️",
    cadavericTitle: "Orbit — Sagittal Section",
    cadavericSide: "Sagittal",
    cadavericDescription: "The orbit is a bony pyramid containing the eyeball, extraocular muscles, optic nerve, lacrimal apparatus, and orbital fat. Seven bones form the orbital walls. The optic canal transmits CN II and the ophthalmic artery. The superior orbital fissure (SOF) transmits CN III, IV, V1, VI, and sympathetic fibres.",
    cadavericImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/500px-Schematic_diagram_of_the_human_eye_en.svg.png",
    cadavericAnnotations: [
      { label: "Cornea", x: 52, y: 48 }, { label: "Iris", x: 48, y: 50 },
      { label: "Lens", x: 55, y: 50 }, { label: "Retina", x: 72, y: 50 },
      { label: "Optic Nerve", x: 80, y: 52 }, { label: "Vitreous", x: 65, y: 50 },
    ],
    crossSectionTitle: "Orbit — Axial CT",
    crossSectionLevel: "Level of optic nerve",
    crossSectionDescription: "Axial CT of the orbits showing the eyeballs, optic nerves, lateral and medial rectus muscles, and optic canals. The optic nerve shows a 'target sign' in optic nerve sheath meningioma.",
    ctNote: "CT orbit: blow-out fracture (inferior wall most common — 'trapdoor'). Orbital cellulitis with subperiosteal abscess: CT with IV contrast essential.",
    mriNote: "MRI: optic neuritis (T2 bright, enhancing optic nerve), orbital tumours, extraocular muscle disease (thyroid eye disease: belly enlargement, sparing tendons).",
    structures: [
      {
        id: "eye",
        name: "Eye",
        regions: ["head"],
        cardLabel: "EYE",
        cardSubtitle: "",
        icon: "👁️",
        description: "The eye (globe) is a spherical organ approximately 2.5 cm in diameter. It has three coats: fibrous (sclera + cornea), vascular (uvea: choroid + ciliary body + iris), and neural (retina). The lens focuses light onto the fovea centralis of the retina — the area of highest visual acuity.",
        clinicalPoints: [
          "Retinal detachment: painless visual loss, 'curtain coming down', floaters + flashes — retinal break allows vitreous to track under retina",
          "Glaucoma: raised IOP → optic disc cupping → visual field loss (peripheral first). Acute angle-closure: severe pain, red eye, fixed mid-dilated pupil, nausea",
          "Cataract: lens opacity → blurred vision, glare. Most common cause of reversible blindness worldwide; managed with phacoemulsification",
          "Papilloedema (bilateral disc swelling): raised ICP — haemorrhages, exudates, blurred disc margins on fundoscopy",
          "Diabetic retinopathy: background (microaneurysms, dot haemorrhages) → proliferative (neovascularisation) → vitreous haemorrhage/traction detachment",
          "Corneal reflex: afferent CN V1 (nasociliary branch), efferent CN VII (orbicularis oculi) — tests brainstem in comatose patients",
        ],
        studyNotes: "Visual pathway for MCQs: retina → optic nerve → optic chiasm (nasal fibres cross) → optic tract → LGN of thalamus → optic radiation → primary visual cortex (V1, calcarine sulcus). Lesions: monocular blindness (optic nerve), bitemporal hemianopia (chiasm/pituitary), homonymous hemianopia (optic tract/radiation/cortex).",
        quiz: [
          { q: "A pituitary macroadenoma compresses the optic chiasm from below. What visual field defect results?", options: ["Right homonymous hemianopia", "Bitemporal hemianopia", "Left monocular blindness", "Right superior quadrantanopia"], correct: 1, explanation: "The optic chiasm contains crossing nasal fibres (which carry temporal visual field from each eye). Compression from below (pituitary tumour) disrupts these crossing fibres first → bitemporal hemianopia (tunnel vision, loss of the outer/temporal fields of both eyes)." },
          { q: "Acute angle-closure glaucoma presents with:", options: ["Gradual bilateral visual field loss + cup:disc ratio >0.7", "Sudden severe eye pain, red eye, fixed mid-dilated pupil, nausea", "Painless floaters and flashes with 'curtain' visual loss", "Bilateral disc swelling with haemorrhages"], correct: 1, explanation: "Acute angle-closure glaucoma: sudden-onset severe periorbital pain, red eye, fixed mid-dilated pupil (iris ischaemia), corneal clouding (oedema), nausea/vomiting. Emergency treatment: pilocarpine (miosis to open angle) + acetazolamide + laser peripheral iridotomy." },
        ],
        labels: [
          { id: "cornea", name: "Cornea", pos: [0.0, 0.0, 1.1], description: "Transparent avascular layer — provides 2/3 of refractive power. Nourished by aqueous humour + tears. Rich sensory supply (CN V1 nasociliary).", clinicalNote: "Corneal ulcer: dendritic (HSV), geographic. Fluorescein stain under blue light", layer: "organ" },
          { id: "iris", name: "Iris", pos: [0.0, 0.0, 0.9], description: "Pigmented diaphragm with central aperture (pupil). Sphincter pupillae (constriction, CN III parasympathetic) and dilator pupillae (dilation, sympathetic).", clinicalNote: "Irregular pupil + anterior chamber cells: uveitis (iritis)", layer: "organ" },
          { id: "lens", name: "Lens", pos: [0.0, 0.0, 0.7], description: "Biconvex, avascular, transparent. Accommodation (CN III → ciliary muscle → zonule relaxation → lens becomes more convex). Presbyopia after 40yrs.", clinicalNote: "Cataract types: nuclear (myopic shift), cortical, posterior subcapsular (steroids, DM)", layer: "organ" },
          { id: "retina", name: "Retina", pos: [0.0, 0.0, -0.5], description: "Innermost neural layer. Rods (periphery, low light) and cones (fovea, colour, high acuity). Fovea centralis = point of highest acuity.", clinicalNote: "Retinal detachment: urgent — rhegmatogenous (break) most common", layer: "nerve" },
          { id: "optic-disc", name: "Optic Disc", pos: [0.3, 0.1, -0.6], description: "Exit of optic nerve from eye. 'Blind spot' — no photoreceptors. Cup:disc ratio normally <0.5; >0.7 suggests glaucoma.", clinicalNote: "Papilloedema: bilateral disc swelling from raised ICP; must exclude SOL", layer: "nerve" },
        ],
        mnemonics: [
          { mnemonic: "Visual field defects by lesion location: 'One eye → optic nerve; Both temporal → chiasm; Same side → tract/radiation/cortex'", meaning: "Optic nerve: ipsilateral monocular blindness. Chiasm: bitemporal hemianopia. Post-chiasmal: homonymous hemianopia (contralateral fields lost)", tip: "Pituitary tumour = chiasm (bitemporal). Stroke = post-chiasmal (homonymous)" },
        ],
        bloodSupply: "Ophthalmic artery (first branch of ICA in skull). Central retinal artery (CRA): end artery — occlusion → sudden, painless, complete monocular blindness (retina appears white, cherry-red spot at fovea). Choroid: posterior ciliary arteries.",
        nerveSupply: "CN II (optic): vision afferent. CN III: superior, inferior, medial rectus, inferior oblique, LPS; parasympathetic (pupil constriction, accommodation). CN IV: superior oblique. CN VI: lateral rectus. CN V1: sensory (nasociliary branch).",
      },
      {
        id: "ear",
        name: "Ear",
        regions: ["head"],
        cardLabel: "EAR",
        cardSubtitle: "",
        icon: "👂",
        description: "The ear comprises three parts: external (auricle + external acoustic meatus + tympanic membrane), middle (tympanic cavity with ossicles: malleus, incus, stapes), and inner (cochlea for hearing + semicircular canals for balance). Sound waves → tympanic membrane → ossicles → oval window → cochlea → CN VIII.",
        clinicalPoints: [
          "Otitis media (middle ear infection): most common in children; bulging red tympanic membrane; may cause conductive hearing loss; complications: mastoiditis, meningitis, facial nerve palsy",
          "Conductive hearing loss: problem in external or middle ear. Weber: lateralises to AFFECTED side. Rinne: BC > AC (Rinne negative = conductive)",
          "Sensorineural hearing loss (SNHL): cochlea or CN VIII. Weber: lateralises to UNAFFECTED side. Rinne: AC > BC (positive) in both ears but reduced bilaterally",
          "Acoustic neuroma (vestibular schwannoma): CN VIII at CP angle — unilateral SNHL + tinnitus + vertigo. Associated with NF2",
          "Presbycusis: age-related SNHL, bilateral, high frequency first. Most common cause of SNHL in elderly",
          "Battle's sign: bruising behind ear over mastoid process → petrous temporal bone fracture. CSF otorrhoea if tympanic membrane perforated",
        ],
        studyNotes: "Ossicles: Malleus (handle attached to TM), Incus (bridges), Stapes (footplate in oval window). Stapedius (CN VII) and tensor tympani (V3) dampen loud sounds. CN VII passes through middle ear — parotid surgery + middle ear disease risks CN VII palsy. Meniere's disease triad: episodic vertigo + tinnitus + SNHL.",
        quiz: [
          { q: "Weber test lateralises to the RIGHT ear. Rinne test is NEGATIVE (BC > AC) on the RIGHT. What type of hearing loss does the patient have?", options: ["Sensorineural hearing loss, right", "Conductive hearing loss, right", "Sensorineural hearing loss, left", "Mixed hearing loss, bilateral"], correct: 1, explanation: "Weber lateralises to the AFFECTED side in conductive hearing loss (because bone conduction bypasses the blocked external/middle ear pathway, giving better perception of the vibrating tuning fork). Rinne negative (BC > AC) on the right confirms right conductive hearing loss." },
          { q: "A 35-year-old has unilateral sensorineural hearing loss, tinnitus, and vertigo. MRI shows a mass at the cerebellopontine angle. Most likely diagnosis?", options: ["Meningioma", "Acoustic neuroma (vestibular schwannoma)", "Cholesteatoma", "Epidermoid cyst"], correct: 1, explanation: "Acoustic neuroma (vestibular schwannoma) is a Schwann cell tumour of CN VIII (vestibular division), located at the cerebellopontine angle. Classic triad: unilateral SNHL + tinnitus + vertigo. Bilateral acoustic neuromas = NF2. Treatment: surgery or stereotactic radiosurgery (Gamma Knife)." },
        ],
        labels: [
          { id: "tympanic-membrane", name: "Tympanic Membrane", pos: [0.8, 0.0, 0.5], description: "Ear drum: separates EAM from middle ear. 3 layers (epithelium, fibrous, mucosa). Cone of light reflected at 5 o'clock (right ear). Perforated = conductive deafness.", clinicalNote: "Otoscopy: light reflex absent + bulging = otitis media; pearly white keratin mass = cholesteatoma", layer: "organ" },
          { id: "ossicles", name: "Ossicular Chain", pos: [0.6, 0.05, 0.4], description: "Malleus (handle on TM), Incus (bridge), Stapes (footplate on oval window). Amplify sound 22× and impedance-match air to fluid.", clinicalNote: "Otosclerosis: stapes fixation → conductive hearing loss in young adults", layer: "bone" },
          { id: "cochlea", name: "Cochlea", pos: [0.5, -0.2, 0.2], description: "2.5 spiral turns. 3 fluid-filled chambers: scala vestibuli (perilymph), scala media (endolymph, high K+), scala tympani (perilymph). Organ of Corti = transducer (inner hair cells).", clinicalNote: "Cochlear implant: direct electrical stimulation of cochlear nerve for severe SNHL", layer: "organ" },
          { id: "semicircular-canals", name: "Semicircular Canals", pos: [0.4, 0.2, 0.1], description: "3 canals (superior, posterior, lateral) — detect angular acceleration. Ampullae contain cupula + hair cells. BPPV: calcium crystals in posterior canal.", clinicalNote: "BPPV: Epley manoeuvre — repositions otoliths from posterior canal", layer: "organ" },
          { id: "eustachian-tube", name: "Eustachian Tube", pos: [0.5, -0.1, 0.6], description: "Connects middle ear to nasopharynx. Opens on swallowing/yawning to equalise pressure. Lined by ciliated respiratory epithelium.", clinicalNote: "Dysfunction → glue ear (otitis media with effusion) in children", layer: "organ" },
        ],
        mnemonics: [
          { mnemonic: "Ossicles: Malleus → Incus → Stapes (MIS — Most Inside Smallest)", meaning: "Handle of Malleus is attached to TM; Stapes footplate sits in oval window; Incus (anvil) bridges them", tip: "Stapes (stirrup) is the smallest bone in the body" },
          { mnemonic: "Weber + Rinne for Conductive Hearing Loss: 'Weber to the BAD ear, Rinne Negative'", meaning: "Conductive: Weber lateralises to affected side; Rinne negative (BC > AC). SNHL: Weber to good ear; Rinne positive both (but reduced)", tip: "Rinne positive = normal (AC > BC). Negative = conductive loss on that side" },
        ],
        bloodSupply: "Labyrinthine (internal auditory) artery from AICA (anterior inferior cerebellar artery). End artery — occlusion → sudden deafness + vestibular loss (labyrinthine infarction).",
        nerveSupply: "CN VIII: cochlear division (hearing), vestibular division (balance). CN VII passes through middle ear in facial canal — at risk in middle ear disease/surgery.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────
export function getSystem(id: string): AnatomySystem | undefined {
  return ANATOMY_SYSTEMS.find(s => s.id === id);
}

export function getStructure(systemId: string, structureId: string): AnatomyStructure | undefined {
  return getSystem(systemId)?.structures.find(s => s.id === structureId);
}

export function searchStructures(query: string): Array<{ system: AnatomySystem; structure: AnatomyStructure }> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: Array<{ system: AnatomySystem; structure: AnatomyStructure }> = [];
  for (const system of ANATOMY_SYSTEMS) {
    for (const structure of system.structures) {
      const matches =
        structure.name.toLowerCase().includes(q) ||
        structure.description.toLowerCase().includes(q) ||
        structure.clinicalPoints.some(p => p.toLowerCase().includes(q)) ||
        structure.labels.some(l => l.name.toLowerCase().includes(q)) ||
        structure.mnemonics?.some(m => m.mnemonic.toLowerCase().includes(q) || m.meaning.toLowerCase().includes(q));
      if (matches) results.push({ system, structure });
    }
  }
  return results;
}

export function getAllStructures(): Array<{ system: AnatomySystem; structure: AnatomyStructure }> {
  return ANATOMY_SYSTEMS.flatMap(system =>
    system.structures.map(structure => ({ system, structure }))
  );
}
