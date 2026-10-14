// Knowledge base for "Lumière Dental Clinic", a FICTIONAL clinic used for this demo.
// One entry = one topic. Each entry becomes two vectors: `<id>-en` and `<id>-fr`.

export type Category = "clinic" | "services" | "faq" | "policies" | "team";

/** `scope` metadata of the shared data; rows visitors add are scoped to their session id. */
export const BASE_SCOPE = "base";
export type Lang = "en" | "fr";

export interface KnowledgeEntry {
  id: string;
  category: Category;
  title: { en: string; fr: string };
  en: string;
  fr: string;
}

export interface Chunk {
  id: string;
  category: Category;
  lang: Lang;
  title: string;
  text: string;
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  // ── Clinic ────────────────────────────────────────────────────────────
  {
    id: "clinic-about",
    category: "clinic",
    title: { en: "About the clinic", fr: "À propos de la clinique" },
    en: "Lumière Dental Clinic is a family dental clinic in Montréal offering general, cosmetic and pediatric dentistry. We welcome new patients of all ages, and our team speaks English and French.",
    fr: "La Clinique Dentaire Lumière est une clinique dentaire familiale à Montréal qui offre des soins de dentisterie générale, esthétique et pédiatrique. Nous accueillons les nouveaux patients de tous âges, et notre équipe parle français et anglais.",
  },
  {
    id: "clinic-location",
    category: "clinic",
    title: { en: "Location and parking", fr: "Adresse et stationnement" },
    en: "We are located at 2140 Lumière Avenue, Suite 300, Montréal, QC. The nearest metro station is a 4-minute walk away. Free parking for patients is available behind the building (spots marked \"Lumière\"). The clinic is wheelchair accessible with an elevator.",
    fr: "Nous sommes situés au 2140, avenue Lumière, bureau 300, Montréal (QC). La station de métro la plus proche est à 4 minutes à pied. Un stationnement gratuit pour les patients est disponible derrière l'immeuble (places identifiées « Lumière »). La clinique est accessible en fauteuil roulant et dispose d'un ascenseur.",
  },
  {
    id: "clinic-hours",
    category: "clinic",
    title: { en: "Opening hours", fr: "Heures d'ouverture" },
    en: "Opening hours: Monday to Thursday 8:00 a.m. to 7:00 p.m.; Friday 8:00 a.m. to 4:00 p.m.; Saturday 9:00 a.m. to 2:00 p.m. (every other week); closed on Sundays and statutory holidays.",
    fr: "Heures d'ouverture : du lundi au jeudi de 8 h à 19 h; le vendredi de 8 h à 16 h; le samedi de 9 h à 14 h (une semaine sur deux); fermé le dimanche et les jours fériés.",
  },
  {
    id: "clinic-contact",
    category: "clinic",
    title: { en: "Contact", fr: "Nous joindre" },
    en: "Phone: (514) 555-0142. Email: hello@lumiere-dental.example. You can call during opening hours to book, change or cancel an appointment. Emails are answered within one business day.",
    fr: "Téléphone : 514 555-0142. Courriel : hello@lumiere-dental.example. Vous pouvez appeler pendant les heures d'ouverture pour prendre, modifier ou annuler un rendez-vous. Nous répondons aux courriels en un jour ouvrable.",
  },

