import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

const gameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 40,
  message: { error: "Too many game requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const ALL_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine",
  "Internal Medicine", "Surgery", "Obstetrics & Gynecology",
  "Pediatrics", "Ophthalmology", "ENT", "Orthopedics",
  "Psychiatry", "Community Medicine", "Dermatology",
];

const DIFFICULTY_LEVELS = ["foundation", "clinical", "neet-pg"];

// ── Per-subject topic pools ────────────────────────────────────────────────────
// A random topic is injected into every prompt so the AI generates a different
// question each time rather than defaulting to the same common examples.
const TOPIC_POOL: Record<string, string[]> = {
  "Anatomy": [
    "brachial plexus injuries and clinical correlations",
    "venous sinuses of the dura mater and cavernous sinus syndrome",
    "lymphatic drainage of breast and axillary lymph nodes",
    "inguinal canal, deep and superficial ring, hernia types",
    "femoral triangle, femoral sheath contents and femoral hernia",
    "portal-systemic anastomoses and portosystemic shunts",
    "circle of Willis variations and cerebral aneurysms",
    "rotator cuff muscles, tears and impingement syndrome",
    "facial nerve intrapetrous and extrapetrous course",
    "trigeminal nerve divisions, neuralgia and clinical testing",
    "peritoneum, lesser sac and retroperitoneal organs",
    "thoracic inlet syndrome and cervical rib",
    "carpal tunnel and ulnar tunnel compression neuropathies",
    "popliteal fossa contents and tibial nerve branches",
    "mediastinal divisions and superior mediastinum contents",
    "coronary arteries, dominance pattern and clinical significance",
    "pterygoid muscles, infratemporal fossa and TMJ",
    "parotid gland, Stensen's duct and parotid region tumors",
    "posterior triangle of neck and accessory nerve",
    "tarsal tunnel syndrome and tibial nerve entrapment",
    "axillary nerve injury and deltoid paralysis",
    "obturator nerve, adductor canal and obturator hernia",
    "sciatic nerve, piriformis syndrome and gluteal region",
    "renal hilum, renal fascia layers and perinephric space",
    "sole of foot, plantar aponeurosis and plantar fasciitis",
    "pectoral region, clavipectoral fascia and nerve supply",
    "submandibular region, lingual nerve and hypoglossal nerve",
    "palmar spaces, thenar eminence and median nerve injury",
  ],
  "Physiology": [
    "cardiac action potential: phases, ion channels and automaticity",
    "Frank-Starling mechanism and cardiac output determinants",
    "ventilation-perfusion ratio mismatch and physiological dead space",
    "oxygen-hemoglobin dissociation curve: shifts and clinical significance",
    "renal tubular reabsorption of glucose and glucosuria threshold",
    "renin-angiotensin-aldosterone system: feedback and clinical states",
    "mixed acid-base disorders: compensation and anion gap",
    "blood-brain barrier, CSF formation, flow and reabsorption",
    "hypothalamic-pituitary-gonadal axis: feedback and clinical disorders",
    "thyroid hormone: synthesis, transport and regulation",
    "neuromuscular junction: physiology and myasthenia gravis",
    "gate control theory of pain and descending modulation",
    "visual pathway lesions and corresponding visual field defects",
    "GFR measurement: clearance methods and autoregulation",
    "respiratory mechanics: compliance, resistance and surfactant",
    "Starling forces in capillary fluid exchange and edema",
    "platelet activation, coagulation cascade and fibrinolysis",
    "GI motility: migrating motor complex and gastric emptying",
    "insulin: secretion, receptor signaling and counter-regulation",
    "calcium homeostasis: PTH, calcitonin, vitamin D interactions",
    "osmoregulation: ADH release and renal concentrating mechanism",
    "baroreceptor reflex arc and autonomic control of blood pressure",
    "erythropoietin: regulation and high-altitude acclimatization",
    "cortisol: diurnal rhythm, stress response and HPA axis",
    "body fluid compartments: measurement and clinical applications",
    "pulmonary surfactant: composition, synthesis and IRDS",
  ],
  "Biochemistry": [
    "urea cycle: enzymes, regulation and hyperammonemia disorders",
    "glycogen storage diseases: Pompe, McArdle, von Gierke enzyme defects",
    "lysosomal storage disorders: Gaucher, Niemann-Pick, Tay-Sachs pathogenesis",
    "porphyrin synthesis, porphyrias and lead poisoning",
    "purine and pyrimidine synthesis: de novo vs salvage pathways",
    "electron transport chain complexes and oxidative phosphorylation",
    "fatty acid oxidation disorders: MCAD deficiency and ketogenesis",
    "lipoprotein classes, LDL receptor pathway and familial hypercholesterolemia",
    "hemoglobin variants: HbS, HbC, HbE and thalassemia mutations",
    "enzyme kinetics: Michaelis-Menten, allosteric regulation and inhibition types",
    "DNA repair mechanisms: mismatch, NER and BER defects",
    "protein folding chaperones, heat shock proteins and prion diseases",
    "HMP shunt: NADPH production, G6PD deficiency and hemolysis",
    "folate and vitamin B12 metabolism: megaloblastic anemia biochemistry",
    "cholesterol synthesis: HMG-CoA reductase, statin mechanism and regulation",
    "gluconeogenesis substrates, regulation and Cori cycle",
    "alcohol metabolism: ADH, ALDH and metabolic consequences",
    "one-carbon metabolism, methionine cycle and DNA methylation",
    "ubiquitin-proteasome pathway and protein degradation",
    "second messengers: cAMP, IP3/DAG, cGMP and receptor coupling",
    "oncogenes, tumor suppressors and Warburg effect",
    "collagen structure, cross-linking defects and connective tissue disorders",
    "mucopolysaccharidoses: enzyme defects and accumulated substrates",
    "selenium metabolism, glutathione peroxidase and antioxidant defense",
    "PCR, restriction enzymes and recombinant DNA techniques",
    "amino acid catabolism: transamination, deamination and phenylketonuria",
  ],
  "Pathology": [
    "amyloidosis: AA vs AL types, Congo red staining and affected organs",
    "apoptosis mechanisms: intrinsic vs extrinsic pathway",
    "granulomatous inflammation: caseating vs non-caseating causes",
    "tumor markers: CA-125, AFP, CEA, PSA and false positives",
    "paraneoplastic syndromes: SIADH, Cushing, Lambert-Eaton",
    "DIC: consumption coagulopathy, d-dimer and microangiopathic hemolysis",
    "myocardial infarction: zones of injury, reperfusion and complications",
    "glomerulonephritis: immune complex vs ANCA-associated patterns",
    "chronic hepatitis grading, staging and fibrosis scoring",
    "Hodgkin lymphoma: Reed-Sternberg cell and subtypes",
    "leukemia: CML Philadelphia chromosome and BCR-ABL",
    "lung carcinoma: squamous vs adenocarcinoma vs SCLC molecular features",
    "H. pylori: virulence factors, CagA and MALT lymphoma",
    "SLE pathogenesis: anti-dsDNA, complement and lupus nephritis classes",
    "thyroid carcinoma: papillary, follicular, medullary and anaplastic",
    "atherosclerosis: foam cell formation, plaque instability and ACS",
    "von Willebrand disease: types, coagulation tests and factor VIII",
    "hereditary colorectal cancer: FAP and Lynch syndrome mutations",
    "breast carcinoma: luminal A/B, HER2-enriched and triple-negative",
    "cell cycle checkpoints: cyclin-CDK complexes and p53 pathway",
    "MEN syndromes: MEN1, MEN2A, MEN2B and associated tumors",
    "Wilson's disease vs hemochromatosis: hepatic copper vs iron deposition",
    "vasculitides: Chapel Hill classification and ANCA specificity",
    "wound healing: growth factors, collagen deposition and keloid",
    "Paget's disease of bone: mosaic pattern and elevated ALP",
  ],
  "Pharmacology": [
    "beta-lactam antibiotics: mechanism, PBP binding and resistance",
    "aminoglycoside ototoxicity: cochlear vs vestibular damage mechanisms",
    "ACE inhibitors vs ARBs: bradykinin pathway and diabetic nephropathy",
    "antiepileptic drugs: sodium channel vs GABA mechanisms and interactions",
    "antidepressant pharmacology: serotonin syndrome and discontinuation",
    "anticoagulants: heparin mechanism, LMWH advantages and reversal",
    "statin mechanism: competitive HMG-CoA inhibition and myopathy",
    "digoxin toxicity: Na/K ATPase inhibition, ECG changes and treatment",
    "glucocorticoids: mechanism, immunosuppression and side effects",
    "opioid pharmacology: receptor types, tolerance and naloxone reversal",
    "anticholinesterase drugs and organophosphate toxidrome management",
    "antifungal mechanisms: ergosterol synthesis vs membrane disruption",
    "antitubercular drugs: first-line mechanisms and hepatotoxicity",
    "calcium channel blockers: dihydropyridine vs non-dihydropyridine",
    "PPIs: irreversible H+/K+ ATPase inhibition and drug interactions",
    "metformin: AMPK activation, lactic acidosis risk and renal caution",
    "warfarin pharmacogenomics: CYP2C9, VKORC1 and drug interactions",
    "beta-blockers: cardioselectivity, ISA and contraindications",
    "fluoroquinolone resistance: DNA gyrase mutations and QT prolongation",
    "macrolide drug interactions: CYP3A4 and telithromycin hepatotoxicity",
    "HIV antiretroviral classes: NRTI, NNRTI, PI and integrase inhibitors",
    "neuromuscular blockers: succinylcholine pseudocholinesterase deficiency",
    "plasma protein binding and volume of distribution calculations",
    "pharmacokinetics: first-pass effect, bioavailability and clearance",
    "drug teratogenicity categories and safe drugs in pregnancy",
  ],
  "Microbiology": [
    "exotoxins vs endotoxins: mechanisms, heat stability and clinical effects",
    "HIV replication cycle, CD4 depletion and AIDS-defining illnesses",
    "tuberculosis pathogenesis: Ghon complex, latency and reactivation",
    "hepatitis serology: HBsAg, anti-HBc, HBeAg and viral DNA interpretation",
    "malaria: Plasmodium falciparum vs vivax lifecycle and complications",
    "staphylococcal virulence factors: TSST-1, PVL and MRSA mechanism",
    "streptococcal M proteins: molecular mimicry and rheumatic fever",
    "bacterial meningitis: CSF analysis by organism and age group",
    "ESBL and carbapenemase producing organisms: detection and treatment",
    "Salmonella typhi: Vi antigen, Widal interpretation and treatment",
    "clostridium difficile: pseudomembranous colitis and FMT",
    "hepatitis C: NS3/4A and NS5B as drug targets and DAA regimens",
    "herpes family: latency sites, reactivation triggers and antivirals",
    "Aspergillus vs Cryptococcus: immunocompromised host infections",
    "SARS-CoV-2: spike protein variants and immune evasion mechanisms",
    "HPV oncogenesis: E6/E7 proteins, p53/Rb degradation and carcinoma",
    "biofilm formation: quorum sensing and antibiotic penetration",
    "complement system: classical vs alternate pathway and deficiency states",
    "prion diseases: PrPc to PrPsc misfolding and transmission",
    "rickettsia: obligate intracellular habitat and Weil-Felix reaction",
    "dengue: serotypes, ADE mechanism and hemorrhagic fever",
    "sterilization validation: D-value, Z-value and biological indicators",
    "chlamydia and mycoplasma: cell wall deficiency and treatment",
    "leptospirosis: Weil's disease, jaundice and uveitis",
    "Japanese encephalitis: vector, epidemiology and vaccination",
  ],
  "Forensic Medicine": [
    "putrefaction stages and mummification conditions",
    "rigor mortis, livor mortis and algor mortis: time since death estimation",
    "hanging vs strangulation vs throttling: autopsy differentiation",
    "drowning: fresh water vs salt water drowning findings",
    "gunshot wounds: entry vs exit, range and stippling",
    "forensic age estimation: teeth, epiphyses and radiological markers",
    "blood alcohol concentration: medico-legal levels and Widmark formula",
    "wound classification: incised, lacerated, contused and puncture",
    "carbon monoxide poisoning: cherry-red lividity and CO-Hb levels",
    "organophosphate poisoning: cholinergic toxidrome and pralidoxime",
    "arsenic and lead poisoning: clinical features and hair analysis",
    "brain death criteria: clinical testing and organ donation",
    "sudden natural death: cardiac, cerebral and aortic causes",
    "medico-legal aspects of rape: examination and evidence collection",
    "infanticide vs SIDS: autopsy differentiation",
    "exhumation: reasons and legal requirements",
    "decomposition: stages, insects and forensic entomology",
    "sexual asphyxia and autoerotic deaths",
    "industrial poisons: cyanide, methanol and corrosive poisoning",
    "DNA fingerprinting: VNTRs, STRs and paternity testing",
  ],
  "Internal Medicine": [
    "STEMI: ECG localization, culprit vessel and PCI timing",
    "heart failure with reduced ejection fraction: GDMT and device therapy",
    "atrial fibrillation: CHA2DS2-VASc score and rhythm vs rate control",
    "diabetic ketoacidosis vs HHS: precipitants and correction protocol",
    "hyponatremia: SIADH diagnosis and correction rate in seizures",
    "rheumatoid arthritis: anti-CCP antibodies, DAS28 and biologic DMARDs",
    "SLE: ACR/EULAR 2019 criteria and LN classification",
    "CAP management: CURB-65 score and empirical antibiotic selection",
    "COPD: GOLD spirometry grades and inhaler therapy stepup",
    "pulmonary embolism: Wells score, PESI and anticoagulation duration",
    "thalassemia minor vs iron deficiency anemia: Mentzer index",
    "CKD staging: eGFR, albuminuria categories and RAAS blockade",
    "liver cirrhosis: Child-Pugh vs MELD score and complication management",
    "thyrotoxicosis: Graves vs toxic nodule: differentiation",
    "Addison's disease: short Synacthen test and autoantibodies",
    "ANCA-associated vasculitis: GPA vs MPA and immunosuppression",
    "status epilepticus: stepwise benzodiazepine-based management",
    "bacterial meningitis: empirical antibiotics and dexamethasone",
    "primary hyperparathyroidism: asymptomatic management criteria",
    "acute pancreatitis: Ranson criteria and fluid resuscitation",
    "septic shock: MAP targets, vasopressor choice and steroid use",
    "aortic stenosis: AVA criteria for severe and TAVI indications",
    "resistant hypertension: aldosterone antagonist addition evidence",
    "Crohn's disease vs ulcerative colitis: endoscopic and histological",
    "Guillain-Barré syndrome: CSF albuminocytological dissociation",
  ],
  "Surgery": [
    "acute appendicitis: Alvarado score and laparoscopic technique",
    "breast cancer: TNM staging, sentinel node biopsy and oncoplastics",
    "thyroid nodule: Bethesda classification and extent of surgery",
    "inguinal hernia: direct vs indirect anatomy and Lichtenstein repair",
    "acute abdomen: peritonitis, ileus and decision for laparotomy",
    "colorectal carcinoma: right vs left presentation and anastomosis types",
    "pancreatitis: Balthazar CT grading and infected necrosis management",
    "obstructive jaundice: MRCP vs ERCP and biliary drainage",
    "peptic ulcer perforation: omental patch and Helicobacter treatment",
    "variceal bleeding: octreotide, sclerotherapy, TIPS indication",
    "ATLS primary survey: ABCDE approach and damage control surgery",
    "burns: Parkland formula, Wallace rule and escharotomy indication",
    "arterial vs venous ulcer: ABPI, duplex Doppler and management",
    "DVT prophylaxis: pharmacological vs mechanical and duration",
    "abdominal aortic aneurysm: diameter criteria and EVAR vs open",
    "pilonidal sinus: procedures and recurrence management",
    "acute cholecystitis vs biliary colic: conservative vs surgery timing",
    "small bowel obstruction: causes, management and laparotomy criteria",
    "post-operative pulmonary complications: atelectasis and pneumonia",
    "melanoma: Breslow thickness, Clark level and sentinel node biopsy",
    "parotid tumors: pleomorphic adenoma, Warthin's and malignant features",
    "Whipple's procedure: indications, anatomy and complications",
    "thyroid carcinomas: extent of surgery and radioiodine criteria",
    "urological stone disease: ESWL vs ureteroscopy vs PCNL criteria",
    "splenectomy: indications, post-splenectomy sepsis and vaccination",
  ],
  "Obstetrics & Gynecology": [
    "pre-eclampsia: ISSHP criteria, pathogenesis and management",
    "placenta previa vs placental abruption: clinical and USG differences",
    "gestational diabetes: DIPSI vs OGTT and neonatal complications",
    "postpartum hemorrhage: HAEMOSTASIS algorithm and surgical options",
    "PCOS: Rotterdam criteria, HOMA-IR and ovulation induction",
    "cervical carcinoma: FIGO 2018 staging and CRT vs surgery",
    "endometriosis: revised ASRM staging and adenomyosis differentiation",
    "ectopic pregnancy: tubal vs non-tubal, methotrexate criteria",
    "ovarian carcinoma: serous histology, BRCA mutation and debulking",
    "FGR: Doppler indices, cerebral redistribution and delivery timing",
    "abruptio placentae: DIC risk and Couvelaire uterus",
    "preterm labor: tocolysis options and antenatal corticosteroid dose",
    "uterine fibroids: FIGO leiomyoma classification and hysteroscopic resection",
    "antenatal investigation: triple test, NIPT and anomaly scan findings",
    "obstetric cholestasis: bile acids, ursodeoxycholic acid and delivery",
    "vesicular mole: hCG regression curve and chemotherapy risk features",
    "ovarian torsion: Doppler findings and laparoscopic de-torsion",
    "infertility: WHO semen analysis 2021 criteria and IUI vs IVF",
    "vulvar carcinoma: FIGO staging and sentinel lymph node concept",
    "antepartum fetal surveillance: NST interpretation and BPP scoring",
  ],
  "Pediatrics": [
    "neonatal hyperbilirubinemia: Bhutani nomogram and phototherapy criteria",
    "cyanotic congenital heart defects: TGA vs Tetralogy: differentiation",
    "febrile seizures: simple vs complex and prophylaxis",
    "kwashiorkor vs marasmus: biochemical and clinical differences",
    "pediatric pneumonia: IMCI classification and antibiotic selection",
    "ORS composition: WHO vs reduced osmolarity and rehydration plan",
    "neonatal meningitis: organisms, CSF interpretation and duration",
    "immunization schedule: India NIS vs IAP 2023 recommended schedule",
    "developmental milestones red flags: motor, language and social",
    "congenital hypothyroidism: TSH screening and treatment window",
    "Rh isoimmunization: Coombs test, hydrops and exchange transfusion",
    "ALL in children: BFM protocol risk stratification and MRD",
    "beta-thalassemia major: pre-transfusion Hb target and chelation",
    "hypertrophic pyloric stenosis: olive mass and laparoscopic pyloromyotomy",
    "asthma: GINA stepwise management and ICS dosing",
    "dengue in children: NS1, warning signs and plasma leakage management",
    "neonatal sepsis: EOS vs LOS organisms and empirical antibiotics",
    "hemophilia A vs B: factor assay, severity and prophylaxis",
    "Kawasaki disease: diagnostic criteria, IVIG and coronary aneurysm",
    "cerebral palsy: classification, GMFCS scoring and management",
  ],
  "Ophthalmology": [
    "primary open-angle vs angle-closure glaucoma: differentiation",
    "diabetic retinopathy: ETDRS classification and anti-VEGF therapy",
    "AMD: drusen, geographic atrophy and ranibizumab vs bevacizumab",
    "rhegmatogenous vs tractional retinal detachment: management",
    "phacoemulsification technique: nucleus management and IOL power calculation",
    "optic neuritis: Uhthoff phenomenon and MRI criteria for MS",
    "retinoblastoma: Reese-Ellsworth vs IIRC classification",
    "HLA-B27 associated uveitis: ankylosing spondylitis and treatment",
    "ocular manifestations of DM, HTN, SLE and sarcoidosis",
    "penetrating keratoplasty vs DSAEK: indications and graft survival",
    "esotropia vs exotropia: AC/A ratio and surgical correction",
    "visual field defects: localization from retina to occipital cortex",
    "central retinal artery vs vein occlusion: clinical and FA differences",
    "anterior segment OCT and gonioscopy in angle-closure glaucoma",
    "papilledema vs pseudopapilledema: Frisén grading and OCT",
    "corneal topography: keratoconus Amsler-Krumeich grading",
    "thyroid eye disease: NOSPECS classification and orbital decompression",
    "cataract in systemic disease: diabetes, steroids and Wilson's",
    "sympathetic ophthalmia: pathogenesis and enucleation timing",
    "color vision defects: Ishihara vs Farnsworth-Munsell 100-hue test",
  ],
  "ENT": [
    "sensorineural vs conductive hearing loss: audiometric and tuning fork tests",
    "otosclerosis: stapedectomy vs hearing aid and fluoride therapy",
    "cholesteatoma: acquired vs congenital, Rinne and surgery",
    "acoustic neuroma: Gardner-Robertson classification and radiosurgery vs surgery",
    "Meniere's disease: endolymphatic hydrops and intratympanic steroids",
    "nasal polyps: Samter triad, eosinophilia and revision surgery rates",
    "CSF rhinorrhea: beta-2 transferrin test and endoscopic repair",
    "tonsillectomy indications: Paradise criteria and post-tonsillectomy hemorrhage",
    "laryngeal carcinoma: supraglottic vs glottic and voice preservation",
    "nasopharyngeal carcinoma: EBV VCA IgA, IMRT and systemic therapy",
    "functional endoscopic sinus surgery: anatomy and complications",
    "otitis media with effusion: grommet insertion criteria",
    "vocal cord paralysis: causes, EMG and medialization thyroplasty",
    "branchial cyst, sinus and fistula: embryological origin",
    "thyroglossal duct cyst: Sistrunk operation and malignancy risk",
    "juvenile angiofibroma: staging, embolization and surgical approach",
    "glomus jugulare: Fisch classification and surgical vs radiosurgery",
    "epiglottitis: thumbprint sign on lateral neck X-ray and airway",
    "foreign body airway: Heimlich maneuver and bronchoscopy",
    "obstructive sleep apnea: AHI criteria, CPAP and UPPP",
  ],
  "Orthopedics": [
    "fracture healing: bone callus stages and factors affecting healing",
    "compartment syndrome: pressure thresholds and fasciotomy technique",
    "osteomyelitis: Cierny-Mader classification and dead bone terminology",
    "bone tumors: osteosarcoma vs Ewing's: radiological and histological",
    "femoral neck fracture: Garden classification and AVN risk",
    "ACL injury: mechanism, Lachman test and arthroscopic reconstruction",
    "carpal tunnel syndrome: nerve conduction studies and surgical release",
    "adolescent idiopathic scoliosis: Cobb angle and Risser staging",
    "Paget's disease: bowing deformity, fractures and osteosarcomatous change",
    "osteoporosis: WHO T-score criteria, FRAX tool and bisphosphonate therapy",
    "rheumatoid arthritis: Boutonnière vs swan-neck deformity",
    "gout vs pseudogout: crystal morphology and synovial fluid analysis",
    "DDH: Ortolani sign, Graf ultrasound classification and Pavlik harness",
    "Colles vs Smith vs Barton fracture: mechanism and radiological features",
    "lumbar disc prolapse: level, nerve root, motor and sensory deficit",
    "shoulder dislocation: anterior vs posterior and Hill-Sachs lesion",
    "tibial plateau fracture: Schatzker classification and surgical fixation",
    "avascular necrosis of femoral head: Ficat staging and core decompression",
    "Dupuytren's contracture: extent, Hueston test and needle fasciotomy",
    "total hip arthroplasty: bearing surfaces, dislocation risk and revision",
  ],
  "Psychiatry": [
    "schizophrenia: first-rank symptoms, dopamine hypothesis and clozapine",
    "bipolar disorder: rapid cycling definition and lamotrigine evidence",
    "MDD: melancholic features, treatment-resistant and ECT criteria",
    "borderline personality disorder: DBT modules and emotion dysregulation",
    "OCD: Yale-Brown scale, ERP therapy and augmentation strategies",
    "PTSD: intrusion, avoidance and hyperarousal cluster criteria",
    "delirium: hyperactive vs hypoactive and RASS assessment",
    "alcohol withdrawal: CIWA-Ar scale, seizure risk and thiamine",
    "autism spectrum disorder: ADOS, ADI-R and early intervention",
    "ADHD: Conners rating scale, methylphenidate dose and sleep effects",
    "anorexia vs bulimia: medical complications and re-feeding syndrome",
    "conversion disorder: la belle indifférence and functional neurological",
    "neuroleptic malignant syndrome: CPK, temperature and dantrolene",
    "ECT: bilateral vs unilateral, cognitive effects and continuation",
    "antipsychotic-induced tardive dyskinesia: AIMS scale and valbenazine",
    "serotonin syndrome vs NMS: clinical differentiation and cyproheptadine",
    "dementia: Alzheimer vs Lewy body vs frontotemporal differentiation",
    "sleep disorders: polysomnography findings and CPAP indication",
    "benzodiazepine dependence: taper schedule and GABA receptor changes",
    "forensic psychiatry: McNaughten rules and diminished responsibility",
  ],
  "Community Medicine": [
    "epidemiological study designs: internal validity, bias and confounding",
    "sensitivity, specificity, PPV and NPV: clinical interpretation",
    "odds ratio vs relative risk: when to use each",
    "National Tuberculosis Elimination Programme: DR-TB regimen",
    "vaccine cold chain: 2–8°C and VVM interpretation",
    "malnutrition: MUAC, weight-for-height and SAM management",
    "RMNCH+A strategy: key interventions and maternal mortality ratio",
    "biomedical waste: Schedule I categories, colour coding and disposal",
    "water quality standards: MPN, E. coli limits and chlorination",
    "COTPA Act: cigarette pack warnings and advertisement ban",
    "occupational diseases: byssinosis, silicosis and asbestosis",
    "outbreak investigation: steps, case definition and attack rate",
    "demography: demographic transition, TFR and dependency ratio",
    "ICDS programme: supplementary nutrition and preschool education",
    "National Cancer Control Programme: screening methods and targets",
    "Integrated Management of Neonatal and Childhood Illness: IMNCI",
    "vector control: integrated vector management and insecticide resistance",
    "health statistics: infant mortality rate, maternal mortality ratio calculation",
    "AYUSH integration in primary health care",
    "Janani Suraksha Yojana: cash incentive criteria and J-SK monitoring",
  ],
  "Dermatology": [
    "psoriasis: Auspitz sign, Koebner phenomenon and IL-17/23 biologics",
    "pemphigus vulgaris vs bullous pemphigoid: IIF patterns and treatment",
    "leprosy: TT vs LL spectrum, reversal reaction and ENL management",
    "acne vulgaris: comedonal vs inflammatory and isotretinoin monitoring",
    "dermatophytosis: Wood's lamp, KOH preparation and terbinafine",
    "melanoma: ABCDE rule, Breslow thickness, BRAF mutation and PD-1 therapy",
    "vitiligo: melanocyte autoimmunity, Wood's lamp and NB-UVB phototherapy",
    "lichen planus: 6 Ps, Wickham striae and mucosal vs cutaneous",
    "Stevens-Johnson syndrome vs TEN: body surface area criteria",
    "scabies: burrow distribution, Norwegian scabies and household treatment",
    "herpes zoster: prodrome, dermatomal distribution and valacyclovir",
    "urticaria: dermographism, angioedema and anti-H1 antihistamine",
    "atopic dermatitis: SCORAD, skin microbiome and dupilumab",
    "patch testing: allergen series, reading at D2/D4 and relevance",
    "cutaneous T-cell lymphoma: Sézary cells and TNMB staging",
    "alopecia areata: exclamation mark hairs, nail pitting and JAK inhibitors",
    "ichthyoses: lamellar vs bullous X-linked and keratin mutations",
    "psoriatic arthritis: CASPAR criteria and anti-TNF selection",
    "rosacea: subtypes, demodex mites and metronidazole",
    "leukoplakia vs erythroplakia: malignant potential and biopsy",
  ],
};

