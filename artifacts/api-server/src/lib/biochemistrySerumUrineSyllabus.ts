/**
 * Baseline syllabus for the "Serum and Urine Estimation" Biochemistry viva type.
 *
 * Grounded in the standard Indian 1st-year MBBS Biochemistry practical
 * curriculum under NMC CBME (clinical biochemistry practical competencies —
 * "Shows/Shows How" level), referencing Harper's Illustrated Biochemistry,
 * DM Vasudevan's Textbook of Biochemistry, and standard practical manuals
 * (Godkar's Practical Clinical Biochemistry, Chawla's Practical Biochemistry).
 *
 * This station tests the semi-auto-analyzer / colorimetric estimation
 * experiments and urine analysis competencies students actually perform in
 * the lab — principle, procedure, normal values, and the diseases each test
 * is used to diagnose/monitor — NOT the broad theory syllabus.
 */
export const BIOCHEMISTRY_SERUM_URINE_SYLLABUS = `
Baseline Serum and Urine Estimation viva syllabus (reference: Godkar's Practical Clinical Biochemistry, Chawla's Practical Biochemistry, Harper's Illustrated Biochemistry, DM Vasudevan's Textbook of Biochemistry). This station tests the clinical/serum and urine biochemistry practical competencies ONLY — principle, procedure, normal values, and disease correlation of each estimation — rotate across these, do not drift into unrelated theory topics:

1. Estimation of Blood/Serum Glucose (GOD-POD / glucose oxidase-peroxidase method):
   - Principle of the enzymatic colorimetric method, reagents used, colorimeter/semi-auto-analyzer procedure, calculation from standard.
   - Normal fasting and postprandial blood glucose values (as per ADA/WHO criteria used in India).
   - Clinical correlation: diabetes mellitus (type 1, type 2, diagnostic criteria — fasting, OGTT, HbA1c), hypoglycemia and its causes, glycosuria and renal threshold for glucose.

2. Estimation of Blood Urea / Serum Urea (Diacetyl monoxime method, or urease-based methods):
   - Principle, reagents, procedure, normal range.
   - Renal function correlation: pre-renal, renal, and post-renal causes of raised blood urea; azotemia and uremia; correlation with GFR and dietary protein intake.

3. Estimation of Serum Creatinine (Jaffe's method — alkaline picrate reaction):
   - Principle, procedure, normal range, sources of interference/error in Jaffe's method.
   - Clinical correlation: renal function assessment, creatinine clearance and estimated GFR, chronic kidney disease staging, why creatinine is preferred over urea as a renal marker.

4. Estimation of Serum Total Protein, Albumin, and Globulin (Biuret method for total protein; bromocresol green for albumin):
   - Principle of the Biuret reaction, procedure, normal values of total protein, albumin, globulin, and A/G ratio.
   - Clinical correlation: hypoproteinemia (nephrotic syndrome, liver cirrhosis, malnutrition, malabsorption), hyperglobulinemia (multiple myeloma, chronic infections), reversal of A/G ratio in liver disease and nephrotic syndrome.

5. Estimation of Serum Bilirubin (van den Bergh reaction — direct and indirect/total bilirubin):
   - Principle of the diazo reaction, procedure, normal values of total, direct (conjugated), and indirect (unconjugated) bilirubin.
   - Clinical correlation: classification and biochemical differentiation of jaundice — pre-hepatic/hemolytic (raised indirect bilirubin), hepatic (raised both), post-hepatic/obstructive (raised direct bilirubin); neonatal jaundice/kernicterus.

6. Estimation of Serum Cholesterol / Lipid Profile (CHOD-PAP enzymatic method):
   - Principle, procedure, normal values of total cholesterol, LDL, HDL, triglycerides.
   - Clinical correlation: dyslipidemia, atherosclerosis and coronary artery disease risk, hypothyroidism and nephrotic syndrome causing raised cholesterol.

7. Liver Function Tests — SGOT (AST), SGPT (ALT), Serum Alkaline Phosphatase:
   - Principle of enzymatic estimation, normal values, De Ritis ratio (AST/ALT).
   - Clinical correlation: hepatocellular damage (viral hepatitis, alcoholic liver disease — raised transaminases, ALT > AST typically), cholestatic/obstructive pattern (raised ALP, GGT), differentiating hepatocellular vs obstructive jaundice biochemically.

8. Estimation of Serum Calcium and Phosphorus:
   - Principle (e.g., O-cresolphthalein complexone method for calcium), procedure, normal values.
   - Clinical correlation: hypocalcemia/hypercalcemia causes, rickets/osteomalacia, hyperparathyroidism/hypoparathyroidism, chronic kidney disease-related bone disorders.

9. Qualitative Analysis of Urine — Normal and Abnormal Constituents:
   - Physical examination of urine (color, appearance, specific gravity, pH).
   - Test for reducing sugars (Benedict's test) — principle, procedure, grading of color change, clinical significance (glycosuria, other reducing sugars in urine).
   - Test for proteins (Heat coagulation test, sulfosalicylic acid test) — principle, procedure, grading, causes of proteinuria (renal disease, pre-eclampsia, orthostatic proteinuria, Bence Jones protein in multiple myeloma).
   - Test for ketone bodies (Rothera's test) — principle, procedure, clinical significance (diabetic ketoacidosis, starvation ketosis).
   - Tests for bile salts and bile pigments (Hay's test for bile salts, Fouchet's test for bile pigments) — principle, clinical correlation with obstructive jaundice.
   - Test for blood/hemoglobin in urine (hematuria vs hemoglobinuria vs myoglobinuria) — clinical causes.
   - Interpreting a complete urine report in the context of a clinical case (e.g., a diabetic patient's urine, a nephrotic syndrome patient's urine, an obstructive jaundice patient's urine).

10. Renal Function correlation across tests: how blood urea, serum creatinine, creatinine clearance, and urine findings together are used to assess and stage renal function/disease; concept of GFR estimation formulas (Cockcroft-Gault, MDRD) at an introductory level.

For every estimation, expect the student to know: the underlying biochemical principle/reaction, a brief stepwise procedure (as performed with a colorimeter/semi-auto-analyzer in the CBME practical curriculum), the normal reference range, and — most importantly — which diseases/clinical conditions the test is used to diagnose or monitor and how the value changes in those conditions. Prefer case-based application questions ("a patient's serum bilirubin shows raised indirect fraction with normal direct — what does this suggest?") over pure procedure recall once the basics are established, consistent with CBME's Shows/Shows How level.
`.trim();
