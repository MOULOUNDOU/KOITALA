import { AGENCY_INFO } from "@/lib/agency";

export interface HousingContractPdfPayload {
  contractReference: string;
  tenantName: string;
  tenantSex?: string;
  tenantProfession?: string;
  tenantNationality?: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyTitle: string;
  propertyAddress: string;
  contractDate: string;
  startDate: string;
  durationMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  paymentFrequency: "jour" | "mois";
  representativeName: string;
  specialClauses?: string;
}

const COLORS = {
  navy: [26, 58, 92] as const,
  gold: [232, 184, 109] as const,
  ink: [15, 23, 36] as const,
  body: [71, 85, 105] as const,
  muted: [107, 114, 128] as const,
  border: [226, 232, 240] as const,
  soft: [248, 250, 252] as const,
  warm: [255, 250, 242] as const,
  white: [255, 255, 255] as const,
} as const;

function formatLongDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " FCFA";
}

function formatDuration(value: number): string {
  return `${value} mois`;
}

function formatPaymentFrequency(value: "jour" | "mois"): string {
  return value === "jour" ? "Paiement journalier" : "Paiement mensuel";
}

function formatSexLabel(value?: string): string {
  if (value === "homme") return "Homme";
  if (value === "femme") return "Femme";
  return value || "Non renseigne";
}