  // ── Services & prices ─────────────────────────────────────────────────
  {
    id: "services-checkup",
    category: "services",
    title: { en: "Check-up and cleaning", fr: "Examen et nettoyage" },
    en: "Routine check-up with cleaning: $165 for adults, $110 for children under 12. It includes the exam by a dentist, scaling and polishing by a hygienist, and fluoride if needed. We recommend one every 6 months. X-rays, when needed, are billed separately ($45 for bitewings).",
    fr: "Examen de routine avec nettoyage : 165 $ pour les adultes, 110 $ pour les enfants de moins de 12 ans. Il comprend l'examen par un dentiste, le détartrage et le polissage par une hygiéniste, et le fluor au besoin. Nous le recommandons tous les 6 mois. Les radiographies, si nécessaires, sont facturées à part (45 $ pour les interproximales).",
  },
  {
    id: "services-whitening",
    category: "services",
    title: { en: "Teeth whitening", fr: "Blanchiment des dents" },
    en: "Teeth whitening: in-office whitening (about 90 minutes) is $450. A take-home whitening kit with custom trays is $295. Whitening is offered only after a check-up confirms your teeth and gums are healthy. Results usually last 1 to 3 years.",
    fr: "Blanchiment des dents : le blanchiment en clinique (environ 90 minutes) coûte 450 $. La trousse de blanchiment à domicile avec gouttières sur mesure coûte 295 $. Le blanchiment est offert seulement après un examen confirmant que vos dents et vos gencives sont en santé. Les résultats durent généralement de 1 à 3 ans.",
  },
  {
    id: "services-fillings",
    category: "services",
    title: { en: "Fillings", fr: "Obturations" },
    en: "Fillings: tooth-coloured (composite) fillings cost from $150 to $280 depending on the size and number of surfaces. We no longer place amalgam (silver) fillings.",
    fr: "Obturations : les obturations de couleur des dents (composite) coûtent de 150 $ à 280 $ selon la taille et le nombre de surfaces. Nous ne posons plus d'obturations en amalgame (argent).",
  },
  {
    id: "services-root-canal",
    category: "services",
    title: { en: "Root canal treatment", fr: "Traitement de canal" },
    en: "Root canal treatment: from $750 (front tooth) to $1,200 (molar). It is done under local anesthesia, usually in one or two visits. A crown is often recommended afterwards for back teeth.",
    fr: "Traitement de canal : de 750 $ (dent antérieure) à 1 200 $ (molaire). Il est fait sous anesthésie locale, généralement en une ou deux visites. Une couronne est souvent recommandée par la suite pour les dents postérieures.",
  },
  {
    id: "services-crowns",
    category: "services",
    title: { en: "Crowns and bridges", fr: "Couronnes et ponts" },
    en: "Crowns: a porcelain or zirconia crown costs $1,250 per tooth and takes two visits about two weeks apart. Bridges are quoted after an exam.",
    fr: "Couronnes : une couronne en porcelaine ou en zircone coûte 1 250 $ par dent et nécessite deux visites à environ deux semaines d'intervalle. Les ponts font l'objet d'une soumission après examen.",
  },
  {
    id: "services-implants",
    category: "services",
    title: { en: "Dental implants", fr: "Implants dentaires" },
    en: "Dental implants: a single implant with its crown costs from $4,200. The full process takes 3 to 6 months. A free 30-minute implant consultation is available.",
    fr: "Implants dentaires : un implant unitaire avec sa couronne coûte à partir de 4 200 $. Le processus complet prend de 3 à 6 mois. Une consultation gratuite de 30 minutes pour les implants est offerte.",
  },
  {
    id: "services-orthodontics",
    category: "services",
    title: { en: "Clear aligners (orthodontics)", fr: "Aligneurs transparents (orthodontie)" },
    en: "Orthodontics: we offer clear aligner treatment from $3,800 to $6,500 depending on complexity, with payment plans available. A free orthodontic consultation includes a 3D scan. We do not offer metal braces.",
    fr: "Orthodontie : nous offrons le traitement par aligneurs transparents de 3 800 $ à 6 500 $ selon la complexité, avec des plans de paiement. Une consultation orthodontique gratuite comprend un balayage 3D. Nous n'offrons pas de broches métalliques.",
  },
  {
    id: "services-extractions",
    category: "services",
    title: { en: "Extractions and wisdom teeth", fr: "Extractions et dents de sagesse" },
    en: "Extractions: a simple extraction is $195. Wisdom tooth removal is $350 to $600 per tooth depending on difficulty. Complex surgical cases are referred to a partner oral surgeon.",
    fr: "Extractions : une extraction simple coûte 195 $. L'extraction d'une dent de sagesse coûte de 350 $ à 600 $ par dent selon la difficulté. Les cas chirurgicaux complexes sont dirigés vers un chirurgien buccal partenaire.",
  },
  {
    id: "services-emergency",
    category: "services",
    title: { en: "Emergency appointments", fr: "Rendez-vous d'urgence" },
    en: "Emergency appointments: we keep same-day emergency slots every weekday. The emergency exam fee is $95 (treatment extra). Call (514) 555-0142 as early as possible in the morning.",
    fr: "Rendez-vous d'urgence : nous réservons des plages d'urgence le jour même, chaque jour de semaine. L'examen d'urgence coûte 95 $ (traitement en sus). Appelez au 514 555-0142 le plus tôt possible en matinée.",
  },

