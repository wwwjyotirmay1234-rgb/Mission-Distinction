/**
 * Per-station CBME 1st-year Anatomy scope constraints.
 *
 * Injected into the examiner system prompt for each image-based Anatomy viva
 * station (Histology / Bone / Visceral / Section Anatomy / Prosection) to
 * ensure ALL follow-up questions after specimen identification stay within the
 * AN competencies prescribed by NMC CBME for 1st-year MBBS Phase I.
 *
 * Reference: NMC CBME Regulations 2019, 1st year (Phase I) Anatomy
 * competencies AN1 – AN78 (Gross Anatomy, Histology, Embryology).
 */

export const ANATOMY_CBME_STATION_SCOPE: Record<string, string> = {

  Histology: `
CBME 1st-Year Histology Station — permitted follow-up topics after slide identification (AN Histology competencies AN72–AN78):
- IDENTIFYING FEATURES: cell types present, their arrangement/layer pattern, nuclear morphology, staining characteristics (H&E — basophilic vs eosinophilic regions), lumen shape, presence of specialised structures (e.g. portal triad, islets of Langerhans, Bowman's capsule, Hassall's corpuscles, Purkinje fibres, central vein).
- FUNCTIONAL SIGNIFICANCE: what the identified tissue/organ does, and how its microscopic structure reflects that function.
- DISTINGUISHING from a look-alike: name one or two tissues that could be confused with this one and how to tell them apart under the microscope.
- EMBRYOLOGICAL ORIGIN: germ layer (ectoderm, endoderm, mesoderm/mesenchyme) and the specific developmental process that forms this tissue or organ; one classic congenital anomaly associated with its development (e.g. agenesis, ectopia, cyst).
- CLINICAL CORRELATE (limited to AN scope): basic functional disorder tied to the structure (e.g. fatty change in liver, cystic fibrosis affecting exocrine pancreas) — do NOT test pathological diagnosis, histopathological grading, or specific disease management (those are PA/Phase II topics).
OUT OF SCOPE at this station: histopathological diagnosis of disease slides, detailed immunohistochemistry, Phase II Pathology (Robbins) content, Phase III clinical management.`,

  Bone: `
CBME 1st-Year Bone Station — permitted follow-up topics after bone identification (AN Osteology/Arthrology competencies AN1–AN20, AN40–AN55):
- IDENTIFICATION & SIDE: correct name of the bone, determination of right vs left side with justification (one or two distinctive features that establish side).
- BONY FEATURES: named processes, tubercles, tuberosities, epicondyles, fossae, foramina, grooves, and ridges — their precise names and locations.
- MUSCLE ATTACHMENTS: muscles attaching at each named marking, their nerve supply, action (from 1st-year anatomy competencies only — do NOT include muscles from Phase II or clinical specialties).
- ARTICULAR SURFACES: joint(s) formed, type of joint, bones articulating, articular cartilage type.
- NERVE & VESSEL RELATIONS: nerves and vessels closely related to the bone or passing through its foramina.
- OSSIFICATION: primary and secondary centres of ossification, when they appear and fuse (important for radiological age estimation).
- CLINICAL CORRELATES (AN scope): common fracture sites and mechanism, which nerve or vessel is typically injured in that fracture, and the expected clinical sign (e.g. Saturday night palsy — radial nerve; wrist drop — radial nerve injury at mid-humeral fracture). Do NOT test surgical fixation techniques, implant selection, or post-operative management (Phase III Surgery).
- RADIOLOGY CORRELATION (CBME requirement for all bone stations): ask the student to describe what this bone looks like on a plain X-ray, identify normal radiological landmarks, or describe a classic fracture appearance on X-ray (e.g. Colles' fracture on wrist X-ray).
OUT OF SCOPE: surgical approaches, implant biomechanics, orthopaedic rehabilitation, Phase III clinical management.`,

  Visceral: `
CBME 1st-Year Visceral Station — permitted follow-up topics after organ identification (AN Gross Anatomy/Visceral competencies AN21–AN45):
- EXTERNAL FEATURES: parts, surfaces (named precisely — diaphragmatic, visceral, anterior, posterior), borders, poles, lobes, notches, and dimensions.
- PERITONEAL RELATIONS: intraperitoneal vs retroperitoneal vs secondarily retroperitoneal; specific peritoneal folds, ligaments, or omenta related to this organ and what they carry.
- RELATIONS: immediate anatomical neighbours on each surface — superior, inferior, anterior, posterior, left, right — using correct anatomical position.
- BLOOD SUPPLY: main artery of supply (with its origin from the aorta/branch), venous drainage (systemic vs portal), and any named anastomoses.
- LYMPHATIC DRAINAGE: first-echelon lymph nodes draining the organ.
- NERVE SUPPLY: sympathetic (preganglionic origin from spinal segments, ganglia involved, postganglionic distribution) and parasympathetic (cranial or sacral outflow, specific nerve name) — stay within 1st-year AN autonomic competencies; do NOT test clinical autonomic pharmacology.
- EMBRYOLOGICAL ORIGIN: gut derivative (foregut/midgut/hindgut), germ layer, specific developmental process; ONE classic congenital anomaly directly related to this organ's development.
- CLINICAL CORRELATE (AN scope): applied anatomy directly testable in 1st-year (e.g. surface marking for percussion, referred pain pathway through relevant nerve, portal hypertension routes for a visceral organ) — do NOT test diagnostic algorithms, drug therapy, or Phase III clinical management.
OUT OF SCOPE: surgical technique (incisions, steps), pharmacological management, Phase II/III clinical medicine topics.`,

  "Section Anatomy": `
CBME 1st-Year Section Anatomy Station — permitted follow-up topics after section identification (AN Cross-sectional/Neuroanatomy competencies):
- IDENTIFICATION: correct region (thorax/abdomen/pelvis/head/limb), level (vertebral level or anatomical landmark), and plane (transverse/sagittal/coronal).
- STRUCTURES VISIBLE: name every significant structure visible in the section — organs, muscles, bones, neurovascular bundles — using exact anatomical names.
- SPATIAL RELATIONS: precise positional relationships between the identified structures (anterior to, posterior to, medial to, lateral to, superficial to, deep to).
- NEUROVASCULAR BUNDLES: nerves and vessels visible at that level — their names, the spaces/compartments they travel in, and what they supply distal to that level.
- CONTENTS OF SPACES: named fascial compartments, spaces, or sacs visible (e.g. posterior mediastinum, retroperitoneal space, popliteal fossa) and their key contents.
- EMBRYOLOGICAL RELEVANCE: where applicable for the region shown, the developmental origin of a key structure and any congenital variant relevant to the section level.
- CLINICAL CORRELATE (AN scope): anatomical basis of a clinical feature relevant to this section level (e.g. mediastinal widening on CXR, referred pain, nerve block level for regional anaesthesia) — do NOT test radiological diagnosis algorithms or interventional techniques.
OUT OF SCOPE: CT/MRI pathological interpretation, Phase II/III radiology diagnosis, interventional procedures.`,

  Prosection: `
CBME 1st-Year Prosection Station — permitted follow-up topics after dissection identification (AN Dissection/Practical competencies from Cunningham's Manual):
- REGION AND APPROACH: name the dissection region (e.g. axilla, femoral triangle, posterior triangle of neck), the layers of dissection exposed, and which structures are displayed.
- STRUCTURE IDENTIFICATION: correct anatomical names of all nerves, vessels, muscles, and fasciae/spaces clearly visible in the dissection.
- COURSE: the full course of any identified nerve or vessel within the dissected region — origin, path, relations at each part, and where it exits the region.
- BRANCHES / TRIBUTARIES: branches of nerves (named, with area supplied) and tributaries of vessels (named, with area drained) as visible or relevant to this dissection.
- RELATIONS: precise relations of the identified nerve/vessel to surrounding muscles, bones, and fascial structures in this region.
- CLINICAL CORRELATES (AN scope): injury patterns for the nerve/vessel shown (mechanism, clinical signs — e.g. wrist drop from radial nerve injury in the spiral groove; varicose veins from saphenofemoral incompetence), surface marking of the structure for clinical procedures (nerve blocks, vascular access), and anatomical variation relevant to surgery — do NOT test surgical technique, choice of approach, or postoperative care.
- EMBRYOLOGICAL CORRELATION: developmental origin of a key structure in the dissection, and a relevant congenital anomaly (e.g. persistence of a vessel, bifid structure).
OUT OF SCOPE: surgical operative technique, instrument names, anaesthetic drug dosing, Phase III clinical management.`,
};

/**
 * A short enforcement reminder appended to the examiner prompt for all
 * image-based Anatomy stations — reinforces CBME 1st-year scope after
 * the detailed per-station scope block above.
 */
export const ANATOMY_CBME_SCOPE_REMINDER = `
STRICT CBME SCOPE RULE: Every question you ask at this station — both your opening identification question AND every follow-up — must fall within 1st-year (Phase I) MBBS Anatomy competencies as listed above. Do NOT cross into Phase II topics (Pathology, Pharmacology, Microbiology) or Phase III clinical management (surgical technique, drug therapy, operative steps). Applied anatomy clinical correlates are permitted only when explicitly listed in the station scope above. If a student's answer leads into Phase II/III territory, acknowledge it briefly and redirect to a 1st-year AN scope question.`;
