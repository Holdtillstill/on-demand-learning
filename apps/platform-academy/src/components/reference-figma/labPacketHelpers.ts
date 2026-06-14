import { downloadMarkdownFile } from './interviewHelpers';

type ReferenceLabPacket = {
  slug: string;
  title: string;
  track: string;
  level: string;
  duration: number;
  scenario: string;
  skills: string[];
  validationCommands: string[];
  expectedEvidence: string[];
  checklist: { text: string }[];
  relatedResources: { title: string }[];
};

export type LabPacketDownloadResult = {
  markdown: string;
  sourceUrl: string;
  error?: string;
};

export function labPacketFilename(lab: ReferenceLabPacket) {
  return `${lab.slug}-lab-packet.md`;
}

export async function downloadReferenceLabPacket(lab: ReferenceLabPacket, sourceUrl: string): Promise<LabPacketDownloadResult> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const markdown = await response.text();
    downloadMarkdownFile(labPacketFilename(lab), markdown);
    return { markdown, sourceUrl };
  } catch (error) {
    const markdown = buildFallbackLabPacket(lab);
    downloadMarkdownFile(labPacketFilename(lab), markdown);
    return {
      markdown,
      sourceUrl,
      error: error instanceof Error ? error.message : 'Packet source unavailable',
    };
  }
}

function buildFallbackLabPacket(lab: ReferenceLabPacket) {
  return [
    `# ${lab.title}`,
    '',
    `Track: ${lab.track}`,
    `Level: ${lab.level}`,
    `Estimated time: ${lab.duration} minutes`,
    '',
    '## Scenario',
    '',
    lab.scenario,
    '',
    '## Checklist',
    '',
    ...lab.checklist.map((item) => `- [ ] ${item.text}`),
    '',
    '## Validation commands',
    '',
    ...lab.validationCommands.map((command) => `\`\`\`bash\n${command}\n\`\`\``),
    '',
    '## Expected evidence',
    '',
    ...lab.expectedEvidence.map((item) => `- ${item}`),
    '',
    '## Skills',
    '',
    lab.skills.map((skill) => `- ${skill}`).join('\n'),
    '',
    '## Related resources',
    '',
    ...lab.relatedResources.map((resource) => `- ${resource.title}`),
  ].join('\n');
}