const GENERAL_TOPICS = [
  "applied clinical scenarios and investigations",
  "mechanisms, pathways and regulatory concepts",
  "diagnostic criteria, scoring systems and management",
  "drug therapy, mechanisms and adverse effects",
  "recent advances and high-yield NEET PG topics",
  "embryological basis and developmental anomalies",
  "histological features and gross pathology correlations",
  "genetic and molecular basis of disease",
  "epidemiology, risk factors and prevention",
  "complications, prognosis and follow-up strategies",
];

function getRandomTopic(subject: string): string {
  const pool = TOPIC_POOL[subject] ?? GENERAL_TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getDifficultyInstruction(difficulty: string): string {
  if (difficulty === "foundation") {
    return "Difficulty: 1st–2nd Year MBBS Foundation level. Test core mechanisms, anatomy and physiology. Appropriate for a student who has read the standard textbook once. Questions should not be trivially easy — require understanding, not mere recall.";
  }
  if (difficulty === "clinical") {
    return "Difficulty: Final Year MBBS / Clinical level. Integrate basic sciences with clinical presentations. Include case-based scenarios testing pattern recognition and applied reasoning. Avoid purely factual recall.";
  }
  return "Difficulty: NEET PG / Postgraduate Entrance level. Questions must be at peak difficulty: tricky distractors, single-best-answer format, test mechanistic understanding, recent advances, and nuanced clinical decisions. Every distractor must be plausible. A well-read student should need to reason carefully to arrive at the correct answer.";
}

const SYSTEM_PROMPT = `You are an expert Indian medical educator and NEET PG question-setter.
Reference ONLY gold-standard textbooks:
• Anatomy: Gray's Anatomy (42nd Ed), BD Chaurasia's Human Anatomy, Snell's Clinical Anatomy, Netter's Atlas
• Physiology: Ganong's Review (26th Ed), Guyton & Hall Medical Physiology (14th Ed)
• Biochemistry: Harper's Illustrated Biochemistry (32nd Ed), Lippincott's Illustrated Biochemistry
• Pathology: Robbins & Cotran (10th Ed), Harsh Mohan Textbook of Pathology
• Pharmacology: KD Tripathi Essentials (8th Ed), Goodman & Gilman's
• Microbiology: Ananthanarayan & Paniker (10th Ed), Murray's Medical Microbiology
• Medicine: Harrison's Principles (21st Ed), Davidson's Principles & Practice
• Surgery: Bailey & Love's (28th Ed), Sabiston Textbook of Surgery
• Pediatrics: Nelson Textbook of Pediatrics, Ghai Essential Pediatrics
• Obstetrics & Gynecology: Dutta's Obstetrics & Gynecology, Williams Obstetrics
• Psychiatry: Kaplan & Sadock's Synopsis of Psychiatry
• Ophthalmology: Kanski's Clinical Ophthalmology, Parsons' Diseases of the Eye
• ENT: PL Dhingra Diseases of Ear Nose & Throat
• Community Medicine: Park's Textbook of Preventive and Social Medicine (26th Ed)
All content must be factually accurate, evidence-based, and varied — never repeat the most commonly known example for a subject.
Return ONLY valid JSON, no markdown code blocks, no preamble.`;

function parseJsonObj(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(text.slice(start, end + 1));
}

function parseJsonArr(text: string): any[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  return JSON.parse(text.slice(start, end + 1));
}

// ── Word Scramble ─────────────────────────────────────────────────────────────
router.post("/word-scramble", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy", difficulty = "neet-pg" } = req.body;
    if (!ALL_SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) { res.status(400).json({ error: "Invalid difficulty" }); return; }

    const topic = getRandomTopic(subject);
    const diffInstr = getDifficultyInstruction(difficulty);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 300,
      temperature: 1.0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate 1 word scramble challenge for MBBS ${subject}.
${diffInstr}
Focus specifically on this topic area: "${topic}"
Choose an important, specific single medical term (4-12 letters, no hyphens or spaces, UPPERCASE).
Avoid common/basic terms — pick something that tests deeper knowledge.
Return JSON only:
{
  "word": "SARCOLEMMA",
  "definition": "The plasma membrane of a muscle fibre — contains voltage-gated Na+ channels critical for action potential propagation",
  "hint": "Muscle cell membrane equivalent"
}`,
        },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    const word = ((data.word as string) || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!word) { res.status(500).json({ error: "AI returned invalid word" }); return; }

    const letters = word.split("");
    let scrambled = [...letters];
    let attempts = 0;
    do {
      for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
      }
      attempts++;
    } while (scrambled.join("") === word && attempts < 30);

    res.json({ word, scrambled: scrambled.join(""), definition: data.definition ?? "", hint: data.hint ?? "", subject });
  } catch {
    res.status(500).json({ error: "Failed to generate word scramble" });
  }
});

// ── Memory Match ──────────────────────────────────────────────────────────────
router.post("/memory-match", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy", difficulty = "neet-pg" } = req.body;
    if (!ALL_SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) { res.status(400).json({ error: "Invalid difficulty" }); return; }

    const topic = getRandomTopic(subject);
    const diffInstr = getDifficultyInstruction(difficulty);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 900,
      temperature: 1.0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate 8 term-definition pairs for a memory match game on ${subject}.
${diffInstr}
Focus specifically on this topic area: "${topic}"
Definitions must be concise (max 10 words) but accurate and precise — not generic.
Avoid obvious/basic pairs. Include clinical correlations where appropriate.
Return JSON array only:
[
  { "term": "Berry aneurysm", "definition": "Most common site of subarachnoid haemorrhage; saccular" }
]`,
        },
      ],
    });

    const pairs = parseJsonArr(completion.choices[0]?.message?.content ?? "[]");
    res.json({ pairs: pairs.slice(0, 8), subject });
  } catch {
    res.status(500).json({ error: "Failed to generate memory match" });
  }
});

