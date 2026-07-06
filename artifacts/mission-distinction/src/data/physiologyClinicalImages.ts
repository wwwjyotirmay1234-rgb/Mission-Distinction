export interface PhysiologyClinicalImage {
  topic: string;
  src: string;
  caption: string;
  displayCaption: string;
}

export const PHYSIOLOGY_CLINICAL_IMAGES: PhysiologyClinicalImage[] = [
  {
    topic: "ECG waveform",
    src: "/images/physiology-clinical/ecg-trace.jpg",
    caption: "Normal ECG strip — identify the waves, calculate rate, and comment on rhythm.",
    displayCaption: "Identify what is shown, calculate the rate, and comment on the rhythm.",
  },
  {
    topic: "Spirometry / lung volumes",
    src: "/images/physiology-clinical/spirometry-volumes.png",
    caption: "Spirogram showing lung volumes and capacities — identify each labelled segment.",
    displayCaption: "Identify what is shown and label each segment.",
  },
  {
    topic: "Blood pressure measurement",
    src: "/images/physiology-clinical/bp-measurement.png",
    caption: "Sphygmomanometer setup for BP measurement — explain the technique and Korotkoff sounds.",
    displayCaption: "Identify the apparatus/setup shown and explain the measurement technique.",
  },
  {
    topic: "Arterial pulse sites",
    src: "/images/physiology-clinical/pulse-sites.png",
    caption: "Common arterial pulse palpation sites on the body — name and locate each.",
    displayCaption: "Name and locate what is shown on the body.",
  },
  {
    topic: "Knee-jerk (patellar) reflex",
    src: "/images/physiology-clinical/knee-jerk-reflex.png",
    caption: "Patellar reflex arc — trace the pathway and explain the components.",
    displayCaption: "Identify what is shown, trace the pathway, and explain its components.",
  },
  {
    topic: "Cardiac auscultation areas",
    src: "/images/physiology-clinical/auscultation-points.png",
    caption: "Standard cardiac auscultation points on the chest — name each area and the valve it corresponds to.",
    displayCaption: "Name what is shown and the valve each point corresponds to.",
  },
];