  // ── FAQs ──────────────────────────────────────────────────────────────
  {
    id: "faq-insurance",
    category: "faq",
    title: { en: "Insurance", fr: "Assurances" },
    en: "Insurance: we accept most private dental insurance plans and can submit claims electronically for you, so you only pay your share. We also accept the Canadian Dental Care Plan (CDCP). Coverage depends on your plan; we can request a pre-authorization for larger treatments.",
    fr: "Assurances : nous acceptons la plupart des régimes d'assurance dentaire privés et pouvons soumettre vos réclamations électroniquement, pour que vous ne payiez que votre part. Nous acceptons aussi le Régime canadien de soins dentaires (RCSD). La couverture dépend de votre régime; nous pouvons demander une prédétermination pour les traitements importants.",
  },
  {
    id: "faq-payment",
    category: "faq",
    title: { en: "Payment methods", fr: "Modes de paiement" },
    en: "Payment: we accept debit, Visa, Mastercard and American Express. We do not accept cheques. Payment is due at the end of each visit. Interest-free payment plans are available for treatments over $1,500.",
    fr: "Paiement : nous acceptons Interac, Visa, Mastercard et American Express. Nous n'acceptons pas les chèques. Le paiement est exigé à la fin de chaque visite. Des plans de paiement sans intérêt sont offerts pour les traitements de plus de 1 500 $.",
  },
  {
    id: "faq-first-visit",
    category: "faq",
    title: { en: "First visit", fr: "Première visite" },
    en: "First visit: please arrive 10 minutes early to fill in your medical history form. Bring your insurance card, a list of your medications and any recent X-rays. A new-patient exam with full X-rays and cleaning is $260 and takes about 75 minutes.",
    fr: "Première visite : veuillez arriver 10 minutes à l'avance pour remplir votre questionnaire médical. Apportez votre carte d'assurance, la liste de vos médicaments et vos radiographies récentes. L'examen de nouveau patient avec radiographies complètes et nettoyage coûte 260 $ et dure environ 75 minutes.",
  },
  {
    id: "faq-dental-emergency",
    category: "faq",
    title: { en: "What to do in a dental emergency", fr: "Que faire en cas d'urgence dentaire" },
    en: "In a dental emergency (severe pain, broken tooth, knocked-out tooth, swelling), call the clinic right away. For a knocked-out adult tooth, keep it in milk and come within one hour. Outside opening hours, or if you have facial swelling with fever or trouble breathing or swallowing, go to the nearest hospital emergency room.",
    fr: "En cas d'urgence dentaire (douleur intense, dent cassée, dent expulsée, enflure), appelez la clinique immédiatement. Pour une dent adulte expulsée, conservez-la dans du lait et venez dans l'heure. En dehors des heures d'ouverture, ou en cas d'enflure du visage avec fièvre ou de difficulté à respirer ou à avaler, rendez-vous à l'urgence de l'hôpital le plus proche.",
  },
  {
    id: "faq-kids",
    category: "faq",
    title: { en: "Children's dentistry", fr: "Dentisterie pour enfants" },
    en: "Children: we recommend a first visit around age 1 or when the first tooth appears. Kids' visits are short and playful. We offer sealants ($55 per tooth) to protect molars. A parent can stay in the room during the appointment.",
    fr: "Enfants : nous recommandons une première visite vers 1 an ou à l'apparition de la première dent. Les visites des enfants sont courtes et ludiques. Nous offrons les scellants (55 $ par dent) pour protéger les molaires. Un parent peut rester dans la salle pendant le rendez-vous.",
  },
  {
    id: "faq-anxiety",
    category: "faq",
    title: { en: "Dental anxiety and sedation", fr: "Anxiété dentaire et sédation" },
    en: "Dental anxiety: tell us when booking and we will plan a longer, calmer appointment. We offer noise-cancelling headphones and nitrous oxide (laughing gas) for $85 per visit. We do not offer general anesthesia at the clinic.",
    fr: "Anxiété dentaire : dites-le-nous lors de la prise de rendez-vous et nous prévoirons un rendez-vous plus long et plus calme. Nous offrons des casques antibruit et le protoxyde d'azote (gaz hilarant) à 85 $ par visite. Nous n'offrons pas l'anesthésie générale à la clinique.",
  },
  {
    id: "faq-xrays",
    category: "faq",
    title: { en: "X-ray safety", fr: "Sécurité des radiographies" },
    en: "X-rays: we use low-dose digital X-rays, which use far less radiation than traditional film. We only take X-rays when they are needed for diagnosis. Tell us if you are or may be pregnant.",
    fr: "Radiographies : nous utilisons des radiographies numériques à faible dose, beaucoup moins irradiantes que les films traditionnels. Nous ne prenons des radiographies que lorsqu'elles sont nécessaires au diagnostic. Informez-nous si vous êtes ou pourriez être enceinte.",
  },

