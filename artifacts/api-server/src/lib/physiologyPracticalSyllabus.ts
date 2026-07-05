/**
 * Baseline CBME Physiology practical syllabus for the Practical Hub AI viva examiner.
 *
 * Grounded in the gold-standard Indian MBBS practical physiology references:
 * - AK Jain's "Manual of Practical Physiology" (the standard practical manual used across NMC-affiliated colleges)
 * - Ghai's "Textbook of Practical Physiology"
 * - Guyton & Hall's "Textbook of Medical Physiology" (theory backing for viva cross-questions)
 *
 * This is always folded into the Physiology examiner persona (in addition to any
 * admin-uploaded source notes) so the AI reliably covers the real exam syllabus
 * instead of improvising topics.
 */
export const PHYSIOLOGY_PRACTICAL_SYLLABUS = `
Baseline CBME Physiology practical syllabus to draw spot/case questions from (reference: AK Jain's Manual of Practical Physiology, Ghai's Textbook of Practical Physiology, Guyton & Hall for theory correlation). Rotate across these areas rather than sticking to only one:

1. Hematology (PY practical competencies, "Shows/Shows How" level):
   - Hemoglobin estimation (Sahli's method / cyanmethemoglobin method) — principle, procedure, normal values, sources of error.
   - Total Leukocyte Count (TLC) and Differential Leukocyte Count (DLC) — diluting fluid used, chamber counting procedure, normal ranges, clinical correlation (leukocytosis, leukopenia, eosinophilia).
   - Total RBC Count and blood indices (PCV/hematocrit, MCV, MCH, MCHC) — calculation and interpretation.
   - Bleeding Time and Clotting Time (Duke's/Ivy's method, capillary tube method) — procedure, normal values, clinical relevance (bleeding disorders, anticoagulant monitoring).
   - Blood Grouping and Rh typing — ABO/Rh typing by slide method, agglutination principle, blood transfusion reactions, erythroblastosis fetalis.
   - Erythrocyte Sedimentation Rate (ESR) — Westergren's method, normal values, factors affecting ESR, clinical use as an inflammatory marker.
   - Osmotic fragility of RBCs — principle and clinical correlation with hemolytic anemias.

2. Clinical Physiology / Clinical Examination viva (bedside-oriented "Shows How" competencies):
   - Arterial pulse examination — rate, rhythm, volume, character, condition of vessel wall; radial, brachial, carotid, femoral, popliteal, posterior tibial, dorsalis pedis pulses; clinical correlations (pulsus alternans, pulsus paradoxus, water-hammer pulse).
   - Blood pressure measurement — sphygmomanometer technique (auscultatory and palpatory method), Korotkoff sounds, normal values, orthostatic hypotension, common errors in BP measurement.
   - Respiratory system clinical examination — inspection, palpation, percussion, auscultation basics; breath sounds; relating findings to physiological mechanisms of ventilation.
   - Examination of the cardiovascular system basics as relevant to physiology (JVP inspection, heart sounds and their physiological basis — S1/S2 origin, splitting).
   - Body Mass Index (BMI) and nutritional status assessment; interpretation and clinical significance.

3. Experimental Physiology — Amphibian & Mammalian experiments (now largely simulator/virtual-lab based per NMC guidelines, but viva concepts remain examinable):
   - Simple/Compound muscle twitch, effect of temperature and load on skeletal muscle contraction (frog gastrocnemius-sciatic preparation, simulator-based).
   - Effect of stimulus strength and frequency — genesis of tetanus, staircase phenomenon (Treppe), summation of contractions.
   - Nerve-muscle physiology — recording of action potential, conduction velocity concepts, refractory period.
   - Mammalian experiments (recording via simulators/virtual labs as per current NMC norms) — cardiac cycle correlation, effect of vagal stimulation, baroreceptor reflex concepts.
   - Ability to explain why these are now largely simulator/virtual-lab based (ethical/animal-use reasons under CBME/NMC) while still being examinable in viva as concepts.

4. Human/Recording Experiments:
   - Spirometry — recording and interpretation of lung volumes and capacities (Tidal Volume, IRV, ERV, Residual Volume, Vital Capacity, TLC), FEV1/FVC ratio, obstructive vs restrictive pattern interpretation.
   - Electrocardiogram (ECG) — standard limb leads and chest lead placement, normal ECG waveform (P-QRS-T), calculation of heart rate from ECG, basic axis determination, identifying gross rhythm abnormalities (e.g. bradycardia, tachycardia, ectopics) at an MBBS-appropriate level.
   - Basic reflexes (knee jerk, ankle jerk, corneal, abdominal) — principle, clinical significance, reflex arc components.
   - Examination of visual acuity, color vision (Ishihara charts), and basic special-sense screening tests as covered in the practical curriculum.

Prefer application/interpretation-style questions ("what would you infer from this ECG finding", "why does BT prolong in this condition") over pure definition recall, consistent with CBME's Shows/Shows How level for practical stations.
`.trim();