function formatProfessionLabel(value?: string): string {
  if (value === "etudiant") return "Etudiant(e)";
  if (value === "travailleur") return "Travailleur(se)";
  return value || "Non renseignee";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSigningCity(): string {
  const city = AGENCY_INFO.addressLine2.split(",")[0]?.trim();
  return city || "Dakar";
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("image-read-failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateHousingContractPdf(payload: HousingContractPdfPayload) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logoDataUrl = await imageUrlToDataUrl(AGENCY_INFO.logoPath);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const bottomMargin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const setTextColor = (color: readonly [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setDrawColor = (color: readonly [number, number, number]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: readonly [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const continuationHeader = () => {
    setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setTextColor(COLORS.navy);
    doc.text("Contrat de logement", margin, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(COLORS.muted);
    doc.text(`Ref. ${payload.contractReference}`, pageWidth - margin, 18, { align: "right" });
    y = 25;
  };

  const startNewPage = () => {
    doc.addPage();
    continuationHeader();
  };

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - bottomMargin) return;
    startNewPage();
  };

  const splitText = (text: string, width: number, fontSize: number, fontStyle: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text || "-", width) as string[];
  };

  const addWrappedText = (
    text: string,
    options?: {
      x?: number;
      width?: number;
      fontSize?: number;
      lineHeight?: number;
      color?: readonly [number, number, number];
      fontStyle?: "normal" | "bold";
      spacingAfter?: number;
    }
  ) => {
    const x = options?.x ?? margin;
    const width = options?.width ?? contentWidth;
    const fontSize = options?.fontSize ?? 10.2;
    const lineHeight = options?.lineHeight ?? 4.8;
    const color = options?.color ?? COLORS.body;
    const fontStyle = options?.fontStyle ?? "normal";
    const spacingAfter = options?.spacingAfter ?? 3;
    const lines = splitText(text, width, fontSize, fontStyle);

    ensureSpace(lines.length * lineHeight + spacingAfter + 1);
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    setTextColor(color);
    doc.text(lines, x, y);
    y += lines.length * lineHeight + spacingAfter;
  };

  const addSectionTitle = (title: string, subtitle?: string) => {
    ensureSpace(subtitle ? 20 : 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setTextColor(COLORS.navy);
    doc.text(title, margin, y);

    setDrawColor(COLORS.gold);
    doc.setLineWidth(0.9);
    doc.line(margin, y + 2.5, margin + 24, y + 2.5);
    y += 8;

    if (subtitle) {
      addWrappedText(subtitle, { fontSize: 9.6, color: COLORS.muted, spacingAfter: 4 });
    }
  };

  const addInfoCard = (title: string, rows: Array<{ label: string; value: string }>) => {
    const x = margin;
    const width = contentWidth;
    const padding = 5;
    const rowWidth = width - padding * 2;
    const titleHeight = 10;

    const measuredRows = rows.map((row) => ({
      ...row,
      lines: splitText(row.value || "-", rowWidth, 10.2, "bold"),
    }));

    let height = titleHeight + padding + 1;
    for (const row of measuredRows) {
      height += 4 + row.lines.length * 4.8 + 3;
    }
    height += padding - 1;

    ensureSpace(height + 2);

    setDrawColor(COLORS.border);
    setFillColor(COLORS.white);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 4, 4, "FD");

    setFillColor(COLORS.soft);
    doc.roundedRect(x, y, width, titleHeight, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setTextColor(COLORS.navy);
    doc.text(title, x + padding, y + 6.3);

    let currentY = y + titleHeight + 5;
    measuredRows.forEach((row, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.2);
      setTextColor(COLORS.muted);
      doc.text(row.label.toUpperCase(), x + padding, currentY);
      currentY += 4.2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      setTextColor(COLORS.ink);
      doc.text(row.lines, x + padding, currentY);
      currentY += row.lines.length * 4.8 + 2;

      if (index < measuredRows.length - 1) {
        setDrawColor(COLORS.border);
        doc.setLineWidth(0.2);
        doc.line(x + padding, currentY, x + width - padding, currentY);
        currentY += 3;
      }
    });

    y += height + 4;
  };

  const addMetricGrid = (items: Array<{ label: string; value: string }>) => {
    const gap = 4;
    const columns = 2;
    const cardWidth = (contentWidth - gap) / columns;

    for (let index = 0; index < items.length; index += columns) {
      const row = items.slice(index, index + columns);
      const measured = row.map((item) => ({
        ...item,
        lines: splitText(item.value || "-", cardWidth - 10, 11, "bold"),
      }));
      const rowHeight = Math.max(...measured.map((item) => 13 + item.lines.length * 5.2));

      ensureSpace(rowHeight + 1);

      measured.forEach((item, itemIndex) => {
        const cardX = margin + itemIndex * (cardWidth + gap);

        setDrawColor(COLORS.border);
        setFillColor(COLORS.soft);
        doc.setLineWidth(0.25);
        doc.roundedRect(cardX, y, cardWidth, rowHeight, 4, 4, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.2);
        setTextColor(COLORS.muted);
        doc.text(item.label.toUpperCase(), cardX + 5, y + 6);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setTextColor(COLORS.ink);
        doc.text(item.lines, cardX + 5, y + 12);
      });

      y += rowHeight + gap;
    }
  };

  const addClause = (index: number, title: string, text: string) => {
    const badgeSize = 9;
    const textX = margin + badgeSize + 5;
    const textWidth = contentWidth - badgeSize - 5;
    const titleLines = splitText(title, textWidth, 11, "bold");
    const bodyLines = splitText(text, textWidth, 10, "normal");
    const blockHeight = Math.max(badgeSize, titleLines.length * 5 + bodyLines.length * 4.8 + 3) + 4;

    ensureSpace(blockHeight + 2);

    setFillColor(COLORS.navy);
    doc.circle(margin + badgeSize / 2, y + 4.6, badgeSize / 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(COLORS.white);
    doc.text(String(index), margin + badgeSize / 2, y + 5.8, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setTextColor(COLORS.ink);
    doc.text(titleLines, textX, y + 2.5);

    const bodyStart = y + titleLines.length * 5 + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(COLORS.body);
    doc.text(bodyLines, textX, bodyStart);

    y += blockHeight + 2;
  };

  const addNoticeBox = (title: string, text: string) => {
    const padding = 5;
    const textWidth = contentWidth - padding * 2;
    const lines = splitText(text, textWidth, 9.4, "normal");
    const height = 10 + lines.length * 4.6 + 6;

    ensureSpace(height + 2);

    setFillColor(COLORS.warm);
    setDrawColor(COLORS.gold);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, y, contentWidth, height, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.6);
    setTextColor(COLORS.navy);
    doc.text(title, margin + padding, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.4);
    setTextColor(COLORS.body);
    doc.text(lines, margin + padding, y + 11);

    y += height + 5;
  };

  const addSignatureBoxes = () => {
    const boxGap = 6;
    const boxWidth = (contentWidth - boxGap) / 2;
    const boxHeight = 40;

    ensureSpace(boxHeight + 18);

    addWrappedText(`Fait a ${getSigningCity()}, le ${formatLongDate(payload.contractDate)}.`, {
      fontSize: 10.2,
      color: COLORS.body,
      spacingAfter: 4,
    });

    [
      {
        title: "Le locataire",
        subtitle: "Signature precedee de la mention Lu et approuve",
        name: payload.tenantName,
        x: margin,
      },
      {
        title: "L'agence / le mandataire",
        subtitle: "Signature et cachet de l'agence",
        name: AGENCY_INFO.name,
        x: margin + boxWidth + boxGap,
      },
    ].forEach((box) => {
      setDrawColor(COLORS.border);
      setFillColor(COLORS.white);
      doc.setLineWidth(0.3);
      doc.roundedRect(box.x, y, boxWidth, boxHeight, 4, 4, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      setTextColor(COLORS.navy);
      doc.text(box.title, box.x + 5, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.8);
      setTextColor(COLORS.muted);
      const subtitleLines = splitText(box.subtitle, boxWidth - 10, 8.8, "normal");
      doc.text(subtitleLines, box.x + 5, y + 12);

      const lineY = y + 28;
      setDrawColor(COLORS.border);
      doc.setLineWidth(0.25);
      doc.line(box.x + 5, lineY, box.x + boxWidth - 5, lineY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      setTextColor(COLORS.ink);
      doc.text(box.name, box.x + 5, lineY + 5.5);
    });

    y += boxHeight + 4;
  };

  setFillColor(COLORS.navy);
  doc.roundedRect(margin, y, contentWidth, 34, 6, 6, "F");

  if (logoDataUrl) {
    setFillColor(COLORS.white);
    doc.roundedRect(margin + 4, y + 4, 24, 24, 4, 4, "F");
    doc.addImage(logoDataUrl, "PNG", margin + 5.5, y + 5.5, 21, 21);
  }

  const agencyTextX = logoDataUrl ? margin + 33 : margin + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setTextColor(COLORS.white);
  doc.text(AGENCY_INFO.name, agencyTextX, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.4);
  doc.text([AGENCY_INFO.phone, AGENCY_INFO.secondaryPhone].join(" • "), agencyTextX, y + 17);
  doc.text(AGENCY_INFO.email, agencyTextX, y + 22.2);
  doc.text([AGENCY_INFO.addressLine1, AGENCY_INFO.addressLine2].join(" • "), agencyTextX, y + 27.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15.5);
  setTextColor(COLORS.white);
  doc.text("CONTRAT DE LOGEMENT", pageWidth - margin - 6, y + 12, { align: "right" });

  setFillColor(COLORS.gold);
  doc.roundedRect(pageWidth - margin - 68, y + 23, 62, 1.8, 1, 1, "F");

  y += 42;

  addNoticeBox(
    "Note importante",
    "Document genere pour preparation administrative. Les montants, dates, identites et clauses doivent etre verifies avant signature definitive.",
  );

  addMetricGrid([
    { label: "Reference", value: payload.contractReference },
    { label: "Date du contrat", value: formatLongDate(payload.contractDate) },
    { label: "Prise d'effet", value: formatLongDate(payload.startDate) },
    { label: "Duree initiale", value: formatDuration(payload.durationMonths) },
  ]);

  addSectionTitle("1. Identification des parties", "Les informations ci-dessous servent de base au contrat et doivent etre confirmees avant signature.");

  addInfoCard("Agence / bailleur mandataire", [
    { label: "Denomination", value: AGENCY_INFO.legalName },
    { label: "Representant", value: payload.representativeName },
    { label: "Telephone", value: `${AGENCY_INFO.phone} / ${AGENCY_INFO.secondaryPhone}` },
    { label: "Email", value: AGENCY_INFO.email },
    { label: "Adresse", value: `${AGENCY_INFO.addressLine1}, ${AGENCY_INFO.addressLine2}` },
  ]);

  addInfoCard("Locataire", [
    { label: "Nom complet", value: payload.tenantName },
    { label: "Sexe", value: formatSexLabel(payload.tenantSex) },
    { label: "Profession", value: formatProfessionLabel(payload.tenantProfession) },
    { label: "Nationalite", value: payload.tenantNationality || "Non renseignee" },
    { label: "Telephone", value: payload.tenantPhone || "Non renseigne" },
    { label: "Email", value: payload.tenantEmail || "Non renseigne" },
  ]);

  addSectionTitle("2. Logement et conditions contractuelles", "Le bien objet du contrat et les principales donnees economiques sont resumes ci-dessous.");

  addInfoCard("Bien pris en location", [
    { label: "Designation", value: payload.propertyTitle },
    { label: "Adresse", value: payload.propertyAddress },
    { label: "Destination", value: "Usage d'habitation" },
  ]);

  addMetricGrid([
    { label: "Loyer", value: formatMoney(payload.monthlyRent) },
    { label: "Depot de garantie", value: formatMoney(payload.securityDeposit) },
    { label: "Frequence", value: formatPaymentFrequency(payload.paymentFrequency) },
    { label: "Prise d'effet", value: formatLongDate(payload.startDate) },
  ]);

  addSectionTitle("3. Clauses essentielles");

  addClause(
    1,
    "Objet et designation du bien",
    `Le present contrat porte sur le logement relevant de la categorie \"${payload.propertyTitle}\", situe dans le quartier ${payload.propertyAddress}. Le bien est remis au locataire pour un usage exclusif d'habitation, sauf stipulation contraire signee par les parties.`
  );

  addClause(
    2,
    "Duree et entree en jouissance",
    `Le contrat prend effet le ${formatLongDate(payload.startDate)} pour une duree initiale de ${formatDuration(payload.durationMonths)}. Toute reconduction, prorogation ou resiliation anticipee doit etre formalisee par ecrit.`
  );

  addClause(
    3,
    "Conditions financieres",
    "Les conditions financieres du present contrat sont arretees comme suit et doivent etre confirmees avant signature definitive."
  );

  addInfoCard("Synthese financiere", [
    {
      label: "Loyer convenu",
      value: `${formatMoney(payload.monthlyRent)} (${formatPaymentFrequency(payload.paymentFrequency).toLowerCase()})`,
    },
    { label: "Depot de garantie", value: formatMoney(payload.securityDeposit) },
    { label: "Periodicite de paiement", value: formatPaymentFrequency(payload.paymentFrequency) },
    {
      label: "Reglement",
      value: "Les sommes dues sont reglees a l'echeance convenue entre les parties, sur presentation des justificatifs utiles.",
    },
  ]);

  addWrappedText(
    "Tout retard, ajustement ou modalite complementaire de paiement doit etre encadre par ecrit entre les parties avant execution du contrat.",
    { fontSize: 9.8, color: COLORS.body, spacingAfter: 4 }
  );

  addClause(
    4,
    "Usage, entretien et obligations",
    `Le locataire, ${formatSexLabel(payload.tenantSex).toLowerCase()}, de profession ${formatProfessionLabel(payload.tenantProfession).toLowerCase()}, s'engage a jouir paisiblement des lieux, a respecter le voisinage, a conserver le logement en bon etat d'usage courant et a signaler sans delai toute anomalie importante. L'agence ou le bailleur mandataire s'engage a assurer le suivi administratif du dossier et la remise d'un logement exploitable.`
  );

  addClause(
    5,
    "Etat des lieux et restitution",
    "Un etat des lieux d'entree et, le cas echeant, un inventaire des equipements doivent etre etablis. Lors de la restitution des lieux, l'etat du bien, les cles remises et les obligations restant dues serviront de base a la cloture du dossier." 
  );

  if (payload.specialClauses?.trim()) {
    addSectionTitle("4. Clauses particulieres");
    addWrappedText(payload.specialClauses.trim(), {
      fontSize: 10,
      lineHeight: 4.8,
      color: COLORS.body,
      spacingAfter: 5,
    });
  }

  addSectionTitle("5. Validation et signatures");
  addWrappedText(
    "Le present document est etabli pour formalisation contractuelle. Les parties declarent avoir pris connaissance des informations renseignees et s'engagent a les confirmer avant execution du contrat.",
    { fontSize: 10, color: COLORS.body, spacingAfter: 5 }
  );

  addSignatureBoxes();

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setDrawColor(COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTextColor(COLORS.muted);
    doc.text(`${AGENCY_INFO.name} • ${AGENCY_INFO.phone} • ${AGENCY_INFO.email}`, margin, pageHeight - 7);
    doc.text(`Ref. ${payload.contractReference} • Page ${page}/${pageCount}`, pageWidth - margin, pageHeight - 7, {
      align: "right",
    });
  }

  doc.save(`contrat-logement-${slugify(payload.tenantName || "client")}.pdf`);
}
