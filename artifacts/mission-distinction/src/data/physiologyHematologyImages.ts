export interface PhysiologyClinicalImage {
  topic: string;
  src: string;
  caption: string;
  displayCaption: string;
}

export const PHYSIOLOGY_HEMATOLOGY_IMAGES: PhysiologyClinicalImage[] = [
  {
    topic: "Neubauer counting chamber (hemocytometer)",
    src: "/images/physiology-hematology/hemocytometer.webp",
    caption: "Improved Neubauer counting chamber grid — identify which squares are used for RBC vs WBC counting and explain the counting procedure.",
    displayCaption: "Identify the apparatus shown, name which squares are used for RBC vs WBC counting, and explain the counting procedure.",
  },
  {
    topic: "Sahli's hemoglobinometer",
    src: "/images/physiology-hematology/sahli-hemoglobinometer.jpg",
    caption: "Sahli's hemoglobinometer apparatus — explain the acid hematin method for hemoglobin estimation step by step.",
    displayCaption: "Identify the apparatus shown and explain the method for hemoglobin estimation step by step.",
  },
  {
    topic: "ABO blood grouping slide test",
    src: "/images/physiology-hematology/blood-grouping-slide.jpg",
    caption: "Slide agglutination test for ABO blood grouping — interpret the agglutination pattern shown and state the blood group.",
    displayCaption: "Interpret the agglutination pattern shown and state the blood group.",
  },
  {
    topic: "Westergren ESR tube",
    src: "/images/physiology-hematology/westergren-esr-tube.webp",
    caption: "Westergren tube and stand for ESR estimation — explain the procedure and the normal ESR range for adult males and females.",
    displayCaption: "Identify the apparatus shown, explain the procedure for its use, and state the normal range for adult males and females.",
  },
];
