export interface SampleDoc {
  fileName: string;
  medicineName: string;
  documentType: 'leaflet' | 'care sheet';
  pageLastReviewed: string;
  country: string;
  source: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    fileName: '01_Paracetamol_for_Adults_NHS.md',
    medicineName: 'Paracetamol',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Paracetamol for Adults
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About paracetamol
Paracetamol is a common painkiller used to treat aches and pain. It can also be used to reduce a high temperature or fever. It is available as tablets, capsules, or syrup, and is safe for most adults when taken at the recommended dose.

## How and when to take it
The usual dose for adults is one or two 500mg tablets every 4 to 6 hours. Never take more than 4 doses (maximum 8 tablets or 4000mg) in any 24-hour period. Leave at least 4 hours between doses. Always swallow tablets with a drink of water.

## If you miss a dose
If you forget to take your paracetamol dose, take it as soon as you remember, unless it is nearly time for your next scheduled dose. Never take a double dose to make up for a forgotten dose. Always leave at least 4 hours between any two doses.

## If you take too much
Taking too much paracetamol can cause serious liver damage. If you take more than 8 tablets in 24 hours, seek emergency help immediately. In India, call 112 or go straight to the nearest hospital casualty department, even if you feel completely fine.

## Taking with other medicines
Paracetamol is safe to take with most prescription medicines, including metformin, amlodipine, and levothyroxine. However, check whether your other medicines contain paracetamol (such as cough or cold remedies) to avoid an accidental overdose.`
  },
  {
    fileName: '02_Metformin_NHS.md',
    medicineName: 'Metformin',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Metformin
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About metformin
Metformin is a medicine used to treat type 2 diabetes and to prevent type 2 diabetes if you are at high risk. It helps lower blood sugar levels by improving how your body handles insulin and decreasing sugar production in the liver.

## How and when to take it
Metformin is best taken with or straight after a meal to reduce stomach side effects. Swallow tablets whole with a glass of water. Do not crush or chew modified-release tablets. The dose depends on your doctor's prescription.

## If you miss a dose
If you forget to take a dose, take it as soon as you remember, unless it is nearly time for your next dose. If you take metformin more than once a day, skip the missed dose and take your next dose at the usual time. Never take 2 doses at the same time to make up for a forgotten dose. Do not take a double dose.

## Side effects
Common side effects include feeling sick, diarrhea, stomach ache, loss of appetite, and a metallic taste in the mouth. These usually wear off after a couple of weeks as your body gets used to the medicine.

## Urgent warnings and emergencies
Very rarely, metformin can cause lactic acidosis, especially if your kidneys are not working properly. Symptoms include rapid breathing, severe stomach pain, extreme tiredness, or feeling very cold. If this occurs, call 112 or seek emergency hospital care immediately.`
  },
  {
    fileName: '03_Atorvastatin_NHS.md',
    medicineName: 'Atorvastatin',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Atorvastatin
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About atorvastatin
Atorvastatin belongs to a group of medicines called statins. It is used to lower cholesterol and reduce the risk of heart disease, angina, heart attacks, and stroke.

## How and when to take it
Take atorvastatin once a day. You can take it at any time of day, but try to take it at the same time every day. Most people take it at bedtime. You can take it with or without food. Swallow the tablet whole with water.

## If you miss a dose
If you forget to take a dose of atorvastatin, take your next dose the following day at your usual time. Do not take a double dose to make up for a forgotten tablet.

## Side effects
Common side effects include headache, feeling sick, mild diarrhea, and back or joint pain. If you develop unexplained muscle pain, tenderness, or weakness, speak to your doctor promptly as tests may be needed.

## Foods and drinks to avoid
Do not drink large amounts of grapefruit juice while taking atorvastatin. Grapefruit juice contains compounds that increase the concentration of atorvastatin in your blood, increasing the risk of adverse side effects.`
  },
  {
    fileName: '04_Doctors_Care_Sheet_A_Diabetes_Cholesterol_SAMPLE.md',
    medicineName: "Doctor's Care Sheet A",
    documentType: 'care sheet',
    pageLastReviewed: '20 February 2024',
    country: 'India',
    source: 'Fictional sample care sheet (not a real doctor or patient)',
    content: `# Doctor's Care Sheet A: Diabetes and Cholesterol
Source: Fictional sample care sheet, Dr. Sharma Clinic (not a real doctor or patient) | Document type: care sheet | Page last reviewed: 20 February 2024 | Country: India

## Patient Treatment Plan
Patient is under clinical management for Type 2 Diabetes Mellitus and Hypercholesterolemia. Current daily medicines: Metformin 500mg twice daily taken with breakfast and dinner; Atorvastatin 20mg once daily taken at bedtime.

## Pain Relief and Headache Instructions
Important instruction from your physician: Strictly avoid ibuprofen, naproxen, diclofenac, and all other NSAIDs. Ibuprofen poses a high risk of kidney strain and acute kidney injury when combined with metformin and diabetes. If you have a headache, fever, or joint pain, take Paracetamol 500mg (up to 1g per dose, maximum 4g per day). Always follow this care sheet first before general medicine leaflets.

## Missed Dose and Administration Protocol
Take metformin strictly with meals to prevent gastrointestinal upset. If you miss your morning or evening metformin dose, skip it and continue your normal schedule. Never double the dose. If you forget your night atorvastatin, skip it and resume next evening.

## Emergency Protocols
In India, if you experience sudden dizziness, sweating, blood glucose below 70 mg/dL, difficulty breathing, or severe abdominal pain, call 112 immediately or proceed to the nearest emergency room.`
  },
  {
    fileName: '05_Ibuprofen_for_Adults_NHS.md',
    medicineName: 'Ibuprofen',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Ibuprofen for Adults
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About ibuprofen
Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID). It is used to relieve aches and pains including headaches, backache, toothache, period pain, and arthritis. It also reduces inflammation and fever.

## How and when to take it
The usual adult dose is one or two 200mg tablets, 3 times a day. Leave at least 4 to 6 hours between doses. Always take ibuprofen with food or a meal to protect your stomach. Never take more than 1200mg (six 200mg tablets) in 24 hours without a doctor's direction.

## Who cannot take ibuprofen
Do not take ibuprofen if you have a stomach ulcer, severe kidney or heart failure, or have had an allergic reaction to aspirin. If you have diabetes, high blood pressure, or are taking doctor-prescribed medicines, check with your physician before taking ibuprofen.

## If you miss a dose
If you forget to take a dose, take it as soon as you remember with some food, unless it is nearly time for your next dose. Do not take a double dose to make up for a missed dose.

## Serious warnings
Ibuprofen can irritate the stomach lining. Stop taking it and contact a doctor if you develop black stools, vomit blood, or experience unexplained breathing difficulties.`
  },
  {
    fileName: '06_Aspirin_NHS.md',
    medicineName: 'Aspirin',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Aspirin
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About aspirin
Aspirin is an everyday painkiller and anti-platelet medicine. Low-dose aspirin (75mg daily) is prescribed to prevent blood clots, heart attacks, and strokes. Higher doses (300mg to 600mg) are used for pain and fever.

## How to take aspirin
Always take aspirin with food to protect your stomach from irritation. Swallow tablets whole with water. If taking soluble or dispersible tablets, dissolve them in a glass of water before drinking.

## If you miss a dose
If you take low-dose aspirin daily and miss a dose, take it as soon as you remember unless it is almost time for your next dose. Never take two tablets to make up for a forgotten one.

## Who must avoid aspirin
Never give aspirin to children under 16 years of age unless prescribed by a specialist doctor, due to the risk of Reye's syndrome. Avoid if you have active stomach ulcers or bleeding disorders.`
  },
  {
    fileName: '07_Cetirizine_NHS.md',
    medicineName: 'Cetirizine',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Cetirizine
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About cetirizine
Cetirizine is an antihistamine medicine that helps relieve symptoms of allergies such as hay fever, pet allergies, dust allergies, and hives. It blocks histamine receptors in the body.

## How and when to take it
The standard adult dose is one 10mg tablet once a day. You can take it with or without food. It is classified as a non-drowsy antihistamine, although some individuals may still feel mild drowsiness.

## If you miss a dose
If you miss a dose, take it as soon as you remember. If it is already the next day, skip the missed dose and take your normal tablet at the usual time. Do not double up.`
  },
  {
    fileName: '08_Omeprazole_NHS.md',
    medicineName: 'Omeprazole',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Omeprazole
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About omeprazole
Omeprazole is a proton pump inhibitor (PPI). It reduces the amount of acid your stomach produces. It is used to treat indigestion, heartburn, acid reflux, and stomach ulcers.

## How and when to take it
Take omeprazole once a day in the morning, ideally 30 to 60 minutes before breakfast. Swallow the capsules or tablets whole with water. Do not crush or chew them as they have a protective coating against stomach acid.

## If you miss a dose
If you forget to take a dose, take it as soon as you remember that day. If you remember late in the day or near bedtime, skip the missed dose and resume next morning. Do not take a double dose.`
  },
  {
    fileName: '09_Pantoprazole_NHS.md',
    medicineName: 'Pantoprazole',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Pantoprazole
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About pantoprazole
Pantoprazole is a proton pump inhibitor that decreases stomach acid production. It is prescribed for gastroesophageal reflux disease (GERD), reflux oesophagitis, and to prevent NSAID-induced ulcers.

## How to take pantoprazole
Take pantoprazole tablets 1 hour before a meal (typically breakfast). Swallow the tablet whole with water. Do not chew, break, or crush the tablet.

## If you miss a dose
Take the missed dose as soon as you remember, unless it is time for the next scheduled dose. Never take two tablets together to compensate for a missed dose.`
  },
  {
    fileName: '10_Amlodipine_NHS.md',
    medicineName: 'Amlodipine',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Amlodipine
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About amlodipine
Amlodipine is a calcium channel blocker used to treat high blood pressure (hypertension) and prevent angina chest pain. Lowering blood pressure reduces the risk of strokes and heart attacks.

## How and when to take it
The usual starting dose is 5mg once a day, which may be increased to 10mg once daily if needed. Take it at the same time each day, with or without food.

## If you miss a dose
If you forget to take a tablet, take it as soon as you remember that day. If you do not remember until the next day, leave out the missed dose and take your normal tablet at the usual time. Never take 2 doses together.`
  },
  {
    fileName: '11_Losartan_NHS.md',
    medicineName: 'Losartan',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Losartan
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About losartan
Losartan is an angiotensin receptor blocker (ARB) used for high blood pressure and to protect kidney function in patients with type 2 diabetes and kidney disease.

## How to take it
Take losartan once daily, with or without food, preferably at the same time each day. Swallow whole with a drink of water.

## If you miss a dose
If you miss a dose, take it as soon as you remember unless it is nearly time for your next dose. In that case, skip the missed dose. Do not take a double dose.`
  },
  {
    fileName: '12_Simvastatin_NHS.md',
    medicineName: 'Simvastatin',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Simvastatin
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About simvastatin
Simvastatin is a statin medicine that lowers low-density lipoprotein (bad cholesterol) and triglycerides in your blood, helping prevent cardiovascular events.

## When to take simvastatin
Take simvastatin once daily in the evening or at bedtime. This is because your body produces the most cholesterol during the night.

## If you miss a dose
If you forget to take your tablet at night, leave out the missed dose and take your normal dose the next evening. Do not take an extra tablet to compensate.`
  },
  {
    fileName: '13_Levothyroxine_NHS.md',
    medicineName: 'Levothyroxine',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Levothyroxine
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About levothyroxine
Levothyroxine is a synthetic thyroid hormone used to treat an underactive thyroid gland (hypothyroidism). It replaces the thyroxine hormone your thyroid cannot make.

## How and when to take it
Take levothyroxine once daily in the morning on an empty stomach, at least 30 to 60 minutes before having breakfast, tea, or coffee. Food and drinks containing caffeine interfere with its absorption.

## Avoiding mineral interactions
Do not take iron tablets (such as ferrous fumarate), calcium supplements, or antacids within 4 hours of taking levothyroxine. These bind to the hormone in your gut and prevent it from being absorbed.

## If you miss a dose
If you forget to take a dose, take it as soon as you remember, unless it is almost time for your next dose. In that case, skip the forgotten dose and take your next dose at the normal time. Never take a double dose.`
  },
  {
    fileName: '14_Amoxicillin_NHS.md',
    medicineName: 'Amoxicillin',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Amoxicillin
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About amoxicillin
Amoxicillin is a penicillin antibiotic used to treat bacterial infections such as chest infections, dental abscesses, and urinary tract infections. It does not treat viral infections like colds or flu.

## How to take it
Space your doses evenly throughout the day. If taking 3 times daily, this is usually every 8 hours. Complete the entire prescribed course even if you feel better.

## If you miss a dose
Take the missed dose as soon as you remember, unless it is nearly time for your next dose. Never double up doses.`
  },
  {
    fileName: '15_Lactulose_NHS.md',
    medicineName: 'Lactulose',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Lactulose
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About lactulose
Lactulose is a sweet liquid laxative used to treat constipation. It works by drawing water into the bowel to soften stools and make them easier to pass. It can take up to 48 hours to work.

## How to take it
Lactulose can be taken once or twice a day. You can mix it with water or fruit juice to improve the taste. Drink plenty of water throughout the day.

## If you miss a dose
If you forget a dose of lactulose, take it when you remember, or skip it if it is close to your next dose. Do not take extra medicine to make up for a missed dose.`
  },
  {
    fileName: '16_Folic_Acid_NHS.md',
    medicineName: 'Folic Acid',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Folic Acid
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About folic acid
Folic acid is a synthetic version of vitamin B9 (folate). It is essential for making red blood cells and preventing neural tube defects in early pregnancy.

## Dosage and timing
For general deficiency, the typical dose is 5mg daily. When planning pregnancy, women take 400 micrograms daily. Take it at any time with or without food.

## If you miss a dose
Take the missed tablet as soon as you remember, or skip it if it is the following day. Never take a double dose.`
  },
  {
    fileName: '17_Ferrous_Fumarate_NHS.md',
    medicineName: 'Ferrous Fumarate',
    documentType: 'leaflet',
    pageLastReviewed: 'not verified (adapted test copy)',
    country: 'UK',
    source: 'Adapted from the NHS website (nhs.uk)',
    content: `# Ferrous Fumarate
Source: Adapted from the NHS website (nhs.uk), not official NHS text | Document type: leaflet | Page last reviewed: not verified (adapted test copy) | Country: UK

## About ferrous fumarate
Ferrous fumarate is an iron supplement used to treat or prevent iron-deficiency anaemia. It helps your body produce healthy red blood cells that transport oxygen.

## How to take it
Take ferrous fumarate on an empty stomach with water or orange juice (vitamin C helps absorption). If it upsets your stomach, you may take it with meals. Avoid taking it with tea, coffee, or milk.

## Drug interactions
Do not take ferrous fumarate within 2 to 4 hours of levothyroxine or calcium supplements, as iron drastically impairs their absorption.

## If you miss a dose
If you miss a dose, take it as soon as you remember, unless your next dose is due within a few hours. Do not take a double dose.`
  },
  {
    fileName: '18_Doctors_Care_Sheet_B_BP_Thyroid_SAMPLE.md',
    medicineName: "Doctor's Care Sheet B",
    documentType: 'care sheet',
    pageLastReviewed: '25 February 2024',
    country: 'India',
    source: 'Fictional sample care sheet (not a real doctor or patient)',
    content: `# Doctor's Care Sheet B: Blood Pressure and Thyroid
Source: Fictional sample care sheet, Dr. Sharma Clinic (not a real doctor or patient) | Document type: care sheet | Page last reviewed: 25 February 2024 | Country: India

## Patient Prescriptions and Plan
Patient is diagnosed with primary hypertension and hypothyroidism. Prescribed regimen: Amlodipine 5mg once daily every morning; Levothyroxine 50mcg once daily every morning.

## Thyroid Regimen and Mineral Interaction Rules
Crucial rule from Dr. Sharma: Levothyroxine must be taken immediately after waking up with a glass of plain water, minimum 45 minutes prior to morning tea, coffee, or breakfast. Strictly avoid iron supplements (ferrous fumarate) or calcium within 4 hours of your morning levothyroxine dose. This doctor care sheet takes priority over standard leaflets.

## Blood Pressure Safety Instructions
Take amlodipine consistently every morning. Stand up slowly from bed or chairs to avoid lightheadedness. Do not skip doses.

## Emergency Contacts
In case of severe chest tightness, sudden shortness of breath, or heart palpitations, call 112 immediately in India or go directly to the emergency department.`
  }
];
