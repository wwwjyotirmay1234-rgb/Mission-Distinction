export interface PhysiologyClinicalImage {
  topic: string;
  src: string;
  caption: string;
}

export const PHYSIOLOGY_CLINICAL_IMAGES: PhysiologyClinicalImage[] = [
  {
    topic: "ECG waveform",
    src: "/images/physiology-clinical/ecg-trace.jpg",
    caption: "Normal ECG strip — identify the waves, calculate rate, and comment on rhythm.",
  },
  {
    topic: "Spirometry / lung volumes",
    src: "/images/physiology-clinical/spirometry-volumes.png",
    caption: "Spirogram showing lung volumes and capacities — identify each labelled segment.",
  },
  {
    topic: "Blood pressure measurement",
    src: "/images/physiology-clinical/bp-measurement.png",
    caption: "Sphygmomanometer setup for BP measurement — explain the technique and Korotkoff sounds.",
  },
  {
    topic: "Arterial pulse sites",
    src: "/images/physiology-clinical/pulse-sites.jpg",
    caption: "Common arterial pulse palpation sites on the body — name and locate each.",
  },
  {
    topic: "Knee-jerk (patellar) reflex",
    src: "/images/physiology-clinical/knee-jerk-reflex.png",
    caption: "Patellar reflex arc — trace the pathway and explain the components.",
  },
  {
    topic: "Cardiac auscultation areas",
    src: "/images/physiology-clinical/auscultation-points.jpg",
    caption: "Standard cardiac auscultation points on the chest — name each area and the valve it corresponds to.",
  },
];
