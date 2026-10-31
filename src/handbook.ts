// "Patient Handbook" of Lumière Dental Clinic, a FICTIONAL clinic used for this demo.
// A long document, written as Markdown (headings, paragraphs, lists and a table), so it has to be
// chunked before it can be embedded: see chunker.ts. Facts match the knowledge base in knowledge.ts.

import { chunkMarkdown, type DocChunk } from "./chunker";

export const HANDBOOK_TITLE = { en: "Patient Handbook", fr: "Guide du patient" };

const EN = `# Patient Handbook

## 1. Welcome

### 1.1 About this handbook
This handbook explains how Lumière Dental Clinic works, what to expect from each treatment, how to look after your mouth afterwards, and what our fees and policies are. Keep it for reference. If anything here is unclear, our front desk is happy to help at (514) 555-0142.

### 1.2 The clinic at a glance
Lumière Dental Clinic is a family clinic at 2140 Lumière Avenue, Suite 300, Montréal. We offer general, cosmetic and pediatric dentistry, and our team speaks English and French.
- Hours: Monday to Thursday 8:00 a.m. to 7:00 p.m., Friday 8:00 a.m. to 4:00 p.m., Saturday 9:00 a.m. to 2:00 p.m. every other week. Closed Sundays and statutory holidays.
- Dentists: Dr. Camille Tremblay (clinic director), Dr. Omar Haddad (implants and root canals) and Dr. Sofia Nguyen (children and clear aligners).
- Free patient parking behind the building, in spots marked "Lumière". The clinic is wheelchair accessible.

## 2. Your first visit

### 2.1 Before you come
Please arrive 10 minutes early to complete your medical history form. Bring your insurance card, a list of the medications you take, and any X-rays taken in the last two years. If you are transferring from another clinic, we can request your records for you with your signed consent.

### 2.2 What happens during the visit
Your first visit lasts about 75 minutes and costs $260. A hygienist cleans your teeth and takes a full set of low-dose digital X-rays. The dentist then examines your teeth, gums, bite and jaw joints, and screens for oral cancer. Before you leave, the dentist explains what was found and gives you a written treatment plan with the cost of each step. Nothing is done without your agreement.

### 2.3 Medical history and medications
Tell us about any heart condition, diabetes, bleeding disorder, allergy or recent surgery. Some medications matter for dental care: blood thinners increase bleeding, some osteoporosis drugs affect healing after an extraction, and some antidepressants cause dry mouth. If your cardiologist or surgeon asked you to take antibiotics before dental work, tell us when you book.

## 3. Treatments explained

### 3.1 Check-ups and cleanings
We recommend a check-up and cleaning every 6 months. The hygienist removes tartar, polishes your teeth and applies fluoride if needed, and the dentist checks for cavities and gum disease. Patients with gum disease may need a cleaning every 3 or 4 months.

### 3.2 Fillings
We use tooth-coloured composite fillings only; we no longer place amalgam (silver) fillings. A filling takes 30 to 60 minutes under local anesthesia. Small cavities usually need one surface, while larger ones may need two or three, which changes the fee.

### 3.3 Root canal treatment
A root canal removes the infected or inflamed nerve inside a tooth, then cleans and seals the canals. It is done under local anesthesia and usually feels like a long filling. Front teeth often need one visit; molars may need two. Back teeth weakened by a root canal usually need a crown afterwards to prevent fractures.

### 3.4 Crowns and bridges
A crown is a porcelain or zirconia cap that covers and protects a damaged tooth. It takes two visits about two weeks apart: at the first, the tooth is shaped and you leave with a temporary crown; at the second, the permanent crown is bonded. A bridge replaces a missing tooth by attaching to the teeth on each side. Bridges are quoted after an exam.

### 3.5 Dental implants
An implant is a titanium post placed in the jaw that holds a crown, replacing a missing tooth without touching the neighbouring teeth. The process takes 3 to 6 months: a 3D scan and planning visit, placement of the implant, a healing period of 8 to 12 weeks while the bone attaches to the implant, then the crown. Smoking and uncontrolled diabetes increase the risk of failure. A free 30-minute implant consultation is available.

### 3.6 Clear aligners
Clear aligners straighten teeth with a series of removable plastic trays, each worn for one to two weeks. You must wear them at least 22 hours a day and remove them to eat and drink anything other than water. Treatment usually lasts 6 to 18 months. Retainers are needed afterwards to keep the result. We do not offer metal braces.

### 3.7 Teeth whitening
We offer whitening only after a check-up confirms your teeth and gums are healthy. In-office whitening takes about 90 minutes; the take-home kit uses custom trays worn for 30 to 60 minutes a day over two weeks. Whitening does not change the colour of fillings, crowns or veneers. Results usually last 1 to 3 years.

### 3.8 Extractions and wisdom teeth
We remove a tooth only when it cannot be saved. Wisdom teeth are removed when they are impacted, decayed, or cause pain or infection. Most extractions are done at the clinic under local anesthesia. Complex surgical cases are referred to a partner oral surgeon.

## 4. Care after your treatment

### 4.1 After a filling
Wait until the numbness wears off, usually 2 to 3 hours, before eating, so you do not bite your cheek or tongue. Composite fillings are fully hardened when you leave, so you can chew normally afterwards. Mild sensitivity to cold for a few days is normal. If your bite feels high or uneven after the numbness is gone, call us for a quick adjustment.

### 4.2 After a wisdom tooth removal
Bite gently on the gauze for 30 to 45 minutes to control bleeding, and replace it if needed. Some oozing during the first 24 hours is normal. To protect the blood clot that forms in the socket, avoid hot drinks, straws, spitting, smoking and alcohol for the first 24 hours. Do not rinse your mouth on the first day.
- Eat soft, cool foods such as yogurt, smoothies eaten with a spoon, soup that is not hot, and mashed potatoes.
- Chew on the other side for about a week.
- Sleep with your head raised on an extra pillow for the first two nights.
From the second day, rinse gently with warm salt water (half a teaspoon of salt in a cup of water) after meals and before bed, for one week. Swelling peaks on the second or third day; a cold pack on the cheek, 20 minutes on and 20 minutes off, helps during the first 48 hours. Take pain medication as prescribed.
Call us if the pain gets worse after the third day, if you notice a bad taste or smell, or if you have a fever. These can be signs of a dry socket or an infection, which we treat quickly. Stitches, if any, dissolve on their own within 7 to 10 days.

### 4.3 After a root canal
The tooth may be tender for a few days, especially when you bite. Avoid chewing hard food on that side until the permanent filling or crown is placed, because the tooth can crack. Over-the-counter pain relief is usually enough. Call us if you have swelling or if the temporary filling falls out.

### 4.4 After an implant
Expect mild swelling and discomfort for 2 to 3 days. Eat soft food and avoid chewing on the implant side for two weeks. Do not smoke during healing: smoking is the main cause of implant failure. Brush the area gently from the second day, and come to every follow-up visit so we can check that the bone is healing well.

### 4.5 After whitening
For 48 hours, avoid coffee, tea, red wine, dark sauces and tobacco, which stain teeth while they are more porous. Some sensitivity to cold is common for one or two days; a toothpaste for sensitive teeth helps. Touch-ups with the take-home trays every 6 to 12 months keep the result.

## 5. Fees and insurance

### 5.1 How fees work
Our fees follow the clinic's fee schedule below and are reviewed every January. Before any treatment over $500, we give you a written estimate. X-rays are billed separately, only when they are needed. Prices are in Canadian dollars and include the dentist's and hygienist's time.

### 5.2 Fee schedule
| Code | Treatment | Fee |
|---|---|---|
| LD-100 | New-patient exam, full X-rays and cleaning | $260 |
| LD-110 | Check-up and cleaning, adult | $165 |
| LD-111 | Check-up and cleaning, child under 12 | $110 |
| LD-120 | Emergency exam (treatment extra) | $95 |
| LD-130 | Bitewing X-rays | $45 |
| LD-200 | Composite filling, one surface | $150 |
| LD-201 | Composite filling, two surfaces | $210 |
| LD-202 | Composite filling, three or more surfaces | $280 |
| LD-300 | Root canal, front tooth | $750 |
| LD-301 | Root canal, premolar | $950 |
| LD-302 | Root canal, molar | $1,200 |
| LD-400 | Porcelain or zirconia crown, per tooth | $1,250 |
| LD-500 | Single implant with crown | from $4,200 |
| LD-510 | Implant consultation (30 min) | free |
| LD-600 | Clear aligners, full treatment | $3,800 to $6,500 |
| LD-610 | Orthodontic consultation with 3D scan | free |
| LD-700 | In-office whitening | $450 |
| LD-701 | Take-home whitening kit with custom trays | $295 |
| LD-800 | Simple extraction | $195 |
| LD-801 | Wisdom tooth removal, per tooth | $350 to $600 |
| LD-900 | Sealant, per tooth | $55 |
| LD-910 | Nitrous oxide (laughing gas), per visit | $85 |

### 5.3 Insurance and the CDCP
We accept most private dental insurance plans and submit claims electronically, so you only pay your share at the end of the visit. For treatments over $500, we can send a pre-authorization to your insurer first, which usually takes 1 to 2 weeks. We also accept the Canadian Dental Care Plan (CDCP): bring your CDCP member card, and we will tell you before treatment if any part is not covered.

## 6. Payments, cancellations and lateness

### 6.1 Paying for your care
Payment is due at the end of each visit. We accept debit, Visa, Mastercard and American Express; we do not accept cheques. For treatments over $1,500, we offer interest-free payment plans over 6 or 12 months, set up with the front desk before treatment starts.

### 6.2 Cancellations and missed appointments
Please give at least 48 hours' notice to cancel or move an appointment, by phone at (514) 555-0142. Late cancellations and missed appointments are charged $50. The fee is waived once per year and for emergencies. After three missed appointments, we may ask for a deposit to book again.

### 6.3 Late arrivals
If you arrive more than 15 minutes late, we may need to shorten your appointment or move it to another day, so that other patients are not delayed. If you know you will be late, call us: we can sometimes adjust the schedule.

## 7. Patients with special needs

### 7.1 Children
We recommend a first visit around age 1, or when the first tooth appears. Children's visits are short and playful, and a parent can stay in the room. We apply sealants ($55 per tooth) on molars to prevent cavities. Until about age 8, children need an adult to help them brush twice a day with a rice-sized amount of fluoride toothpaste.

### 7.2 Seniors
Older adults often take medications that cause dry mouth, which raises the risk of cavities. We can recommend saliva substitutes and fluoride varnish. Bring your dentures to each check-up so we can check their fit and the health of your gums.

### 7.3 Anxious patients
Tell us when you book if you feel anxious. We will plan a longer, calmer appointment, explain each step before we do it, and agree on a hand signal so you can ask us to pause at any time. Noise-cancelling headphones are available, and nitrous oxide (laughing gas) costs $85 per visit. We do not offer general anesthesia at the clinic.

### 7.4 Pregnancy
Dental care is safe during pregnancy, and the second trimester is the most comfortable time for treatment. Pregnancy hormones can make gums bleed more easily, so cleanings are especially useful. Tell us if you are or may be pregnant: we postpone X-rays that are not urgent.

## 8. Dental emergencies

### 8.1 What counts as an emergency
Severe tooth pain, a broken or knocked-out tooth, a lost filling or crown that causes pain, bleeding that does not stop, and swelling of the face or gums are all dental emergencies. We keep same-day emergency slots every weekday. The emergency exam costs $95, and treatment is extra.

### 8.2 What to do, step by step
Call the clinic as early as possible in the morning at (514) 555-0142, and describe your symptoms so we can give you the right slot.
- Knocked-out adult tooth: pick it up by the crown, not the root. Rinse it briefly without scrubbing, keep it in milk, and come within one hour.
- Broken tooth: rinse with warm water, keep the pieces, and put a cold pack on your cheek.
- Lost crown: keep it, do not glue it yourself, and bring it to your appointment.
- Toothache: rinse with warm water, gently floss around the tooth, and take over-the-counter pain relief as directed. Never put aspirin directly on the gum.
- Bleeding after an extraction: bite firmly on gauze or a damp tea bag for 30 minutes.
Do not wait for the pain to go away on its own: infections can spread, and a tooth treated early is easier to save.

### 8.3 After hours
Outside opening hours, call the clinic: the voicemail gives the number of the on-call dental service. Go straight to the nearest hospital emergency room if you have facial swelling with fever, trouble breathing or swallowing, or a jaw injury after an accident.

## 9. Privacy and consent

### 9.1 Your health information
Your dental records are confidential and kept securely for at least 10 years, as required by Québec law. We share them only with your written consent, for example with a specialist or your insurer. You can ask for a copy of your file at any time; copies are free once per year.

### 9.2 Consent to treatment
Before any treatment, the dentist explains the options, the risks, the expected results and the cost, including the option of doing nothing. You can ask questions and take time to decide. For major treatments such as implants, root canals and extractions, we ask you to sign a consent form.
`;