  // ── Policies ──────────────────────────────────────────────────────────
  {
    id: "policies-booking",
    category: "policies",
    title: { en: "Booking appointments", fr: "Prise de rendez-vous" },
    en: "Booking: you can book a check-up and cleaning, a consultation, a filling, teeth whitening, an emergency exam or a children's check-up right here in the chat: the assistant shows the free times and a short form. You can also book by phone at (514) 555-0142 or by email. New patients are usually seen within 1 to 2 weeks. You will receive a reminder by text message 48 hours before your appointment. To cancel or move an appointment, please call the clinic.",
    fr: "Prise de rendez-vous : vous pouvez réserver un examen et nettoyage, une consultation, une obturation, un blanchiment, un examen d'urgence ou un examen pour enfant directement dans ce clavardage : l'assistant affiche les plages libres et un court formulaire. Vous pouvez aussi réserver par téléphone au 514 555-0142 ou par courriel. Les nouveaux patients sont généralement vus d'ici 1 à 2 semaines. Vous recevrez un rappel par texto 48 heures avant votre rendez-vous. Pour annuler ou déplacer un rendez-vous, veuillez appeler la clinique.",
  },
  {
    id: "policies-cancellation",
    category: "policies",
    title: { en: "Cancellation policy", fr: "Politique d'annulation" },
    en: "Cancellation policy: please give at least 48 hours' notice to cancel or move an appointment. Late cancellations or missed appointments are charged a $50 fee. The fee is waived once per year and for emergencies.",
    fr: "Politique d'annulation : veuillez nous aviser au moins 48 heures à l'avance pour annuler ou déplacer un rendez-vous. Des frais de 50 $ s'appliquent aux annulations tardives et aux rendez-vous manqués. Ces frais sont annulés une fois par année et en cas d'urgence.",
  },
  {
    id: "policies-late-arrival",
    category: "policies",
    title: { en: "Late arrivals", fr: "Retards" },
    en: "Late arrivals: if you arrive more than 15 minutes late, we may need to shorten or reschedule your appointment so other patients are not delayed.",
    fr: "Retards : si vous arrivez avec plus de 15 minutes de retard, nous pourrions devoir écourter ou reporter votre rendez-vous afin de ne pas retarder les autres patients.",
  },

  // ── Team ──────────────────────────────────────────────────────────────
  {
    id: "team-dentists",
    category: "team",
    title: { en: "Our dentists", fr: "Nos dentistes" },
    en: "Our dentists: Dr. Camille Tremblay (clinic director, general and cosmetic dentistry, 15 years of experience), Dr. Omar Haddad (implants and root canals) and Dr. Sofia Nguyen (children's dentistry and clear aligners).",
    fr: "Nos dentistes : Dre Camille Tremblay (directrice de la clinique, dentisterie générale et esthétique, 15 ans d'expérience), Dr Omar Haddad (implants et traitements de canal) et Dre Sofia Nguyen (dentisterie pour enfants et aligneurs transparents).",
  },
  {
    id: "team-hygienists",
    category: "team",
    title: { en: "Hygienists and front desk", fr: "Hygiénistes et accueil" },
    en: "Our team also includes three dental hygienists (Julie, Marc and Priya) and a front-desk team led by Nadia, who can help with appointments, insurance and billing questions.",
    fr: "Notre équipe compte aussi trois hygiénistes dentaires (Julie, Marc et Priya) et une équipe d'accueil dirigée par Nadia, qui peut vous aider pour les rendez-vous, les assurances et la facturation.",
  },
];

export function toChunks(entries: KnowledgeEntry[] = KNOWLEDGE): Chunk[] {
  return entries.flatMap((e) =>
    (["en", "fr"] as const).map((lang) => ({
      id: `${e.id}-${lang}`,
      category: e.category,
      lang,
      title: e.title[lang],
      text: e[lang],
    })),
  );
}