// ── Diagnosis Challenge ────────────────────────────────────────────────────────
router.post("/diagnosis", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Physiology", difficulty = "neet-pg" } = req.body;
    if (!ALL_SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) { res.status(400).json({ error: "Invalid difficulty" }); return; }

    const topic = getRandomTopic(subject);
    const diffInstr = getDifficultyInstruction(difficulty);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 700,
      temperature: 1.0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a clinical/conceptual MCQ challenge for a MBBS student studying ${subject}.
${diffInstr}
Focus specifically on this topic area: "${topic}"
The question must be a single-best-answer type with plausible distractors.
For NEET PG level: include a realistic clinical vignette (2-3 sentences) with labs/imaging clues.
Explanations must mention the relevant gold-standard textbook concept.
Return JSON only:
{
  "scenario": "A 45-year-old woman presents with muscle weakness, constipation and kidney stones. Serum calcium is 12.4 mg/dL and PTH is elevated.",
  "question": "Which of the following is the MOST likely diagnosis?",
  "options": ["A. Primary hyperparathyroidism", "B. Malignancy-associated hypercalcaemia", "C. Vitamin D intoxication", "D. Milk-alkali syndrome"],
  "answer": "A",
  "explanation": "Elevated PTH with hypercalcaemia localises the defect to the parathyroid glands (Harrison's Ch 402). Malignancy causes PTHrP-mediated suppressed PTH. Vitamin D intoxication and milk-alkali syndrome both suppress PTH."
}`,
        },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    res.json({ ...data, subject });
  } catch {
    res.status(500).json({ error: "Failed to generate diagnosis challenge" });
  }
});

// ── Spelling Bee ──────────────────────────────────────────────────────────────
router.post("/spelling-bee", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy", difficulty = "neet-pg" } = req.body;
    if (!ALL_SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) { res.status(400).json({ error: "Invalid difficulty" }); return; }

    const topic = getRandomTopic(subject);
    const diffInstr = getDifficultyInstruction(difficulty);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 900,
      temperature: 1.0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate 6 medical spelling bee words for MBBS ${subject}.
${diffInstr}
Focus specifically on this topic area: "${topic}"
Choose terms that are genuinely tricky to spell and clinically important — not basic terms.
Words must be single medical terms in UPPERCASE.
Return JSON array only:
[
  {
    "word": "CHOLECYSTOKININ",
    "phonetic": "koh-lee-SIS-toe-KY-nin",
    "definition": "Duodenal hormone stimulating gallbladder contraction and pancreatic enzyme secretion",
    "hint": "The pancreatic secretary hormone from duodenum"
  }
]`,
        },
      ],
    });

    const words = parseJsonArr(completion.choices[0]?.message?.content ?? "[]");
    res.json({ words: words.slice(0, 6), subject });
  } catch {
    res.status(500).json({ error: "Failed to generate spelling bee" });
  }
});