const FR = `# Guide du patient

## 1. Bienvenue

### 1.1 À propos de ce guide
Ce guide explique le fonctionnement de la Clinique Dentaire Lumière, ce à quoi vous attendre pour chaque traitement, comment prendre soin de votre bouche ensuite, ainsi que nos tarifs et nos politiques. Conservez-le pour référence. Si quelque chose n'est pas clair, notre équipe d'accueil se fera un plaisir de vous aider au 514 555-0142.

### 1.2 La clinique en bref
La Clinique Dentaire Lumière est une clinique familiale située au 2140, avenue Lumière, bureau 300, à Montréal. Nous offrons des soins de dentisterie générale, esthétique et pédiatrique, et notre équipe parle français et anglais.
- Heures : du lundi au jeudi de 8 h à 19 h, le vendredi de 8 h à 16 h, le samedi de 9 h à 14 h une semaine sur deux. Fermé le dimanche et les jours fériés.
- Dentistes : Dre Camille Tremblay (directrice de la clinique), Dr Omar Haddad (implants et traitements de canal) et Dre Sofia Nguyen (enfants et aligneurs transparents).
- Stationnement gratuit pour les patients derrière l'immeuble, aux places identifiées « Lumière ». La clinique est accessible en fauteuil roulant.

## 2. Votre première visite

### 2.1 Avant de venir
Veuillez arriver 10 minutes à l'avance pour remplir votre questionnaire médical. Apportez votre carte d'assurance, la liste des médicaments que vous prenez et les radiographies prises au cours des deux dernières années. Si vous venez d'une autre clinique, nous pouvons demander votre dossier pour vous avec votre consentement signé.

### 2.2 Déroulement de la visite
Votre première visite dure environ 75 minutes et coûte 260 $. Une hygiéniste nettoie vos dents et prend une série complète de radiographies numériques à faible dose. Le dentiste examine ensuite vos dents, vos gencives, votre occlusion et vos articulations de la mâchoire, et fait un dépistage du cancer buccal. Avant votre départ, le dentiste vous explique ses constats et vous remet un plan de traitement écrit avec le coût de chaque étape. Rien n'est fait sans votre accord.

### 2.3 Antécédents médicaux et médicaments
Informez-nous de toute maladie cardiaque, diabète, trouble de la coagulation, allergie ou chirurgie récente. Certains médicaments comptent pour les soins dentaires : les anticoagulants augmentent les saignements, certains médicaments contre l'ostéoporose nuisent à la guérison après une extraction et certains antidépresseurs causent une bouche sèche. Si votre cardiologue ou votre chirurgien vous a demandé de prendre des antibiotiques avant des soins dentaires, dites-le-nous au moment de prendre rendez-vous.

## 3. Les traitements expliqués

### 3.1 Examens et nettoyages
Nous recommandons un examen et un nettoyage tous les 6 mois. L'hygiéniste enlève le tartre, polit vos dents et applique du fluor au besoin, et le dentiste vérifie la présence de caries et de maladie des gencives. Les patients atteints de maladie des gencives peuvent avoir besoin d'un nettoyage tous les 3 ou 4 mois.

### 3.2 Obturations
Nous utilisons uniquement des obturations en composite de la couleur des dents; nous ne posons plus d'obturations en amalgame (argent). Une obturation prend de 30 à 60 minutes sous anesthésie locale. Les petites caries touchent habituellement une seule surface, alors que les plus grandes peuvent en toucher deux ou trois, ce qui change le tarif.

### 3.3 Traitement de canal
Un traitement de canal retire le nerf infecté ou enflammé à l'intérieur d'une dent, puis nettoie et scelle les canaux. Il est fait sous anesthésie locale et ressemble habituellement à une longue obturation. Les dents antérieures demandent souvent une seule visite; les molaires peuvent en demander deux. Les dents postérieures affaiblies par un traitement de canal ont généralement besoin d'une couronne ensuite pour éviter les fractures.

### 3.4 Couronnes et ponts
Une couronne est une coiffe en porcelaine ou en zircone qui recouvre et protège une dent abîmée. Elle demande deux visites à environ deux semaines d'intervalle : à la première, la dent est taillée et vous repartez avec une couronne temporaire; à la seconde, la couronne permanente est collée. Un pont remplace une dent manquante en s'appuyant sur les dents voisines. Les ponts font l'objet d'une soumission après examen.

### 3.5 Implants dentaires
Un implant est une tige en titane placée dans la mâchoire qui soutient une couronne et remplace une dent manquante sans toucher aux dents voisines. Le processus prend de 3 à 6 mois : une visite de balayage 3D et de planification, la pose de l'implant, une période de guérison de 8 à 12 semaines pendant laquelle l'os se soude à l'implant, puis la couronne. Le tabagisme et le diabète mal contrôlé augmentent le risque d'échec. Une consultation gratuite de 30 minutes pour les implants est offerte.

### 3.6 Aligneurs transparents
Les aligneurs transparents redressent les dents à l'aide d'une série de gouttières amovibles en plastique, chacune portée pendant une à deux semaines. Vous devez les porter au moins 22 heures par jour et les retirer pour manger et pour boire autre chose que de l'eau. Le traitement dure habituellement de 6 à 18 mois. Des appareils de rétention sont nécessaires ensuite pour conserver le résultat. Nous n'offrons pas de broches métalliques.

### 3.7 Blanchiment des dents
Nous offrons le blanchiment seulement après un examen confirmant que vos dents et vos gencives sont en santé. Le blanchiment en clinique dure environ 90 minutes; la trousse à domicile utilise des gouttières sur mesure portées de 30 à 60 minutes par jour pendant deux semaines. Le blanchiment ne change pas la couleur des obturations, des couronnes ni des facettes. Les résultats durent généralement de 1 à 3 ans.

### 3.8 Extractions et dents de sagesse
Nous retirons une dent seulement lorsqu'elle ne peut pas être sauvée. Les dents de sagesse sont retirées lorsqu'elles sont incluses, cariées, ou qu'elles causent de la douleur ou une infection. La plupart des extractions sont faites à la clinique sous anesthésie locale. Les cas chirurgicaux complexes sont dirigés vers un chirurgien buccal partenaire.

## 4. Soins après votre traitement

### 4.1 Après une obturation
Attendez que l'engourdissement disparaisse, habituellement de 2 à 3 heures, avant de manger, pour ne pas vous mordre la joue ou la langue. Les obturations en composite sont entièrement durcies à votre départ, vous pouvez donc mastiquer normalement ensuite. Une légère sensibilité au froid pendant quelques jours est normale. Si votre occlusion vous semble haute ou inégale une fois l'engourdissement passé, appelez-nous pour un ajustement rapide.

### 4.2 Après l'extraction d'une dent de sagesse
Mordez doucement sur la compresse pendant 30 à 45 minutes pour contrôler le saignement, et remplacez-la au besoin. Un léger suintement pendant les premières 24 heures est normal. Pour protéger le caillot qui se forme dans l'alvéole, évitez les boissons chaudes, les pailles, le fait de cracher, le tabac et l'alcool pendant les premières 24 heures. Ne rincez pas votre bouche le premier jour.
- Mangez des aliments mous et frais comme du yogourt, des smoothies mangés à la cuillère, une soupe tiède et de la purée de pommes de terre.
- Mastiquez de l'autre côté pendant environ une semaine.
- Dormez la tête surélevée sur un oreiller supplémentaire les deux premières nuits.
À partir du deuxième jour, rincez doucement à l'eau tiède salée (une demi-cuillère à thé de sel dans une tasse d'eau) après les repas et avant le coucher, pendant une semaine. L'enflure atteint son maximum le deuxième ou le troisième jour; un sac froid sur la joue, 20 minutes sur et 20 minutes hors, aide pendant les premières 48 heures. Prenez les analgésiques tels que prescrits.
Appelez-nous si la douleur augmente après le troisième jour, si vous remarquez un mauvais goût ou une mauvaise odeur, ou si vous faites de la fièvre. Ce peuvent être des signes d'alvéolite ou d'infection, que nous traitons rapidement. Les points de suture, s'il y en a, se résorbent d'eux-mêmes en 7 à 10 jours.

### 4.3 Après un traitement de canal
La dent peut être sensible pendant quelques jours, surtout lorsque vous mordez. Évitez de mastiquer des aliments durs de ce côté jusqu'à la pose de l'obturation permanente ou de la couronne, car la dent peut fissurer. Un analgésique en vente libre suffit habituellement. Appelez-nous si vous avez de l'enflure ou si l'obturation temporaire tombe.

### 4.4 Après un implant
Attendez-vous à une légère enflure et à de l'inconfort pendant 2 à 3 jours. Mangez des aliments mous et évitez de mastiquer du côté de l'implant pendant deux semaines. Ne fumez pas pendant la guérison : le tabac est la principale cause d'échec des implants. Brossez doucement la région à partir du deuxième jour, et présentez-vous à chaque visite de suivi pour que nous puissions vérifier la bonne guérison de l'os.

### 4.5 Après un blanchiment
Pendant 48 heures, évitez le café, le thé, le vin rouge, les sauces foncées et le tabac, qui tachent les dents pendant qu'elles sont plus poreuses. Une sensibilité au froid est fréquente pendant un ou deux jours; un dentifrice pour dents sensibles aide. Des retouches avec les gouttières à domicile tous les 6 à 12 mois conservent le résultat.

## 5. Tarifs et assurances

### 5.1 Fonctionnement des tarifs
Nos tarifs suivent la grille de la clinique ci-dessous et sont révisés chaque janvier. Avant tout traitement de plus de 500 $, nous vous remettons une estimation écrite. Les radiographies sont facturées à part, seulement lorsqu'elles sont nécessaires. Les prix sont en dollars canadiens et comprennent le temps du dentiste et de l'hygiéniste.

### 5.2 Grille tarifaire
| Code | Traitement | Tarif |
|---|---|---|
| LD-100 | Examen de nouveau patient, radiographies complètes et nettoyage | 260 $ |
| LD-110 | Examen et nettoyage, adulte | 165 $ |
| LD-111 | Examen et nettoyage, enfant de moins de 12 ans | 110 $ |
| LD-120 | Examen d'urgence (traitement en sus) | 95 $ |
| LD-130 | Radiographies interproximales | 45 $ |
| LD-200 | Obturation en composite, une surface | 150 $ |
| LD-201 | Obturation en composite, deux surfaces | 210 $ |
| LD-202 | Obturation en composite, trois surfaces ou plus | 280 $ |
| LD-300 | Traitement de canal, dent antérieure | 750 $ |
| LD-301 | Traitement de canal, prémolaire | 950 $ |
| LD-302 | Traitement de canal, molaire | 1 200 $ |
| LD-400 | Couronne en porcelaine ou en zircone, par dent | 1 250 $ |
| LD-500 | Implant unitaire avec couronne | à partir de 4 200 $ |
| LD-510 | Consultation pour implant (30 min) | gratuit |
| LD-600 | Aligneurs transparents, traitement complet | de 3 800 $ à 6 500 $ |
| LD-610 | Consultation orthodontique avec balayage 3D | gratuit |
| LD-700 | Blanchiment en clinique | 450 $ |
| LD-701 | Trousse de blanchiment à domicile avec gouttières sur mesure | 295 $ |
| LD-800 | Extraction simple | 195 $ |
| LD-801 | Extraction d'une dent de sagesse, par dent | de 350 $ à 600 $ |
| LD-900 | Scellant, par dent | 55 $ |
| LD-910 | Protoxyde d'azote (gaz hilarant), par visite | 85 $ |

### 5.3 Assurances et RCSD
Nous acceptons la plupart des régimes d'assurance dentaire privés et transmettons les réclamations électroniquement, vous ne payez donc que votre part à la fin de la visite. Pour les traitements de plus de 500 $, nous pouvons d'abord envoyer une demande de pré-autorisation à votre assureur, ce qui prend habituellement de 1 à 2 semaines. Nous acceptons aussi le Régime canadien de soins dentaires (RCSD) : apportez votre carte de membre du RCSD, et nous vous dirons avant le traitement si une partie n'est pas couverte.

## 6. Paiements, annulations et retards

### 6.1 Payer vos soins
Le paiement est dû à la fin de chaque visite. Nous acceptons le débit, Visa, Mastercard et American Express; nous n'acceptons pas les chèques. Pour les traitements de plus de 1 500 $, nous offrons des plans de paiement sans intérêt sur 6 ou 12 mois, établis avec l'accueil avant le début du traitement.

### 6.2 Annulations et rendez-vous manqués
Veuillez donner un préavis d'au moins 48 heures pour annuler ou déplacer un rendez-vous, par téléphone au 514 555-0142. Les annulations tardives et les rendez-vous manqués sont facturés 50 $. Les frais sont annulés une fois par année et en cas d'urgence. Après trois rendez-vous manqués, nous pourrions demander un dépôt pour réserver de nouveau.

### 6.3 Retards
Si vous arrivez avec plus de 15 minutes de retard, nous pourrions devoir écourter votre rendez-vous ou le déplacer à un autre jour, afin de ne pas retarder les autres patients. Si vous savez que vous serez en retard, appelez-nous : nous pouvons parfois ajuster l'horaire.

## 7. Patients ayant des besoins particuliers

### 7.1 Enfants
Nous recommandons une première visite vers l'âge de 1 an, ou à l'apparition de la première dent. Les visites des enfants sont courtes et ludiques, et un parent peut rester dans la salle. Nous posons des scellants (55 $ par dent) sur les molaires pour prévenir les caries. Jusqu'à environ 8 ans, les enfants ont besoin d'un adulte pour les aider à se brosser les dents deux fois par jour avec une quantité de dentifrice fluoré de la taille d'un grain de riz.

### 7.2 Aînés
Les aînés prennent souvent des médicaments qui causent une bouche sèche, ce qui augmente le risque de caries. Nous pouvons recommander des substituts de salive et un vernis fluoré. Apportez vos prothèses à chaque examen pour que nous vérifiions leur ajustement et la santé de vos gencives.

### 7.3 Patients anxieux
Dites-nous au moment de prendre rendez-vous si vous êtes anxieux. Nous prévoirons un rendez-vous plus long et plus calme, nous expliquerons chaque étape avant de la faire et nous conviendrons d'un signe de la main pour que vous puissiez nous demander une pause à tout moment. Des écouteurs antibruit sont offerts, et le protoxyde d'azote (gaz hilarant) coûte 85 $ par visite. Nous n'offrons pas d'anesthésie générale à la clinique.

### 7.4 Grossesse
Les soins dentaires sont sécuritaires pendant la grossesse, et le deuxième trimestre est le moment le plus confortable pour un traitement. Les hormones de grossesse peuvent faire saigner les gencives plus facilement, les nettoyages sont donc particulièrement utiles. Dites-nous si vous êtes enceinte ou pourriez l'être : nous reportons les radiographies qui ne sont pas urgentes.

## 8. Urgences dentaires

### 8.1 Ce qui constitue une urgence
Une douleur dentaire intense, une dent cassée ou expulsée, une obturation ou une couronne perdue qui cause de la douleur, un saignement qui ne s'arrête pas et une enflure du visage ou des gencives sont des urgences dentaires. Nous réservons des plages d'urgence le jour même, chaque jour de semaine. L'examen d'urgence coûte 95 $, et le traitement est en sus.

### 8.2 Que faire, étape par étape
Appelez la clinique le plus tôt possible en matinée au 514 555-0142 et décrivez vos symptômes pour que nous puissions vous donner la bonne plage.
- Dent d'adulte expulsée : prenez-la par la couronne, pas par la racine. Rincez-la brièvement sans la frotter, conservez-la dans du lait et venez dans l'heure qui suit.
- Dent cassée : rincez à l'eau tiède, gardez les morceaux et appliquez un sac froid sur la joue.
- Couronne perdue : gardez-la, ne la collez pas vous-même et apportez-la à votre rendez-vous.
- Mal de dents : rincez à l'eau tiède, passez doucement la soie dentaire autour de la dent et prenez un analgésique en vente libre selon les directives. Ne mettez jamais d'aspirine directement sur la gencive.
- Saignement après une extraction : mordez fermement sur une compresse ou un sachet de thé humide pendant 30 minutes.
N'attendez pas que la douleur disparaisse d'elle-même : les infections peuvent se propager, et une dent traitée tôt est plus facile à sauver.

### 8.3 En dehors des heures d'ouverture
En dehors des heures d'ouverture, appelez la clinique : la boîte vocale donne le numéro du service dentaire de garde. Rendez-vous directement à l'urgence de l'hôpital le plus proche si vous avez une enflure du visage avec de la fièvre, de la difficulté à respirer ou à avaler, ou une blessure à la mâchoire après un accident.

## 9. Confidentialité et consentement

### 9.1 Vos renseignements de santé
Votre dossier dentaire est confidentiel et conservé en sécurité pendant au moins 10 ans, comme l'exige la loi au Québec. Nous le communiquons seulement avec votre consentement écrit, par exemple à un spécialiste ou à votre assureur. Vous pouvez demander une copie de votre dossier en tout temps; les copies sont gratuites une fois par année.

### 9.2 Consentement aux soins
Avant tout traitement, le dentiste vous explique les options, les risques, les résultats attendus et le coût, y compris l'option de ne rien faire. Vous pouvez poser des questions et prendre le temps de décider. Pour les traitements majeurs comme les implants, les traitements de canal et les extractions, nous vous demandons de signer un formulaire de consentement.
`;

export const HANDBOOK = { en: EN, fr: FR };

/** The handbook as chunks, both languages: what /seed embeds and the knowledge panel shows. */
export const HANDBOOK_CHUNKS: DocChunk[] = [...chunkMarkdown(EN, "en", "hb"), ...chunkMarkdown(FR, "fr", "hb")];

/** Short title shown with a chunk in search results, e.g. "Patient Handbook › 4.2 After a wisdom tooth removal (2/3)". */
export const handbookTitle = (c: DocChunk) => `${HANDBOOK_TITLE[c.lang]} › ${c.path.at(-1)}${c.parts > 1 ? ` (${c.part}/${c.parts})` : ""}`;
