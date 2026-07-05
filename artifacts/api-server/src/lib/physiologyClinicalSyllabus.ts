/**
 * Baseline syllabus for the "Human Experiments & Clinical Physiology" Physiology viva type.
 *
 * Grounded in AK Jain's "Manual of Practical Physiology" and Ghai's "Textbook of
 * Practical Physiology". This station covers bedside clinical-examination
 * competencies plus human/recording experiments and amphibian/mammalian
 * experiment concepts (now simulator/virtual-lab based per NMC guidelines).
 *
 * This viva type also uses reference images/diagrams (ECG traces, spirometry
 * charts, BP technique, pulse sites, reflex testing, auscultation points) —
 * the frontend displays one to the student and passes its topic/caption here
 * so the examiner can ask spot questions about what is shown.
 */
export const PHYSIOLOGY_CLINICAL_SYLLABUS = `
Baseline Human Experiments & Clinical Physiology viva syllabus (reference: AK Jain's Manual of Practical Physiology, Ghai's Textbook of Practical Physiology). This station mixes bedside clinical-examination skills with human/recording experiments — rotate across these, do not drift into hematology lab tests or broad theory recall:

1. Clinical Physiology / Clinical Examination:
   - Arterial pulse examination — rate, rhythm, volume, character, condition of the vessel wall; radial, brachial, carotid, femoral, popliteal, posterior tibial, dorsalis pedis pulses; clinical correlations (pulsus alternans, pulsus paradoxus, water-hammer/collapsing pulse).
   - Blood pressure measurement — sphygmomanometer technique (auscultatory and palpatory methods), Korotkoff sounds and their phases, normal values, orthostatic hypotension, common technique errors (cuff size, arm position).
   - Respiratory system clinical examination — inspection, palpation, percussion, auscultation basics; normal vs adventitious breath sounds; relating findings to ventilatory mechanics.
   - Cardiovascular examination basics relevant to physiology — JVP inspection and waveform (a, c, v waves), heart sounds and their physiological basis (S1/S2 origin, physiological splitting).
   - Body Mass Index (BMI) and nutritional status assessment — calculation, WHO classification, clinical significance.

2. Human/Recording Experiments:
   - Spirometry — recording and interpreting lung volumes/capacities (Tidal Volume, IRV, ERV, Residual Volume, Vital Capacity, TLC), FEV1/FVC ratio, distinguishing obstructive vs restrictive patterns.
   - Electrocardiogram (ECG) — standard limb lead and chest lead placement (Einthoven's triangle, augmented/precordial leads), normal waveform (P-QRS-T and their genesis), heart rate calculation from an ECG strip, basic axis determination, recognizing gross rhythm abnormalities (bradycardia, tachycardia, ectopics) at MBBS level.
   - Basic reflexes — knee jerk, ankle jerk, corneal reflex, abdominal reflex; principle, reflex arc components (receptor, afferent, center, efferent, effector), clinical significance of exaggerated/absent reflexes.
   - Special-sense screening — visual acuity testing, color vision testing (Ishihara charts), and other basic special-sense tests in the practical curriculum.

3. Experimental Physiology concepts (amphibian/mammalian — now simulator/virtual-lab based per current NMC/CBME guidelines, but still examinable as viva concepts):
   - Simple/compound muscle twitch; effect of temperature and load on skeletal muscle contraction (frog gastrocnemius-sciatic preparation, simulator-based).
   - Effect of stimulus strength and frequency — genesis of tetanus, staircase phenomenon (Treppe), summation of contractions.
   - Nerve-muscle physiology — action potential recording concepts, conduction velocity, refractory period.
   - Mammalian experiment concepts (via simulator/virtual lab) — cardiac cycle correlation, effect of vagal stimulation, baroreceptor reflex.
   - Be ready to explain why these are now simulator/virtual-lab based (ethical/animal-use reasons under CBME/NMC) while remaining examinable as viva concepts.

When the student has an image/diagram displayed to them (an ECG trace, spirometry graph, BP measurement setup, a pulse/palpation site diagram, a reflex-testing illustration, or an auscultation-points chart), ask a spot-identification or interpretation question directly about that image first — e.g. "look at the trace in front of you, what does this pattern indicate?" — before moving to other topics. Prefer application/interpretation questions ("what would you infer from this finding", "why is this pattern abnormal") over pure definition recall, consistent with CBME's Shows/Shows How level.
`.trim();