// ── Crossword ─────────────────────────────────────────────────────────────────
router.post("/crossword", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy", difficulty = "neet-pg" } = req.body;
    if (!ALL_SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) { res.status(400).json({ error: "Invalid difficulty" }); return; }

    const topic = getRandomTopic(subject);
    const diffInstr = getDifficultyInstruction(difficulty);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1800,
      temperature: 0.9,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Design a medical crossword for MBBS ${subject} on a 10×10 grid (rows/cols 0-9).
${diffInstr}
Focus specifically on this topic area: "${topic}"
Include 6-7 interlocking words. Rules:
- All words: UPPERCASE, single words, letters A-Z only, no hyphens
- across: word goes left→right starting at (row, col)
- down: word goes top→bottom starting at (row, col)
- Intersections MUST share the exact same letter at that cell
- word length + start position must stay within 0-9
- Every word must intersect with at least one other word
- Clues must be NEET PG level — not just simple definitions

Return JSON only:
{
  "size": 10,
  "words": [
    { "number": 1, "word": "CALCITONIN", "clue": "Thyroid C-cell hormone opposing PTH action on bone", "direction": "across", "row": 0, "col": 0 },
    { "number": 2, "word": "CALCIURIA", "clue": "Increased urinary calcium excretion in hyperparathyroidism", "direction": "down", "row": 0, "col": 0 }
  ]
}
Verify every intersection before responding: for word1[i] and word2[j] crossing at (r,c), word1[i] must equal word2[j].`,
        },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    res.json({ size: data.size ?? 10, words: data.words ?? [], subject });
  } catch {
    res.status(500).json({ error: "Failed to generate crossword" });
  }
});

export { router as gamesRouter };
