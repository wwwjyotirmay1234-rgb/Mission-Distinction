export interface BiochemistryImage {
  topic: string;
  src: string;
  caption: string;
  displayCaption: string;
}

export const BIOCHEMISTRY_SERUM_URINE_IMAGES: BiochemistryImage[] = [
  {
    topic: "Colorimeter / semi-autoanalyzer",
    src: "/images/biochemistry/colorimeter.jpg",
    caption:
      "Digital photoelectric colorimeter with filter wheel and cuvettes, used for colorimetric serum estimations (glucose, urea, creatinine, protein, bilirubin, cholesterol) — explain the principle and how it is used.",
    displayCaption: "Identify the apparatus shown and explain the principle behind its use in serum estimations.",
  },
  {
    topic: "Benedict's test for urine sugar",
    src: "/images/biochemistry/benedicts-test.png",
    caption:
      "A row of test tubes showing the graded color change of Benedict's test for reducing sugars in urine, from blue (negative) through green, yellow, orange, to brick-red (strongly positive) — identify the test, the principle, and grade each tube.",
    displayCaption: "Identify the test being performed, explain its principle, and grade each tube's result.",
  },
  {
    topic: "Urine protein test",
    src: "/images/biochemistry/urine-protein-test.jpg",
    caption:
      "A row of test tubes showing increasing turbidity for a urine protein precipitation test (heat coagulation test / sulfosalicylic acid test), from clear (negative) to densely turbid (strongly positive) — identify the test, the principle, and grade each tube.",
    displayCaption: "Identify the test being performed, explain its principle, and grade each tube's turbidity.",
  },
  {
    topic: "Rothera's test for ketone bodies",
    src: "/images/biochemistry/rothera-test.png",
    caption:
      "A test tube showing a purple/permanganate-colored ring at the junction of two layers, characteristic of a positive Rothera's test for ketone bodies in urine — identify the test, the principle, and interpret the result.",
    displayCaption: "Identify the test being performed, explain its principle, and interpret the result shown.",
  },
];
